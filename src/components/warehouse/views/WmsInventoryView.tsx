import React, { useState } from "react";
import type { Company, InventoryItem, Product, Warehouse, WmsDataState } from "../../../types/wms";
import { exportToCsv } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsInventoryViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  scopedInventory: InventoryItem[];
  onOpenQuickCount: () => void;
}

export const WmsInventoryView: React.FC<WmsInventoryViewProps> = ({
  data,
  scopedWarehouses,
  scopedInventory,
  onOpenQuickCount,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterWh, setFilterWh] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Item Card Modal state
  const [selectedItem, setSelectedItem] = useState<{
    item: InventoryItem;
    product: Product;
  } | null>(null);

  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));
  const companyMap = new Map<string, Company>(data.companies.map((c) => [c.id, c]));

  // Daily Flow Calculations for selectedDate
  const dayTransactions = data.transactions.filter((tx) => tx.date.startsWith(selectedDate));

  const dailyInbound = dayTransactions
    .filter((tx) => tx.type === "inbound" || tx.type === "transfer_in")
    .reduce((sum, tx) => sum + Math.abs(tx.change), 0);

  const dailyOutbound = dayTransactions
    .filter((tx) => tx.type === "outbound" || tx.type === "transfer_out")
    .reduce((sum, tx) => sum + Math.abs(tx.change), 0);

  const netDelta = dailyInbound - dailyOutbound;

  const countRecordsOnDay = data.inventoryCounts.filter((c) => c.countedAt.startsWith(selectedDate));
  const dailyCountDelta = countRecordsOnDay.reduce((sum, c) => sum + (c.delta || 0), 0);

  // Filtered rows
  const filteredInventory = scopedInventory.filter((row) => {
    if (filterWh !== "all" && row.warehouseId !== filterWh) return false;
    const prod = productMap.get(row.productId);
    if (!prod) return false;
    if (filterCategory !== "all" && prod.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        row.productId.toLowerCase().includes(q) ||
        prod.name.toLowerCase().includes(q) ||
        row.lot.toLowerCase().includes(q) ||
        row.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories = Array.from(new Set(data.products.map((p) => p.category)));

  // Total valuation
  const totalValuation = filteredInventory.reduce((sum, row) => {
    const prod = productMap.get(row.productId);
    return sum + (prod?.costPrice || 0) * row.onHand;
  }, 0);

  const handleExportCsv = () => {
    const headers = [
      "Mã hàng",
      "Tên hàng hóa",
      "Nhóm",
      "Kho lưu trữ",
      "Vị trí",
      "Số lô",
      "Hạn dùng",
      "Tồn kho thực tế",
      "ĐVT",
      "Đơn giá vốn",
      "Tổng giá trị (VNĐ)",
      "Định mức Min",
    ];

    const rows = filteredInventory.map((row) => {
      const prod = productMap.get(row.productId);
      const wh = warehouseMap.get(row.warehouseId);
      const val = (prod?.costPrice || 0) * row.onHand;
      return [
        row.productId,
        prod?.name || "",
        prod?.category || "",
        wh?.name || row.warehouseId,
        row.location,
        row.lot,
        row.expiry || "",
        row.onHand,
        prod?.unit || "",
        prod?.costPrice || 0,
        val,
        prod?.min || 0,
      ];
    });

    exportToCsv(`Bao_cao_ton_kho_${selectedDate}.csv`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Quản lý tồn kho & Sổ kho theo ngày</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Theo dõi dòng luân chuyển hàng ngày, chi tiết thẻ kho, số lô, hạn sử dụng và định mức an toàn.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenQuickCount}
            className="h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 border border-border hover:bg-surface-2"
          >
            <WmsIcon name="count" size={14} />
            <span>Kiểm kê tồn kho</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8 px-3 rounded-md border border-border bg-card text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/10"
          >
            <WmsIcon name="download" size={14} />
            <span>Xuất CSV (Excel UTF-8)</span>
          </button>
        </div>
      </div>

      {/* Daily Flow Banner */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <WmsIcon name="calendar" size={18} />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Biến động kho ngày đã chọn</span>
              <div className="text-[11px] text-muted-foreground">
                Số liệu nhập, xuất và chênh lệch ròng trong ngày
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Chọn ngày xem:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-8 px-2.5 rounded-md border border-border bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
          <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/15">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              Nhập kho trong ngày
            </div>
            <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-0.5">
              +{dailyInbound.toLocaleString("vi-VN")}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Xuất kho trong ngày
            </div>
            <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
              -{dailyOutbound.toLocaleString("vi-VN")}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15">
            <div className="text-[11px] font-semibold text-primary">Biến động ròng (Net Delta)</div>
            <div
              className={`text-lg font-black mt-0.5 ${
                netDelta >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {netDelta > 0 ? `+${netDelta.toLocaleString("vi-VN")}` : netDelta.toLocaleString("vi-VN")}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/15 border border-border">
            <div className="text-[11px] font-semibold text-muted-foreground">Chênh lệch kiểm kê</div>
            <div className="text-lg font-black text-foreground mt-0.5">
              {dailyCountDelta !== 0
                ? `${dailyCountDelta > 0 ? "+" : ""}${dailyCountDelta.toLocaleString("vi-VN")}`
                : "0"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã hàng, tên sản phẩm, số lô, vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <WmsIcon name="search" size={14} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterWh}
            onChange={(e) => setFilterWh(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả kho trong phạm vi</option>
            {scopedWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {w.name}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả nhóm hàng</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã hàng</th>
                <th className="py-2.5 px-3">Tên sản phẩm / vật tư</th>
                <th className="py-2.5 px-3">Kho lưu trữ</th>
                <th className="py-2.5 px-3">Vị trí</th>
                <th className="py-2.5 px-3">Số lô</th>
                <th className="py-2.5 px-3">Hạn dùng</th>
                <th className="py-2.5 px-3 text-right">Tồn thực tế</th>
                <th className="py-2.5 px-3 text-right">Đơn giá vốn</th>
                <th className="py-2.5 px-3 text-right">Tổng giá trị</th>
                <th className="py-2.5 px-3">Trạng thái an toàn</th>
                <th className="py-2.5 px-3 text-right">Thẻ kho</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy dữ liệu tồn kho theo tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((row) => {
                  const prod = productMap.get(row.productId);
                  const wh = warehouseMap.get(row.warehouseId);
                  const val = (prod?.costPrice || 0) * row.onHand;
                  const isLow = prod && row.onHand <= prod.min;
                  const isOver = prod && prod.max > 0 && row.onHand >= prod.max;

                  return (
                    <tr key={row.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{row.productId}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-foreground">{prod?.name || "—"}</div>
                        <div className="text-[10px] text-muted-foreground">{prod?.category}</div>
                      </td>
                      <td className="py-2.5 px-3">{wh?.name || row.warehouseId}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{row.location}</td>
                      <td className="py-2.5 px-3 font-mono">{row.lot}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{row.expiry || "—"}</td>
                      <td className="py-2.5 px-3 text-right font-black text-sm">
                        <span className={isLow ? "text-red-600 dark:text-red-400" : ""}>
                          {row.onHand.toLocaleString("vi-VN")}
                        </span>{" "}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {prod?.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                        {prod?.costPrice ? `${prod.costPrice.toLocaleString("vi-VN")} đ` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                        {val ? `${val.toLocaleString("vi-VN")} đ` : "0 đ"}
                      </td>
                      <td className="py-2.5 px-3">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 border border-red-500/20">
                            Cảnh báo: Dưới Min ({prod?.min})
                          </span>
                        ) : isOver ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Vượt Max ({prod?.max})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-600 border border-green-500/20">
                            Mức tồn an toàn
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => prod && setSelectedItem({ item: row, product: prod })}
                          className="h-6 px-2.5 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Xem thẻ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-4 py-3 bg-muted/20 border-t border-border flex flex-wrap items-center justify-between text-xs font-semibold">
          <span>{filteredInventory.length} dòng tồn kho</span>
          <div className="flex items-center gap-4">
            <span>
              Tổng định giá tồn kho:{" "}
              <strong className="text-primary font-bold text-sm">
                {totalValuation.toLocaleString("vi-VN")} đ
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Item Card Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold tracking-tight">
                  Thẻ kho chi tiết: {selectedItem.product.name} ({selectedItem.product.id})
                </h2>
                <div className="text-[11px] text-muted-foreground">
                  Phân loại: {selectedItem.product.category} · ĐVT: {selectedItem.product.unit}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Tồn tại kho này
                  </div>
                  <div className="text-base font-black text-foreground mt-1">
                    {selectedItem.item.onHand.toLocaleString("vi-VN")} {selectedItem.product.unit}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Đơn giá vốn
                  </div>
                  <div className="text-base font-black text-primary mt-1">
                    {selectedItem.product.costPrice?.toLocaleString("vi-VN")} đ
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Số lô / Vị trí
                  </div>
                  <div className="text-base font-black text-foreground mt-1 truncate">
                    {selectedItem.item.lot} · {selectedItem.item.location}
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-border bg-muted/10">
                  <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                    Định mức (Min/Max)
                  </div>
                  <div className="text-base font-black text-foreground mt-1">
                    {selectedItem.product.min} - {selectedItem.product.max}
                  </div>
                </div>
              </div>

              {/* Transactions History for this Product */}
              <div>
                <h3 className="font-bold text-xs mb-2">Lịch sử giao dịch sổ kho của mặt hàng</h3>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                        <th className="py-2 px-2.5">Mã GD</th>
                        <th className="py-2 px-2.5">Thời điểm</th>
                        <th className="py-2 px-2.5">Loại</th>
                        <th className="py-2 px-2.5">Kho</th>
                        <th className="py-2 px-2.5 text-right">Trước</th>
                        <th className="py-2 px-2.5 text-right">Biến động</th>
                        <th className="py-2 px-2.5 text-right">Sau</th>
                        <th className="py-2 px-2.5">Người làm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.transactions
                        .filter((tx) => tx.productId === selectedItem.product.id)
                        .map((tx) => (
                          <tr key={tx.id}>
                            <td className="py-2 px-2.5 font-mono text-primary">{tx.id}</td>
                            <td className="py-2 px-2.5 text-muted-foreground">{tx.date}</td>
                            <td className="py-2 px-2.5">
                              {tx.type === "inbound"
                                ? "Nhập kho"
                                : tx.type === "outbound"
                                  ? "Xuất kho"
                                  : "Chuyển kho"}
                            </td>
                            <td className="py-2 px-2.5">{tx.warehouseId}</td>
                            <td className="py-2 px-2.5 text-right font-mono">{tx.before}</td>
                            <td
                              className={`py-2 px-2.5 text-right font-mono font-bold ${
                                tx.change > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {tx.change > 0 ? `+${tx.change}` : tx.change}
                            </td>
                            <td className="py-2 px-2.5 text-right font-mono font-bold">{tx.after}</td>
                            <td className="py-2 px-2.5 text-muted-foreground">{tx.actor}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="h-8 px-4 rounded-md border border-border text-xs font-semibold hover:bg-muted/10"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

