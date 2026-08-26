/** Shared domain types — used by both frontend and backend */

export type Role =
  | "director"
  | "supervisor"
  | "teamlead"
  | "worker"
  | "qc"
  | "stats"
  | "admin"
  | "mechanic";

export type ProcessStage = "hot_forge" | "auto" | "assembly";

/** Một nguyên công / quy trình gia công của linh kiện (ĐMKT sheet Mẫu van) */
export interface SemiProcessStep {
  /** Thứ tự tuần tự trong linh kiện (1, 2, 3…) */
  seq: number;
  /** Tên nguyên công, vd: "1: Cắt Phôi" */
  process: string;
  machine?: string;
  processStage?: ProcessStage;
  /** Mã tổ ĐMKT (CP, DẬP, TĐ…) */
  teamCode?: string;
  people?: number;
  techNote?: string;
  quota?: string;
  /** Checklist đo kiểm riêng của nguyên công (nếu khác linh kiện) */
  checklist?: import("./spec.js").PartChecklistItem[];
}

export interface Product extends IEntity {
  code: string;
  name: string;
  description: string;
  active: boolean;
  createdAt?: string;
  /** Bản vẽ / thông số kỹ thuật (có thể nhiều file, nội dung base64/webp trong DB) */
  attachments?: Attachment[];
}

export interface SemiProduct extends IEntity {
  code: string;
  name: string;
  processStage: ProcessStage;
  description: string;
  active: boolean;
  createdAt?: string;
  /** Bản vẽ / thông số kỹ thuật của linh kiện (nhiều file) */
  attachments?: Attachment[];
  /**
   * Quy trình gia công tuần tự (import từ Mẫu van).
   * Khi tạo lệnh SX: mỗi step → 1 BOM.
   */
  processSteps?: SemiProcessStep[];
  /**
   * Checklist đo kiểm đầy đủ của linh kiện (mỗi LK khác nhau).
   * Khi tạo lệnh: copy nguyên sang BOM.materialSpecs — không chọn lẻ.
   */
  checklist?: import("./spec.js").PartChecklistItem[];
}

export interface ProductBomLine extends IEntity {
  productId: string;
  semiProductId: string;
  qtyPerUnit: number;
  /** Joined */
  semiProduct?: SemiProduct;
  stockQty?: number;
}

export interface WarehouseStock {
  semiProductId: string;
  qty: number;
  updatedAt?: string;
}

export interface WarehouseMovement extends IEntity {
  semiProductId: string;
  delta: number;
  qtyAfter: number;
  note?: string;
  createdBy?: string;
  createdAt: string;
}

export interface MachineParam {
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  target?: number;
}

export interface Machine extends IEntity {
  code: string;
  name: string;
  params: MachineParam[];
  active: boolean;
  /** Khu vực / vị trí máy trên xưởng (vd: "Khu Dập nóng A1") */
  location?: string;
  /** Tổ sở hữu / khu vực máy — liên kết TEAMS (t_hot / t_auto / t_asm) */
  teamId?: string;
  createdAt?: string;
}

export type ChangeRequestTarget = "teamlead" | "mechanic";
export type ChangeRequestStatus = "pending" | "approved" | "rejected";
/** Đề xuất máy: chỉ 3 loại — không dùng “xin phê duyệt” chung */
export type MachineChangeKind = "change_machine" | "add_machine" | "report_broken";

export interface MachineChangeRequest extends IEntity {
  orderId?: string;
  bomId?: string;
  requestedBy: string;
  requestedName: string;
  requestedAt: string;
  reason: string;
  /** Mặc định change_machine nếu thiếu (data cũ) */
  kind?: MachineChangeKind;
  target: ChangeRequestTarget;
  fromMachine: string;
  toMachine: string;
  status: ChangeRequestStatus;
  reviewedBy?: string;
  reviewedName?: string;
  reviewedAt?: string;
  reviewNote: string;
}

/** Payload Giám đốc tạo lệnh từ danh mục SP */
export interface CreateOrderFromProductRequest {
  productId: string;
  finishedQty: number;
  deadline: string;
  note?: string;
  priority?: Priority;
  customer?: string;
  shift?: WorkShift | string;
  /** Kích cỡ thành phẩm (vd DN15, DN20, Ø25) */
  size?: string;
  lines: Array<{
    semiProductId: string;
    produceQty: number;
    useFromStock: boolean;
    stockUseQty?: number;
  }>;
}

/** GĐ tạo nhiều lệnh SP cùng lúc */
export interface CreateOrdersBatchRequest {
  deadline: string;
  note?: string;
  priority?: Priority;
  customer?: string;
  items: CreateOrderFromProductRequest[];
}

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

/** Đơn giá lương NV × thành phẩm (VND / SP đạt) */
export interface EmployeeProductRate extends IEntity {
  userId: string;
  productId: string;
  rateVnd: number;
  updatedAt?: string;
}

export type ShiftCloseStatus =
  | "pending_teamlead"
  | "pending_qc"
  | "pending_supervisor"
  | "approved"
  | "rejected";

export interface ShiftClose extends IEntity {
  orderId: string;
  bomId: string;
  workerId: string;
  workerName: string;
  productId: string;
  productName: string;
  partName: string;
  passQty: number;
  failQty: number;
  note: string;
  status: ShiftCloseStatus;
  rateVnd: number;
  amountVnd: number;
  createdAt: string;
  teamleadBy?: string;
  teamleadAt?: string;
  qcBy?: string;
  qcAt?: string;
  supervisorBy?: string;
  supervisorAt?: string;
  rejectReason?: string;
}

export type ShiftUnlockStatus = "pending_teamlead" | "approved" | "rejected";

/** CN xin mở khóa để chốt ca tiếp trong cùng ngày — tổ trưởng duyệt */
export interface ShiftUnlockRequest extends IEntity {
  orderId: string;
  bomId: string;
  workerId: string;
  workerName: string;
  partName: string;
  reason: string;
  status: ShiftUnlockStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectReason?: string;
}

export interface Attachment extends IEntity {
  name: string;
  type: "pdf" | "image" | "cad" | "excel" | "word" | "other";
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  /**
   * URL xem trực tiếp — ưu tiên data URL sinh từ contentBase64.
   * Không dùng link cloud; có thể để trống nếu chỉ có contentBase64.
   */
  url?: string;
  /** MIME thật, vd image/webp, application/pdf */
  mimeType?: string;
  /**
   * Nội dung file dạng Base64 (không gồm prefix `data:...;base64,`).
   * Ảnh nên convert WebP trước khi lưu để giảm dung lượng DB.
   */
  contentBase64?: string;
  /** Phân loại: bản vẽ / thông số KT / khác */
  kind?: "drawing" | "tech_spec" | "other";
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

export interface WorkerMachineAssignment {
  workerId: string;
  workerName: string;
  machineId?: string;
  /** Tên máy được tổ trưởng gán */
  machineName: string;
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
  /**
   * Tên quy trình / nguyên công (ĐMKT sheet Mẫu van cột “Tên nguyên công”).
   * Mỗi BOM = 1 quy trình; hết quy trình này mới mở quy trình kế tiếp cùng linh kiện.
   */
  process: string;
  /** Thứ tự quy trình trong cùng linh kiện (1, 2, 3…) */
  processSeq?: number;
  /** Nhóm linh kiện (Tên SP/Chi tiết trên sheet) — gom các quy trình tuần tự */
  partGroup?: string;
  /** Công đoạn trong quy trình 3 tổ */
  processStage?: ProcessStage;
  /** Ca làm việc do GĐ giao */
  shift?: WorkShift | string;
  /** Định mức sản xuất (vd: 80 SP/h) */
  quota?: string;
  /** Thời gian làm theo lệnh (vd: 8h, 07:00–15:00) */
  workTime?: string;
  targetQty: number;
  /** SL lấy từ kho (không SX) */
  stockUseQty?: number;
  useFromStock?: boolean;
  passQty: number;
  failQty: number;
  assignedTeamId: string;
  assignedTeamName: string;
  assignedWorkers: string[];
  /**
   * Phân công: quy trình (BOM.process) + máy + công nhân.
   */
  workerAssignments?: WorkerMachineAssignment[];
  status: BOMStatus;
  /** Nhãn cột legacy (tương thích) — ưu tiên materialSpecs khi có */
  specCols: string[];
  /**
   * Checklist đo kiểm của linh kiện này.
   * Cây: Sản phẩm (order) → Linh kiện (BOM) → materialSpecs[].
   * Mỗi linh kiện có bộ thông số riêng (Cuộn dây ≠ Quạt).
   */
  materialSpecs?: import("./spec.js").MaterialSpec[];
  techNote: string;
  workerEntries: WorkerEntry[];
  /** File thông số & bản vẽ riêng cho từng BOM */
  attachments?: Attachment[];
  teamSummary?: TeamSummary;
  qcReport?: QCReport;
  /** Liên kết semi_product catalog */
  semiProductId?: string;
}

export interface ProductionOrder extends IEntity {
  orderNo: string;
  /** Mã sản phẩm */
  productCode?: string;
  /** FK danh mục thành phẩm */
  productId?: string;
  productLine: string;
  /** Kích cỡ (DN15 / DN20 / …) */
  size?: string;
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
  note?: string;
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

/** Generic paginated list (users, products, warehouse stock, …) */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EntityListQuery {
  q?: string;
  page?: number;
  pageSize?: number;
  roles?: Role[];
  activeOnly?: boolean;
  stage?: ProcessStage | "all";
  /** workflow filters */
  status?: string;
  orderId?: string;
  bomId?: string;
  unreadOnly?: boolean;
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
  machineId?: string;
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
  type: "incident" | "overtime" | "complaint" | "order" | "device" | "approval" | "shift";
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
