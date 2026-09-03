/**
 * SupabaseOrderService — async replacement for the in-memory OrderService.
 * All methods return Promises and interact with Supabase via SupabaseOrderRepository.
 */
import type {
  Attachment,
  BOMItem,
  BOMStatus,
  CreateOrderFromProductRequest,
  OrderStatus,
  Priority,
  ProductionOrder,
  QCReport,
  TeamSummary,
  WorkerMachineAssignment,
} from "../../../shared/src/types/index.js";
import { measurementSpecsToMaterialSpecs } from "../../../shared/src/utils/specValidation.js";
import { TEAMS } from "../../../shared/src/constants/teams.js";
import {
  encodeTechNote,
  genBOMCode,
  genOrderNo,
  today,
  todayDateTime,
} from "../../../shared/src/utils/orderHelpers.js";
import { supabaseOrderRepository as repo } from "../repositories/SupabaseOrderRepository.js";
import { orderMemoryStore } from "./OrderMemoryStore.js";
import { catalogStore } from "./CatalogMemoryStore.js";

function uid(prefix: string) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function teamToStage(teamId?: string): import("../../../shared/src/types/index.js").ProcessStage | undefined {
  if (teamId === "t_hot") return "hot_forge";
  if (teamId === "t_auto") return "auto";
  if (teamId === "t_asm") return "assembly";
  return undefined;
}

function specsFromSemi(sp: { measurementSpecs?: import("../../../shared/src/types/index.js").MeasurementSpecMap }) {
  const materialSpecs = measurementSpecsToMaterialSpecs(sp.measurementSpecs ?? {});
  const specCols = materialSpecs.map((s) => s.label);
  while (specCols.length < 11) specCols.push("");
  return { materialSpecs, specCols };
}

function jobsFromSemi(
  sp: NonNullable<ReturnType<typeof catalogStore.getSemi>>,
  produceQty: number,
  stockUse: number,
  useFromStock: boolean,
  extraNote: string,
  processIds?: string[],
): BOMItem[] {
  const jobs: BOMItem[] = [];
  const { materialSpecs, specCols } = specsFromSemi(sp);
  const catalogBoms = catalogStore.listBoms(sp.id);
  const pick = processIds?.length ? new Set(processIds) : null;
  const attachments = catalogStore.listSemiAttachments(sp.id, true);

  const pushJob = (
    processName: string,
    seq: number,
    extra: Partial<BOMItem>,
  ) => {
    jobs.push({
      id: uid("b"),
      bomCode: "",
      partCode: sp.code,
      partName: sp.name,
      partGroup: sp.name,
      processSeq: seq,
      rawMaterial: sp.name,
      machine: "",
      process: processName,
      targetQty: produceQty,
      stockUseQty: jobs.length === 0 ? stockUse : 0,
      useFromStock: jobs.length === 0 ? useFromStock : false,
      passQty: 0,
      failQty: 0,
      assignedTeamId: "",
      assignedTeamName: "",
      assignedWorkers: [],
      status: "unassigned",
      specCols,
      materialSpecs: materialSpecs.length ? materialSpecs : undefined,
      techNote: extraNote,
      workerEntries: [],
      semiProductId: sp.id,
      attachments,
      ...extra,
    });
  };

  for (const bom of catalogBoms) {
    const steps = (bom.processes ?? []).filter((p) => !pick || pick.has(p.id));
    steps.forEach((step, idx) => {
      pushJob(step.name, step.sortOrder || idx + 1, {
        catalogBomId: bom.id,
        catalogBomName: bom.name,
        catalogProcessId: step.id,
        processStage: teamToStage(step.productionTeamId),
        quota: step.quotaPerShift ? String(step.quotaPerShift) : undefined,
      });
    });
  }

  if (pick && !jobs.length) return [];
  if (!jobs.length) {
    pushJob(catalogBoms[0]?.name ?? "", 1, {
      catalogBomId: catalogBoms[0]?.id,
      catalogBomName: catalogBoms[0]?.name,
    });
  }
  return jobs;
}

export class SupabaseOrderService {
  private async dbOrMemory(): Promise<ProductionOrder[]> {
    try {
      const rows = await repo.findAll();
      if (rows.length) {
        return Promise.all(rows.map((o) => this.ensureOrderHasBoms(o)));
      }
    } catch {
      /* schema chưa có trên Supabase */
    }
    return orderMemoryStore.all();
  }

  /**
   * Lệnh orphan (đã tạo header nhưng BOM insert fail) → gắn lại BTP từ danh mục.
   */
  private async ensureOrderHasBoms(order: ProductionOrder): Promise<ProductionOrder> {
    if (order.boms?.length) return order;

    const mem = orderMemoryStore.findById(order.id);
    if (mem?.boms?.length) {
      try {
        const fixed = await repo.appendBoms(order.id, mem.boms);
        if (fixed?.boms?.length) return fixed;
      } catch {
        return { ...order, boms: mem.boms, attachments: order.attachments?.length ? order.attachments : mem.attachments };
      }
      return { ...order, boms: mem.boms };
    }

    const productName = (order.productLine || "").split("·")[0]?.trim() || "";
    const product =
      (order.productId ? catalogStore.getProduct(order.productId) : undefined) ||
      catalogStore.listAllProducts().find(
        (p) => p.name === productName || productName.includes(p.name) || p.name.includes(productName),
      );
    if (!product) return order;

    const catalogBom = catalogStore.listBom(product.id);
    if (!catalogBom.length) return order;

    const rebuilt: BOMItem[] = [];
    for (const line of catalogBom) {
      const sp = catalogStore.getSemi(line.semiProductId);
      if (!sp) continue;
      const produceQty = Math.max(0, Math.ceil(order.targetQty * (line.qtyPerUnit || 1)));
      rebuilt.push(...jobsFromSemi(sp, produceQty, 0, false, ""));
    }
    if (!rebuilt.length) return order;

    const withCodes = rebuilt.map((bom, idx) => ({
      ...bom,
      bomCode: `BOM-${order.orderNo.replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}`,
    }));

    try {
      const fixed = await repo.appendBoms(order.id, withCodes);
      if (fixed?.boms?.length) return fixed;
    } catch {
      /* keep in-memory view */
    }
    return { ...order, boms: withCodes, productId: product.id, productCode: product.code };
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
      if (paged.total > 0 || (paged.items?.length ?? 0) > 0) {
        return {
          ...paged,
          items: await Promise.all(paged.items.map((o) => this.ensureOrderHasBoms(o))),
        };
      }
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
      if (row) return this.ensureOrderHasBoms(row);
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
    let existing: ProductionOrder[] = [];
    try {
      existing = await repo.findAll();
    } catch {
      existing = orderMemoryStore.all();
    }
    const order: ProductionOrder = {
      id: uid("o"),
      orderNo: genOrderNo(existing.length ? existing : orderMemoryStore.all()),
      createdAt: today(),
      boms: (data.boms ?? []).map((bom) => ({
        ...bom,
        id: bom.id || uid("b"),
        bomCode: bom.bomCode || "",
        shift: bom.shift || data.shift,
        quota: bom.quota || data.quota,
        workTime: bom.workTime || data.workTime,
        partCode: bom.partCode || data.productCode || "",
        passQty: bom.passQty ?? 0,
        failQty: bom.failQty ?? 0,
        assignedWorkers: bom.assignedWorkers ?? [],
        workerEntries: bom.workerEntries ?? [],
        status: bom.status ?? (bom.assignedTeamId ? "assigned" : "unassigned"),
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
      productId: data.productId,
      size: data.size,
      shift: data.shift,
      quota: data.quota,
      workTime: data.workTime,
      note: data.note,
    };
    // Gán bomCode
    order.boms = order.boms.map((bom, idx) => ({
      ...bom,
      bomCode: bom.bomCode || `BOM-${order.orderNo.replace(/-/g, "")}-${String(idx + 1).padStart(3, "0")}`,
    }));

    try {
      return await repo.create(order);
    } catch {
      return orderMemoryStore.upsert(order);
    }
  }

  /** Tạo lệnh từ danh mục thành phẩm + định mức BTP / dùng kho */
  async createOrderFromProduct(
    payload: CreateOrderFromProductRequest & { createdBy: string },
  ): Promise<ProductionOrder> {
    const product = catalogStore.getProduct(payload.productId);
    if (!product) throw new Error("Không tìm thấy sản phẩm trong danh mục");

    const boms: BOMItem[] = [];
    for (const line of payload.lines) {
      const sp = catalogStore.getSemi(line.semiProductId);
      if (!sp) continue;
      const stockUse = line.useFromStock ? Math.max(0, Number(line.stockUseQty) || 0) : 0;
      const produceQty = Math.max(0, Number(line.produceQty) || 0);
      if (stockUse > 0) catalogStore.consumeStock(sp.id, stockUse);
      const noteParts = [
        payload.note?.trim() ?? "",
        stockUse > 0 ? `Dùng kho: ${stockUse}` : "",
      ].filter(Boolean);
      boms.push(
        ...jobsFromSemi(
          sp,
          produceQty,
          stockUse,
          Boolean(line.useFromStock),
          noteParts.join("\n"),
          line.processIds,
        ),
      );
    }

    if (!boms.length) throw new Error("Cần ít nhất một dòng BTP");

    // Sắp xếp: theo linh kiện rồi processSeq, fallback công đoạn 3 tổ
    const stageOrder = { hot_forge: 0, auto: 1, assembly: 2 } as const;
    boms.sort((a, b) => {
      const ga = (a.partGroup || a.partName).localeCompare(b.partGroup || b.partName, "vi");
      if (ga !== 0) return ga;
      const sa = a.processSeq ?? 0;
      const sb = b.processSeq ?? 0;
      if (sa !== sb) return sa - sb;
      return (
        (stageOrder[a.processStage ?? "hot_forge"] ?? 9) -
        (stageOrder[b.processStage ?? "hot_forge"] ?? 9)
      );
    });

    const noteParts = [payload.note?.trim() ?? ""].filter(Boolean);
    const productAttachments = catalogStore.listProductAttachments(product.id, true);

    return this.createOrder({
      productId: product.id,
      productCode: product.code,
      productLine: product.name,
      customer: payload.customer ?? "Nội bộ",
      targetQty: payload.finishedQty,
      createdBy: payload.createdBy,
      deadline: payload.deadline,
      priority: payload.priority ?? "normal",
      status: "pending_approval",
      pendingApproval: true,
      shift: payload.shift,
      note: noteParts.join("\n") || undefined,
      boms,
      attachments: productAttachments,
    });
  }

  async createOrdersFromProductsBatch(
    payload: {
      deadline: string;
      note?: string;
      priority?: Priority;
      customer?: string;
      createdBy: string;
      items: Array<Omit<CreateOrderFromProductRequest, "deadline" | "note" | "priority" | "customer"> & {
        deadline?: string;
        note?: string;
      }>;
    },
  ): Promise<ProductionOrder[]> {
    if (!payload.items?.length) throw new Error("Thêm ít nhất một sản phẩm");
    const created: ProductionOrder[] = [];
    for (const item of payload.items) {
      const order = await this.createOrderFromProduct({
        ...item,
        deadline: item.deadline || payload.deadline,
        note: [payload.note, item.note].filter(Boolean).join("\n") || undefined,
        priority: payload.priority,
        customer: payload.customer,
        createdBy: payload.createdBy,
      });
      created.push(order);
    }
    return created;
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

  async assignWorkers(
    orderId: string,
    bomId: string,
    workerNames: string[],
    assignments?: WorkerMachineAssignment[],
  ): Promise<ProductionOrder> {
    const names =
      assignments && assignments.length > 0
        ? assignments.map((a) => a.workerName)
        : workerNames;
    const primaryMachine =
      assignments?.find((a) => a.machineName)?.machineName || undefined;

    const patchMemory = (order: ProductionOrder): ProductionOrder => ({
      ...order,
      boms: order.boms.map((b) =>
        b.id !== bomId
          ? b
          : {
              ...b,
              assignedWorkers: names,
              workerAssignments: assignments ?? [],
              machine: primaryMachine || b.machine,
              status: (names.length ? "in_progress" : "assigned") as BOMStatus,
            },
      ),
      status: names.length && order.status === "approved" ? "in_progress" : order.status,
    });

    try {
      const current = await repo.findById(orderId);
      const bom = current?.boms.find((b) => b.id === bomId);
      if (!current || !bom) throw new Error("Không tìm thấy BOM");
      await repo.updateBOM(bomId, {
        assigned_workers: names,
        machine: primaryMachine || bom.machine,
        status: (names.length ? "in_progress" : "assigned") as BOMStatus,
        tech_note: encodeTechNote(bom.techNote, {
          productCode: bom.partCode,
          shift: bom.shift,
          quota: bom.quota,
          workTime: bom.workTime,
          workerAssignments: assignments ?? [],
        }),
      } as never);
      if (names.length && current.status === "approved") {
        await repo.updateOrder(orderId, { status: "in_progress" });
      }
      return (await repo.findById(orderId))!;
    } catch {
      const mem = orderMemoryStore.findById(orderId);
      if (!mem) throw new Error("Không tìm thấy lệnh SX");
      return orderMemoryStore.upsert(patchMemory(mem));
    }
  }

  async completeOrder(orderId: string, note?: string): Promise<ProductionOrder> {
    try {
      const current = await repo.findById(orderId);
      if (!current) throw new Error("Không tìm thấy lệnh SX");
      await repo.updateOrder(orderId, {
        status: "completed",
        note: note
          ? [current.note, note].filter(Boolean).join("\n")
          : current.note,
      });
      return (await repo.findById(orderId))!;
    } catch {
      const mem = orderMemoryStore.findById(orderId);
      if (!mem) throw new Error("Không tìm thấy lệnh SX");
      return orderMemoryStore.upsert({
        ...mem,
        status: "completed",
        note: note ? [mem.note, note].filter(Boolean).join("\n") : mem.note,
      });
    }
  }

  async approveOrder(orderId: string): Promise<ProductionOrder> {
    try {
      await repo.updateOrder(orderId, { pendingApproval: false, status: "approved" });
      return (await repo.findById(orderId))!;
    } catch {
      const mem = orderMemoryStore.findById(orderId);
      if (!mem) throw new Error("Không tìm thấy lệnh SX");
      return orderMemoryStore.upsert({
        ...mem,
        pendingApproval: false,
        status: "approved",
      });
    }
  }

  async rejectOrder(orderId: string): Promise<ProductionOrder> {
    try {
      const current = await repo.findById(orderId);
      const unassigned = !current?.boms.some((b) => b.assignedTeamId);
      await repo.updateOrder(orderId, {
        pendingApproval: false,
        status: unassigned ? "draft" : current?.status,
      });
      return (await repo.findById(orderId))!;
    } catch {
      const mem = orderMemoryStore.findById(orderId);
      if (!mem) throw new Error("Không tìm thấy lệnh SX");
      const unassigned = !mem.boms.some((b) => b.assignedTeamId);
      return orderMemoryStore.upsert({
        ...mem,
        pendingApproval: false,
        status: unassigned ? "draft" : mem.status,
      });
    }
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
    const { supabase } = await import("../lib/supabase.js");
    const { error } = await supabase.from("order_attachments").insert({
      id: att.id,
      order_id: orderId,
      name: att.name,
      type: att.type,
      size: att.size,
      uploaded_by: att.uploadedBy,
      uploaded_at: att.uploadedAt,
      mime_type: att.mimeType ?? "",
      content_base64: att.contentBase64 ?? null,
      kind: att.kind ?? "other",
    });
    if (error) throw new Error(error.message);
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
