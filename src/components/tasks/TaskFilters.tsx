import React, { useState } from "react";
import type {
  TaskCategory,
  TaskDateRangeFilter,
  TaskFilterOptions,
  TaskPriority,
  TaskViewMode,
  TaskWorkshop,
} from "../../types/task";
import type { StaffMember } from "../../services/taskSeedDataA";
import { TaskIcon } from "./TaskIcons";

interface TaskFiltersProps {
  filters: TaskFilterOptions;
  onChangeFilters: (next: TaskFilterOptions) => void;
  viewMode: TaskViewMode;
  onChangeViewMode: (mode: TaskViewMode) => void;
  staffList: StaffMember[];
  workshops: TaskWorkshop[];
  categories: TaskCategory[];
  totalResults: number;
  isManager: boolean;
  myTaskCount: number;
  allTaskCount: number;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onChangeFilters,
  viewMode,
  onChangeViewMode,
  staffList,
  workshops,
  categories,
  totalResults,
  isManager,
  myTaskCount,
  allTaskCount,
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasActiveFilter =
    filters.search.trim() !== "" ||
    filters.assigneeId !== "all" ||
    filters.workshop !== "all" ||
    filters.priority !== "all" ||
    filters.category !== "all" ||
    filters.dateRange !== "all" ||
    filters.kpiStatus !== "all";

  const handleReset = () => {
    onChangeFilters({
      search: "",
      scope: isManager ? filters.scope : "mine",
      kpiStatus: "all",
      assigneeId: "all",
      workshop: "all",
      priority: "all",
      category: "all",
      dateRange: "all",
    });
  };

  return (
    <section
      aria-label="Thanh công cụ lọc và chế độ xem công việc"
      className="p-3.5 rounded-xl border border-border bg-card space-y-3"
    >
      {/* Hàng 1: Tab Việc của tôi / Cả nhóm + Chuyển đổi 3 chế độ xem (Danh sách / Kanban / Lịch) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Tab nhanh Việc của tôi / Cả nhóm */}
        <div
          role="tablist"
          aria-label="Phạm vi hiển thị công việc"
          className="inline-flex items-center p-1 rounded-lg bg-muted/25 border border-border"
        >
          {isManager && (
            <button
              type="button"
              role="tab"
              aria-selected={filters.scope === "all"}
              onClick={() => onChangeFilters({ ...filters, scope: "all" })}
              className={`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filters.scope === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>👥 Cả nhóm</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                {allTaskCount}
              </span>
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={filters.scope === "mine" || !isManager}
            onClick={() => onChangeFilters({ ...filters, scope: "mine" })}
            className={`h-7 px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filters.scope === "mine" || !isManager
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TaskIcon name="user" size={12} />
            <span>Việc của tôi</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
              {myTaskCount}
            </span>
          </button>
        </div>

        {/* Chuyển đổi 3 chế độ xem bằng Tab */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground hidden md:inline">
            Hiển thị <strong className="text-foreground font-mono">{totalResults}</strong> việc
          </span>

          <div
            role="tablist"
            aria-label="Chế độ hiển thị công việc"
            className="inline-flex items-center p-1 rounded-lg bg-muted/25 border border-border"
          >
            {(
              [
                { id: "list", label: "Danh sách", icon: "list" },
                { id: "kanban", label: "Kanban", icon: "kanban" },
                { id: "calendar", label: "Lịch", icon: "calendar" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={viewMode === tab.id}
                onClick={() => onChangeViewMode(tab.id)}
                className={`h-7 px-2.5 sm:px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === tab.id
                    ? "bg-card text-primary border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TaskIcon name={tab.icon} size={13} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hàng 2: Ô tìm kiếm + Nút mở rộng bộ lọc trên mobile */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <TaskIcon
            name="search"
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            aria-label="Tìm kiếm công việc theo mã việc, tiêu đề, lệnh sản xuất hoặc máy móc"
            value={filters.search}
            onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
            placeholder="Tìm theo mã việc (CV-2026-...), tiêu đề, lệnh SX (LX-...), máy móc, kho..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          aria-expanded={mobileFiltersOpen}
          className="lg:hidden h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold text-foreground flex items-center gap-1.5 cursor-pointer"
        >
          <TaskIcon name="filter" size={13} />
          <span>Bộ lọc</span>
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleReset}
            className="h-9 px-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/35 text-xs font-semibold text-foreground shrink-0 cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Hàng 3: Các dropdown bộ lọc chi tiết */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 ${
          mobileFiltersOpen ? "grid" : "hidden lg:grid"
        }`}
      >
        {/* 1. Người phụ trách */}
        <div>
          <label htmlFor="task-filter-assignee" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Người phụ trách</label>
          <select id="task-filter-assignee" disabled={!isManager} value={filters.assigneeId} onChange={(e) => onChangeFilters({ ...filters, assigneeId: e.target.value })} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60">
            <option value="all">Tất cả nhân sự</option>
            {staffList.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
        </div>

        {/* 2. Phân xưởng / Dây chuyền */}
        <div>
          <label htmlFor="task-filter-workshop" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Xưởng / Bộ phận</label>
          <select id="task-filter-workshop" value={filters.workshop} onChange={(e) => onChangeFilters({ ...filters, workshop: e.target.value as TaskWorkshop | "all" })} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">Tất cả phân xưởng</option>
            {workshops.map((ws) => (<option key={ws} value={ws}>{ws}</option>))}
          </select>
        </div>

        {/* 3. Mức ưu tiên */}
        <div>
          <label htmlFor="task-filter-priority" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Mức độ ưu tiên</label>
          <select id="task-filter-priority" value={filters.priority} onChange={(e) => onChangeFilters({ ...filters, priority: e.target.value as TaskPriority | "all" })} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">Mọi mức ưu tiên</option>
            <option value="urgent">⚡ Khẩn cấp</option>
            <option value="high">△ Cao</option>
            <option value="medium">◇ Trung bình</option>
            <option value="low">▽ Thấp</option>
          </select>
        </div>

        {/* 4. Loại công việc */}
        <div>
          <label htmlFor="task-filter-category" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Loại công việc</label>
          <select id="task-filter-category" value={filters.category} onChange={(e) => onChangeFilters({ ...filters, category: e.target.value as TaskCategory | "all" })} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">Tất cả loại việc</option>
            {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
          </select>
        </div>

        {/* 5. Khoảng thời gian */}
        <div>
          <label htmlFor="task-filter-daterange" className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Khoảng thời gian hạn</label>
          <select id="task-filter-daterange" value={filters.dateRange} onChange={(e) => onChangeFilters({ ...filters, dateRange: e.target.value as TaskDateRangeFilter })} className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring">
            <option value="all">Toàn thời gian</option>
            <option value="today">Trong hôm nay</option>
            <option value="week">Trong tuần này</option>
            <option value="month">Trong tháng này</option>
            <option value="overdue">Đã quá hạn</option>
          </select>
        </div>
      </div>
    </section>
  );
};
