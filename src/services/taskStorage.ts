import type {
  Task,
  TaskChecklistItem,
  TaskNotification,
} from "../types/task";
import { MOCK_NOTIFICATIONS } from "../mocks/workflowSeed";
import { seedTasksPartA, TASK_STAFF_DIRECTORY, taskIsoOffset } from "./taskSeedDataA";
import { seedTasksPartB } from "./taskSeedDataB";

export { TASK_STAFF_DIRECTORY, taskIsoOffset };

export const TASK_STORAGE_KEY = "iqc_tasks_enterprise_v1";
export const TASK_NOTIFICATIONS_KEY = "iqc_task_notifications_v1";

export const defaultTasksSeed: Task[] = [
  ...seedTasksPartA,
  ...seedTasksPartB,
];

const defaultNotificationsSeed: TaskNotification[] = [
  {
    id: "tn-1",
    taskId: "TASK-002",
    taskCode: "CV-2026-0002",
    type: "due_soon",
    title: "Sắp đến hạn trong 24 giờ",
    message: "CV-2026-0002: Gia công phay tinh 50 bộ Thân vỏ van điều áp DN50 sắp đến hạn hôm nay 18:00.",
    recipientId: "u6",
    recipientName: "Nguyễn Văn Thắng (Thợ CNC 5/7)",
    isRead: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "tn-2",
    taskId: "TASK-006",
    taskCode: "CV-2026-0006",
    type: "returned",
    title: "Công việc bị trả lại cần bổ sung",
    message: "CV-2026-0006 bị Quản đốc Lê Minh Hoàng trả lại: Cần bổ sung ảnh đo panme điện tử cho 5 mẫu ngẫu nhiên.",
    recipientId: "u7",
    recipientName: "Trần Đình Trọng (Thợ Tiện 4/7)",
    isRead: false,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "tn-3",
    taskId: "TASK-004",
    taskCode: "CV-2026-0004",
    type: "assigned",
    title: "Chờ phê duyệt hoàn thành",
    message: "CV-2026-0004: KCS Nguyễn Thị Mai đã gửi báo cáo CMM chờ duyệt.",
    recipientId: "u1",
    recipientName: "Trần Quốc Bảo (Giám đốc SX)",
    isRead: false,
    createdAt: new Date(Date.now() - 1800_000).toISOString(),
  },
];

export function loadTasksData(): Task[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(defaultTasksSeed)) as Task[];
      saveTasksData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = JSON.parse(JSON.stringify(defaultTasksSeed)) as Task[];
      saveTasksData(initial);
      return initial;
    }
    return parsed as Task[];
  } catch (err) {
    console.error("Lỗi đọc dữ liệu công việc từ localStorage:", err);
    return JSON.parse(JSON.stringify(defaultTasksSeed)) as Task[];
  }
}

export function saveTasksData(tasks: Task[]): boolean {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (err) {
    console.error("Lỗi ghi dữ liệu công việc vào localStorage:", err);
    return false;
  }
}

export function resetTasksData(): Task[] {
  const initial = JSON.parse(JSON.stringify(defaultTasksSeed)) as Task[];
  saveTasksData(initial);
  localStorage.setItem(TASK_NOTIFICATIONS_KEY, JSON.stringify(defaultNotificationsSeed));
  return initial;
}

export function loadTaskNotifications(): TaskNotification[] {
  try {
    const raw = localStorage.getItem(TASK_NOTIFICATIONS_KEY);
    if (!raw) {
      localStorage.setItem(TASK_NOTIFICATIONS_KEY, JSON.stringify(defaultNotificationsSeed));
      return JSON.parse(JSON.stringify(defaultNotificationsSeed));
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTaskNotifications(list: TaskNotification[]): void {
  try {
    localStorage.setItem(TASK_NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function pushTaskNotification(
  payload: Omit<TaskNotification, "id" | "isRead" | "createdAt">,
): TaskNotification {
  const current = loadTaskNotifications();
  const created: TaskNotification = {
    ...payload,
    id: `tn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  const next = [created, ...current].slice(0, 40);
  saveTaskNotifications(next);

  // Đồng bộ vào chuông thông báo hệ thống MOCK_NOTIFICATIONS
  MOCK_NOTIFICATIONS.unshift({
    id: created.id,
    userId: payload.recipientId || "u1",
    type: "order",
    refId: payload.taskId,
    refType: "production_order",
    title: payload.title,
    body: payload.message,
    isRead: false,
    createdAt: created.createdAt,
  });

  return created;
}

export function isTaskOverdue(task: Task): boolean {
  if (task.status === "completed") return false;
  if (!task.dueDate) return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

export function isTaskDueSoon(task: Task): boolean {
  if (task.status === "completed") return false;
  if (!task.dueDate) return false;
  const diffMs = new Date(task.dueDate).getTime() - Date.now();
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000;
}

export function calculateChecklistProgress(
  checklist: TaskChecklistItem[],
  fallbackProgress = 0,
): number {
  if (!checklist || checklist.length === 0) return fallbackProgress;
  const done = checklist.filter((item) => item.completed).length;
  return Math.round((done / checklist.length) * 100);
}

export function generateNextTaskCode(tasks: Task[]): string {
  const year = new Date().getFullYear();
  const maxNum = tasks.reduce((max, t) => {
    const match = t.code.match(/CV-\d{4}-(\d+)/);
    const num = match ? parseInt(match[1], 10) : 0;
    return num > max ? num : max;
  }, 0);
  return `CV-${year}-${String(maxNum + 1).padStart(4, "0")}`;
}

