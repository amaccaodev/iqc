import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ShiftClose, ShiftCloseHistoryEntry, ShiftCloseStatus, ShiftUnlockRequest } from "@shared/types";
import { isSameLocalDay } from "@shared/utils/shiftCloseGuard";
import { salaryApi } from "../../services/api/SalaryApiService";
import { Btn, Card, Modal } from "../ui";
import { useRoleUser } from "../../hooks/useRoleUser";
import { toast } from "../../hooks/useToast";

const STATUS_LABEL: Record<ShiftCloseStatus, string> = {
  pending_teamlead: "Chờ tổ trưởng",
  pending_qc: "Chờ QC",
  pending_supervisor: "Chờ quản đốc",
  approved: "Đã chốt lương",
  rejected: "Từ chối",
};

const STAGE_LABEL: Record<ShiftCloseHistoryEntry["stage"], string> = {
  worker: "Công nhân",
  teamlead: "Tổ trưởng",
  qc: "QC",
  supervisor: "Quản đốc",
};

const ACTION_LABEL: Record<ShiftCloseHistoryEntry["action"], string> = {
  submitted: "Gửi chốt ca",
  approved: "Duyệt",
  rejected: "Từ chối",
  qty_adjusted: "Sửa số lượng",
};

function fileToEvidence(file: File): Promise<{ name: string; mimeType: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result ?? "");
      const base64 = raw.includes(",") ? raw.split(",")[1] ?? "" : raw;
      resolve({ name: file.name, mimeType: file.type || "image/jpeg", base64 });
    };
    reader.onerror = () => reject(new Error("Không đọc được ảnh"));
    reader.readAsDataURL(file);
  });
}

export default function ShiftCloseQueue({
  stage,
  title,
}: {
  stage: "teamlead" | "qc" | "supervisor";
  title: string;
}) {
  const user = useRoleUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const status: ShiftCloseStatus =
    stage === "teamlead" ? "pending_teamlead" : stage === "qc" ? "pending_qc" : "pending_supervisor";
  const [allCloses, setAllCloses] = useState<ShiftClose[]>([]);
  const [unlocks, setUnlocks] = useState<ShiftUnlockRequest[]>([]);
  const [pick, setPick] = useState<ShiftClose | null>(null);
  const [unlockPick, setUnlockPick] = useState<ShiftUnlockRequest | null>(null);
  const [reason, setReason] = useState("");
  const [editPass, setEditPass] = useState("");
  const [editFail, setEditFail] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const clearDeepLink = useCallback(() => {
    if (!searchParams.has("closeId") && !searchParams.has("unlockId")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("closeId");
    next.delete("unlockId");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const pending = useMemo(
    () => allCloses.filter((c) => c.status === status),
    [allCloses, status],
  );

  const historyToday = useMemo(() => {
    return allCloses
      .filter((c) => isSameLocalDay(c.createdAt) && c.status !== status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [allCloses, status]);

  const openPick = (c: ShiftClose) => {
    setPick(c);
    setReason("");
    setEditPass(String(c.passQty));
    setEditFail(String(c.failQty));
    setEvidenceFile(null);
  };

  const load = useCallback(async () => {
    try {
      const closes = await salaryApi.listShiftCloses();
      setAllCloses(Array.isArray(closes) ? closes : []);
      let unlockRows: ShiftUnlockRequest[] = [];
      if (stage === "teamlead") {
        unlockRows = await salaryApi.listShiftUnlocks({ status: "pending_teamlead" });
        setUnlocks(Array.isArray(unlockRows) ? unlockRows : []);
      } else {
        setUnlocks([]);
      }

      const closeId = searchParams.get("closeId");
      const unlockId = searchParams.get("unlockId");
      if (closeId) {
        const hit = closes.find((c) => c.id === closeId);
        if (hit) openPick(hit);
      } else if (unlockId && stage === "teamlead") {
        const hit = unlockRows.find((u) => u.id === unlockId);
        if (hit) {
          setUnlockPick(hit);
          setReason("");
        }
      }
    } catch {
      setAllCloses([]);
      setUnlocks([]);
    }
  }, [stage, searchParams]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (approved: boolean) => {
    if (!pick) return;
    if (!approved && !reason.trim()) {
      toast.error("Nhập lý do từ chối.");
      return;
    }
    const passQty = Number(editPass);
    const failQty = Number(editFail);
    const qtyChanged = passQty !== pick.passQty || failQty !== pick.failQty;
    if (qtyChanged && !evidenceFile) {
      toast.error("Sửa số lượng bắt buộc đính kèm ảnh bằng chứng.");
      return;
    }
    setBusy(true);
    try {
      let evidence:
        | { evidenceName?: string; evidenceMimeType?: string; evidenceBase64?: string }
        | undefined;
      if (qtyChanged && evidenceFile) {
        const ev = await fileToEvidence(evidenceFile);
        evidence = {
          evidenceName: ev.name,
          evidenceMimeType: ev.mimeType,
          evidenceBase64: ev.base64,
        };
      }
      await salaryApi.reviewShiftClose(pick.id, {
        stage,
        approved,
        reviewerName: user.name,
        rejectReason: reason,
        passQty,
        failQty,
        ...evidence,
      });
      setPick(null);
      setReason("");
      setEvidenceFile(null);
      clearDeepLink();
      await load();
      toast.success(approved ? "Đã duyệt chốt ca" : "Đã từ chối");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reviewUnlock = async (approved: boolean) => {
    if (!unlockPick) return;
    if (!approved && !reason.trim()) {
      toast.error("Nhập lý do từ chối.");
      return;
    }
    setBusy(true);
    try {
      await salaryApi.reviewShiftUnlock(unlockPick.id, {
        approved,
        reviewerName: user.name,
        rejectReason: reason,
      });
      setUnlockPick(null);
      setReason("");
      clearDeepLink();
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renderHistory = (entries?: ShiftCloseHistoryEntry[]) => {
    if (!entries?.length) return null;
    return (
      <div className="mt-3 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wide text-muted">Lịch sử quy trình</div>
        {entries.map((h) => (
          <div key={h.id} className="rounded-lg border border-border/50 bg-surface/60 p-2.5 text-xs space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-semibold text-foreground">
                {STAGE_LABEL[h.stage]} · {ACTION_LABEL[h.action]}
              </span>
              <span className="text-muted">{h.by}</span>
              <span className="text-muted-foreground ml-auto">
                {new Date(h.at).toLocaleString("vi-VN")}
              </span>
            </div>
            {h.action === "qty_adjusted" ? (
              <div className="tabular-nums">
                Đạt {h.passQtyBefore ?? "—"} → <b>{h.passQtyAfter ?? "—"}</b>
                {" · "}
                Hỏng {h.failQtyBefore ?? "—"} → <b>{h.failQtyAfter ?? "—"}</b>
              </div>
            ) : null}
            {h.note ? <div className="text-muted">{h.note}</div> : null}
            {h.evidenceBase64 ? (
              <img
                src={`data:${h.evidenceMimeType || "image/jpeg"};base64,${h.evidenceBase64}`}
                alt={h.evidenceName || "Bằng chứng"}
                className="mt-1 max-h-40 rounded-lg border border-border object-contain"
              />
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  const renderCloseCard = (c: ShiftClose, seqLabel?: string, highlight = false) => (
    <Card key={c.id} cls={`p-4 ${highlight ? "ring-2 ring-primary" : ""}`}>
      <div className="flex justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          {seqLabel ? (
            <div className="text-[11px] font-bold text-primary mb-0.5">{seqLabel}</div>
          ) : null}
          <div className="font-semibold text-sm">{c.workerName}</div>
          <div className="text-xs text-muted">{c.partName}</div>
          <div className="text-sm mt-1">
            <span className="text-green-600 font-bold text-base">{c.passQty} đạt</span>
            <span className="text-red-500 font-bold text-base ml-2">{c.failQty} hỏng</span>
          </div>
          {c.note ? <div className="text-xs text-muted mt-0.5">Ghi chú: {c.note}</div> : null}
          <div className="text-[11px] text-muted-foreground mt-1">
            {new Date(c.createdAt).toLocaleString("vi-VN")} · {STATUS_LABEL[c.status]}
            {c.history?.length ? ` · ${c.history.length} bước lịch sử` : ""}
          </div>
        </div>
        {c.status === status ? (
          <Btn size="sm" onClick={() => openPick(c)}>
            Kiểm tra
          </Btn>
        ) : (
          <Btn size="sm" variant="secondary" onClick={() => openPick(c)}>
            Lịch sử
          </Btn>
        )}
      </div>
    </Card>
  );

  const canAct = pick?.status === status;

  return (
    <div className="mb-6">
      {stage === "teamlead" ? (
        <div className="mb-6">
          <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2">
            <i className="fas fa-lock-open text-primary" /> Mở khóa chốt ca ({unlocks.length})
          </h3>
          {unlocks.length === 0 ? (
            <Card cls="p-4 text-center text-sm text-muted-foreground">Không có yêu cầu mở khóa</Card>
          ) : (
            <div className="space-y-2">
              {unlocks.map((u) => (
                <Card
                  key={u.id}
                  cls={`p-4 ${searchParams.get("unlockId") === u.id ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-semibold text-sm">{u.workerName}</div>
                      <div className="text-xs text-muted">{u.partName}</div>
                      {u.reason ? <div className="text-xs text-muted-foreground mt-1">{u.reason}</div> : null}
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {new Date(u.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <Btn
                      size="sm"
                      onClick={() => {
                        setUnlockPick(u);
                        setReason("");
                      }}
                    >
                      Duyệt
                    </Btn>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2">
        <i className="fas fa-clipboard-check text-[#D97706]" /> {title} ({pending.length})
      </h3>
      {pending.length === 0 ? (
        <Card cls="p-6 text-center text-sm text-muted-foreground">Không có phiếu chờ duyệt</Card>
      ) : (
        <div className="space-y-2">
          {pending.map((c) =>
            renderCloseCard(c, undefined, searchParams.get("closeId") === c.id),
          )}
        </div>
      )}

      {historyToday.length > 0 ? (
        <div className="mt-8">
          <h3 className="font-display font-700 text-base mb-2 flex items-center gap-2">
            <i className="fas fa-clock-rotate-left text-muted" /> Đã xử lý hôm nay ({historyToday.length})
          </h3>
          <p className="text-xs text-muted mb-3">
            Mỗi lần duyệt / sửa số lượng đều lưu lịch sử và ảnh bằng chứng (nếu có).
          </p>
          <div className="space-y-2">
            {historyToday.map((c, i) => renderCloseCard(c, `Lần chốt ${i + 1} · ${c.workerName}`))}
          </div>
        </div>
      ) : null}

      {pick ? (
        <Modal
          title={canAct ? "Duyệt chốt ca công nhân" : "Lịch sử chốt ca"}
          onClose={() => {
            setPick(null);
            clearDeepLink();
          }}
        >
          <div className="text-sm space-y-1 mb-3">
            <div>
              <b className="text-base">{pick.workerName}</b> · {pick.partName}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(pick.createdAt).toLocaleString("vi-VN")} · {STATUS_LABEL[pick.status]}
            </div>
            {pick.note ? <div className="text-xs text-muted">Ghi chú: {pick.note}</div> : null}
            <div className="text-xs text-muted-foreground">
              Đơn giá: {pick.rateVnd.toLocaleString("vi-VN")} đ/SP
            </div>
          </div>

          {canAct ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase text-muted">SL đạt</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border-2 border-primary/40 bg-primary/5 px-3 py-2.5 text-xl font-display font-800 tabular-nums"
                    value={editPass}
                    onChange={(e) => setEditPass(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase text-muted">SL hỏng</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-1 w-full rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2.5 text-xl font-display font-800 tabular-nums dark:bg-red-950/30"
                    value={editFail}
                    onChange={(e) => setEditFail(e.target.value)}
                  />
                </label>
              </div>
              {(Number(editPass) !== pick.passQty || Number(editFail) !== pick.failQty) && (
                <label className="block mb-3">
                  <span className="text-xs font-semibold text-amber-800">
                    Ảnh bằng chứng khi sửa số lượng <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="mt-1 block w-full text-sm"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
              <label className="block text-xs font-semibold mb-1">Lý do nếu từ chối</label>
              <textarea
                className="w-full border border-border rounded-lg p-2 text-sm mb-3"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Btn onClick={() => void review(true)} cls="flex-1 justify-center">
                  {busy ? "..." : "Xác nhận đúng"}
                </Btn>
                <Btn variant="secondary" onClick={() => void review(false)} cls="flex-1 justify-center">
                  Từ chối
                </Btn>
              </div>
            </>
          ) : (
            <div className="mb-2 text-base font-semibold tabular-nums">
              Đạt {pick.passQty} · Hỏng {pick.failQty}
            </div>
          )}

          {renderHistory(pick.history)}
        </Modal>
      ) : null}
      {unlockPick ? (
        <Modal
          title="Duyệt mở khóa"
          onClose={() => {
            setUnlockPick(null);
            clearDeepLink();
          }}
        >
          <div className="text-sm space-y-1 mb-3">
            <div>
              <b>{unlockPick.workerName}</b> · {unlockPick.partName}
            </div>
            <div className="text-xs text-muted">{unlockPick.reason}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Mở khóa chỉ cho CN đo / chốt ca tiếp — các lần chốt trước vẫn giữ nguyên.
            </p>
          </div>
          <label className="block text-xs font-semibold mb-1">Lý do nếu từ chối</label>
          <textarea
            className="w-full border border-border rounded-lg p-2 text-sm mb-3"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex gap-2">
            <Btn onClick={() => void reviewUnlock(true)} cls="flex-1 justify-center">
              {busy ? "..." : "Mở khóa"}
            </Btn>
            <Btn variant="secondary" onClick={() => void reviewUnlock(false)} cls="flex-1 justify-center">
              Từ chối
            </Btn>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
