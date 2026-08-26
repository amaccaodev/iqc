import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProcessStage, SemiProduct, WarehouseMovement, WarehouseStock } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { PROCESS_STAGE_LABEL } from "@shared/constants/teams";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import { catalogApi } from "../../services/api/CatalogApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { downloadWarehouseTemplate, parseWarehouseCsv } from "../../utils/warehouseImport";
import { toast } from "../../hooks/useToast";

type StockRow = WarehouseStock & { semiProduct?: SemiProduct };
type MovementRow = WarehouseMovement & { semiProduct?: SemiProduct };

interface WarehousePageProps {
  readOnly?: boolean;
}

const LOW_STOCK = 30;

export default function WarehousePage({ readOnly = false }: WarehousePageProps) {
  const { name } = useRoleUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ProcessStage | "all">("all");
  const fetchStock = useStableFetch((query) => catalogApi.searchStock(query));
  const {
    items: stock,
    total,
    page,
    setPage,
    q,
    setQ,
    refresh: refreshStock,
  } = usePagedList({
    fetchPage: fetchStock,
    filters: { stage },
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
          id: r.semiProductId,
          label: `${r.semiProduct?.code ?? r.semiProductId} — ${r.semiProduct?.name ?? ""}`,
          subLabel: r.semiProduct
            ? `${PROCESS_STAGE_LABEL[r.semiProduct.processStage]} · Tồn ${r.qty.toLocaleString("vi-VN")}`
            : undefined,
        }),
      ),
    [],
  );

  const reloadAll = useCallback(async () => {
    refreshStock();
    await Promise.all([loadStats(), loadMovements()]);
  }, [refreshStock, loadStats, loadMovements]);

  const saveQty = async (semiProductId: string, qty: number) => {
    await catalogApi.setStock(semiProductId, qty, "Kiểm kê tồn kho", name);
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
    <div className="max-w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="font-display font-800 text-xl lg:text-2xl mb-1">Quản lý kho BTP</h2>
          <p className="text-sm text-muted">
            Tồn kho bán thành phẩm — tìm kiếm + phân trang (mobile: thẻ, PC: bảng).
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            <Btn variant={tab === "stock" ? "primary" : "secondary"} onClick={() => setTab("stock")}>
              <i className="fas fa-boxes-stacked" /> Tồn kho
            </Btn>
            <Btn variant={tab === "import" ? "primary" : "secondary"} onClick={() => setTab("import")}>
              <i className="fas fa-file-excel" /> Import
            </Btn>
            <Btn variant={tab === "history" ? "primary" : "secondary"} onClick={() => setTab("history")}>
              <i className="fas fa-clock-rotate-left" /> Lịch sử
            </Btn>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card cls="p-3 text-center">
          <div className="text-2xl font-bold text-primary">{statsSku}</div>
          <div className="text-xs text-muted">Mặt hàng BTP</div>
        </Card>
        <Card cls="p-3 text-center">
          <div className="text-2xl font-bold text-primary">{statsQty.toLocaleString("vi-VN")}</div>
          <div className="text-xs text-muted">Tổng tồn</div>
        </Card>
        <Card cls="p-3 text-center">
          <div className={`text-2xl font-bold ${statsLow > 0 ? "text-amber-600" : "text-green-600"}`}>
            {statsLow}
          </div>
          <div className="text-xs text-muted">Sắp hết (≤{LOW_STOCK})</div>
        </Card>
      </div>

      {(tab === "stock" || readOnly) && (
        <>
          <Card cls="p-3 lg:p-4 mb-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="text-sm block sm:col-span-2 lg:col-span-1">
                <span className="text-muted">Tìm BTP</span>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Mã hoặc tên…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <label className="text-sm block">
                <span className="text-muted">Công đoạn</span>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                  value={stage}
                  onChange={(e) => setStage(e.target.value as ProcessStage | "all")}
                >
                  <option value="all">Tất cả</option>
                  {(Object.keys(PROCESS_STAGE_LABEL) as ProcessStage[]).map((s) => (
                    <option key={s} value={s}>
                      {PROCESS_STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="text-xs text-muted flex items-end pb-2">
                {total} kết quả · trang {page}
              </div>
            </div>
          </Card>

          {!readOnly && (
            <Card cls="p-3 lg:p-4 mb-4 space-y-3">
              <div className="font-semibold text-sm">Nhập / xuất kho nhanh</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SearchPicker
                  value={adjustId}
                  displayValue={adjustLabel}
                  placeholder="Tìm BTP…"
                  onSearch={searchBtp}
                  onChange={(id, item) => {
                    setAdjustId(id);
                    setAdjustLabel(item?.label ?? "");
                  }}
                />
                <input
                  className="border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="SL +/- (VD: 50 hoặc -20)"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                />
                <input
                  className="border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ghi chú"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
                <Btn onClick={() => void runAdjust()}>
                  <i className="fas fa-arrows-rotate" /> Cập nhật
                </Btn>
              </div>
            </Card>
          )}

          <ResponsiveDataList
            items={stock}
            getKey={(r) => r.semiProductId}
            page={page}
            pageSize={LIST_UI_PAGE_SIZE}
            total={total}
            onPage={setPage}
            emptyText="Không có mặt hàng phù hợp"
            columns={[
              {
                key: "code",
                header: "Mã BTP",
                render: (r) => (
                  <code className="text-xs">{r.semiProduct?.code ?? "—"}</code>
                ),
              },
              {
                key: "name",
                header: "Tên",
                render: (r) => (
                  <span className="font-medium">{r.semiProduct?.name ?? r.semiProductId}</span>
                ),
              },
              {
                key: "stage",
                header: "Công đoạn",
                render: (r) =>
                  r.semiProduct ? PROCESS_STAGE_LABEL[r.semiProduct.processStage] : "—",
              },
              {
                key: "qty",
                header: "Tồn kho",
                className: "text-right",
                render: (r) => {
                  const low = r.qty <= LOW_STOCK;
                  return (
                    <span className={`font-bold tabular-nums ${low ? "text-amber-600" : "text-primary"}`}>
                      {r.qty.toLocaleString("vi-VN")}
                      {low ? " ⚠" : ""}
                    </span>
                  );
                },
              },
              ...(!readOnly
                ? [
                    {
                      key: "audit",
                      header: "Kiểm kê",
                      render: (r: StockRow) => (
                        <input
                          type="number"
                          min={0}
                          className="w-28 border border-border rounded-lg px-2 py-1.5 text-sm"
                          defaultValue={String(r.qty)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const qty = Number(e.target.value);
                            if (Number.isNaN(qty) || qty < 0) return;
                            if (qty !== r.qty) void saveQty(r.semiProductId, qty);
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
                        {r.semiProduct?.name ?? r.semiProductId}
                      </div>
                      <div className="text-xs text-muted">
                        {r.semiProduct
                          ? PROCESS_STAGE_LABEL[r.semiProduct.processStage]
                          : "—"}
                      </div>
                    </div>
                    <div className={`text-right font-bold tabular-nums ${low ? "text-amber-600" : "text-primary"}`}>
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
                        if (qty !== r.qty) void saveQty(r.semiProductId, qty);
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
          <p className="text-xs text-muted">
            Import tồn kho từ Excel (xuất CSV UTF-8). Cột: Mã BTP, Số lượng.
          </p>
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
                <span className="font-medium">{m.semiProduct?.name ?? m.semiProductId}</span>
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
  );
}
