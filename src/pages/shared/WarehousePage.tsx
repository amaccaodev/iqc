import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SemiProduct, StockItemKind, WarehouseMovement, WarehouseStock } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import { catalogApi } from "../../services/api/CatalogApiService";
import { useRoleUser } from "../../hooks/useRoleUser";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { downloadWarehouseTemplate, parseWarehouseCsv } from "../../utils/warehouseImport";
import { toast } from "../../hooks/useToast";
import { EnterpriseWarehouseModule } from "../../components/warehouse/EnterpriseWarehouseModule";

type StockRow = WarehouseStock & { semiProduct?: SemiProduct };
type MovementRow = WarehouseMovement & { semiProduct?: SemiProduct };

interface WarehousePageProps {
  readOnly?: boolean;
}

const LOW_STOCK = 30;

export default function WarehousePage({ readOnly = false }: WarehousePageProps) {
  const { name } = useRoleUser();
  const fileRef = useRef<HTMLInputElement>(null);

  // View Mode: Enterprise WMS vs Simple BTP Legacy
  const [viewMode, setViewMode] = useState<"enterprise" | "legacy">("enterprise");

  const [itemKind, setItemKind] = useState<StockItemKind | "all">("all");
  const fetchStock = useStableFetch((query) => catalogApi.searchStock(query));
  const {
    items: stock,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    q,
    setQ,
    refresh: refreshStock,
  } = usePagedList({
    fetchPage: fetchStock,
    filters: { itemKind },
    pageSize: LIST_UI_PAGE_SIZE,
    enabled: true,
  });

  const [statsSku, setStatsSku] = useState(0);
  const [statsQty, setStatsQty] = useState(0);
  const [statsLow, setStatsLow] = useState(0);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [tab, setTab] = useState<"stock" | "import" | "history">("stock");
  const [importPreview, setImportPreview] = useState<ReturnType<typeof parseWarehouseCsv>>([]);
  const [importMsg, setImportMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [adjustId, setAdjustId] = useState("");
  const [adjustLabel, setAdjustLabel] = useState("");
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);

  const loadStats = useCallback(async () => {
    const all = await catalogApi.listStock();
    setStatsSku(all.length);
    setStatsQty(all.reduce((sum, r) => sum + r.qty, 0));
    setStatsLow(all.filter((r) => r.qty <= LOW_STOCK).length);
  }, []);

  const loadMovements = useCallback(async () => {
    const m = await catalogApi.listMovements(40);
    setMovements(m);
  }, []);

  useEffect(() => {
    void loadStats();
    void loadMovements();
  }, [loadStats, loadMovements]);

  const searchBtp = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => catalogApi.searchStock(query),
        (r) => ({
          id: r.itemId,
          label: `${r.semiProduct?.code ?? r.itemId} — ${r.semiProduct?.name ?? ""}`,
          subLabel: r.semiProduct
            ? `${r.itemKind === "product" ? "Thành phẩm" : "BTP"} · Tồn ${r.qty.toLocaleString("vi-VN")}`
            : undefined,
        }),
      ),
    [],
  );

  const reloadAll = useCallback(async () => {
    refreshStock();
    await Promise.all([loadStats(), loadMovements()]);
  }, [refreshStock, loadStats, loadMovements]);

  const saveQty = async (itemId: string, qty: number) => {
    await catalogApi.setStock(itemId, qty, "Kiểm kê tồn kho", name);
    await reloadAll();
  };

  const runAdjust = async () => {
    if (!adjustId) return;
    const delta = Number(adjustDelta);
    if (!delta || Number.isNaN(delta)) {
      toast.error("Nhập số lượng +/- hợp lệ");
      return;
    }
    await catalogApi.adjustStock(adjustId, delta, adjustNote || undefined, name);
    setAdjustDelta("");
    setAdjustNote("");
    setShowAdjust(false);
    await reloadAll();
  };

  const onPickFile = async (file: File) => {
    const rows = parseWarehouseCsv(await file.text());
    setImportPreview(rows);
    setImportMsg(rows.length ? `Đọc được ${rows.length} dòng` : "Không đọc được dòng nào");
  };

  const runImport = async () => {
    if (!importPreview.length) return;
    setBusy(true);
    try {
      const result = await catalogApi.importStock(importPreview);
      const errText = result.errors.length ? `\n${result.errors.slice(0, 5).join("\n")}` : "";
      setImportMsg(`Cập nhật ${result.updated} mặt hàng.${errText}`);
      setImportPreview([]);
      if (fileRef.current) fileRef.current.value = "";
      await reloadAll();
      setTab("stock");
    } catch (e) {
      setImportMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/15 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
          <span>Chế độ giao diện kho:</span>
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-background border border-border rounded-md">
          <button
            type="button"
            onClick={() => setViewMode("enterprise")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === "enterprise"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🏢 WMS Doanh nghiệp Đa cấp (11 Phân hệ)
          </button>
          <button
            type="button"
            onClick={() => setViewMode("legacy")}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              viewMode === "legacy"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 Kho BTP & Import CSV (Đơn giản)
          </button>
        </div>
      </div>

      {viewMode === "enterprise" ? (
        <EnterpriseWarehouseModule actorName={name || "Nguyễn An"} readOnly={readOnly} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Kho BTP & Kiểm kê nhanh</h1>
              <p className="text-xs text-muted-foreground">
                Xem và quản lý tồn kho bán thành phẩm, thành phẩm và công cụ import nhanh CSV.
              </p>
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant={tab === "stock" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setTab("stock")}
                >
                  <i className="fas fa-boxes-stacked" /> Danh sách tồn
                </Btn>
                <Btn
                  variant={tab === "import" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setTab("import")}
                >
                  <i className="fas fa-file-import" /> Import CSV
                </Btn>
                <Btn
                  variant={tab === "history" ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setTab("history")}
                >
                  <i className="fas fa-clock-rotate-left" /> Lịch sử biến động
                </Btn>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card cls="p-3.5">
              <div className="text-xs text-muted">Tổng mặt hàng</div>
              <div className="text-xl font-bold mt-1 text-primary">{statsSku}</div>
            </Card>
            <Card cls="p-3.5">
              <div className="text-xs text-muted">Tổng tồn kho</div>
              <div className="text-xl font-bold mt-1">{statsQty.toLocaleString("vi-VN")}</div>
            </Card>
            <Card cls="p-3.5">
              <div className="text-xs text-muted">Mặt hàng sắp hết (≤{LOW_STOCK})</div>
              <div className="text-xl font-bold mt-1 text-amber-600">{statsLow}</div>
            </Card>
            {!readOnly && (
              <div
                className="cursor-pointer"
                onClick={() => setShowAdjust(true)}
              >
                <Card cls="p-3.5 flex items-center justify-center hover:bg-muted/10 transition-colors">
                  <div className="text-center">
                    <i className="fas fa-sliders text-primary text-lg" />
                    <div className="text-xs font-semibold text-primary mt-1">Điều chỉnh tồn nhanh</div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {showAdjust && !readOnly && (
            <Card cls="p-4 border-primary/30 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Điều chỉnh tồn kho thủ công</span>
                <button
                  type="button"
                  onClick={() => setShowAdjust(false)}
                  className="text-muted text-xs hover:text-foreground"
                >
                  Đóng
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <SearchPicker
                  value={adjustId}
                  displayValue={adjustLabel}
                  placeholder="Chọn mặt hàng..."
                  onSearch={searchBtp}
                  onChange={(id: string, item) => {
                    setAdjustId(id);
                    setAdjustLabel(item?.label || "");
                  }}
                />
                <div>
                  <label className="text-xs text-muted font-medium block mb-1">
                    Số lượng thay đổi (+ hoặc -)
                  </label>
                  <input
                    type="number"
                    placeholder="VD: +10 hoặc -5"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted font-medium block mb-1">Ghi chú</label>
                  <input
                    type="text"
                    placeholder="Lý do điều chỉnh…"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Btn variant="secondary" size="sm" onClick={() => setShowAdjust(false)}>
                  Hủy
                </Btn>
                <Btn size="sm" onClick={() => void runAdjust()}>
                  Lưu điều chỉnh
                </Btn>
              </div>
            </Card>
          )}

          {tab === "stock" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-surface-2 border border-border rounded-lg text-xs">
                  {(["all", "semi_product", "product"] as const).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setItemKind(kind)}
                      className={`px-3 py-1 rounded font-medium transition-colors ${
                        itemKind === kind
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {kind === "all" ? "Tất cả" : kind === "semi_product" ? "BTP" : "Thành phẩm"}
                    </button>
                  ))}
                </div>
              </div>

              <ResponsiveDataList<StockRow>
                items={stock}
                total={total}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={setPageSize}
                getKey={(r) => r.itemId}
                columns={[
                  {
                    key: "code",
                    header: "Mã",
                    render: (r: StockRow) => (
                      <code className="text-xs font-semibold text-primary">
                        {r.semiProduct?.code ?? r.itemId}
                      </code>
                    ),
                  },
                  {
                    key: "name",
                    header: "Tên mặt hàng",
                    render: (r: StockRow) => (
                      <span className="font-medium text-sm">
                        {r.semiProduct?.name ?? r.itemId}
                      </span>
                    ),
                  },
                  {
                    key: "kind",
                    header: "Phân loại",
                    render: (r: StockRow) => (
                      <span className="text-xs text-muted">
                        {r.semiProduct
                          ? r.itemKind === "product"
                            ? "Thành phẩm"
                            : "BTP"
                          : "—"}
                      </span>
                    ),
                  },
                  {
                    key: "unit",
                    header: "ĐVT",
                    render: (r: StockRow) => (
                      <span className="text-xs text-muted">{r.semiProduct?.unitOfMeasureId ?? "—"}</span>
                    ),
                  },
                  {
                    key: "qty",
                    header: "Tồn kho",
                    render: (r: StockRow) => {
                      const low = r.qty <= LOW_STOCK;
                      return (
                        <span
                          className={`font-bold tabular-nums ${low ? "text-amber-600" : "text-foreground"}`}
                        >
                          {r.qty.toLocaleString("vi-VN")}
                          {low && (
                            <span className="ml-1 text-[10px] font-normal text-amber-500">
                              (sắp hết)
                            </span>
                          )}
                        </span>
                      );
                    },
                  },
                  ...(!readOnly
                    ? [
                        {
                          key: "count",
                          header: "Nhập số lượng kiểm kê",
                          render: (r: StockRow) => (
                            <input
                              type="number"
                              min={0}
                              className="w-24 border border-border rounded px-2 py-1 text-xs text-right"
                              defaultValue={String(r.qty)}
                              onBlur={(e) => {
                                const qty = Number(e.target.value);
                                if (Number.isNaN(qty) || qty < 0) return;
                                if (qty !== r.qty) void saveQty(r.itemId, qty);
                              }}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
                renderCard={(r) => {
                  const low = r.qty <= LOW_STOCK;
                  return (
                    <Card cls="p-3">
                      <div className="flex justify-between gap-2">
                        <div className="min-w-0">
                          <code className="text-[11px] text-muted">{r.semiProduct?.code}</code>
                          <div className="font-semibold text-sm truncate">
                            {r.semiProduct?.name ?? r.itemId}
                          </div>
                          <div className="text-xs text-muted">
                            {r.semiProduct
                              ? r.itemKind === "product"
                                ? "Thành phẩm"
                                : "BTP"
                              : "—"}
                          </div>
                        </div>
                        <div
                          className={`text-right font-bold tabular-nums ${low ? "text-amber-600" : "text-primary"}`}
                        >
                          {r.qty.toLocaleString("vi-VN")}
                          {low && <div className="text-[10px] font-normal">Sắp hết</div>}
                        </div>
                      </div>
                      {!readOnly && (
                        <input
                          type="number"
                          min={0}
                          className="w-full mt-2 border border-border rounded-lg px-2 py-1.5 text-sm"
                          defaultValue={String(r.qty)}
                          onBlur={(e) => {
                            const qty = Number(e.target.value);
                            if (Number.isNaN(qty) || qty < 0) return;
                            if (qty !== r.qty) void saveQty(r.itemId, qty);
                          }}
                        />
                      )}
                    </Card>
                  );
                }}
              />
            </>
          )}

          {tab === "import" && !readOnly && (
            <Card cls="p-4 lg:p-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Btn variant="secondary" onClick={downloadWarehouseTemplate}>
                  <i className="fas fa-download" /> Tải file mẫu
                </Btn>
                <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
                  <i className="fas fa-upload" /> Chọn file CSV
                </Btn>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onPickFile(f);
                  }}
                />
              </div>
              {importPreview.length > 0 && (
                <div className="text-xs border border-border rounded-lg overflow-hidden">
                  {importPreview.slice(0, 10).map((r, i) => (
                    <div
                      key={i}
                      className="flex justify-between px-3 py-2 border-t border-border first:border-0"
                    >
                      <code>{r.code}</code>
                      <span className="font-bold tabular-nums">{r.qty.toLocaleString("vi-VN")}</span>
                    </div>
                  ))}
                </div>
              )}
              {importMsg && <p className="text-sm whitespace-pre-wrap">{importMsg}</p>}
              {importPreview.length > 0 && (
                <Btn onClick={() => void runImport()}>{busy ? "Đang import…" : "Xác nhận import"}</Btn>
              )}
            </Card>
          )}

          {tab === "history" && !readOnly && (
            <div className="space-y-2">
              {movements.map((m) => (
                <Card key={m.id} cls="p-3 flex flex-wrap justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{m.semiProduct?.name ?? m.itemId}</span>
                    <code className="ml-2 text-[10px] text-muted">{m.semiProduct?.code}</code>
                    {m.note && <div className="text-xs text-muted mt-0.5">{m.note}</div>}
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold tabular-nums ${m.delta >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {m.delta >= 0 ? "+" : ""}
                      {m.delta.toLocaleString("vi-VN")}
                    </span>
                    <div className="text-xs text-muted-foreground">
                      Còn {m.qtyAfter.toLocaleString("vi-VN")} ·{" "}
                      {new Date(m.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                </Card>
              ))}
              {movements.length === 0 && (
                <Card cls="p-8 text-center text-sm text-muted-foreground">Chưa có biến động kho</Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
