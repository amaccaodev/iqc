import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { BOMItem, DimensionRow, MachineChangeKind, ProductionOrder, ShiftClose, ShiftUnlockRequest, UserPublic } from "@shared/types";
import type { MaterialSpec, SpecValidationResult } from "@shared/types/spec";
import {
  emptyDims,
  formatSpecFieldTitle,
  formatSpecRange,
  getActiveInspectionSpecs,
  resolveMaterialSpecs,
  validateEntryRows,
} from "@shared/utils/specValidation";
import { bomProcessLockReason, isBomProcessUnlocked } from "@shared/utils/bomProcess";
import { closesTodayChronological, shiftLockState } from "@shared/utils/shiftCloseGuard";
import { Card, Modal } from "../ui";
import { shiftLabel } from "@shared/utils/orderHelpers";
import FileSlideshow from "../files/FileSlideshow";
import { orderApi } from "../../services/api/OrderApiService";
import { salaryApi } from "../../services/api/SalaryApiService";
import { scrollFieldIntoView, useKeyboardViewport } from "../../hooks/useKeyboardViewport";
import { catalogApi } from "../../services/api/CatalogApiService";
import { MACHINE_PROPOSAL_KIND_LABEL } from "./ProposalActionButtons";
import WorkerPinnedActions from "./WorkerPinnedActions";
import { WORKER_BTN_PRIMARY } from "./workerUi";
import { toast } from "../../hooks/useToast";

type EntryMode = "info" | "measure";

interface WorkerEntryFormProps {
  user: UserPublic;
  order: ProductionOrder;
  bom: BOMItem;
  /** info = trang linh kiện; measure = trang nhập số đo (route riêng) */
  mode?: EntryMode;
}

export default function WorkerEntryForm({ user, order, bom, mode = "info" }: WorkerEntryFormProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { keyboardOpen } = useKeyboardViewport();
  const isMeasure = mode === "measure";
  const taskBase = `/worker/task/${order.id}/${bom.id}`;

  const materialSpecs = useMemo(
    () => resolveMaterialSpecs(bom.specCols, bom.materialSpecs),
    [bom.specCols, bom.materialSpecs],
  );
  const activeSpecs = useMemo(
    () => getActiveInspectionSpecs(materialSpecs),
    [materialSpecs],
  );
  const [dims, setDims] = useState<string[]>(() => emptyDims(resolveMaterialSpecs(bom.specCols, bom.materialSpecs)));
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedTt, setLastSavedTt] = useState<number | null>(null);
  const [showCloseShift, setShowCloseShift] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const [todayCloses, setTodayCloses] = useState<ShiftClose[]>([]);
  const [todayUnlocks, setTodayUnlocks] = useState<ShiftUnlockRequest[]>([]);
  const [shiftReady, setShiftReady] = useState(false);
  const [proposalKind, setProposalKind] = useState<MachineChangeKind | null>(null);
  const [passQty, setPassQty] = useState("");
  const [failQty, setFailQty] = useState("");
  const [closeNote, setCloseNote] = useState("");
  const [approvalReason, setApprovalReason] = useState("");
  const [approvalTarget, setApprovalTarget] = useState<"teamlead" | "mechanic">("teamlead");
  const [toMachine, setToMachine] = useState("");
  const [catalogDrawings, setCatalogDrawings] = useState<ProductionOrder["attachments"]>([]);

  const processLocked = !isBomProcessUnlocked(order, bom);
  const processLockReason = bomProcessLockReason(order, bom);
  const shiftScope = { workerId: user.id, orderId: order.id, bomId: bom.id };
  const lock = shiftLockState(todayCloses, todayUnlocks, shiftScope);
  const historyToday = closesTodayChronological(todayCloses, shiftScope);

  const reloadShiftState = useCallback(() => {
    void Promise.all([
      salaryApi.listShiftCloses({ workerId: user.id, orderId: order.id, bomId: bom.id }),
      salaryApi.listShiftUnlocks({ workerId: user.id, orderId: order.id, bomId: bom.id }),
    ])
      .then(([closes, unlocks]) => {
        setTodayCloses(Array.isArray(closes) ? closes : []);
        setTodayUnlocks(Array.isArray(unlocks) ? unlocks : []);
      })
      .catch(() => {
        setTodayCloses([]);
        setTodayUnlocks([]);
      })
      .finally(() => setShiftReady(true));
  }, [user.id, order.id, bom.id]);

  useEffect(() => {
    reloadShiftState();
  }, [reloadShiftState]);

  useEffect(() => {
    const p = searchParams.get("propose");
    if (p === "change_machine" || p === "add_machine" || p === "report_broken") {
      if (p === "report_broken") {
        navigate("/worker/incidents?create=1", { replace: true });
        return;
      }
      setProposalKind(p);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, navigate]);

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
    () => {
      const fromBom = bom.attachments ?? [];
      const fromOrder = order.attachments ?? [];
      const raw = fromBom.length ? fromBom : catalogDrawings.length ? catalogDrawings : fromOrder;
      return raw.filter(
        (a) => a.type === "pdf" || a.type === "excel" || a.type === "cad" || a.type === "image",
      );
    },
    [bom.attachments, order.attachments, catalogDrawings],
  );

  useEffect(() => {
    if ((bom.attachments?.length ?? 0) > 0 || !bom.semiProductId) {
      setCatalogDrawings([]);
      return;
    }
    let cancelled = false;
    void catalogApi
      .listSemiAttachments(bom.semiProductId)
      .then((list) => {
        if (!cancelled) setCatalogDrawings(list);
      })
      .catch(() => {
        if (!cancelled) setCatalogDrawings([]);
      });
    return () => {
      cancelled = true;
    };
  }, [bom.semiProductId, bom.attachments?.length]);

  const updateDim = (ci: number, val: string) => {
    setDims((prev) => prev.map((d, j) => (j === ci ? val : d)));
  };

  const getFieldValidation = useCallback(
    (colIndex: number): SpecValidationResult | undefined =>
      currentValidations.find((v) => v.index === colIndex),
    [currentValidations],
  );

  const submitCurrent = async () => {
    if (!lock.canMeasure) {
      toast.success(lock.hint || "Đã chốt ca — cần mở khóa trước khi đo kiểm tiếp.");
      navigate(taskBase);
      return;
    }
    if (!dims.some((d) => d.trim())) {
      toast.error("Vui lòng nhập ít nhất một thông số.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await orderApi.submitWorkerRow(order.id, bom.id, {
        workerId: user.id,
        workerName: user.name,
        dims,
      });
      // Ở lại trang nhập — chỉ Back / chốt ca mới thoát
      setLastSavedTt(result.row.tt);
      setDims(emptyDims(materialSpecs));
    } catch (e) {
      toast.error((e as Error).message || "Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCloseShift = () => {
    if (lock.canEditClose && lock.pendingClose) {
      setPassQty(String(lock.pendingClose.passQty));
      setFailQty(String(lock.pendingClose.failQty));
      setCloseNote(lock.pendingClose.note ?? "");
      setShowCloseShift(true);
      return;
    }
    if (!lock.canClose) return;
    setPassQty(String(myRows.length || bom.passQty || 0));
    setFailQty(String(bom.failQty || 0));
    setCloseNote("");
    setShowCloseShift(true);
  };

  const openUnlock = () => {
    if (!lock.canUnlock) return;
    setUnlockReason("Xin mở khóa để chốt ca tiếp trong ngày");
    setShowUnlock(true);
  };

  const submitCloseShift = async () => {
    const editing = Boolean(lock.canEditClose && lock.pendingClose);
    if (!editing && !lock.canClose) {
      toast.error(lock.hint || "Không thể chốt ca lúc này.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing && lock.pendingClose) {
        await salaryApi.updateShiftClose(lock.pendingClose.id, {
          passQty: Number(passQty) || 0,
          failQty: Number(failQty) || 0,
          note: closeNote,
          workerId: user.id,
        });
        toast.success("Đã lưu phiếu chốt ca");
      } else {
        await orderApi.workerShiftClose(order.id, bom.id, {
          passQty: Number(passQty) || 0,
          failQty: Number(failQty) || 0,
          note: closeNote,
          reportedBy: user.name,
          workerId: user.id,
        });
      }
      setShowCloseShift(false);
      reloadShiftState();
      navigate(taskBase, { replace: true });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitUnlock = async () => {
    if (!lock.canUnlock) {
      toast.success(lock.hint || "Đã có đơn ở tổ trưởng — chờ duyệt.");
      return;
    }
    setSubmitting(true);
    try {
      await salaryApi.requestShiftUnlock({
        orderId: order.id,
        bomId: bom.id,
        workerId: user.id,
        workerName: user.name,
        partName: bom.partName,
        reason: unlockReason,
      });
      setShowUnlock(false);
      reloadShiftState();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitApproval = async () => {
    if (!proposalKind) return;
    if (!approvalReason.trim()) {
      toast.error("Nhập lý do đề xuất");
      return;
    }
    if (proposalKind === "change_machine" && !toMachine.trim()) {
      toast.error("Nhập máy muốn đổi sang");
      return;
    }
    const kind = proposalKind;
    setSubmitting(true);
    try {
      await catalogApi.createChangeRequest({
        orderId: order.id,
        bomId: bom.id,
        requestedBy: user.id,
        requestedName: user.name,
        reason: approvalReason.trim(),
        kind,
        target: kind === "report_broken" ? "mechanic" : approvalTarget,
        fromMachine: bom.machine,
        toMachine,
      });
      setProposalKind(null);
      setApprovalReason("");
      setToMachine("");
      toast.success(`Đã gửi đề xuất: ${MACHINE_PROPOSAL_KIND_LABEL[kind]}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const pinned = (
    <WorkerPinnedActions
      action={lock.button}
      onMeasure={() => {
        if (processLocked || !lock.canMeasure) return;
        if (!isMeasure) navigate(`${taskBase}/measure`);
      }}
      onCloseShift={openCloseShift}
      onUnlock={openUnlock}
      measureDisabled={!shiftReady || processLocked || !lock.canMeasure}
      closeDisabled={
        submitting ||
        (lock.button === "close"
          ? !lock.canClose
          : lock.button === "edit"
            ? !lock.canEditClose
            : !lock.canUnlock)
      }
      hint={lock.hint}
      measureActive={isMeasure}
    />
  );

  return (
    <div
      className={`max-w-lg mx-auto ${
        keyboardOpen ? "" : "pb-[calc(var(--worker-dock-h,0px)+0.5rem)]"
      }`}
      style={keyboardOpen ? { paddingBottom: "var(--keyboard-inset, 0px)" } : undefined}
    >
      <div className="flex items-center gap-3 mb-3">
        <BackButton
          onClick={() => {
            if (isMeasure) navigate(taskBase);
            else navigate("/worker/entry");
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-muted truncate">
            {order.productLine || order.productCode || "Sản phẩm"}
          </div>
          <div className="font-display font-700 text-base truncate">Linh kiện: {bom.partName}</div>
          <div className="text-xs text-primary font-semibold truncate">
            Quy trình: {bom.process || "—"}
            {bom.processSeq != null ? ` (QT ${bom.processSeq})` : ""}
          </div>
          <code className="text-[11px] text-muted font-mono">{bom.partCode || order.productCode || bom.bomCode}</code>
        </div>
      </div>

      {processLocked && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-100">
          <i className="fas fa-lock mr-1" />
          {processLockReason}
        </div>
      )}

      {isMeasure ? (
        !shiftReady ? (
          <div className="text-center py-10 text-muted text-sm">
            <i className="fas fa-spinner fa-spin mr-2" />
            Đang kiểm tra ca...
          </div>
        ) : processLocked || !lock.canMeasure ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted space-y-3">
            <p>
              {processLocked
                ? "Quy trình chưa mở — quay lại trang thông tin."
                : lock.hint || "Đã chốt ca — cần mở khóa trước khi đo kiểm tiếp."}
            </p>
            <button
              type="button"
              className="text-sm font-semibold text-primary border-0 bg-transparent cursor-pointer underline"
              onClick={() => navigate(taskBase)}
            >
              ← Về trang thông tin
            </button>
          </div>
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
            dims={dims}
            specFiles={specFiles}
            getFieldValidation={getFieldValidation}
            updateDim={updateDim}
            submitting={submitting}
            onSubmit={() => void submitCurrent()}
          />
        )
      ) : (
        <>
          <InfoPanel order={order} bom={bom} myRows={myRows} specFiles={specFiles} />

          {historyToday.length > 0 ? (
            <Card cls="p-3 mt-4">
              <div className="text-xs font-semibold text-muted mb-2">
                Lịch sử chốt ca hôm nay ({historyToday.length} lần)
              </div>
              <ul className="space-y-2.5">
                {historyToday.map((c, i) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-foreground">
                        Lần chốt {i + 1}
                        <span className="font-normal text-muted text-xs ml-2">
                          {new Date(c.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-muted shrink-0">
                        {c.status === "pending_teamlead"
                          ? "Chờ tổ trưởng"
                          : c.status === "pending_qc"
                            ? "Chờ QC"
                            : c.status === "pending_supervisor"
                              ? "Chờ quản đốc"
                              : c.status === "approved"
                                ? "Đã chốt lương"
                                : "Từ chối"}
                      </span>
                    </div>
                    <div className="mt-1 text-xs">
                      <span className="text-green-700 font-semibold">{c.passQty} đạt</span>
                      <span className="text-red-600 font-semibold ml-2">{c.failQty} hỏng</span>
                    </div>
                    {c.note ? (
                      <div className="text-xs text-muted mt-0.5">Lý do / ghi chú: {c.note}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-0.5">Không có ghi chú</div>
                    )}
                    {c.status === "pending_teamlead" ? (
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold text-primary border-0 bg-transparent cursor-pointer underline"
                        onClick={openCloseShift}
                      >
                        Sửa phiếu
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}

      {pinned}

      {showCloseShift && (
        <Modal
          title={lock.canEditClose ? "Sửa phiếu chốt ca" : "Xác nhận chốt ca"}
          onClose={() => setShowCloseShift(false)}
        >
          <div className="space-y-3">
            <p className="text-sm text-muted">
              {lock.canEditClose
                ? "Tổ trưởng chưa duyệt — sửa số đạt/hỏng rồi lưu lại. Sau khi duyệt, xin mở khóa để chốt ca tiếp."
                : "Phiếu sẽ gửi tổ trưởng. Sau khi tổ trưởng duyệt, xin mở khóa để đo kiểm / chốt ca tiếp trong ngày."}
            </p>
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
            <button
              type="button"
              className={`${WORKER_BTN_PRIMARY} w-full`}
              onClick={() => void submitCloseShift()}
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : lock.canEditClose ? "Lưu phiếu" : "Xác nhận chốt ca"}
            </button>
          </div>
        </Modal>
      )}

      {showUnlock && (
        <Modal title="Mở khóa chốt ca" onClose={() => setShowUnlock(false)}>
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Gửi yêu cầu đến tổ trưởng. Nếu đơn đã ở tổ trưởng thì phải chờ duyệt — không gửi thêm.
            </p>
            <label className="text-sm block">
              <span className="text-muted">Lý do</span>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[64px]"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
              />
            </label>
            <button
              type="button"
              className={`${WORKER_BTN_PRIMARY} w-full`}
              onClick={() => void submitUnlock()}
              disabled={submitting}
            >
              {submitting ? "Đang gửi..." : "Gửi tổ trưởng"}
            </button>
          </div>
        </Modal>
      )}

      {proposalKind && (
        <Modal
          title={`Đề xuất: ${MACHINE_PROPOSAL_KIND_LABEL[proposalKind]}`}
          onClose={() => setProposalKind(null)}
        >
          <div className="space-y-3">
            <label className="text-sm block">
              <span className="text-muted">Lý do</span>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[72px]"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                placeholder="Lý do"
              />
            </label>
            <label className="text-sm block">
              <span className="text-muted">Máy hiện tại</span>
              <input className="w-full border border-border rounded-lg px-3 py-2 text-sm" value={bom.machine || ""} readOnly />
            </label>
            {proposalKind !== "report_broken" && (
              <label className="text-sm block">
                <span className="text-muted">
                  {proposalKind === "add_machine" ? "Máy thêm" : "Máy thay thế"}
                </span>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  value={toMachine}
                  onChange={(e) => setToMachine(e.target.value)}
                  onFocus={(e) => scrollFieldIntoView(e.currentTarget)}
                />
              </label>
            )}
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
            <button
              type="button"
              className={`${WORKER_BTN_PRIMARY} w-full`}
              onClick={() => void submitApproval()}
              disabled={submitting}
            >
              <i className="fas fa-paper-plane" /> Gửi đề xuất
            </button>
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
      </div>

      {lastSavedTt !== null && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
          <i className="fas fa-circle-check" />
          Đã lưu SP #{lastSavedTt}
        </div>
      )}

      {rowWarnings > 0 && (
        <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-700">
          <i className="fas fa-triangle-exclamation mt-0.5" />
          {rowWarnings} thông số ngoài chuẩn / ngoài khoảng — ô đỏ; vẫn nộp được
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
                    <span className="w-9 h-9 rounded-full border-2 border-primary text-primary font-display font-700 text-sm flex items-center justify-center">
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
                          outOfSpec
                            ? "border-red-400 bg-red-50 text-red-700"
                            : "border-border focus:border-ring"
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
                  <div className="mt-1.5 ml-14 text-xs text-red-600">{vResult.warning}</div>
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

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting || !hasInput}
        className={`${WORKER_BTN_PRIMARY} w-full`}
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
      </button>
    </>
  );
}

function InfoPanel({
  order,
  bom,
  myRows,
  specFiles,
}: {
  order: ProductionOrder;
  bom: BOMItem;
  myRows: DimensionRow[];
  specFiles: ProductionOrder["attachments"];
}) {
  const produced = bom.workerEntries.reduce((s, e) => s + e.rows.length, 0);
  const inspectionSpecs = getActiveInspectionSpecs(
    resolveMaterialSpecs(bom.specCols, bom.materialSpecs),
  );
  const cols = inspectionSpecs.map((s) => ({
    i: s.index,
    label: s.pointNo != null ? `(${s.pointNo}) ${s.label}` : s.label,
  }));
  const materialSpecs = resolveMaterialSpecs(bom.specCols, bom.materialSpecs);
  const enteredValidation = validateEntryRows(
    bom.specCols,
    myRows.map((r) => ({ dims: r.dims })),
    materialSpecs,
  );
  const siblingSteps = order.boms
    .filter(
      (b) =>
        b.id !== bom.id &&
        (bom.catalogBomId
          ? b.catalogBomId === bom.catalogBomId
          : (b.partGroup || b.partName) === (bom.partGroup || bom.partName)),
    )
    .sort((a, b) => (a.processSeq ?? 0) - (b.processSeq ?? 0));
  const rowsMeta: { label: string; value: string }[] = [
    { label: "Sản phẩm", value: order.productLine || order.productCode || "—" },
    { label: "Linh kiện", value: bom.partGroup || bom.partName },
    ...(bom.catalogBomName ? [{ label: "BOM", value: bom.catalogBomName }] : []),
    { label: "Quy trình", value: bom.process || "—" },
    { label: "Mã LK", value: bom.partCode || "—" },
    { label: "SL Cần", value: String(bom.targetQty || order.targetQty || 0) },
    { label: "Máy", value: bom.machine || "—" },
    { label: "Ca làm việc", value: shiftLabel(bom.shift || order.shift) },
    { label: "Đã đo", value: String(produced) },
  ];

  return (
    <div className="space-y-4">
      <Card cls="p-3">
        <FileSlideshow files={specFiles} title="bản vẽ" />
      </Card>

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
                <span className="w-6 h-6 rounded-full border border-primary text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
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

      {siblingSteps.length > 0 && (
        <Card cls="p-4">
          <div className="font-semibold text-sm mb-2">Quy trình cùng linh kiện (tuần tự)</div>
          <ul className="text-sm space-y-1 text-muted">
            {siblingSteps.map((b) => (
              <li key={b.id}>
                · QT {b.processSeq ?? "—"}: {b.process || b.partName}
                <span className="text-muted-foreground text-xs ml-1">({b.status})</span>
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
              {myRows.map((r, ri) => {
                const rowResults = enteredValidation.results[ri] ?? [];
                return (
                  <tr key={r.tt} className="border-b border-border">
                    <td className="py-1.5 pr-2 font-semibold">{r.tt}</td>
                    {cols.map((c) => {
                      const cell = rowResults.find((v) => v.index === c.i);
                      const bad = cell ? !cell.valid : false;
                      return (
                        <td
                          key={c.i}
                          className={`py-1.5 pr-2 font-mono ${bad ? "text-red-600 font-semibold" : ""}`}
                          title={bad ? cell?.warning || "Ngoài chuẩn" : undefined}
                        >
                          {r.dims[c.i] ?? ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Quay lại"
      className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-primary hover:bg-surface cursor-pointer bg-transparent border-0 flex-shrink-0"
    >
      <i className="fas fa-arrow-left text-sm" />
    </button>
  );
}
