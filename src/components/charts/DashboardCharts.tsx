import { useMemo, useState } from "react";
import type { BOMItem, BOMStatus, ProductionOrder } from "@shared/types";
import { BOM_STATUS_LABEL } from "@shared/constants/labels";
import PaginationBar from "../ui/PaginationBar";

export interface ChartOpenItem {
  orderId: string;
  bomId?: string;
}

interface SheetItem {
  key: string;
  orderId: string;
  bomId?: string;
  title: string;
  subtitle: string;
}

interface Slice {
  id: string;
  label: string;
  value: number;
  percent: number;
  color: string;
  items: SheetItem[];
}

interface LinePoint {
  id: string;
  orderId: string;
  label: string;
  pass: number;
  target: number;
  fail: number;
  items: SheetItem[];
}

const STATUS_COLOR: Record<string, string> = {
  unassigned: "#94A3B8",
  assigned: "#2563EB",
  in_progress: "#7C3AED",
  team_reported: "#D97706",
  qc_passed: "#16A34A",
  qc_failed: "#DC2626",
};

const BOM_STATUSES: BOMStatus[] = ["unassigned", "assigned", "in_progress", "team_reported", "qc_passed", "qc_failed"];
const SHEET_PAGE = 8;
const CHART_PAGE = 8;

function bomItem(o: ProductionOrder, b: BOMItem): SheetItem {
  return {
    key: `${o.id}-${b.id}`,
    orderId: o.id,
    bomId: b.id,
    title: `${o.orderNo} · ${b.partName}`,
    subtitle: `${b.passQty}/${b.targetQty} · ${BOM_STATUS_LABEL[b.status]}${b.assignedTeamName ? ` · ${b.assignedTeamName}` : ""}`,
  };
}

export default function DashboardCharts({
  orders,
  onOpenItem,
}: {
  orders: ProductionOrder[];
  onOpenItem?: (item: ChartOpenItem) => void;
}) {
  const [linePage, setLinePage] = useState(1);
  const [selected, setSelected] = useState<{ title: string; items: SheetItem[] } | null>(null);
  const [sheetPage, setSheetPage] = useState(1);

  const { slices, points } = useMemo(() => {
    const allBoms = orders.flatMap((o) => o.boms.map((b) => ({ o, b })));
    const byStatus: Record<string, typeof allBoms> = {};
    for (const item of allBoms) {
      byStatus[item.b.status] = [...(byStatus[item.b.status] ?? []), item];
    }
    const total = allBoms.length || 1;
    const slices: Slice[] = BOM_STATUSES.filter((s) => byStatus[s]?.length).map((status) => {
      const items = byStatus[status];
      return {
        id: status,
        label: BOM_STATUS_LABEL[status],
        value: items.length,
        percent: Math.round((items.length / total) * 100),
        color: STATUS_COLOR[status] ?? "#64748B",
        items: items.map(({ o, b }) => bomItem(o, b)),
      };
    });

    const points: LinePoint[] = orders.map((o) => {
      const pass = o.boms.reduce((s, b) => s + b.passQty, 0);
      const fail = o.boms.reduce((s, b) => s + b.failQty, 0);
      const target = o.boms.reduce((s, b) => s + b.targetQty, 0) || o.targetQty;
      return {
        id: o.id,
        orderId: o.id,
        label: o.orderNo.replace("LSX-", ""),
        pass,
        target,
        fail,
        items: o.boms.length
          ? o.boms.map((b) => bomItem(o, b))
          : [{ key: o.id, orderId: o.id, title: o.orderNo, subtitle: `${o.productLine} · hạn ${o.deadline}` }],
      };
    });

    return { slices, points };
  }, [orders]);

  const pagedPoints = points.slice((linePage - 1) * CHART_PAGE, linePage * CHART_PAGE);
  const sheetItems = selected?.items ?? [];
  const pagedSheet = sheetItems.slice((sheetPage - 1) * SHEET_PAGE, sheetPage * SHEET_PAGE);
  const sheetListH = Math.min(Math.max(sheetItems.length, 1), SHEET_PAGE) * 68;

  const openSheet = (title: string, items: SheetItem[]) => {
    setSelected({ title, items });
    setSheetPage(1);
  };

  const openDetail = (item: SheetItem) => {
    onOpenItem?.({ orderId: item.orderId, bomId: item.bomId });
    setSelected(null);
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <h3 className="font-display font-700 text-sm mb-1">BOM theo trạng thái</h3>
          <p className="text-[11px] text-[#94A3B8] mb-3">Bấm phần biểu đồ để xem danh sách. Bấm dòng để mở chi tiết.</p>
          <PieChart
            slices={slices}
            onSelect={(s) => openSheet(`${s.label} · ${s.value} BOM (${s.percent}%)`, s.items)}
          />
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-sm">
          <h3 className="font-display font-700 text-sm mb-1">Sản lượng theo lệnh</h3>
          <p className="text-[11px] text-[#94A3B8] mb-3">Bấm điểm để xem số. Số liệu nằm ô riêng, không ghi đè lên đường.</p>
          <LineChart
            points={pagedPoints}
            onSelect={(p) => openSheet(`LSX-${p.label} · ${p.pass.toLocaleString()} đạt`, p.items)}
          />
          <PaginationBar page={linePage} pageSize={CHART_PAGE} total={points.length} onPage={setLinePage} />
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md shadow-xl flex flex-col"
            style={{ minHeight: "58vh", maxHeight: "88vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-3 pb-2 flex-shrink-0">
              <div className="sm:hidden w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-3" />
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-display font-700 text-base pr-2">{selected.title}</h4>
                <button type="button" onClick={() => setSelected(null)} className="w-9 h-9 rounded-full bg-[#F1F5F9] border-0 cursor-pointer text-lg flex-shrink-0">×</button>
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">{sheetItems.length} mục · bấm dòng để xem chi tiết</p>
            </div>
            <div className="px-5 overflow-y-auto flex-1" style={{ minHeight: sheetListH }}>
              <div className="space-y-2 pb-2">
                {pagedSheet.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => openDetail(item)}
                    className="w-full text-left bg-[#F8FAFC] rounded-xl px-3 py-3 border border-transparent hover:border-[#2D6EBD] cursor-pointer min-h-[64px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#0F172A] truncate">{item.title}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">{item.subtitle}</div>
                      </div>
                      <i className="fas fa-chevron-right text-[#CBD5E1] text-xs" />
                    </div>
                  </button>
                ))}
                {pagedSheet.length === 0 && (
                  <div className="text-sm text-[#94A3B8] text-center py-8">Không có mục</div>
                )}
              </div>
            </div>
            <div className="px-5 pb-6 pt-1 flex-shrink-0 border-t border-[#F1F5F9]">
              <PaginationBar page={sheetPage} pageSize={SHEET_PAGE} total={sheetItems.length} onPage={setSheetPage} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PieChart({ slices, onSelect }: { slices: Slice[]; onSelect: (s: Slice) => void }) {
  if (slices.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-[#94A3B8]">Chưa có dữ liệu BOM</div>;
  }
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const size = 220;
  const r = 72;
  const cx = 110;
  const cy = 110;
  let acc = 0;

  const arcs = slices.map((slice) => {
    const start = acc / total;
    acc += slice.value;
    const end = acc / total;
    const mid = (start + end) / 2;
    const ang = mid * Math.PI * 2 - Math.PI / 2;
    const labelR = r + 22;
    return {
      slice,
      d: donutPath(cx, cy, r, 44, start, end),
      lx: cx + labelR * Math.cos(ang),
      ly: cy + labelR * Math.sin(ang),
      showLabel: slice.percent >= 8,
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="max-w-full">
        {arcs.map(({ slice, d }) => (
          <path key={slice.id} d={d} fill={slice.color} className="cursor-pointer" onClick={() => onSelect(slice)}>
            <title>{slice.label}: {slice.value} ({slice.percent}%)</title>
          </path>
        ))}
        {arcs.map(({ slice, lx, ly, showLabel }) =>
          showLabel ? (
            <text key={`${slice.id}-lbl`} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#0F172A">
              {slice.value}
            </text>
          ) : null,
        )}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-[#0F172A]" fontSize="20" fontWeight="700">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-[#94A3B8]" fontSize="10">BOM</text>
      </svg>
      <div className="flex-1 w-full space-y-1">
        {slices.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-2 text-left border border-transparent hover:border-[#E2E8F0] rounded-xl bg-transparent cursor-pointer py-2 px-2 min-h-11"
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-[#475569] flex-1 truncate">{s.label}</span>
            <span className="text-sm font-bold text-[#0F172A] tabular-nums">{s.value}</span>
            <span className="text-[11px] text-[#64748B] w-10 text-right">{s.percent}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function compactNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}tr`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return n.toLocaleString("vi-VN");
  return String(n);
}

function shortAxisLabel(label: string) {
  const s = label.replace(/^\d{4}-/, "");
  return s.length > 6 ? s.slice(-5) : s;
}

function LineChart({ points, onSelect }: { points: LinePoint[]; onSelect: (p: LinePoint) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  if (points.length === 0) {
    return <div className="h-40 flex items-center justify-center text-sm text-[#94A3B8]">Chưa có lệnh sản xuất</div>;
  }
  const active = points.find((p) => p.id === activeId) ?? points[points.length - 1];
  const col = 100;
  const w = Math.max(320, 60 + points.length * col);
  const h = 188;
  const pad = { l: 40, r: 20, t: 12, b: 28 };
  const maxY = Math.max(1, ...points.flatMap((p) => [p.target, p.pass]));
  const n = Math.max(points.length - 1, 1);
  const xAt = (i: number) => pad.l + ((w - pad.l - pad.r) * i) / n;
  const yAt = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / maxY);
  const targetLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.target)}`).join(" ");
  const passLine = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.pass)}`).join(" ");
  const activeIdx = Math.max(0, points.findIndex((p) => p.id === active.id));

  return (
    <div>
      <div className="flex gap-3 text-[11px] mb-2">
        <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-[#2D6EBD] inline-block" /> Đạt</span>
        <span className="flex items-center gap-1 text-[#94A3B8]"><span className="w-4 border-t border-dashed border-[#94A3B8] inline-block" /> Mục tiêu</span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(active)}
        className="w-full mb-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-left cursor-pointer"
      >
        <div className="text-[11px] text-[#94A3B8] truncate">{active.label}</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
          <span><span className="text-[#94A3B8] text-xs">Đạt </span><b className="text-[#1B3A5C]">{active.pass.toLocaleString("vi-VN")}</b></span>
          <span><span className="text-[#94A3B8] text-xs">Mục tiêu </span><b className="text-[#475569]">{active.target.toLocaleString("vi-VN")}</b></span>
          <span><span className="text-[#94A3B8] text-xs">Hỏng </span><b className="text-[#DC2626]">{active.fail.toLocaleString("vi-VN")}</b></span>
        </div>
      </button>
      <div className="overflow-x-auto -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ minWidth: w, height: 188 }} className="block">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={yAt(maxY * t)} y2={yAt(maxY * t)} stroke="#E2E8F0" />
              <text x={pad.l - 6} y={yAt(maxY * t) + 3} textAnchor="end" fontSize="9" fill="#94A3B8">
                {compactNum(Math.round(maxY * t))}
              </text>
            </g>
          ))}
          <path d={targetLine} fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 3" />
          <path d={passLine} fill="none" stroke="#2D6EBD" strokeWidth="2.5" />
          <line x1={xAt(activeIdx)} x2={xAt(activeIdx)} y1={pad.t} y2={h - pad.b} stroke="#93C5FD" strokeWidth="1" strokeDasharray="3 3" />
          {points.map((p, i) => {
            const on = p.id === active.id;
            return (
              <g key={p.id} className="cursor-pointer" onClick={() => setActiveId(p.id)}>
                <circle cx={xAt(i)} cy={yAt(p.pass)} r="16" fill="transparent" />
                <circle cx={xAt(i)} cy={yAt(p.target)} r={on ? 4 : 3} fill="#94A3B8" />
                <circle cx={xAt(i)} cy={yAt(p.pass)} r={on ? 6 : 4} fill="#2D6EBD" stroke="white" strokeWidth="2" />
                <text x={xAt(i)} y={h - 8} textAnchor="middle" fontSize="9" fill={on ? "#1B3A5C" : "#94A3B8"} fontWeight={on ? 700 : 400}>
                  {shortAxisLabel(p.label)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1" style={{ WebkitOverflowScrolling: "touch" }}>
        {points.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setActiveId(p.id); onSelect(p); }}
              className={`flex-shrink-0 min-w-[132px] rounded-xl border px-3 py-2 text-left cursor-pointer ${
                p.id === active.id ? "border-[#2D6EBD] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-[#F8FAFC]"
              }`}
            >
              <div className="text-[10px] text-[#94A3B8] truncate">{p.label}</div>
              <div className="text-sm font-bold text-[#1B3A5C] leading-tight">{p.pass.toLocaleString("vi-VN")}</div>
              <div className="text-[11px] text-[#64748B]">/ {p.target.toLocaleString("vi-VN")} · hỏng {p.fail.toLocaleString("vi-VN")}</div>
            </button>
        ))}
      </div>
    </div>
  );
}

function donutPath(cx: number, cy: number, r1: number, r0: number, start: number, end: number): string {
  if (end - start >= 0.999) end = start + 0.999;
  const a0 = start * Math.PI * 2 - Math.PI / 2;
  const a1 = end * Math.PI * 2 - Math.PI / 2;
  const large = end - start > 0.5 ? 1 : 0;
  const x0 = cx + r1 * Math.cos(a0);
  const y0 = cy + r1 * Math.sin(a0);
  const x1 = cx + r1 * Math.cos(a1);
  const y1 = cy + r1 * Math.sin(a1);
  const x2 = cx + r0 * Math.cos(a1);
  const y2 = cy + r0 * Math.sin(a1);
  const x3 = cx + r0 * Math.cos(a0);
  const y3 = cy + r0 * Math.sin(a0);
  return `M ${x0} ${y0} A ${r1} ${r1} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r0} ${r0} 0 ${large} 0 ${x3} ${y3} Z`;
}
