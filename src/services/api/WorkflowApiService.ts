import type {
  MachineIncident,
  OvertimeRequest,
  QCComplaint,
  ProductionStat,
  OrderAuditLog,
  Notification,
} from "@shared/types";
import { BaseApiService } from "../../core/BaseApiService";
import { MOCK_INCIDENTS, MOCK_NOTIFICATIONS } from "../../mocks/workflowSeed";

class WorkflowApiService extends BaseApiService {
  // ── Incidents ──────────────────────────────────────────────────────────────
  async getIncidents(filters?: { orderId?: string; bomId?: string; status?: string }): Promise<MachineIncident[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.set("orderId", filters.orderId);
    if (filters?.bomId) params.set("bomId", filters.bomId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    try {
      return await this.get<MachineIncident[]>(`/incidents${qs ? `?${qs}` : ""}`);
    } catch {
      return MOCK_INCIDENTS.filter((i) => {
        if (filters?.orderId && i.orderId !== filters.orderId) return false;
        if (filters?.bomId && i.bomId !== filters.bomId) return false;
        if (filters?.status && i.status !== filters.status) return false;
        return true;
      });
    }
  }

  getIncidentById(id: string): Promise<MachineIncident> {
    return this.get<MachineIncident>(`/incidents/${id}`);
  }

  createIncident(body: Partial<MachineIncident>): Promise<MachineIncident> {
    return this.post<MachineIncident>("/incidents", body);
  }

  assignIncident(id: string, assignedTo: string, assignedName: string): Promise<MachineIncident> {
    return this.post<MachineIncident>(`/incidents/${id}/assign`, { assignedTo, assignedName });
  }

  resolveIncident(
    id: string,
    resolvedBy: string,
    resolvedName: string,
    resolutionNote: string,
    downtimeMinutes: number,
  ): Promise<MachineIncident> {
    return this.post<MachineIncident>(`/incidents/${id}/resolve`, {
      resolvedBy, resolvedName, resolutionNote, downtimeMinutes,
    });
  }

  confirmIncident(id: string, confirmedBy: string): Promise<MachineIncident> {
    return this.post<MachineIncident>(`/incidents/${id}/confirm`, { confirmedBy });
  }

  // ── Overtime ───────────────────────────────────────────────────────────────
  async getOvertimeRequests(filters?: { orderId?: string; status?: string }): Promise<OvertimeRequest[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.set("orderId", filters.orderId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    try {
      return await this.get<OvertimeRequest[]>(`/overtime${qs ? `?${qs}` : ""}`);
    } catch {
      return [];
    }
  }

  createOvertimeRequest(body: Partial<OvertimeRequest>): Promise<OvertimeRequest> {
    return this.post<OvertimeRequest>("/overtime", body);
  }

  reviewOvertime(
    id: string,
    approved: boolean,
    supervisorId: string,
    supervisorNote: string,
  ): Promise<OvertimeRequest> {
    return this.post<OvertimeRequest>(`/overtime/${id}/review`, { approved, supervisorId, supervisorNote });
  }

  completeOvertime(id: string, actualHours: number): Promise<OvertimeRequest> {
    return this.post<OvertimeRequest>(`/overtime/${id}/complete`, { actualHours });
  }

  // ── Complaints ─────────────────────────────────────────────────────────────
  async getComplaints(filters?: { orderId?: string; bomId?: string; status?: string }): Promise<QCComplaint[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.set("orderId", filters.orderId);
    if (filters?.bomId) params.set("bomId", filters.bomId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    try {
      return await this.get<QCComplaint[]>(`/complaints${qs ? `?${qs}` : ""}`);
    } catch {
      return [];
    }
  }

  getComplaintById(id: string): Promise<QCComplaint> {
    return this.get<QCComplaint>(`/complaints/${id}`);
  }

  createComplaint(body: Partial<QCComplaint>): Promise<QCComplaint> {
    return this.post<QCComplaint>("/complaints", body);
  }

  acknowledgeComplaint(id: string, acknowledgedBy: string, acknowledgedName: string): Promise<QCComplaint> {
    return this.post<QCComplaint>(`/complaints/${id}/acknowledge`, { acknowledgedBy, acknowledgedName });
  }

  respondToComplaint(id: string, action: {
    actionType: string; actionNote: string; actionBy: string; actionName: string;
    reworkQty?: number; scrapQty?: number;
  }): Promise<QCComplaint> {
    return this.post<QCComplaint>(`/complaints/${id}/respond`, action);
  }

  recheckComplaint(
    id: string,
    qcRecheckBy: string,
    qcRecheckName: string,
    result: "passed" | "failed_again",
    note: string,
  ): Promise<QCComplaint> {
    return this.post<QCComplaint>(`/complaints/${id}/recheck`, { qcRecheckBy, qcRecheckName, result, note });
  }

  closeComplaint(id: string, closedBy: string): Promise<QCComplaint> {
    return this.post<QCComplaint>(`/complaints/${id}/close`, { closedBy });
  }

  // ── Production Stats ───────────────────────────────────────────────────────
  async getStats(filters?: { orderId?: string; bomId?: string; statDate?: string }): Promise<ProductionStat[]> {
    const params = new URLSearchParams();
    if (filters?.orderId) params.set("orderId", filters.orderId);
    if (filters?.bomId) params.set("bomId", filters.bomId);
    if (filters?.statDate) params.set("statDate", filters.statDate);
    const qs = params.toString();
    try {
      return await this.get<ProductionStat[]>(`/stats${qs ? `?${qs}` : ""}`);
    } catch {
      return [];
    }
  }

  upsertStat(body: Partial<ProductionStat>): Promise<ProductionStat> {
    return this.post<ProductionStat>("/stats", body);
  }

  getOrderSummary(orderId: string): Promise<{
    totalProduced: number; totalPass: number; totalFail: number; totalRework: number; totalDowntimeMins: number;
  }> {
    return this.get(`/stats/summary/${orderId}`);
  }

  // ── Audit logs ─────────────────────────────────────────────────────────────
  getAuditLogs(orderId: string): Promise<OrderAuditLog[]> {
    return this.get<OrderAuditLog[]>(`/orders/${orderId}/audit`);
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  async getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      return await this.get<Notification[]>(`/notifications/${userId}${unreadOnly ? "?unread=true" : ""}`);
    } catch {
      return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId && (!unreadOnly || !n.isRead));
    }
  }

  markRead(id: string): Promise<void> {
    return this.patch<void>(`/notifications/${id}/read`);
  }

  markAllRead(userId: string): Promise<void> {
    return this.post<void>(`/notifications/${userId}/read-all`);
  }
}

export const workflowApi = new WorkflowApiService();
