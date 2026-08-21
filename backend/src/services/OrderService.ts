import type {
  Attachment,
  BOMItem,
  BOMStatus,
  DimensionRow,
  OrderStatus,
  ProductionOrder,
  QCReport,
  TeamSummary,
  WorkerEntry,
} from "../../../shared/src/types/index.js";
import { TEAMS } from "../../../shared/src/constants/teams.js";
import { genBOMCode, genOrderNo, today, todayDateTime } from "../../../shared/src/utils/orderHelpers.js";
import { BaseService } from "../core/BaseService.js";
import type { OrderRepository } from "../repositories/OrderRepository.js";

export class OrderService extends BaseService<ProductionOrder> {
  constructor(private readonly orderRepo: OrderRepository) {
    super(orderRepo);
  }

  createOrder(
    data: Omit<ProductionOrder, "id" | "orderNo" | "createdAt" | "boms" | "attachments"> & {
      boms?: BOMItem[];
      attachments?: Attachment[];
    },
  ): ProductionOrder {
    const orders = this.getAll();
    const order: ProductionOrder = {
      id: `o${Date.now()}`,
      orderNo: genOrderNo(orders),
      createdAt: today(),
      boms: data.boms ?? [],
      attachments: data.attachments ?? [],
      productLine: data.productLine,
      customer: data.customer,
      targetQty: data.targetQty ?? 0,
      createdBy: data.createdBy,
      deadline: data.deadline,
      priority: data.priority,
      status: data.status ?? "draft",
      pendingApproval: data.pendingApproval ?? false,
    };
    return this.create(order);
  }

  addAttachment(orderId: string, attachment: Omit<Attachment, "id">): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const att: Attachment = { id: `a${Date.now()}`, ...attachment };
    return this.update(orderId, { attachments: [...order.attachments, att] })!;
  }

  addBOM(orderId: string, bomData: Omit<BOMItem, "id" | "bomCode">): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const bom: BOMItem = {
      ...bomData,
      id: `b${Date.now()}`,
      bomCode: genBOMCode(order.orderNo, order.boms),
      passQty: bomData.passQty ?? 0,
      failQty: bomData.failQty ?? 0,
      assignedWorkers: bomData.assignedWorkers ?? [],
      workerEntries: bomData.workerEntries ?? [],
      status: bomData.assignedTeamId ? "assigned" : "unassigned",
    };
    return this.update(orderId, { boms: [...order.boms, bom] })!;
  }

  assignWorkers(
    orderId: string,
    bomId: string,
    workerNames: string[],
    assignments?: Array<{
      workerId: string;
      workerName: string;
      machineId?: string;
      machineName: string;
    }>,
  ): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const names =
      assignments && assignments.length > 0
        ? assignments.map((a) => a.workerName)
        : workerNames;
    const primaryMachine = assignments?.find((a) => a.machineName)?.machineName;
    const boms = order.boms.map((b) =>
      b.id === bomId
        ? {
            ...b,
            assignedWorkers: names,
            workerAssignments: assignments ?? [],
            machine: primaryMachine || b.machine,
            status: (names.length ? "in_progress" : b.status) as BOMStatus,
          }
        : b,
    );
    return this.update(orderId, {
      boms,
      status:
        names.length && order.status === "approved"
          ? ("in_progress" as OrderStatus)
          : order.status,
    })!;
  }

  completeOrder(orderId: string, note?: string): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    return this.update(orderId, {
      status: "completed" as OrderStatus,
      note: note ? [order.note, note].filter(Boolean).join("\n") : order.note,
    })!;
  }

  assignBOM(orderId: string, bomId: string, teamId: string): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) throw new Error("Không tìm thấy tổ");
    const boms = order.boms.map((b) =>
      b.id === bomId
        ? {
            ...b,
            assignedTeamId: team.id,
            assignedTeamName: `${team.name} – ${team.leadShort}`,
            status: "assigned" as BOMStatus,
          }
        : b,
    );
    return this.update(orderId, {
      boms,
      pendingApproval: true,
      status: "pending_approval" as OrderStatus,
    })!;
  }

  approveOrder(orderId: string): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    return this.update(orderId, {
      pendingApproval: false,
      status: "approved" as OrderStatus,
    })!;
  }

  rejectOrder(orderId: string): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    return this.update(orderId, { pendingApproval: false })!;
  }

  submitTeamReport(
    orderId: string,
    bomId: string,
    summary: Omit<TeamSummary, "reportedAt">,
  ): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const ts: TeamSummary = { ...summary, reportedAt: today() };
    const boms = order.boms.map((b) =>
      b.id === bomId
        ? {
            ...b,
            teamSummary: ts,
            passQty: ts.passQty,
            failQty: ts.failQty,
            status: "team_reported" as BOMStatus,
          }
        : b,
    );
    return this.update(orderId, { boms })!;
  }

  submitWorkerEntry(orderId: string, bomId: string, entry: Omit<WorkerEntry, "id">): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const we: WorkerEntry = { id: this.uniqueId("we"), ...entry, submittedAt: todayDateTime() };
    const boms = order.boms.map((b) =>
      b.id === bomId
        ? {
            ...b,
            workerEntries: [...b.workerEntries, we],
            status: "in_progress" as BOMStatus,
          }
        : b,
    );
    return this.update(orderId, { boms })!;
  }

  /** Nộp từng SP — server gán tt tuần tự, tránh trùng khi nhiều công nhân nộp cùng lúc */
  submitWorkerRow(
    orderId: string,
    bomId: string,
    data: { workerId: string; workerName: string; dims: string[] },
  ): { order: ProductionOrder; row: DimensionRow } {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const bom = order.boms.find((b) => b.id === bomId);
    if (!bom) throw new Error("Không tìm thấy BOM");

    const allRows = bom.workerEntries.flatMap((e) => e.rows);
    const nextTt = allRows.length > 0 ? Math.max(...allRows.map((r) => r.tt)) + 1 : 1;
    const row = { tt: nextTt, dims: data.dims, ngoaiQuan: "" };

    const existing = bom.workerEntries.find((e) => e.workerId === data.workerId);
    const workerEntries = existing
      ? bom.workerEntries.map((e) =>
          e.workerId === data.workerId
            ? { ...e, rows: [...e.rows, row], submittedAt: todayDateTime() }
            : e,
        )
      : [
          ...bom.workerEntries,
          {
            id: this.uniqueId("we"),
            workerId: data.workerId,
            workerName: data.workerName,
            submittedAt: todayDateTime(),
            rows: [row],
          },
        ];

    const boms = order.boms.map((b) =>
      b.id === bomId ? { ...b, workerEntries, status: "in_progress" as BOMStatus } : b,
    );
    const updated = this.update(orderId, { boms })!;
    return { order: updated, row };
  }

  private uniqueId(prefix: string): string {
    return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  submitQCReport(
    orderId: string,
    bomId: string,
    report: Omit<QCReport, "inspectedAt">,
    passed: boolean,
  ): ProductionOrder {
    const order = this.getById(orderId);
    if (!order) throw new Error("Không tìm thấy lệnh sản xuất");
    const qc: QCReport = { ...report, inspectedAt: today() };
    const boms = order.boms.map((b) =>
      b.id === bomId
        ? {
            ...b,
            qcReport: qc,
            status: (passed ? "qc_passed" : "qc_failed") as BOMStatus,
          }
        : b,
    );
    return this.update(orderId, { boms })!;
  }

  getStats() {
    const orders = this.getAll();
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
