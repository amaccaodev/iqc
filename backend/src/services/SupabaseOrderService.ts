/**
 * SupabaseOrderService — async replacement for the in-memory OrderService.
 * All methods return Promises and interact with Supabase via SupabaseOrderRepository.
 */
import type {
  Attachment,
  BOMItem,
  BOMStatus,
  OrderStatus,
  ProductionOrder,
  QCReport,
  TeamSummary,
} from "../../../shared/src/types/index.js";
import { TEAMS } from "../../../shared/src/constants/teams.js";
import { genBOMCode, genOrderNo, today, todayDateTime } from "../../../shared/src/utils/orderHelpers.js";
import { supabaseOrderRepository as repo } from "../repositories/SupabaseOrderRepository.js";
import { orderMemoryStore } from "./OrderMemoryStore.js";

function uid(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class SupabaseOrderService {
  private async dbOrMemory(): Promise<ProductionOrder[]> {
    try {
      const rows = await repo.findAll();
      if (rows.length) return rows;
    } catch {
      /* schema chưa có trên Supabase */
    }
    return orderMemoryStore.all();
  }

  async getAll(): Promise<ProductionOrder[]> {
    return this.dbOrMemory();
  }

  async list(query: {
    from?: string;
    to?: string;
    dateField?: "created_at" | "deadline";
    status?: string;
    q?: string;
    page?: number;
    pageSize?: number;
  }) {
    try {
      const paged = await repo.findPage(query);
      if (paged.total > 0 || (paged.items?.length ?? 0) > 0) return paged;
    } catch {
      /* fallback */
    }
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    let items = await this.dbOrMemory();
    if (query.status && query.status !== "all") items = items.filter((o) => o.status === query.status);
    if (query.q) {
      const qn = query.q.toLowerCase();
      items = items.filter((o) =>
        `${o.orderNo} ${o.productLine} ${o.productCode ?? ""} ${o.customer}`.toLowerCase().includes(qn),
      );
    }
    const total = items.length;
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total, page, pageSize };
  }

  async getById(id: string): Promise<ProductionOrder | null> {
    try {
      const row = await repo.findById(id);
      if (row) return row;
    } catch {
      /* fallback */
    }
    return orderMemoryStore.findById(id);
  }

  async createOrder(
    data: Omit<ProductionOrder, "id" | "orderNo" | "createdAt" | "boms" | "attachments"> & {
      boms?: BOMItem[];
      attachments?: Attachment[];
    },
  ): Promise<ProductionOrder> {
    const existing = await repo.findAll();
    const order: ProductionOrder = {
      id: uid("o"),
      orderNo: genOrderNo(existing),
      createdAt: today(),
      boms: (data.boms ?? []).map((bom) => ({
        ...bom,
        shift: bom.shift || data.shift,
        quota: bom.quota || data.quota,
        workTime: bom.workTime || data.workTime,
        partCode: bom.partCode || data.productCode || "",
      })),
      attachments: data.attachments ?? [],
      productLine: data.productLine,
      customer: data.customer,
      targetQty: data.targetQty ?? 0,
      createdBy: data.createdBy,
      deadline: data.deadline,
      priority: data.priority,
      status: data.status ?? "draft",
      pendingApproval: data.pendingApproval ?? false,
      productCode: data.productCode,
      shift: data.shift,
      quota: data.quota,
      workTime: data.workTime,
    };
    return repo.create(order);
  }

  async addBOM(orderId: string, bomData: Omit<BOMItem, "id" | "bomCode">): Promise<ProductionOrder> {
    const order = await repo.findById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const bom: BOMItem = {
      ...bomData,
      id: uid("b"),
      bomCode: genBOMCode(order.orderNo, order.boms),
      passQty: bomData.passQty ?? 0,
      failQty: bomData.failQty ?? 0,
      assignedWorkers: bomData.assignedWorkers ?? [],
      workerEntries: [],
      status: bomData.assignedTeamId ? "assigned" : "unassigned",
    };
    // Insert BOM via the repository helper (private method exposure via upsert pattern)
    await (repo as unknown as { insertBOM(orderId: string, bom: BOMItem): Promise<void> }).insertBOM(
      orderId,
      bom,
    );
    return (await repo.findById(orderId))!;
  }

  async assignBOM(orderId: string, bomId: string, teamId: string): Promise<ProductionOrder> {
    const order = await repo.findById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) throw new Error("Không tìm thấy tổ");

    await repo.updateBOM(bomId, {
      assigned_group_id: team.id,
      assigned_group_name: `${team.name} – ${team.leadShort}`,
      status: "assigned",
    } as never);

    await repo.updateOrder(orderId, {
      pendingApproval: true,
      status: "pending_approval",
    });
    return (await repo.findById(orderId))!;
  }

  async assignWorkers(orderId: string, bomId: string, workerNames: string[]): Promise<ProductionOrder> {
    await repo.updateBOM(bomId, {
      assigned_workers: workerNames,
      status: (workerNames.length ? "in_progress" : "assigned") as BOMStatus,
    } as never);
    return (await repo.findById(orderId))!;
  }

  async approveOrder(orderId: string): Promise<ProductionOrder> {
    await repo.updateOrder(orderId, { pendingApproval: false, status: "approved" });
    return (await repo.findById(orderId))!;
  }

  async rejectOrder(orderId: string): Promise<ProductionOrder> {
    await repo.updateOrder(orderId, { pendingApproval: false });
    return (await repo.findById(orderId))!;
  }

  async submitTeamReport(
    orderId: string,
    bomId: string,
    summary: Omit<TeamSummary, "reportedAt">,
  ): Promise<ProductionOrder> {
    const ts: TeamSummary = { ...summary, reportedAt: today() };
    await repo.upsertTeamSummary(bomId, ts);
    await repo.updateBOM(bomId, {
      pass_qty: ts.passQty,
      fail_qty: ts.failQty,
      status: "team_reported",
    } as never);
    return (await repo.findById(orderId))!;
  }

  async submitWorkerRow(
    orderId: string,
    bomId: string,
    data: { workerId: string; workerName: string; dims: string[] },
  ): Promise<{ order: ProductionOrder; row: { tt: number; dims: string[]; ngoaiQuan: string } }> {
    const tt = await repo.submitWorkerRow(bomId, data);
    const order = (await repo.findById(orderId))!;
    return { order, row: { tt, dims: data.dims, ngoaiQuan: "" } };
  }

  async submitQCReport(
    orderId: string,
    bomId: string,
    report: Omit<QCReport, "inspectedAt">,
    passed: boolean,
  ): Promise<ProductionOrder> {
    const qc: QCReport = { ...report, inspectedAt: today() };
    await repo.upsertQCReport(bomId, qc);
    await repo.updateBOM(bomId, {
      status: passed ? "qc_passed" : "qc_failed",
    } as never);
    return (await repo.findById(orderId))!;
  }

  async addAttachment(orderId: string, attachment: Omit<Attachment, "id">): Promise<ProductionOrder> {
    const att: Attachment = { id: uid("a"), ...attachment };
    const rows = [
      {
        id: att.id,
        order_id: orderId,
        name: att.name,
        type: att.type,
        size: att.size,
        uploaded_by: att.uploadedBy,
        uploaded_at: att.uploadedAt,
      },
    ];
    const { createClient } = await import("@supabase/supabase-js");
    const { supabase } = await import("../lib/supabase.js");
    await supabase.from("order_attachments").insert(rows);
    return (await repo.findById(orderId))!;
  }

  async getStats() {
    const orders = await repo.findAll();
    const allBoms = orders.flatMap((o) => o.boms);
    const totalTarget = allBoms.reduce((s, b) => s + b.targetQty, 0);
    const totalPass = allBoms.reduce((s, b) => s + b.passQty, 0);
    const totalFail = allBoms.reduce((s, b) => s + b.failQty, 0);
    return {
      orderCount: orders.length,
      bomCount: allBoms.length,
      totalTarget,
      totalPass,
      totalFail,
      passRate: totalTarget > 0 ? Math.round((totalPass / totalTarget) * 100) : 0,
      pendingApproval: orders.filter((o) => o.pendingApproval).length,
    };
  }
}

export const supabaseOrderService = new SupabaseOrderService();
