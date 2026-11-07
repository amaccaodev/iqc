import React, { useState } from "react";
import type { Warehouse, WmsDataState, WmsDocument } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsTransferViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  scopedDocs: WmsDocument[];
  onOpenDoc: (doc: WmsDocument) => void;
  onOpenNewTransfer: () => void;
}

export const WmsTransferView: React.FC<WmsTransferViewProps> = ({
  data,
  scopedWarehouses,
  scopedDocs,
  onOpenDoc,
  onOpenNewTransfer,
}) => {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filterSourceWh, setFilterSourceWh] = useState("all");
  const [filterTargetWh, setFilterTargetWh] = useState("all");

  const transferDocs = scopedDocs.filter((d) => d.type === "transfer");

  const filteredDocs = transferDocs.filter((doc) => {
    // Tab filter
    if (tab === "pending" && doc.status !== "pending") return false;
    if (tab === "in_transit" && doc.status !== "in_transit") return false;
    if (tab === "partially_received" && doc.status !== "partially_received") return false;
    if (tab === "completed" && doc.status !== "completed") return false;

    // Warehouses
    if (filterSourceWh !== "all" && doc.warehouseId !== filterSourceWh) return false;
    if (filterTargetWh !== "all" && doc.targetWarehouseId !== filterTargetWh) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        doc.id.toLowerCase().includes(q) ||
        (doc.reference || "").toLowerCase().includes(q) ||
        (doc.creator || "").toLowerCase().includes(q)
      );
    }

    return true;
  });

  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Điều chuyển kho nội bộ (Inter-warehouse Transfer)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quy trình khép kín: Lập & Duyệt → Xuất kho gửi (đang vận chuyển) → Nhận tại kho đích → Xử lý chênh lệch.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewTransfer}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
        >
          <WmsIcon name="plus" size={14} />
          <span>Lập lệnh điều chuyển</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
        {[
          ["all", "Tất cả"],
          ["pending", "Chờ duyệt"],
          ["in_transit", "Đang vận chuyển"],
          ["partially_received", "Đã nhận một phần"],
          ["completed", "Đã hoàn thành"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
              tab === key
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã lệnh, số yêu cầu, người tạo..."
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
            value={filterSourceWh}
            onChange={(e) => setFilterSourceWh(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả kho xuất (nguồn)</option>
            {scopedWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {w.name}
              </option>
            ))}
          </select>

          <select
            value={filterTargetWh}
            onChange={(e) => setFilterTargetWh(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả kho đích (nhận)</option>
            {data.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã lệnh</th>
                <th className="py-2.5 px-3">Tuyến điều chuyển (Nguồn → Đích)</th>
                <th className="py-2.5 px-3">Mã yêu cầu</th>
                <th className="py-2.5 px-3">Ngày lập</th>
                <th className="py-2.5 px-3 text-right">SL Đề xuất</th>
                <th className="py-2.5 px-3 text-right">SL Đã xuất</th>
                <th className="py-2.5 px-3 text-right">SL Đã nhận</th>
                <th className="py-2.5 px-3">Người tạo</th>
                <th className="py-2.5 px-3">Tiến độ điều chuyển</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy lệnh điều chuyển nào.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const source = warehouseMap.get(doc.warehouseId);
                  const target = warehouseMap.get(doc.targetWarehouseId || "");

                  const totalReq = doc.items.reduce((s, it) => s + (it.requestedQty || it.qty), 0);
                  const totalShipped = doc.items.reduce((s, it) => s + (it.shippedQty || 0), 0);
                  const totalRecv = doc.items.reduce((s, it) => s + (it.receivedQty || 0), 0);

                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                    in_transit: "bg-teal-500/10 text-teal-600 border-teal-500/20",
                    partially_received: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
                    completed: "bg-green-500/10 text-green-600 border-green-500/20",
                  };

                  return (
                    <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{doc.id}</td>
                      <td className="py-2.5 px-3 font-medium">
                        <span className="text-foreground">{source?.name || doc.warehouseId}</span>
                        <span className="text-muted-foreground mx-1.5">→</span>
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">
                          {target?.name || doc.targetWarehouseId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{doc.reference || "—"}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{doc.documentDate}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {totalReq.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-600">
                        {totalShipped.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-green-600">
                        {totalRecv.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{doc.creator}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            statusColors[doc.status] || "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {doc.status === "in_transit"
                            ? "Đang vận chuyển"
                            : doc.status === "partially_received"
                              ? "Đã nhận một phần"
                              : doc.status === "completed"
                                ? "Hoàn thành"
                                : doc.status === "approved"
                                  ? "Chờ xuất kho"
                                  : "Chờ duyệt"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDoc(doc)}
                          className="h-6 px-2.5 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Xử lý
                        </button>
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

