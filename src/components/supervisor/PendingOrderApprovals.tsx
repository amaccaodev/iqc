import type { ProductionOrder } from "@shared/types";
import { orderNeedsSupervisorCreateApproval } from "@shared/utils/orderHelpers";
import { Btn, Card } from "../ui";
import { orderApi } from "../../services/api/OrderApiService";
import { toast } from "../../hooks/useToast";

interface PendingOrderApprovalsProps {
  orders: ProductionOrder[];
}

export default function PendingOrderApprovals({ orders }: PendingOrderApprovalsProps) {
  const pending = orders.filter(orderNeedsSupervisorCreateApproval);
  if (!pending.length) return null;

  const review = async (id: string, approve: boolean) => {
    try {
      if (approve) await orderApi.approve(id);
      else await orderApi.reject(id);
      toast.success(approve ? "Đã phê duyệt lệnh SX" : "Đã từ chối lệnh");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="mb-5">
      <h3 className="font-display font-700 text-base lg:text-lg mb-3 flex items-center gap-2">
        <i className="fas fa-clipboard-check text-yellow-500" /> Lệnh chờ phê duyệt BOM / quy trình
      </h3>
      {pending.map((o) => (
        <Card key={o.id} cls="p-4 mb-2 border-l-4 border-yellow-400">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="font-semibold text-sm">
                {o.orderNo} – {o.productLine}
              </div>
              <div className="text-xs text-muted mt-1">
                GĐ {o.createdBy} gửi {o.boms.length} quy trình đo · hạn {o.deadline || "—"}
              </div>
              <ul className="mt-1.5 text-xs text-primary space-y-0.5">
                {o.boms.map((b) => (
                  <li key={b.id}>
                    {b.partName}
                    {b.process ? ` · ${b.process}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Btn size="sm" variant="success" onClick={() => void review(o.id, true)}>
                <i className="fas fa-check" /> Duyệt
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => void review(o.id, false)}>
                <i className="fas fa-times" /> Từ chối
              </Btn>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
