import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BOM_STATUS_LABEL } from "@shared/constants/labels";
import { bomDoneQty } from "@shared/utils/productionProgress";
import { bomStepLabel, groupOrderJobsByPart } from "@shared/utils/orderParts";
import type { ProductionOrder, ShiftClose, UserPublic } from "@shared/types";
import { salaryApi } from "../../services/api/SalaryApiService";

function useWorkerJobs(user: UserPublic, orders: ProductionOrder[]) {
  const [closes, setCloses] = useState<ShiftClose[]>([]);

  useEffect(() => {
    void salaryApi
      .listShiftCloses()
      .then((rows) => setCloses(Array.isArray(rows) ? rows : []))
      .catch(() => setCloses([]));
  }, [orders]);

  const jobs = useMemo(() => {
    return orders
      .map((order) => {
        const myBoms = order.boms.filter((b) => b.assignedWorkers.includes(user.name));
        if (myBoms.length === 0) return null;
        const parts = groupOrderJobsByPart(myBoms).map((g) => {
          const steps = g.recipes.flatMap((r) => r.steps);
          const done = steps.reduce((s, b) => s + bomDoneQty(b, closes), 0);
          const target = steps.reduce((s, b) => s + (b.targetQty || 0), 0);
          const fail = steps.reduce((s, b) => s + (b.failQty || 0), 0);
          const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
          return { ...g, steps, done, target, fail, pct };
        });
        const unfinished = myBoms.filter(
          (b) => b.status !== "qc_passed" && b.status !== "team_reported",
        ).length;
        const avgPct =
          parts.length > 0
            ? Math.round(parts.reduce((s, p) => s + p.pct, 0) / parts.length)
            : 0;
        return { order, parts, unfinished, avgPct };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);
  }, [orders, user.name, closes]);

  return { jobs, closes };
}

function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 text-sm text-muted no-underline hover:text-primary mb-3">
      <i className="fas fa-arrow-left text-xs" />
      {label}
    </Link>
  );
}

/** Danh sách lệnh SX (table) → click vào detail linh kiện. */
export default function WorkerJobsList({
  user,
  orders,
}: {
  user: UserPublic;
  orders: ProductionOrder[];
}) {
  const navigate = useNavigate();
  const { jobs } = useWorkerJobs(user, orders);
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
        <div className="panel p-10 text-center text-muted-foreground">
          <i className="fas fa-inbox text-3xl block mb-2 opacity-30" />
          Chưa được tổ trưởng phân công
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Lệnh / sản phẩm</th>
                <th className="px-3 py-2.5 text-left font-semibold">Mã</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tiến độ</th>
                <th className="px-3 py-2.5 text-right font-semibold">Linh kiện</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(({ order, parts, avgPct }) => {
                const name = order.productLine || order.productCode || order.orderNo;
                const code = order.productCode || order.orderNo;
                return (
                  <tr
                    key={order.id}
                    className="cursor-pointer hover:bg-surface/70"
                    onClick={() => navigate(`/worker/entry/${order.id}`)}
                  >
                    <td className="px-3 py-3 font-semibold">
                      <i className="fas fa-chevron-right text-[10px] text-muted mr-2" />
                      {name}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-muted">{code}</td>
                    <td className="px-3 py-3 text-right font-bold text-primary tabular-nums">
                      {avgPct}%
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{parts.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Detail lệnh: danh sách linh kiện. */
export function WorkerOrderPartsView({
  user,
  orders,
}: {
  user: UserPublic;
  orders: ProductionOrder[];
}) {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { jobs } = useWorkerJobs(user, orders);
  const job = jobs.find((j) => j.order.id === orderId);

  if (!job) {
    return (
      <div>
        <BackLink to="/worker/entry" label="Danh sách công việc" />
        <div className="panel p-8 text-center text-muted">Không tìm thấy lệnh hoặc chưa được phân công.</div>
      </div>
    );
  }

  const { order, parts, avgPct } = job;
  const title = order.productLine || order.productCode || order.orderNo;

  return (
    <div>
      <BackLink to="/worker/entry" label="Danh sách công việc" />
      <h2 className="font-display font-800 text-xl tracking-wide mb-1">{title}</h2>
      <p className="text-sm text-muted mb-4">
        {order.orderNo} · tiến độ {avgPct}% · {parts.length} linh kiện
      </p>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Linh kiện</th>
              <th className="px-3 py-2.5 text-left font-semibold">Công thức</th>
              <th className="px-3 py-2.5 text-right font-semibold">SL xong / cần</th>
              <th className="px-3 py-2.5 text-right font-semibold">Bước</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr
                key={p.key}
                className="cursor-pointer hover:bg-surface/70"
                onClick={() =>
                  navigate(`/worker/entry/${order.id}/part/${encodeURIComponent(p.key)}`)
                }
              >
                <td className="px-3 py-3">
                  <div className="font-semibold">{p.partName}</div>
                  <div className="text-[11px] text-muted font-mono">{p.partCode}</div>
                </td>
                <td className="px-3 py-3 text-xs text-muted">
                  {p.recipes.map((r) => r.name).join(" · ") || "—"}
                </td>
                <td className="px-3 py-3 text-right tabular-nums font-semibold text-primary">
                  {p.done.toLocaleString()} / {p.target.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-right text-xs text-primary font-semibold">
                  {p.steps.length} bước →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Detail linh kiện: danh sách bước / quy trình để quản lý đo. */
export function WorkerPartStepsView({
  user,
  orders,
}: {
  user: UserPublic;
  orders: ProductionOrder[];
}) {
  const { orderId = "", partKey: partKeyEnc = "" } = useParams();
  const partKey = decodeURIComponent(partKeyEnc);
  const { jobs, closes } = useWorkerJobs(user, orders);
  const job = jobs.find((j) => j.order.id === orderId);
  const part = job?.parts.find((p) => p.key === partKey);

  if (!job || !part) {
    return (
      <div>
        <BackLink to={orderId ? `/worker/entry/${orderId}` : "/worker/entry"} label="Danh sách linh kiện" />
        <div className="panel p-8 text-center text-muted">Không tìm thấy linh kiện.</div>
      </div>
    );
  }

  const { order } = job;
  const title = order.productLine || order.productCode || order.orderNo;

  return (
    <div>
      <BackLink to={`/worker/entry/${order.id}`} label="Danh sách linh kiện" />
      <h2 className="font-display font-800 text-xl tracking-wide mb-1">{part.partName}</h2>
      <p className="text-sm text-muted mb-4">
        {title} · {part.partCode} · {part.steps.length} bước
      </p>
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2.5 text-left font-semibold">Bước / quy trình</th>
              <th className="px-3 py-2.5 text-left font-semibold">Trạng thái</th>
              <th className="px-3 py-2.5 text-right font-semibold">SL xong / cần</th>
              <th className="px-3 py-2.5 text-right font-semibold" />
            </tr>
          </thead>
          <tbody>
            {part.steps.map((b) => {
              const done = bomDoneQty(b, closes);
              return (
                <tr key={b.id} className="hover:bg-surface/70">
                  <td className="px-3 py-3 font-medium">{bomStepLabel(b)}</td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {BOM_STATUS_LABEL[b.status] ?? b.status}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className="font-bold text-primary">{done.toLocaleString()}</span>
                    <span className="text-muted"> / {(b.targetQty || 0).toLocaleString()}</span>
                    {(b.failQty || 0) > 0 ? (
                      <span className="text-red-600 ml-2">hỏng {b.failQty}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link
                      to={`/worker/task/${order.id}/${b.id}`}
                      className="text-xs font-semibold text-primary no-underline"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
