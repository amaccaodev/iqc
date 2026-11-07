import React, { useState } from "react";
import type { IncidentSeverity, Machine, MachineIncident } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";

export interface ReportIncidentModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Partial<MachineIncident>) => void;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !machine) return null;

  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("high");
  const [technician, setTechnician] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmit({
      machineId: machine.id,
      description: description.trim(),
      severity,
      technician: technician.trim() || undefined,
      status: "pending",
      downtimeMinutes: 0,
      reportedAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-red-500/10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <MachineIcon name="alert" size={16} />
            <span>Báo hỏng nhanh: {machine.name}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground cursor-pointer"
          >
            <MachineIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Hiện tượng / Mô tả sự cố <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết: Kẹt dao, tiếng kêu bất thường, báo mã lỗi..."
              className="w-full p-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-red-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Mức độ nghiêm trọng
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="low">Thấp (Chưa dừng máy)</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao (Dừng máy ngay)</option>
                <option value="critical">Khẩn cấp (Nguy hiểm / Bục dầu)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                KTV tiếp nhận kiểm tra
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Tên thợ máy..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

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
              className="h-8 px-4 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-xs cursor-pointer"
            >
              Phát lệnh dừng máy & Gửi báo hỏng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

