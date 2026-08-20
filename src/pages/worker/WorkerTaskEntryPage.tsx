import { Navigate, useParams } from "react-router-dom";
import WorkerEntryForm from "../../components/worker/WorkerEntryForm";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function WorkerTaskEntryPage() {
  const { orderId, bomId } = useParams<{ orderId: string; bomId: string }>();
  const user = useRoleUser();
  const { orders, loading } = useOrders();

  if (loading) {
    return (
      <div className="text-center py-16 text-[#94A3B8] text-sm">
        <i className="fas fa-spinner fa-spin text-2xl block mb-2" />
        Đang tải...
      </div>
    );
  }

  const order = orders.find((o) => o.id === orderId);
  const bom = order?.boms.find((b) => b.id === bomId);

  if (!order || !bom) {
    return <Navigate to="/worker/dashboard" replace />;
  }

  const allowed = bom.assignedWorkers.includes(user.name);
  if (!allowed) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4 mx-auto">
          <i className="fas fa-triangle-exclamation text-red-500 text-2xl" />
        </div>
        <h2 className="font-display font-800 text-xl text-[#0F172A] mb-2">Chưa được phân công</h2>
        <p className="text-[#64748B] text-sm mb-6">Bạn không có quyền nhập dữ liệu cho BOM này.</p>
        <Navigate to="/worker/dashboard" replace />
      </div>
    );
  }

  return <WorkerEntryForm user={user} order={order} bom={bom} />;
}
