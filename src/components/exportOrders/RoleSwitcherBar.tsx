import type { ExportUser } from "../../types/exportOrder"
import { DEMO_USERS, getWarehouseById } from "../../services/exportOrderStorage"

interface RoleSwitcherBarProps {
  currentUser: ExportUser
  onSelectUser: (user: ExportUser) => void
  onResetData: () => void
  activeTab: "orders" | "warehouse_issue"
  onTabChange: (tab: "orders" | "warehouse_issue") => void
}

export default function RoleSwitcherBar({
  currentUser,
  onSelectUser,
  onResetData,
  activeTab,
  onTabChange,
}: RoleSwitcherBarProps) {
  const currentWarehouse = currentUser.warehouseId
    ? getWarehouseById(currentUser.warehouseId)
    : null

  return (
    <div className="bg-card/90 glass border border-border/80 rounded-2xl p-3 sm:p-4 mb-4 shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Role Switcher Dropdown & Active User Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <i
                className={`fas ${currentUser.avatarIcon || "fa-user"}`}
                aria-hidden="true"
              />
            </span>
            <div className="leading-tight">
              <div className="text-[11px] uppercase tracking-wider text-muted font-bold">
                Vai trò đang thao tác
              </div>
              <div className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                <span className="text-xs font-semibold text-primary">
                  ({currentUser.role})
                </span>
              </div>
            </div>
          </div>

          {/* Quick Switch Dropdown / Selector */}
          <div className="relative">
            <label htmlFor="role-switcher-select" className="sr-only">
              Chuyển vai trò tức thì
            </label>
            <select
              id="role-switcher-select"
              aria-label="Chuyển đổi vai trò người dùng"
              value={currentUser.id}
              onChange={(e) => {
                const found = DEMO_USERS.find((u) => u.id === e.target.value)
                if (found) onSelectUser(found)
              }}
              className="py-1.5 pl-3 pr-8 text-xs font-semibold bg-surface hover:bg-secondary/60 text-foreground border border-border rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.role}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-surface text-muted border-border/70">
            <i
              className="fas fa-location-dot text-emerald-500 text-[11px]"
              aria-hidden="true"
            />
            {currentWarehouse ? (
              <span>
                Phạm vi:{" "}
                <strong className="text-foreground">
                  {currentWarehouse.name}
                </strong>
              </span>
            ) : (
              <span>
                Phạm vi:{" "}
                <strong className="text-foreground">
                  Toàn hệ thống (Tất cả 5 kho)
                </strong>
              </span>
            )}
          </div>
        </div>

        {/* Right: 2 Tabs & Reset Button */}
        <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
          {/* 2 Tabs: "Lệnh xuất" & "Xuất kho" */}
          <div
            className="inline-flex p-1 bg-surface rounded-xl border border-border/70"
            role="tablist"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "orders"}
              onClick={() => onTabChange("orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "orders"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <i className="fas fa-file-invoice text-xs" aria-hidden="true" />
              <span>Lệnh xuất</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "warehouse_issue"}
              onClick={() => onTabChange("warehouse_issue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "warehouse_issue"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <i className="fas fa-truck-ramp-box text-xs" aria-hidden="true" />
              <span>Xuất kho</span>
            </button>
          </div>

          {/* Reset Demo Data Button */}
          <button
            type="button"
            onClick={onResetData}
            title="Khôi phục toàn bộ dữ liệu mẫu ban đầu"
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-border/80 hover:border-rose-400 bg-surface/50 hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <i className="fas fa-rotate-left text-xs" aria-hidden="true" />
            <span className="hidden sm:inline">Khôi phục dữ liệu mẫu</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  )
}
