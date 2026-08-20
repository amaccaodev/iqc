import type { MachineIncident, Notification } from "../../../shared/src/types/index.js";
import { SEED_INCIDENTS, SEED_NOTIFICATIONS } from "../data/workflowSeed.js";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

class WorkflowMemoryStore {
  incidents: MachineIncident[] = SEED_INCIDENTS.map((x) => ({ ...x }));
  notifications: Notification[] = SEED_NOTIFICATIONS.map((x) => ({ ...x }));

  getIncidents(filters?: { orderId?: string; bomId?: string; status?: string }) {
    return this.incidents.filter((i) => {
      if (filters?.orderId && i.orderId !== filters.orderId) return false;
      if (filters?.bomId && i.bomId !== filters.bomId) return false;
      if (filters?.status && i.status !== filters.status) return false;
      return true;
    });
  }

  getIncidentById(id: string) {
    return this.incidents.find((i) => i.id === id) ?? null;
  }

  createIncident(body: Omit<MachineIncident, "id" | "reportedAt" | "status" | "resolutionNote" | "downtimeMinutes">) {
    const row: MachineIncident = {
      ...body,
      id: uid("inc"),
      reportedAt: new Date().toISOString(),
      status: "open",
      resolutionNote: "",
      downtimeMinutes: 0,
    };
    this.incidents.unshift(row);
    return row;
  }

  assignIncident(id: string, assignedTo: string, assignedName: string) {
    const row = this.incidents.find((i) => i.id === id);
    if (!row) throw new Error("Không tìm thấy sự cố");
    Object.assign(row, { status: "assigned", assignedTo, assignedName, assignedAt: new Date().toISOString() });
    return row;
  }

  resolveIncident(id: string, resolvedBy: string, resolvedName: string, resolutionNote: string, downtimeMinutes: number) {
    const row = this.incidents.find((i) => i.id === id);
    if (!row) throw new Error("Không tìm thấy sự cố");
    Object.assign(row, {
      status: "resolved",
      resolvedBy,
      resolvedName,
      resolvedAt: new Date().toISOString(),
      resolutionNote,
      downtimeMinutes,
    });
    return row;
  }

  confirmIncident(id: string, confirmedBy: string) {
    const row = this.incidents.find((i) => i.id === id);
    if (!row) throw new Error("Không tìm thấy sự cố");
    Object.assign(row, {
      status: "closed",
      supervisorConfirmedBy: confirmedBy,
      supervisorConfirmedAt: new Date().toISOString(),
    });
    return row;
  }

  getNotifications(userId: string, unreadOnly = false) {
    return this.notifications.filter((n) => n.userId === userId && (!unreadOnly || !n.isRead));
  }

  markNotificationRead(id: string) {
    const row = this.notifications.find((n) => n.id === id);
    if (row) row.isRead = true;
  }

  markAllNotificationsRead(userId: string) {
    for (const n of this.notifications) {
      if (n.userId === userId) n.isRead = true;
    }
  }

  createNotification(body: Omit<Notification, "id" | "createdAt" | "isRead">) {
    this.notifications.unshift({
      ...body,
      id: uid("notif"),
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }
}

export const workflowMemoryStore = new WorkflowMemoryStore();
