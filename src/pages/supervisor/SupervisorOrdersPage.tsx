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
      <input
        className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-4 bg-input"
        placeholder="Tìm số lệnh, sản phẩm, khách hàng…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
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
