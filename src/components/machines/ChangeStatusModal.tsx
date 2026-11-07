import React, { useState } from "react";
import type { Machine, MachineStatus } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";

export interface ChangeStatusModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (machineId: string, newStatus: MachineStatus, orderNo?: string, progress?: number) => void;
}

export const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  machine,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !machine) return null;

  const [status, setStatus] = useState<MachineStatus>(machine.status);
  const [orderNo, setOrderNo] = useState(machine.currentOrder || "");
  const [progress, setProgress] = useState(machine.progress ? String(machine.progress) : "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      machine.id,
      status,
      status === "running" ? orderNo.trim() : undefined,
      status === "running" ? Number(progress) || 0 : undefined,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 className="text-sm font-bold text-foreground">
            Đổi trạng thái vận hành: {machine.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground cursor-pointer"
          >
            <MachineIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
              Chọn trạng thái mới
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "running", label: "🟢 Đang chạy", desc: "Máy đang gia công lệnh SX" },
                { key: "idle", label: "⚪ Rảnh", desc: "Sẵn sàng nhận lệnh mới" },
                { key: "maintenance", label: "🟡 Bảo trì", desc: "Tạm dừng để bảo dưỡng" },
                { key: "broken", label: "🔴 Hỏng hóc", desc: "Dừng máy do sự cố" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatus(opt.key as MachineStatus)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    status === opt.key
                      ? "border-primary bg-primary/10 font-bold"
                      : "border-border bg-background hover:bg-muted/15"
                  }`}
                >
                  <div className="text-xs font-bold text-foreground">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {status === "running" && (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/10">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Mã lệnh sản xuất (LX-...)
                </label>
                <input
                  type="text"
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  placeholder="VD: LX-2026-105..."
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tiến độ hoàn thành (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-md border border-border text-xs font-semibold hover:bg-muted/10 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              Xác nhận đổi trạng thái
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

