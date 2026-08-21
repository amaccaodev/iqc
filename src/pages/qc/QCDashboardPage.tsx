import { QCView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";
import ShiftCloseQueue from "../../components/salary/ShiftCloseQueue";

export default function QCDashboardPage() {
  const user = useRoleUser();
  const { orders, setOrders } = useOrders();
  return (
    <div>
      <ShiftCloseQueue stage="qc" title="QC chốt ca" />
      <QCView user={user as User} orders={orders} setOrders={setOrders} screen="dashboard" />
    </div>
  );
}
