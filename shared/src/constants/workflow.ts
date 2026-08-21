import type { Role } from "../types/index.js";

export type WorkflowStatus = "done" | "partial" | "planned";

export interface WorkflowStep {
  id: string;
  role: Role | "worker";
  title: string;
  subtitle: string;
  status: WorkflowStatus;
  path?: string;
  features: string[];
  next?: string[];
}

export const WORKFLOW_STATUS_LABEL: Record<WorkflowStatus, string> = {
  done: "Đã có",
  partial: "Một phần",
  planned: "Kế hoạch",
};

/** Quy trình theo sơ đồ IQC — dùng cho map tương tác trên dashboard */
export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "director-order",
    role: "director",
    title: "GĐ/PGĐ — Lệnh sản xuất",
    subtitle: "Tạo lệnh từ danh mục SP, deadline, dùng kho",
    status: "done",
    path: "/director/orders",
    features: ["Chỉ định lệnh sản xuất", "Danh mục SP/BTP", "QR lệnh SX"],
    next: ["supervisor-assign"],
  },
  {
    id: "supervisor-assign",
    role: "supervisor",
    title: "Quản đốc — Phân công",
    subtitle: "Phân BOM cho tổ, điều phối sản xuất",
    status: "done",
    path: "/supervisor/assign",
    features: ["Phân công tổ", "Chốt ca / duyệt lương"],
    next: ["teamlead-assign"],
  },
  {
    id: "teamlead-assign",
    role: "teamlead",
    title: "Tổ trưởng — Chỉ định công việc",
    subtitle: "Giao công nhân theo BOM, kiểm tra chốt ca",
    status: "done",
    path: "/teamlead/assign",
    features: ["Phân công nhân", "Kiểm tra chốt ca", "Báo cáo tổ"],
    next: ["worker-exec"],
  },
  {
    id: "worker-exec",
    role: "worker",
    title: "NLĐ — Thực hiện & báo cáo",
    subtitle: "Đo kiểm, chốt ca, báo hỏng, xin đổi máy",
    status: "partial",
    path: "/worker/entry",
    features: [
      "Bảng kiểm tra chi tiết",
      "Báo cáo đo kiểm",
      "Chốt ca đạt/hỏng",
      "Báo máy hỏng",
      "Đề xuất sang máy khác",
      "Đề xuất chạy thêm máy",
    ],
    next: ["mechanic-fix", "shift-chain"],
  },
  {
    id: "mechanic-fix",
    role: "mechanic",
    title: "Cơ điện — Xử lý sự cố",
    subtitle: "Tiếp nhận → đang sửa → hoàn thành",
    status: "done",
    path: "/mechanic/incidents",
    features: ["Queue sự cố máy", "Phê duyệt đổi máy", "Lưu downtime KPI"],
    next: ["worker-exec"],
  },
  {
    id: "shift-chain",
    role: "teamlead",
    title: "Chốt ca — Tổ trưởng → QC → Quản đốc",
    subtitle: "CN chốt → TT kiểm → QC chốt → QĐ chốt lương",
    status: "partial",
    path: "/teamlead/shifts",
    features: ["Duyệt chốt ca 3 bước", "Tính lương theo SP đạt", "Biểu đồ lương"],
    next: ["qc-inspect"],
  },
  {
    id: "qc-inspect",
    role: "qc",
    title: "QC — Kiểm tra chất lượng",
    subtitle: "Đối chiếu số liệu tổ, khiếu nại",
    status: "done",
    path: "/qc/inspect",
    features: ["Kiểm tra BOM", "Khiếu nại QC"],
    next: ["stats-record"],
  },
  {
    id: "stats-record",
    role: "stats",
    title: "Thống kê — Kiểm kê thực tế",
    subtitle: "Ghi ca, báo cáo số lượng về quản đốc",
    status: "partial",
    path: "/stats/record",
    features: ["Ghi ca thống kê", "Báo cáo sản lượng"],
    next: ["supervisor-assign"],
  },
];

export const WORKFLOW_BACKLOG: Array<{ label: string; status: WorkflowStatus }> = [
  { label: "In phiếu hàng + QR kẹp rổ", status: "partial" },
  { label: "Tự tạo số lô / batch", status: "planned" },
  { label: "Push notification (FCM)", status: "planned" },
  { label: "Backup & chạy song song 2 server", status: "planned" },
];
