import WorkerJobsList, {
  WorkerOrderPartsView,
  WorkerPartStepsView,
} from "../../components/worker/WorkerJobsList";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";

export default function WorkerEntryPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  return <WorkerJobsList user={user} orders={orders} />;
}

export function WorkerOrderPartsPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  return <WorkerOrderPartsView user={user} orders={orders} />;
}

export function WorkerPartStepsPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  return <WorkerPartStepsView user={user} orders={orders} />;
}
