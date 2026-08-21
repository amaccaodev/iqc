import { Link, Navigate, useParams } from "react-router-dom";
import { BOM_STATUS_LABEL, STATUS_LABEL } from "@shared/constants/labels";
import {
  bomDoneQty,
  bomMachineWorkRows,
  remainingUntilDeadline,
} from "@shared/utils/productionProgress";
import { Card } from "../../components/ui";
import { useOrders } from "../../hooks/useOrders";

export default function PartDetailPage({
  backBase,
}: {
  /** vd /director/production hoặc /supervisor/production */
  backBase: string;
}) {
  const { orderId, bomId } = useParams<{ orderId: string; bomId: string }>();
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <div className="text-center py-16 text-muted text-sm">
        <i className="fas fa-spinner fa-spin text-2xl block mb-2" />
        Đang tải…
      </div>
    );
  }

  const order = orders.find((o) => o.id === orderId);
  const bom = order?.boms.find((b) => b.id === bomId);

  if (!order || !bom) {
    return <Navigate to={backBase} replace />;
  }

  const done = bomDoneQty(bom);
  const target = bom.targetQty || 0;
  const pct = target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
  const remain = remainingUntilDeadline(order.deadline);
  const machines = bomMachineWorkRows(bom);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          to={backBase}
          className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted hover:text-foreground no-underline"
          aria-label="Quay lại"
        >
          <i className="fas fa-arrow-left text-sm" />
        </Link>
        <div className="min-w-0">
          <h2 className="font-display font-800 text-lg sm:text-xl truncate">{bom.partName}</h2>
          <div className="text-xs text-muted font-mono">
            {bom.partCode || bom.bomCode} · {order.orderNo}
          </div>
        </div>
      </div>

      <Card cls="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-primary">
            {BOM_STATUS_LABEL[bom.status] ?? bom.status}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-border text-muted">
            Lệnh: {STATUS_LABEL[order.status]}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-lg bg-surface px-2.5 py-2">
            <div className="text-muted-foreground">Đã SX</div>
            <div className="font-bold text-primary tabular-nums text-base">
              {done.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-surface px-2.5 py-2">
            <div className="text-muted-foreground">Cần làm</div>
            <div className="font-bold text-foreground tabular-nums text-base">
              {target.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-surface px-2.5 py-2">
            <div className="text-muted-foreground">Tiến độ</div>
            <div className="font-bold text-primary tabular-nums text-base">{pct}%</div>
          </div>
          <div className="rounded-lg bg-surface px-2.5 py-2">
            <div className="text-muted-foreground">Hỏng</div>
            <div className="font-bold text-red-600 tabular-nums text-base">
              {(bom.failQty || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full transition-all ${pct >= 100 ? "bg-emerald-500" : "bg-[#2D6EBD]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="text-sm space-y-1.5 pt-1">
          <div className="flex justify-between gap-2">
            <span className="text-muted">Thành phẩm / lệnh</span>
            <span className="font-medium text-right">{order.productLine}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Tổ phụ trách</span>
            <span className="font-medium text-right">{bom.assignedTeamName || "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Công đoạn</span>
            <span className="font-medium text-right">{bom.process || "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Deadline lệnh</span>
            <span className="font-medium text-right">{order.deadline || "—"}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-muted">Thời gian còn lại</span>
            <span
              className={`font-semibold text-right ${remain.overdue ? "text-red-600" : "text-primary"}`}
            >
              {remain.label}
            </span>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="font-display font-700 text-sm mb-2">
          Máy đang làm ({machines.length})
        </h3>
        {machines.length === 0 ? (
          <Card cls="p-4 text-sm text-muted text-center">
            Chưa có máy / công nhân được phân trên linh kiện này.
          </Card>
        ) : (
          <div className="space-y-2">
            {machines.map((m) => (
              <Card key={m.machineKey} cls="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-2">
                      <i className="fas fa-industry text-muted text-xs" />
                      {m.machineName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-muted uppercase">Đã SX</div>
                    <div className="font-display font-700 text-primary tabular-nums">
                      {m.doneQty.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div className="rounded-lg bg-surface px-2.5 py-2">
                    <div className="text-muted-foreground">Thời gian còn lại</div>
                    <div
                      className={`font-semibold ${remain.overdue ? "text-red-600" : "text-foreground"}`}
                    >
                      {remain.label}
                    </div>
                  </div>
                  <div className="rounded-lg bg-surface px-2.5 py-2">
                    <div className="text-muted-foreground">Số CN</div>
                    <div className="font-semibold">{m.workers.length || "—"}</div>
                  </div>
                </div>

                <div className="text-[11px] text-muted mb-1">Người đang sản xuất</div>
                {m.workers.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Chưa gán công nhân</div>
                ) : (
                  <ul className="space-y-1">
                    {m.workers.map((w) => (
                      <li
                        key={`${w.workerId}-${w.workerName}`}
                        className="flex items-center justify-between gap-2 text-sm rounded-lg border border-border px-2.5 py-1.5"
                      >
                        <span className="font-medium truncate">
                          <i className="fas fa-user text-muted text-[10px] mr-1.5" />
                          {w.workerName}
                        </span>
                        <span className="text-xs text-muted tabular-nums shrink-0">
                          SX {w.doneQty}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
