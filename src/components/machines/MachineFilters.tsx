import React, { useState } from "react";
import type { MachineFilterOptions, MachineType, WorkshopType } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";

interface MachineFiltersProps {
  filters: MachineFilterOptions;
  onChangeFilters: (filters: MachineFilterOptions) => void;
  viewMode: "grid" | "table";
  onChangeViewMode: (mode: "grid" | "table") => void;
  workshops: WorkshopType[];
  machineTypes: MachineType[];
  totalResults: number;
}

export const MachineFilters: React.FC<MachineFiltersProps> = ({
  filters,
  onChangeFilters,
  viewMode,
  onChangeViewMode,
  workshops,
  machineTypes,
  totalResults,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const isFiltered =
    Boolean(filters.search) ||
    filters.workshop !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all";

  const handleClear = () => {
    onChangeFilters({
      search: "",
      workshop: "all",
      type: "all",
      status: "all",
    });
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card shadow-xs mb-5 space-y-3">
      {/* Top search & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[240px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên máy, mã máy (CNC-01...), lệnh SX (LX-...)..."
              value={filters.search}
              onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              aria-label="Tìm kiếm máy móc"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none">
              <MachineIcon name="search" size={15} />
            </div>
            {filters.search && (
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, search: "" })}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <MachineIcon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* View Switcher & Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileExpanded((prev) => !prev)}
            className="sm:hidden h-9 px-3 rounded-lg border border-border bg-surface text-xs font-semibold flex items-center gap-1.5"
            aria-expanded={mobileExpanded}
          >
            <MachineIcon name="filter" size={14} />
            <span>Bộ lọc</span>
            {isFiltered && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-border bg-muted/20">
            <button
              type="button"
              onClick={() => onChangeViewMode("grid")}
              className={`h-8 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Chế độ xem Thẻ (Grid)"
              aria-label="Xem dạng thẻ"
            >
              <MachineIcon name="grid" size={14} />
              <span className="hidden md:inline">Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode("table")}
              className={`h-8 px-2.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Chế độ xem Bảng (Table)"
              aria-label="Xem dạng bảng"
            >
              <MachineIcon name="table" size={14} />
              <span className="hidden md:inline">Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Selectors (Desktop always visible, Mobile collapsible) */}
      <div
        className={`${
          mobileExpanded ? "flex" : "hidden sm:flex"
        } flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Workshop Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-workshop" className="text-muted-foreground font-semibold">
              Xưởng:
            </label>
            <select
              id="filter-workshop"
              value={filters.workshop}
              onChange={(e) => onChangeFilters({ ...filters, workshop: e.target.value })}
              className="h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả phân xưởng</option>
              {workshops.map((ws) => (
                <option key={ws} value={ws}>
                  {ws}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-type" className="text-muted-foreground font-semibold">
              Loại máy:
            </label>
            <select
              id="filter-type"
              value={filters.type}
              onChange={(e) => onChangeFilters({ ...filters, type: e.target.value })}
              className="h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả loại máy</option>
              {machineTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-status" className="text-muted-foreground font-semibold">
              Trạng thái:
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => onChangeFilters({ ...filters, status: e.target.value })}
              className="h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="running">🟢 Đang chạy</option>
              <option value="idle">⚪ Rảnh</option>
              <option value="maintenance">🟡 Bảo trì</option>
              <option value="broken">🔴 Hỏng hóc</option>
              <option value="urgent">⚠️ Cảnh báo gấp (Hỏng / Sắp bảo trì)</option>
            </select>
          </div>

          {/* Clear button */}
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="h-8 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted/10 font-medium flex items-center gap-1"
            >
              <MachineIcon name="x" size={12} />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Total results indicator */}
        <div className="text-[11px] text-muted-foreground font-medium">
          Tìm thấy <strong className="text-foreground">{totalResults}</strong> thiết bị
        </div>
      </div>
    </div>
  );
};

