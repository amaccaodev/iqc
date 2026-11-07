import React, { useState } from "react";
import type { Warehouse, WmsDataState, WmsDocument } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsInboundViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  scopedDocs: WmsDocument[];
  onOpenDoc: (doc: WmsDocument) => void;
  onOpenNewInbound: () => void;
}

export const WmsInboundView: React.FC<WmsInboundViewProps> = ({
  data,
  scopedWarehouses,
  scopedDocs,
  onOpenDoc,
  onOpenNewInbound,
}) => {
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  const inboundDocs = scopedDocs.filter((d) => d.type === "inbound");

  const filteredDocs = inboundDocs.filter((doc) => {
    // Tab filter
    if (tab === "pending" && doc.status !== "pending") return false;
    if (tab === "approved" && !(doc.status === "approved" && !doc.posted)) return false;
    if (tab === "executed" && !(doc.posted || doc.status === "completed")) return false;
    if (tab === "rejected" && doc.status !== "rejected") return false;

    // Filters
    if (filterWarehouse !== "all" && doc.warehouseId !== filterWarehouse) return false;
    if (filterSource !== "all" && doc.inboundSource?.type !== filterSource) return false;
    if (filterDate && !doc.documentDate.startsWith(filterDate)) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const itemsText = doc.items.map((i) => `${i.productId} ${i.lot}`).join(" ").toLowerCase();
      return (
        doc.id.toLowerCase().includes(q) ||
        (doc.partner || "").toLowerCase().includes(q) ||
        (doc.reference || "").toLowerCase().includes(q) ||
        (doc.creator || "").toLowerCase().includes(q) ||
        itemsText.includes(q)
      );
    }

    return true;
  });

  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));

  const sourceLabels: Record<string, string> = {
    production: "Sản xuất nội bộ",
    purchase: "Mua từ NCC",
    return: "Hàng khách trả lại",
    external: "Nguồn bên ngoài khác",
    legacy: "Dữ liệu cũ",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Nghiệp vụ Nhập kho (Inbound)</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản trị quy trình 2 bước chuẩn: Phê duyệt chứng từ → Xác nhận nhập hàng thực tế vào sổ kho.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewInbound}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
        >
          <WmsIcon name="plus" size={14} />
          <span>Tạo phiếu nhập mới</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
        {[
          ["all", "Tất cả"],
          ["pending", "Chờ duyệt"],
          ["approved", "Chờ nhập thực tế"],
          ["executed", "Đã nhập thực tế"],
          ["rejected", "Từ chối"],
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
              placeholder="Tìm theo mã phiếu, NCC, PO, lệnh sản xuất, mặt hàng..."
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
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả kho nhận</option>
            {scopedWarehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} · {w.name}
              </option>
            ))}
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả nguồn nhập</option>
            <option value="purchase">Mua từ nhà cung cấp</option>
            <option value="production">Sản xuất nội bộ</option>
            <option value="return">Khách hàng trả lại</option>
            <option value="external">Nguồn ngoài khác</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-8 px-2 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã phiếu</th>
                <th className="py-2.5 px-3">Nguồn nhập</th>
                <th className="py-2.5 px-3">NCC / Đơn vị giao</th>
                <th className="py-2.5 px-3">Chứng từ tham chiếu</th>
                <th className="py-2.5 px-3">Ngày lập</th>
                <th className="py-2.5 px-3">Kho nhận</th>
                <th className="py-2.5 px-3 text-right">Tổng số lượng</th>
                <th className="py-2.5 px-3">Người tạo</th>
                <th className="py-2.5 px-3">Trạng thái duyệt</th>
                <th className="py-2.5 px-3">Thực hiện</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy phiếu nhập nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const wh = warehouseMap.get(doc.warehouseId);
                  const totalQty = doc.items.reduce(
                    (s, it) => s + (it.actualQty !== undefined ? it.actualQty : it.qty),
                    0,
                  );
                  const srcLabel = sourceLabels[doc.inboundSource?.type || ""] || "Nhập kho";

                  return (
                    <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{doc.id}</td>
                      <td className="py-2.5 px-3 font-medium">{srcLabel}</td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate">{doc.partner || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">
                        {doc.inboundSource?.purchaseOrder || doc.reference || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{doc.documentDate}</td>
                      <td className="py-2.5 px-3">{wh?.name || doc.warehouseId}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {totalQty.toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">{doc.creator}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doc.status === "approved" || doc.status === "completed"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : doc.status === "pending"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : doc.status === "rejected"
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {doc.status === "completed" ? "Đã duyệt" : doc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doc.posted
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : doc.status === "approved"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {doc.posted ? "Đã vào sổ kho" : doc.status === "approved" ? "Chờ nhập thực tế" : "Chưa thực hiện"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDoc(doc)}
                          className="h-6 px-2.5 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Chi tiết
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

