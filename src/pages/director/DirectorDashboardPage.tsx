import { DirectorView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function DirectorDashboardPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <DirectorView
      user={user as User}
      orders={orders}
      setOrders={setOrders}
      screen="dashboard"
    />
  );
}
