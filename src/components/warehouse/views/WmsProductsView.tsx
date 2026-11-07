import React, { useState } from "react";
import type { Product, ProductItemType, WmsDataState } from "../../../types/wms";
import { WmsIcon } from "../WmsIcons";

interface WmsProductsViewProps {
  data: WmsDataState;
  onSaveProduct: (product: Product, isNew: boolean) => void;
}

export const WmsProductsView: React.FC<WmsProductsViewProps> = ({ data, onSaveProduct }) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterLot, setFilterLot] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formProduct, setFormProduct] = useState<Partial<Product>>({});
  const [formError, setFormError] = useState("");

  const filteredProducts = data.products.filter((p) => {
    if (filterType !== "all" && p.itemType !== filterType) return false;
    if (filterLot === "lot_only" && !p.lot) return false;
    if (filterLot === "expiry_only" && !p.expiry) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormProduct({
      id: `VT-${String(data.products.length + 1).padStart(3, "0")}`,
      name: "",
      category: "Nguyên vật liệu",
      itemType: "raw_material",
      unit: "kg",
      lot: true,
      expiry: false,
      min: 100,
      max: 1000,
      price: 50000,
      salePrice: 50000,
      costPrice: 42000,
      spec: "Tiêu chuẩn cơ sở",
      active: true,
      companyId: null,
      hasTxn: false,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormProduct({ ...p });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.id?.trim() || !formProduct.name?.trim()) {
      setFormError("Vui lòng nhập mã và tên mặt hàng.");
      return;
    }

    if (!editingProduct && data.products.some((p) => p.id === formProduct.id)) {
      setFormError("Mã mặt hàng đã tồn tại.");
      return;
    }

    onSaveProduct(formProduct as Product, !editingProduct);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Danh mục hàng hóa & vật tư</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý danh mục chung, cấu hình số lô, hạn sử dụng, giá vốn và định mức tồn an toàn (Min/Max).
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-primary/90"
        >
          <WmsIcon name="plus" size={14} />
          <span>Thêm mặt hàng mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã hàng, tên sản phẩm, nhóm..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="raw_material">Nguyên vật liệu</option>
            <option value="semi_finished">Bán thành phẩm</option>
            <option value="finished">Thành phẩm</option>
            <option value="other">Vật tư phụ / Khác</option>
          </select>

          <select
            value={filterLot}
            onChange={(e) => setFilterLot(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả cấu hình</option>
            <option value="lot_only">Có quản lý lô</option>
            <option value="expiry_only">Có hạn sử dụng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã hàng</th>
                <th className="py-2.5 px-3">Tên sản phẩm / vật tư</th>
                <th className="py-2.5 px-3">Phân loại</th>
                <th className="py-2.5 px-3">ĐVT</th>
                <th className="py-2.5 px-3 text-right">Đơn giá vốn</th>
                <th className="py-2.5 px-3 text-right">Giá bán / tham chiếu</th>
                <th className="py-2.5 px-3 text-center">Quản lý lô</th>
                <th className="py-2.5 px-3 text-center">Hạn sử dụng</th>
                <th className="py-2.5 px-3 text-right">Tồn an toàn (Min - Max)</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const typeLabels: Record<ProductItemType, { label: string; cls: string }> = {
                  raw_material: { label: "Nguyên vật liệu", cls: "bg-blue-500/10 text-blue-600" },
                  semi_finished: { label: "Bán thành phẩm", cls: "bg-amber-500/10 text-amber-600" },
                  finished: { label: "Thành phẩm", cls: "bg-green-500/10 text-green-600" },
                  other: { label: "Vật tư khác", cls: "bg-purple-500/10 text-purple-600" },
                };
                const conf = typeLabels[p.itemType] || typeLabels.other;

                return (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-primary">{p.id}</td>
                    <td className="py-2.5 px-3 font-medium">
                      <div className="text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.spec}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${conf.cls}`}>
                        {conf.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">{p.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {p.costPrice ? `${p.costPrice.toLocaleString("vi-VN")} đ` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                      {p.salePrice ? `${p.salePrice.toLocaleString("vi-VN")} đ` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.lot ? (
                        <span className="text-green-600 font-bold">✓ Có</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {p.expiry ? (
                        <span className="text-green-600 font-bold">✓ Có</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      <span className="text-red-500 font-semibold">{p.min}</span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className="text-muted-foreground">{p.max}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="h-6 px-2.5 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-tight">
                {editingProduct ? `Chỉnh sửa mặt hàng [${editingProduct.id}]` : "Thêm mới hàng hóa / vật tư"}
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
                    Mã sản phẩm / VT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formProduct.id || ""}
                    onChange={(e) => setFormProduct({ ...formProduct, id: e.target.value })}
                    disabled={Boolean(editingProduct)}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tên mặt hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formProduct.name || ""}
                    onChange={(e) => setFormProduct({ ...formProduct, name: e.target.value })}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Phân loại
                  </label>
                  <select
                    value={formProduct.itemType || "raw_material"}
                    onChange={(e) =>
                      setFormProduct({
                        ...formProduct,
                        itemType: e.target.value as ProductItemType,
                      })
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="raw_material">Nguyên vật liệu</option>
                    <option value="semi_finished">Bán thành phẩm</option>
                    <option value="finished">Thành phẩm</option>
                    <option value="other">Vật tư phụ / Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Đơn vị tính (ĐVT)
                  </label>
                  <input
                    type="text"
                    value={formProduct.unit || "cái"}
                    onChange={(e) => setFormProduct({ ...formProduct, unit: e.target.value })}
                    required
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Quy cách tiêu chuẩn
                  </label>
                  <input
                    type="text"
                    value={formProduct.spec || ""}
                    onChange={(e) => setFormProduct({ ...formProduct, spec: e.target.value })}
                    placeholder="Quy cách..."
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Đơn giá vốn (Cost Price) - VNĐ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formProduct.costPrice ?? 0}
                    onChange={(e) =>
                      setFormProduct({ ...formProduct, costPrice: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Đơn giá bán / Tham chiếu - VNĐ
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formProduct.salePrice ?? 0}
                    onChange={(e) =>
                      setFormProduct({ ...formProduct, salePrice: Number(e.target.value) })
                    }
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tồn kho tối thiểu (Min)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formProduct.min ?? 0}
                    onChange={(e) => setFormProduct({ ...formProduct, min: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Tồn kho tối đa (Max)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formProduct.max ?? 0}
                    onChange={(e) => setFormProduct({ ...formProduct, max: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/15 flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formProduct.lot)}
                    onChange={(e) => setFormProduct({ ...formProduct, lot: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">Theo dõi theo số lô (Lot Tracking)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(formProduct.expiry)}
                    onChange={(e) => setFormProduct({ ...formProduct, expiry: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-foreground">Theo dõi hạn sử dụng (Expiry Date)</span>
                </label>
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
                  Lưu mặt hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

