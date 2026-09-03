import { useMemo, useRef, useState } from "react";
import { Btn, Card } from "../ui";
import { catalogApi } from "../../services/api/CatalogApiService";
import { toast } from "../../hooks/useToast";
import { PROCESS_STAGE_LABEL } from "@shared/constants/teams";
import {
  CATALOG_IMPORT_SAMPLE_ROWS,
  downloadCatalogImportRows,
  downloadProductBomTemplate,
  emptyCatalogImportRow,
  parseProductBomCsv,
  summarizeCatalogImport,
  type ProductBomImportRow,
} from "../../utils/productBomImport";

const inputCls =
  "w-full min-w-[7rem] border border-border rounded-lg px-2.5 py-2 text-sm bg-input text-foreground";

type ImportResult = {
  products: number;
  parts: number;
  steps: number;
  errors: string[];
  total: number;
};

export default function CatalogImportForm({ onImported }: { onImported?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ProductBomImportRow[]>(() =>
    CATALOG_IMPORT_SAMPLE_ROWS.map((r) => ({ ...r })),
  );
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const summary = useMemo(() => summarizeCatalogImport(rows), [rows]);

  const patch = (idx: number, patchRow: Partial<ProductBomImportRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patchRow } : r)));
    setResult(null);
  };

  const onPickFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseProductBomCsv(text);
    if (!parsed.length) {
      toast.error("Không đọc được dòng hợp lệ. Kiểm tra tiêu đề cột trùng với bảng mẫu.");
      return;
    }
    setRows(parsed);
    setFileName(file.name);
    setResult(null);
    toast.success(`Đã đọc ${parsed.length} dòng từ file.`);
  };

  const runImport = async () => {
    const valid = rows.filter((r) => r.productCode.trim());
    if (!valid.length) {
      toast.error("Nhập ít nhất một mã thành phẩm.");
      return;
    }
    setBusy(true);
    try {
      const data = await catalogApi.importProductBom(valid);
      setResult(data);
      const err = data.errors.length ? ` Có ${data.errors.length} cảnh báo.` : "";
      toast.success(
        `Đã nhập ${data.products} thành phẩm, ${data.parts} linh kiện, ${data.steps} quy trình.${err}`,
      );
      onImported?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5 lg:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
          <div>
            <div className="text-lg font-semibold font-display">Nhập danh mục sản xuất</div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Btn variant="secondary" onClick={downloadProductBomTemplate}>
              <i className="fas fa-download" /> Tải file mẫu
            </Btn>
            <Btn variant="secondary" onClick={() => downloadCatalogImportRows(rows)}>
              <i className="fas fa-file-export" /> Xuất bảng hiện tại
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
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <Stat label="Thành phẩm" value={summary.products} icon="fa-box" />
          <Stat label="Linh kiện" value={summary.parts} icon="fa-puzzle-piece" />
          <Stat label="Quy trình" value={summary.steps} icon="fa-list-ol" />
        </div>

        {fileName ? (
          <p className="text-xs text-muted mb-3">
            File đã chọn: <span className="font-semibold text-foreground">{fileName}</span>
          </p>
        ) : null}

        {/* Desktop table editor */}
        <div className="hidden lg:block overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-surface text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[
                  "Mã TP",
                  "Tên thành phẩm",
                  "Mã LK",
                  "Tên linh kiện",
                  "SL",
                  "STT",
                  "Quy trình",
                  "Công đoạn",
                  "Máy",
                  "ĐM/ca",
                  "",
                ].map((h) => (
                  <th key={h} className="text-left font-semibold p-2.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx} className="border-t border-border align-top">
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.productCode}
                      onChange={(e) => patch(idx, { productCode: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.productName ?? ""}
                      onChange={(e) => patch(idx, { productName: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.partCode}
                      onChange={(e) => patch(idx, { partCode: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.partName ?? ""}
                      onChange={(e) => patch(idx, { partName: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5 w-20">
                    <input
                      type="number"
                      className={inputCls}
                      value={String(r.qtyPerUnit ?? 1)}
                      onChange={(e) => patch(idx, { qtyPerUnit: Number(e.target.value) || 1 })}
                    />
                  </td>
                  <td className="p-1.5 w-16">
                    <input
                      type="number"
                      className={inputCls}
                      value={String(r.processSeq || "")}
                      onChange={(e) => patch(idx, { processSeq: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.processName}
                      onChange={(e) => patch(idx, { processName: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <select
                      className={inputCls}
                      value={r.teamCode || "Dập nóng"}
                      onChange={(e) => patch(idx, { teamCode: e.target.value })}
                    >
                      {Object.values(PROCESS_STAGE_LABEL).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-1.5">
                    <input
                      className={inputCls}
                      value={r.machine ?? ""}
                      onChange={(e) => patch(idx, { machine: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5 w-24">
                    <input
                      className={inputCls}
                      value={r.quota ?? ""}
                      onChange={(e) => patch(idx, { quota: e.target.value })}
                    />
                  </td>
                  <td className="p-1.5">
                    <button
                      type="button"
                      className="text-red-500 text-xs border-0 bg-transparent cursor-pointer"
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-3">
          {rows.map((r, idx) => (
            <Card key={idx} cls="p-3 space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Dòng {idx + 1}</span>
                <button
                  type="button"
                  className="text-red-500 border-0 bg-transparent cursor-pointer"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Xóa
                </button>
              </div>
              <input
                className={inputCls}
                placeholder="Mã thành phẩm"
                value={r.productCode}
                onChange={(e) => patch(idx, { productCode: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Tên thành phẩm"
                value={r.productName ?? ""}
                onChange={(e) => patch(idx, { productName: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Mã linh kiện"
                value={r.partCode}
                onChange={(e) => patch(idx, { partCode: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Tên linh kiện"
                value={r.partName ?? ""}
                onChange={(e) => patch(idx, { partName: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Tên quy trình"
                value={r.processName}
                onChange={(e) => patch(idx, { processName: e.target.value })}
              />
              <select
                className={inputCls}
                value={r.teamCode || "Dập nóng"}
                onChange={(e) => patch(idx, { teamCode: e.target.value })}
              >
                {Object.values(PROCESS_STAGE_LABEL).map((label) => (
                  <option key={label} value={label}>
                    {label}
                  </option>
                ))}
              </select>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Btn
            variant="secondary"
            onClick={() => setRows((prev) => [...prev, emptyCatalogImportRow()])}
          >
            + Thêm dòng
          </Btn>
          <Btn
            variant="ghost"
            onClick={() => {
              setRows(CATALOG_IMPORT_SAMPLE_ROWS.map((r) => ({ ...r })));
              setFileName("");
              setResult(null);
            }}
          >
            Khôi phục mẫu
          </Btn>
          <Btn onClick={() => void runImport()} cls={busy ? "opacity-60" : ""}>
            {busy ? "Đang nhập…" : "Xác nhận nhập dữ liệu"}
          </Btn>
        </div>
      </div>

      {result ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            result.errors.length
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <div className="font-semibold mb-1">
            {result.errors.length ? "Nhập xong — có cảnh báo" : "Nhập thành công"}
          </div>
          <p>
            {result.products} thành phẩm · {result.parts} linh kiện · {result.steps} quy trình
            {result.total ? ` · ${result.total} dòng gửi lên` : ""}.
          </p>
          {result.errors.length ? (
            <ul className="mt-2 list-disc pl-5 space-y-0.5 text-xs">
              {result.errors.slice(0, 8).map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-display font-bold tabular-nums">{value}</span>
        <i className={`fas ${icon} text-muted text-sm`} />
      </div>
    </div>
  );
}
