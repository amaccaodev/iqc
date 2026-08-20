import { QCView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function QCInspectPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return <QCView user={user as User} orders={orders} setOrders={setOrders} screen="inspect" />;
}
