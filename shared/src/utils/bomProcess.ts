import type { BOMItem, ProductionOrder } from "../types/index.js";
import { bomDoneQty } from "./productionProgress.js";

/** Gom quy trình theo catalog BOM; data cũ fallback theo linh kiện */
export function bomPartGroupKey(
  bom: Pick<BOMItem, "catalogBomId" | "partGroup" | "partName" | "partCode" | "id">,
): string {
  if (bom.catalogBomId) return `bom:${bom.catalogBomId}`;
  return (bom.partGroup || bom.partName || bom.partCode || bom.id).trim();
}

/** Quy trình đã xong (đủ SL hoặc đã báo cáo / QC) */
export function isBomProcessDone(bom: BOMItem): boolean {
  if (bom.status === "qc_passed" || bom.status === "team_reported") return true;
  const target = bom.targetQty || 0;
  if (target <= 0) return false;
  return bomDoneQty(bom) >= target;
}

/**
 * Trong cùng catalog BOM: hết quy trình seq nhỏ hơn mới mở seq hiện tại.
 * Quy trình của BOM khác (cùng linh kiện) không khóa nhau.
 * Job không có processSeq → luôn mở (legacy).
 */
export function isBomProcessUnlocked(order: ProductionOrder, bom: BOMItem): boolean {
  const seq = bom.processSeq;
  if (seq == null || seq <= 1) return true;
  const group = bomPartGroupKey(bom);
  const priors = order.boms.filter(
    (b) =>
      b.id !== bom.id &&
      bomPartGroupKey(b) === group &&
      (b.processSeq ?? 0) > 0 &&
      (b.processSeq ?? 0) < seq,
  );
  if (!priors.length) return true;
  return priors.every(isBomProcessDone);
}

export function bomProcessLockReason(order: ProductionOrder, bom: BOMItem): string | null {
  if (isBomProcessUnlocked(order, bom)) return null;
  const seq = bom.processSeq ?? 0;
  const group = bomPartGroupKey(bom);
  const prev = order.boms
    .filter((b) => bomPartGroupKey(b) === group && (b.processSeq ?? 0) === seq - 1)
    .sort((a, b) => (a.processSeq ?? 0) - (b.processSeq ?? 0))[0];
  const prevName = prev?.process || `quy trình ${seq - 1}`;
  return `Chưa xong «${prevName}» — hết quy trình trước mới mở quy trình này`;
}
