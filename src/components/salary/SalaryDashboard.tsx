import { useEffect, useMemo, useState } from "react";
import type { ShiftClose } from "@shared/types";
import { salaryApi } from "../../services/api/SalaryApiService";
import { Card, Modal } from "../ui";

function vnd(n: number) {
  return `${Math.round(n).toLocaleString("vi-VN")} đ`;
}

function fmtDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function SalaryDashboard({
  workerId,
  title = "Lương theo lần chốt ca",
}: {
  workerId?: string;
  title?: string;
}) {
  const [items, setItems] = useState<ShiftClose[]>([]);
  const [detail, setDetail] = useState<ShiftClose | null>(null);

  useEffect(() => {
    void salaryApi.listShiftCloses({ workerId }).then(setItems).catch(() => setItems([]));
  }, [workerId]);

  const approved = useMemo(() => items.filter((i) => i.status === "approved"), [items]);
  const byWorker = useMemo(() => {
    const map = new Map<string, { name: string; amount: number; qty: number; closes: ShiftClose[] }>();
    for (const c of approved) {
      const cur = map.get(c.workerId) ?? { name: c.workerName, amount: 0, qty: 0, closes: [] };
      cur.amount += c.amountVnd;
      cur.qty += c.passQty;
      cur.closes.push(c);
      map.set(c.workerId, cur);
    }
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [approved]);

  const chart = workerId ? approved : approved.slice(0, 12);
  const maxAmt = Math.max(1, ...chart.map((c) => c.amountVnd));
  const total = approved.reduce((s, c) => s + c.amountVnd, 0);

  return (
    <div className="mb-6">
      <h3 className="font-display font-700 text-base mb-3 flex items-center gap-2">
        <i className="fas fa-sack-dollar text-[#16A34A]" /> {title}
      </h3>
      <p className="text-[11px] text-muted-foreground mb-3">Bấm cột biểu đồ hoặc dòng tổng hợp để xem chi tiết từng ca</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          type="button"
          onClick={() => approved.length && setDetail(approved[0])}
          className="text-left border-0 bg-transparent p-0 cursor-pointer"
        >
          <Card cls="p-3 hover:border-[#16A34A] transition-colors">
            <div className="text-[11px] text-muted-foreground">Tổng đã duyệt</div>
            <div className="font-display font-800 text-lg text-[#16A34A]">{vnd(total)}</div>
          </Card>
        </button>
        <Card cls="p-3">
          <div className="text-[11px] text-muted-foreground">Số ca chốt</div>
          <div className="font-display font-800 text-lg">{approved.length}</div>
        </Card>
      </div>
      {chart.length === 0 ? (
        <Card cls="p-6 text-center text-sm text-muted-foreground">Chưa có ca nào Quản đốc duyệt — chưa ghi lương</Card>
      ) : (
        <Card cls="p-4">
          <div className="flex items-end gap-1.5 h-40">
            {chart.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDetail(c)}
                className="flex-1 flex flex-col items-center justify-end h-full min-w-0 border-0 bg-transparent cursor-pointer p-0 group"
              >
                <div className="text-[9px] text-muted mb-1 truncate w-full text-center group-hover:text-[#16A34A]">
                  {vnd(c.amountVnd)}
                </div>
                <div
                  className="w-full max-w-10 bg-[#16A34A] rounded-t group-hover:bg-[#15803D] transition-colors min-h-[8px]"
                  style={{ height: `${Math.max(8, (c.amountVnd / maxAmt) * 100)}%` }}
                />
                <div className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center">{fmtDay(c.createdAt)}</div>
              </button>
            ))}
          </div>
        </Card>
      )}
      {!workerId && byWorker.length > 0 ? (
        <div className="mt-3 space-y-2">
          {byWorker.map((w) => (
            <button
              key={w.name}
              type="button"
              onClick={() => w.closes[0] && setDetail(w.closes[0])}
              className="w-full text-left border-0 bg-transparent p-0 cursor-pointer"
            >
              <Card cls="p-3 hover:border-ring transition-colors">
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{w.name}</div>
                    <div className="text-xs text-muted-foreground">{w.closes.length} ca · {w.qty.toLocaleString("vi-VN")} SP đạt</div>
                  </div>
                  <div className="font-bold text-green-700">{vnd(w.amount)}</div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      ) : null}

      {detail ? (
        <Modal title="Chi tiết chốt ca" onClose={() => setDetail(null)}>
          <div className="space-y-2 text-sm">
            <Row label="Nhân viên" value={detail.workerName} />
            <Row label="Sản phẩm" value={detail.productName || detail.partName} />
            <Row label="Ngày chốt" value={fmtDay(detail.createdAt)} />
            <Row label="Đạt" value={`${detail.passQty.toLocaleString("vi-VN")} SP`} />
            <Row label="Hỏng" value={`${detail.failQty.toLocaleString("vi-VN")} SP`} />
            <Row label="Đơn giá" value={`${detail.rateVnd.toLocaleString("vi-VN")} đ/SP`} />
            <Row label="Lương ca" value={vnd(detail.amountVnd)} highlight />
            {detail.note ? <Row label="Ghi chú" value={detail.note} /> : null}
            {detail.supervisorBy ? (
              <Row label="Quản đốc duyệt" value={detail.supervisorBy} />
            ) : null}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3 py-1 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold text-right ${highlight ? "text-[#16A34A]" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
