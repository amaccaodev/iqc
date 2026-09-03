import { Navigate, useParams } from "react-router-dom";
import WorkerEntryForm from "../../components/worker/WorkerEntryForm";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";

type TaskMode = "info" | "measure";

function WorkerTaskPage({ mode }: { mode: TaskMode }) {
  const { orderId, bomId } = useParams<{ orderId: string; bomId: string }>();
  const user = useRoleUser();
  const { orders, loading } = useOrders();

  const order = orders.find((o) => o.id === orderId);
  const bom = order?.boms.find((b) => b.id === bomId);

  if (loading && orders.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <i className="fas fa-spinner fa-spin text-2xl block mb-2" />
        Đang tải...
      </div>
    );
  }

  if (!loading && (!order || !bom)) {
    return <Navigate to="/worker/entry" replace />;
  }

  if (!order || !bom) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        <i className="fas fa-spinner fa-spin text-2xl block mb-2" />
        Đang tải...
      </div>
    );
  }

  const allowed =
    bom.assignedWorkers.length === 0 || bom.assignedWorkers.includes(user.name);
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
          <i className="fas fa-triangle-exclamation text-red-500 text-2xl" />
        </div>
        <h2 className="font-display font-800 text-xl text-foreground mb-2">Chưa được phân công</h2>
        <p className="text-muted text-sm mb-6">Bạn không có quyền nhập dữ liệu cho BOM này.</p>
        <Navigate to="/worker/entry" replace />
      </div>
    );
  }

  return <WorkerEntryForm user={user} order={order} bom={bom} mode={mode} />;
}

/** Trang thông tin linh kiện — bấm Đo kiểm mới sang trang nhập */
export default function WorkerTaskEntryPage() {
  return <WorkerTaskPage mode="info" />;
}

export function WorkerTaskMeasurePage() {
  return <WorkerTaskPage mode="measure" />;
}
