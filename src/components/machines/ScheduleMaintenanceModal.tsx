import React, { useState } from "react";
import type { Machine, MaintenanceRecord, MaintenanceType } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";

export interface ScheduleMaintenanceModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (record: Partial<MaintenanceRecord>) => void;
}

export const ScheduleMaintenanceModal: React.FC<ScheduleMaintenanceModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen || !machine) return null;

  const [date, setDate] = useState(machine.nextMaintenanceDate || new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<MaintenanceType>("periodic");
  const [description, setDescription] = useState("");
  const [technician, setTechnician] = useState("");
  const [costVnd, setCostVnd] = useState("5000000");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmit({
      machineId: machine.id,
      date,
      type,
      description: description.trim(),
      technician: technician.trim() || "KTV Tổ Cơ điện",
      costVnd: Number(costVnd) || 0,
      status: "scheduled",
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
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 className="text-sm font-bold text-foreground">
            Lên lịch bảo trì: {machine.name}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground cursor-pointer"
          >
            <MachineIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Ngày bảo trì dự kiến
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Phân loại bảo trì
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="periodic">Bảo dưỡng định kỳ</option>
                <option value="preventive">Bảo dưỡng phòng ngừa</option>
                <option value="overhaul">Đại tu thiết bị</option>
                <option value="calibration">Hiệu chuẩn sai số</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
              Nội dung công việc bảo trì <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Thay dầu bôi trơn trục chính, căn mâm cặp, kiểm tra ray trượt..."
              className="w-full p-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Kỹ thuật viên phụ trách
              </label>
              <input
                type="text"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="KTV Cơ điện..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Dự toán chi phí (VNĐ)
              </label>
              <input
                type="number"
                value={costVnd}
                onChange={(e) => setCostVnd(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
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
              className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs cursor-pointer"
            >
              Lưu lịch bảo trì
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

