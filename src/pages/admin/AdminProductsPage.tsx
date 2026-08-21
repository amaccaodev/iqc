import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Attachment, ProcessStage, ProductBomLine } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { PROCESS_STAGE_LABEL } from "@shared/constants/teams";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import AttachmentUploader from "../../components/files/AttachmentUploader";
import { catalogApi } from "../../services/api/CatalogApiService";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { useAuth } from "../../hooks/useAuth";

const STAGES: ProcessStage[] = ["hot_forge", "auto", "assembly"];

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"products" | "semi">("products");

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
      return;
    }
    void catalogApi.listSemiAttachments(selectedSemiId).then(setSemiFiles).catch(() => setSemiFiles([]));
  }, [selectedSemiId]);

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
    if (!newProduct.code.trim() || !newProduct.name.trim()) return alert("Nhập mã và tên SP");
    setSaving(true);
    try {
      await catalogApi.createProduct(newProduct);
      setNewProduct({ code: "", name: "", description: "" });
      refreshProducts();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addSemi = async () => {
    if (!newSemi.code.trim() || !newSemi.name.trim()) return alert("Nhập mã và tên BTP");
    setSaving(true);
    try {
      await catalogApi.createSemi(newSemi);
      setNewSemi({ code: "", name: "", processStage: "hot_forge" });
      refreshSemis();
    } catch (e) {
      alert((e as Error).message);
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
      alert("Đã lưu định mức BOM");
    } catch (e) {
      alert((e as Error).message);
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

  return (
    <div className="max-w-full min-w-0">
      <h2 className="font-display font-800 text-xl mb-1">Danh mục sản phẩm</h2>
      <p className="text-sm text-muted mb-5">
        Thành phẩm, BTP và định mức — tìm kiếm + phân trang.{" "}
        <Link to="/admin/warehouse" className="text-[#2D6EBD] underline">
          Quản lý tồn kho →
        </Link>
      </p>

      <div className="flex gap-2 mb-5 flex-wrap">
        {(
          [
            ["products", "Thành phẩm"],
            ["semi", "Bán thành phẩm"],
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
                <div key={line.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
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
                    placeholder="Tìm BTP…"
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
            <div className="font-semibold mb-2">Bản vẽ / thông số linh kiện (BTP)</div>
            <SearchPicker
              className="mb-3"
              value={selectedSemiId}
              displayValue={selectedSemiLabel}
              placeholder="Chọn BTP để gắn bản vẽ…"
              onSearch={searchSemisPicker}
              onChange={(id, item) => {
                setSelectedSemiId(id);
                setSelectedSemiLabel(item?.label ?? "");
              }}
            />
            {selectedSemiId ? (
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
            ) : (
              <p className="text-xs text-muted-foreground">Chọn linh kiện ở trên để thêm nhiều bản vẽ.</p>
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
              ]}
              renderCard={(s) => (
                <Card cls="p-3">
                  <code className="text-xs text-muted">{s.code}</code>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-sm text-muted">
                    {PROCESS_STAGE_LABEL[s.processStage]}
                  </div>
                </Card>
              )}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
