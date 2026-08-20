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

export const ROLE_LABEL: Record<Role, string> = {
  director: "GĐ/PGĐ",
  supervisor: "Quản đốc",
  teamlead: "Tổ trưởng",
  worker: "Công nhân",
  qc: "QC",
  stats: "Thống kê",
  admin: "Admin",
};

export const ROLE_ICON: Record<Role, string> = {
  director: "fa-star",
  supervisor: "fa-hard-hat",
  teamlead: "fa-wrench",
  worker: "fa-gear",
  qc: "fa-magnifying-glass",
  stats: "fa-chart-line",
  admin: "fa-shield",
};

export type NavItem = { id: string; label: string; fa: string; path: string };

export const NAV_CFG: Record<Role, NavItem[]> = {
  director: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/director/dashboard" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract", path: "/director/orders" },
    { id: "approvals", label: "Phê duyệt", fa: "fa-check-circle", path: "/director/approvals" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/director/notifications" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/director/incidents" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/director/profile" },
  ],
  supervisor: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/supervisor/dashboard" },
    { id: "orders", label: "Lệnh SX", fa: "fa-file-contract", path: "/supervisor/orders" },
    { id: "assign", label: "Phân công", fa: "fa-users-gear", path: "/supervisor/assign" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/supervisor/incidents" },
    { id: "overtime", label: "OT", fa: "fa-clock", path: "/supervisor/overtime" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/supervisor/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/supervisor/profile" },
  ],
  teamlead: [
    { id: "dashboard", label: "Công việc", fa: "fa-list-check", path: "/teamlead/dashboard" },
    { id: "boms", label: "BOM", fa: "fa-boxes-stacked", path: "/teamlead/boms" },
    { id: "assign", label: "Phân CN", fa: "fa-users", path: "/teamlead/assign" },
    { id: "report", label: "Báo cáo", fa: "fa-chart-bar", path: "/teamlead/report" },
    { id: "complaints", label: "Khiếu nại", fa: "fa-comment-dots", path: "/teamlead/complaints" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/teamlead/incidents" },
    { id: "overtime", label: "OT", fa: "fa-clock", path: "/teamlead/overtime" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/teamlead/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/teamlead/profile" },
  ],
  worker: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/worker/notifications" },
    { id: "dashboard", label: "Công việc", fa: "fa-star", path: "/worker/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/worker/incidents" },
    { id: "entry", label: "Nhập liệu", fa: "fa-calendar", path: "/worker/entry" },
    { id: "overtime", label: "Xin OT", fa: "fa-clock", path: "/worker/overtime" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/worker/profile" },
  ],
  qc: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/qc/dashboard" },
    { id: "inspect", label: "Kiểm tra", fa: "fa-magnifying-glass", path: "/qc/inspect" },
    { id: "complaints", label: "Khiếu nại", fa: "fa-comment-dots", path: "/qc/complaints" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/qc/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/qc/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/qc/profile" },
  ],
  stats: [
    { id: "dashboard", label: "Thống kê", fa: "fa-chart-pie", path: "/stats/dashboard" },
    { id: "reports", label: "Báo cáo", fa: "fa-table-list", path: "/stats/reports" },
    { id: "record", label: "Ghi ca", fa: "fa-pen-to-square", path: "/stats/record" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/stats/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/stats/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/stats/profile" },
  ],
  admin: [
    { id: "dashboard", label: "Tổng quan", fa: "fa-gauge-high", path: "/admin/dashboard" },
    { id: "accounts", label: "Tài khoản", fa: "fa-users", path: "/admin/accounts" },
    { id: "roles", label: "Roles & Groups", fa: "fa-shield-halved", path: "/admin/roles" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-triangle-exclamation", path: "/admin/incidents" },
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/admin/notifications" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/admin/profile" },
  ],
};

/** Thanh dưới mobile — tối đa 5 mục theo mockup: thông báo, công việc, báo hỏng, lịch/lệnh, hồ sơ */
export const MOBILE_NAV: Record<Role, NavItem[]> = {
  director: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/director/notifications" },
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/director/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/director/incidents" },
    { id: "orders", label: "Lệnh SX", fa: "fa-calendar", path: "/director/orders" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/director/profile" },
  ],
  supervisor: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/supervisor/notifications" },
    { id: "dashboard", label: "Công việc", fa: "fa-star", path: "/supervisor/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/supervisor/incidents" },
    { id: "assign", label: "Phân công", fa: "fa-calendar", path: "/supervisor/assign" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/supervisor/profile" },
  ],
  teamlead: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/teamlead/notifications" },
    { id: "dashboard", label: "Công việc", fa: "fa-star", path: "/teamlead/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/teamlead/incidents" },
    { id: "report", label: "Báo cáo", fa: "fa-calendar", path: "/teamlead/report" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/teamlead/profile" },
  ],
  worker: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/worker/notifications" },
    { id: "dashboard", label: "Công việc", fa: "fa-star", path: "/worker/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/worker/incidents" },
    { id: "entry", label: "Nhập liệu", fa: "fa-calendar", path: "/worker/entry" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/worker/profile" },
  ],
  qc: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/qc/notifications" },
    { id: "dashboard", label: "Công việc", fa: "fa-star", path: "/qc/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/qc/incidents" },
    { id: "inspect", label: "Kiểm tra", fa: "fa-calendar", path: "/qc/inspect" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/qc/profile" },
  ],
  stats: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/stats/notifications" },
    { id: "dashboard", label: "Thống kê", fa: "fa-star", path: "/stats/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/stats/incidents" },
    { id: "record", label: "Ghi ca", fa: "fa-calendar", path: "/stats/record" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/stats/profile" },
  ],
  admin: [
    { id: "notifications", label: "Thông báo", fa: "fa-bell", path: "/admin/notifications" },
    { id: "dashboard", label: "Tổng quan", fa: "fa-star", path: "/admin/dashboard" },
    { id: "incidents", label: "Báo hỏng", fa: "fa-circle-exclamation", path: "/admin/incidents" },
    { id: "accounts", label: "Tài khoản", fa: "fa-calendar", path: "/admin/accounts" },
    { id: "profile", label: "Hồ sơ", fa: "fa-user", path: "/admin/profile" },
  ],
};

export function roleHomePath(role: Role): string {
  const home = NAV_CFG[role].find((n) => n.id === "dashboard");
  return home?.path ?? NAV_CFG[role][0]?.path ?? "/login";
}
