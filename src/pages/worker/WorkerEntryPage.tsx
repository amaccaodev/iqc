import WorkerJobsList from "../../components/worker/WorkerJobsList";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";

export default function WorkerEntryPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  return <WorkerJobsList user={user} orders={orders} />;
}
