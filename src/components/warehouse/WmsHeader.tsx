import React from "react";
import type { Company, WmsRole } from "../../types/wms";
import { WmsIcon } from "./WmsIcons";

interface WmsHeaderProps {
  companies: Company[];
  selectedCompany: string; // 'all' or company.id
  onChangeCompany: (companyId: string) => void;
  selectedPlant: string; // 'all' or plant name
  onChangePlant: (plant: string) => void;
  availablePlants: string[];
  currentRole: WmsRole;
  onChangeRole: (role: WmsRole) => void;
  actorName: string;
  pendingApprovalsCount: number;
  onOpenQuickSearch: () => void;
  onOpenApprovals: () => void;
  onAddTestData: () => void;
  onResetData: () => void;
  activeTab: string;
}

export const WmsHeader: React.FC<WmsHeaderProps> = ({
  companies,
  selectedCompany,
  onChangeCompany,
  selectedPlant,
  onChangePlant,
  availablePlants,
  currentRole,
  onChangeRole,
  actorName,
  pendingApprovalsCount,
  onOpenQuickSearch,
  onOpenApprovals,
  onAddTestData,
  onResetData,
}) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-20 shadow-xs">
      <div className="px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Scope */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
              <WmsIcon name="warehouse" size={20} />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                <span>WMS ENTERPRISE</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Tập đoàn
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <WmsIcon name="building" size={12} />
                <span>Quản lý kho đa cấp & truy vết</span>
              </div>
            </div>
          </div>

          {/* Scope Selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company Select */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Phạm vi đơn vị
              </span>
              <select
                value={selectedCompany}
                onChange={(e) => onChangeCompany(e.target.value)}
                className="h-8 px-2.5 py-1 text-xs rounded-md border border-border bg-background font-medium hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">🌐 Toàn tập đoàn (Tất cả)</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plant Select */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Nhà máy / Chi nhánh
              </span>
              <select
                value={selectedPlant}
                onChange={(e) => onChangePlant(e.target.value)}
                className="h-8 px-2.5 py-1 text-xs rounded-md border border-border bg-background font-medium hover:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả chi nhánh</option>
                {availablePlants.map((plant) => (
                  <option key={plant} value={plant}>
                    📍 {plant}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Quick Search, Role Switcher, Pending Badge, Tools */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Quick Search Button */}
          <button
            type="button"
            onClick={onOpenQuickSearch}
            className="h-8 px-3 text-xs rounded-md border border-border bg-surface hover:bg-surface-2 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Tìm kiếm tức thì theo mã, sản phẩm, kho (Ctrl+K)"
          >
            <WmsIcon name="search" size={14} />
            <span className="hidden md:inline">Tìm nhanh...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-muted/20 border border-border rounded font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Pending Approvals Notification */}
          <button
            type="button"
            onClick={onOpenApprovals}
            className={`relative h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs transition-colors ${
              pendingApprovalsCount > 0
                ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold hover:bg-amber-500/20"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/10"
            }`}
            title="Trung tâm phê duyệt phiếu"
          >
            <WmsIcon name="approvals" size={15} />
            <span className="hidden sm:inline">Chờ duyệt</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-amber-500 text-white">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20">
              {actorName
                .split(" ")
                .map((n) => n[0])
                .slice(-2)
                .join("")}
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold leading-tight truncate max-w-[110px] sm:max-w-[140px]">
                {actorName}
              </span>
              <div className="relative inline-block">
                <select
                  value={currentRole}
                  onChange={(e) => onChangeRole(e.target.value as WmsRole)}
                  className="text-[10px] text-primary font-semibold bg-transparent border-0 p-0 pr-3 focus:outline-none cursor-pointer"
                  title="Chuyển đổi vai trò người dùng (RBAC)"
                >
                  <option value="Nhân viên kho">Nhân viên kho</option>
                  <option value="Thủ kho">Thủ kho</option>
                  <option value="Quản lý kho">Quản lý kho</option>
                  <option value="Kế toán kho">Kế toán kho</option>
                  <option value="Quản trị tập đoàn">Quản trị tập đoàn</option>
                </select>
              </div>
            </div>
          </div>

          {/* Demo Data Actions */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-border">
            <button
              type="button"
              onClick={onAddTestData}
              className="h-8 px-2 text-[11px] font-medium rounded border border-border hover:bg-muted/10 text-muted-foreground hover:text-foreground"
              title="Thêm các phiếu mẫu kiểm thử"
            >
              + Nạp test
            </button>
            <button
              type="button"
              onClick={onResetData}
              className="h-8 px-2 text-[11px] font-medium rounded border border-border hover:bg-red-500/10 text-muted-foreground hover:text-red-600"
              title="Khôi phục trạng thái ban đầu"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

