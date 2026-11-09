import type {
  Task,
  TaskAttachment,
  TaskStatus,
} from "../types/task";
import type { StaffMember } from "./taskSeedDataA";
import type { TaskFormSubmitPayload } from "../components/tasks/TaskForm";
import {
  calculateChecklistProgress,
  generateNextTaskCode,
  TASK_STAFF_DIRECTORY,
} from "./taskStorage";
import { TASK_STATUS_META } from "../components/tasks/TaskIcons";

export function buildSavedTask(
  tasks: Task[],
  editingTask: Task | null,
  payload: TaskFormSubmitPayload,
  actor: StaffMember,
): { nextList: Task[]; savedTask: Task; assignee: StaffMember } {
  const assignee =
    TASK_STAFF_DIRECTORY.find((s) => s.id === payload.assigneeId) ||
    TASK_STAFF_DIRECTORY[2];
  const nowIso = new Date().toISOString();

  if (editingTask) {
    const updated: Task = {
      ...editingTask,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      priority: payload.priority,
      workshop: payload.workshop,
      line: payload.line,
      assigneeId: assignee.id,
      assigneeName: assignee.name,
      assigneeRole: assignee.role,
      dueDate: payload.dueDate,
      estimatedHours: payload.estimatedHours,
      orderCode: payload.orderCode,
      machineCode: payload.machineCode,
      warehouseCode: payload.warehouseCode,
      recurrence: payload.recurrence,
      recurrenceLabel: payload.recurrenceLabel,
      history: [
        {
          id: `h-${Date.now()}`,
          actorId: actor.id,
          actorName: actor.name,
          actorRole: actor.role,
          action: "Cập nhật / Giao lại công việc",
          toValue: `${assignee.name} (Hạn: ${new Date(payload.dueDate).toLocaleString("vi-VN")})`,
          timestamp: nowIso,
        },
        ...editingTask.history,
      ],
    };
    return {
      nextList: tasks.map((t) => (t.id === editingTask.id ? updated : t)),
      savedTask: updated,
      assignee,
    };
  }

  const code = generateNextTaskCode(tasks);
  const checklist = payload.checklistLines.map((line, idx) => ({
    id: `cl-${Date.now()}-${idx}`,
    title: line,
    completed: false,
  }));

  const created: Task = {
    id: `TASK-${Date.now()}`,
    code,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    priority: payload.priority,
    status: "todo",
    workshop: payload.workshop,
    line: payload.line,
    orderCode: payload.orderCode,
    machineCode: payload.machineCode,
    warehouseCode: payload.warehouseCode,
    assignerId: actor.id,
    assignerName: actor.name,
    assigneeId: assignee.id,
    assigneeName: assignee.name,
    assigneeRole: assignee.role,
    dueDate: payload.dueDate,
    createdAt: nowIso,
    estimatedHours: payload.estimatedHours,
    actualHours: 0,
    progress: 0,
    recurrence: payload.recurrence,
    recurrenceLabel: payload.recurrenceLabel,
    checklist,
    attachments: [],
    comments: [],
    history: [
      {
        id: `h-${Date.now()}`,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "Tạo & Giao công việc mới",
        toValue: assignee.name,
        timestamp: nowIso,
      },
    ],
  };

  return {
    nextList: [created, ...tasks],
    savedTask: created,
    assignee,
  };
}

export function applyStatusChange(
  target: Task,
  nextStatus: TaskStatus,
  actor: StaffMember,
  returnReason?: string,
): Task {
  const nowIso = new Date().toISOString();
  return {
    ...target,
    status: nextStatus,
    completedAt: nextStatus === "completed" ? nowIso : target.completedAt,
    progress: nextStatus === "completed" ? 100 : target.progress,
    returnReason: returnReason ?? (nextStatus === "completed" ? undefined : target.returnReason),
    history: [
      {
        id: `h-${Date.now()}`,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: returnReason ? "Trả lại yêu cầu làm lại" : "Đổi trạng thái",
        fromValue: TASK_STATUS_META[target.status].label,
        toValue: TASK_STATUS_META[nextStatus].label,
        note: returnReason,
        timestamp: nowIso,
      },
      ...target.history,
    ],
  };
}

export function applyChecklistToggle(target: Task, itemId: string, actorName: string): Task {
  const nextChecklist = target.checklist.map((c) =>
    c.id === itemId
      ? {
          ...c,
          completed: !c.completed,
          completedBy: actorName,
          completedAt: new Date().toISOString(),
        }
      : c,
  );
  return {
    ...target,
    checklist: nextChecklist,
    progress: calculateChecklistProgress(nextChecklist, target.progress),
  };
}

export function applyAddChecklist(target: Task, title: string): Task {
  const nextChecklist = [
    ...target.checklist,
    { id: `cl-${Date.now()}`, title, completed: false },
  ];
  return {
    ...target,
    checklist: nextChecklist,
    progress: calculateChecklistProgress(nextChecklist, target.progress),
  };
}

export function applyAddAttachment(
  target: Task,
  file: Omit<TaskAttachment, "id" | "uploadedBy" | "uploadedAt">,
  actorName: string,
): Task {
  const att: TaskAttachment = {
    ...file,
    id: `att-${Date.now()}`,
    uploadedBy: actorName,
    uploadedAt: new Date().toISOString(),
  };
  return { ...target, attachments: [att, ...target.attachments] };
}

export function applyAddComment(target: Task, content: string, actor: StaffMember): Task {
  return {
    ...target,
    comments: [
      {
        id: `cm-${Date.now()}`,
        authorId: actor.id,
        authorName: actor.name,
        authorRole: actor.role,
        content,
        createdAt: new Date().toISOString(),
      },
      ...target.comments,
    ],
  };
}

