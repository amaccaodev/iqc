import { useState } from "react"
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination"
import { SupervisorView } from "../../_AppLegacy"
import { useOrders } from "../../hooks/useOrders"
import { usePagedList, useStableFetch } from "../../hooks/usePagedList"
import PendingOrderApprovals from "../../components/supervisor/PendingOrderApprovals"
import { orderApi } from "../../services/api/OrderApiService"
import MaterialExportOrdersModule from "../../components/exportOrders/MaterialExportOrdersModule"

export default function SupervisorOrdersPage() {
  const [moduleMode, setModuleMode] =
    useState<"export_orders" | "internal_orders">("export_orders")
  const { orders, setOrders } = useOrders()

  const fetchOrders = useStableFetch((query) => orderApi.list(query))

  const { items, total, page, pageSize, setPage, setPageSize, q, setQ } =
    usePagedList({
      fetchPage: fetchOrders,
      pageSize: LIST_UI_PAGE_SIZE,
      enabled: moduleMode === "internal_orders",
    })

  return (
    <div className="space-y-4">
      {/* Module Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div>
          <h1 className="font-display font-extrabold text-lg sm:text-xl text-foreground">
            {moduleMode === "export_orders"
              ? "Quản trị Lệnh xuất vật tư & Điều phối Kho công trình"
              : "Lệnh sản xuất nội bộ (Quản đốc theo dõi)"}
          </h1>
          <p className="text-xs text-muted">
            {moduleMode === "export_orders"
              ? "Theo dõi tiến độ xuất kho theo thời gian thực, đối soát khối lượng và nghiệm thu bàn giao."
              : "Theo dõi tiến độ các lệnh sản xuất chi tiết và phê duyệt công đoạn."}
          </p>
        </div>

        <div className="inline-flex p-1 bg-surface rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setModuleMode("export_orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              moduleMode === "export_orders"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <i className="fas fa-truck-ramp-box text-xs" aria-hidden="true" />
            <span>Lệnh xuất công trình (Mới)</span>
          </button>
          <button
            type="button"
            onClick={() => setModuleMode("internal_orders")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              moduleMode === "internal_orders"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <i className="fas fa-industry text-xs" aria-hidden="true" />
            <span>Lệnh SX nhà máy</span>
          </button>
        </div>
      </div>

      {/* Module 1: Material Export Orders System (Primary) */}
      {moduleMode === "export_orders" && <MaterialExportOrdersModule />}

      {/* Module 2: Legacy Factory Internal Orders */}
      {moduleMode === "internal_orders" && (
        <div>
          <PendingOrderApprovals orders={orders} />
          <div className="relative mb-4">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
            <input
              className="w-full pl-10 pr-3 py-2.5 border border-border rounded-xl text-sm bg-input focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Tìm số lệnh, sản phẩm, khách hàng…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <SupervisorView
            orders={items}
            setOrders={setOrders}
            screen="orders"
            orderPaging={{
              page,
              pageSize,
              total,
              onPage: setPage,
              onPageSize: setPageSize,
            }}
          />
        </div>
      )}
    </div>
  )
}
