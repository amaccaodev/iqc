import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BOMItem, ProductionOrder, UserPublic } from "@shared/types";
import type { MaterialSpec, SpecValidationResult } from "@shared/types/spec";
import {
  formatSpecRange,
  resolveMaterialSpecs,
  validateEntryRows,
} from "@shared/utils/specValidation";
import { Btn, Card } from "../ui";
import { shiftLabel } from "@shared/utils/orderHelpers";
import FileSlideshow from "../files/FileSlideshow";
import { orderApi } from "../../services/api/OrderApiService";

type EntryTab = "entry" | "info";

interface WorkerEntryFormProps {
  user: UserPublic;
  order: ProductionOrder;
  bom: BOMItem;
}

export default function WorkerEntryForm({ user, order, bom }: WorkerEntryFormProps) {
  const navigate = useNavigate();

  const [tab, setTab] = useState<EntryTab>("info");
  const [dims, setDims] = useState<string[]>(() => Array(11).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedTt, setLastSavedTt] = useState<number | null>(null);

  const materialSpecs = useMemo(
    () => resolveMaterialSpecs(bom.specCols, bom.materialSpecs),
    [bom.specCols, bom.materialSpecs],
  );

  const activeSpecs = useMemo(() => materialSpecs.filter((s) => s.label), [materialSpecs]);

  const allRows = useMemo(() => bom.workerEntries.flatMap((e) => e.rows), [bom.workerEntries]);
  const myRows = useMemo(
    () => bom.workerEntries.find((e) => e.workerId === user.id)?.rows ?? [],
    [bom.workerEntries, user.id],
  );
  const nextSpNo = allRows.length + 1;

  const currentRow = useMemo(() => [{ tt: nextSpNo, dims, ngoaiQuan: "" }], [nextSpNo, dims]);
  const validation = useMemo(
    () => validateEntryRows(bom.specCols, currentRow, materialSpecs),
    [bom.specCols, currentRow, materialSpecs],
  );
  const currentValidations = validation.results[0] ?? [];
  const rowWarnings = currentValidations.filter((v) => !v.valid).length;

  const updateDim = (ci: number, val: string) => {
    setDims((prev) => prev.map((d, j) => (j === ci ? val : d)));
  };

  const getFieldValidation = useCallback(
    (colIndex: number): SpecValidationResult | undefined =>
      currentValidations.find((v) => v.index === colIndex),
    [currentValidations],
  );

  const submitCurrent = async () => {
    if (!dims.some((d) => d.trim())) {
      alert("Vui lòng nhập ít nhất một thông số.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await orderApi.submitWorkerRow(order.id, bom.id, {
        workerId: user.id,
        workerName: user.name,
        dims,
      });
      setLastSavedTt(result.row.tt);
      setDims(Array(11).fill(""));
    } catch {
      alert("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <BackButton onClick={() => navigate("/worker/dashboard")} />
        <div className="flex-1 min-w-0">
          <div className="font-display font-700 text-base truncate">Chi tiết {bom.partName}</div>
          <code className="text-[11px] text-[#64748B] font-mono">{bom.partCode || order.productCode || bom.bomCode}</code>
        </div>
      </div>

      <nav className="flex rounded-xl bg-white border border-[#E2E8F0] p-1 mb-4 shadow-sm sticky top-14 z-20">
        <TabButton
          active={tab === "info"}
          onClick={() => setTab("info")}
          icon="fa-circle-info"
          label="Xem thông tin"
        />
        <TabButton
          active={tab === "entry"}
          onClick={() => setTab("entry")}
          icon="fa-ruler"
          label="Đo kiểm"
          badge={rowWarnings > 0 ? rowWarnings : undefined}
        />
      </nav>

      {tab === "info" ? (
        <InfoPanel order={order} bom={bom} onStartEntry={() => setTab("entry")} />
      ) : (
        <EntryPanel
          spNo={nextSpNo}
          targetQty={bom.targetQty}
          myCount={myRows.length}
          totalCount={allRows.length}
          lastSavedTt={lastSavedTt}
          rowWarnings={rowWarnings}
          activeSpecs={activeSpecs}
          dims={dims}
          getFieldValidation={getFieldValidation}
          updateDim={updateDim}
          submitting={submitting}
          onSubmit={() => void submitCurrent()}
          onCloseShift={() => {
            alert("Đã chốt ca. Tổ trưởng sẽ tổng kết số lượng.");
            navigate("/worker/dashboard");
          }}
        />
      )}
    </div>
  );
}

function EntryPanel({
  spNo,
  targetQty,
  myCount,
  totalCount,
  lastSavedTt,
  rowWarnings,
  activeSpecs,
  dims,
  getFieldValidation,
  updateDim,
  submitting,
  onSubmit,
  onCloseShift,
}: {
  spNo: number;
  targetQty: number;
  myCount: number;
  totalCount: number;
  lastSavedTt: number | null;
  rowWarnings: number;
  activeSpecs: MaterialSpec[];
  dims: string[];
  getFieldValidation: (i: number) => SpecValidationResult | undefined;
  updateDim: (ci: number, val: string) => void;
  submitting: boolean;
  onSubmit: () => void;
  onCloseShift: () => void;
}) {
  const hasInput = dims.some((d) => d.trim());

  return (
    <>
      <p className="text-xs text-[#64748B] mb-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
        <i className="fas fa-ruler mr-1" />
        Nhập số đo rồi bấm <strong>Nộp & SP tiếp</strong> — vẫn cho nhập ngoài chuẩn GĐ, tổ trưởng sẽ kiểm tra lại
      </p>

      {lastSavedTt !== null && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          <i className="fas fa-circle-check" />
          Đã lưu SP #{lastSavedTt} — form mới sẵn sàng
        </div>
      )}

      {rowWarnings > 0 && (
        <div
          className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800"
          data-testid="spec-warning"
        >
          <i className="fas fa-triangle-exclamation mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-semibold">Ngoài khoảng chuẩn GĐ</div>
            <div className="text-xs mt-0.5">
              {rowWarnings} thông số chưa khớp chuẩn — vẫn nộp được, tổ trưởng sẽ rà soát
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-between text-xs font-medium">
        <span className="text-[#64748B]">
          BOM: <span className="text-[#1B3A5C] font-bold">{totalCount}</span> / {targetQty.toLocaleString()} SP
        </span>
        <span className="text-[#64748B]">
          Bạn đã nộp: <span className="text-green-600 font-bold">{myCount}</span>
        </span>
      </div>

      <Card cls="overflow-hidden mb-4">
        <div className="bg-[#1B3A5C] text-white px-4 py-3">
          <span className="font-display font-700 text-base">SP #{spNo}</span>
        </div>
        <div className="p-4 space-y-3">
          {activeSpecs.map((spec) => {
            const ci = spec.index;
            const val = dims[ci] ?? "";
            const vResult = getFieldValidation(ci);
            const outOfSpec = vResult && !vResult.valid;

            return (
              <div key={ci}>
                <div className="flex items-center gap-3">
                  <div className="w-20 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded font-mono block text-center">
                      {spec.label}
                    </span>
                  </div>
                  <input
                    value={val}
                    onChange={(e) => updateDim(ci, e.target.value)}
                    className={`flex-1 h-12 border-2 rounded-xl px-3 text-base font-mono text-center focus:outline-none focus:ring-0 bg-white ${
                      outOfSpec
                        ? "border-amber-400 bg-amber-50 text-amber-900"
                        : "border-[#E2E8F0] focus:border-[#2D6EBD]"
                    }`}
                    placeholder={spec.target !== undefined ? String(spec.target) : "Nhập số đo"}
                    inputMode={spec.type === "numeric" ? "decimal" : "text"}
                    data-testid={`dim-input-${ci}`}
                  />
                </div>
                {outOfSpec && vResult.warning && (
                  <div className="mt-1.5 ml-[5.5rem] flex items-center gap-1.5 text-xs font-medium text-amber-700">
                    <i className="fas fa-circle-exclamation" />
                    {vResult.warning}
                  </div>
                )}
                {spec.type === "numeric" && spec.target !== undefined && !outOfSpec && val && (
                  <div className="mt-1 ml-[5.5rem] text-[10px] text-[#94A3B8]">
                    Chuẩn GĐ: {formatSpecRange(spec)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Btn
        variant="success"
        onClick={onSubmit}
        cls={`w-full justify-center mb-3 ${submitting || !hasInput ? "opacity-50 pointer-events-none" : ""}`}
        size="lg"
      >
        {submitting ? (
          <>
            <i className="fas fa-spinner fa-spin" /> Đang lưu...
          </>
        ) : (
          <>
            <i className="fas fa-check" /> Nộp số đo
          </>
        )}
      </Btn>
      <button
        type="button"
        onClick={onCloseShift}
        className="w-full border-2 border-dashed border-[#7C3AED] text-[#7C3AED] font-semibold py-3 rounded-xl cursor-pointer bg-white"
      >
        Chốt ca
      </button>
    </>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-[#64748B] hover:text-[#1B3A5C] text-sm cursor-pointer bg-transparent border-0 font-medium flex-shrink-0"
    >
      <i className="fas fa-arrow-left text-xs" /> Quay lại
    </button>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`tab-${label}`}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border-0 ${
        active ? "bg-[#1B3A5C] text-white shadow-sm" : "bg-transparent text-[#64748B] hover:bg-[#F8FAFC]"
      }`}
    >
      <i className={`fas ${icon} text-xs`} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${
            active ? "bg-amber-400 text-white" : "bg-amber-100 text-amber-700"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function InfoPanel({
  order,
  bom,
  onStartEntry,
}: {
  order: ProductionOrder;
  bom: BOMItem;
  onStartEntry: () => void;
}) {
  const specFiles = (bom.attachments?.length ? bom.attachments : order.attachments).filter(
    (a) => a.type === "pdf" || a.type === "excel" || a.type === "cad" || a.type === "image",
  );
  const produced = bom.workerEntries.reduce((s, e) => s + e.rows.length, 0);
  const rows: { label: string; value: string }[] = [
    { label: "Mã SP", value: bom.partCode || order.productCode || "—" },
    { label: "SL Cần", value: String(bom.targetQty || order.targetQty || 0) },
    { label: "Máy", value: bom.machine || "—" },
    { label: "Ca làm việc", value: shiftLabel(bom.shift || order.shift) },
    { label: "Định mức", value: bom.quota || order.quota || "—" },
    { label: "Thời gian làm", value: bom.workTime || order.workTime || "—" },
    { label: "Đã sản xuất", value: String(produced) },
  ];

  return (
    <div className="space-y-4">
      <Card cls="p-4">
        <div className="space-y-2 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-2">
              <span className="text-[#64748B] w-32 flex-shrink-0">{row.label}:</span>
              <span className="font-semibold text-[#0F172A]">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card cls="p-3">
        <FileSlideshow files={specFiles} title="bản vẽ" />
      </Card>

      {bom.techNote ? (
        <div className="text-xs text-[#78350F] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3">
          {bom.techNote}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Btn onClick={onStartEntry} cls="justify-center">
          <i className="fas fa-check" /> Đo Kiểm
        </Btn>
        <button
          type="button"
          onClick={() => alert("Đã chốt ca. Tổ trưởng sẽ tổng kết số lượng.")}
          className="border-2 border-dashed border-[#7C3AED] text-[#7C3AED] font-semibold py-2.5 rounded-xl cursor-pointer bg-white"
        >
          Chốt ca
        </button>
      </div>
    </div>
  );
}
