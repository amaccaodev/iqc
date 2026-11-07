import React from "react";
import type { Machine } from "../../types/machine";
import { isMaintenanceUrgent } from "../../services/machineStorage";
import { MachineIcon } from "./MachineIcons";

interface MachineKpiBarProps {
  machines: Machine[];
  activeStatusFilter: string;
  onFilterStatus: (status: string) => void;
}

export const MachineKpiBar: React.FC<MachineKpiBarProps> = ({
  machines,
  activeStatusFilter,
  onFilterStatus,
}) => {
  const total = machines.length;
  const runningCount = machines.filter((m) => m.status === "running").length;
  const idleCount = machines.filter((m) => m.status === "idle").length;
  const maintenanceCount = machines.filter((m) => m.status === "maintenance").length;
  const brokenCount = machines.filter((m) => m.status === "broken").length;

  const utilizationRate = total > 0 ? Math.round((runningCount / total) * 100) : 0;

  // Cảnh báo cần xử lý: Máy hỏng + Máy quá hạn bảo trì hoặc còn <= 7 ngày
  const urgentCount = machines.filter(
    (m) => m.status === "broken" || isMaintenanceUrgent(m.nextMaintenanceDate),
  ).length;

  const handleCardClick = (statusKey: string) => {
    if (activeStatusFilter === statusKey) {
      onFilterStatus("all"); // Bỏ lọc nếu click lại
    } else {
      onFilterStatus(statusKey);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-5">
      {/* 1. Tổng số máy */}
      <button
        type="button"
        onClick={() => handleCardClick("all")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === "all"
            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
            : "border-border bg-card hover:border-primary/40"
        }`}
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Tổng máy</span>
          <div className="w-6 h-6 rounded-md bg-muted/20 flex items-center justify-center text-foreground">
            <MachineIcon name="cpu" size={13} />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground">{total}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Toàn bộ thiết bị</div>
      </button>

      {/* 2. Đang chạy */}
      <button
        type="button"
        onClick={() => handleCardClick("running")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === "running"
            ? "border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/30"
            : "border-border bg-card hover:border-emerald-500/50"
        }`}
      >
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Đang chạy</span>
          <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
            <MachineIcon name="play" size={12} />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{runningCount}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Đang gia công ca này</div>
      </button>

      {/* 3. Rảnh */}
      <button
        type="button"
        onClick={() => handleCardClick("idle")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === "idle"
            ? "border-slate-500 bg-slate-500/15 ring-2 ring-slate-500/30"
            : "border-border bg-card hover:border-slate-400/50"
        }`}
      >
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Rảnh</span>
          <div className="w-6 h-6 rounded-md bg-muted/20 flex items-center justify-center text-muted-foreground">
            <MachineIcon name="pause" size={12} />
          </div>
        </div>
        <div className="text-2xl font-black text-foreground">{idleCount}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Sẵn sàng nhận lệnh</div>
      </button>

      {/* 4. Bảo trì */}
      <button
        type="button"
        onClick={() => handleCardClick("maintenance")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === "maintenance"
            ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/30"
            : "border-border bg-card hover:border-amber-500/50"
        }`}
      >
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Bảo trì</span>
          <div className="w-6 h-6 rounded-md bg-amber-500/15 flex items-center justify-center">
            <MachineIcon name="wrench" size={12} />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{maintenanceCount}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Bảo dưỡng định kỳ</div>
      </button>

      {/* 5. Hỏng */}
      <button
        type="button"
        onClick={() => handleCardClick("broken")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs ${
          activeStatusFilter === "broken"
            ? "border-red-500 bg-red-500/15 ring-2 ring-red-500/30"
            : "border-border bg-card hover:border-red-500/50"
        }`}
      >
        <div className="flex items-center justify-between text-red-600 dark:text-red-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Hỏng</span>
          <div className="w-6 h-6 rounded-md bg-red-500/15 flex items-center justify-center">
            <MachineIcon name="alert" size={12} />
          </div>
        </div>
        <div className="text-2xl font-black text-red-600 dark:text-red-400">{brokenCount}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Đang chờ / sửa chữa</div>
      </button>

      {/* 6. Tỷ lệ sử dụng (%) */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between text-primary mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Hiệu suất OEE</span>
          <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
            <MachineIcon name="activity" size={13} />
          </div>
        </div>
        <div className="text-2xl font-black text-primary">{utilizationRate}%</div>
        <div className="w-full bg-muted/20 h-1.5 rounded-full overflow-hidden mt-1.5">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${utilizationRate}%` }}
          />
        </div>
      </div>

      {/* 7. Cảnh báo cần xử lý */}
      <button
        type="button"
        onClick={() => handleCardClick("urgent")}
        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
          activeStatusFilter === "urgent"
            ? "border-rose-500 bg-rose-500/15 ring-2 ring-rose-500/30"
            : "border-border bg-card hover:border-rose-500/40"
        }`}
      >
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Cảnh báo gấp</span>
          <div className="w-6 h-6 rounded-md bg-rose-500/15 flex items-center justify-center">
            <MachineIcon name="alertCircle" size={13} />
          </div>
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{urgentCount}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">Hỏng hoặc sắp tới hạn</div>
      </button>
    </div>
  );
};

