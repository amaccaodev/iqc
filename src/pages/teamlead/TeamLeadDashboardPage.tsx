import { TeamLeadView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";
import ShiftCloseQueue from "../../components/salary/ShiftCloseQueue";

export default function TeamLeadDashboardPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <div>
      <ShiftCloseQueue stage="teamlead" title="Kiểm tra chốt ca công nhân" />
      <TeamLeadView user={user as User} orders={orders} setOrders={setOrders} screen="dashboard" />
    </div>
  );
}
