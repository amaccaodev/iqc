import { useMemo, useState } from "react";
import type { BomProcess, ProductStructureLine } from "@shared/types";
import { assessBomReadiness, type BomReadinessResult } from "@shared/utils/bomReadiness";
import { planStockUse } from "@shared/utils/stockUse";
import { Btn, Card, SearchPicker } from "../ui";
import type { SearchPickerItem } from "../ui/SearchPicker";
import { catalogApi } from "../../services/api/CatalogApiService";
import { orderApi } from "../../services/api/OrderApiService";
import { useAuth } from "../../hooks/useAuth";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { toast } from "../../hooks/useToast";

interface ProcessChoice {
  id: string;
  name: string;
  sortOrder: number;
  bomId: string;
  bomName?: string;
}

interface BomLineState {
  semiProductId: string;
  name: string;
  code: string;
  qtyPerUnit: number;
  stockQty: number;
  produceQty: number;
  useFromStock: boolean;
  stockUseQty: number;
  hasAttachments: boolean;
  hasChecklist: boolean;
  checklistCount: number;
  processes: ProcessChoice[];
  /** Một quy trình (BOM) = cả dây cắt phôi → hoàn thiện; nhiều BOM = phương án máy khác nhau */
  selectedBomId: string;
  selectedProcessIds: string[];
}

interface ProductRow {
  key: string;
  productId: string;
  productLabel: string;
  productCode: string;
  finishedQty: number;
  bomLines: BomLineState[];
  showBom: boolean;
  productHasAttachments: boolean;
  readiness: BomReadinessResult | null;
}

interface DirectorCreateOrderFormProps {
  onCreated?: () => void;
  onCancel?: () => void;
}

function newRowKey() {
  return `pr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyProductRow(): ProductRow {
  return {
    key: newRowKey(),
    productId: "",
    productLabel: "",
    productCode: "",
    finishedQty: 100,
    bomLines: [],
    showBom: false,
    productHasAttachments: false,
    readiness: null,
  };
}

function flattenProcesses(line: ProductStructureLine): ProcessChoice[] {
  return (line.boms ?? []).flatMap((b) =>
    [...(b.processes ?? [])]
      .sort((a, c) => a.sortOrder - c.sortOrder)
      .map((p: BomProcess) => ({
        id: p.id,
        name: p.name,
        sortOrder: p.sortOrder,
        bomId: b.id,
        bomName: b.name,
      })),
  );
}

function groupProcessesByBom(processes: ProcessChoice[]) {
  const map = new Map<string, { bomId: string; bomName: string; processes: ProcessChoice[] }>();
  for (const p of processes) {
    const key = p.bomId || "_";
    let g = map.get(key);
    if (!g) {
      g = { bomId: key, bomName: p.bomName || "BOM", processes: [] };
      map.set(key, g);
    }
    g.processes.push(p);
  }
  return [...map.values()];
}

function bomLinesToState(
  bom: ProductStructureLine[],
  finishedQty: number,
  attachFlags: Record<string, boolean>,
): BomLineState[] {
  return bom.map((b) => {
    const need = Math.ceil(finishedQty * Number(b.qtyPerUnit || 1));
    const specCount = Object.keys(b.semiProduct?.measurementSpecs ?? {}).length;
    const processes = flattenProcesses(b);
    const groups = groupProcessesByBom(processes);
    const selectedBomId = groups[0]?.bomId ?? "";
    return {
      semiProductId: b.semiProductId,
      name: b.semiProduct?.name ?? b.semiProductId,
      code: b.semiProduct?.code ?? "",
      qtyPerUnit: Number(b.qtyPerUnit) || 1,
      stockQty: Number(b.stockQty) || 0,
      produceQty: need,
      useFromStock: false,
      stockUseQty: 0,
      hasAttachments: Boolean(attachFlags[b.semiProductId]),
      hasChecklist: specCount > 0,
      checklistCount: specCount,
      processes,
      selectedBomId,
      selectedProcessIds: selectedBomId
        ? processes.filter((p) => p.bomId === selectedBomId).map((p) => p.id)
        : processes.length
          ? []
          : ["__all__"],
    };
  });
}

function applyStockPlan(
  line: BomLineState,
  finishedQty: number,
  stockUseQty?: number,
  useFromStock = line.useFromStock,
): BomLineState {
  const plan = planStockUse({
    need: finishedQty * line.qtyPerUnit,
    stockQty: line.stockQty,
    useFromStock,
    stockUseQty,
  });
  return {
    ...line,
    useFromStock,
    stockUseQty: plan.stockUseQty,
    produceQty: plan.produceQty,
  };
}

function recalcBom(lines: BomLineState[], finishedQty: number): BomLineState[] {
  return lines.map((l) =>
    applyStockPlan(l, finishedQty, l.useFromStock ? Math.min(finishedQty * l.qtyPerUnit, l.stockQty) : 0),
  );
}

function readinessOf(
  productName: string,
  productHasAttachments: boolean,
  lines: BomLineState[],
): BomReadinessResult {
  return assessBomReadiness({
    productName,
    productHasAttachments,
    lines: lines
      .filter((l) => l.selectedProcessIds.length > 0)
      .map((l) => ({
      name: l.name,
      code: l.code,
      hasAttachments: l.hasAttachments,
      hasChecklist: l.hasChecklist,
    })),
  });
}

export default function DirectorCreateOrderForm({ onCreated, onCancel }: DirectorCreateOrderFormProps) {
  const { user } = useAuth();
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<ProductRow[]>([emptyProductRow()]);
  const [saving, setSaving] = useState(false);

  const searchProducts = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => catalogApi.searchProducts(query),
        (p) => ({ id: p.id, label: p.name, subLabel: p.code }),
      ),
    [],
  );

  const loadBomForRow = async (
    key: string,
    productId: string,
    finishedQty: number,
    productLabel: string,
  ) => {
    if (!productId) {
      setRows((prev) =>
        prev.map((r) =>
          r.key === key
            ? { ...r, bomLines: [], showBom: false, productHasAttachments: false, readiness: null }
            : r,
        ),
      );
      return;
    }
    const [bom, productAtts] = await Promise.all([
      catalogApi.listBom(productId),
      catalogApi.listProductAttachments(productId).catch(() => []),
    ]);
    const attachFlags: Record<string, boolean> = {};
    await Promise.all(
      bom.map(async (b) => {
        try {
          const atts = await catalogApi.listSemiAttachments(b.semiProductId);
          attachFlags[b.semiProductId] = atts.length > 0;
        } catch {
          attachFlags[b.semiProductId] = false;
        }
      }),
    );
    const productHasAttachments = productAtts.length > 0;
    const bomLines = bomLinesToState(bom, finishedQty, attachFlags);
    const readiness = readinessOf(productLabel, productHasAttachments, bomLines);
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, bomLines, showBom: true, productHasAttachments, readiness }
          : r,
      ),
    );
  };

  const updateRow = (key: string, patch: Partial<ProductRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (patch.finishedQty !== undefined && next.bomLines.length) {
          next.bomLines = recalcBom(next.bomLines, next.finishedQty);
        }
        return next;
      }),
    );
  };

  const selectProduct = (key: string, id: string, item: SearchPickerItem | null) => {
    const qty = rows.find((r) => r.key === key)?.finishedQty ?? 100;
    const label = item?.label ?? "";
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              productId: id,
              productLabel: label,
              productCode: item?.subLabel ?? "",
            }
          : r,
      ),
    );
    void loadBomForRow(key, id, qty, label);
  };

  const addRow = () => setRows((prev) => [...prev, emptyProductRow()]);

  const removeRow = (key: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  };

  const toggleStock = (rowKey: string, idx: number, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const bomLines = r.bomLines.map((l, i) => {
          if (i !== idx) return l;
          const need = Math.ceil(r.finishedQty * l.qtyPerUnit);
          return applyStockPlan(l, r.finishedQty, checked ? Math.min(need, l.stockQty) : 0, checked);
        });
        return { ...r, bomLines };
      }),
    );
  };

  const setStockUseQty = (rowKey: string, idx: number, qty: number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        const bomLines = r.bomLines.map((l, i) =>
          i === idx ? applyStockPlan(l, r.finishedQty, qty, true) : l,
        );
        return { ...r, bomLines };
      }),
    );
  };

  const selectBom = (rowKey: string, semiProductId: string, bomId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        return {
          ...r,
          bomLines: r.bomLines.map((l) => {
            if (l.semiProductId !== semiProductId) return l;
            return {
              ...l,
              selectedBomId: bomId,
              selectedProcessIds: l.processes.filter((p) => p.bomId === bomId).map((p) => p.id),
            };
          }),
        };
      }),
    );
  };

  const toggleAllProcesses = (rowKey: string, semiProductId: string, checked: boolean) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.key !== rowKey) return r;
        return {
          ...r,
          bomLines: r.bomLines.map((l) => {
            if (l.semiProductId !== semiProductId) return l;
            if (!checked) {
              return { ...l, selectedBomId: "", selectedProcessIds: [] };
            }
            const firstBom = groupProcessesByBom(l.processes)[0]?.bomId ?? "";
            return {
              ...l,
              selectedBomId: firstBom,
              selectedProcessIds: firstBom
                ? l.processes.filter((p) => p.bomId === firstBom).map((p) => p.id)
                : ["__all__"],
            };
          }),
        };
      }),
    );
  };

  const submit = async () => {
    if (!user) return;
    if (!deadline) {
      toast.error("Nhập ngày hạn hoàn thành");
      return;
    }
    const valid = rows.filter((r) => r.productId && r.finishedQty > 0);
    if (!valid.length) {
      toast.error("Thêm ít nhất một sản phẩm (có SL > 0)");
      return;
    }
    for (const r of valid) {
      const selectedLines = r.bomLines.filter((l) =>
        l.produceQty > 0
          ? l.selectedProcessIds.length > 0
          : l.useFromStock && l.stockUseQty > 0,
      );
      if (!selectedLines.length) {
        toast.error(`«${r.productLabel}» — chọn quy trình BOM hoặc dùng kho`);
        return;
      }
      const missingProcess = selectedLines.find(
        (l) => l.produceQty > 0 && l.selectedProcessIds.length === 0,
      );
      if (missingProcess) {
        toast.error(`«${r.productLabel}» — ${missingProcess.name}: thiếu ${missingProcess.produceQty}, chọn quy trình SX`);
        return;
      }
      if (r.readiness && !r.readiness.complete) {
        const ok = await toast.confirm({
          title: "Thiếu tài liệu ĐMKT",
          message: `«${r.productLabel}»: ${r.readiness.summary}\n${r.readiness.warnings.join("\n")}\n\nVẫn gửi Quản đốc phê duyệt?`,
          confirmLabel: "Vẫn gửi",
        });
        if (!ok) return;
      }
    }

    setSaving(true);
    try {
      const created = await orderApi.createFromProductsBatch({
        deadline,
        note,
        createdBy: user.name,
        items: valid.map((r) => ({
          productId: r.productId,
          finishedQty: r.finishedQty,
          lines: r.bomLines
            .filter((l) =>
              l.produceQty > 0
                ? l.selectedProcessIds.length > 0
                : l.useFromStock && l.stockUseQty > 0,
            )
            .map((l) => ({
              semiProductId: l.semiProductId,
              produceQty: l.produceQty,
              useFromStock: l.useFromStock,
              stockUseQty: l.stockUseQty,
              processIds:
                l.produceQty <= 0 || l.selectedProcessIds.includes("__all__")
                  ? undefined
                  : l.selectedProcessIds,
            })),
        })),
      });
      toast.success(`Đã gửi ${created.length} lệnh — chờ Quản đốc phê duyệt`);
      onCreated?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const totalFinished = useMemo(
    () => rows.reduce((s, r) => s + (r.productId ? r.finishedQty : 0), 0),
    [rows],
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4 min-w-0">
      <Card cls="p-3 sm:p-4">
        <div className="flex items-center gap-3 bg-background rounded-xl p-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <i className="fas fa-hashtag text-white text-sm" />
          </div>
          <div>
            <div className="text-xs text-muted">Số lệnh SX</div>
            <div className="font-display font-800 text-base text-primary">
              Tự tạo {rows.filter((r) => r.productId).length || "…"} lệnh khi gửi
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <label className="text-sm">
            <span className="text-muted">
              Ngày hạn hoàn thành <span className="text-red-500">*</span>
            </span>
            <input
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-1"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">Tổng SL thành phẩm</span>
            <input
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-1 bg-surface"
              value={totalFinished.toLocaleString("vi-VN")}
              readOnly
            />
          </label>
        </div>

        <label className="text-sm block mb-1">
          <span className="text-muted">Ghi chú chung</span>
          <textarea
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-1 min-h-[64px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú"
          />
        </label>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-foreground">Sản phẩm giao sản xuất</h3>
        <Btn size="sm" variant="secondary" onClick={addRow}>
          <i className="fas fa-plus" /> Thêm sản phẩm
        </Btn>
      </div>

      {rows.map((row, rowIdx) => (
        <Card key={row.key} cls="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted">#{rowIdx + 1}</span>
            {rows.length > 1 && (
              <button
                type="button"
                className="text-xs text-red-600 border-0 bg-transparent cursor-pointer"
                onClick={() => removeRow(row.key)}
              >
                <i className="fas fa-trash mr-1" /> Xóa dòng
              </button>
            )}
          </div>

          <label className="text-sm block">
            <span className="text-muted">
              Tên sản phẩm <span className="text-red-500">*</span>
            </span>
            <SearchPicker
              className="mt-1"
              value={row.productId}
              displayValue={row.productLabel}
              placeholder="Gõ để tìm sản phẩm…"
              onSearch={searchProducts}
              onChange={(id, item) => selectProduct(row.key, id, item)}
            />
          </label>

          {row.readiness ? (
            <div
              className={`text-xs rounded-lg px-3 py-2 ${
                row.readiness.complete
                  ? "bg-emerald-50 text-emerald-800"
                  : row.readiness.canCreate
                    ? "bg-amber-50 text-amber-900"
                    : "bg-red-50 text-red-700"
              }`}
            >
              <span className="font-semibold">{row.readiness.summary}</span>
              {row.readiness.warnings.length > 0 ? (
                <ul className="mt-1 list-disc pl-4 space-y-0.5">
                  {row.readiness.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                <span className="ml-1">— đủ BTP và bản vẽ để giao SX</span>
              )}
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted">Mã SP</span>
              <input
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-1 bg-surface text-muted"
                value={row.productCode}
                readOnly
                placeholder="—"
              />
            </label>
            <label className="text-sm">
              <span className="text-muted">
                Số lượng <span className="text-red-500">*</span>
              </span>
              <input
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm mt-1"
                type="number"
                min={1}
                value={String(row.finishedQty)}
                onChange={(e) =>
                  updateRow(row.key, { finishedQty: Number(e.target.value) || 0 })
                }
              />
            </label>
          </div>

          {row.productId && (
            <div className="border-t border-border pt-3">
              <button
                type="button"
                className="text-xs font-semibold text-primary border-0 bg-transparent cursor-pointer mb-2"
                onClick={() => updateRow(row.key, { showBom: !row.showBom })}
              >
                <i className={`fas fa-chevron-${row.showBom ? "down" : "right"} mr-1`} />
                Định mức BOM ({row.bomLines.filter((l) => l.selectedProcessIds.length).length}/
                {row.bomLines.length} linh kiện)
              </button>
              {row.showBom && (
                <div className="space-y-2">
                  {row.bomLines.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sản phẩm chưa có định mức BTP</p>
                  )}
                  {row.bomLines.map((l) => {
                    const plan = planStockUse({
                      need: row.finishedQty * l.qtyPerUnit,
                      stockQty: l.stockQty,
                      useFromStock: l.useFromStock,
                      stockUseQty: l.stockUseQty,
                    });
                    const allOn =
                      l.processes.length > 0
                        ? Boolean(l.selectedBomId) && l.selectedProcessIds.length > 0
                        : l.selectedProcessIds.includes("__all__");
                    const recipes = groupProcessesByBom(l.processes);
                    const lineIdx = row.bomLines.findIndex((x) => x.semiProductId === l.semiProductId);
                    return (
                      <div
                        key={l.semiProductId}
                        className="rounded-lg border border-border bg-surface p-2.5 text-sm"
                      >
                        <label className="font-medium flex items-center gap-2 flex-wrap cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allOn}
                            onChange={(e) =>
                              toggleAllProcesses(row.key, l.semiProductId, e.target.checked)
                            }
                          />
                          {l.name}
                          {l.hasAttachments ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">Có file</span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">Thiếu bản vẽ</span>
                          )}
                          {l.hasChecklist ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              {l.checklistCount} thông số đo
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">Thiếu thông số đo</span>
                          )}
                        </label>
                        <div className="text-[11px] text-muted pl-6">
                          {l.code} · Cần {plan.need} · Tồn kho {plan.stockQty}
                          {l.useFromStock
                            ? ` · Dùng kho ${plan.stockUseQty} · Còn lại ${plan.leftover} · SX ${plan.produceQty}`
                            : ` · SX ${plan.produceQty}`}
                        </div>
                        {l.useFromStock ? (
                          <div
                            className={`mt-1.5 ml-6 rounded-md px-2 py-1 text-[11px] font-semibold ${
                              plan.covered
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-amber-50 text-amber-900"
                            }`}
                          >
                            {plan.covered
                              ? `Đủ kho — dùng ${plan.stockUseQty}, còn lại ${plan.leftover}, không cần SX`
                              : `Dùng kho ${plan.stockUseQty} · Còn lại ${plan.leftover} · Thiếu ${plan.shortage} (cần SX)`}
                          </div>
                        ) : null}
                        {l.processes.length > 0 ? (
                          <div className={`mt-2 pl-6 space-y-2 ${plan.covered ? "opacity-60" : ""}`}>
                            {recipes.length > 1 ? (
                              <p className="text-[10px] text-muted">
                                Chọn 1 quy trình — cùng dây cắt phôi → hoàn thiện, khác máy
                              </p>
                            ) : null}
                            {recipes.map((g) => {
                              const selected = l.selectedBomId === g.bomId;
                              return (
                                <div key={g.bomId}>
                                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`${row.key}-${l.semiProductId}-recipe`}
                                      checked={selected}
                                      disabled={plan.covered}
                                      onChange={() => selectBom(row.key, l.semiProductId, g.bomId)}
                                    />
                                    Quy trình: {g.bomName}
                                  </label>
                                  <div className="mt-0.5 pl-5 text-[11px] text-muted">
                                    {g.processes.map((p) => p.name).join(" → ")}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-800 mt-1 pl-6">
                            Linh kiện chưa có quy trình BOM — Admin cần nhập BOM trước.
                          </p>
                        )}
                        <div className="mt-1.5 pl-6 space-y-1.5">
                          <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={l.useFromStock}
                              disabled={l.stockQty <= 0}
                              onChange={(e) => toggleStock(row.key, lineIdx, e.target.checked)}
                            />
                            Dùng kho
                            {l.stockQty <= 0 ? (
                              <span className="text-muted font-normal">— hết tồn</span>
                            ) : null}
                          </label>
                          {l.useFromStock ? (
                            <label className="flex items-center gap-2 text-xs">
                              <span className="text-muted shrink-0">Lấy từ kho</span>
                              <input
                                className="w-28 border border-border rounded-lg px-2 py-1 text-sm"
                                type="number"
                                min={0}
                                max={l.stockQty}
                                value={String(l.stockUseQty)}
                                onChange={(e) =>
                                  setStockUseQty(row.key, lineIdx, Number(e.target.value) || 0)
                                }
                              />
                              <span className="text-muted">/ {l.stockQty}</span>
                            </label>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      <div className="flex gap-2 justify-end sticky bottom-20 sm:bottom-4 bg-background/90 py-2">
        {onCancel ? (
          <Btn variant="ghost" onClick={onCancel} disabled={saving}>
            Hủy
          </Btn>
        ) : null}
        <Btn onClick={() => void submit()} disabled={saving}>
          {saving ? "Đang gửi…" : "Gửi Quản đốc phê duyệt"}
        </Btn>
      </div>
    </div>
  );
}
