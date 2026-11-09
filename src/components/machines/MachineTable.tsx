import React, { useState } from "react";
import type { Machine, MachineStatus } from "../../types/machine";
import { getDaysUntilMaintenance, isMaintenanceUrgent } from "../../services/machineStorage";
import { MachineIcon } from "./MachineIcons";

interface MachineTableProps {
  machines: Machine[];
  onSelectMachine: (machine: Machine) => void;
  canEdit: boolean;
  onEditMachine?: (machine: Machine) => void;
  onQuickChangeStatus?: (machine: Machine) => void;
  onQuickReportIncident?: (machine: Machine) => void;
}

export const MachineTable: React.FC<MachineTableProps> = ({
  machines,
  onSelectMachine,
  canEdit,
  onEditMachine,
  onQuickChangeStatus,
  onQuickReportIncident,
}) => {
  const [sortField, setSortField] = useState<keyof Machine>("code");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: keyof Machine) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedMachines = [...machines].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortAsc ? valA - valB : valB - valA;
    }
    return sortAsc
      ? String(valA || "").localeCompare(String(valB || ""), "vi")
      : String(valB || "").localeCompare(String(valA || ""), "vi");
  });

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

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left" role="table">
          <thead>
            <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
              <th
                onClick={() => handleSort("code")}
                className="py-3 px-3 cursor-pointer hover:text-foreground"
              >
                Mã máy {sortField === "code" && (sortAsc ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-3 cursor-pointer hover:text-foreground"
              >
                Tên thiết bị {sortField === "name" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="py-3 px-3">Loại máy</th>
              <th className="py-3 px-3">Vị trí (Xưởng / Dây chuyền)</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3">Lệnh SX đang chạy</th>
              <th className="py-3 px-3">Người vận hành</th>
              <th
                onClick={() => handleSort("totalRunHours")}
                className="py-3 px-3 text-right cursor-pointer hover:text-foreground"
              >
                Giờ chạy {sortField === "totalRunHours" && (sortAsc ? "↑" : "↓")}
              </th>
              <th
                onClick={() => handleSort("nextMaintenanceDate")}
                className="py-3 px-3 cursor-pointer hover:text-foreground"
              >
                Bảo trì tiếp theo {sortField === "nextMaintenanceDate" && (sortAsc ? "↑" : "↓")}
              </th>
              <th className="py-3 px-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedMachines.map((m) => {
              const statusStyle = statusConfig[m.status] || statusConfig.idle;
              const isUrgent = isMaintenanceUrgent(m.nextMaintenanceDate);
              const daysLeft = getDaysUntilMaintenance(m.nextMaintenanceDate);

              return (
                <tr
                  key={m.id}
                  onClick={() => onSelectMachine(m)}
                  className="hover:bg-muted/10 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-primary">{m.code}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {m.name}
                    </span>
                    <div className="text-[10px] text-muted-foreground">{m.model}</div>
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{m.type}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-foreground">{m.workshop}</div>
                    <div className="text-[10px] text-muted-foreground">{m.line}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      <MachineIcon name={statusStyle.icon} size={11} />
                      <span>{statusStyle.label}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {m.status === "running" && m.currentOrder ? (
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-primary">{m.currentOrder}</div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <div className="w-16 bg-muted/30 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full"
                              style={{ width: `${m.progress || 0}%` }}
                            />
                          </div>
                          <span>{m.progress || 0}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground">{m.operator || "—"}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">
                    {m.totalRunHours.toLocaleString("vi-VN")} h
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        isUrgent
                          ? "text-red-600 dark:text-red-400 font-bold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isUrgent && <MachineIcon name="alertCircle" size={12} />}
                      <span>{m.nextMaintenanceDate}</span>
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
                  </td>
                  <td
                    onClick={(e) => e.stopPropagation()}
                    className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectMachine(m)}
                      className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                      title="Xem chi tiết máy"
                    >
                      Chi tiết
                    </button>

                    {canEdit && onQuickChangeStatus && (
                      <button
                        type="button"
                        onClick={() => onQuickChangeStatus(m)}
                        className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        title="Đổi trạng thái máy"
                      >
                        Đổi TT
                      </button>
                    )}

                    {canEdit && onEditMachine && (
                      <button
                        type="button"
                        onClick={() => onEditMachine(m)}
                        className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        title="Chỉnh sửa máy"
                      >
                        Sửa
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

