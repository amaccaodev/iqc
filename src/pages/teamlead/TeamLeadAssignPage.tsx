import { TeamLeadView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";
import { useUsers } from "../../hooks/useUsers";

export default function TeamLeadAssignPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  const { users } = useUsers();
  const teamWorkers = users.filter(
    (u) => u.role === "worker" && u.teamId === user.teamId && u.active,
  ) as User[];

  return (
    <TeamLeadView
      user={user as User}
      orders={orders}
      setOrders={setOrders}
      teamWorkers={teamWorkers}
      screen="assign"
    />
  );
}
