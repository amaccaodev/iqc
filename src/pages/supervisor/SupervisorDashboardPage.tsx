import { SupervisorView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";

export default function SupervisorDashboardPage() {
  const { orders, setOrders } = useOrders();
  return <SupervisorView orders={orders} setOrders={setOrders} screen="dashboard" />;
}
