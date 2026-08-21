import { useCallback, useEffect, useState } from "react";
import type { MachineChangeRequest } from "@shared/types";
import { catalogApi } from "../../services/api/CatalogApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { Btn, Card } from "../../components/ui";

export default function MachineApprovalsPage() {
  const user = useRoleUser();
  const target = user.role === "mechanic" ? "mechanic" : "teamlead";
  const [items, setItems] = useState<MachineChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await catalogApi.listChangeRequests({ target });
      setItems(all);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [target]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, approved: boolean) => {
    try {
      await catalogApi.reviewChangeRequest(id, {
        approved,
        reviewedBy: user.id,
        reviewedName: user.name,
      });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-1">Phê duyệt đổi máy</h2>
      <p className="text-sm text-muted mb-5">
        Yêu cầu gửi tới {user.role === "mechanic" ? "Cơ điện" : "Tổ trưởng"}
      </p>

      {loading ? (
        <div className="text-muted">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="text-muted">Chưa có yêu cầu</div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <Card key={r.id} cls="p-4">
              <div className="flex justify-between gap-2 mb-2">
                <div className="font-semibold text-sm">{r.requestedName}</div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === "pending"
                      ? "bg-amber-100 text-amber-800"
                      : r.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {r.status === "pending" ? "Chờ duyệt" : r.status === "approved" ? "Đã duyệt" : "Từ chối"}
                </span>
              </div>
              <div className="text-sm text-muted mb-2">{r.reason}</div>
              <div className="text-xs text-muted-foreground mb-3">
                Máy: {r.fromMachine || "—"}
                {r.toMachine ? ` → ${r.toMachine}` : ""} · {new Date(r.requestedAt).toLocaleString("vi-VN")}
              </div>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Btn cls="bg-green-600" onClick={() => void review(r.id, true)}>
                    Duyệt
                  </Btn>
                  <Btn cls="bg-red-600" onClick={() => void review(r.id, false)}>
                    Từ chối
                  </Btn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
