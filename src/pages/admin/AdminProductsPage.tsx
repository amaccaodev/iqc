import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Attachment, ProcessStage, ProductBomLine } from "@shared/types";
import type { PartChecklistItem } from "@shared/types/spec";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { PROCESS_STAGE_LABEL } from "@shared/constants/teams";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import AttachmentUploader from "../../components/files/AttachmentUploader";
import PartChecklistEditor from "../../components/admin/PartChecklistEditor";
import { catalogApi } from "../../services/api/CatalogApiService";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../hooks/useToast";
import {
  downloadProductBomTemplate,
  parseProductBomCsv,
  type ProductBomImportRow,
} from "../../utils/productBomImport";

const STAGES: ProcessStage[] = ["hot_forge", "auto", "assembly"];

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"products" | "semi" | "import">("products");
  const fileRef = useRef<HTMLInputElement>(null);
  const [importPreview, setImportPreview] = useState<ProductBomImportRow[]>([]);
  const [importMsg, setImportMsg] = useState("");
  const [importBusy, setImportBusy] = useState(false);

  const fetchProducts = useStableFetch((query) => catalogApi.searchProducts(query));
  const {
    items: products,
    total: productTotal,
    page: productPage,
    setPage: setProductPage,
    q: productQ,
    setQ: setProductQ,
    refresh: refreshProducts,
  } = usePagedList({
    fetchPage: fetchProducts,
    filters: { activeOnly: false },
    enabled: tab === "products",
    pageSize: LIST_UI_PAGE_SIZE,
  });

  const fetchSemis = useStableFetch((query) => catalogApi.searchSemiProducts(query));
  const {
    items: semis,
    total: semiTotal,
    page: semiPage,
    setPage: setSemiPage,
    q: semiQ,
    setQ: setSemiQ,
    refresh: refreshSemis,
  } = usePagedList({
    fetchPage: fetchSemis,
    enabled: tab === "semi",
    pageSize: LIST_UI_PAGE_SIZE,
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductLabel, setSelectedProductLabel] = useState("");
  const [bomLines, setBomLines] = useState<ProductBomLine[]>([]);
  const [productFiles, setProductFiles] = useState<Attachment[]>([]);
  const [selectedSemiId, setSelectedSemiId] = useState("");
  const [selectedSemiLabel, setSelectedSemiLabel] = useState("");
  const [semiFiles, setSemiFiles] = useState<Attachment[]>([]);
  const [semiChecklist, setSemiChecklist] = useState<PartChecklistItem[]>([]);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: "", name: "", description: "" });
  const [newSemi, setNewSemi] = useState({
    code: "",
    name: "",
    processStage: "hot_forge" as ProcessStage,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedProductId) {
      setBomLines([]);
      setProductFiles([]);
      return;
    }
    void catalogApi.listBom(selectedProductId).then(setBomLines);
    void catalogApi.listProductAttachments(selectedProductId).then(setProductFiles).catch(() => setProductFiles([]));
  }, [selectedProductId]);

  useEffect(() => {
    if (!selectedSemiId) {
      setSemiFiles([]);
      setSemiChecklist([]);
      return;
    }
    void catalogApi.listSemiAttachments(selectedSemiId).then(setSemiFiles).catch(() => setSemiFiles([]));
    void catalogApi
      .listSemiProducts()
      .then((list) => {
        const hit = list.find((s) => s.id === selectedSemiId);
        setSemiChecklist(hit?.checklist?.length ? hit.checklist : []);
      })
      .catch(() => setSemiChecklist([]));
  }, [selectedSemiId]);

  const saveChecklist = async () => {
    if (!selectedSemiId) return;
    const cleaned = semiChecklist.filter((c) => c.name?.trim());
    setChecklistSaving(true);
    try {
      await catalogApi.updateSemi(selectedSemiId, { checklist: cleaned });
      refreshSemis();
      toast.success(`Đã lưu ${cleaned.length} thông số đo cho linh kiện.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setChecklistSaving(false);
    }
  };

  const searchProductsPicker = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => catalogApi.searchProducts(query),
        (p) => ({ id: p.id, label: `${p.code} — ${p.name}` }),
      ),
    [],
  );

  const searchSemisPicker = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => catalogApi.searchSemiProducts(query),
        (s) => ({
          id: s.id,
          label: `${s.code} — ${s.name}`,
          subLabel: PROCESS_STAGE_LABEL[s.processStage],
        }),
      ),
    [],
  );

  const addProduct = async () => {
    if (!newProduct.code.trim() || !newProduct.name.trim()) {
      toast.error("Nhập mã và tên SP");
      return;
    }
    setSaving(true);
    try {
      await catalogApi.createProduct(newProduct);
      setNewProduct({ code: "", name: "", description: "" });
      refreshProducts();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addSemi = async () => {
    if (!newSemi.code.trim() || !newSemi.name.trim()) {
      toast.error("Nhập mã và tên BTP");
      return;
    }
    setSaving(true);
    try {
      await catalogApi.createSemi(newSemi);
      setNewSemi({ code: "", name: "", processStage: "hot_forge" });
      refreshSemis();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveBom = async () => {
    if (!selectedProductId) return;
    setSaving(true);
    try {
      const lines = bomLines.map((b) => ({
        semiProductId: b.semiProductId,
        qtyPerUnit: Number(b.qtyPerUnit) || 1,
      }));
      const next = await catalogApi.setBom(selectedProductId, lines);
      setBomLines(next);
      toast.success("Đã lưu định mức BOM");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addBomLine = () => {
    setBomLines((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        productId: selectedProductId,
        semiProductId: "",
        qtyPerUnit: 1,
      },
    ]);
  };

  const onPickImportFile = async (file: File) => {
    const text = await file.text();
    const rows = parseProductBomCsv(text);
    setImportPreview(rows);
    setImportMsg(
      rows.length
        ? `Đã đọc ${rows.length} dòng quy trình. Xem trước rồi bấm Xác nhận import.`
        : "Không đọc được dòng hợp lệ. Kiểm tra header CSV (Mã SP, Mã LK, STT QT, Tên quy trình…).",
    );
  };

  const runBomImport = async () => {
    if (!importPreview.length) return;
    setImportBusy(true);
    setImportMsg("");
    try {
      const result = await catalogApi.importProductBom(importPreview);
      const errBlock = result.errors.length
        ? `\nLỗi:\n- ${result.errors.slice(0, 8).join("\n- ")}`
        : "";
      setImportMsg(
        `Import xong: ${result.products} SP · ${result.parts} linh kiện · ${result.steps} quy trình.` +
          errBlock,
      );
      refreshProducts();
      refreshSemis();
      if (selectedProductId) {
        const next = await catalogApi.listBom(selectedProductId);
        setBomLines(next);
      }
    } catch (e) {
      setImportMsg((e as Error).message);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="max-w-full min-w-0">
      <h2 className="font-display font-800 text-xl mb-1">Danh mục sản phẩm</h2>
      <p className="text-sm text-muted mb-5">
        Thành phẩm, BTP/linh kiện và định mức quy trình (sheet Mẫu van).{" "}
        <Link to="/admin/warehouse" className="text-[#2D6EBD] underline">
          Quản lý tồn kho →
        </Link>
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {(
          [
            ["products", "Thành phẩm"],
            ["semi", "Bán thành phẩm"],
            ["import", "Import BOM"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border-0 cursor-pointer ${
              tab === t ? "bg-primary text-white" : "bg-card text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="space-y-4">
          <Card cls="p-4">
            <div className="font-semibold mb-3">Thêm thành phẩm</div>
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Mã SP"
                value={newProduct.code}
                onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
              />
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Tên SP"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Mô tả"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              />
            </div>
            <Btn onClick={() => void addProduct()} cls={saving ? "opacity-60" : ""}>
              Thêm SP
            </Btn>
          </Card>

          <Card cls="p-4">
            <div className="font-semibold mb-2">Định mức BTP cho thành phẩm</div>
            <SearchPicker
              className="mb-3"
              value={selectedProductId}
              displayValue={selectedProductLabel}
              placeholder="Tìm thành phẩm…"
              onSearch={searchProductsPicker}
              onChange={(id, item) => {
                setSelectedProductId(id);
                setSelectedProductLabel(item?.label ?? "");
              }}
            />
            <div className="space-y-2 mb-3">
              {bomLines.map((line, idx) => (
                <div key={line.id} className="rounded-xl border border-border p-2.5 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  <SearchPicker
                    className="flex-1"
                    value={line.semiProductId}
                    displayValue={
                      line.semiProduct
                        ? `${line.semiProduct.code} — ${line.semiProduct.name}`
                        : line.semiProductId
                          ? line.semiProductId
                          : ""
                    }
                    placeholder="Tìm BTP / linh kiện…"
                    onSearch={searchSemisPicker}
                    onChange={(id, item) => {
                      setBomLines((prev) =>
                        prev.map((b, i) =>
                          i === idx
                            ? {
                                ...b,
                                semiProductId: id,
                                semiProduct: item
                                  ? {
                                      id,
                                      code: item.label.split(" — ")[0] ?? "",
                                      name: item.label.split(" — ")[1] ?? item.label,
                                      processStage: "hot_forge",
                                      description: "",
                                      active: true,
                                    }
                                  : undefined,
                              }
                            : b,
                        ),
                      );
                    }}
                  />
                  <input
                    type="number"
                    className="w-full sm:w-24 border border-border rounded-lg px-3 py-2 text-sm"
                    value={String(line.qtyPerUnit)}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBomLines((prev) =>
                        prev.map((b, i) => (i === idx ? { ...b, qtyPerUnit: v } : b)),
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="text-red-500 text-sm border-0 bg-transparent cursor-pointer"
                    onClick={() => setBomLines((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    Xóa
                  </button>
                  </div>
                  {line.semiProduct?.processSteps && line.semiProduct.processSteps.length > 0 ? (
                    <div className="text-[11px] text-muted pl-1 space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {line.semiProduct.processSteps.length} quy trình (tuần tự)
                      </div>
                      {[...line.semiProduct.processSteps]
                        .sort((a, b) => a.seq - b.seq)
                        .map((s) => (
                          <div key={`${line.id}-${s.seq}`}>
                            QT {s.seq}: {s.process}
                            {s.machine ? ` · máy ${s.machine}` : ""}
                          </div>
                        ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn
                cls={`bg-slate-600 ${!selectedProductId ? "opacity-50 pointer-events-none" : ""}`}
                onClick={addBomLine}
              >
                + BTP
              </Btn>
              <Btn
                cls={!selectedProductId || saving ? "opacity-50 pointer-events-none" : ""}
                onClick={() => void saveBom()}
              >
                Lưu định mức
              </Btn>
            </div>
          </Card>

          {selectedProductId ? (
            <Card cls="p-4">
              <div className="font-semibold mb-2">Bản vẽ / thông số thành phẩm</div>
              <p className="text-xs text-muted mb-3">
                Có thể gắn nhiều file. Ảnh lưu WebP Base64 trong DB — không dùng link cloud.
              </p>
              <AttachmentUploader
                files={productFiles}
                uploadedBy={user?.name || "admin"}
                kind="drawing"
                onUploaded={async (att) => {
                  const saved = await catalogApi.addProductAttachment(selectedProductId, att);
                  setProductFiles((prev) => [...prev, saved]);
                }}
                onRemove={async (attId) => {
                  await catalogApi.removeProductAttachment(selectedProductId, attId);
                  setProductFiles((prev) => prev.filter((a) => a.id !== attId));
                }}
              />
            </Card>
          ) : null}

          <Card cls="p-3">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Tìm thành phẩm…"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
            />
            <ResponsiveDataList
              items={products}
              getKey={(p) => p.id}
              page={productPage}
              pageSize={LIST_UI_PAGE_SIZE}
              total={productTotal}
              onPage={setProductPage}
              emptyText="Không có sản phẩm"
              columns={[
                {
                  key: "code",
                  header: "Mã",
                  render: (p) => <code className="text-xs">{p.code}</code>,
                },
                {
                  key: "name",
                  header: "Tên",
                  render: (p) => <span className="font-semibold">{p.name}</span>,
                },
                {
                  key: "desc",
                  header: "Mô tả",
                  render: (p) => <span className="text-muted">{p.description || "—"}</span>,
                },
                {
                  key: "active",
                  header: "TT",
                  render: (p) => (
                    <span className={p.active ? "text-green-600" : "text-slate-400"}>
                      {p.active ? "Active" : "Off"}
                    </span>
                  ),
                },
              ]}
              renderCard={(p) => (
                <Card cls="p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <code className="text-xs text-muted">{p.code}</code>
                      <div className="font-semibold">{p.name}</div>
                    </div>
                    <span className={`text-xs ${p.active ? "text-green-600" : "text-slate-400"}`}>
                      {p.active ? "Active" : "Off"}
                    </span>
                  </div>
                </Card>
              )}
            />
          </Card>
        </div>
      )}

      {tab === "semi" && (
        <div className="space-y-4">
          <Card cls="p-4">
            <div className="font-semibold mb-3">Thêm bán thành phẩm</div>
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Mã BTP"
                value={newSemi.code}
                onChange={(e) => setNewSemi({ ...newSemi, code: e.target.value })}
              />
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Tên BTP"
                value={newSemi.name}
                onChange={(e) => setNewSemi({ ...newSemi, name: e.target.value })}
              />
              <select
                className="border border-border rounded-lg px-3 py-2 text-sm"
                value={newSemi.processStage}
                onChange={(e) =>
                  setNewSemi({ ...newSemi, processStage: e.target.value as ProcessStage })
                }
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {PROCESS_STAGE_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <Btn onClick={() => void addSemi()}>Thêm BTP</Btn>
          </Card>

          <Card cls="p-4">
            <div className="font-semibold mb-2">Bản vẽ / checklist đo linh kiện (BTP)</div>
            <p className="text-xs text-muted mb-3">
              Mỗi linh kiện có checklist đo riêng. Nhập full thông số tại đây — tạo lệnh SX sẽ copy
              nguyên sang BOM, không chọn lẻ.
            </p>
            <SearchPicker
              className="mb-3"
              value={selectedSemiId}
              displayValue={selectedSemiLabel}
              placeholder="Chọn BTP để gắn bản vẽ + checklist…"
              onSearch={searchSemisPicker}
              onChange={(id, item) => {
                setSelectedSemiId(id);
                setSelectedSemiLabel(item?.label ?? "");
              }}
            />
            {selectedSemiId ? (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold mb-2">Checklist đo kiểm</div>
                  <PartChecklistEditor items={semiChecklist} onChange={setSemiChecklist} />
                  <Btn
                    cls="mt-3"
                    onClick={() => void saveChecklist()}
                    disabled={checklistSaving}
                  >
                    {checklistSaving ? "Đang lưu…" : "Lưu checklist"}
                  </Btn>
                </div>
                <div>
                  <div className="text-sm font-semibold mb-2">Bản vẽ / file đính kèm</div>
                  <AttachmentUploader
                    files={semiFiles}
                    uploadedBy={user?.name || "admin"}
                    kind="drawing"
                    onUploaded={async (att) => {
                      const saved = await catalogApi.addSemiAttachment(selectedSemiId, att);
                      setSemiFiles((prev) => [...prev, saved]);
                    }}
                    onRemove={async (attId) => {
                      await catalogApi.removeSemiAttachment(selectedSemiId, attId);
                      setSemiFiles((prev) => prev.filter((a) => a.id !== attId));
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Chọn linh kiện ở trên để nhập checklist + bản vẽ.</p>
            )}
          </Card>

          <Card cls="p-3">
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-3"
              placeholder="Tìm BTP…"
              value={semiQ}
              onChange={(e) => setSemiQ(e.target.value)}
            />
            <ResponsiveDataList
              items={semis}
              getKey={(s) => s.id}
              page={semiPage}
              pageSize={LIST_UI_PAGE_SIZE}
              total={semiTotal}
              onPage={setSemiPage}
              emptyText="Không có BTP"
              columns={[
                {
                  key: "code",
                  header: "Mã",
                  render: (s) => <code className="text-xs">{s.code}</code>,
                },
                {
                  key: "name",
                  header: "Tên",
                  render: (s) => <span className="font-semibold">{s.name}</span>,
                },
                {
                  key: "stage",
                  header: "Công đoạn",
                  render: (s) => PROCESS_STAGE_LABEL[s.processStage],
                },
                {
                  key: "steps",
                  header: "Quy trình",
                  render: (s) =>
                    s.processSteps?.length
                      ? `${s.processSteps.length} QT`
                      : "—",
                },
                {
                  key: "checklist",
                  header: "Đo kiểm",
                  render: (s) =>
                    s.checklist?.length ? (
                      <span className="text-emerald-700 font-semibold">{s.checklist.length} TS</span>
                    ) : (
                      <span className="text-amber-700">Thiếu</span>
                    ),
                },
              ]}
              renderCard={(s) => (
                <Card cls="p-3">
                  <code className="text-xs text-muted">{s.code}</code>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-muted">
                    {PROCESS_STAGE_LABEL[s.processStage]}
                    {s.processSteps?.length
                      ? ` · ${s.processSteps.length} quy trình`
                      : ""}
                    {s.checklist?.length
                      ? ` · ${s.checklist.length} thông số đo`
                      : " · thiếu checklist"}
                  </div>
                </Card>
              )}
            />
          </Card>
        </div>
      )}

      {tab === "import" && (
        <Card cls="p-4 lg:p-5 space-y-4">
          <div>
            <div className="font-semibold mb-1">Import BOM theo linh kiện / quy trình</div>
            <p className="text-xs text-muted">
              Tải file mẫu CSV (UTF-8), điền theo sheet Mẫu van: mỗi dòng = 1 quy trình của 1 linh
              kiện thuộc 1 sản phẩm chính. Hệ thống tạo/cập nhật SP, BTP và định mức; khi tạo lệnh SX
              mỗi quy trình thành 1 BOM tuần tự.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={downloadProductBomTemplate}>
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
                if (f) void onPickImportFile(f);
                e.target.value = "";
              }}
            />
          </div>
          {importPreview.length > 0 && (
            <div className="text-xs border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
              <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-surface font-semibold text-muted sticky top-0">
                <span className="col-span-2">Mã SP</span>
                <span className="col-span-2">Mã LK</span>
                <span className="col-span-1">STT</span>
                <span className="col-span-4">Quy trình</span>
                <span className="col-span-3">Máy</span>
              </div>
              {importPreview.slice(0, 40).map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-1 px-3 py-2 border-t border-border"
                >
                  <code className="col-span-2 truncate">{r.productCode}</code>
                  <code className="col-span-2 truncate">{r.partCode}</code>
                  <span className="col-span-1 tabular-nums">{r.processSeq}</span>
                  <span className="col-span-4 truncate">{r.processName}</span>
                  <span className="col-span-3 truncate">{r.machine || "—"}</span>
                </div>
              ))}
              {importPreview.length > 40 && (
                <div className="px-3 py-2 text-muted border-t border-border">
                  … và {importPreview.length - 40} dòng nữa
                </div>
              )}
            </div>
          )}
          {importMsg && <p className="text-sm whitespace-pre-wrap">{importMsg}</p>}
          {importPreview.length > 0 && (
            <Btn onClick={() => void runBomImport()} disabled={importBusy}>
              {importBusy ? "Đang import…" : "Xác nhận import"}
            </Btn>
          )}
        </Card>
      )}
    </div>
  );
}
