import { DirectorView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";

export default function DirectorApprovalsPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <DirectorView user={user as User} orders={orders} setOrders={setOrders} screen="approvals" />
  );
}
