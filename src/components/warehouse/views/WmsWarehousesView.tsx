import React, { useState } from "react";
import type { Company, Warehouse, WmsDataState } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsWarehousesViewProps {
  data: WmsDataState;
  onSaveWarehouse: (wh: Warehouse, isNew: boolean) => void;
  onDeleteWarehouse: (whId: string) => void;
}

export const WmsWarehousesView: React.FC<WmsWarehousesViewProps> = ({
  data,
  onSaveWarehouse,
  onDeleteWarehouse,
}) => {
  const [filterCompany, setFilterCompany] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [formWh, setFormWh] = useState<Partial<Warehouse>>({});
  const [formError, setFormError] = useState("");

  const companyMap = new Map<string, Company>(data.companies.map((c) => [c.id, c]));

  const filteredWarehouses = data.warehouses.filter((wh) => {
    if (filterCompany !== "all" && wh.companyId !== filterCompany) return false;
    if (filterStatus !== "all" && wh.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        wh.id.toLowerCase().includes(q) ||
        wh.name.toLowerCase().includes(q) ||
        wh.plant.toLowerCase().includes(q) ||
        wh.manager.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingWh(null);
    setFormWh({
      id: `WH-NEW-${Date.now().toString().slice(-4)}`,
      name: "",
      companyId: data.companies[0]?.id || "C01",
      plant: data.companies[0]?.plants[0] || "",
      type: "Nguyên vật liệu",
      location: "",
      manager: "Nguyễn An",
      status: "active",
      hasTxn: false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wh: Warehouse) => {
    setEditingWh(wh);
    setFormWh({ ...wh });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formWh.id?.trim() || !formWh.name?.trim()) {
      setFormError("Vui lòng nhập đầy đủ mã kho và tên kho.");
      return;
    }

    // Check duplicate ID if new
    if (!editingWh && data.warehouses.some((w) => w.id === formWh.id)) {
      setFormError("Mã kho đã tồn tại trong hệ thống.");
      return;
    }

    onSaveWarehouse(formWh as Warehouse, !editingWh);
    setIsModalOpen(false);
  };

  const handleToggleStatus = (wh: Warehouse) => {
    const updated: Warehouse = {
      ...wh,
      status: wh.status === "active" ? "inactive" : "active",
    };
    onSaveWarehouse(updated, false);
  };

  const handleDelete = (wh: Warehouse) => {
    // Check if transacted or has inventory
    const hasInventory = data.inventory.some((inv) => inv.warehouseId === wh.id && inv.onHand > 0);
    const hasTx = data.transactions.some((tx) => tx.warehouseId === wh.id) || wh.hasTxn;

    if (hasInventory || hasTx) {
      alert(
        `Không thể xóa kho [${wh.name}] vì đã phát sinh lịch sử giao dịch hoặc còn hàng tồn kho. Bạn có thể chuyển trạng thái kho sang "Ngừng hoạt động" để bảo toàn lịch sử sổ sách.`,
      );
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa kho [${wh.name}]? Thao tác không thể hoàn tác.`)) {
      onDeleteWarehouse(wh.id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Danh mục kho</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý danh sách kho, địa điểm, đơn vị sở hữu và trạng thái hoạt động trên toàn hệ thống.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
        >
          <WmsIcon name="plus" size={14} />
          <span>Thêm kho mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã kho, tên kho, địa điểm, thủ kho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <WmsIcon name="search" size={14} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả công ty</option>
            {data.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã kho</th>
                <th className="py-2.5 px-3">Tên kho</th>
                <th className="py-2.5 px-3">Công ty sở hữu</th>
                <th className="py-2.5 px-3">Nhà máy / Chi nhánh</th>
                <th className="py-2.5 px-3">Loại kho</th>
                <th className="py-2.5 px-3">Địa điểm</th>
                <th className="py-2.5 px-3">Thủ kho phụ trách</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Không tìm thấy kho nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((wh) => {
                  const company = companyMap.get(wh.companyId);
                  const isTransacted =
                    wh.hasTxn ||
                    data.transactions.some((t) => t.warehouseId === wh.id) ||
                    data.inventory.some((i) => i.warehouseId === wh.id && i.onHand > 0);

                  return (
                    <tr key={wh.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{wh.id}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{wh.name}</td>
                      <td className="py-2.5 px-3">{company?.name || wh.companyId}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{wh.plant}</td>
                      <td className="py-2.5 px-3">{wh.type}</td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate">
                        {wh.location}
                      </td>
                      <td className="py-2.5 px-3">{wh.manager}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            wh.status === "active"
                              ? "bg-green-500/10 text-green-600 border-green-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {wh.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(wh)}
                          className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(wh)}
                          className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                          title={wh.status === "active" ? "Tạm ngưng" : "Kích hoạt lại"}
                        >
                          {wh.status === "active" ? "Tạm ngưng" : "Kích hoạt"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(wh)}
                          disabled={isTransacted}
                          className={`h-6 px-2 rounded border text-[11px] font-medium transition-colors ${
                            isTransacted
                              ? "border-border text-muted-foreground opacity-40 cursor-not-allowed"
                              : "border-red-500/30 text-red-600 hover:bg-red-500/10"
                          }`}
                          title={isTransacted ? "Kho đã phát sinh biến động; không thể xóa" : "Xóa kho"}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight">
                {editingWh ? `Chỉnh sửa kho [${editingWh.id}]` : "Thêm mới kho vật tư"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Mã kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formWh.id || ""}
                    onChange={(e) => setFormWh({ ...formWh, id: e.target.value })}
                    disabled={Boolean(editingWh)}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tên kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formWh.name || ""}
                    onChange={(e) => setFormWh({ ...formWh, name: e.target.value })}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Công ty sở hữu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formWh.companyId || ""}
                    onChange={(e) => {
                      const cId = e.target.value;
                      const comp = companyMap.get(cId);
                      setFormWh({
                        ...formWh,
                        companyId: cId,
                        plant: comp?.plants[0] || "",
                      });
                    }}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {data.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Nhà máy / Chi nhánh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formWh.plant || ""}
                    onChange={(e) => setFormWh({ ...formWh, plant: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {(companyMap.get(formWh.companyId || "")?.plants || []).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Loại kho
                  </label>
                  <select
                    value={formWh.type || "Nguyên vật liệu"}
                    onChange={(e) => setFormWh({ ...formWh, type: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Nguyên vật liệu">Nguyên vật liệu</option>
                    <option value="Bán thành phẩm">Bán thành phẩm</option>
                    <option value="Thành phẩm">Thành phẩm</option>
                    <option value="Linh kiện">Linh kiện</option>
                    <option value="Phân phối">Phân phối</option>
                    <option value="Tổng hợp">Tổng hợp</option>
                    <option value="Phụ trợ">Phụ trợ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Thủ kho phụ trách
                  </label>
                  <input
                    type="text"
                    value={formWh.manager || ""}
                    onChange={(e) => setFormWh({ ...formWh, manager: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Địa điểm / Địa chỉ kho
                </label>
                <input
                  type="text"
                  value={formWh.location || ""}
                  onChange={(e) => setFormWh({ ...formWh, location: e.target.value })}
                  placeholder="Ví dụ: Lô B3, KCN VSIP 1..."
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
                >
                  Lưu kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

