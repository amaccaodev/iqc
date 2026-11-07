import React, { useState } from "react";
import type { Company, Product, Warehouse, WmsDataState } from "../../../types/wms";
import { exportToCsv } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsReportsViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  scopedInventory: WmsDataState["inventory"];
}

export const WmsReportsView: React.FC<WmsReportsViewProps> = ({
  data,
  scopedWarehouses,
  scopedInventory,
}) => {
  const [reportTab, setReportTab] = useState<"valuation" | "ledger">("valuation");
  const [filterWh, setFilterWh] = useState("all");
  const [filterTxType, setFilterTxType] = useState("all");
  const [search, setSearch] = useState("");

  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));
  const companyMap = new Map<string, Company>(data.companies.map((c) => [c.id, c]));

  // 1. Valuation Report Data
  const valuationRows = scopedInventory.filter((inv) => {
    if (filterWh !== "all" && inv.warehouseId !== filterWh) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = productMap.get(inv.productId);
      return (
        inv.productId.toLowerCase().includes(q) ||
        (p?.name || "").toLowerCase().includes(q) ||
        inv.lot.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalValuation = valuationRows.reduce((sum, inv) => {
    const prod = productMap.get(inv.productId);
    return sum + (prod?.costPrice || 0) * inv.onHand;
  }, 0);

  const handleExportValuationCsv = () => {
    const headers = [
      "Mã hàng",
      "Tên hàng hóa",
      "Công ty sở hữu",
      "Kho lưu trữ",
      "Số lô",
      "ĐVT",
      "Tồn kho thực tế",
      "Đơn giá vốn (VNĐ)",
      "Tổng giá trị tồn (VNĐ)",
      "Trạng thái an toàn",
    ];

    const rows = valuationRows.map((inv) => {
      const prod = productMap.get(inv.productId);
      const comp = companyMap.get(inv.companyId);
      const wh = warehouseMap.get(inv.warehouseId);
      const val = (prod?.costPrice || 0) * inv.onHand;
      const isLow = prod && inv.onHand <= prod.min;
      const isOver = prod && prod.max > 0 && inv.onHand >= prod.max;
      const status = isLow ? "Cảnh báo thiếu (dưới Min)" : isOver ? "Vượt Max" : "An toàn";

      return [
        inv.productId,
        prod?.name || "",
        comp?.name || inv.companyId,
        wh?.name || inv.warehouseId,
        inv.lot,
        prod?.unit || "",
        inv.onHand,
        prod?.costPrice || 0,
        val,
        status,
      ];
    });

    exportToCsv("Bao_cao_dinh_gia_ton_kho.csv", headers, rows);
  };

  // 2. Transactions Ledger Data
  const scopedWhIds = new Set(scopedWarehouses.map((w) => w.id));
  const ledgerRows = (data.transactions || []).filter((tx) => {
    if (!scopedWhIds.has(tx.warehouseId)) return false;
    if (filterWh !== "all" && tx.warehouseId !== filterWh) return false;
    if (filterTxType !== "all" && tx.type !== filterTxType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const p = productMap.get(tx.productId);
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.productId.toLowerCase().includes(q) ||
        (p?.name || "").toLowerCase().includes(q) ||
        tx.reference.toLowerCase().includes(q) ||
        tx.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportLedgerCsv = () => {
    const headers = [
      "Mã giao dịch",
      "Thời điểm ghi nhận",
      "Loại nghiệp vụ",
      "Mã kho",
      "Mã hàng",
      "Tên hàng hóa",
      "Số lô",
      "Tồn trước",
      "Biến động (+/-)",
      "Tồn sau",
      "Người thực hiện",
      "Chứng từ tham chiếu",
    ];

    const rows = ledgerRows.map((tx) => {
      const prod = productMap.get(tx.productId);
      return [
        tx.id,
        tx.date,
        tx.type,
        tx.warehouseId,
        tx.productId,
        prod?.name || "",
        tx.lot,
        tx.before,
        tx.change,
        tx.after,
        tx.actor,
        tx.reference,
      ];
    });

    exportToCsv("So_kho_chi_tiet_giao_dich.csv", headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Hệ thống Báo cáo & Sổ kho chi tiết</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Báo cáo định giá tài sản tồn kho và sổ chi tiết biến động ghi nhận từng lần giao dịch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reportTab === "valuation" ? (
            <button
              type="button"
              onClick={handleExportValuationCsv}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
            >
              <WmsIcon name="download" size={14} />
              <span>Xuất Excel định giá</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportLedgerCsv}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
            >
              <WmsIcon name="download" size={14} />
              <span>Xuất Sổ kho chi tiết</span>
            </button>
          )}
        </div>
      </div>

      {/* Report View Tabs */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setReportTab("valuation")}
          className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
            reportTab === "valuation"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Báo cáo Định giá Tồn kho
        </button>
        <button
          type="button"
          onClick={() => setReportTab("ledger")}
          className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
            reportTab === "ledger"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          Sổ kho Chi tiết Giao dịch ({ledgerRows.length})
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder={
                reportTab === "valuation"
                  ? "Tìm theo mã hàng, tên sản phẩm, số lô..."
                  : "Tìm theo mã GD, mã hàng, tham chiếu, người làm..."
              }
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
          <option value="all">Tất cả kho trong phạm vi</option>
          {scopedWarehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.id} · {w.name}
            </option>
          ))}
        </select>

        {reportTab === "ledger" && (
          <select
            value={filterTxType}
            onChange={(e) => setFilterTxType(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả loại giao dịch</option>
            <option value="inbound">Nhập kho</option>
            <option value="outbound">Xuất kho</option>
            <option value="transfer_in">Nhận chuyển kho (+)</option>
            <option value="transfer_out">Xuất chuyển kho (-)</option>
          </select>
        )}
      </div>

      {/* Tab 1: Valuation Table */}
      {reportTab === "valuation" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Mã hàng</th>
                  <th className="py-2.5 px-3">Tên sản phẩm / vật tư</th>
                  <th className="py-2.5 px-3">Công ty sở hữu</th>
                  <th className="py-2.5 px-3">Kho lưu trữ</th>
                  <th className="py-2.5 px-3">Số lô</th>
                  <th className="py-2.5 px-3 text-right">Tồn thực tế</th>
                  <th className="py-2.5 px-3 text-right">Đơn giá vốn</th>
                  <th className="py-2.5 px-3 text-right">Tổng giá trị tài sản</th>
                  <th className="py-2.5 px-3">Tình trạng định mức</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {valuationRows.map((inv) => {
                  const prod = productMap.get(inv.productId);
                  const comp = companyMap.get(inv.companyId);
                  const wh = warehouseMap.get(inv.warehouseId);
                  const val = (prod?.costPrice || 0) * inv.onHand;
                  const isLow = prod && inv.onHand <= prod.min;

                  return (
                    <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{inv.productId}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{prod?.name || "—"}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{comp?.name || inv.companyId}</td>
                      <td className="py-2.5 px-3">{wh?.name || inv.warehouseId}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{inv.lot}</td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">
                        {inv.onHand.toLocaleString("vi-VN")} {prod?.unit}
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
                            Cần đặt thêm (dưới Min)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/10 text-green-600 border border-green-500/20">
                            Đạt định mức an toàn
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between text-xs font-semibold">
            <span>{valuationRows.length} dòng hàng định giá</span>
            <span>
              Tổng giá trị tồn kho:{" "}
              <strong className="text-primary font-black text-sm">
                {totalValuation.toLocaleString("vi-VN")} đ
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Tab 2: Ledger Table */}
      {reportTab === "ledger" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Mã GD</th>
                  <th className="py-2.5 px-3">Thời điểm ghi nhận</th>
                  <th className="py-2.5 px-3">Loại nghiệp vụ</th>
                  <th className="py-2.5 px-3">Kho</th>
                  <th className="py-2.5 px-3">Mã hàng</th>
                  <th className="py-2.5 px-3">Số lô</th>
                  <th className="py-2.5 px-3 text-right">Tồn trước</th>
                  <th className="py-2.5 px-3 text-right">Biến động</th>
                  <th className="py-2.5 px-3 text-right">Tồn sau</th>
                  <th className="py-2.5 px-3">Người làm</th>
                  <th className="py-2.5 px-3">Chứng từ tham chiếu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-muted-foreground">
                      Không có giao dịch nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map((tx) => {
                    const isIncrease = tx.change > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">{tx.id}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {new Date(tx.date).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              tx.type === "inbound" || tx.type === "transfer_in"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {tx.type === "inbound"
                              ? "Nhập kho"
                              : tx.type === "outbound"
                                ? "Xuất kho"
                                : tx.type === "transfer_in"
                                  ? "Nhận chuyển"
                                  : "Xuất chuyển"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">{tx.warehouseId}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">{tx.productId}</td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">{tx.lot}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{tx.before}</td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-black ${
                            isIncrease ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isIncrease ? `+${tx.change}` : tx.change}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-foreground">
                          {tx.after}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">{tx.actor}</td>
                        <td className="py-2.5 px-3 font-mono text-muted-foreground">{tx.reference}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

