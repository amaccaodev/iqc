import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { SupervisorView } from "../../_AppLegacy";
import { useOrders } from "../../hooks/useOrders";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import PendingOrderApprovals from "../../components/supervisor/PendingOrderApprovals";
import { orderApi } from "../../services/api/OrderApiService";

export default function SupervisorOrdersPage() {
  const { orders, setOrders } = useOrders();
  const fetchOrders = useStableFetch((query) => orderApi.list(query));
  const { items, total, page, pageSize, setPage, setPageSize, q, setQ } = usePagedList({
    fetchPage: fetchOrders,
    pageSize: LIST_UI_PAGE_SIZE,
  });

  return (
    <div>
      <PendingOrderApprovals orders={orders} />
      <div className="relative mb-4">
        <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
        <input
          className="w-full pl-10 pr-3 py-2.5 border border-border rounded-xl text-sm bg-input focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Tìm số lệnh, sản phẩm, khách hàng…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <SupervisorView
        orders={items}
        setOrders={setOrders}
        screen="orders"
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
