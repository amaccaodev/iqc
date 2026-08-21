import { useCallback, useEffect, useState } from "react";
import type { ShiftClose, ShiftCloseStatus } from "@shared/types";
import { salaryApi } from "../../services/api/SalaryApiService";
import { Btn, Card, Modal } from "../ui";
import { useRoleUser } from "../layout/RoleLayout";

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
  const status: ShiftCloseStatus =
    stage === "teamlead" ? "pending_teamlead" : stage === "qc" ? "pending_qc" : "pending_supervisor";
  const [items, setItems] = useState<ShiftClose[]>([]);
  const [pick, setPick] = useState<ShiftClose | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void salaryApi.listShiftCloses({ status }).then(setItems).catch(() => setItems([]));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (approved: boolean) => {
    if (!pick) return;
    if (!approved && !reason.trim()) {
      alert("Nhập lý do từ chối.");
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
      load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2">
        <i className="fas fa-clipboard-check text-[#D97706]" /> {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <Card cls="p-6 text-center text-sm text-muted-foreground">Không có phiếu chờ duyệt</Card>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <Card key={c.id} cls="p-4">
              <div className="flex justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-semibold text-sm">{c.workerName}</div>
                  <div className="text-xs text-muted">{c.partName}</div>
                  <div className="text-xs mt-1">
                    <span className="text-green-600 font-semibold">{c.passQty} đạt</span>
                    <span className="text-red-500 font-semibold ml-2">{c.failQty} hỏng</span>
                    {c.note ? <span className="text-muted-foreground ml-2">{c.note}</span> : null}
                  </div>
                </div>
                <Btn size="sm" onClick={() => { setPick(c); setReason(""); }}>
                  Kiểm tra
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {pick ? (
        <Modal title="Duyệt chốt ca" onClose={() => setPick(null)}>
          <div className="text-sm space-y-1 mb-3">
            <div><b>{pick.workerName}</b> · {pick.partName}</div>
            <div>Đạt {pick.passQty} · Hỏng {pick.failQty}</div>
            <div className="text-xs text-muted-foreground">Đơn giá: {pick.rateVnd.toLocaleString("vi-VN")} đ/SP</div>
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
    </div>
  );
}
