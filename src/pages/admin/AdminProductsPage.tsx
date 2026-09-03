import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Attachment, MeasurementSpecMap, ProductStructureLine } from "@shared/types";
import { TEAMS } from "@shared/constants/teams";
import { ACTIVE_STATUS_LABEL } from "@shared/constants/labels";
import type { PartChecklistItem } from "@shared/types/spec";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import AttachmentUploader from "../../components/files/AttachmentUploader";
import PartChecklistEditor from "../../components/admin/PartChecklistEditor";
import CatalogImportForm from "../../components/admin/CatalogImportForm";
import { catalogApi } from "../../services/api/CatalogApiService";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "../../hooks/useToast";

const field =
  "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input text-foreground";

type ProcessDraft = {
  id?: string;
  name: string;
  productionTeamId: string;
  machineGroupId: string;
  quotaPerShift: number;
  sortOrder: number;
};
type BomDraft = { key: string; id?: string; name: string; processes: ProcessDraft[] };

function emptyProcess(sortOrder = 1): ProcessDraft {
  return { name: "", productionTeamId: "t_hot", machineGroupId: "", quotaPerShift: 0, sortOrder };
}
function emptyBomDraft(): BomDraft {
  return { key: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: "BOM", processes: [emptyProcess(1)] };
}

function ActiveBadge({ active }: { active?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {active ? ACTIVE_STATUS_LABEL.active : ACTIVE_STATUS_LABEL.inactive}
    </span>
  );
}

function specsToChecklist(specs: MeasurementSpecMap): PartChecklistItem[] {
  return Object.entries(specs).map(([name, t]) => ({
    name,
    type: t === "boolean" ? "qualitative" : t === "text" ? "text" : "numeric",
  }));
}

function checklistToSpecs(items: PartChecklistItem[]): MeasurementSpecMap {
  const out: MeasurementSpecMap = {};
  for (const i of items.filter((x) => x.name?.trim())) {
    const key = i.name.trim();
    if (i.type === "qualitative") out[key] = "boolean";
    else if (i.type === "text") out[key] = "text";
    else out[key] = "float";
  }
  return out;
}

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"products" | "semi" | "bom" | "import">("products");

  const fetchProducts = useStableFetch((query) => catalogApi.searchProducts(query));
  const {
    items: products,
    total: productTotal,
    page: productPage,
    pageSize: productPageSize,
    setPage: setProductPage,
    setPageSize: setProductPageSize,
    q: productQ,
    setQ: setProductQ,
    refresh: refreshProducts,
  } = usePagedList({
    fetchPage: fetchProducts,
    filters: { activeOnly: false },
    enabled: tab === "products" || tab === "semi" || tab === "bom" || tab === "import",
    pageSize: LIST_UI_PAGE_SIZE,
  });

  const fetchSemis = useStableFetch((query) => catalogApi.searchSemiProducts(query));
  const {
    items: semis,
    total: semiTotal,
    page: semiPage,
    pageSize: semiPageSize,
    setPage: setSemiPage,
    setPageSize: setSemiPageSize,
    q: semiQ,
    setQ: setSemiQ,
    refresh: refreshSemis,
  } = usePagedList({
    fetchPage: fetchSemis,
    enabled: tab === "semi" || tab === "bom" || tab === "import",
    pageSize: LIST_UI_PAGE_SIZE,
  });

  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductLabel, setSelectedProductLabel] = useState("");
  const [bomLines, setBomLines] = useState<ProductStructureLine[]>([]);
  const [productFiles, setProductFiles] = useState<Attachment[]>([]);
  const [selectedSemiId, setSelectedSemiId] = useState("");
  const [selectedSemiLabel, setSelectedSemiLabel] = useState("");
  const [semiFiles, setSemiFiles] = useState<Attachment[]>([]);
  const [semiChecklist, setSemiChecklist] = useState<PartChecklistItem[]>([]);
  const [checklistSaving, setChecklistSaving] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddSemi, setShowAddSemi] = useState(false);
  const [newProduct, setNewProduct] = useState({ code: "", name: "", description: "" });
  const [newSemi, setNewSemi] = useState({
    code: "",
    name: "",
    productId: "",
  });
  const [saving, setSaving] = useState(false);
  const [bomSemiId, setBomSemiId] = useState("");
  const [bomSemiLabel, setBomSemiLabel] = useState("");
  const [bomDrafts, setBomDrafts] = useState<BomDraft[]>([]);
  const [bomSaving, setBomSaving] = useState(false);
  const productDetailRef = useRef<HTMLDivElement>(null);
  const semiDetailRef = useRef<HTMLDivElement>(null);

  const openProduct = (p: { id: string; code: string; name: string }) => {
    setSelectedProductId(p.id);
    setSelectedProductLabel(`${p.code} — ${p.name}`);
    requestAnimationFrame(() => {
      productDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openSemi = (s: { id: string; code: string; name: string }) => {
    setSelectedSemiId(s.id);
    setSelectedSemiLabel(`${s.code} — ${s.name}`);
    requestAnimationFrame(() => {
      semiDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
        setSemiChecklist(hit ? specsToChecklist(hit.measurementSpecs ?? {}) : []);
      })
      .catch(() => setSemiChecklist([]));
  }, [selectedSemiId]);

  useEffect(() => {
    if (!bomSemiId) {
      setBomDrafts([]);
      return;
    }
    void catalogApi
      .listSemiBoms(bomSemiId)
      .then((list) => {
        setBomDrafts(
          list.length
            ? list.map((b) => {
                const procs = [...(b.processes ?? [])].sort((a, c) => a.sortOrder - c.sortOrder);
                return {
                  key: b.id,
                  id: b.id,
                  name: b.name || "BOM",
                  processes: procs.length
                    ? procs.map((p) => ({
                        id: p.id,
                        name: p.name,
                        productionTeamId: p.productionTeamId || "",
                        machineGroupId: p.machineGroupId || "",
                        quotaPerShift: p.quotaPerShift || 0,
                        sortOrder: p.sortOrder,
                      }))
                    : [emptyProcess(1)],
                };
              })
            : [emptyBomDraft()],
        );
      })
      .catch(() => setBomDrafts([emptyBomDraft()]));
  }, [bomSemiId]);

  const saveProcessBom = async () => {
    if (!bomSemiId) return;
    const boms = bomDrafts
      .map((d) => ({
        id: d.id,
        name: d.name.trim() || "BOM",
        processes: d.processes
          .map((p, i) => ({ ...p, name: p.name.trim(), sortOrder: i + 1 }))
          .filter((p) => p.name),
      }))
      .filter((b) => b.processes.length > 0);
    if (!boms.length) {
      toast.error("Nhập ít nhất một quy trình");
      return;
    }
    setBomSaving(true);
    try {
      const saved = await catalogApi.upsertSemiBom(bomSemiId, { boms });
      setBomDrafts(
        saved.map((b) => ({
          key: b.id,
          id: b.id,
          name: b.name,
          processes: (b.processes ?? []).length
            ? [...(b.processes ?? [])].sort((a, c) => a.sortOrder - c.sortOrder).map((p) => ({
                id: p.id,
                name: p.name,
                productionTeamId: p.productionTeamId || "",
                machineGroupId: p.machineGroupId || "",
                quotaPerShift: p.quotaPerShift || 0,
                sortOrder: p.sortOrder,
              }))
            : [emptyProcess(1)],
        })),
      );
      toast.success(`Đã lưu ${boms.length} BOM · ${boms.reduce((s, b) => s + b.processes.length, 0)} quy trình`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBomSaving(false);
    }
  };

  const saveChecklist = async () => {
    if (!selectedSemiId) return;
    const cleaned = semiChecklist.filter((c) => c.name?.trim());
    setChecklistSaving(true);
    try {
      await catalogApi.updateSemi(selectedSemiId, { measurementSpecs: checklistToSpecs(cleaned) });
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
          subLabel: s.productId,
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
      setShowAddProduct(false);
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
      if (!newSemi.productId) {
        toast.error("Chọn thành phẩm cho BTP");
        return;
      }
      await catalogApi.createSemi({
        ...newSemi,
        measurementSpecs: {},
        active: true,
      });
      setNewSemi({ code: "", name: "", productId: "" });
      setShowAddSemi(false);
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
        semiProductId: "",
        qtyPerUnit: 1,
        stockQty: 0,
      },
    ]);
  };

  return (
    <div className="max-w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display font-800 text-2xl">Danh mục sản phẩm</h2>
        </div>
        <Link
          to="/admin/warehouse"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
        >
          <i className="fas fa-warehouse" /> Quản lý tồn kho
        </Link>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-2xl bg-card border border-border w-full lg:w-fit overflow-x-auto">
        {(
          [
            ["products", "Thành phẩm", "fa-box"],
            ["semi", "Linh kiện", "fa-puzzle-piece"],
            ["bom", "BOM / quy trình", "fa-diagram-project"],
            ["import", "Nhập dữ liệu", "fa-file-import"],
          ] as const
        ).map(([t, label, icon]) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-0 cursor-pointer whitespace-nowrap ${
              tab === t ? "bg-primary text-white shadow-sm" : "bg-transparent text-muted hover:bg-surface"
            }`}
          >
            <i className={`fas ${icon} text-xs`} /> {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">
          <div className="space-y-4 min-w-0">
          {showAddProduct ? (
          <Card cls="p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="font-semibold">Thêm thành phẩm</div>
              <button
                type="button"
                className="text-sm text-muted border-0 bg-transparent cursor-pointer"
                onClick={() => {
                  setShowAddProduct(false);
                  setNewProduct({ code: "", name: "", description: "" });
                }}
              >
                Hủy
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-3 mt-3">
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Mã thành phẩm</span>
                <input
                  className={field}
                  placeholder="Mã"
                  value={newProduct.code}
                  onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Tên thành phẩm</span>
                <input
                  className={field}
                  placeholder="Tên hiển thị"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Mô tả</span>
                <input
                  className={field}
                  placeholder="Mô tả"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </label>
            </div>
            <Btn onClick={() => void addProduct()} cls={saving ? "opacity-60" : ""}>
              Lưu thành phẩm
            </Btn>
          </Card>
          ) : null}

          <Card cls="p-4 lg:p-5">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="font-semibold">Danh sách thành phẩm</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted tabular-nums">{productTotal} mục</div>
                {!showAddProduct ? (
                  <Btn size="sm" onClick={() => setShowAddProduct(true)}>
                    <i className="fas fa-plus" /> Thêm
                  </Btn>
                ) : null}
              </div>
            </div>
            <input
              className={`${field} mb-3`}
              placeholder="Tìm mã, tên thành phẩm…"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
            />
            <ResponsiveDataList
              items={products}
              getKey={(p) => p.id}
              page={productPage}
              pageSize={productPageSize}
              total={productTotal}
              onPage={setProductPage}
              onPageSize={setProductPageSize}
              emptyText="Không có sản phẩm"
              onRowClick={(p) => openProduct(p)}
              isRowActive={(p) => p.id === selectedProductId}
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
                  header: "Trạng thái",
                  render: (p) => <ActiveBadge active={p.active} />,
                },
              ]}
              renderCard={(p) => (
                <Card cls="p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <code className="text-xs text-muted">{p.code}</code>
                      <div className="font-semibold">{p.name}</div>
                    </div>
                    <ActiveBadge active={p.active} />
                  </div>
                </Card>
              )}
            />
          </Card>
          </div>

          <div ref={productDetailRef} className="space-y-4 lg:sticky lg:top-4 min-w-0">
          <Card cls="p-4 lg:p-5">
            <div className="font-semibold mb-3">
              {selectedProductId ? `Chi tiết — ${selectedProductLabel}` : "Định mức linh kiện"}
            </div>
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
                <div key={line.semiProductId || `new-${idx}`} className="rounded-xl border border-border p-2.5 space-y-2">
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
                                      productId: selectedProductId,
                                      measurementSpecs: {},
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
                  {line.boms?.some((b) => (b.processes?.length ?? 0) > 0) ? (
                    <div className="text-[11px] text-muted pl-1 space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {line.boms.reduce((n, b) => n + (b.processes?.length ?? 0), 0)} quy trình (tuần tự)
                      </div>
                      {line.boms.flatMap((b) =>
                        [...(b.processes ?? [])]
                          .sort((a, c) => a.sortOrder - c.sortOrder)
                          .map((p) => (
                            <div key={p.id}>
                              QT {p.sortOrder}: {p.name}
                            </div>
                          )),
                      )}
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
              <div className="font-semibold mb-3">Bản vẽ / thông số thành phẩm</div>
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
          </div>
        </div>
      )}

      {tab === "semi" && (
        <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">
          <div className="space-y-4 min-w-0">
          {showAddSemi ? (
          <Card cls="p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="font-semibold">Thêm linh kiện</div>
              <button
                type="button"
                className="text-sm text-muted border-0 bg-transparent cursor-pointer"
                onClick={() => {
                  setShowAddSemi(false);
                  setNewSemi({ code: "", name: "", productId: "" });
                }}
              >
                Hủy
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-3 mt-3">
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Mã linh kiện</span>
                <input
                  className={field}
                  placeholder="Mã"
                  value={newSemi.code}
                  onChange={(e) => setNewSemi({ ...newSemi, code: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Tên linh kiện</span>
                <input
                  className={field}
                  placeholder="Tên hiển thị"
                  value={newSemi.name}
                  onChange={(e) => setNewSemi({ ...newSemi, name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="block text-[11px] font-semibold text-muted mb-1">Thành phẩm</span>
                <select
                  className={field}
                  value={newSemi.productId}
                  onChange={(e) => setNewSemi({ ...newSemi, productId: e.target.value })}
                >
                  <option value="">— Chọn thành phẩm —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Btn onClick={() => void addSemi()}>Lưu linh kiện</Btn>
          </Card>
          ) : null}

          <Card cls="p-4 lg:p-5">
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="font-semibold">Danh sách linh kiện</div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted tabular-nums">{semiTotal} mục</div>
                {!showAddSemi ? (
                  <Btn size="sm" onClick={() => setShowAddSemi(true)}>
                    <i className="fas fa-plus" /> Thêm
                  </Btn>
                ) : null}
              </div>
            </div>
            <input
              className={`${field} mb-3`}
              placeholder="Tìm mã, tên linh kiện…"
              value={semiQ}
              onChange={(e) => setSemiQ(e.target.value)}
            />
            <ResponsiveDataList
              items={semis}
              getKey={(s) => s.id}
              page={semiPage}
              pageSize={semiPageSize}
              total={semiTotal}
              onPage={setSemiPage}
              onPageSize={setSemiPageSize}
              emptyText="Không có BTP"
              onRowClick={(s) => openSemi(s)}
              isRowActive={(s) => s.id === selectedSemiId}
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
                  key: "product",
                  header: "Thành phẩm",
                  render: (s) => {
                    const p = products.find((x) => x.id === s.productId);
                    return <span className="text-xs">{p ? `${p.code}` : s.productId}</span>;
                  },
                },
                {
                  key: "specs",
                  header: "Đo kiểm",
                  render: (s) => {
                    const n = Object.keys(s.measurementSpecs ?? {}).length;
                    return n ? (
                      <span className="text-emerald-700 font-semibold">{n} thông số</span>
                    ) : (
                      <span className="text-amber-700">Thiếu thông số</span>
                    );
                  },
                },
              ]}
              renderCard={(s) => (
                <Card cls="p-3">
                  <code className="text-xs text-muted">{s.code}</code>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-muted">
                    {s.productId}
                    {Object.keys(s.measurementSpecs ?? {}).length
                      ? ` · ${Object.keys(s.measurementSpecs).length} thông số đo`
                      : " · thiếu thông số đo"}
                  </div>
                </Card>
              )}
            />
          </Card>
          </div>

          <div ref={semiDetailRef} className="space-y-4 lg:sticky lg:top-4 min-w-0">
          <Card cls="p-4 lg:p-5">
            <div className="font-semibold mb-3">
              {selectedSemiId ? `Chi tiết — ${selectedSemiLabel}` : "Checklist đo & bản vẽ"}
            </div>
            <SearchPicker
              className="mb-3"
              value={selectedSemiId}
              displayValue={selectedSemiLabel}
              placeholder="Tìm linh kiện…"
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
              <p className="text-xs text-muted-foreground">Chưa chọn linh kiện.</p>
            )}
          </Card>
          </div>
        </div>
      )}

      {tab === "bom" && (
        <div className="space-y-4">
          <Card cls="p-4 lg:p-6">
            <div className="font-semibold text-lg mb-3">BOM quy trình theo linh kiện</div>
            <SearchPicker
              className="mb-3"
              value={bomSemiId}
              displayValue={bomSemiLabel}
              placeholder="Tìm linh kiện…"
              onSearch={searchSemisPicker}
              onChange={(id, item) => {
                setBomSemiId(id);
                setBomSemiLabel(item?.label ?? "");
              }}
            />
            {bomSemiId ? (
              <div className="space-y-4">
                {bomDrafts.map((bom, bomIdx) => (
                  <div key={bom.key} className="rounded-2xl border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-semibold"
                        placeholder="Tên BOM"
                        value={bom.name}
                        onChange={(e) =>
                          setBomDrafts((prev) =>
                            prev.map((b, i) => (i === bomIdx ? { ...b, name: e.target.value } : b)),
                          )
                        }
                      />
                      {bomDrafts.length > 1 ? (
                        <button
                          type="button"
                          className="text-red-500 text-sm border-0 bg-transparent cursor-pointer shrink-0"
                          onClick={() => setBomDrafts((prev) => prev.filter((_, i) => i !== bomIdx))}
                        >
                          Xóa BOM
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {bom.processes.map((row, idx) => (
                        <div
                          key={row.id || `${bom.key}-p-${idx}`}
                          className="grid sm:grid-cols-12 gap-2 items-center rounded-xl border border-border p-2.5"
                        >
                          <div className="sm:col-span-1 text-xs text-muted font-mono">QT {idx + 1}</div>
                          <input
                            className="sm:col-span-5 border border-border rounded-lg px-3 py-2 text-sm"
                            placeholder="Tên quy trình"
                            value={row.name}
                            onChange={(e) =>
                              setBomDrafts((prev) =>
                                prev.map((b, i) =>
                                  i === bomIdx
                                    ? {
                                        ...b,
                                        processes: b.processes.map((p, pi) =>
                                          pi === idx ? { ...p, name: e.target.value } : p,
                                        ),
                                      }
                                    : b,
                                ),
                              )
                            }
                          />
                          <select
                            className="sm:col-span-3 border border-border rounded-lg px-3 py-2 text-sm"
                            value={row.productionTeamId}
                            onChange={(e) =>
                              setBomDrafts((prev) =>
                                prev.map((b, i) =>
                                  i === bomIdx
                                    ? {
                                        ...b,
                                        processes: b.processes.map((p, pi) =>
                                          pi === idx ? { ...p, productionTeamId: e.target.value } : p,
                                        ),
                                      }
                                    : b,
                                ),
                              )
                            }
                          >
                            <option value="">— Tổ —</option>
                            {TEAMS.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            className="sm:col-span-2 border border-border rounded-lg px-3 py-2 text-sm"
                            placeholder="ĐM/ca"
                            value={String(row.quotaPerShift || "")}
                            onChange={(e) =>
                              setBomDrafts((prev) =>
                                prev.map((b, i) =>
                                  i === bomIdx
                                    ? {
                                        ...b,
                                        processes: b.processes.map((p, pi) =>
                                          pi === idx
                                            ? { ...p, quotaPerShift: Number(e.target.value) || 0 }
                                            : p,
                                        ),
                                      }
                                    : b,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            className="sm:col-span-1 text-red-500 text-sm border-0 bg-transparent cursor-pointer"
                            onClick={() =>
                              setBomDrafts((prev) =>
                                prev.map((b, i) =>
                                  i === bomIdx
                                    ? { ...b, processes: b.processes.filter((_, pi) => pi !== idx) }
                                    : b,
                                ),
                              )
                            }
                          >
                            Xóa
                          </button>
                        </div>
                      ))}
                    </div>
                    <Btn
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setBomDrafts((prev) =>
                          prev.map((b, i) =>
                            i === bomIdx
                              ? {
                                  ...b,
                                  processes: [...b.processes, emptyProcess(b.processes.length + 1)],
                                }
                              : b,
                          ),
                        )
                      }
                    >
                      + Quy trình
                    </Btn>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Btn variant="secondary" onClick={() => setBomDrafts((prev) => [...prev, emptyBomDraft()])}>
                    + BOM
                  </Btn>
                  <Btn onClick={() => void saveProcessBom()} disabled={bomSaving}>
                    {bomSaving ? "Đang lưu…" : "Lưu"}
                  </Btn>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Chưa chọn linh kiện.</p>
            )}
          </Card>
        </div>
      )}

      {tab === "import" && (
        <CatalogImportForm
          onImported={() => {
            refreshProducts();
            refreshSemis();
            if (selectedProductId) {
              void catalogApi.listBom(selectedProductId).then(setBomLines);
            }
          }}
        />
      )}
    </div>
  );
}
