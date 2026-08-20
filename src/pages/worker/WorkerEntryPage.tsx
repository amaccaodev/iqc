import { WorkerView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function WorkerEntryPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return <WorkerView user={user as User} orders={orders} setOrders={setOrders} screen="entry" />;
}
