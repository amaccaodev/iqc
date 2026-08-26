import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BOM_STATUS_LABEL } from "@shared/constants/labels";
import { bomDoneQty, orderPartProgress } from "@shared/utils/productionProgress";
import type { ProductionOrder, UserPublic } from "@shared/types";

function JobCard({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl shadow-sm ${cls}`}>{children}</div>
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
      <h2 className="font-display font-800 text-xl tracking-wide mb-3">CÔNG VIỆC</h2>
      {unfinishedTotal > 0 && (
        <div className="bg-border text-red-600 text-sm font-medium rounded-xl px-4 py-3 mb-4">
          Còn {unfinishedTotal} công việc chưa hoàn thành
        </div>
      )}
      {jobs.length === 0 ? (
        <JobCard cls="p-10 text-center text-muted-foreground">
          <i className="fas fa-inbox text-3xl block mb-2 opacity-30" />
          Chưa được tổ trưởng phân công
        </JobCard>
      ) : (
        <div className="space-y-3">
          {jobs.map(({ order, parts, avgPct }) => {
            const expanded = expandedId === order.id;
            const name = order.productLine || order.productCode || order.orderNo;
            const code = order.productCode || order.orderNo;
            return (
              <JobCard key={order.id} cls="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-mono">{code}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-green-600 font-bold text-sm">{avgPct}%</span>
                    <i
                      className={`fas ${expanded ? "fa-chevron-down" : "fa-chevron-right"} text-[10px] text-muted`}
                    />
                  </div>
                </button>
                <div className="px-4 pb-3">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${avgPct}%` }}
                    />
                  </div>
                </div>
                {expanded && (
                  <div className="border-t border-border px-3 pb-3 pt-2 space-y-2 bg-surface/40">
                    <div className="text-[11px] font-semibold text-muted px-1 mb-1">
                      Linh kiện được phân công · số lượng
                    </div>
                    {parts.map(({ bom, done, target, pct, fail }) => (
                      <Link
                        key={bom.id}
                        to={`/worker/task/${order.id}/${bom.id}`}
                        className="block rounded-xl border border-border bg-card p-3 no-underline text-inherit hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm">
                              {bom.partGroup || bom.partName}
                              {bom.process ? (
                                <span className="text-muted font-medium"> · {bom.process}</span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                              {bom.partCode || bom.bomCode}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-display font-700 text-base text-primary tabular-nums">
                              {done.toLocaleString()}
                              <span className="text-muted-foreground font-medium text-sm">
                                {" "}
                                / {target.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted">
                              {pct}% · {BOM_STATUS_LABEL[bom.status] || bom.status}
                            </div>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? "bg-emerald-500" : "bg-[#2D6EBD]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                          {bom.machine ? <span>Máy: {bom.machine}</span> : null}
                          {fail > 0 ? <span className="text-red-600">Hỏng: {fail}</span> : null}
                          <span>Đã đo: {bomDoneQty(bom)}</span>
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
