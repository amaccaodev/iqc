import { SupervisorView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";

export default function SupervisorOrdersPage() {
  const { orders, setOrders } = useOrders();
  return <SupervisorView orders={orders} setOrders={setOrders} screen="orders" />;
}
