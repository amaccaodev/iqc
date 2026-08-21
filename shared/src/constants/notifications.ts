import type { Notification, Role } from "../types/index.js";

/**
 * GĐ / Quản đốc chỉ nhận một số loại thông báo nghiệp vụ.
 * Role khác: không lọc (nhận tất cả gửi tới userId).
 */
export const ROLE_NOTIFICATION_TYPES: Partial<Record<Role, ReadonlyArray<Notification["type"]>>> = {
  director: ["approval", "device", "order", "incident"],
  supervisor: ["approval", "device", "order", "incident", "shift"],
};

export function notificationTypesForRole(role: Role): ReadonlyArray<Notification["type"]> | null {
  return ROLE_NOTIFICATION_TYPES[role] ?? null;
}
