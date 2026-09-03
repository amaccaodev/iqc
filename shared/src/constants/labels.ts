import type { BOMStatus, OrderStatus, Priority, Role } from "../types/index.js";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Bản nháp",
  pending_approval: "Chờ duyệt",
  approved: "Đã duyệt",
  in_progress: "Đang SX",
  completed: "Hoàn thành",
};

export const BOM_STATUS_LABEL: Record<BOMStatus, string> = {
  unassigned: "Chưa phân",
  assigned: "Đã phân",
  in_progress: "Đang làm",
  team_reported: "Tổ BC",
  qc_passed: "QC Đạt",
  qc_failed: "QC Không đạt",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  normal: "Thường",
  high: "Cao",
  urgent: "Khẩn cấp",
};

/** Trạng thái danh mục (thành phẩm / linh kiện / máy) */
export const ACTIVE_STATUS_LABEL = {
  active: "Đang dùng",
  inactive: "Ngưng",
} as const;

export const ROLE_LABEL: Record<Role, string> = {
  director: "GĐ/PGĐ",
  supervisor: "Quản đốc",
  teamlead: "Tổ trưởng",
  worker: "Công nhân",
  qc: "QC",
  stats: "Thống kê",
  admin: "Admin",
  mechanic: "Cơ điện",
};

export const ROLE_ICON: Record<Role, string> = {
  director: "fa-star",
  supervisor: "fa-hard-hat",
  teamlead: "fa-wrench",
  worker: "fa-gear",
  qc: "fa-magnifying-glass",
  stats: "fa-chart-line",
  admin: "fa-shield",
  mechanic: "fa-screwdriver-wrench",
};

export type NavItem = { id: string; label: string; fa: string; path: string };

export const NAV_CFG: Record<Role, NavItem[]> = {
  director: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/director/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/director/production" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract", path: "/director/orders" },
    { id: "machines", label: "Máy móc", fa: "fa-industry", path: "/director/machines" },
    { id: "approvals", label: "Phê duyệt", fa: "fa-check-circle", path: "/director/approvals" },
    { id: "payroll", label: "Lương", fa: "fa-money-check-dollar", path: "/director/payroll" },
    { id: "warehouse", label: "Kho", fa: "fa-warehouse", path: "/director/warehouse" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/director/notifications" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/director/incidents" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/director/profile" },
  ],
  supervisor: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/supervisor/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/supervisor/production" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract", path: "/supervisor/orders" },
    { id: "machines", label: "Máy móc", fa: "fa-industry", path: "/supervisor/machines" },
    { id: "assign", label: "Phân công", fa: "fa-users-gear", path: "/supervisor/assign" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/supervisor/shifts" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/supervisor/incidents" },
    { id: "overtime", label: "OT", fa: "fa-clock", path: "/supervisor/overtime" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/supervisor/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/supervisor/profile" },
  ],
  teamlead: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/teamlead/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/teamlead/production" },
    { id: "assign", label: "Phân công", fa: "fa-users-gear", path: "/teamlead/assign" },
    { id: "boms", label: "BOM", fa: "fa-boxes-stacked", path: "/teamlead/boms" },
    { id: "report", label: "Báo cáo", fa: "fa-chart-bar", path: "/teamlead/report" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/teamlead/shifts" },
    { id: "approvals", label: "Đề xuất", fa: "fa-hand", path: "/teamlead/approvals" },
    { id: "complaints", label: "Khiếu nại", fa: "fa-comment-dots", path: "/teamlead/complaints" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/teamlead/incidents" },
    { id: "overtime", label: "OT", fa: "fa-clock", path: "/teamlead/overtime" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/teamlead/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/teamlead/profile" },
  ],
  worker: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/worker/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/worker/incidents" },
    { id: "entry", label: "Sản xuất", fa: "fa-faucet", path: "/worker/entry" },
    { id: "overtime", label: "Xin OT", fa: "fa-clock", path: "/worker/overtime" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/worker/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/worker/profile" },
  ],
  qc: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/qc/dashboard" },
    { id: "inspect", label: "Kiểm tra", fa: "fa-magnifying-glass", path: "/qc/inspect" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/qc/shifts" },
    { id: "complaints", label: "Khiếu nại", fa: "fa-comment-dots", path: "/qc/complaints" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/qc/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/qc/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/qc/profile" },
  ],
  stats: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/stats/dashboard" },
    { id: "reports", label: "Báo cáo", fa: "fa-table-list", path: "/stats/reports" },
    { id: "record", label: "Ghi ca", fa: "fa-pen-to-square", path: "/stats/record" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/stats/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/stats/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/stats/profile" },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/admin/dashboard" },
    { id: "accounts", label: "Tài khoản", fa: "fa-users", path: "/admin/accounts" },
    { id: "payroll", label: "Lương NV", fa: "fa-money-check-dollar", path: "/admin/payroll" },
    { id: "roles", label: "Vai trò & tổ", fa: "fa-shield-halved", path: "/admin/roles" },
    { id: "products", label: "Danh mục SP", fa: "fa-boxes-stacked", path: "/admin/products" },
    { id: "warehouse", label: "Quản lý kho", fa: "fa-warehouse", path: "/admin/warehouse" },
    { id: "machines", label: "Máy móc", fa: "fa-industry", path: "/admin/machines" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/admin/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/admin/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/admin/profile" },
  ],
  mechanic: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/mechanic/incidents" },
    { id: "approvals", label: "Phê duyệt", fa: "fa-hand", path: "/mechanic/approvals" },
    { id: "incidents", label: "Sự cố máy", fa: "fa-triangle-exclamation", path: "/mechanic/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/mechanic/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/mechanic/profile" },
  ],
};

/** Thanh dưới mobile: tổng quan, báo hỏng, …; chuông cạnh hồ sơ */
export const MOBILE_NAV: Record<Role, NavItem[]> = {
  director: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/director/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/director/production" },
    { id: "machines", label: "Máy móc", fa: "fa-industry", path: "/director/machines" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/director/profile" },
  ],
  supervisor: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/supervisor/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/supervisor/production" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/supervisor/shifts" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/supervisor/profile" },
  ],
  teamlead: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/teamlead/dashboard" },
    { id: "production", label: "Công việc", fa: "fa-list-check", path: "/teamlead/production" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/teamlead/shifts" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/teamlead/profile" },
  ],
  worker: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/worker/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/worker/incidents" },
    { id: "entry", label: "Sản xuất", fa: "fa-faucet", path: "/worker/entry" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/worker/profile" },
  ],
  qc: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/qc/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/qc/incidents" },
    { id: "shifts", label: "Chốt ca", fa: "fa-clipboard-check", path: "/qc/shifts" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/qc/profile" },
  ],
  stats: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/stats/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/stats/incidents" },
    { id: "record", label: "Ghi ca", fa: "fa-pen-to-square", path: "/stats/record" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/stats/profile" },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/admin/dashboard" },
    { id: "products", label: "Danh mục", fa: "fa-boxes-stacked", path: "/admin/products" },
    { id: "machines", label: "Máy", fa: "fa-industry", path: "/admin/machines" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/admin/profile" },
  ],
  mechanic: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/mechanic/incidents" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/mechanic/incidents" },
    { id: "approvals", label: "Duyệt", fa: "fa-hand", path: "/mechanic/approvals" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/mechanic/profile" },
  ],
};

export function roleHomePath(role: Role): string {
  const home = NAV_CFG[role].find((n) => n.id === "dashboard");
  return home?.path ?? NAV_CFG[role][0]?.path ?? "/login";
}
