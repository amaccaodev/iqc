import WorkerJobsList from "../../components/worker/WorkerJobsList";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";

export default function WorkerEntryPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  return <WorkerJobsList user={user} orders={orders} />;
}
