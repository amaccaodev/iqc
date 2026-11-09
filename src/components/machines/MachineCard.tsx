import React from "react";
import type { Machine, MachineStatus } from "../../types/machine";
import { getDaysUntilMaintenance, isMaintenanceUrgent } from "../../services/machineStorage";
import { MachineIcon } from "./MachineIcons";

interface MachineCardProps {
  machine: Machine;
  onSelectMachine: (machine: Machine) => void;
  canEdit: boolean;
  onQuickReportIncident?: (machine: Machine) => void;
  onQuickChangeStatus?: (machine: Machine) => void;
}

export const MachineCard: React.FC<MachineCardProps> = ({
  machine,
  onSelectMachine,
  canEdit,
  onQuickReportIncident,
  onQuickChangeStatus,
}) => {
  const isUrgent = isMaintenanceUrgent(machine.nextMaintenanceDate);
  const daysLeft = getDaysUntilMaintenance(machine.nextMaintenanceDate);

  const statusConfig: Record<
    MachineStatus,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    running: {
      label: "Đang chạy",
      bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-500/30",
      icon: "play",
    },
    idle: {
      label: "Rảnh",
      bg: "bg-muted/30",
      text: "text-muted-foreground",
      border: "border-border",
      icon: "pause",
    },
    maintenance: {
      label: "Bảo trì",
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-500/30",
      icon: "wrench",
    },
    broken: {
      label: "Hỏng hóc",
      bg: "bg-red-500/10 dark:bg-red-500/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-500/30",
      icon: "alert",
    },
  };

  const statusStyle = statusConfig[machine.status] || statusConfig.idle;

  return (
    <div
      onClick={() => onSelectMachine(machine)}
      className="p-4 sm:p-5 rounded-xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs flex flex-col justify-between group space-y-4 relative overflow-hidden"
    >
      {/* Top indicator bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          machine.status === "running"
            ? "bg-emerald-500"
            : machine.status === "broken"
              ? "bg-red-500"
              : machine.status === "maintenance"
                ? "bg-amber-500"
                : "bg-muted"
        }`}
      />

      {/* Header: Name, Code, Status Badge */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
            {machine.code}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
          >
            <MachineIcon name={statusStyle.icon} size={11} />
            <span>{statusStyle.label}</span>
          </span>
        </div>

        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
          {machine.name}
        </h3>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>{machine.workshop}</span>
          <span>•</span>
          <span>{machine.line}</span>
        </div>
      </div>

      {/* Body: Running order or idle state */}
      <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2 text-xs">
        {machine.status === "running" && machine.currentOrder ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-semibold">Lệnh SX đang chạy:</span>
              <span className="font-mono font-bold text-primary">{machine.currentOrder}</span>
            </div>
            {machine.orderProductName && (
              <div className="text-[11px] text-foreground font-medium truncate" title={machine.orderProductName}>
                {machine.orderProductName}
              </div>
            )}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>Tiến độ</span>
                <span className="font-bold text-foreground">{machine.progress || 0}%</span>
              </div>
              <div className="w-full bg-muted/30 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${machine.progress || 0}%` }}
                />
              </div>
            </div>
          </>
        ) : machine.status === "broken" ? (
          <div className="text-red-600 dark:text-red-400 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <MachineIcon name="alert" size={13} />
              <span>Máy đang dừng sự cố</span>
            </div>
            <div className="text-[11px] line-clamp-2">
              {machine.incidents[0]?.description || "Cần kỹ thuật kiểm tra và xử lý gấp."}
            </div>
          </div>
        ) : machine.status === "maintenance" ? (
          <div className="text-amber-600 dark:text-amber-400 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <MachineIcon name="wrench" size={13} />
              <span>Đang trong kỳ bảo dưỡng</span>
            </div>
            <div className="text-[11px] line-clamp-2">
              {machine.maintenanceRecords[0]?.description || "Bảo dưỡng định kỳ theo lịch kỹ thuật."}
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-center py-2">
            <span>Máy đang rảnh · Sẵn sàng gán lệnh SX</span>
          </div>
        )}

        {/* Operator in shift */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground flex items-center gap-1">
            <MachineIcon name="user" size={12} />
            <span>Vận hành:</span>
          </span>
          <span className="font-medium text-foreground truncate max-w-[140px]">
            {machine.operator || "Chưa gán ca"}
          </span>
        </div>
      </div>

      {/* Footer: Run Hours & Maintenance schedule */}
      <div className="space-y-1.5 pt-2 border-t border-border text-xs">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Giờ chạy tích lũy:</span>
          <span className="font-mono font-bold text-foreground">
            {machine.totalRunHours.toLocaleString("vi-VN")} h
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Bảo trì kế tiếp:</span>
          <span
            className={`font-semibold flex items-center gap-1 ${
              isUrgent
                ? "text-red-600 dark:text-red-400 font-bold"
                : "text-foreground"
            }`}
          >
            {isUrgent && <MachineIcon name="alertCircle" size={12} />}
            <span>{machine.nextMaintenanceDate}</span>
            {daysLeft <= 0 ? (
              <span className="text-[10px] px-1 rounded bg-red-500/10 text-red-600 font-black">
                Quá hạn
              </span>
            ) : daysLeft <= 7 ? (
              <span className="text-[10px] px-1 rounded bg-amber-500/10 text-amber-600 font-bold">
                Còn {daysLeft}d
              </span>
            ) : null}
          </span>
        </div>
      </div>

      {/* Fast Action Buttons */}
      {canEdit && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="pt-2 border-t border-border flex items-center justify-end gap-1.5"
        >
          {onQuickChangeStatus && (
            <button
              type="button"
              onClick={() => onQuickChangeStatus(machine)}
              className="h-6 px-2 text-[10px] rounded border border-border hover:bg-muted/20 font-semibold text-foreground flex items-center gap-1"
              title="Đổi trạng thái máy"
            >
              <MachineIcon name="power" size={11} />
              <span>Trạng thái</span>
            </button>
          )}

          {onQuickReportIncident && machine.status !== "broken" && (
            <button
              type="button"
              onClick={() => onQuickReportIncident(machine)}
              className="h-6 px-2 text-[10px] rounded border border-red-500/30 text-red-600 hover:bg-red-500/10 font-semibold flex items-center gap-1"
              title="Báo hỏng khẩn cấp"
            >
              <MachineIcon name="alert" size={11} />
              <span>Báo hỏng</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

