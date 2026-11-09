import React, { useState } from "react";
import type { InventoryCountItem, Product, Warehouse, WmsDataState, WmsRole } from "../../../types/wms";
import { logAuditAction, saveWmsData } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsInventoryCountModalProps {
  onClose: () => void;
  data: WmsDataState;
  currentActor: string;
  currentRole: WmsRole;
  onUpdateState: (newState: WmsDataState) => void;
}

export const WmsInventoryCountModal: React.FC<WmsInventoryCountModalProps> = ({
  onClose,
  data,
  currentActor,
  currentRole,
  onUpdateState,
}) => {
  const [companyId, setCompanyId] = useState(data.companies[0]?.id || "C01");
  const availableWarehouses = data.warehouses.filter(
    (w) => w.companyId === companyId && w.status === "active",
  );
  const [warehouseId, setWarehouseId] = useState(availableWarehouses[0]?.id || "WH-BN-01");
  const [responsible, setResponsible] = useState(currentActor);
  const [snapshotAt] = useState(new Date().toISOString());

  // Snapshot of current stock for selected company & warehouse
  const snapshotItems = data.inventory.filter(
    (inv) => inv.companyId === companyId && inv.warehouseId === warehouseId,
  );

  // Map of entered count values
  const [countInputs, setCountInputs] = useState<Record<string, number | null>>({});
  const [formError, setFormError] = useState("");

  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));

  // Check if transactions occurred after snapshot
  const hasConcurrencyConflict = data.transactions.some(
    (tx) =>
      tx.companyId === companyId &&
      tx.warehouseId === warehouseId &&
      new Date(tx.date).getTime() > new Date(snapshotAt).getTime(),
  );

  const handleInputChange = (invId: string, val: string) => {
    setCountInputs({
      ...countInputs,
      [invId]: val === "" ? null : Number(val),
    });
  };

  const handleSaveCount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const hasAnyCount = Object.values(countInputs).some((v) => v !== null && !isNaN(v as number));
    if (!hasAnyCount) {
      setFormError("Vui lòng nhập số thực đếm cho ít nhất một mặt hàng.");
      return;
    }

    if (Object.values(countInputs).some((v) => v !== null && (v as number) < 0)) {
      setFormError("Số lượng kiểm đếm thực tế không được âm.");
      return;
    }

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const sessionId = `IC-${Date.now()}`;
    const countedAt = new Date().toISOString();

    const newCountRecords: InventoryCountItem[] = [];

    snapshotItems.forEach((inv) => {
      const counted = countInputs[inv.id];
      const prod = productMap.get(inv.productId);
      const isCounted = counted !== undefined && counted !== null && !isNaN(counted);

      newCountRecords.push({
        id: `${sessionId}-${inv.id}`,
        sessionId,
        companyId,
        warehouseId,
        productId: inv.productId,
        lot: inv.lot,
        unit: prod?.unit || "cái",
        systemQty: inv.onHand,
        countedQty: isCounted ? counted : null,
        delta: isCounted ? counted - inv.onHand : null,
        countedAt,
        actor: responsible,
      });
    });

    cloned.inventoryCounts = cloned.inventoryCounts || [];
    cloned.inventoryCounts.unshift(...newCountRecords);

    // Audit log
    const changedItems = newCountRecords.filter((r) => r.countedQty !== null && r.delta !== 0);
    logAuditAction(
      cloned,
      "Lưu kết quả kiểm kê kho",
      responsible,
      currentRole,
      sessionId,
      changedItems.map((c) => ({
        field: `${c.productId} (Lô: ${c.lot})`,
        before: c.systemQty,
        after: `${c.countedQty} (Lệch: ${c.delta! > 0 ? "+" : ""}${c.delta})`,
      })),
    );

    saveWmsData(cloned);
    onUpdateState(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              <WmsIcon name="count" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">Phiên kiểm kê tồn kho thực tế</h2>
              <p className="text-[10px] text-muted-foreground">
                Chụp tồn kho hệ thống tại thời điểm lập và ghi nhận số lượng thực đếm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
          >
            <WmsIcon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveCount} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 font-semibold flex items-center gap-2">
              <WmsIcon name="alert" size={16} />
              <span>{formError}</span>
            </div>
          )}

          {hasConcurrencyConflict && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-2">
              <WmsIcon name="alert" size={16} />
              <span>
                Cảnh báo: Có giao dịch kho phát sinh sau khi mở biểu mẫu. Vui lòng kiểm tra kỹ số tồn.
              </span>
            </div>
          )}

          {/* Scope Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/5">
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Công ty thành viên
              </label>
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  const whs = data.warehouses.filter((w) => w.companyId === e.target.value);
                  if (whs[0]) setWarehouseId(whs[0].id);
                }}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
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
                Kho kiểm kê <span className="text-red-500">*</span>
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {availableWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.id} · {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Người chịu trách nhiệm kiểm đếm
              </label>
              <input
                type="text"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                required
                className="w-full h-8 px-2.5 rounded-md border border-border bg-background font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground italic">
            * Nhập số thực đếm vào cột "Thực đếm". Dòng để trống sẽ được lưu là chưa kiểm kê. Thao tác này ghi nhận báo cáo đối soát và không tự ý điều chỉnh tồn kho vật lý trừ khi có quyết định xử lý.
          </div>

          {/* Table of items */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Mã hàng / Số lô</th>
                  <th className="py-2.5 px-3">Tên sản phẩm</th>
                  <th className="py-2.5 px-3 text-right">Tồn hệ thống</th>
                  <th className="py-2.5 px-3 w-32 text-right">Thực đếm</th>
                  <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshotItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Kho này hiện chưa có mặt hàng nào có số tồn hệ thống.
                    </td>
                  </tr>
                ) : (
                  snapshotItems.map((inv) => {
                    const prod = productMap.get(inv.productId);
                    const val = countInputs[inv.id];
                    const isEntered = val !== undefined && val !== null && !isNaN(val);
                    const delta = isEntered ? (val as number) - inv.onHand : null;

                    return (
                      <tr key={inv.id} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-primary">{inv.productId}</span>
                          <span className="text-muted-foreground ml-1.5 font-mono text-[10px]">
                            Lô: {inv.lot}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{prod?.name || "—"}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {inv.onHand.toLocaleString("vi-VN")} {prod?.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            placeholder="Chưa đếm"
                            value={val ?? ""}
                            onChange={(e) => handleInputChange(inv.id, e.target.value)}
                            className="w-28 h-7 px-2 text-right font-mono font-bold rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {delta === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : delta === 0 ? (
                            <span className="text-green-600">Khớp (0)</span>
                          ) : delta > 0 ? (
                            <span className="text-blue-600">+{delta} (Thừa)</span>
                          ) : (
                            <span className="text-red-600">{delta} (Thiếu)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-medium">
              Chụp tồn lúc: {new Date(snapshotAt).toLocaleString("vi-VN")}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded-md border border-border text-xs font-semibold hover:bg-muted/10"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
              >
                Lưu kết quả kiểm kê
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

