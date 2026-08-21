import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { BOMItem, DimensionRow, ProductionOrder, UserPublic } from "@shared/types";
import type { MaterialSpec, SpecValidationResult } from "@shared/types/spec";
import {
  emptyDims,
  formatSpecFieldTitle,
  formatSpecRange,
  getActiveInspectionSpecs,
  resolveMaterialSpecs,
  validateEntryRows,
} from "@shared/utils/specValidation";
import { Btn, Card, Modal } from "../ui";
import { shiftLabel } from "@shared/utils/orderHelpers";
import FileSlideshow from "../files/FileSlideshow";
import { orderApi } from "../../services/api/OrderApiService";
import { scrollFieldIntoView, useKeyboardViewport } from "../../hooks/useKeyboardViewport";
import { catalogApi } from "../../services/api/CatalogApiService";

type EntryTab = "entry" | "info";

interface WorkerEntryFormProps {
  user: UserPublic;
  order: ProductionOrder;
  bom: BOMItem;
}

export default function WorkerEntryForm({ user, order, bom }: WorkerEntryFormProps) {
  const navigate = useNavigate();
  const { keyboardOpen } = useKeyboardViewport();

  const materialSpecs = useMemo(
    () => resolveMaterialSpecs(bom.specCols, bom.materialSpecs),
    [bom.specCols, bom.materialSpecs],
  );
  const activeSpecs = useMemo(
    () => getActiveInspectionSpecs(materialSpecs),
    [materialSpecs],
  );
  const [dims, setDims] = useState<string[]>(() => emptyDims(resolveMaterialSpecs(bom.specCols, bom.materialSpecs)));
  const [tab, setTab] = useState<EntryTab>("info");
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedTt, setLastSavedTt] = useState<number | null>(null);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [passQty, setPassQty] = useState("");
  const [failQty, setFailQty] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [approvalReason, setApprovalReason] = useState("");
  const [approvalTarget, setApprovalTarget] = useState<"teamlead" | "mechanic">("teamlead");
  const [toMachine, setToMachine] = useState("");

  const usesPointMode = activeSpecs.some((s) => s.pointNo != null);
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

  const specFiles = useMemo(
    () =>
      (bom.attachments?.length ? bom.attachments : order.attachments).filter(
        (a) => a.type === "pdf" || a.type === "excel" || a.type === "cad" || a.type === "image",
      ),
    [bom.attachments, order.attachments],
  );

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
      setDims(emptyDims(materialSpecs));
    } catch {
      alert("Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCloseShift = () => {
    setPassQty(String(myRows.length || bom.passQty || 0));
    setFailQty(String(bom.failQty || 0));
    setCloseNote("");
    setShowCloseShift(true);
  };

  const submitCloseShift = async () => {
    setSubmitting(true);
    try {
      await orderApi.workerShiftClose(order.id, bom.id, {
        passQty: Number(passQty) || 0,
        failQty: Number(failQty) || 0,
        note: closeNote,
        reportedBy: user.name,
        workerId: user.id,
      });
      setShowCloseShift(false);
      alert("Đã gửi tổ trưởng kiểm tra. Sau đó QC rồi Quản đốc chốt mới ghi lương.");
      navigate("/worker/dashboard");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitApproval = async () => {
    if (!approvalReason.trim()) return alert("Nhập lý do xin phê duyệt");
    setSubmitting(true);
    try {
      await catalogApi.createChangeRequest({
        orderId: order.id,
        bomId: bom.id,
        requestedBy: user.id,
        requestedName: user.name,
        reason: approvalReason.trim(),
        target: approvalTarget,
        fromMachine: bom.machine,
        toMachine,
      });
      setShowApproval(false);
      setApprovalReason("");
      alert("Đã gửi xin phê duyệt");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="max-w-lg mx-auto"
      style={keyboardOpen ? { paddingBottom: "var(--keyboard-inset, 0px)" } : undefined}
    >
      <div className="flex items-center gap-3 mb-3">
        <BackButton onClick={() => navigate("/worker/dashboard")} />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted truncate">
            {order.productLine || order.productCode || "Sản phẩm"}
          </div>
          <div className="font-display font-700 text-base truncate">Linh kiện: {bom.partName}</div>
          <code className="text-[11px] text-muted font-mono">{bom.partCode || order.productCode || bom.bomCode}</code>
        </div>
      </div>

      <nav className="flex rounded-xl bg-card border border-border p-1 mb-4 shadow-sm sticky top-14 z-20">
        <TabButton active={tab === "info"} onClick={() => setTab("info")} icon="fa-circle-info" label="Xem thông tin" />
        <TabButton
          active={tab === "entry"}
          onClick={() => setTab("entry")}
          icon="fa-ruler"
          label="Đo kiểm"
          badge={rowWarnings > 0 ? rowWarnings : undefined}
        />
      </nav>

      {tab === "info" ? (
        <InfoPanel
          order={order}
          bom={bom}
          myRows={myRows}
          onStartEntry={() => setTab("entry")}
          onCloseShift={openCloseShift}
          onRequestApproval={() => setShowApproval(true)}
        />
      ) : (
        <EntryPanel
          productName={order.productLine || order.productCode || "Sản phẩm"}
          partName={bom.partName}
          spNo={nextSpNo}
          targetQty={bom.targetQty}
          myCount={myRows.length}
          totalCount={allRows.length}
          lastSavedTt={lastSavedTt}
          rowWarnings={rowWarnings}
          activeSpecs={activeSpecs}
          usesPointMode={usesPointMode}
          dims={dims}
          specFiles={specFiles}
          getFieldValidation={getFieldValidation}
          updateDim={updateDim}
          submitting={submitting}
          onSubmit={() => void submitCurrent()}
        />
      )}

      {showCloseShift && (
        <Modal title="Chốt ca" onClose={() => setShowCloseShift(false)}>
          <div className="space-y-3">
            <label className="text-sm block">
              <span className="text-muted">Số lượng đạt</span>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="number" value={passQty} onChange={(e) => setPassQty(e.target.value)} onFocus={(e) => scrollFieldIntoView(e.currentTarget)} />
            </label>
            <label className="text-sm block">
              <span className="text-muted">Số lượng hỏng</span>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" type="number" value={failQty} onChange={(e) => setFailQty(e.target.value)} onFocus={(e) => scrollFieldIntoView(e.currentTarget)} />
            </label>
            <label className="text-sm block">
              <span className="text-muted">Ghi chú</span>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[64px]"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
              />
            </label>
            <Btn cls="w-full justify-center" onClick={() => void submitCloseShift()}>
              Xác nhận chốt ca
            </Btn>
          </div>
        </Modal>
      )}

      {showApproval && (
        <Modal title="Xin phê duyệt" onClose={() => setShowApproval(false)}>
          <div className="space-y-3">
            <label className="text-sm block">
              <span className="text-muted">Lý do (đổi máy / khác)</span>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[72px]"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                placeholder="VD: Máy Cam 0.1 đo lệch, xin đổi máy..."
              />
            </label>
            <label className="text-sm block">
              <span className="text-muted">Máy hiện tại</span>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={bom.machine || ""} readOnly />
            </label>
            <label className="text-sm block">
              <span className="text-muted">Máy muốn đổi (tuỳ chọn)</span>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={toMachine} onChange={(e) => setToMachine(e.target.value)} onFocus={(e) => scrollFieldIntoView(e.currentTarget)} />
            </label>
            <div className="text-sm font-semibold">Gửi đến</div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="approvalTarget"
                checked={approvalTarget === "teamlead"}
                onChange={() => setApprovalTarget("teamlead")}
              />
              Tổ trưởng
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="approvalTarget"
                checked={approvalTarget === "mechanic"}
                onChange={() => setApprovalTarget("mechanic")}
              />
              Cơ điện
            </label>
            <Btn cls="w-full justify-center" onClick={() => void submitApproval()}>
              <i className="fas fa-hand" /> Gửi xin phê duyệt
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EntryPanel({
  productName,
  partName,
  spNo,
  targetQty,
  myCount,
  totalCount,
  lastSavedTt,
  rowWarnings,
  activeSpecs,
  usesPointMode,
  dims,
  specFiles,
  getFieldValidation,
  updateDim,
  submitting,
  onSubmit,
}: {
  productName: string;
  partName: string;
  spNo: number;
  targetQty: number;
  myCount: number;
  totalCount: number;
  lastSavedTt: number | null;
  rowWarnings: number;
  activeSpecs: MaterialSpec[];
  usesPointMode: boolean;
  dims: string[];
  specFiles: ProductionOrder["attachments"];
  getFieldValidation: (i: number) => SpecValidationResult | undefined;
  updateDim: (ci: number, val: string) => void;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const hasInput = dims.some((d) => d.trim());

  return (
    <>
      <Card cls="p-3 mb-4">
        <FileSlideshow files={specFiles} title="bản vẽ" />
      </Card>

      <div className="mb-3 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-muted">
        <div className="font-semibold text-foreground">{productName}</div>
        <div className="mt-0.5">
          Linh kiện: <span className="font-semibold text-primary">{partName}</span>
          {" · "}
          {activeSpecs.length} thông số
        </div>
        <p className="mt-1.5 text-muted">
          <i className="fas fa-ruler mr-1" />
          {usesPointMode
            ? "Nhập theo checklist (1)(2)(3)… rồi bấm Nộp số đo"
            : "Nhập số đo rồi bấm Nộp số đo"}
        </p>
      </div>

      {lastSavedTt !== null && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          <i className="fas fa-circle-check" />
          Đã lưu SP #{lastSavedTt}
        </div>
      )}

      {rowWarnings > 0 && (
        <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800">
          <i className="fas fa-triangle-exclamation mt-0.5" />
          {rowWarnings} thông số ngoài chuẩn — vẫn nộp được
        </div>
      )}

      <div className="mb-4 flex justify-between text-xs font-medium">
        <span className="text-muted">
          Đã đo: <span className="text-primary font-bold">{totalCount}</span> / {targetQty.toLocaleString()}
        </span>
        <span className="text-muted">
          Bạn đã nộp: <span className="text-green-600 font-bold">{myCount}</span>
        </span>
      </div>

      <Card cls="overflow-hidden mb-4">
        <div className="bg-primary text-white px-4 py-3">
          <span className="font-display font-700 text-base">SP #{spNo} — {partName}</span>
        </div>
        <div className="p-4 space-y-4">
          {activeSpecs.map((spec) => {
            const ci = spec.index;
            const val = dims[ci] ?? "";
            const vResult = getFieldValidation(ci);
            const outOfSpec = vResult && !vResult.valid;
            const point = spec.pointNo ?? ci + 1;
            return (
              <div key={`${point}-${ci}`}>
                <div className="flex items-start gap-3">
                  <div className="w-11 flex-shrink-0 flex flex-col items-center pt-0.5">
                    <span className="w-9 h-9 rounded-full border-2 border-[#1B3A5C] text-primary font-display font-700 text-sm flex items-center justify-center">
                      {point}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5">
                      <div className="text-sm font-semibold text-foreground">
                        {formatSpecFieldTitle(spec)}
                      </div>
                      {spec.hint && (
                        <p className="text-[11px] text-muted mt-0.5 leading-snug">{spec.hint}</p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        value={val}
                        onChange={(e) => updateDim(ci, e.target.value)}
                        onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                        className={`w-full h-12 border-2 rounded-xl px-3 text-base font-mono text-center focus:outline-none bg-card ${
                          outOfSpec ? "border-amber-400 bg-amber-50" : "border-border focus:border-ring"
                        } ${spec.unit ? "pr-12" : ""}`}
                        placeholder={
                          spec.type === "qualitative" || spec.type === "text"
                            ? spec.hint || "Nhập giá trị"
                            : spec.target !== undefined
                              ? String(spec.target)
                              : "Nhập số đo"
                        }
                        inputMode={spec.type === "numeric" ? "decimal" : "text"}
                      />
                      {spec.unit && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                          {spec.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {outOfSpec && vResult.warning && (
                  <div className="mt-1.5 ml-14 text-xs text-amber-700">{vResult.warning}</div>
                )}
                {spec.type === "numeric" && spec.target !== undefined && !outOfSpec && val && (
                  <div className="mt-1 ml-14 text-[10px] text-muted-foreground">Chuẩn: {formatSpecRange(spec)}</div>
                )}
              </div>
            );
          })}
          {activeSpecs.length === 0 && (
            <div className="text-sm text-muted text-center py-4">
              Linh kiện chưa cấu hình thông số đo
            </div>
          )}
        </div>
      </Card>

      <Btn
        variant="success"
        onClick={onSubmit}
        cls={`w-full justify-center ${submitting || !hasInput ? "opacity-50 pointer-events-none" : ""}`}
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
    </>
  );
}

function InfoPanel({
  order,
  bom,
  myRows,
  onStartEntry,
  onCloseShift,
  onRequestApproval,
}: {
  order: ProductionOrder;
  bom: BOMItem;
  myRows: DimensionRow[];
  onStartEntry: () => void;
  onCloseShift: () => void;
  onRequestApproval: () => void;
}) {
  const produced = bom.workerEntries.reduce((s, e) => s + e.rows.length, 0);
  const inspectionSpecs = getActiveInspectionSpecs(
    resolveMaterialSpecs(bom.specCols, bom.materialSpecs),
  );
  const cols = inspectionSpecs.map((s) => ({
    i: s.index,
    label: s.pointNo != null ? `(${s.pointNo}) ${s.label}` : s.label,
  }));
  const siblingParts = order.boms.filter((b) => b.id !== bom.id);
  const rowsMeta: { label: string; value: string }[] = [
    { label: "Sản phẩm", value: order.productLine || order.productCode || "—" },
    { label: "Linh kiện", value: bom.partName },
    { label: "Mã LK", value: bom.partCode || "—" },
    { label: "SL Cần", value: String(bom.targetQty || order.targetQty || 0) },
    { label: "Máy", value: bom.machine || "—" },
    { label: "Ca làm việc", value: shiftLabel(bom.shift || order.shift) },
    { label: "Đã đo", value: String(produced) },
  ];

  return (
    <div className="space-y-4">
      <Card cls="p-4">
        <div className="space-y-2 text-sm">
          {rowsMeta.map((row) => (
            <div key={row.label} className="flex gap-2">
              <span className="text-muted w-28 flex-shrink-0">{row.label}:</span>
              <span className="font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card cls="p-4">
        <div className="font-semibold text-sm mb-2">Checklist đo kiểm</div>
        {inspectionSpecs.length === 0 ? (
          <div className="text-sm text-muted">Chưa cấu hình thông số</div>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {inspectionSpecs.map((s) => (
              <li key={s.index} className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full border border-[#1B3A5C] text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {s.pointNo ?? s.index + 1}
                </span>
                <span>
                  <span className="font-medium">{formatSpecFieldTitle(s)}</span>
                  {s.hint ? <span className="text-muted"> — {s.hint}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {siblingParts.length > 0 && (
        <Card cls="p-4">
          <div className="font-semibold text-sm mb-2">Linh kiện khác trên lệnh</div>
          <ul className="text-sm space-y-1 text-muted">
            {siblingParts.map((b) => (
              <li key={b.id}>
                · {b.partName}
                <span className="text-muted-foreground text-xs ml-1">
                  ({(b.materialSpecs?.length || b.specCols.filter(Boolean).length) || 0} thông số)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {bom.techNote ? (
        <div className="text-xs text-[#78350F] bg-[#FFFBEB] border border-[#FDE68A] rounded-xl p-3">{bom.techNote}</div>
      ) : null}

      <Card cls="p-3 overflow-x-auto">
        <div className="font-semibold text-sm mb-2">Số đo đã nhập</div>
        {myRows.length === 0 ? (
          <div className="text-sm text-muted">Chưa nộp số đo</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-left text-muted border-b border-border">
                <th className="py-1 pr-2">TT</th>
                {cols.map((c) => (
                  <th key={c.i} className="py-1 pr-2 font-mono">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myRows.map((r) => (
                <tr key={r.tt} className="border-b border-border">
                  <td className="py-1.5 pr-2 font-semibold">{r.tt}</td>
                  {cols.map((c) => (
                    <td key={c.i} className="py-1.5 pr-2 font-mono">
                      {r.dims[c.i] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Btn onClick={onStartEntry} cls="w-full justify-center">
        <i className="fas fa-check" /> Đo Kiểm
      </Btn>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRequestApproval}
          className="border-2 border-[#1B3A5C] text-primary font-semibold py-2.5 rounded-xl cursor-pointer bg-card"
        >
          <i className="fas fa-hand mr-1" /> Xin phê duyệt
        </button>
        <button
          type="button"
          onClick={onCloseShift}
          className="border-2 border-dashed border-[#7C3AED] text-[#7C3AED] font-semibold py-2.5 rounded-xl cursor-pointer bg-card"
        >
          Chốt ca
        </button>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-muted hover:text-primary text-sm cursor-pointer bg-transparent border-0 font-medium flex-shrink-0"
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
        active ? "bg-primary text-white shadow-sm" : "bg-transparent text-muted hover:bg-surface"
      }`}
    >
      <i className={`fas ${icon} text-xs`} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${active ? "bg-amber-400 text-white" : "bg-amber-100 text-amber-700"}`}>
          {badge}
        </span>
      )}
    </button>
  );
}
