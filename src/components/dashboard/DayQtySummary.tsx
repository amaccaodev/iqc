import { useMemo, useState } from "react";
import type { BOMItem, ProductionOrder } from "@shared/types";
import { BOM_STATUS_LABEL } from "@shared/constants/labels";
import PaginationBar from "../ui/PaginationBar";

export interface DayQtyOpen {
  orderId: string;
  bomId: string;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function toISODate(raw: string): string {
  const s = (raw || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return "";
}

function inDateRange(o: ProductionOrder, from: string, to: string) {
  if (!from && !to) return true;
  const created = toISODate(o.createdAt || "");
  const deadline = toISODate(o.deadline || "");
  const hit = (d: string) => d && (!from || d >= from) && (!to || d <= to);
  return Boolean(hit(created) || hit(deadline));
}

export default function DayQtySummary({
  orders,
  onOpenJob,
}: {
  orders: ProductionOrder[];
  onOpenJob: (item: DayQtyOpen) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<"home" | "list" | "job">("home");
  const [kind, setKind] = useState<"pass" | "remain">("remain");
  const [page, setPage] = useState(1);
  const [job, setJob] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null);
  const pageSize = 8;

  const scoped = useMemo(
    () => orders.filter((o) => inDateRange(o, from, to)),
    [orders, from, to],
  );

  const rows = useMemo(() => {
    return scoped.flatMap((o) =>
      o.boms.map((b) => {
        const remain = Math.max(0, b.targetQty - b.passQty);
        return { o, b, remain, pass: b.passQty, fail: b.failQty };
      }),
    );
  }, [scoped]);

  const passTotal = rows.reduce((s, r) => s + r.pass, 0);
  const remainTotal = rows.reduce((s, r) => s + r.remain, 0);

  const list = useMemo(() => {
    const src = kind === "remain" ? rows.filter((r) => r.remain > 0) : rows.filter((r) => r.pass > 0);
    return src.sort((a, b) => b.remain - a.remain);
  }, [rows, kind]);

  const paged = list.slice((page - 1) * pageSize, page * pageSize);

  const openList = (k: "pass" | "remain") => {
    setKind(k);
    setPage(1);
    setView("list");
    setJob(null);
  };

  const openJob = (o: ProductionOrder, b: BOMItem) => {
    setJob({ o, b });
    setView("job");
  };

  const related = job ? job.o.boms : [];

  return (
    <div className="mb-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-3">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <label className="text-[11px] text-[#64748B]">
            Từ ngày
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setView("home"); }}
              className="mt-1 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
            />
          </label>
          <label className="text-[11px] text-[#64748B]">
            Đến ngày
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setView("home"); }}
              className="mt-1 w-full h-11 rounded-xl border border-[#E2E8F0] bg-white px-3 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={() => { const t = todayISO(); setFrom(t); setTo(t); setView("home"); }}
          className="h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1B3A5C] cursor-pointer"
        >
          Hôm nay
        </button>
        <button
          type="button"
          onClick={() => { setFrom(""); setTo(""); setView("home"); }}
          className="h-11 px-3 rounded-xl border border-[#E2E8F0] bg-white text-xs font-semibold text-[#1B3A5C] cursor-pointer"
        >
          Tất cả
        </button>
      </div>

      {view === "home" && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => openList("pass")} className="text-left bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-2">
              <i className="fas fa-circle-check text-sm" />
            </div>
            <div className="font-display font-800 text-2xl text-[#16A34A]">{passTotal.toLocaleString("vi-VN")}</div>
            <div className="text-xs font-medium text-[#64748B] mt-0.5">Số lượng đạt</div>
            <div className="text-[11px] text-[#2D6EBD] mt-2 font-semibold">Chi tiết →</div>
          </button>
          <button type="button" onClick={() => openList("remain")} className="text-left bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[#FFF1F2] text-[#DC2626] flex items-center justify-center mb-2">
              <i className="fas fa-circle-exclamation text-sm" />
            </div>
            <div className="font-display font-800 text-2xl text-[#DC2626]">{remainTotal.toLocaleString("vi-VN")}</div>
            <div className="text-xs font-medium text-[#64748B] mt-0.5">Chưa đạt</div>
            <div className="text-[11px] text-[#2D6EBD] mt-2 font-semibold">Chi tiết →</div>
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setView("home")} className="text-sm text-[#64748B] border-0 bg-transparent cursor-pointer">
              ← Tổng quan
            </button>
            <div className="text-sm font-semibold text-[#0F172A]">
              {kind === "remain" ? "Công việc chưa đạt" : "Công việc đã có SL đạt"} · {list.length}
            </div>
          </div>
          {paged.length === 0 ? (
            <div className="text-sm text-[#94A3B8] text-center py-8">Không có công việc trong khoảng ngày này</div>
          ) : (
            <div className="space-y-2">
              {paged.map(({ o, b, remain, pass }) => (
                <button
                  key={`${o.id}-${b.id}`}
                  type="button"
                  onClick={() => openJob(o, b)}
                  className="w-full text-left rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] text-[#94A3B8]">{o.orderNo} · {o.productLine}</div>
                      <div className="text-sm font-semibold text-[#0F172A] truncate">{b.partName}</div>
                      <div className="text-xs text-[#64748B] mt-0.5">
                        {BOM_STATUS_LABEL[b.status]} · Đạt {pass.toLocaleString("vi-VN")}/{b.targetQty.toLocaleString("vi-VN")}
                        {remain > 0 ? ` · Còn thiếu ${remain.toLocaleString("vi-VN")}` : ""}
                      </div>
                    </div>
                    <i className="fas fa-chevron-right text-[#CBD5E1] text-xs mt-1" />
                  </div>
                </button>
              ))}
            </div>
          )}
          <PaginationBar page={page} pageSize={pageSize} total={list.length} onPage={setPage} />
        </div>
      )}

      {view === "job" && job && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <button type="button" onClick={() => setView("list")} className="text-sm text-[#64748B] border-0 bg-transparent cursor-pointer mb-3">
            ← Danh sách công việc
          </button>
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 mb-4">
            <div className="text-[11px] text-[#94A3B8]">{job.o.orderNo} · {job.o.productLine}</div>
            <div className="font-display font-700 text-base mt-0.5">{job.b.partName}</div>
            <div className="text-xs text-[#64748B] mt-1">{job.b.bomCode} · {job.b.machine || "—"} · {BOM_STATUS_LABEL[job.b.status]}</div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-white rounded-lg p-2">
                <div className="text-sm font-bold text-[#16A34A]">{job.b.passQty.toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-[#94A3B8]">Đạt</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-sm font-bold text-[#DC2626]">{Math.max(0, job.b.targetQty - job.b.passQty).toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-[#94A3B8]">Chưa đạt</div>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="text-sm font-bold text-[#1B3A5C]">{job.b.targetQty.toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-[#94A3B8]">Mục tiêu</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenJob({ orderId: job.o.id, bomId: job.b.id })}
              className="mt-3 w-full h-11 rounded-xl bg-[#1B3A5C] text-white text-sm font-semibold border-0 cursor-pointer"
            >
              Xem chi tiết đầy đủ
            </button>
          </div>

          <h4 className="font-display font-700 text-sm mb-2">Công việc trên lệnh {job.o.orderNo}</h4>
          <div className="space-y-2">
            {related.map((b) => {
              const remain = Math.max(0, b.targetQty - b.passQty);
              const current = b.id === job.b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => openJob(job.o, b)}
                  className={`w-full text-left rounded-xl border px-3 py-3 cursor-pointer ${
                    current ? "border-[#2D6EBD] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{b.partName}</div>
                      <div className="text-xs text-[#64748B]">
                        {BOM_STATUS_LABEL[b.status]} · {b.passQty}/{b.targetQty}
                        {remain > 0 ? ` · thiếu ${remain}` : " · đủ SL"}
                      </div>
                    </div>
                    {remain > 0 ? (
                      <span className="text-[10px] font-bold text-[#DC2626] bg-[#FFF1F2] rounded-full px-2 py-0.5">Chưa đạt</span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#16A34A] bg-[#F0FDF4] rounded-full px-2 py-0.5">Đạt</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
