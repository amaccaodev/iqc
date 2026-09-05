/** Tính lấy kho / còn thiếu / dư khi GĐ giao lệnh. */

export function planStockUse(input: {
  need: number;
  stockQty: number;
  useFromStock: boolean;
  /** SL muốn lấy từ kho; trống = lấy hết phần cần (tối đa tồn). */
  stockUseQty?: number;
}) {
  const need = Math.max(0, Math.ceil(Number(input.need) || 0));
  const stockQty = Math.max(0, Number(input.stockQty) || 0);
  let stockUseQty = 0;
  if (input.useFromStock) {
    const raw = input.stockUseQty;
    const requested =
      raw === undefined || raw === null || Number.isNaN(Number(raw))
        ? Math.min(need, stockQty)
        : Math.max(0, Number(raw) || 0);
    stockUseQty = Math.min(stockQty, requested);
  }
  const produceQty = Math.max(0, need - stockUseQty);
  const surplus = Math.max(0, stockQty - need);
  const leftover = Math.max(0, stockQty - stockUseQty);
  return {
    need,
    stockQty,
    stockUseQty,
    produceQty,
    /** Thiếu so với nhu cầu — phải SX */
    shortage: produceQty,
    /** Dư kho so với nhu cầu (chưa trừ) */
    surplus,
    leftover,
    covered: need > 0 && produceQty === 0,
  };
}
