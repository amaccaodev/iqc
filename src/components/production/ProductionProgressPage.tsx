import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BOM_STATUS_LABEL, STATUS_LABEL } from "@shared/constants/labels";
import {
  estimateFinishedQty,
  orderPartProgress,
} from "@shared/utils/productionProgress";
import { resolveBomTeamId, resolveUserTeamId, teamIdsMatch } from "@shared/constants/teams";
import type { ProductionOrder, ShiftClose } from "@shared/types";
import { Btn, Card } from "../ui";
import { useOrders } from "../../hooks/useOrders";
import { useRoleUser } from "../layout/RoleLayout";
import { orderApi } from "../../services/api/OrderApiService";
import { salaryApi } from "../../services/api/SalaryApiService";
import { toast } from "../../hooks/useToast";

const PENDING_SHIFT: ReadonlySet<string> = new Set([
  "pending_teamlead",
  "pending_qc",
  "pending_supervisor",
]);

function ProgressBar({ pct, tone = "blue" }: { pct: number; tone?: "blue" | "green" | "amber" }) {
  const color =
    tone === "green" ? "bg-emerald-500" : tone === "amber" ? "bg-amber-500" : "bg-[#2D6EBD]";
  return (
    <div className="h-2 rounded-full bg-border overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

function RedDot({ title }: { title: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"
      title={title}
      aria-label={title}
    />
  );
}

function PartRow({
  name,
  code,
  done,
  target,
  fail,
  pct,
  status,
  team,
  workersOnMachine,
  shiftClosePending,
  detailPath,
}: {
  name: string;
  code: string;
  done: number;
  target: number;
  fail: number;
  pct: number;
  status: string;
  team: string;
  workersOnMachine: number;
  shiftClosePending: boolean;
  detailPath: string;
}) {
  return (
    <Link
      to={detailPath}
      className="block rounded-xl border border-border bg-card p-3 sm:p-4 relative no-underline text-inherit hover:border-primary/50 hover:bg-surface transition-colors"
    >
      {shiftClosePending ? (
        <span className="absolute top-3 right-3">
          <RedDot title="Có chốt ca chờ duyệt trên linh kiện này" />
        </span>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2 pr-4">
        <div className="min-w-0">
          <div className="font-semibold text-foreground text-sm sm:text-base flex items-center gap-2">
            {name}
            <i className="fas fa-chevron-right text-[10px] text-muted" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">{code}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-700 text-lg text-primary tabular-nums">
            {done.toLocaleString()}
            <span className="text-muted-foreground font-medium text-sm"> / {target.toLocaleString()}</span>
          </div>
          <div className="text-[11px] text-muted">{pct}% · {status}</div>
        </div>
      </div>
      <ProgressBar pct={pct} tone={pct >= 100 ? "green" : pct >= 60 ? "blue" : "amber"} />
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {team ? <span>Tổ: {team}</span> : null}
        {workersOnMachine > 0 ? (
          <span className="text-primary font-medium">{workersOnMachine} CN đang làm</span>
        ) : null}
        {fail > 0 ? <span className="text-red-600">Hỏng: {fail}</span> : null}
        {shiftClosePending ? (
          <span className="text-red-600 font-medium">Có chốt ca chờ duyệt</span>
        ) : null}
      </div>
    </Link>
  );
}

function ProductCard({
  order,
  expanded,
  onToggle,
  onCompleted,
  canComplete,
  newOrderPath,
  detailBase,
  pendingBomIds,
  orderHasPendingClose,
  teamIdFilter,
}: {
  order: ProductionOrder;
  expanded: boolean;
  onToggle: () => void;
  onCompleted: (order: ProductionOrder) => void;
  canComplete: boolean;
  newOrderPath: string;
  detailBase: string;
  pendingBomIds: Set<string>;
  orderHasPendingClose: boolean;
  /** Tổ trưởng: chỉ hiện linh kiện của tổ */
  teamIdFilter?: string;
}) {
  const parts = orderPartProgress(order).filter((p) =>
    teamIdFilter ? teamIdsMatch(resolveBomTeamId(p.bom), teamIdFilter) : true,
  );
  const finishedEst = estimateFinishedQty(order);
  const partDoneAvg =
    parts.length > 0 ? Math.round(parts.reduce((s, p) => s + p.pct, 0) / parts.length) : 0;
  const [completing, setCompleting] = useState(false);
  const [msg, setMsg] = useState("");
  const isDone = order.status === "completed";

  const handleComplete = async () => {
    if (!canComplete || isDone || completing) return;
    const ok = await toast.confirm({
      title: "Hoàn thành lệnh",
      message: `Hoàn thành lệnh ${order.orderNo}?\n\nDùng khi số lượng giao sai — sau đó tạo yêu cầu/lệnh mới với số lượng đúng.`,
      confirmLabel: "Hoàn thành",
    });
    if (!ok) return;
    setCompleting(true);
    setMsg("");
    try {
      const updated = await orderApi.complete(
        order.id,
        `GĐ hoàn thành thủ công (${new Date().toLocaleString("vi-VN")})`,
      );
      onCompleted(updated);
      setMsg("Đã hoàn thành. Có thể tạo lệnh mới với số lượng đúng.");
      toast.success("Đã hoàn thành lệnh");
    } catch (e) {
      setMsg((e as Error).message || "Không hoàn thành được lệnh");
      toast.error((e as Error).message || "Không hoàn thành được lệnh");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Card cls="overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-4 py-4 sm:px-5 flex items-start gap-3 bg-transparent border-0 cursor-pointer hover:bg-surface"
      >
        <span
          className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            expanded ? "bg-primary text-white" : "bg-border text-muted"
          }`}
        >
          <i className={`fas ${expanded ? "fa-chevron-down" : "fa-chevron-right"} text-xs`} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display font-700 text-base sm:text-lg text-foreground">
              {order.productLine}
            </span>
            {orderHasPendingClose ? <RedDot title="Có chốt ca chờ duyệt trên lệnh này" /> : null}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                isDone ? "bg-emerald-100 text-emerald-800" : "bg-secondary text-primary"
              }`}
            >
              {STATUS_LABEL[order.status]}
            </span>
          </div>
          <div className="text-xs text-muted mt-0.5 font-mono">
            {order.orderNo}
            {order.productCode ? ` · ${order.productCode}` : ""}
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-surface px-2.5 py-2">
              <div className="text-muted-foreground">Thành phẩm ước tính</div>
              <div className="font-bold text-primary tabular-nums">
                {finishedEst.toLocaleString()} / {order.targetQty.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-surface px-2.5 py-2">
              <div className="text-muted-foreground">Linh kiện</div>
              <div className="font-bold text-primary">{parts.length} chi tiết</div>
            </div>
            <div className="rounded-lg bg-surface px-2.5 py-2 col-span-2 sm:col-span-1">
              <div className="text-muted-foreground">Tiến độ TB</div>
              <div className="font-bold text-primary">{partDoneAvg}%</div>
            </div>
          </div>
          <div className="mt-2">
            <ProgressBar pct={partDoneAvg} tone={isDone ? "green" : "blue"} />
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-surface px-4 py-4 sm:px-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold text-muted uppercase tracking-wide">
              {teamIdFilter
                ? "Linh kiện của tổ — đã làm / cần làm"
                : "Sản phẩm con (linh kiện) — đã làm / cần làm"}
            </div>
            {canComplete && !isDone ? (
              <Btn size="sm" variant="secondary" onClick={() => void handleComplete()} disabled={completing}>
                <i className="fas fa-flag-checkered" />{" "}
                {completing ? "Đang xử lý…" : "Hoàn thành lệnh"}
              </Btn>
            ) : null}
          </div>

          {msg && (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                msg.startsWith("Đã") ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {msg}{" "}
              {msg.startsWith("Đã") && (
                <Link to={newOrderPath} className="underline font-medium">
                  Tạo lệnh mới
                </Link>
              )}
            </div>
          )}

          {parts.map((p) => (
            <PartRow
              key={p.bom.id}
              name={p.bom.partName}
              code={p.bom.partCode || p.bom.bomCode}
              done={p.done}
              target={p.target}
              fail={p.fail}
              pct={p.pct}
              status={BOM_STATUS_LABEL[p.bom.status] ?? p.bom.status}
              team={p.bom.assignedTeamName}
              workersOnMachine={
                p.bom.workerAssignments?.length || p.bom.assignedWorkers?.length || 0
              }
              shiftClosePending={pendingBomIds.has(p.bom.id)}
              detailPath={`${detailBase}/${order.id}/${p.bom.id}`}
            />
          ))}
          {parts.length === 0 && (
            <div className="text-sm text-muted">Lệnh chưa có linh kiện BOM.</div>
          )}
        </div>
      )}
    </Card>
  );
}

export type ProductionProgressMode = "director" | "supervisor" | "teamlead";

export default function ProductionProgressPage({ mode }: { mode: ProductionProgressMode }) {
  const user = useRoleUser();
  const { orders, setOrders, loading, refreshOrders } = useOrders();
  const [selectedId, setSelectedId] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [shiftCloses, setShiftCloses] = useState<ShiftClose[]>([]);

  const canComplete = mode === "director";
  const showShiftDots = mode === "supervisor" || mode === "teamlead";
  const teamIdFilter = mode === "teamlead" ? resolveUserTeamId(user) || undefined : undefined;
  const newOrderPath =
    mode === "director"
      ? "/director/orders"
      : mode === "supervisor"
        ? "/supervisor/orders"
        : "/teamlead/boms";
  const detailBase =
    mode === "director"
      ? "/director/production"
      : mode === "supervisor"
        ? "/supervisor/production"
        : "/teamlead/production";

  useEffect(() => {
    if (!showShiftDots) return;
    void salaryApi
      .listShiftCloses()
      .then(setShiftCloses)
      .catch(() => setShiftCloses([]));
  }, [showShiftDots, orders]);

  const pendingByOrder = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!showShiftDots) return map;
    const statusOk =
      mode === "teamlead"
        ? (s: string) => s === "pending_teamlead"
        : (s: string) => PENDING_SHIFT.has(s);
    for (const sc of shiftCloses) {
      if (!statusOk(sc.status)) continue;
      let set = map.get(sc.orderId);
      if (!set) {
        set = new Set();
        map.set(sc.orderId, set);
      }
      set.add(sc.bomId);
    }
    return map;
  }, [shiftCloses, showShiftDots, mode]);

  const activeOrders = useMemo(
    () =>
      orders.filter((o) => {
        // Lệnh từ GĐ giao xuống: approved / đang làm / chờ duyệt — chưa phải "đã hoàn thành"
        if (!["approved", "in_progress", "pending_approval", "completed"].includes(o.status)) {
          return false;
        }
        if (hideCompleted && o.status === "completed") return false;
        if (
          teamIdFilter &&
          !o.boms.some((b) => teamIdsMatch(resolveBomTeamId(b), teamIdFilter))
        ) {
          return false;
        }
        return true;
      }),
    [orders, hideCompleted, teamIdFilter],
  );

  const visible = useMemo(() => {
    if (!selectedId) return activeOrders;
    return activeOrders.filter((o) => o.id === selectedId);
  }, [activeOrders, selectedId]);

  const subtitle =
    mode === "director"
      ? "Theo dõi linh kiện đã làm / cần làm. Sai số lượng → bấm Hoàn thành rồi tạo lệnh mới."
      : mode === "teamlead"
        ? "Công việc của tổ — bấm linh kiện để xem máy / CN. Chấm đỏ = chốt ca chờ tổ trưởng."
        : "Theo dõi linh kiện đã làm / cần làm. Chấm đỏ = có chốt ca từ dưới chờ duyệt.";

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display font-800 text-lg sm:text-xl lg:text-2xl">Công việc</h2>
        <p className="text-sm text-muted mt-1 max-w-xl mx-auto">{subtitle}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <label className="text-sm text-muted flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={hideCompleted}
            onChange={(e) => setHideCompleted(e.target.checked)}
            className="accent-[#1B3A5C]"
          />
          Ẩn lệnh SX đã đóng
        </label>
        <button
          type="button"
          onClick={() => {
            void refreshOrders();
            if (showShiftDots) {
              void salaryApi
                .listShiftCloses()
                .then(setShiftCloses)
                .catch(() => setShiftCloses([]));
            }
          }}
          className="text-sm font-medium text-[#2D6EBD] border-0 bg-transparent cursor-pointer"
        >
          <i className="fas fa-rotate-right mr-1" /> Làm mới
        </button>
      </div>

      <Card cls="p-4">
        <label className="block text-sm">
          <span className="text-muted font-medium">Sản phẩm / lệnh đã giao</span>
          <select
            className="mt-1.5 w-full border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none focus:border-ring"
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              setExpandedId(id || null);
            }}
          >
            <option value="">— Tất cả lệnh đang theo dõi —</option>
            {activeOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {pendingByOrder.has(o.id) ? "● " : ""}
                {o.productLine} ({o.orderNo}) — {STATUS_LABEL[o.status]}
              </option>
            ))}
          </select>
        </label>
      </Card>

      {loading && <div className="text-sm text-muted">Đang tải lệnh sản xuất…</div>}

      {!loading && visible.length === 0 && (
        <Card cls="p-6 text-center text-sm text-muted">
          {mode === "teamlead"
            ? "Chưa có lệnh giao cho tổ bạn (status Đã duyệt / Đang SX từ Giám đốc)."
            : "Chưa có lệnh để theo dõi. Tạo lệnh từ trang Lệnh SX (chọn sản phẩm có BOM)."}
        </Card>
      )}

      <div className="space-y-3">
        {visible.map((order) => {
          const pendingBomIds = pendingByOrder.get(order.id) ?? new Set<string>();
          return (
          <ProductCard
            key={order.id}
            order={order}
            expanded={expandedId === order.id || selectedId === order.id}
            onToggle={() => setExpandedId((cur) => (cur === order.id ? null : order.id))}
            canComplete={canComplete}
            newOrderPath={newOrderPath}
            detailBase={detailBase}
            teamIdFilter={teamIdFilter}
            pendingBomIds={pendingBomIds}
            orderHasPendingClose={pendingBomIds.size > 0}
            onCompleted={(updated) => {
              setOrders(orders.map((o) => (o.id === updated.id ? updated : o)));
              void refreshOrders();
            }}
          />
          );
        })}
      </div>
    </div>
  );
}
