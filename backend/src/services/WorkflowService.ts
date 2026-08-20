/**
 * WorkflowService — xử lý toàn bộ nghiệp vụ workflow ngoài quản lý đơn hàng:
 *   - Sự cố máy (Machine Incidents)
 *   - Đề xuất làm thêm / OT (Overtime Requests)
 *   - Khiếu nại chất lượng (QC Complaints)
 *   - Thống kê sản lượng (Production Stats)
 *   - Nhật ký thao tác (Audit Logs)
 *   - Thông báo (Notifications)
 */
import type {
  MachineIncident,
  OvertimeRequest,
  QCComplaint,
  ProductionStat,
  OrderAuditLog,
  Notification,
} from "../../../shared/src/types/index.js";
import { supabase } from "../lib/supabase.js";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Mappers (snake_case → camelCase) ─────────────────────────────────────────

function mapIncident(r: Record<string, unknown>): MachineIncident {
  return {
    id: r.id as string,
    bomId: r.bom_id as string | undefined,
    orderId: r.order_id as string | undefined,
    machineName: r.machine_name as string,
    machineCode: (r.machine_code as string) ?? "",
    severity: r.severity as MachineIncident["severity"],
    description: r.description as string,
    reportedBy: r.reported_by as string,
    reportedName: r.reported_name as string,
    reportedAt: r.reported_at as string,
    status: r.status as MachineIncident["status"],
    assignedTo: r.assigned_to as string | undefined,
    assignedName: r.assigned_name as string | undefined,
    assignedAt: r.assigned_at as string | undefined,
    resolvedBy: r.resolved_by as string | undefined,
    resolvedName: r.resolved_name as string | undefined,
    resolvedAt: r.resolved_at as string | undefined,
    resolutionNote: (r.resolution_note as string) ?? "",
    supervisorConfirmedBy: r.supervisor_confirmed_by as string | undefined,
    supervisorConfirmedAt: r.supervisor_confirmed_at as string | undefined,
    downtimeMinutes: (r.downtime_minutes as number) ?? 0,
  };
}

function mapOvertime(r: Record<string, unknown>): OvertimeRequest {
  return {
    id: r.id as string,
    bomId: r.bom_id as string | undefined,
    orderId: r.order_id as string | undefined,
    requestedBy: r.requested_by as string,
    requestedName: r.requested_name as string,
    requestedAt: r.requested_at as string,
    reason: r.reason as string,
    proposedDate: r.proposed_date as string,
    proposedHours: r.proposed_hours as number,
    workerIds: (r.worker_ids as string[]) ?? [],
    workerNames: (r.worker_names as string[]) ?? [],
    status: r.status as OvertimeRequest["status"],
    supervisorId: r.supervisor_id as string | undefined,
    supervisorNote: (r.supervisor_note as string) ?? "",
    supervisorAt: r.supervisor_at as string | undefined,
    directorId: r.director_id as string | undefined,
    directorNote: (r.director_note as string) ?? "",
    directorAt: r.director_at as string | undefined,
    actualHours: r.actual_hours as number | undefined,
  };
}

function mapComplaint(r: Record<string, unknown>): QCComplaint {
  return {
    id: r.id as string,
    bomId: r.bom_id as string,
    orderId: r.order_id as string,
    defectType: r.defect_type as string,
    defectDescription: r.defect_description as string,
    defectQty: r.defect_qty as number,
    sampleTt: (r.sample_tt as number[]) ?? [],
    attachments: (r.attachments as QCComplaint["attachments"]) ?? [],
    raisedBy: r.raised_by as string,
    raisedName: r.raised_name as string,
    raisedAt: r.raised_at as string,
    status: r.status as QCComplaint["status"],
    acknowledgedBy: r.acknowledged_by as string | undefined,
    acknowledgedName: r.acknowledged_name as string | undefined,
    acknowledgedAt: r.acknowledged_at as string | undefined,
    actionType: r.action_type as QCComplaint["actionType"],
    actionNote: (r.action_note as string) ?? "",
    actionBy: r.action_by as string | undefined,
    actionName: r.action_name as string | undefined,
    actionAt: r.action_at as string | undefined,
    reworkQty: r.rework_qty as number | undefined,
    scrapQty: r.scrap_qty as number | undefined,
    qcRecheckBy: r.qc_recheck_by as string | undefined,
    qcRecheckName: r.qc_recheck_name as string | undefined,
    qcRecheckAt: r.qc_recheck_at as string | undefined,
    qcRecheckResult: r.qc_recheck_result as QCComplaint["qcRecheckResult"],
    qcRecheckNote: (r.qc_recheck_note as string) ?? "",
    closedBy: r.closed_by as string | undefined,
    closedAt: r.closed_at as string | undefined,
  };
}

function mapStat(r: Record<string, unknown>): ProductionStat {
  return {
    id: r.id as string,
    orderId: r.order_id as string,
    bomId: r.bom_id as string,
    statDate: r.stat_date as string,
    shift: r.shift as ProductionStat["shift"],
    recordedBy: r.recorded_by as string,
    recordedName: r.recorded_name as string,
    recordedAt: r.recorded_at as string,
    qtyProduced: r.qty_produced as number,
    qtyPass: r.qty_pass as number,
    qtyFail: r.qty_fail as number,
    qtyRework: r.qty_rework as number,
    downtimeMins: r.downtime_mins as number,
    note: (r.note as string) ?? "",
  };
}

// ── Machine Incidents ─────────────────────────────────────────────────────────

export class WorkflowService {
  // ── Incidents ──────────────────────────────────────────────────────────────
  async getIncidents(filters?: { orderId?: string; bomId?: string; status?: string }): Promise<MachineIncident[]> {
    try {
      let q = supabase.from("machine_incidents").select("*").order("reported_at", { ascending: false });
      if (filters?.orderId) q = q.eq("order_id", filters.orderId);
      if (filters?.bomId) q = q.eq("bom_id", filters.bomId);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapIncident);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.getIncidents(filters);
    }
  }

  async getIncidentById(id: string): Promise<MachineIncident | null> {
    try {
      const { data, error } = await supabase.from("machine_incidents").select("*").eq("id", id).single();
      if (error || !data) throw new Error(error?.message ?? "not found");
      return mapIncident(data as Record<string, unknown>);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.getIncidentById(id);
    }
  }

  async createIncident(
    body: Omit<MachineIncident, "id" | "reportedAt" | "status" | "resolutionNote" | "downtimeMinutes">,
  ): Promise<MachineIncident> {
    try {
      const row = {
        id: uid("inc"),
        bom_id: body.bomId ?? null,
        order_id: body.orderId ?? null,
        machine_name: body.machineName,
        machine_code: body.machineCode ?? "",
        severity: body.severity,
        description: body.description,
        reported_by: body.reportedBy,
        reported_name: body.reportedName,
        status: "open",
        resolution_note: "",
        downtime_minutes: 0,
      };
      const { data, error } = await supabase.from("machine_incidents").insert(row).select().single();
      if (error) throw new Error(error.message);
      return mapIncident(data as Record<string, unknown>);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.createIncident(body);
    }
  }

  /** Cơ điện nhận sự cố */
  async assignIncident(id: string, assignedTo: string, assignedName: string): Promise<MachineIncident> {
    try {
      const { data, error } = await supabase
        .from("machine_incidents")
        .update({ status: "assigned", assigned_to: assignedTo, assigned_name: assignedName, assigned_at: new Date().toISOString() })
        .eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return mapIncident(data as Record<string, unknown>);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.assignIncident(id, assignedTo, assignedName);
    }
  }

  /** Cơ điện giải quyết xong */
  async resolveIncident(
    id: string,
    resolvedBy: string,
    resolvedName: string,
    resolutionNote: string,
    downtimeMinutes: number,
  ): Promise<MachineIncident> {
    try {
      const { data, error } = await supabase
        .from("machine_incidents")
        .update({
          status: "resolved",
          resolved_by: resolvedBy,
          resolved_name: resolvedName,
          resolved_at: new Date().toISOString(),
          resolution_note: resolutionNote,
          downtime_minutes: downtimeMinutes,
        })
        .eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return mapIncident(data as Record<string, unknown>);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.resolveIncident(id, resolvedBy, resolvedName, resolutionNote, downtimeMinutes);
    }
  }

  /** Quản đốc xác nhận đóng sự cố */
  async confirmIncident(id: string, confirmedBy: string): Promise<MachineIncident> {
    try {
      const { data, error } = await supabase
        .from("machine_incidents")
        .update({
          status: "closed",
          supervisor_confirmed_by: confirmedBy,
          supervisor_confirmed_at: new Date().toISOString(),
        })
        .eq("id", id).select().single();
      if (error) throw new Error(error.message);
      return mapIncident(data as Record<string, unknown>);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.confirmIncident(id, confirmedBy);
    }
  }

  // ── Overtime Requests ──────────────────────────────────────────────────────
  async getOvertimeRequests(filters?: { orderId?: string; status?: string }): Promise<OvertimeRequest[]> {
    try {
      let q = supabase.from("overtime_requests").select("*").order("requested_at", { ascending: false });
      if (filters?.orderId) q = q.eq("order_id", filters.orderId);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapOvertime);
    } catch {
      return [];
    }
  }

  async createOvertimeRequest(
    body: Omit<OvertimeRequest, "id" | "requestedAt" | "status" | "supervisorNote" | "directorNote">,
  ): Promise<OvertimeRequest> {
    const row = {
      id: uid("ot"),
      bom_id: body.bomId ?? null,
      order_id: body.orderId ?? null,
      requested_by: body.requestedBy,
      requested_name: body.requestedName,
      reason: body.reason,
      proposed_date: body.proposedDate,
      proposed_hours: body.proposedHours,
      worker_ids: body.workerIds ?? [],
      worker_names: body.workerNames ?? [],
      status: "pending",
      supervisor_note: "",
      director_note: "",
    };
    const { data, error } = await supabase.from("overtime_requests").insert(row).select().single();
    if (error) throw new Error(error.message);
    return mapOvertime(data as Record<string, unknown>);
  }

  /** Quản đốc duyệt / từ chối OT */
  async reviewOvertimeBySupervisor(
    id: string,
    approved: boolean,
    supervisorId: string,
    supervisorNote: string,
  ): Promise<OvertimeRequest> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .update({
        status: approved ? "approved" : "rejected",
        supervisor_id: supervisorId,
        supervisor_note: supervisorNote,
        supervisor_at: new Date().toISOString(),
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapOvertime(data as Record<string, unknown>);
  }

  /** Ghi lại giờ OT thực tế */
  async completeOvertime(id: string, actualHours: number): Promise<OvertimeRequest> {
    const { data, error } = await supabase
      .from("overtime_requests")
      .update({ status: "completed", actual_hours: actualHours })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapOvertime(data as Record<string, unknown>);
  }

  // ── QC Complaints ──────────────────────────────────────────────────────────
  async getComplaints(filters?: { orderId?: string; bomId?: string; status?: string }): Promise<QCComplaint[]> {
    try {
      let q = supabase.from("qc_complaints").select("*").order("raised_at", { ascending: false });
      if (filters?.orderId) q = q.eq("order_id", filters.orderId);
      if (filters?.bomId) q = q.eq("bom_id", filters.bomId);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapComplaint);
    } catch {
      return [];
    }
  }

  async getComplaintById(id: string): Promise<QCComplaint | null> {
    const { data, error } = await supabase.from("qc_complaints").select("*").eq("id", id).single();
    if (error || !data) return null;
    return mapComplaint(data as Record<string, unknown>);
  }

  /** QC tạo khiếu nại */
  async createComplaint(
    body: Omit<QCComplaint, "id" | "raisedAt" | "status" | "actionNote" | "qcRecheckNote">,
  ): Promise<QCComplaint> {
    const row = {
      id: uid("cmp"),
      bom_id: body.bomId,
      order_id: body.orderId,
      defect_type: body.defectType,
      defect_description: body.defectDescription,
      defect_qty: body.defectQty,
      sample_tt: body.sampleTt ?? [],
      attachments: body.attachments ?? [],
      raised_by: body.raisedBy,
      raised_name: body.raisedName,
      status: "open",
      action_note: "",
      qc_recheck_note: "",
    };
    const { data, error } = await supabase.from("qc_complaints").insert(row).select().single();
    if (error) throw new Error(error.message);
    return mapComplaint(data as Record<string, unknown>);
  }

  /** Tổ trưởng xác nhận nhận khiếu nại */
  async acknowledgeComplaint(id: string, acknowledgedBy: string, acknowledgedName: string): Promise<QCComplaint> {
    const { data, error } = await supabase
      .from("qc_complaints")
      .update({
        status: "acknowledged",
        acknowledged_by: acknowledgedBy,
        acknowledged_name: acknowledgedName,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapComplaint(data as Record<string, unknown>);
  }

  /** Tổ trưởng ghi hành động xử lý (làm lại / loại bỏ / chấp nhận) */
  async respondToComplaint(
    id: string,
    action: {
      actionType: QCComplaint["actionType"];
      actionNote: string;
      actionBy: string;
      actionName: string;
      reworkQty?: number;
      scrapQty?: number;
    },
  ): Promise<QCComplaint> {
    const { data, error } = await supabase
      .from("qc_complaints")
      .update({
        status: "rework",
        action_type: action.actionType,
        action_note: action.actionNote,
        action_by: action.actionBy,
        action_name: action.actionName,
        action_at: new Date().toISOString(),
        rework_qty: action.reworkQty ?? null,
        scrap_qty: action.scrapQty ?? null,
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapComplaint(data as Record<string, unknown>);
  }

  /** QC kiểm tra lại sau khi xử lý */
  async recheckComplaint(
    id: string,
    qcRecheckBy: string,
    qcRecheckName: string,
    result: "passed" | "failed_again",
    note: string,
  ): Promise<QCComplaint> {
    const newStatus: QCComplaint["status"] = result === "passed" ? "resolved" : "open";
    const { data, error } = await supabase
      .from("qc_complaints")
      .update({
        status: newStatus,
        qc_recheck_by: qcRecheckBy,
        qc_recheck_name: qcRecheckName,
        qc_recheck_at: new Date().toISOString(),
        qc_recheck_result: result,
        qc_recheck_note: note,
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapComplaint(data as Record<string, unknown>);
  }

  /** Quản đốc đóng khiếu nại */
  async closeComplaint(id: string, closedBy: string): Promise<QCComplaint> {
    const { data, error } = await supabase
      .from("qc_complaints")
      .update({
        status: "closed",
        closed_by: closedBy,
        closed_at: new Date().toISOString(),
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return mapComplaint(data as Record<string, unknown>);
  }

  // ── Production Stats ───────────────────────────────────────────────────────
  async getStats(filters?: { orderId?: string; bomId?: string; statDate?: string }): Promise<ProductionStat[]> {
    try {
      let q = supabase.from("production_stats").select("*").order("stat_date", { ascending: false });
      if (filters?.orderId) q = q.eq("order_id", filters.orderId);
      if (filters?.bomId) q = q.eq("bom_id", filters.bomId);
      if (filters?.statDate) q = q.eq("stat_date", filters.statDate);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map(mapStat);
    } catch {
      return [];
    }
  }

  async upsertStat(body: Omit<ProductionStat, "id" | "recordedAt">): Promise<ProductionStat> {
    const existing = await supabase
      .from("production_stats")
      .select("id")
      .eq("bom_id", body.bomId)
      .eq("stat_date", body.statDate)
      .eq("shift", body.shift)
      .maybeSingle();

    const row = {
      id: existing.data?.id ?? uid("stat"),
      order_id: body.orderId,
      bom_id: body.bomId,
      stat_date: body.statDate,
      shift: body.shift,
      recorded_by: body.recordedBy,
      recorded_name: body.recordedName,
      qty_produced: body.qtyProduced,
      qty_pass: body.qtyPass,
      qty_fail: body.qtyFail,
      qty_rework: body.qtyRework,
      downtime_mins: body.downtimeMins,
      note: body.note,
    };
    const { data, error } = await supabase
      .from("production_stats")
      .upsert(row, { onConflict: "bom_id,stat_date,shift" })
      .select().single();
    if (error) throw new Error(error.message);
    return mapStat(data as Record<string, unknown>);
  }

  /** Tổng hợp sản lượng theo order */
  async getOrderSummary(orderId: string) {
    const { data, error } = await supabase
      .from("production_stats")
      .select("qty_produced,qty_pass,qty_fail,qty_rework,downtime_mins,bom_id")
      .eq("order_id", orderId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      totalProduced: rows.reduce((s, r) => s + (r.qty_produced as number), 0),
      totalPass: rows.reduce((s, r) => s + (r.qty_pass as number), 0),
      totalFail: rows.reduce((s, r) => s + (r.qty_fail as number), 0),
      totalRework: rows.reduce((s, r) => s + (r.qty_rework as number), 0),
      totalDowntimeMins: rows.reduce((s, r) => s + (r.downtime_mins as number), 0),
    };
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  async addAuditLog(body: Omit<OrderAuditLog, "id" | "createdAt">): Promise<void> {
    const row = {
      id: uid("log"),
      order_id: body.orderId,
      bom_id: body.bomId ?? null,
      action: body.action,
      actor_id: body.actorId,
      actor_name: body.actorName,
      old_status: body.oldStatus ?? null,
      new_status: body.newStatus ?? null,
      note: body.note,
    };
    const { error } = await supabase.from("order_audit_logs").insert(row);
    if (error) throw new Error(error.message);
  }

  async getAuditLogs(orderId: string): Promise<OrderAuditLog[]> {
    const { data, error } = await supabase
      .from("order_audit_logs")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id as string,
      orderId: r.order_id as string,
      bomId: r.bom_id as string | undefined,
      action: r.action as string,
      actorId: r.actor_id as string,
      actorName: r.actor_name as string,
      oldStatus: r.old_status as string | undefined,
      newStatus: r.new_status as string | undefined,
      note: (r.note as string) ?? "",
      createdAt: r.created_at as string,
    }));
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  async getNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      let q = supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
      if (unreadOnly) q = q.eq("is_read", false);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({
        id: r.id as string,
        userId: r.user_id as string,
        type: r.type as Notification["type"],
        refId: r.ref_id as string | undefined,
        refType: r.ref_type as string | undefined,
        title: r.title as string,
        body: (r.body as string) ?? "",
        isRead: r.is_read as boolean,
        createdAt: r.created_at as string,
      }));
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      return workflowMemoryStore.getNotifications(userId, unreadOnly);
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw new Error(error.message);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      workflowMemoryStore.markNotificationRead(id);
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      if (error) throw new Error(error.message);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      workflowMemoryStore.markAllNotificationsRead(userId);
    }
  }

  async createNotification(body: Omit<Notification, "id" | "createdAt" | "isRead">): Promise<void> {
    try {
      const row = {
        id: uid("notif"),
        user_id: body.userId,
        type: body.type,
        ref_id: body.refId ?? null,
        ref_type: body.refType ?? null,
        title: body.title,
        body: body.body,
        is_read: false,
      };
      const { error } = await supabase.from("notifications").insert(row);
      if (error) throw new Error(error.message);
    } catch {
      const { workflowMemoryStore } = await import("./WorkflowMemoryStore.js");
      workflowMemoryStore.createNotification(body);
    }
  }
}

export const workflowService = new WorkflowService();
