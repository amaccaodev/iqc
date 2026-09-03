import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isBomProcessUnlocked } from "@shared/utils/bomProcess";
import WorkerJobsList from "../../components/worker/WorkerJobsList";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";
import SalaryDashboard from "../../components/salary/SalaryDashboard";

export default function WorkerDashboardPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const propose = searchParams.get("propose");
    if (propose !== "change_machine" && propose !== "add_machine") return;
    for (const o of orders) {
      for (const b of o.boms) {
        if (!b.assignedWorkers.includes(user.name)) continue;
        if (!isBomProcessUnlocked(o, b)) continue;
        navigate(`/worker/task/${o.id}/${b.id}?propose=${propose}`, { replace: true });
        return;
      }
    }
  }, [orders, searchParams, user.name, navigate]);

  return (
    <div>
      <SalaryDashboard workerId={user.id} title="Lương của tôi (sau khi Quản đốc duyệt)" />
      <WorkerJobsList user={user} orders={orders} />
    </div>
  );
}
