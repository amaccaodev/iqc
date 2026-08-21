import { WorkerView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";
import SalaryDashboard from "../../components/salary/SalaryDashboard";

export default function WorkerDashboardPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <div>
      <SalaryDashboard workerId={user.id} title="Lương của tôi (sau khi Quản đốc duyệt)" />
      <WorkerView user={user as User} orders={orders} setOrders={setOrders} screen="dashboard" />
    </div>
  );
}
