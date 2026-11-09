export type TaskStatus = "todo" | "in_progress" | "pending_review" | "completed";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskCategory =
  | "Vận hành"
  | "Bảo trì"
  | "Kiểm tra chất lượng"
  | "Kho"
  | "Vận chuyển";

export type TaskRecurrence = "none" | "daily_shift" | "weekly" | "monthly";

export type TaskWorkshop =
  | "Xưởng Cơ khí 1"
  | "Xưởng Cơ khí 2"
  | "Xưởng Dập & Hàn"
  | "Xưởng Đúc & Ép"
  | "Phòng Kiểm tra QC"
  | "Kho Trung tâm & Logistics";

export interface TaskChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  sizeKb: number;
  type: "image" | "document";
  dataUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromValue?: string;
  toValue?: string;
  note?: string;
  timestamp: string;
}

export interface Task {
  id: string;
  /** Mã công việc chuẩn CV-YYYY-XXXX */
  code: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  workshop: TaskWorkshop;
  line?: string;
  /** Liên kết Lệnh sản xuất (LX-...) */
  orderCode?: string;
  orderName?: string;
  /** Liên kết Máy móc */
  machineCode?: string;
  machineName?: string;
  /** Liên kết Kho */
  warehouseCode?: string;
  warehouseName?: string;
  /** Người giao việc */
  assignerId: string;
  assignerName: string;
  /** Người nhận / phụ trách */
  assigneeId: string;
  assigneeName: string;
  assigneeRole: string;
  /** Hạn hoàn thành (ISO string YYYY-MM-DDTHH:mm) */
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  /** Thời gian ước tính so với thực tế (giờ) */
  estimatedHours: number;
  actualHours: number;
  /** Tiến độ % (0 - 100), tự động tính theo checklist nếu có */
  progress: number;
  /** Chu kỳ lặp lại */
  recurrence: TaskRecurrence;
  recurrenceLabel?: string;
  /** Lý do bị trả lại (nếu có) */
  returnReason?: string;
  checklist: TaskChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  history: TaskHistory[];
}

export interface TaskNotification {
  id: string;
  taskId: string;
  taskCode: string;
  type: "assigned" | "due_soon" | "returned";
  title: string;
  message: string;
  recipientId: string;
  recipientName: string;
  isRead: boolean;
  createdAt: string;
}

export type TaskViewMode = "list" | "kanban" | "calendar";
export type TaskScopeTab = "all" | "mine";
export type TaskDateRangeFilter = "all" | "today" | "week" | "month" | "overdue";
export type TaskKpiFilter = "all" | TaskStatus | "overdue";

export interface TaskFilterOptions {
  search: string;
  scope: TaskScopeTab;
  kpiStatus: TaskKpiFilter;
  assigneeId: string | "all";
  workshop: TaskWorkshop | "all";
  priority: TaskPriority | "all";
  category: TaskCategory | "all";
  dateRange: TaskDateRangeFilter;
}

