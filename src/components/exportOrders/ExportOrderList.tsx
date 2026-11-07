import { useState, useMemo } from "react"
import type {
  ExportOrder,
  ExportUser,
  OrderStatus,
} from "../../types/exportOrder"
import {
  calculateOrderProgress,
  getMaterialById,
  getProjectById,
  getStatusBadgeInfo,
  getWarehouseById,
  PROJECTS,
  WAREHOUSES,
} from "../../services/exportOrderStorage"

interface ExportOrderListProps {
  orders: ExportOrder[]
  currentUser: ExportUser
  activeTab: "orders" | "warehouse_issue"
  onCreateNew: () => void
  onViewDetail: (order: ExportOrder) => void
  onEditOrder: (order: ExportOrder) => void
  onCancelOrder: (order: ExportOrder) => void
  onOpenIssueModal: (order: ExportOrder) => void
  onAcceptOrder: (order: ExportOrder) => void
  onOpenPrint: (order: ExportOrder) => void
}

export default function ExportOrderList({
  orders,
  currentUser,
  activeTab,
  onCreateNew,
  onViewDetail,
  onEditOrder,
  onCancelOrder,
  onOpenIssueModal,
  onAcceptOrder,
  onOpenPrint,
}: ExportOrderListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all") // all, today, this_week, this_month

  // Filter orders according to role and permissions
  const roleFilteredOrders = useMemo(() => {
    // If user is warehouse keeper, strictly scope to their assigned warehouse
    if (
      currentUser.roleType === "warehouse_keeper" &&
      currentUser.warehouseId
    ) {
      return orders.filter((o) => o.warehouseId === currentUser.warehouseId)
    }
    return orders
  }, [orders, currentUser])

  // Tab specific filtering
  const tabFilteredOrders = useMemo(() => {
    if (activeTab === "warehouse_issue") {
      // In "Xuất kho" tab: only show orders that are pending, in_progress, partial, or completed
      return roleFilteredOrders.filter(
        (o) => o.status !== "draft" && o.status !== "cancelled",
      )
    }
    return roleFilteredOrders
  }, [roleFilteredOrders, activeTab])

  // Combined search and filters
  const filteredOrders = useMemo(() => {
    return tabFilteredOrders.filter((order) => {
      // 1. Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const project = getProjectById(order.projectId)
        const warehouse = getWarehouseById(order.warehouseId)
        const materialNames = order.materials
          .map((m) => getMaterialById(m.materialId)?.name || "")
          .join(" ")
          .toLowerCase()

        const matchCode = order.code.toLowerCase().includes(q)
        const matchProject = project?.name.toLowerCase().includes(q) || false
        const matchWarehouse =
          warehouse?.name.toLowerCase().includes(q) || false
        const matchNotes = (order.notes || "").toLowerCase().includes(q)
        const matchMaterials = materialNames.includes(q)
        const matchPlate = (order.vehiclePlate || "").toLowerCase().includes(q)

        if (
          !matchCode &&
          !matchProject &&
          !matchWarehouse &&
          !matchNotes &&
          !matchMaterials &&
          !matchPlate
        ) {
          return false
        }
      }

      // 2. Status filter
      if (statusFilter !== "all") {
        if (order.status !== statusFilter) return false
      }

      // 3. Project filter
      if (projectFilter !== "all") {
        if (order.projectId !== projectFilter) return false
      }

      // 4. Warehouse filter
      if (warehouseFilter !== "all") {
        if (order.warehouseId !== warehouseFilter) return false
      }

      // 5. Date filter
      if (dateRangeFilter !== "all") {
        const orderDate = new Date(order.createdAt.replace(" ", "T"))
        const now = new Date()
        if (dateRangeFilter === "today") {
          const isToday =
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          if (!isToday) return false
        } else if (dateRangeFilter === "this_week") {
          const diffDays =
            (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24)
          if (diffDays > 7) return false
        } else if (dateRangeFilter === "this_month") {
          const isThisMonth =
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          if (!isThisMonth) return false
        }
      }

      return true
    })
  }, [
    tabFilteredOrders,
    searchQuery,
    statusFilter,
    projectFilter,
    warehouseFilter,
    dateRangeFilter,
  ])

  // Quick counts
  const counts = useMemo(() => {
    return {
      all: tabFilteredOrders.length,
      draft: tabFilteredOrders.filter((o) => o.status === "draft").length,
      pending: tabFilteredOrders.filter((o) => o.status === "pending").length,
      in_progress: tabFilteredOrders.filter(
        (o) => o.status === "in_progress" || o.status === "partial",
      ).length,
      completed: tabFilteredOrders.filter((o) => o.status === "completed")
        .length,
      cancelled: tabFilteredOrders.filter((o) => o.status === "cancelled")
        .length,
    }
  }, [tabFilteredOrders])

  const isAccountant = currentUser.roleType === "accountant"
  const isWarehouseKeeper = currentUser.roleType === "warehouse_keeper"

  return (
    <div className="space-y-4">
      {/* Top Search & Actions Bar */}
      <div className="bg-card/90 glass border border-border/80 rounded-2xl p-4 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo số lệnh (LX-...), dự án, kho, biển số xe, tên vật tư..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-border bg-input text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/60 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Xóa tìm kiếm"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs cursor-pointer"
              >
                <i className="fas fa-circle-xmark" />
              </button>
            )}
          </div>

          {/* Action Button: Create Order (Only for Accountant / Admin) */}
          {isAccountant && (
            <button
              type="button"
              onClick={onCreateNew}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-center gap-2 shadow-brand shrink-0"
            >
              <i className="fas fa-plus text-xs" aria-hidden="true" />
              <span>Tạo lệnh xuất mới</span>
            </button>
          )}
        </div>

        {/* Quick Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-border/60 scrollbar-none text-xs">
          {[
            { id: "all", label: "Tất cả", count: counts.all },
            ...(activeTab !== "warehouse_issue"
              ? [{ id: "draft", label: "Bản nháp", count: counts.draft }]
              : []),
            { id: "pending", label: "Chờ xuất kho", count: counts.pending },
            {
              id: "in_progress",
              label: "Đang xuất / Một phần",
              count: counts.in_progress,
            },
            { id: "completed", label: "Hoàn tất", count: counts.completed },
            ...(activeTab !== "warehouse_issue"
              ? [{ id: "cancelled", label: "Đã hủy", count: counts.cancelled }]
              : []),
          ].map((tab) => {
            const active = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface hover:bg-secondary text-muted hover:text-foreground border border-border/60"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    active ? "bg-white/20 text-white" : "bg-card text-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Advanced Filters Dropdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 mt-3 border-t border-border/50 text-xs">
          {/* Lọc Dự án */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Công trình / Dự án:
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-border bg-input text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả dự án ({PROJECTS.length})</option>
              {PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Kho (chỉ hiển thị nếu không bị giới hạn phạm vi thủ kho) */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Kho xuất hàng:
            </label>
            <select
              value={warehouseFilter}
              disabled={isWarehouseKeeper && !!currentUser.warehouseId}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-border bg-input text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            >
              <option value="all">Tất cả các kho ({WAREHOUSES.length})</option>
              {WAREHOUSES.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Thời gian */}
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Khoảng thời gian:
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg border border-border bg-input text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Toàn bộ thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="this_week">Trong tuần này</option>
              <option value="this_month">Trong tháng này</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Count & Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <div>
          Hiển thị{" "}
          <strong className="text-foreground">{filteredOrders.length}</strong>{" "}
          lệnh xuất
          {isWarehouseKeeper && (
            <span>
              {" "}
              (Lọc theo kho:{" "}
              <strong className="text-primary">
                {getWarehouseById(currentUser.warehouseId || "")?.name}
              </strong>
              )
            </span>
          )}
        </div>
        {(searchQuery ||
          statusFilter !== "all" ||
          projectFilter !== "all" ||
          warehouseFilter !== "all" ||
          dateRangeFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
              setProjectFilter("all")
              setWarehouseFilter("all")
              setDateRangeFilter("all")
            }}
            className="text-primary hover:underline font-semibold cursor-pointer"
          >
            Xóa toàn bộ bộ lọc
          </button>
        )}
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredOrders.map((order) => {
            const project = getProjectById(order.projectId)
            const warehouse = getWarehouseById(order.warehouseId)
            const statusInfo = getStatusBadgeInfo(order.status)
            const progress = calculateOrderProgress(order)

            // Keeper permissions for this order
            const isKeeperForThisOrder =
              currentUser.roleType === "warehouse_keeper" &&
              currentUser.warehouseId === order.warehouseId

            return (
              <div
                key={order.id}
                className="bg-card/95 glass border border-border/80 rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-card-hover hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                {/* Header row: Code, Project, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      <i className="fas fa-file-invoice" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-base text-foreground">
                          {order.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeCls}`}
                        >
                          <i
                            className={`fas ${statusInfo.icon} text-[10px]`}
                            aria-hidden="true"
                          />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground mt-0.5">
                        {project?.name || order.projectId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-muted flex sm:flex-col justify-between items-center sm:items-end">
                    <span>
                      Ngày xuất:{" "}
                      <strong className="text-foreground">
                        {order.expectedDate}
                      </strong>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Tạo: {order.createdAt}
                    </span>
                  </div>
                </div>

                {/* Middle row: Progress Bar, Materials Summary, Warehouse & Vehicle */}
                <div className="py-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center text-xs">
                  {/* Warehouse & Vehicle (5 cols) */}
                  <div className="sm:col-span-5 space-y-1 text-muted">
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-warehouse text-emerald-500 w-4 text-center" />
                      <span>
                        Kho xuất:{" "}
                        <strong className="text-foreground">
                          {warehouse?.name || order.warehouseId}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <i className="fas fa-truck text-sky-500 w-4 text-center" />
                      <span>
                        Phương tiện:{" "}
                        <strong className="text-foreground font-mono">
                          {order.vehiclePlate || "Chưa gán xe"}
                        </strong>
                      </span>
                    </div>
                    {order.notes && (
                      <div className="italic text-muted-foreground truncate max-w-sm">
                        "{order.notes}"
                      </div>
                    )}
                  </div>

                  {/* Progress Bar & Quantity (7 cols) */}
                  <div className="sm:col-span-7 bg-surface/60 rounded-xl p-3 border border-border/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-foreground">
                        Tiến độ xuất kho:{" "}
                        <strong className="text-primary">
                          {progress.percent}%
                        </strong>
                      </span>
                      <span className="text-muted">
                        Đã xuất:{" "}
                        <strong className="text-foreground">
                          {progress.totalIssued}
                        </strong>{" "}
                        / {progress.totalReq} ({order.materials.length} loại vật
                        tư)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    {/* Material previews chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {order.materials.slice(0, 3).map((m) => {
                        const mat = getMaterialById(m.materialId)
                        return (
                          <span
                            key={m.materialId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card text-[11px] border border-border text-muted"
                          >
                            <span>{mat?.name || m.materialId}:</span>
                            <strong className="text-foreground">
                              {m.issuedQty}/{m.reqQty} {mat?.unit}
                            </strong>
                          </span>
                        )
                      })}
                      {order.materials.length > 3 && (
                        <span className="text-[11px] text-muted font-semibold">
                          +{order.materials.length - 3} loại khác...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted">
                      Người lập:{" "}
                      <strong className="text-foreground">
                        {order.creatorName}
                      </strong>
                    </span>
                    {order.initialPhotos.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-semibold">
                        <i className="fas fa-paperclip" />{" "}
                        {order.initialPhotos.length} chứng từ
                      </span>
                    )}
                    {order.handoverPhotos.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold">
                        <i className="fas fa-camera" />{" "}
                        {order.handoverPhotos.length} ảnh giao
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* KEEPER ACTIONS */}
                    {isKeeperForThisOrder && order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onAcceptOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <i
                          className="fas fa-hand-holding-box"
                          aria-hidden="true"
                        />
                        <span>Tiếp nhận lệnh</span>
                      </button>
                    )}

                    {isKeeperForThisOrder &&
                      (order.status === "in_progress" ||
                        order.status === "partial") && (
                        <button
                          type="button"
                          onClick={() => onOpenIssueModal(order)}
                          className="px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <i
                            className="fas fa-truck-ramp-box"
                            aria-hidden="true"
                          />
                          <span>Xuất hàng đợt này</span>
                        </button>
                      )}

                    {/* ACCOUNTANT / GENERAL ACTIONS */}
                    {isAccountant && order.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-card text-foreground font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <i
                          className="fas fa-pen text-muted"
                          aria-hidden="true"
                        />
                        <span>Chỉnh sửa nháp</span>
                      </button>
                    )}

                    {isAccountant && order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onEditOrder(order)}
                        className="px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-card text-foreground font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <i
                          className="fas fa-pen text-muted"
                          aria-hidden="true"
                        />
                        <span>Sửa xe/ghi chú</span>
                      </button>
                    )}

                    {isAccountant &&
                      (order.status === "draft" ||
                        order.status === "pending") && (
                        <button
                          type="button"
                          onClick={() => onCancelOrder(order)}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <i
                            className="fas fa-ban text-rose-500"
                            aria-hidden="true"
                          />
                          <span>Hủy lệnh</span>
                        </button>
                      )}

                    {/* PRINT SLIP A4 */}
                    <button
                      type="button"
                      onClick={() => onOpenPrint(order)}
                      className="px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1"
                      title="In phiếu xuất kho A4"
                    >
                      <i
                        className="fas fa-print text-muted"
                        aria-hidden="true"
                      />
                      <span>In phiếu</span>
                    </button>

                    {/* VIEW DETAIL */}
                    <button
                      type="button"
                      onClick={() => onViewDetail(order)}
                      className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs cursor-pointer transition-colors flex items-center gap-1"
                    >
                      <span>Chi tiết &amp; Đối soát</span>
                      <i
                        className="fas fa-chevron-right text-[10px]"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-card/90 glass border border-border/80 rounded-2xl p-12 text-center shadow-card space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-surface border border-border text-muted flex items-center justify-center mx-auto text-2xl">
            <i className="fas fa-box-open" aria-hidden="true" />
          </div>
          <h3 className="font-display font-extrabold text-base text-foreground">
            Không tìm thấy lệnh xuất nào phù hợp
          </h3>
          <p className="text-xs text-muted max-w-md mx-auto">
            Không có kết quả khớp với điều kiện tìm kiếm hoặc phân quyền của vai
            trò hiện tại. Vui lòng thử thay đổi từ khóa tìm kiếm hoặc chọn bộ
            lọc trạng thái khác.
          </p>
          {isAccountant && (
            <button
              type="button"
              onClick={onCreateNew}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
            >
              <i className="fas fa-plus" />
              <span>Tạo lệnh xuất mới ngay</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
