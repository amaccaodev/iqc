import React from "react";
import type { MachineDayStats } from "../../types/machine";

interface MachineDailyChartProps {
  stats?: MachineDayStats[];
}

export const MachineDailyChart: React.FC<MachineDailyChartProps> = ({ stats = [] }) => {
  if (!stats || stats.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted-foreground border border-border rounded-xl">
        Chưa có dữ liệu thống kê vận hành 7 ngày gần nhất.
      </div>
    );
  }

  // Calculate 7-day totals
  const totalRun = stats.reduce((acc, curr) => acc + curr.runHours, 0);
  const totalIdle = stats.reduce((acc, curr) => acc + curr.idleHours, 0);
  const totalDown = stats.reduce((acc, curr) => acc + curr.downtimeHours, 0);
  const totalHours = totalRun + totalIdle + totalDown || 1;
  const oeePct = Math.round((totalRun / totalHours) * 100);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            Thời gian Chạy vs Dừng 7 ngày qua
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Phân bổ số giờ vận hành thực tế (Run), thời gian rảnh (Idle) và dừng máy (Downtime).
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold">
          Hiệu suất tuần: {oeePct}%
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500" />
          <span>Giờ chạy ({Math.round(totalRun)}h)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-slate-400" />
          <span>Giờ rảnh ({Math.round(totalIdle)}h)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-red-500" />
          <span>Dừng hỏng ({Math.round(totalDown)}h)</span>
        </span>
      </div>

      {/* Pure SVG/CSS Stacked Bar Chart */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        {stats.map((st) => {
          const dayTotal = st.runHours + st.idleHours + st.downtimeHours || 24;
          const runPct = Math.round((st.runHours / dayTotal) * 100);
          const idlePct = Math.round((st.idleHours / dayTotal) * 100);
          const downPct = Math.max(0, 100 - runPct - idlePct);

          return (
            <div key={st.date} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-muted-foreground font-semibold">{st.date}</span>
                <span className="text-[11px] font-medium text-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{st.runHours}h</span> chạy
                  {" • "}
                  <span className="text-muted-foreground">{st.idleHours}h</span> rảnh
                  {st.downtimeHours > 0 && (
                    <>
                      {" • "}
                      <span className="text-red-500 font-bold">{st.downtimeHours}h</span> dừng
                    </>
                  )}
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-muted/20 overflow-hidden flex">
                <div
                  style={{ width: `${runPct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-300"
                  title={`Chạy: ${st.runHours}h (${runPct}%)`}
                />
                <div
                  style={{ width: `${idlePct}%` }}
                  className="bg-slate-400 dark:bg-slate-500 h-full transition-all duration-300"
                  title={`Rảnh: ${st.idleHours}h (${idlePct}%)`}
                />
                <div
                  style={{ width: `${downPct}%` }}
                  className="bg-red-500 h-full transition-all duration-300"
                  title={`Dừng: ${st.downtimeHours}h (${downPct}%)`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

