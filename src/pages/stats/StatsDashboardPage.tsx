import { StatsView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";

export default function StatsDashboardPage() {
  const { orders } = useOrders();
  return <StatsView orders={orders} screen="dashboard" />;
}
