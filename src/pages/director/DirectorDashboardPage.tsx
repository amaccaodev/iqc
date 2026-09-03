import { useState } from "react";
import { DirectorView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";
import { Btn } from "../../components/ui";
import DirectorCreateOrderForm from "../../components/director/DirectorCreateOrderForm";

export default function DirectorDashboardPage() {
  const user = useRoleUser();
  const { orders, setOrders, refreshOrders } = useOrders();
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 lg:mb-6">
          <h2 className="font-display font-800 text-lg sm:text-xl lg:text-2xl">Tạo lệnh sản xuất</h2>
          <Btn cls="bg-slate-500 w-full sm:w-auto shrink-0 justify-center" onClick={() => setCreating(false)}>
            Quay lại
          </Btn>
        </div>
        <DirectorCreateOrderForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            void refreshOrders();
            setCreating(false);
          }}
        />
      </div>
    );
  }

  return (
    <DirectorView
      user={user as User}
      orders={orders}
      setOrders={setOrders}
      screen="dashboard"
      onCreateOrder={() => setCreating(true)}
    />
  );
}
