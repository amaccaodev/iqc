import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  Task,
  TaskAttachment,
  TaskCategory,
  TaskFilterOptions,
  TaskNotification,
  TaskStatus,
  TaskViewMode,
  TaskWorkshop,
} from "../types/task";
import {
  generateNextTaskCode,
  isTaskDueSoon,
  isTaskOverdue,
  loadTaskNotifications,
  loadTasksData,
  pushTaskNotification,
  resetTasksData,
  saveTaskNotifications,
  saveTasksData,
  TASK_STAFF_DIRECTORY,
} from "../services/taskStorage";
import {
  applyAddAttachment,
  applyAddChecklist,
  applyAddComment,
  applyChecklistToggle,
  applyStatusChange,
  buildSavedTask,
} from "../services/taskActions";
import type { TaskFormSubmitPayload } from "../components/tasks/TaskForm";
import { loadMachinesData, saveMachinesData } from "../services/machineStorage";
import { MOCK_INCIDENTS } from "../mocks/workflowSeed";
import { useOptionalAuth } from "./useAuth";
import { useNotifications } from "./useNotifications";
import { toast } from "./useToast";
import { TASK_STATUS_META } from "../components/tasks/TaskIcons";

const ALL_CATEGORIES: TaskCategory[] = ["Vận hành", "Bảo trì", "Kiểm tra chất lượng", "Kho", "Vận chuyển"];
const ALL_WORKSHOPS: TaskWorkshop[] = ["Xưởng Cơ khí 1", "Xưởng Cơ khí 2", "Xưởng Dập & Hàn", "Xưởng Đúc & Ép", "Phòng Kiểm tra QC", "Kho Trung tâm & Logistics"];

export function useTaskManagement() {
  const navigate = useNavigate();
  const auth = useOptionalAuth();
  const { refreshUnread } = useNotifications();

  const [activeStaffId, setActiveStaffId] = useState<string>(() => {
    const matched = TASK_STAFF_DIRECTORY.find((s) => s.id === auth?.user?.id);
    return matched ? matched.id : "u1";
  });

  const activePersona = useMemo(
    () => TASK_STAFF_DIRECTORY.find((s) => s.id === activeStaffId) || TASK_STAFF_DIRECTORY[0],
    [activeStaffId],
  );

  const isManager = ["director", "supervisor", "teamlead"].includes(activePersona.roleCode);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<TaskViewMode>("list");

  const [filters, setFilters] = useState<TaskFilterOptions>({
    search: "",
    scope: "all",
    kpiStatus: "all",
    assigneeId: "all",
    workshop: "all",
    priority: "all",
    category: "all",
    dateRange: "all",
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [incidentModalTask, setIncidentModalTask] = useState<Task | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadTasksData();
      setTasks(loaded);
      const loadedNotifs = loadTaskNotifications();
      for (const t of loaded) {
        if (isTaskDueSoon(t) && !loadedNotifs.some((n) => n.taskId === t.id && n.type === "due_soon")) {
          pushTaskNotification({
            taskId: t.id,
            taskCode: t.code,
            type: "due_soon",
            title: "Công việc sắp đến hạn (< 24 giờ)",
            message: `${t.code}: "${t.title}" cần hoàn thành trước ${new Date(t.dueDate).toLocaleString("vi-VN")}.`,
            recipientId: t.assigneeId,
            recipientName: t.assigneeName,
          });
        }
      }
      setNotifications(loadTaskNotifications());
      setLoading(false);
    }, 220);
    return () => window.clearTimeout(timer);
  }, []);

  const scopeBaseTasks = useMemo(() => {
    if (!isManager || filters.scope === "mine") {
      return tasks.filter((t) => t.assigneeId === activePersona.id);
    }
    return tasks;
  }, [tasks, isManager, filters.scope, activePersona.id]);

  const myTaskCount = useMemo(
    () => tasks.filter((t) => t.assigneeId === activePersona.id).length,
    [tasks, activePersona.id],
  );

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return scopeBaseTasks.filter((t) => {
      if (filters.kpiStatus === "overdue") {
        if (!isTaskOverdue(t)) return false;
      } else if (filters.kpiStatus !== "all" && t.status !== filters.kpiStatus) {
        return false;
      }
      if (filters.assigneeId !== "all" && t.assigneeId !== filters.assigneeId) return false;
      if (filters.workshop !== "all" && t.workshop !== filters.workshop) return false;
      if (filters.priority !== "all" && t.priority !== filters.priority) return false;
      if (filters.category !== "all" && t.category !== filters.category) return false;

      if (filters.dateRange === "today" && t.dueDate.slice(0, 10) !== todayStr) return false;
      if (filters.dateRange === "overdue" && !isTaskOverdue(t)) return false;
      if (filters.dateRange === "week") {
        const diffDays = (new Date(t.dueDate).getTime() - now.getTime()) / 86400_000;
        if (diffDays < -7 || diffDays > 7) return false;
      }
      if (filters.dateRange === "month") {
        const d = new Date(t.dueDate);
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }

      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const haystack = [t.code, t.title, t.description, t.orderCode, t.machineCode, t.warehouseCode, t.assigneeName, t.workshop]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [scopeBaseTasks, filters]);

  const syncTasks = (nextList: Task[], updatedTask?: Task) => {
    setTasks(nextList);
    saveTasksData(nextList);
    if (updatedTask && selectedTask?.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleSaveTask = (payload: TaskFormSubmitPayload) => {
    const { nextList, savedTask, assignee } = buildSavedTask(tasks, editingTask, payload, activePersona);
    syncTasks(nextList, savedTask);
    pushTaskNotification({
      taskId: savedTask.id,
      taskCode: savedTask.code,
      type: "assigned",
      title: editingTask ? "Cập nhật phân công / hạn công việc" : "Bạn được giao công việc mới",
      message: `${savedTask.code}: "${savedTask.title}" — Phụ trách: ${assignee.name}.`,
      recipientId: assignee.id,
      recipientName: assignee.name,
    });
    setNotifications(loadTaskNotifications());
    void refreshUnread();
    toast.success(`Đã lưu ${savedTask.code} và gửi thông báo cho ${assignee.name}!`);
  };

  const handleChangeStatus = (taskId: string, nextStatus: TaskStatus, returnReason?: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target || target.status === nextStatus) return;

    const updated = applyStatusChange(target, nextStatus, activePersona, returnReason);
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);

    if (returnReason) {
      pushTaskNotification({
        taskId: updated.id,
        taskCode: updated.code,
        type: "returned",
        title: "Công việc bị trả lại",
        message: `${updated.code} bị trả lại bởi ${activePersona.name}: "${returnReason}"`,
        recipientId: updated.assigneeId,
        recipientName: updated.assigneeName,
      });
      setNotifications(loadTaskNotifications());
      void refreshUnread();
      toast.warning(`Đã trả lại công việc ${updated.code} kèm thông báo!`);
    } else {
      toast.info(`Đã chuyển ${updated.code} sang "${TASK_STATUS_META[nextStatus].label}"`);
    }
  };

  const handleToggleChecklist = (taskId: string, itemId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated = applyChecklistToggle(target, itemId, activePersona.name);
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
  };

  const handleAddChecklistItem = (taskId: string, title: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated = applyAddChecklist(target, title);
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
  };

  const handleUpdateActualHours = (taskId: string, actualHours: number) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated: Task = { ...target, actualHours };
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
  };

  const handleAddAttachment = (taskId: string, file: Omit<TaskAttachment, "id" | "uploadedBy" | "uploadedAt">) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated = applyAddAttachment(target, file, activePersona.name);
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
    toast.success(`Đã đính kèm tệp "${file.name}"`);
  };

  const handleRemoveAttachment = (taskId: string, attachmentId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated: Task = { ...target, attachments: target.attachments.filter((a) => a.id !== attachmentId) };
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
  };

  const handleAddComment = (taskId: string, content: string) => {
    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;
    const updated = applyAddComment(target, content, activePersona);
    syncTasks(tasks.map((t) => (t.id === taskId ? updated : t)), updated);
  };

  const handleSubmitQuickIncident = (
    task: Task,
    machineCode: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string,
    goToIncidentsTab: boolean,
  ) => {
    MOCK_INCIDENTS.unshift({
      id: `inc-${Date.now()}`,
      orderId: task.orderCode || "o1",
      machineName: task.machineName || machineCode,
      machineCode,
      severity,
      description: `[Từ ${task.code}] ${description}`,
      reportedBy: activePersona.id,
      reportedName: activePersona.name,
      reportedAt: new Date().toISOString(),
      status: "open",
      resolutionNote: "",
      downtimeMinutes: 0,
    });
    const machines = loadMachinesData();
    saveMachinesData(machines.map((m) => (m.code.toLowerCase() === machineCode.toLowerCase() ? { ...m, status: "broken" as const } : m)));
    toast.error(`Đã phát cảnh báo báo hỏng máy ${machineCode}!`);
    if (goToIncidentsTab) navigate("/director/incidents");
  };

  const handleSelectNotification = (notif: TaskNotification) => {
    const nextNotifs = notifications.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n));
    setNotifications(nextNotifs);
    saveTaskNotifications(nextNotifs);
    const found = tasks.find((t) => t.id === notif.taskId || t.code === notif.taskCode);
    if (found) setSelectedTask(found);
  };

  const handleMarkAllNotificationsRead = () => {
    const nextNotifs = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(nextNotifs);
    saveTaskNotifications(nextNotifs);
  };

  const handleResetDemo = () => {
    setTasks(resetTasksData());
    setNotifications(loadTaskNotifications());
    setSelectedTask(null);
    toast.info("Đã khôi phục 20 công việc mẫu ban đầu!");
  };

  return {
    staffList: TASK_STAFF_DIRECTORY, workshops: ALL_WORKSHOPS, categories: ALL_CATEGORIES,
    activePersona, setActiveStaffId, isManager, tasks, scopeBaseTasks, filteredTasks,
    myTaskCount, allTaskCount: tasks.length, notifications, loading, viewMode, setViewMode,
    filters, setFilters, selectedTask, setSelectedTask, isFormOpen, setIsFormOpen,
    editingTask, setEditingTask, incidentModalTask, setIncidentModalTask,
    nextTaskCode: generateNextTaskCode(tasks),
    handleSaveTask, handleChangeStatus, handleToggleChecklist, handleAddChecklistItem,
    handleUpdateActualHours, handleAddAttachment, handleRemoveAttachment, handleAddComment,
    handleSubmitQuickIncident, handleSelectNotification, handleMarkAllNotificationsRead, handleResetDemo,
  };
}
