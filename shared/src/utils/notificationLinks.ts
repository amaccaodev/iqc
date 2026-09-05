import type { Notification, Role } from "../types/index.js";

/** `orderId` hoặc `orderId/bomId` (thông báo linh kiện / số đo). */
export function parseOrderJobRef(refId?: string): { orderId: string; bomId?: string } | null {
  if (!refId?.trim()) return null;
  let raw = refId.trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep */
  }
  const i = raw.indexOf("/");
  if (i > 0) {
    const orderId = raw.slice(0, i);
    const bomId = raw.slice(i + 1);
    if (orderId && bomId) return { orderId, bomId };
  }
  return { orderId: raw };
}

function enc(s: string) {
  return encodeURIComponent(s);
}

function jobDetailPath(role: Role, orderId: string, bomId: string): string | null {
  if (role === "director" || role === "supervisor" || role === "teamlead") {
    return `/${role}/production/${enc(orderId)}/${enc(bomId)}`;
  }
  if (role === "worker") return `/worker/task/${enc(orderId)}/${enc(bomId)}`;
  return null;
}

function orderFocusPath(role: Role, orderId: string): string {
  const q = `orderId=${enc(orderId)}`;
  if (role === "director") return `/director/production?${q}`;
  if (role === "supervisor") return `/supervisor/assign?${q}`;
  if (role === "teamlead") return `/teamlead/production?${q}`;
  if (role === "qc") return `/qc/inspect?${q}`;
  return `/${role}/production?${q}`;
}

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
  const parsed = parseOrderJobRef(n.refId);

  switch (n.refType) {
    case "shift_close":
      if (role === "teamlead" || role === "qc" || role === "supervisor") {
        return ref ? `${base}/shifts?closeId=${ref}` : `${base}/shifts`;
      }
      if (role === "worker") {
        if (parsed?.bomId) return jobDetailPath(role, parsed.orderId, parsed.bomId);
        return `${base}/entry`;
      }
      break;
    case "shift_unlock":
      if (role === "teamlead" || role === "supervisor") {
        return ref ? `${base}/shifts?unlockId=${ref}` : `${base}/shifts`;
      }
      if (role === "worker") return `${base}/entry`;
      break;
    case "machine_change":
      if (role === "teamlead" || role === "mechanic") {
        return ref ? `${base}/approvals?requestId=${ref}` : `${base}/approvals`;
      }
      if (role === "worker") {
        return ref
          ? `${base}/incidents?tab=approvals&requestId=${ref}`
          : `${base}/incidents?tab=approvals`;
      }
      if (role === "director" || role === "supervisor") {
        return ref
          ? `${base}/incidents?tab=approvals&requestId=${ref}`
          : `${base}/incidents?tab=approvals`;
      }
      break;
    case "measurement_error":
    case "production_order": {
      if (parsed?.bomId) {
        const dest = jobDetailPath(role, parsed.orderId, parsed.bomId);
        if (dest) return dest;
      }
      if (parsed?.orderId) return orderFocusPath(role, parsed.orderId);
      break;
    }
    case "device_login":
      if (role === "admin" || role === "director") return `${base}/accounts`;
      break;
    case "machine_incident":
      return ref ? `${base}/incidents?id=${ref}` : `${base}/incidents`;
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
  if (n.type === "incident") {
    return ref ? `${base}/incidents?id=${ref}` : `${base}/incidents`;
  }
  if (n.type === "approval") {
    if (role === "teamlead" || role === "mechanic") {
      return ref ? `${base}/approvals?requestId=${ref}` : `${base}/approvals`;
    }
    if (role === "worker") {
      return ref
        ? `${base}/incidents?tab=approvals&requestId=${ref}`
        : `${base}/incidents?tab=approvals`;
    }
  }
  if (n.type === "overtime") return `${base}/overtime`;
  if (n.type === "complaint") {
    if (role === "teamlead" || role === "qc" || role === "supervisor" || role === "director") {
      return ref ? `${base}/complaints?id=${ref}` : `${base}/complaints`;
    }
  }
  if (n.type === "order") {
    if (parsed?.bomId) {
      const dest = jobDetailPath(role, parsed.orderId, parsed.bomId);
      if (dest) return dest;
    }
    if (parsed?.orderId) return orderFocusPath(role, parsed.orderId);
  }

  return null;
}
