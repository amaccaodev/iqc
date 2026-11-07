import React, { useEffect, useState } from "react";
import type { Machine } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";
import { MachineDailyChart } from "./MachineDailyChart";

interface MachineDetailDrawerProps {
  machine: Machine | null;
  onClose: () => void;
  canEdit: boolean;
  onEditMachine?: (machine: Machine) => void;
  onReportIncident?: (machine: Machine) => void;
  onScheduleMaintenance?: (machine: Machine) => void;
}

type DetailTab = "specs" | "history" | "maintenance" | "incidents" | "chart";

export const MachineDetailDrawer: React.FC<MachineDetailDrawerProps> = ({
  machine,
  onClose,
  canEdit,
  onEditMachine,
  onReportIncident,
  onScheduleMaintenance,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("specs");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!machine) return null;

  const tabs: Array<{ key: DetailTab; label: string; count?: number }> = [
    { key: "specs", label: "Thông số kỹ thuật" },
    { key: "history", label: "Lịch sử chạy", count: machine.workHistory?.length || 0 },
    { key: "maintenance", label: "Lịch bảo trì", count: machine.maintenanceRecords?.length || 0 },
    { key: "incidents", label: "Sự cố", count: machine.incidents?.length || 0 },
    { key: "chart", label: "Biểu đồ 7 ngày" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="bg-card border-l border-border w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/10 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                {machine.code}
              </span>
              <span className="text-xs font-semibold text-muted-foreground">{machine.type}</span>
            </div>
            <h2 id="drawer-title" className="text-base sm:text-lg font-bold text-foreground">
              {machine.name}
            </h2>
            <div className="text-xs text-muted-foreground">
              {machine.workshop} • {machine.line}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && onEditMachine && (
              <button
                type="button"
                onClick={() => onEditMachine(machine)}
                className="h-8 px-2.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-surface-2 flex items-center gap-1 cursor-pointer"
                title="Chỉnh sửa thông số máy"
              >
                <MachineIcon name="edit" size={13} />
                <span className="hidden sm:inline">Sửa</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/20 text-muted-foreground cursor-pointer"
              aria-label="Đóng bảng chi tiết"
            >
              <MachineIcon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border px-4 sm:px-5 overflow-x-auto no-scrollbar bg-background">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`h-10 px-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted/30 font-bold">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto text-xs space-y-4">
          {/* TAB 1: THÔNG TIN KỸ THUẬT */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-border bg-muted/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Model thiết bị</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.model}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Hãng sản xuất</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.brand}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Xuất xứ</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.manufacturerCountry}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Năm sản xuất / Đưa vào dùng</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    {machine.yearOfManufacture} / {machine.yearCommissioned}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Công suất định mức</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.powerKw} kW</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Trọng lượng máy</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.weightKg?.toLocaleString()} kg</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Kích thước (D x R x C)</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">{machine.dimensionsMm}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Địa chỉ IP SCADA / IoT</span>
                  <div className="text-sm font-mono text-primary font-bold mt-0.5">{machine.ipAddress || "Không kết nối"}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH SỬ CHẠY */}
          {activeTab === "history" && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Lệnh sản xuất đã và đang vận hành
              </h3>
              {(!machine.workHistory || machine.workHistory.length === 0) ? (
                <div className="py-8 text-center text-muted-foreground border border-border rounded-xl">
                  Chưa ghi nhận lịch sử lệnh sản xuất nào gần đây.
                </div>
              ) : (
                <div className="space-y-2">
                  {machine.workHistory.map((wh) => (
                    <div key={wh.id} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{wh.orderNo}</span>
                        <span className="text-[11px] text-muted-foreground">{wh.startTime} → {wh.endTime}</span>
                      </div>
                      <div className="font-semibold text-foreground">{wh.productName}</div>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span>Sản lượng: <strong className="text-foreground">{wh.actualQty}/{wh.targetQty}</strong> cái</span>
                        <span>Dừng kỹ thuật: <strong className="text-foreground">{wh.downtimeMinutes} phút</strong></span>
                        <span>Thợ vận hành: <strong className="text-foreground">{wh.operator}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LỊCH BẢO TRÌ */}
          {activeTab === "maintenance" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Hồ sơ bảo trì định kỳ & Sửa chữa
                </h3>
                {canEdit && onScheduleMaintenance && (
                  <button
                    type="button"
                    onClick={() => onScheduleMaintenance(machine)}
                    className="h-7 px-2.5 rounded bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <MachineIcon name="calendar" size={12} />
                    <span>Đặt lịch mới</span>
                  </button>
                )}
              </div>
              {(!machine.maintenanceRecords || machine.maintenanceRecords.length === 0) ? (
                <div className="py-8 text-center text-muted-foreground border border-border rounded-xl">
                  Chưa có phiếu bảo trì nào được ghi nhận.
                </div>
              ) : (
                <div className="space-y-2">
                  {machine.maintenanceRecords.map((mt) => (
                    <div key={mt.id} className="p-3.5 rounded-xl border border-border bg-card space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-primary">{mt.id}</span>
                        <span className="text-[11px] text-muted-foreground">Ngày: {mt.date}</span>
                      </div>
                      <div className="font-semibold text-foreground">{mt.description}</div>
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span>KTV: <strong className="text-foreground">{mt.technician}</strong></span>
                        <span>Chi phí: <strong className="text-foreground">{mt.costVnd.toLocaleString()} đ</strong></span>
                        <span>Trạng thái: <strong className="text-foreground">{mt.status === "completed" ? "Đã xong" : "Đang xử lý"}</strong></span>
                      </div>
                      {mt.result && (
                        <div className="text-[11px] p-2 rounded bg-muted/15 text-foreground mt-1">
                          Kết quả: {mt.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SỰ CỐ & BÁO HỎNG */}
          {activeTab === "incidents" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  Lịch sử báo hỏng & Sự cố kỹ thuật
                </h3>
                {canEdit && onReportIncident && (
                  <button
                    type="button"
                    onClick={() => onReportIncident(machine)}
                    className="h-7 px-2.5 rounded bg-red-600 text-white text-xs font-semibold flex items-center gap-1 shadow-xs hover:bg-red-700 cursor-pointer"
                  >
                    <MachineIcon name="alert" size={12} />
                    <span>Báo hỏng mới</span>
                  </button>
                )}
              </div>
              {(!machine.incidents || machine.incidents.length === 0) ? (
                <div className="py-8 text-center text-muted-foreground border border-border rounded-xl">
                  Máy hoạt động ổn định, chưa ghi nhận sự cố bất thường nào.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {machine.incidents.map((inc) => (
                    <div key={inc.id} className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-red-600">{inc.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 uppercase">
                          Mức độ: {inc.severity}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground">{inc.description}</div>
                      {inc.rootCause && (
                        <div className="text-[11px] text-muted-foreground">
                          Nguyên nhân: {inc.rootCause}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                        <span>Thời điểm: {new Date(inc.reportedAt).toLocaleString("vi-VN")}</span>
                        <span>Downtime: {inc.downtimeMinutes} phút</span>
                        <span>Trạng thái: {inc.status === "resolved" ? "Đã khắc phục" : "Đang xử lý"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BIỂU ĐỒ 7 NGÀY (SVG/CSS THUẦN) */}
          {activeTab === "chart" && <MachineDailyChart stats={machine.dailyStats} />}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
          <div className="text-[11px] text-muted-foreground">
            Mã định danh hệ thống: <strong className="font-mono text-foreground">{machine.id}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-4 rounded-md border border-border text-xs font-semibold hover:bg-surface-2 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
