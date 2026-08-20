/** Shared domain types — used by both frontend and backend */

export type Role =
  | "director"
  | "supervisor"
  | "teamlead"
  | "worker"
  | "qc"
  | "stats"
  | "admin";

export type OrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "in_progress"
  | "completed";

export type BOMStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "team_reported"
  | "qc_passed"
  | "qc_failed";

export type Priority = "normal" | "high" | "urgent";

export interface IEntity {
  id: string;
}

export interface User extends IEntity {
  employeeId: string;
  name: string;
  password: string;
  role: Role;
  teamId: string;
  department: string;
  phone: string;
  active: boolean;
}

export type UserPublic = Omit<User, "password">;

export interface Attachment extends IEntity {
  name: string;
  type: "pdf" | "image" | "cad" | "excel" | "word" | "other";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  /** Data URL hoặc URL xem trực tiếp (ảnh / PDF) */
  url?: string;
}

export interface DimensionRow {
  tt: number;
  dims: string[];
  ngoaiQuan: string;
}

export interface WorkerEntry extends IEntity {
  workerId: string;
  workerName: string;
  submittedAt: string;
  rows: DimensionRow[];
}

export interface TeamSummary {
  passQty: number;
  failQty: number;
  note: string;
  reportedBy: string;
  reportedAt: string;
}

export interface QCReport {
  passQty: number;
  failQty: number;
  complaint: string;
  status: "pending" | "approved" | "rejected";
  inspectedBy: string;
  inspectedAt: string;
}

export type WorkShift = "day" | "night" | "ot";

export interface BOMItem extends IEntity {
  bomCode: string;
  partCode: string;
  partName: string;
  rawMaterial: string;
  machine: string;
  process: string;
  /** Ca làm việc do GĐ giao */
  shift?: WorkShift | string;
  /** Định mức sản xuất (vd: 80 SP/h) */
  quota?: string;
  /** Thời gian làm theo lệnh (vd: 8h, 07:00–15:00) */
  workTime?: string;
  targetQty: number;
  passQty: number;
  failQty: number;
  assignedTeamId: string;
  assignedTeamName: string;
  assignedWorkers: string[];
  status: BOMStatus;
  specCols: string[];
  /** Thông số chi tiết (GĐ đề ra) — tự sinh từ specCols nếu thiếu */
  materialSpecs?: import("./spec.js").MaterialSpec[];
  techNote: string;
  workerEntries: WorkerEntry[];
  /** File thông số & bản vẽ riêng cho từng BOM */
  attachments?: Attachment[];
  teamSummary?: TeamSummary;
  qcReport?: QCReport;
}

export interface ProductionOrder extends IEntity {
  orderNo: string;
  /** Mã sản phẩm */
  productCode?: string;
  productLine: string;
  customer: string;
  /** Tổng số lượng cần sản xuất theo lệnh */
  targetQty: number;
  shift?: WorkShift | string;
  quota?: string;
  workTime?: string;
  createdBy: string;
  createdAt: string;
  deadline: string;
  priority: Priority;
  status: OrderStatus;
  boms: BOMItem[];
  attachments: Attachment[];
  pendingApproval?: boolean;
}

export interface OrderListQuery {
  from?: string;
  to?: string;
  dateField?: "created_at" | "deadline";
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedOrders {
  items: ProductionOrder[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Team extends IEntity {
  name: string;
  lead: string;
  leadShort: string;
}

// ── Workflow types ────────────────────────────────────────────────────────────

export type IncidentStatus = "open" | "assigned" | "in_progress" | "resolved" | "closed";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type OvertimeStatus = "pending" | "approved" | "rejected" | "completed";
export type ComplaintStatus = "open" | "acknowledged" | "rework" | "resolved" | "closed";

export interface MachineIncident extends IEntity {
  bomId?: string;
  orderId?: string;
  machineName: string;
  machineCode: string;
  severity: IncidentSeverity;
  description: string;
  reportedBy: string;
  reportedName: string;
  reportedAt: string;
  status: IncidentStatus;
  assignedTo?: string;
  assignedName?: string;
  assignedAt?: string;
  resolvedBy?: string;
  resolvedName?: string;
  resolvedAt?: string;
  resolutionNote: string;
  supervisorConfirmedBy?: string;
  supervisorConfirmedAt?: string;
  downtimeMinutes: number;
}

export interface OvertimeRequest extends IEntity {
  bomId?: string;
  orderId?: string;
  requestedBy: string;
  requestedName: string;
  requestedAt: string;
  reason: string;
  proposedDate: string;
  proposedHours: number;
  workerIds: string[];
  workerNames: string[];
  status: OvertimeStatus;
  supervisorId?: string;
  supervisorNote: string;
  supervisorAt?: string;
  directorId?: string;
  directorNote: string;
  directorAt?: string;
  actualHours?: number;
}

export interface QCComplaint extends IEntity {
  bomId: string;
  orderId: string;
  defectType: string;
  defectDescription: string;
  defectQty: number;
  sampleTt: number[];
  attachments: { name: string; url: string; type: string }[];
  raisedBy: string;
  raisedName: string;
  raisedAt: string;
  status: ComplaintStatus;
  acknowledgedBy?: string;
  acknowledgedName?: string;
  acknowledgedAt?: string;
  actionType?: "rework" | "scrap" | "accept_as_is";
  actionNote: string;
  actionBy?: string;
  actionName?: string;
  actionAt?: string;
  reworkQty?: number;
  scrapQty?: number;
  qcRecheckBy?: string;
  qcRecheckName?: string;
  qcRecheckAt?: string;
  qcRecheckResult?: "passed" | "failed_again";
  qcRecheckNote: string;
  closedBy?: string;
  closedAt?: string;
}

export interface ProductionStat extends IEntity {
  orderId: string;
  bomId: string;
  statDate: string;
  shift: "day" | "night";
  recordedBy: string;
  recordedName: string;
  recordedAt: string;
  qtyProduced: number;
  qtyPass: number;
  qtyFail: number;
  qtyRework: number;
  downtimeMins: number;
  note: string;
}

export interface OrderAuditLog extends IEntity {
  orderId: string;
  bomId?: string;
  action: string;
  actorId: string;
  actorName: string;
  oldStatus?: string;
  newStatus?: string;
  note: string;
  createdAt: string;
}

export interface Notification extends IEntity {
  userId: string;
  type: "incident" | "overtime" | "complaint" | "order" | "device";
  refId?: string;
  refType?: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export type DeviceKind = "mobile" | "desktop";
export type DeviceApprovalStatus = "pending" | "approved" | "rejected";

export interface DeviceLoginRequest {
  id: string;
  userId: string;
  employeeId: string;
  userName: string;
  deviceId: string;
  ip: string;
  userAgent: string;
  status: DeviceApprovalStatus;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface LoginRequest {
  employeeId: string;
  password: string;
  deviceId?: string;
  deviceKind?: DeviceKind;
  userAgent?: string;
}

export interface LoginResponse {
  user: UserPublic;
  token: string;
  status?: "ok" | "pending_device";
  requestId?: string;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
