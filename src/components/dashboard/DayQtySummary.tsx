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

type PresetRange = "today" | "week" | "month" | "quarter" | "year" | "custom";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toLocalISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function presetRangeDates(preset: Exclude<PresetRange, "custom">) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "today") {
    return { from: toLocalISO(start), to: toLocalISO(end) };
  }

  if (preset === "week") {
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    return { from: toLocalISO(start), to: toLocalISO(end) };
  }

  if (preset === "month") {
    start.setDate(1);
    return { from: toLocalISO(start), to: toLocalISO(end) };
  }

  if (preset === "quarter") {
    const quarterStartMonth = Math.floor(start.getMonth() / 3) * 3;
    start.setMonth(quarterStartMonth, 1);
    return { from: toLocalISO(start), to: toLocalISO(end) };
  }

  start.setMonth(0, 1);
  return { from: toLocalISO(start), to: toLocalISO(end) };
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
  const [preset, setPreset] = useState<PresetRange>("today");
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [from, setFrom] = useState(() => presetRangeDates("today").from);
  const [to, setTo] = useState(() => presetRangeDates("today").to);
  const [view, setView] = useState<"home" | "list" | "job">("home");
  const [kind, setKind] = useState<"pass" | "remain">("remain");
  const [page, setPage] = useState(1);
  const [job, setJob] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null);
  const pageSize = 8;

  const applyPreset = (nextPreset: Exclude<PresetRange, "custom">) => {
    const range = presetRangeDates(nextPreset);
    setPreset(nextPreset);
    setFrom(range.from);
    setTo(range.to);
    setShowCustomFilter(false);
    setView("home");
    setPage(1);
    setJob(null);
  };

  const applyCustomFilter = () => {
    setPreset("custom");
    setView("home");
    setPage(1);
    setJob(null);
  };

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
    <div className="mb-5 lg:mb-0">
      <div className="mb-3 space-y-2">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { id: "today", label: "Hôm nay" },
            { id: "week", label: "Tuần" },
            { id: "month", label: "Tháng" },
            { id: "quarter", label: "Quý" },
            { id: "year", label: "Năm" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyPreset(item.id as Exclude<PresetRange, "custom">)}
              className={`h-11 rounded-xl border text-xs font-semibold cursor-pointer ${
                preset === item.id
                  ? "bg-primary border-[#1B3A5C] text-white"
                  : "bg-card border-border text-primary"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomFilter((v) => !v)}
            className={`h-11 rounded-xl border text-xs font-semibold cursor-pointer ${
              showCustomFilter || preset === "custom"
                ? "bg-[#EFF6FF] border-[#93C5FD] text-primary"
                : "bg-card border-border text-primary"
            }`}
          >
            <i className="fas fa-filter mr-1" />
            Lọc ngày
          </button>
        </div>

        {showCustomFilter && (
          <div className="bg-card rounded-2xl border border-border p-3 shadow-sm">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="text-[11px] text-muted">
                Từ ngày
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm"
                />
              </label>
              <label className="text-[11px] text-muted">
                Đến ngày
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={applyCustomFilter}
              className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold border-0 cursor-pointer"
            >
              Áp dụng lọc theo ngày
            </button>
          </div>
        )}
      </div>

      {view === "home" && (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => openList("pass")} className="text-left bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center mb-2">
              <i className="fas fa-circle-check text-sm" />
            </div>
            <div className="font-display font-800 text-2xl text-[#16A34A]">{passTotal.toLocaleString("vi-VN")}</div>
            <div className="text-xs font-medium text-muted mt-0.5">Số lượng đạt</div>
            <div className="text-[11px] text-[#2D6EBD] mt-2 font-semibold">Chi tiết →</div>
          </button>
          <button type="button" onClick={() => openList("remain")} className="text-left bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[#FFF1F2] text-[#DC2626] flex items-center justify-center mb-2">
              <i className="fas fa-circle-exclamation text-sm" />
            </div>
            <div className="font-display font-800 text-2xl text-[#DC2626]">{remainTotal.toLocaleString("vi-VN")}</div>
            <div className="text-xs font-medium text-muted mt-0.5">Chưa đạt</div>
            <div className="text-[11px] text-[#2D6EBD] mt-2 font-semibold">Chi tiết →</div>
          </button>
        </div>
      )}

      {view === "list" && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={() => setView("home")} className="text-sm text-muted border-0 bg-transparent cursor-pointer">
              ← Tổng quan
            </button>
            <div className="text-sm font-semibold text-foreground">
              {kind === "remain" ? "Công việc chưa đạt" : "Công việc đã có SL đạt"} · {list.length}
            </div>
          </div>
          {paged.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Không có công việc trong khoảng ngày này</div>
          ) : (
            <div className="space-y-2">
              {paged.map(({ o, b, remain, pass }) => (
                <button
                  key={`${o.id}-${b.id}`}
                  type="button"
                  onClick={() => openJob(o, b)}
                  className="w-full text-left rounded-xl border border-border bg-surface px-3 py-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">{o.orderNo} · {o.productLine}</div>
                      <div className="text-sm font-semibold text-foreground truncate">{b.partName}</div>
                      <div className="text-xs text-muted mt-0.5">
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
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <button type="button" onClick={() => setView("list")} className="text-sm text-muted border-0 bg-transparent cursor-pointer mb-3">
            ← Danh sách công việc
          </button>
          <div className="rounded-xl bg-surface border border-border p-3 mb-4">
            <div className="text-[11px] text-muted-foreground">{job.o.orderNo} · {job.o.productLine}</div>
            <div className="font-display font-700 text-base mt-0.5">{job.b.partName}</div>
            <div className="text-xs text-muted mt-1">{job.b.bomCode} · {job.b.machine || "—"} · {BOM_STATUS_LABEL[job.b.status]}</div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div className="bg-card rounded-lg p-2">
                <div className="text-sm font-bold text-[#16A34A]">{job.b.passQty.toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-muted-foreground">Đạt</div>
              </div>
              <div className="bg-card rounded-lg p-2">
                <div className="text-sm font-bold text-[#DC2626]">{Math.max(0, job.b.targetQty - job.b.passQty).toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-muted-foreground">Chưa đạt</div>
              </div>
              <div className="bg-card rounded-lg p-2">
                <div className="text-sm font-bold text-primary">{job.b.targetQty.toLocaleString("vi-VN")}</div>
                <div className="text-[10px] text-muted-foreground">Mục tiêu</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenJob({ orderId: job.o.id, bomId: job.b.id })}
              className="mt-3 w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold border-0 cursor-pointer"
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
                    current ? "border-[#2D6EBD] bg-[#EFF6FF]" : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{b.partName}</div>
                      <div className="text-xs text-muted">
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
