import React, { useState } from "react";
import type { Warehouse, WmsDataState } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsCountViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  onOpenNewCount: () => void;
}

export const WmsCountView: React.FC<WmsCountViewProps> = ({
  data,
  scopedWarehouses,
  onOpenNewCount,
}) => {
  const [filterWh, setFilterWh] = useState("all");
  const [search, setSearch] = useState("");

  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));

  const scopedCounts = (data.inventoryCounts || []).filter((c) => {
    if (filterWh !== "all" && c.warehouseId !== filterWh) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.sessionId.toLowerCase().includes(q) ||
        c.productId.toLowerCase().includes(q) ||
        c.lot.toLowerCase().includes(q) ||
        c.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kiểm kê kho (Inventory Count)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lịch sử các phiên kiểm kê, đối soát số liệu hệ thống và thực tế, phát hiện chênh lệch thừa/thiếu.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewCount}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
        >
          <WmsIcon name="count" size={14} />
          <span>Bắt đầu phiên kiểm kê mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã phiên (IC-...), mã hàng, lô, người kiểm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <WmsIcon name="search" size={14} />
            </div>
          </div>
        </div>

        <select
          value={filterWh}
          onChange={(e) => setFilterWh(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả kho</option>
          {scopedWarehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id} · {w.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã phiên</th>
                <th className="py-2.5 px-3">Kho kiểm kê</th>
                <th className="py-2.5 px-3">Mã hàng</th>
                <th className="py-2.5 px-3">Số lô</th>
                <th className="py-2.5 px-3 text-right">Tồn hệ thống</th>
                <th className="py-2.5 px-3 text-right">Thực đếm</th>
                <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                <th className="py-2.5 px-3">Người kiểm kê</th>
                <th className="py-2.5 px-3">Thời điểm ghi nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scopedCounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Chưa có phiên kiểm kê nào được lưu. Bấm "Bắt đầu phiên kiểm kê mới" để thực hiện.
                  </td>
                </tr>
              ) : (
                scopedCounts.map((c) => {
                  const wh = warehouseMap.get(c.warehouseId);
                  const isMatch = c.delta === 0;
                  const isSurplus = c.delta !== null && c.delta > 0;
                  const isShortage = c.delta !== null && c.delta < 0;

                  return (
                    <tr key={c.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{c.sessionId}</td>
                      <td className="py-2.5 px-3">{wh?.name || c.warehouseId}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">{c.productId}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{c.lot}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {c.systemQty.toLocaleString("vi-VN")} {c.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-foreground">
                        {c.countedQty !== null ? `${c.countedQty.toLocaleString("vi-VN")} ${c.unit}` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {c.delta === null ? (
                          <span className="text-muted-foreground">—</span>
                        ) : isMatch ? (
                          <span className="text-green-600">Khớp (0)</span>
                        ) : isSurplus ? (
                          <span className="text-blue-600">+{c.delta} (Thừa)</span>
                        ) : (
                          <span className="text-red-600">{c.delta} (Thiếu)</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{c.actor}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(c.countedAt).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

