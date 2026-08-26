import { useMemo, useState } from "react";
import type { ProductBomLine } from "@shared/types";
import { PROCESS_STAGE_LABEL } from "@shared/constants/teams";
import { assessBomReadiness, type BomReadinessResult } from "@shared/utils/bomReadiness";
import { Btn, Card, SearchPicker } from "../ui";
import type { SearchPickerItem } from "../ui/SearchPicker";
import { catalogApi } from "../../services/api/CatalogApiService";
import { orderApi } from "../../services/api/OrderApiService";
import { useAuth } from "../../hooks/useAuth";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { toast } from "../../hooks/useToast";

const SIZE_PRESETS = ["DN15", "DN20", "DN25", "15", "20", "25", "Ø15", "Ø20", "Ø25"];

interface BomLineState {
  semiProductId: string;
  name: string;
  code: string;
  processStage: string;
  qtyPerUnit: number;
  stockQty: number;
  produceQty: number;
  useFromStock: boolean;
  stockUseQty: number;
  hasAttachments: boolean;
  hasChecklist: boolean;
  checklistCount: number;
}

interface ProductRow {
  key: string;
  productId: string;
  productLabel: string;
  productCode: string;
  size: string;
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
    size: "DN20",
    finishedQty: 100,
    bomLines: [],
    showBom: false,
    productHasAttachments: false,
    readiness: null,
  };
}

function bomLinesToState(
  bom: ProductBomLine[],
  finishedQty: number,
  attachFlags: Record<string, boolean>,
): BomLineState[] {
  return bom.map((b) => {
    const need = Math.ceil(finishedQty * Number(b.qtyPerUnit || 1));
    const checklist = b.semiProduct?.checklist?.filter((c) => c.name?.trim()) ?? [];
    return {
      semiProductId: b.semiProductId,
      name: b.semiProduct?.name ?? b.semiProductId,
      code: b.semiProduct?.code ?? "",
      processStage: b.semiProduct?.processStage ?? "hot_forge",
      qtyPerUnit: Number(b.qtyPerUnit) || 1,
      stockQty: Number(b.stockQty) || 0,
      produceQty: need,
      useFromStock: false,
      stockUseQty: 0,
      hasAttachments: Boolean(attachFlags[b.semiProductId]),
      hasChecklist: checklist.length > 0,
      checklistCount: checklist.length,
    };
  });
}

function recalcBom(lines: BomLineState[], finishedQty: number): BomLineState[] {
  return lines.map((l) => {
    const need = Math.ceil(finishedQty * l.qtyPerUnit);
    const stockUse = l.useFromStock ? Math.min(l.stockUseQty || need, l.stockQty, need) : 0;
    return {
      ...l,
      stockUseQty: l.useFromStock ? stockUse : 0,
      produceQty: Math.max(0, need - (l.useFromStock ? stockUse : 0)),
    };
  });
}

function readinessOf(
  productName: string,
  productHasAttachments: boolean,
  lines: BomLineState[],
): BomReadinessResult {
  return assessBomReadiness({
    productName,
    productHasAttachments,
    lines: lines.map((l) => ({
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
          const stockUse = checked ? Math.min(need, l.stockQty) : 0;
          return {
            ...l,
            useFromStock: checked,
            stockUseQty: stockUse,
            produceQty: Math.max(0, need - stockUse),
          };
        });
        return { ...r, bomLines };
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
      if (!r.size.trim()) {
        toast.error(`Nhập kích cỡ cho «${r.productLabel || r.productCode}»`);
        return;
      }
      if (!r.bomLines.length) {
        toast.error(`«${r.productLabel}» chưa có định mức BTP — chưa hoàn thiện BOM`);
        return;
      }
      if (r.readiness && !r.readiness.complete) {
        const ok = await toast.confirm({
          title: "Thiếu tài liệu ĐMKT",
          message: `«${r.productLabel}»: ${r.readiness.summary}\n${r.readiness.warnings.join("\n")}\n\nVẫn tạo lệnh? (Quản đốc/GĐ sẽ nhận thông báo thiếu file)`,
          confirmLabel: "Vẫn tạo",
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
          size: r.size.trim(),
          lines: r.bomLines.map((l) => ({
            semiProductId: l.semiProductId,
            produceQty: l.produceQty,
            useFromStock: l.useFromStock,
            stockUseQty: l.stockUseQty,
          })),
        })),
      });
      toast.success(`Đã tạo ${created.length} lệnh sản xuất`);
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
            placeholder="Tùy chọn — áp dụng mọi lệnh trong lần tạo này"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                Kích cỡ <span className="text-red-500">*</span>
              </span>
              <div className="mt-1 flex gap-1">
                <select
                  className="border border-border rounded-lg px-2 py-2.5 text-sm bg-card"
                  value={SIZE_PRESETS.includes(row.size) ? row.size : ""}
                  onChange={(e) => {
                    if (e.target.value) updateRow(row.key, { size: e.target.value });
                  }}
                >
                  <option value="">Khác…</option>
                  {SIZE_PRESETS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <input
                  className="flex-1 border border-border rounded-lg px-3 py-2.5 text-sm"
                  value={row.size}
                  onChange={(e) => updateRow(row.key, { size: e.target.value })}
                  placeholder="DN20"
                />
              </div>
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
                className="text-xs font-semibold text-[#2D6EBD] border-0 bg-transparent cursor-pointer mb-2"
                onClick={() => updateRow(row.key, { showBom: !row.showBom })}
              >
                <i className={`fas fa-chevron-${row.showBom ? "down" : "right"} mr-1`} />
                Định mức BTP ({row.bomLines.length})
              </button>
              {row.showBom && (
                <div className="space-y-2">
                  {row.bomLines.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sản phẩm chưa có định mức BTP</p>
                  )}
                  {row.bomLines.map((l, idx) => {
                    const need = Math.ceil(row.finishedQty * l.qtyPerUnit);
                    return (
                      <div
                        key={l.semiProductId}
                        className="rounded-lg border border-border bg-surface p-2.5 text-sm"
                      >
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {l.name}
                          {l.hasAttachments ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">Có file</span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">Thiếu bản vẽ</span>
                          )}
                          {l.hasChecklist ? (
                            <span className="text-[10px] text-emerald-700 font-semibold">
                              Checklist {l.checklistCount} điểm
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-700 font-semibold">Thiếu checklist đo</span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted">
                          {PROCESS_STAGE_LABEL[l.processStage as keyof typeof PROCESS_STAGE_LABEL] ??
                            l.processStage}{" "}
                          · Cần {need} · SX {l.produceQty} · Kho {l.stockQty}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Thông số đo lấy full từ danh mục BTP — không chọn lẻ khi tạo lệnh.
                        </p>
                        <label className="flex items-center gap-2 text-xs mt-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={l.useFromStock}
                            disabled={l.stockQty <= 0}
                            onChange={(e) => toggleStock(row.key, idx, e.target.checked)}
                          />
                          Dùng kho
                        </label>
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
          {saving ? "Đang tạo…" : "Tạo lệnh SX"}
        </Btn>
      </div>
    </div>
  );
}
