import { StatsView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";

export default function StatsReportsPage() {
  const { orders } = useOrders();
  return <StatsView orders={orders} screen="reports" />;
}
