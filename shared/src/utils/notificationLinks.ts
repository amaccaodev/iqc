import type { Notification, Role } from "../types/index.js";

/**
 * Đích điều hướng khi bấm thông báo — theo role + type/refType.
 * Trả null nếu không có trang đích rõ.
 */
export function notificationTargetPath(
  role: Role,
  n: Pick<Notification, "type" | "refType" | "refId" | "title">,
): string | null {
  const base = `/${role}`;
  const ref = n.refId ? encodeURIComponent(n.refId) : "";

  switch (n.refType) {
    case "shift_close":
      if (role === "teamlead" || role === "qc" || role === "supervisor") {
        return ref ? `${base}/shifts?closeId=${ref}` : `${base}/shifts`;
      }
      if (role === "worker") return `${base}/entry`;
      break;
    case "shift_unlock":
      if (role === "teamlead" || role === "supervisor") {
        return ref ? `${base}/shifts?unlockId=${ref}` : `${base}/shifts`;
      }
      if (role === "worker") return `${base}/entry`;
      break;
    case "machine_change":
      if (role === "teamlead" || role === "mechanic") return `${base}/approvals`;
      if (role === "worker") return `${base}/incidents?tab=approvals`;
      break;
    case "measurement_error":
      if (role === "teamlead") return `${base}/production`;
      if (n.refId && (role === "director" || role === "supervisor")) {
        return `${base}/orders`;
      }
      break;
    case "production_order":
      if (role === "director") return `${base}/orders`;
      if (role === "supervisor" || role === "teamlead") return `${base}/production`;
      break;
    case "device_login":
      if (role === "admin" || role === "director") return `${base}/accounts`;
      break;
    case "machine_incident":
      return `${base}/incidents`;
    default:
      break;
  }

  // Fallback theo type khi thiếu refType (data cũ)
  if (n.type === "shift") {
    if (role === "teamlead" || role === "qc" || role === "supervisor") {
      return ref ? `${base}/shifts?closeId=${ref}` : `${base}/shifts`;
    }
    if (role === "worker") return `${base}/entry`;
  }
  if (n.type === "incident") return `${base}/incidents`;
  if (n.type === "approval") {
    if (role === "teamlead" || role === "mechanic") return `${base}/approvals`;
    if (role === "worker") return `${base}/incidents?tab=approvals`;
  }
  if (n.type === "overtime") return `${base}/overtime`;
  if (n.type === "complaint") {
    if (role === "teamlead" || role === "qc" || role === "supervisor" || role === "director") {
      return `${base}/complaints`;
    }
  }
  if (n.type === "order") {
    if (role === "director") return `${base}/orders`;
    if (role === "supervisor" || role === "teamlead") return `${base}/production`;
  }

  return null;
}
