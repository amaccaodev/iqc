import type {
  EmployeeProductRate,
  ShiftClose,
  ShiftCloseStatus,
  ShiftUnlockRequest,
} from "../../../shared/src/types/index.js";
import {
  assertCanCreateShiftClose,
  assertCanRequestUnlock,
} from "../../../shared/src/utils/shiftCloseGuard.js";

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const rates: EmployeeProductRate[] = [
  { id: "epr-u6-p1", userId: "u6", productId: "p1", rateVnd: 2500 },
  { id: "epr-u7-p1", userId: "u7", productId: "p1", rateVnd: 2200 },
];

const closes: ShiftClose[] = [
  {
    id: "sc-demo-1",
    orderId: "o1",
    bomId: "b1",
    workerId: "u6",
    workerName: "Cường 2T3",
    productId: "p1",
    productName: "Van 1 chiều lò xo NOVO 20",
    partName: "Van 1 chiều lò xo NOVO 20",
    passQty: 80,
    failQty: 2,
    note: "Ca sáng demo",
    status: "approved",
    rateVnd: 2500,
    amountVnd: 200000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    teamleadBy: "Phạm Văn Chí",
    teamleadAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
    qcBy: "T.V.Huấn",
    qcAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
    supervisorBy: "Lê Văn Quốc",
    supervisorAt: new Date(Date.now() - 86400000 * 2 + 10800000).toISOString(),
  },
  {
    id: "sc-demo-2",
    orderId: "o1",
    bomId: "b1",
    workerId: "u6",
    workerName: "Cường 2T3",
    productId: "p1",
    productName: "Van 1 chiều lò xo NOVO 20",
    partName: "Van 1 chiều lò xo NOVO 20",
    passQty: 95,
    failQty: 1,
    note: "Ca chiều demo",
    status: "approved",
    rateVnd: 2500,
    amountVnd: 237500,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    teamleadBy: "Phạm Văn Chí",
    teamleadAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
    qcBy: "T.V.Huấn",
    qcAt: new Date(Date.now() - 86400000 + 7200000).toISOString(),
    supervisorBy: "Lê Văn Quốc",
    supervisorAt: new Date(Date.now() - 86400000 + 10800000).toISOString(),
  },
  {
    id: "sc-demo-pending",
    orderId: "o1",
    bomId: "b1",
    workerId: "u6",
    workerName: "Cường 2T3",
    productId: "p1",
    productName: "Van 1 chiều lò xo NOVO 20",
    partName: "Van 1 chiều lò xo NOVO 20",
    passQty: 40,
    failQty: 0,
    note: "Ca sáng — chờ tổ trưởng (demo chấm đỏ Quản đốc)",
    status: "pending_teamlead",
    rateVnd: 2500,
    amountVnd: 100000,
    createdAt: new Date().toISOString(),
  },
];

const unlocks: ShiftUnlockRequest[] = [];

const NEXT: Record<Exclude<ShiftCloseStatus, "approved" | "rejected">, ShiftCloseStatus> = {
  pending_teamlead: "pending_qc",
  pending_qc: "pending_supervisor",
  pending_supervisor: "approved",
};

export const shiftSalaryStore = {
  listRates(userId?: string) {
    return userId ? rates.filter((r) => r.userId === userId) : [...rates];
  },
  getRate(userId: string, productId: string) {
    return rates.find((r) => r.userId === userId && r.productId === productId) ?? null;
  },
  upsertRate(userId: string, productId: string, rateVnd: number) {
    const existing = rates.find((r) => r.userId === userId && r.productId === productId);
    if (existing) {
      existing.rateVnd = rateVnd;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }
    const row: EmployeeProductRate = {
      id: id("epr"),
      userId,
      productId,
      rateVnd,
      updatedAt: new Date().toISOString(),
    };
    rates.push(row);
    return row;
  },
  listCloses(filter?: { status?: string; workerId?: string; orderId?: string; bomId?: string }) {
    let list = [...closes];
    if (filter?.status) list = list.filter((c) => c.status === filter.status);
    if (filter?.workerId) list = list.filter((c) => c.workerId === filter.workerId);
    if (filter?.orderId) list = list.filter((c) => c.orderId === filter.orderId);
    if (filter?.bomId) list = list.filter((c) => c.bomId === filter.bomId);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  getClose(cid: string) {
    return closes.find((c) => c.id === cid) ?? null;
  },
  createClose(input: Omit<ShiftClose, "id" | "status" | "amountVnd" | "createdAt" | "rateVnd"> & { rateVnd?: number }) {
    const scope = { workerId: input.workerId, orderId: input.orderId, bomId: input.bomId };
    assertCanCreateShiftClose(closes, unlocks, scope);
    const rate = input.rateVnd ?? this.getRate(input.workerId, input.productId)?.rateVnd ?? 0;
    const row: ShiftClose = {
      ...input,
      id: id("sc"),
      status: "pending_teamlead",
      rateVnd: rate,
      amountVnd: 0,
      createdAt: new Date().toISOString(),
    };
    closes.unshift(row);
    return row;
  },
  listUnlocks(filter?: { status?: string; workerId?: string; orderId?: string; bomId?: string }) {
    let list = [...unlocks];
    if (filter?.status) list = list.filter((u) => u.status === filter.status);
    if (filter?.workerId) list = list.filter((u) => u.workerId === filter.workerId);
    if (filter?.orderId) list = list.filter((u) => u.orderId === filter.orderId);
    if (filter?.bomId) list = list.filter((u) => u.bomId === filter.bomId);
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  requestUnlock(input: {
    orderId: string;
    bomId: string;
    workerId: string;
    workerName: string;
    partName: string;
    reason?: string;
  }) {
    const scope = { workerId: input.workerId, orderId: input.orderId, bomId: input.bomId };
    assertCanRequestUnlock(closes, unlocks, scope);
    const row: ShiftUnlockRequest = {
      id: id("su"),
      orderId: input.orderId,
      bomId: input.bomId,
      workerId: input.workerId,
      workerName: input.workerName,
      partName: input.partName,
      reason: (input.reason ?? "").trim() || "Xin mở khóa để chốt ca tiếp trong ngày",
      status: "pending_teamlead",
      createdAt: new Date().toISOString(),
    };
    unlocks.unshift(row);
    return row;
  },
  reviewUnlock(id: string, approved: boolean, reviewerName: string, rejectReason = "") {
    const row = unlocks.find((u) => u.id === id);
    if (!row) throw new Error("Không tìm thấy yêu cầu mở khóa");
    if (row.status !== "pending_teamlead") throw new Error("Yêu cầu không còn chờ tổ trưởng");
    row.status = approved ? "approved" : "rejected";
    row.reviewedBy = reviewerName;
    row.reviewedAt = new Date().toISOString();
    if (!approved) row.rejectReason = rejectReason;
    return row;
  },
  reviewClose(
    cid: string,
    stage: "teamlead" | "qc" | "supervisor",
    approved: boolean,
    reviewerName: string,
    rejectReason = "",
  ) {
    const row = closes.find((c) => c.id === cid);
    if (!row) throw new Error("Không tìm thấy phiếu chốt ca");
    const expected: Record<typeof stage, ShiftCloseStatus> = {
      teamlead: "pending_teamlead",
      qc: "pending_qc",
      supervisor: "pending_supervisor",
    };
    if (row.status !== expected[stage]) throw new Error("Phiếu không ở bước duyệt này");
    const now = new Date().toISOString();
    if (!approved) {
      row.status = "rejected";
      row.rejectReason = rejectReason;
      if (stage === "teamlead") {
        row.teamleadBy = reviewerName;
        row.teamleadAt = now;
      } else if (stage === "qc") {
        row.qcBy = reviewerName;
        row.qcAt = now;
      } else {
        row.supervisorBy = reviewerName;
        row.supervisorAt = now;
      }
      return row;
    }
    if (stage === "teamlead") {
      row.teamleadBy = reviewerName;
      row.teamleadAt = now;
      row.status = NEXT.pending_teamlead;
    } else if (stage === "qc") {
      row.qcBy = reviewerName;
      row.qcAt = now;
      row.status = NEXT.pending_qc;
    } else {
      row.supervisorBy = reviewerName;
      row.supervisorAt = now;
      row.status = NEXT.pending_supervisor;
      row.amountVnd = Math.round(row.passQty * row.rateVnd);
    }
    return row;
  },
};
