import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BOM_STATUS_LABEL } from "@shared/constants/labels";
import { bomDoneQty, orderPartProgress } from "@shared/utils/productionProgress";
import type { ProductionOrder, UserPublic } from "@shared/types";

function JobCard({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return (
    <div className={`bg-card border border-border/80 rounded-2xl shadow-card transition-all duration-200 ${cls}`}>
      {children}
    </div>
  );
}

/** Danh sách công việc CN: bấm lệnh → mở linh kiện + SL; bấm LK → detail đo kiểm. */
export default function WorkerJobsList({
  user,
  orders,
}: {
  user: UserPublic;
  orders: ProductionOrder[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const jobs = useMemo(() => {
    return orders
      .map((order) => {
        const myBoms = order.boms.filter((b) => b.assignedWorkers.includes(user.name));
        if (myBoms.length === 0) return null;
        const parts = orderPartProgress(order).filter((p) =>
          myBoms.some((b) => b.id === p.bom.id),
        );
        const unfinished = myBoms.filter(
          (b) => b.status !== "qc_passed" && b.status !== "team_reported",
        ).length;
        const avgPct =
          parts.length > 0
            ? Math.round(parts.reduce((s, p) => s + p.pct, 0) / parts.length)
            : 0;
        return { order, myBoms, parts, unfinished, avgPct };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [orders, user.name]);

  const unfinishedTotal = jobs.reduce((s, j) => s + j.unfinished, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-800 text-xl tracking-tight">Công việc của bạn</h2>
          <p className="text-xs text-muted mt-0.5">Danh sách các lệnh &amp; linh kiện được phân công</p>
        </div>
        {jobs.length > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-primary ring-1 ring-primary/20">
            {jobs.length} lệnh SX
          </span>
        )}
      </div>

      {unfinishedTotal > 0 && (
        <div className="flex items-center gap-2.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300 text-sm font-medium rounded-2xl px-4 py-3 mb-4 shadow-sm animate-fade-up">
          <span className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0">
            <i className="fas fa-clock text-rose-600 dark:text-rose-400 text-xs" />
          </span>
          <div className="flex-1 text-xs sm:text-sm">
            Còn <strong className="font-bold">{unfinishedTotal}</strong> công việc chưa hoàn thành trong ca
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <JobCard cls="p-12 text-center text-muted-foreground border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-surface mx-auto mb-3 flex items-center justify-center text-muted">
            <i className="fas fa-inbox text-xl opacity-60" />
          </div>
          <div className="font-semibold text-foreground text-sm">Chưa có công việc nào</div>
          <div className="text-xs text-muted mt-1">Bạn chưa được tổ trưởng phân công vào lệnh sản xuất nào</div>
        </JobCard>
      ) : (
        <div className="space-y-3">
          {jobs.map(({ order, parts, avgPct }) => {
            const expanded = expandedId === order.id;
            const name = order.productLine || order.productCode || order.orderNo;
            const code = order.productCode || order.orderNo;
            return (
              <JobCard key={order.id} cls="overflow-hidden hover:border-primary/40">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full text-left px-4 py-4 sm:px-5 flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer hover:bg-surface/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-700 text-sm sm:text-base text-foreground truncate">{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">{code}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base tabular-nums">
                        {avgPct}%
                      </span>
                      <div className="text-[10px] text-muted-foreground">{parts.length} linh kiện</div>
                    </div>
                    <span className={`w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                      <i className="fas fa-chevron-down text-xs" />
                    </span>
                  </div>
                </button>
                <div className="px-4 sm:px-5 pb-3.5">
                  <div className="h-2 bg-surface rounded-full overflow-hidden ring-1 ring-inset ring-border/50">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        avgPct >= 100
                          ? "bg-gradient-to-r from-emerald-500 to-green-500"
                          : "bg-brand-gradient"
                      }`}
                      style={{ width: `${avgPct}%` }}
                    />
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-border/70 px-3 sm:px-4 pb-4 pt-3 space-y-2.5 bg-surface/40 animate-fade-up">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted px-1 mb-1">
                      Linh kiện được phân công · bấm để đo kiểm
                    </div>
                    {parts.map(({ bom, done, target, pct, fail }) => (
                      <Link
                        key={bom.id}
                        to={`/worker/task/${order.id}/${bom.id}`}
                        className="group block rounded-2xl border border-border/80 bg-card p-3.5 no-underline text-inherit hover:border-primary hover:shadow-card transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5 flex-wrap">
                              {bom.partGroup || bom.partName}
                              {bom.process ? (
                                <span className="text-muted text-xs font-normal"> · {bom.process}</span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {bom.partCode || bom.bomCode}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display font-700 text-base text-primary tabular-nums">
                              {done.toLocaleString()}
                              <span className="text-muted-foreground font-medium text-xs">
                                {" "}
                                / {target.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted font-medium mt-0.5">
                              {pct}% · {BOM_STATUS_LABEL[bom.status] || bom.status}
                            </div>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface overflow-hidden ring-1 ring-inset ring-border/50">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct >= 100
                                ? "bg-gradient-to-r from-emerald-500 to-green-500"
                                : "bg-brand-gradient"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted">
                          <div className="flex items-center gap-3">
                            {bom.machine ? (
                              <span className="flex items-center gap-1">
                                <i className="fas fa-gear text-[10px]" /> {bom.machine}
                              </span>
                            ) : null}
                            {fail > 0 ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                <i className="fas fa-circle-exclamation text-[10px]" /> Hỏng: {fail}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Vào đo kiểm <i className="fas fa-arrow-right text-[10px]" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </JobCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
