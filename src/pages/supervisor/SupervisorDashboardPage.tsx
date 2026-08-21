import { SupervisorView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";
import SalaryDashboard from "../../components/salary/SalaryDashboard";
import ShiftCloseQueue from "../../components/salary/ShiftCloseQueue";

export default function SupervisorDashboardPage() {
  const { orders, setOrders } = useOrders();
  return (
    <div>
      <ShiftCloseQueue stage="supervisor" title="Chốt ca — duyệt lương" />
      <SalaryDashboard title="Lương từng nhân viên (đã duyệt)" />
      <SupervisorView orders={orders} setOrders={setOrders} screen="dashboard" />
    </div>
  );
}
