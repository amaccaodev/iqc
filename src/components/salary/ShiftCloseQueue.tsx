import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ShiftClose, ShiftCloseStatus, ShiftUnlockRequest } from "@shared/types";
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

  /** Phiếu hôm nay đã qua bước này (duyệt/mở khóa không xóa — chỉ đổi status) */
  const historyToday = useMemo(() => {
    const rows = allCloses
      .filter((c) => isSameLocalDay(c.createdAt) && c.status !== status)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return rows;
  }, [allCloses, status]);

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
        if (hit) {
          setPick(hit);
          setReason("");
        }
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
    setBusy(true);
    try {
      await salaryApi.reviewShiftClose(pick.id, {
        stage,
        approved,
        reviewerName: user.name,
        rejectReason: reason,
      });
      setPick(null);
      setReason("");
      clearDeepLink();
      await load();
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

  const renderCloseCard = (c: ShiftClose, seqLabel?: string, highlight = false) => (
    <Card key={c.id} cls={`p-4 ${highlight ? "ring-2 ring-primary" : ""}`}>
      <div className="flex justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          {seqLabel ? (
            <div className="text-[11px] font-bold text-primary mb-0.5">{seqLabel}</div>
          ) : null}
          <div className="font-semibold text-sm">{c.workerName}</div>
          <div className="text-xs text-muted">{c.partName}</div>
          <div className="text-xs mt-1">
            <span className="text-green-600 font-semibold">{c.passQty} đạt</span>
            <span className="text-red-500 font-semibold ml-2">{c.failQty} hỏng</span>
          </div>
          {c.note ? <div className="text-xs text-muted mt-0.5">Ghi chú: {c.note}</div> : null}
          <div className="text-[11px] text-muted-foreground mt-1">
            {new Date(c.createdAt).toLocaleString("vi-VN")} · {STATUS_LABEL[c.status]}
          </div>
        </div>
        {c.status === status ? (
          <Btn
            size="sm"
            onClick={() => {
              setPick(c);
              setReason("");
            }}
          >
            Kiểm tra
          </Btn>
        ) : null}
      </div>
    </Card>
  );

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
            Phiếu đã duyệt / chuyển bước vẫn lưu — mở khóa không xóa lần chốt trước.
          </p>
          <div className="space-y-2">
            {historyToday.map((c, i) => renderCloseCard(c, `Lần chốt ${i + 1} · ${c.workerName}`))}
          </div>
        </div>
      ) : null}

      {pick ? (
        <Modal
          title="Duyệt chốt ca công nhân"
          onClose={() => {
            setPick(null);
            clearDeepLink();
          }}
        >
          <div className="text-sm space-y-1 mb-3">
            <div>
              <b>{pick.workerName}</b> · {pick.partName}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(pick.createdAt).toLocaleString("vi-VN")}
            </div>
            <div>
              Đạt {pick.passQty} · Hỏng {pick.failQty}
            </div>
            {pick.note ? <div className="text-xs text-muted">Ghi chú: {pick.note}</div> : null}
            <div className="text-xs text-muted-foreground">
              Đơn giá: {pick.rateVnd.toLocaleString("vi-VN")} đ/SP
            </div>
            <div className="text-xs">{STATUS_LABEL[pick.status]}</div>
          </div>
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
