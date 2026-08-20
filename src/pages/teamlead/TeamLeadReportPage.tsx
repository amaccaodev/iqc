import { TeamLeadView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function TeamLeadReportPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <TeamLeadView user={user as User} orders={orders} setOrders={setOrders} screen="report" />
  );
}
