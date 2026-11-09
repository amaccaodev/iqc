import React, { useState } from "react";
import type { Machine, MachineType, WorkshopType } from "../../types/machine";
import { MachineIcon } from "./MachineIcons";

interface MachineFormModalProps {
  machine?: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Machine>) => void;
  workshops: WorkshopType[];
  machineTypes: MachineType[];
}

export const MachineFormModal: React.FC<MachineFormModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSave,
  workshops,
  machineTypes,
}) => {
  const isEditing = Boolean(machine);

  const [code, setCode] = useState(machine?.code || "");
  const [name, setName] = useState(machine?.name || "");
  const [type, setType] = useState<MachineType>(machine?.type || machineTypes[0] || "Phay CNC");
  const [workshop, setWorkshop] = useState<WorkshopType>(machine?.workshop || workshops[0] || "Xưởng Cơ khí 1");
  const [line, setLine] = useState(machine?.line || "Dây chuyền 1");
  const [model, setModel] = useState(machine?.model || "");
  const [brand, setBrand] = useState(machine?.brand || "");
  const [powerKw, setPowerKw] = useState(machine?.powerKw ? String(machine.powerKw) : "15");
  const [weightKg, setWeightKg] = useState(machine?.weightKg ? String(machine.weightKg) : "3000");
  const [dimensionsMm, setDimensionsMm] = useState(machine?.dimensionsMm || "2000 x 1800 x 2200");
  const [ipAddress, setIpAddress] = useState(machine?.ipAddress || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    onSave({
      code: code.trim(),
      name: name.trim(),
      type,
      workshop,
      line: line.trim(),
      model: model.trim(),
      brand: brand.trim(),
      powerKw: Number(powerKw) || 15,
      weightKg: Number(weightKg) || 3000,
      dimensionsMm: dimensionsMm.trim(),
      ipAddress: ipAddress.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="machine-form-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10">
          <h3 id="machine-form-title" className="text-sm font-bold text-foreground">
            {isEditing ? `Chỉnh sửa máy [${machine?.code}]` : "Thêm mới thiết bị máy móc"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground cursor-pointer"
            aria-label="Đóng"
          >
            <MachineIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Mã máy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: CNC-04..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Tên thiết bị máy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Máy phay CNC..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Loại máy</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MachineType)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {machineTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Phân xưởng</label>
              <select
                value={workshop}
                onChange={(e) => setWorkshop(e.target.value as WorkshopType)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {workshops.map((ws) => (
                  <option key={ws} value={ws}>
                    {ws}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Dây chuyền</label>
              <input
                type="text"
                value={line}
                onChange={(e) => setLine(e.target.value)}
                placeholder="VD: Dây chuyền A..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Hãng chế tạo</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="VD: Mazak, Fanuc..."
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Công suất (kW)</label>
              <input
                type="number"
                value={powerKw}
                onChange={(e) => setPowerKw(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Trọng lượng (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Kích thước DxRxC (mm)</label>
              <input
                type="text"
                value={dimensionsMm}
                onChange={(e) => setDimensionsMm(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Địa chỉ IP thiết bị</label>
              <input
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="192.168.10.xxx"
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
              {isEditing ? "Lưu thay đổi" : "Tạo thiết bị"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

