import React from "react";
import type { Company, Product, Warehouse, WmsDataState, WmsDocument } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsOverviewViewProps {
  data: WmsDataState;
  scopedCompanies: Company[];
  scopedWarehouses: Warehouse[];
  scopedInventory: WmsDataState["inventory"];
  scopedDocs: WmsDocument[];
  onNavigateTab: (tab: any, filterStatus?: string) => void;
  onOpenDoc: (doc: WmsDocument) => void;
  onOpenQuickCount: () => void;
  onOpenNewInbound: () => void;
  onOpenNewOutbound: () => void;
}

export const WmsOverviewView: React.FC<WmsOverviewViewProps> = ({
  data,
  scopedWarehouses,
  scopedInventory,
  scopedDocs,
  onNavigateTab,
  onOpenDoc,
  onOpenQuickCount,
  onOpenNewInbound,
  onOpenNewOutbound,
}) => {
  // KPIs
  const totalPhysicalStock = scopedInventory.reduce((sum, r) => sum + (r.onHand || 0), 0);
  const totalItemsCount = new Set(scopedInventory.map((r) => r.productId)).size;

  const pendingInbound = scopedDocs.filter((d) => d.type === "inbound" && d.status === "pending").length;
  const pendingOutbound = scopedDocs.filter((d) => d.type === "outbound" && d.status === "pending").length;

  const inTransitTransfers = scopedDocs.filter(
    (d) => d.type === "transfer" && (d.status === "in_transit" || d.status === "partially_received"),
  ).length;

  const pendingExecution = scopedDocs.filter(
    (d) => ["inbound", "outbound"].includes(d.type) && d.status === "approved" && !d.posted,
  ).length;

  // Low stock products
  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));
  const lowStockAlerts: Array<{ product: Product; totalStock: number; min: number }> = [];

  const stockByProduct = new Map<string, number>();
  scopedInventory.forEach((r) => {
    stockByProduct.set(r.productId, (stockByProduct.get(r.productId) || 0) + r.onHand);
  });

  stockByProduct.forEach((stock, pId) => {
    const prod = productMap.get(pId);
    if (prod && stock <= prod.min) {
      lowStockAlerts.push({ product: prod, totalStock: stock, min: prod.min });
    }
  });

  // 7-day transactions simulation / rollup
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const dayDisplay = `${d.getDate()}/${d.getMonth() + 1}`;

    const dayTx = data.transactions.filter((tx) => tx.date.startsWith(dayStr));
    const inQty = dayTx
      .filter((t) => t.type === "inbound" || t.type === "transfer_in")
      .reduce((s, t) => s + Math.abs(t.change), 0);
    const outQty = dayTx
      .filter((t) => t.type === "outbound" || t.type === "transfer_out")
      .reduce((s, t) => s + Math.abs(t.change), 0);

    return { dayStr, dayDisplay, inQty, outQty };
  });

  const maxTx = Math.max(...days.map((d) => Math.max(d.inQty, d.outQty, 10)));

  // Valuation by Company
  const valuationByCompany = data.companies.map((comp) => {
    const compWhIds = new Set(data.warehouses.filter((w) => w.companyId === comp.id).map((w) => w.id));
    const totalVal = data.inventory
      .filter((inv) => compWhIds.has(inv.warehouseId))
      .reduce((sum, inv) => {
        const prod = productMap.get(inv.productId);
        const cost = prod?.costPrice || 0;
        return sum + cost * inv.onHand;
      }, 0);
    return { company: comp, totalVal };
  });

  const grandValuation = valuationByCompany.reduce((s, c) => s + c.totalVal, 0) || 1;

  // Recent 6 documents
  const recentDocs = scopedDocs.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tổng quan hoạt động kho</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Toàn cảnh số liệu tồn kho, giao dịch thực tế và phê duyệt theo phạm vi đang chọn.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenNewInbound}
            className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
          >
            <WmsIcon name="plus" size={14} />
            <span>Tạo phiếu nhập</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewOutbound}
            className="h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 border border-border hover:bg-surface-2"
          >
            <WmsIcon name="plus" size={14} />
            <span>Tạo phiếu xuất</span>
          </button>
          <button
            type="button"
            onClick={onOpenQuickCount}
            className="h-8 px-3 rounded-md border border-border bg-card text-xs font-medium flex items-center gap-1.5 hover:bg-muted/10"
          >
            <WmsIcon name="count" size={14} />
            <span>Kiểm kê nhanh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div
          onClick={() => onNavigateTab("inventory")}
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Tồn vật lý</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <WmsIcon name="inventory" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight">{totalPhysicalStock.toLocaleString("vi-VN")}</div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-primary transition-colors">
            {scopedWarehouses.length} kho khả dụng →
          </div>
        </div>

        {/* KPI 2 */}
        <div
          onClick={() => onNavigateTab("products")}
          className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Mặt hàng</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <WmsIcon name="products" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight">{totalItemsCount} SKU</div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-primary transition-colors">
            {data.products.length} trong danh mục →
          </div>
        </div>

        {/* KPI 3 */}
        <div
          onClick={() => onNavigateTab("inbound", "pending")}
          className="p-4 rounded-xl border border-border bg-card hover:border-amber-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Nhập chờ duyệt</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <WmsIcon name="inbound" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            {pendingInbound}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-amber-600 transition-colors">
            Cần phê duyệt →
          </div>
        </div>

        {/* KPI 4 */}
        <div
          onClick={() => onNavigateTab("outbound", "pending")}
          className="p-4 rounded-xl border border-border bg-card hover:border-orange-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Xuất chờ duyệt</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <WmsIcon name="outbound" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight text-orange-600 dark:text-orange-400">
            {pendingOutbound}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-orange-600 transition-colors">
            Cần phê duyệt →
          </div>
        </div>

        {/* KPI 5 */}
        <div
          onClick={() => onNavigateTab("transfers", "in_transit")}
          className="p-4 rounded-xl border border-border bg-card hover:border-teal-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Đang chuyển kho</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <WmsIcon name="transfer" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight text-teal-600 dark:text-teal-400">
            {inTransitTransfers}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-teal-600 transition-colors">
            Đang trên đường →
          </div>
        </div>

        {/* KPI 6 */}
        <div
          onClick={() => onNavigateTab("approvals")}
          className="p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Chờ nhập/xuất</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <WmsIcon name="clock" size={15} />
            </div>
          </div>
          <div className="text-xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
            {pendingExecution}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1 group-hover:text-indigo-600 transition-colors">
            Đã duyệt, chưa vào sổ →
          </div>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Chart 1: 7-day movement */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold">Biến động nhập/xuất thực tế 7 ngày gần nhất</h2>
              <p className="text-[11px] text-muted-foreground">Tổng khối lượng luân chuyển qua sổ kho</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Nhập kho</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Xuất kho</span>
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-border">
            {days.map((d) => {
              const inHeight = Math.max(8, Math.round((d.inQty / maxTx) * 140));
              const outHeight = Math.max(8, Math.round((d.outQty / maxTx) * 140));
              return (
                <div key={d.dayStr} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      style={{ height: `${inHeight}px` }}
                      className="w-4 sm:w-6 bg-blue-500 rounded-t-sm hover:opacity-80 transition-all"
                      title={`Nhập: ${d.inQty.toLocaleString("vi-VN")}`}
                    />
                    <div
                      style={{ height: `${outHeight}px` }}
                      className="w-4 sm:w-6 bg-amber-500 rounded-t-sm hover:opacity-80 transition-all"
                      title={`Xuất: ${d.outQty.toLocaleString("vi-VN")}`}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">{d.dayDisplay}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown: Valuation by Company */}
        <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold">Cơ cấu giá trị tồn kho theo công ty</h2>
            <p className="text-[11px] text-muted-foreground mb-4">Định giá tài sản tồn kho theo đơn giá vốn</p>

            <div className="space-y-4">
              {valuationByCompany.map(({ company, totalVal }) => {
                const pct = Math.round((totalVal / grandValuation) * 100);
                return (
                  <div key={company.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate max-w-[170px]">{company.name}</span>
                      <span className="font-bold">{totalVal.toLocaleString("vi-VN")} đ</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-muted-foreground text-right">{pct}% tổng giá trị</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Tổng định giá:</span>
            <span className="text-sm font-black text-primary">
              {valuationByCompany.reduce((s, c) => s + c.totalVal, 0).toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>
      </div>

      {/* Lower Section: Low Stock Warnings & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Low Stock Alerts */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
                <WmsIcon name="alert" size={14} />
              </div>
              <h2 className="text-sm font-bold">Cảnh báo tồn tối thiểu</h2>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
              {lowStockAlerts.length} mặt hàng
            </span>
          </div>

          <div className="divide-y divide-border overflow-y-auto max-h-72">
            {lowStockAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Mức tồn kho tất cả mặt hàng đang an toàn.
              </div>
            ) : (
              lowStockAlerts.map(({ product, totalStock, min }) => (
                <div key={product.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>{product.name}</span>
                      <code className="text-[10px] text-muted-foreground">({product.id})</code>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Định mức an toàn: {min} {product.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400">
                      {totalStock} {product.unit}
                    </span>
                    <div className="text-[10px] text-red-500 font-medium">Sắp hết hàng</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Phiếu luân chuyển gần đây</h2>
            <button
              type="button"
              onClick={() => onNavigateTab("inbound")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Xem tất cả →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 px-2 font-medium">Mã phiếu</th>
                  <th className="py-2 px-2 font-medium">Loại</th>
                  <th className="py-2 px-2 font-medium">Kho</th>
                  <th className="py-2 px-2 font-medium">Đối tác / Phân xưởng</th>
                  <th className="py-2 px-2 font-medium">Ngày lập</th>
                  <th className="py-2 px-2 font-medium">Trạng thái</th>
                  <th className="py-2 px-2 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentDocs.map((doc) => {
                  const statusColors: Record<string, string> = {
                    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                    approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                    completed: "bg-green-500/10 text-green-600 border-green-500/20",
                    in_transit: "bg-teal-500/10 text-teal-600 border-teal-500/20",
                    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
                  };
                  return (
                    <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2 px-2 font-mono font-semibold text-primary">{doc.id}</td>
                      <td className="py-2 px-2">
                        {doc.type === "inbound"
                          ? "Nhập kho"
                          : doc.type === "outbound"
                            ? "Xuất kho"
                            : "Điều chuyển"}
                      </td>
                      <td className="py-2 px-2 text-muted-foreground">{doc.warehouseId}</td>
                      <td className="py-2 px-2 max-w-[150px] truncate">{doc.partner || "—"}</td>
                      <td className="py-2 px-2 text-muted-foreground">{doc.createdAt}</td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            statusColors[doc.status] || "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => onOpenDoc(doc)}
                          className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

