import { useState } from "react";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { DirectorView, type User } from "../../_AppLegacy";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useOrders } from "../../hooks/useOrders";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { Btn } from "../../components/ui";
import DirectorCreateOrderForm from "../../components/director/DirectorCreateOrderForm";
import { orderApi } from "../../services/api/OrderApiService";

export default function DirectorOrdersPage() {
  const user = useRoleUser();
  const { setOrders, refreshOrders } = useOrders();
  const [creating, setCreating] = useState(false);
  const fetchOrders = useStableFetch((query) => orderApi.list(query));
  const {
    items,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    q,
    setQ,
    refresh,
  } = usePagedList({
    fetchPage: fetchOrders,
    pageSize: LIST_UI_PAGE_SIZE,
    enabled: !creating,
  });

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
            refresh();
            setCreating(false);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <input
        className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-4 bg-input"
        placeholder="Tìm số lệnh, sản phẩm, khách hàng…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <DirectorView
        user={user as User}
        orders={items}
        setOrders={setOrders}
        screen="orders"
        onCreateOrder={() => setCreating(true)}
        orderPaging={{
          page,
          pageSize,
          total,
          onPage: setPage,
          onPageSize: setPageSize,
        }}
      />
    </div>
  );
}
