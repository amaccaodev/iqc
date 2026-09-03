import type { BOMItem, ProductionOrder, WorkerMachineAssignment } from "../types/index.js";

const PLAN_PREFIX = "[[PLAN]]";

export interface WorkPlan {
  productCode?: string;
  shift?: string;
  quota?: string;
  workTime?: string;
  workerAssignments?: WorkerMachineAssignment[];
}

export function encodeTechNote(note: string, plan?: WorkPlan): string {
  if (
    !plan ||
    (!plan.productCode &&
      !plan.shift &&
      !plan.quota &&
      !plan.workTime &&
      !(plan.workerAssignments && plan.workerAssignments.length))
  ) {
    return note;
  }
  return `${PLAN_PREFIX}${JSON.stringify(plan)}\n${note}`;
}

export function decodeTechNote(raw?: string): { note: string; plan: WorkPlan } {
  if (!raw) return { note: "", plan: {} };
  if (!raw.startsWith(PLAN_PREFIX)) return { note: raw, plan: {} };
  const nl = raw.indexOf("\n");
  const json = nl === -1 ? raw.slice(PLAN_PREFIX.length) : raw.slice(PLAN_PREFIX.length, nl);
  const note = nl === -1 ? "" : raw.slice(nl + 1);
  try {
    return { note, plan: JSON.parse(json) as WorkPlan };
  } catch {
    return { note: raw, plan: {} };
  }
}

export function applyPlanToBom(bom: BOMItem): BOMItem {
  const { note, plan } = decodeTechNote(bom.techNote);
  return {
    ...bom,
    techNote: note,
    shift: bom.shift || plan.shift,
    quota: bom.quota || plan.quota,
    workTime: bom.workTime || plan.workTime,
    partCode: bom.partCode || plan.productCode || "",
    workerAssignments: bom.workerAssignments?.length
      ? bom.workerAssignments
      : plan.workerAssignments,
  };
}

export const SHIFT_LABEL: Record<string, string> = {
  day: "Ca ngày",
  night: "Ca đêm",
  ot: "Ca tăng",
};

export function shiftLabel(shift?: string): string {
  if (!shift) return "—";
  return SHIFT_LABEL[shift] ?? shift;
}

export function genOrderNo(orders: ProductionOrder[]): string {
  const year = new Date().getFullYear();
  const sameYear = orders.filter((o) => o.orderNo.startsWith(`LSX-${year}`)).length;
  return `LSX-${year}-${String(sameYear + 1).padStart(3, "0")}`;
}

export function genBOMCode(orderNo: string, existingBoms: BOMItem[]): string {
  const base = orderNo.replace(/-/g, "");
  const seq = String(existingBoms.length + 1).padStart(3, "0");
  return `BOM-${base}-${seq}`;
}

export function today(): string {
  return new Date().toLocaleDateString("vi-VN");
}

export function todayDateTime(): string {
  return new Date().toLocaleString("vi-VN");
}

/** Lệnh GĐ vừa tạo, chờ Quản đốc duyệt BOM/quy trình (chưa phân tổ) */
export function orderNeedsSupervisorCreateApproval(order: ProductionOrder): boolean {
  if (!order.pendingApproval) return false;
  return !order.boms.some((b) => Boolean(b.assignedTeamId));
}

/** Đổi phân công tổ — chờ GĐ/PGĐ duyệt */
export function orderNeedsDirectorAssignApproval(order: ProductionOrder): boolean {
  if (!order.pendingApproval) return false;
  return order.boms.some((b) => Boolean(b.assignedTeamId));
}
