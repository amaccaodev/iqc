/**
 * SupabaseOrderRepository
 * Reads/writes production_orders + nested boms, entries, summaries, qc_reports
 * from Supabase using the service-role client (bypasses RLS).
 *
 * The "source of truth" shape is the shared ProductionOrder type.
 * We do all mapping between snake_case DB rows ↔ camelCase domain objects here.
 */
import type {
  Attachment,
  BOMItem,
  DimensionRow,
  ProductionOrder,
  QCReport,
  TeamSummary,
  WorkerEntry,
} from "../../../shared/src/types/index.js";
import { TEAMS, resolveBomTeamId } from "../../../shared/src/constants/teams.js";
import { supabase } from "../lib/supabase.js";
import { applyPlanToBom, encodeTechNote, today, todayDateTime } from "../../../shared/src/utils/orderHelpers.js";

// ── Supabase row types (snake_case) ──────────────────────────────────────────

interface DbOrder {
  id: string;
  order_no: string;
  product_line: string;
  customer: string;
  target_qty: number;
  created_by: string;
  created_at: string;
  deadline: string;
  priority: string;
  status: string;
  pending_approval: boolean;
}

interface DbBom {
  id: string;
  production_order_id: string;
  bom_code: string;
  part_code: string;
  part_name: string;
  raw_material: string;
  machine: string;
  process: string;
  target_qty: number;
  pass_qty: number;
  fail_qty: number;
  assigned_group_id: string | null;
  assigned_group_name: string;
  assigned_workers: string[];
  status: string;
  spec_cols: string[];
  material_specs: unknown;
  tech_note: string;
}

interface DbAttachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_by: string;
  uploaded_at: string;
  mime_type?: string | null;
  content_base64?: string | null;
  kind?: string | null;
}

interface DbEntry {
  id: string;
  bom_id: string;
  worker_id: string;
  worker_name: string;
  submitted_at: string;
}

interface DbRow {
  id: string;
  entry_id: string;
  tt: number;
  dims: string[];
  ngoai_quan: string;
}

interface DbTeamSummary {
  pass_qty: number;
  fail_qty: number;
  note: string;
  reported_by: string;
  reported_at: string;
}

interface DbQCReport {
  pass_qty: number;
  fail_qty: number;
  complaint: string;
  status: string;
  inspected_by: string;
  inspected_at: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapAttachment(row: DbAttachment): Attachment {
  return {
    id: row.id,
    name: row.name,
    type: row.type as Attachment["type"],
    size: row.size,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    mimeType: row.mime_type || undefined,
    contentBase64: row.content_base64 || undefined,
    kind: (row.kind as Attachment["kind"]) || undefined,
  };
}

function attachmentRow(a: Attachment, foreignKey: string, foreignValue: string) {
  return {
    id: a.id,
    [foreignKey]: foreignValue,
    name: a.name,
    type: a.type,
    size: a.size,
    uploaded_by: a.uploadedBy,
    uploaded_at: a.uploadedAt,
    mime_type: a.mimeType ?? "",
    content_base64: a.contentBase64 ?? null,
    kind: a.kind ?? "other",
  };
}

function mapEntry(entry: DbEntry, rows: DbRow[]): WorkerEntry {
  const entryRows: DimensionRow[] = rows.map((r) => ({
    tt: r.tt,
    dims: r.dims,
    ngoaiQuan: r.ngoai_quan,
  }));
  return {
    id: entry.id,
    workerId: entry.worker_id,
    workerName: entry.worker_name,
    submittedAt: entry.submitted_at,
    rows: entryRows,
  };
}

function mapBom(
  bom: DbBom,
  attachments: DbAttachment[],
  entries: DbEntry[],
  rowsByEntry: Map<string, DbRow[]>,
  teamSummary: DbTeamSummary | null,
  qcReport: DbQCReport | null,
): BOMItem {
  const mapped = applyPlanToBom({
    id: bom.id,
    bomCode: bom.bom_code,
    partCode: bom.part_code,
    partName: bom.part_name,
    rawMaterial: bom.raw_material,
    machine: bom.machine,
    process: bom.process,
    targetQty: bom.target_qty,
    passQty: bom.pass_qty,
    failQty: bom.fail_qty,
    assignedTeamId: bom.assigned_group_id ?? "",
    assignedTeamName: bom.assigned_group_name,
    assignedWorkers: bom.assigned_workers ?? [],
    status: bom.status as BOMItem["status"],
    specCols: bom.spec_cols ?? [],
    materialSpecs: bom.material_specs as BOMItem["materialSpecs"],
    techNote: bom.tech_note,
    attachments: attachments.map(mapAttachment),
    workerEntries: entries.map((e) => mapEntry(e, rowsByEntry.get(e.id) ?? [])),
    teamSummary: teamSummary
      ? {
          passQty: teamSummary.pass_qty,
          failQty: teamSummary.fail_qty,
          note: teamSummary.note,
          reportedBy: teamSummary.reported_by,
          reportedAt: teamSummary.reported_at,
        }
      : undefined,
    qcReport: qcReport
      ? {
          passQty: qcReport.pass_qty,
          failQty: qcReport.fail_qty,
          complaint: qcReport.complaint,
          status: qcReport.status as QCReport["status"],
          inspectedBy: qcReport.inspected_by,
          inspectedAt: qcReport.inspected_at,
        }
      : undefined,
  });
  const teamId = resolveBomTeamId(mapped);
  const team = TEAMS.find((t) => t.id === teamId);
  return {
    ...mapped,
    assignedTeamId: teamId || mapped.assignedTeamId,
    assignedTeamName:
      mapped.assignedTeamName ||
      (team ? `${team.name} – ${team.leadShort}` : mapped.assignedTeamName),
    processStage:
      mapped.processStage ||
      (teamId === "t_hot"
        ? "hot_forge"
        : teamId === "t_auto"
          ? "auto"
          : teamId === "t_asm"
            ? "assembly"
            : undefined),
  };
}

// ── Repository class ─────────────────────────────────────────────────────────

export class SupabaseOrderRepository {
  /** Load a single order with ALL nested data */
  async findById(id: string): Promise<ProductionOrder | null> {
    const { data: orderRow, error } = await supabase
      .from("production_orders")
      .select("*")
      .eq("id", id)
      .single<DbOrder>();
    if (error || !orderRow) return null;
    return this.hydrateOrders([orderRow]).then((arr) => arr[0] ?? null);
  }

  /** Load all orders */
  async findAll(): Promise<ProductionOrder[]> {
    const { data, error } = await supabase
      .from("production_orders")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<DbOrder[]>();
    if (error || !data) return [];
    return this.hydrateOrders(data);
  }

  async findPage(query: {
    from?: string;
    to?: string;
    dateField?: "created_at" | "deadline";
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ProductionOrder[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const field = query.dateField === "deadline" ? "deadline" : "created_at";
    let req = supabase.from("production_orders").select("*", { count: "exact" });
    if (query.from) {
      req = req.gte(field, field === "deadline" ? query.from : `${query.from}T00:00:00`);
    }
    if (query.to) {
      req = req.lte(field, field === "deadline" ? query.to : `${query.to}T23:59:59.999`);
    }
    if (query.status && query.status !== "all") req = req.eq("status", query.status);
    const text = (query.q ?? "").trim().replace(/[,()]/g, " ");
    if (text) {
      req = req.or(`order_no.ilike.%${text}%,product_line.ilike.%${text}%,customer.ilike.%${text}%`);
    }
    const fromIdx = (page - 1) * pageSize;
    const { data, error, count } = await req
      .order("created_at", { ascending: false })
      .range(fromIdx, fromIdx + pageSize - 1)
      .returns<DbOrder[]>();
    if (error || !data) return { items: [], total: 0, page, pageSize };
    const items = await this.hydrateOrders(data);
    return { items, total: count ?? items.length, page, pageSize };
  }

  /** Create order + BOMs. Nếu BOM fail sau khi đã insert order → xóa orphan. */
  async create(order: ProductionOrder): Promise<ProductionOrder> {
    const row = {
      id: order.id,
      order_no: order.orderNo,
      product_line: order.productLine,
      customer: order.customer,
      target_qty: order.targetQty,
      created_by: order.createdBy,
      created_at: order.createdAt,
      deadline: order.deadline,
      priority: order.priority,
      status: order.status,
      pending_approval: order.pendingApproval ?? false,
    };
    const { error } = await supabase.from("production_orders").insert(row);
    if (error) throw new Error(error.message);

    try {
      if (order.attachments?.length) {
        try {
          await this.insertOrderAttachments(order.id, order.attachments);
        } catch (attErr) {
          console.warn("[create] order attachments skipped:", (attErr as Error).message);
        }
      }
      for (const bom of order.boms ?? []) {
        await this.insertBOM(order.id, bom);
      }
    } catch (err) {
      await supabase.from("production_orders").delete().eq("id", order.id);
      throw err;
    }
    return (await this.findById(order.id))!;
  }

  /** Patch top-level order fields */
  async updateOrder(
    id: string,
    patch: Partial<Omit<ProductionOrder, "id" | "boms" | "attachments">>,
  ): Promise<ProductionOrder | null> {
    const row: Record<string, unknown> = {};
    if (patch.productLine !== undefined) row.product_line = patch.productLine;
    if (patch.customer !== undefined) row.customer = patch.customer;
    if (patch.targetQty !== undefined) row.target_qty = patch.targetQty;
    if (patch.deadline !== undefined) row.deadline = patch.deadline;
    if (patch.priority !== undefined) row.priority = patch.priority;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.pendingApproval !== undefined) row.pending_approval = patch.pendingApproval;
    if (patch.note !== undefined) row.note = patch.note;
    if (Object.keys(row).length) {
      const { error } = await supabase.from("production_orders").update(row).eq("id", id);
      if (error) throw new Error(error.message);
    }
    return this.findById(id);
  }

  /** Patch a BOM row */
  async updateBOM(bomId: string, patch: Partial<DbBom>): Promise<void> {
    const { error } = await supabase.from("boms").update(patch).eq("id", bomId);
    if (error) throw new Error(error.message);
  }

  /** Upsert team summary for a BOM */
  async upsertTeamSummary(bomId: string, summary: TeamSummary): Promise<void> {
    const row = {
      bom_id: bomId,
      pass_qty: summary.passQty,
      fail_qty: summary.failQty,
      note: summary.note,
      reported_by: summary.reportedBy,
      reported_at: summary.reportedAt,
    };
    const { error } = await supabase.from("team_summaries").upsert(row, { onConflict: "bom_id" });
    if (error) throw new Error(error.message);
  }

  /** Upsert QC report for a BOM */
  async upsertQCReport(bomId: string, report: QCReport): Promise<void> {
    const row = {
      bom_id: bomId,
      pass_qty: report.passQty,
      fail_qty: report.failQty,
      complaint: report.complaint,
      status: report.status,
      inspected_by: report.inspectedBy,
      inspected_at: report.inspectedAt,
    };
    const { error } = await supabase.from("qc_reports").upsert(row, { onConflict: "bom_id" });
    if (error) throw new Error(error.message);
  }

  /**
   * Submit a single measurement row for a worker.
   * Returns the assigned tt (sequence number).
   */
  async submitWorkerRow(
    bomId: string,
    data: { workerId: string; workerName: string; dims: string[] },
  ): Promise<number> {
    // Upsert entry record
    const entryId = `we-${bomId}-${data.workerId}`;
    const now = todayDateTime();
    const { error: entryErr } = await supabase.from("worker_entries").upsert(
      {
        id: entryId,
        bom_id: bomId,
        worker_id: data.workerId,
        worker_name: data.workerName,
        submitted_at: now,
      },
      { onConflict: "bom_id,worker_id" },
    );
    if (entryErr) throw new Error(entryErr.message);

    // Determine next tt using DB count
    const { count } = await supabase
      .from("worker_entry_rows")
      .select("*", { count: "exact", head: true })
      .eq("entry_id", entryId);
    const nextTt = (count ?? 0) + 1;

    const rowId = `wer-${entryId}-${nextTt}-${Date.now()}`;
    const { error: rowErr } = await supabase.from("worker_entry_rows").insert({
      id: rowId,
      entry_id: entryId,
      tt: nextTt,
      dims: data.dims,
      ngoai_quan: "",
    });
    if (rowErr) throw new Error(rowErr.message);

    // Update BOM status to in_progress
    await supabase
      .from("boms")
      .update({ status: "in_progress" })
      .eq("id", bomId)
      .neq("status", "team_reported")
      .neq("status", "qc_passed")
      .neq("status", "qc_failed");

    return nextTt;
  }

  // ── private helpers ────────────────────────────────────────────────────────

  private async insertOrderAttachments(orderId: string, attachments: Attachment[]): Promise<void> {
    const rows = attachments.map((a) => attachmentRow(a, "order_id", orderId));
    const { error } = await supabase.from("order_attachments").insert(rows);
    if (error) throw new Error(error.message);
  }

  private async insertBOM(orderId: string, bom: BOMItem): Promise<void> {
    const teamId = resolveBomTeamId(bom);
    const team = TEAMS.find((t) => t.id === teamId);
    // Đảm bảo group tồn tại (t_hot/…) trước khi gắn FK
    if (teamId) {
      await supabase.from("groups").upsert(
        {
          id: teamId,
          name: team?.name ?? bom.assignedTeamName ?? teamId,
          lead: team?.lead ?? "",
          lead_short: team?.leadShort ?? "",
        },
        { onConflict: "id" },
      );
    }

    const baseRow = {
      id: bom.id,
      production_order_id: orderId,
      bom_code: bom.bomCode,
      part_code: bom.partCode,
      part_name: bom.partName,
      raw_material: bom.rawMaterial,
      machine: bom.machine,
      process: bom.process,
      target_qty: bom.targetQty,
      pass_qty: bom.passQty,
      fail_qty: bom.failQty,
      assigned_group_name:
        bom.assignedTeamName ||
        (team ? `${team.name} – ${team.leadShort}` : ""),
      assigned_workers: bom.assignedWorkers,
      status: bom.status,
      spec_cols: bom.specCols,
      material_specs: bom.materialSpecs ?? null,
      tech_note: encodeTechNote(bom.techNote, {
        productCode: bom.partCode,
        shift: bom.shift,
        quota: bom.quota,
        workTime: bom.workTime,
        workerAssignments: bom.workerAssignments,
      }),
    };

    let { error } = await supabase.from("boms").insert({
      ...baseRow,
      assigned_group_id: teamId || null,
    });
    if (error && teamId) {
      ({ error } = await supabase.from("boms").insert({
        ...baseRow,
        assigned_group_id: null,
      }));
    }
    if (error) throw new Error(error.message);

    if (bom.attachments?.length) {
      const rows = bom.attachments.map((a) => attachmentRow(a, "bom_id", bom.id));
      const { error: attErr } = await supabase.from("bom_attachments").insert(rows);
      if (attErr) {
        console.warn("[insertBOM] attachments skipped:", attErr.message);
      }
    }
  }

  /** Append BOMs to an existing order (dùng sửa lệnh thiếu linh kiện) */
  async appendBoms(orderId: string, boms: BOMItem[]): Promise<ProductionOrder | null> {
    for (const bom of boms) {
      await this.insertBOM(orderId, bom);
    }
    return this.findById(orderId);
  }

  /** Hydrate a list of order rows with nested data (BOMs, entries, etc.) */
  private async hydrateOrders(orders: DbOrder[]): Promise<ProductionOrder[]> {
    if (orders.length === 0) return [];
    const orderIds = orders.map((o) => o.id);

    // Fetch everything in parallel
    const [
      { data: orderAttRows },
      { data: bomRows },
    ] = await Promise.all([
      supabase
        .from("order_attachments")
        .select("*")
        .in("order_id", orderIds)
        .returns<(DbAttachment & { order_id: string })[]>(),
      supabase
        .from("boms")
        .select("*")
        .in("production_order_id", orderIds)
        .returns<DbBom[]>(),
    ]);

    const bomIds = (bomRows ?? []).map((b) => b.id);

    const emptyAtt: (DbAttachment & { bom_id: string })[] = [];
    const emptyEntries: DbEntry[] = [];
    const emptyTeam: (DbTeamSummary & { bom_id: string })[] = [];
    const emptyQc: (DbQCReport & { bom_id: string })[] = [];

    const [
      { data: bomAttRows },
      { data: entryRows },
      { data: teamSummaryRows },
      { data: qcReportRows },
    ] = bomIds.length
      ? await Promise.all([
          supabase
            .from("bom_attachments")
            .select("*")
            .in("bom_id", bomIds)
            .returns<(DbAttachment & { bom_id: string })[]>(),
          supabase
            .from("worker_entries")
            .select("*")
            .in("bom_id", bomIds)
            .returns<DbEntry[]>(),
          supabase
            .from("team_summaries")
            .select("*")
            .in("bom_id", bomIds)
            .returns<(DbTeamSummary & { bom_id: string })[]>(),
          supabase
            .from("qc_reports")
            .select("*")
            .in("bom_id", bomIds)
            .returns<(DbQCReport & { bom_id: string })[]>(),
        ])
      : [
          { data: emptyAtt },
          { data: emptyEntries },
          { data: emptyTeam },
          { data: emptyQc },
        ];
    const entryIds = (entryRows ?? []).map((e) => e.id);
    const { data: dimensionRows } = await supabase
      .from("worker_entry_rows")
      .select("*")
      .in("entry_id", entryIds)
      .returns<DbRow[]>();

    // Index everything
    const orderAttByOrder = groupBy(orderAttRows ?? [], (r) => r.order_id);
    const bomsByOrder = groupBy(bomRows ?? [], (b) => b.production_order_id);
    const bomAttByBom = groupBy(bomAttRows ?? [], (r) => r.bom_id);
    const entriesByBom = groupBy(entryRows ?? [], (e) => e.bom_id);
    const rowsByEntry = groupBy(dimensionRows ?? [], (r) => r.entry_id);
    const teamSumByBom = new Map((teamSummaryRows ?? []).map((r) => [r.bom_id, r]));
    const qcByBom = new Map((qcReportRows ?? []).map((r) => [r.bom_id, r]));

    return orders.map((orderRow) => {
      const orderAtts = orderAttByOrder.get(orderRow.id) ?? [];
      const boms = (bomsByOrder.get(orderRow.id) ?? []).map((bom) =>
        mapBom(
          bom,
          bomAttByBom.get(bom.id) ?? [],
          entriesByBom.get(bom.id) ?? [],
          rowsByEntry,
          teamSumByBom.get(bom.id) ?? null,
          qcByBom.get(bom.id) ?? null,
        ),
      );
      return {
        id: orderRow.id,
        orderNo: orderRow.order_no,
        productLine: orderRow.product_line,
        customer: orderRow.customer,
        targetQty: orderRow.target_qty,
        createdBy: orderRow.created_by,
        createdAt: orderRow.created_at,
        deadline: orderRow.deadline,
        priority: orderRow.priority as ProductionOrder["priority"],
        status: orderRow.status as ProductionOrder["status"],
        pendingApproval: orderRow.pending_approval,
        productCode: boms[0]?.partCode,
        shift: boms[0]?.shift,
        quota: boms[0]?.quota,
        workTime: boms[0]?.workTime,
        attachments: orderAtts.map(mapAttachment),
        boms,
      };
    });
  }
}

function groupBy<T>(arr: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = key(item);
    const existing = map.get(k);
    if (existing) existing.push(item);
    else map.set(k, [item]);
  }
  return map;
}

export const supabaseOrderRepository = new SupabaseOrderRepository();
