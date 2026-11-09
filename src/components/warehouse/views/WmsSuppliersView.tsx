import React, { useState } from "react";
import type { Company, Supplier, WmsDataState } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsSuppliersViewProps {
  data: WmsDataState;
  onSaveCompany: (company: Company) => void;
  onSaveSupplier: (supplier: Supplier, isNew: boolean) => void;
}

export const WmsSuppliersView: React.FC<WmsSuppliersViewProps> = ({
  data,
  onSaveCompany,
  onSaveSupplier,
}) => {
  const [tab, setTab] = useState<"structure" | "suppliers">("structure");
  const [supplierSearch, setSupplierSearch] = useState("");

  // Modal State for Supplier
  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<Supplier | null>(null);
  const [formSup, setFormSup] = useState<Partial<Supplier>>({});

  // Modal State for Company
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Company | null>(null);
  const [formComp, setFormComp] = useState<Partial<Company>>({});
  const [plantInput, setPlantInput] = useState("");

  const filteredSuppliers = data.suppliers.filter((s) => {
    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.tax.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAddSup = () => {
    setEditingSup(null);
    setFormSup({
      id: `SUP-${String(data.suppliers.length + 1).padStart(3, "0")}`,
      name: "",
      tax: "",
      phone: "",
      email: "",
      address: "",
      companyId: data.companies[0]?.id || "C01",
      status: "active",
    });
    setIsSupModalOpen(true);
  };

  const handleOpenEditSup = (s: Supplier) => {
    setEditingSup(s);
    setFormSup({ ...s });
    setIsSupModalOpen(true);
  };

  const handleSaveSup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSup.id || !formSup.name) return;
    onSaveSupplier(formSup as Supplier, !editingSup);
    setIsSupModalOpen(false);
  };

  const handleOpenEditComp = (c: Company) => {
    setEditingComp(c);
    setFormComp({ ...c, plants: [...c.plants] });
    setPlantInput("");
    setIsCompModalOpen(true);
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComp.id || !formComp.name) return;
    onSaveCompany(formComp as Company);
    setIsCompModalOpen(false);
  };

  const handleAddPlant = () => {
    if (!plantInput.trim()) return;
    const currentPlants = formComp.plants || [];
    if (!currentPlants.includes(plantInput.trim())) {
      setFormComp({
        ...formComp,
        plants: [...currentPlants, plantInput.trim()],
      });
      setPlantInput("");
    }
  };

  const handleRemovePlant = (pToRemove: string) => {
    setFormComp({
      ...formComp,
      plants: (formComp.plants || []).filter((p) => p !== pToRemove),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cấu trúc Tập đoàn & Đối tác</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản trị mô hình đơn vị thành viên đa cấp (Tập đoàn, Công ty con, Nhà máy) và danh mục Nhà cung cấp.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-muted/20 border border-border rounded-lg">
          <button
            type="button"
            onClick={() => setTab("structure")}
            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
              tab === "structure"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mô hình Tập đoàn & Chi nhánh
          </button>
          <button
            type="button"
            onClick={() => setTab("suppliers")}
            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
              tab === "suppliers"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nhà cung cấp ({data.suppliers.length})
          </button>
        </div>
      </div>

      {tab === "structure" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <WmsIcon name="building" size={18} />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Hội đồng Quản trị Tập đoàn WMS Group</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cơ chế lọc đa cấp: Cho phép truy cập dữ liệu toàn diện hoặc tách biệt tuyệt đối theo từng Công ty thành viên và Nhà máy trực thuộc.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.companies.map((comp) => {
              const whCount = data.warehouses.filter((w) => w.companyId === comp.id).length;
              return (
                <div
                  key={comp.id}
                  className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between space-y-4 shadow-xs"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {comp.id}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        {comp.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-foreground">{comp.name}</div>

                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                        <span>Nhà máy & Phân xưởng:</span>
                        <span>{comp.plants.length} địa điểm</span>
                      </div>
                      <div className="space-y-1">
                        {comp.plants.map((p) => (
                          <div
                            key={p}
                            className="px-2.5 py-1 rounded bg-muted/15 text-xs text-foreground flex items-center gap-1.5"
                          >
                            <span>📍</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Kho phụ trách: {whCount} kho</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditComp(comp)}
                      className="px-2.5 py-1 rounded border border-border text-[11px] font-semibold hover:bg-surface-2"
                    >
                      Cấu hình
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "suppliers" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm nhà cung cấp theo tên, MST, SĐT, địa chỉ..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="absolute left-2.5 top-2 text-muted-foreground">
                  <WmsIcon name="search" size={14} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddSup}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
            >
              <WmsIcon name="plus" size={14} />
              <span>Thêm nhà cung cấp</span>
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Mã NCC</th>
                  <th className="py-2.5 px-3">Tên Nhà cung cấp</th>
                  <th className="py-2.5 px-3">Mã số thuế</th>
                  <th className="py-2.5 px-3">Điện thoại</th>
                  <th className="py-2.5 px-3">Email liên hệ</th>
                  <th className="py-2.5 px-3">Địa chỉ</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{s.id}</td>
                    <td className="py-2.5 px-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-2.5 px-3 font-mono">{s.tax}</td>
                    <td className="py-2.5 px-3">{s.phone}</td>
                    <td className="py-2.5 px-3 text-muted-foreground">{s.email}</td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-[200px] truncate">
                      {s.address}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                        {s.status === "active" ? "Đang giao dịch" : "Ngừng"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditSup(s)}
                        className="h-6 px-2.5 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {isSupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight">
                {editingSup ? `Chỉnh sửa Nhà cung cấp [${editingSup.id}]` : "Thêm mới Nhà cung cấp"}
              </h2>
              <button
                type="button"
                onClick={() => setIsSupModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveSup} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Mã NCC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSup.id || ""}
                    onChange={(e) => setFormSup({ ...formSup, id: e.target.value })}
                    disabled={Boolean(editingSup)}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tên Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSup.name || ""}
                    onChange={(e) => setFormSup({ ...formSup, name: e.target.value })}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Mã số thuế
                  </label>
                  <input
                    type="text"
                    value={formSup.tax || ""}
                    onChange={(e) => setFormSup({ ...formSup, tax: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formSup.phone || ""}
                    onChange={(e) => setFormSup({ ...formSup, phone: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Email liên hệ
                  </label>
                  <input
                    type="email"
                    value={formSup.email || ""}
                    onChange={(e) => setFormSup({ ...formSup, email: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Công ty đối tác chính
                  </label>
                  <select
                    value={formSup.companyId || ""}
                    onChange={(e) => setFormSup({ ...formSup, companyId: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {data.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Địa chỉ trụ sở / văn phòng
                </label>
                <input
                  type="text"
                  value={formSup.address || ""}
                  onChange={(e) => setFormSup({ ...formSup, address: e.target.value })}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSupModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
                >
                  Lưu Nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Modal */}
      {isCompModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight">
                Cấu hình Đơn vị thành viên [{editingComp?.id}]
              </h2>
              <button
                type="button"
                onClick={() => setIsCompModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveComp} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Tên Công ty thành viên
                </label>
                <input
                  type="text"
                  value={formComp.name || ""}
                  onChange={(e) => setFormComp({ ...formComp, name: e.target.value })}
                  required
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Danh sách Nhà máy / Phân xưởng trực thuộc
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={plantInput}
                    onChange={(e) => setPlantInput(e.target.value)}
                    placeholder="Nhập tên nhà máy mới..."
                    className="flex-1 h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddPlant}
                    className="h-8 px-3 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold border border-border hover:bg-surface-2"
                  >
                    + Thêm
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-border rounded-lg p-2 bg-muted/10">
                  {(formComp.plants || []).map((p) => (
                    <div
                      key={p}
                      className="flex items-center justify-between p-1.5 rounded bg-card border border-border"
                    >
                      <span className="font-medium">{p}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePlant(p)}
                        className="text-red-500 hover:text-red-700 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

