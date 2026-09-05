import { useEffect, useMemo, useState } from "react";
import type { Attachment, ProductionOrder } from "@shared/types";
import { orderNeedsSupervisorCreateApproval } from "@shared/utils/orderHelpers";
import { bomStepLabel, groupOrderJobsByPart } from "@shared/utils/orderParts";
import { attachmentDataUrl } from "@shared/utils/attachments";
import { Btn, Card, Modal } from "../ui";
import FileSlideshow from "../files/FileSlideshow";
import { orderApi } from "../../services/api/OrderApiService";
import { catalogApi } from "../../services/api/CatalogApiService";
import { toast } from "../../hooks/useToast";

type PartGroup = ReturnType<typeof groupOrderJobsByPart>[number] & {
  drawings: Attachment[];
};

interface PendingOrderApprovalsProps {
  orders: ProductionOrder[];
}

function DrawingThumb({ files }: { files: Attachment[] }) {
  const img = files.find((f) => f.type === "image");
  const src = img ? attachmentDataUrl(img) : undefined;
  if (src) {
    return (
      <img
        src={src}
        alt={img?.name ?? "Bản vẽ"}
        className="w-14 h-14 rounded-lg object-cover border border-border bg-surface shrink-0"
      />
    );
  }
  return (
    <div className="w-14 h-14 rounded-lg border border-border bg-surface flex items-center justify-center text-muted shrink-0">
      <i className={`fas ${files.length ? "fa-file" : "fa-image"} text-sm opacity-50`} />
    </div>
  );
}

export default function PendingOrderApprovals({ orders }: PendingOrderApprovalsProps) {
  const pending = orders.filter(orderNeedsSupervisorCreateApproval);
  const [detail, setDetail] = useState<{ order: ProductionOrder; part: PartGroup } | null>(null);
  const [catalogDrawings, setCatalogDrawings] = useState<Record<string, Attachment[]>>({});

  const semiIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of pending) {
      for (const b of o.boms) {
        if (b.semiProductId) ids.add(b.semiProductId);
      }
    }
    return [...ids];
  }, [pending]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      semiIds.map(async (id) => {
        try {
          const list = await catalogApi.listSemiAttachments(id);
          return [id, Array.isArray(list) ? list : []] as const;
        } catch {
          return [id, []] as const;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      setCatalogDrawings(Object.fromEntries(rows));
    });
    return () => {
      cancelled = true;
    };
  }, [semiIds.join("|")]);

  const withDrawings = (order: ProductionOrder): PartGroup[] =>
    groupOrderJobsByPart(order.boms).map((p) => {
      const fromJobs = p.jobs.flatMap((j) => j.attachments ?? []);
      const fromCatalog = p.semiProductId ? (catalogDrawings[p.semiProductId] ?? []) : [];
      const drawings = fromJobs.length ? fromJobs : fromCatalog;
      return { ...p, drawings };
    });

  const review = async (id: string, approve: boolean) => {
    try {
      if (approve) await orderApi.approve(id);
      else await orderApi.reject(id);
      toast.success(approve ? "Đã phê duyệt lệnh SX" : "Đã từ chối lệnh");
      setDetail(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!pending.length) return null;

  return (
    <div className="mb-5">
      <h3 className="font-display font-700 text-base lg:text-lg mb-3 flex items-center gap-2">
        <i className="fas fa-clipboard-check text-yellow-500" /> Lệnh chờ phê duyệt BOM / quy trình
      </h3>
      {pending.map((o) => {
        const parts = withDrawings(o);
        return (
          <Card key={o.id} cls="p-4 mb-3 border-l-4 border-yellow-400">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-semibold text-sm">
                  {o.orderNo} – {o.productLine}
                </div>
                <div className="text-xs text-muted mt-1">
                  GĐ {o.createdBy} · SL thành phẩm {o.targetQty.toLocaleString("vi-VN")}
                  {o.productCode ? ` · ${o.productCode}` : ""} · hạn {o.deadline || "—"}
                </div>
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

            <div className="space-y-2">
              {parts.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className="w-full text-left rounded-xl border border-border bg-surface/60 p-2.5 flex gap-3 cursor-pointer hover:bg-surface"
                  onClick={() => setDetail({ order: o, part: p })}
                >
                  <DrawingThumb files={p.drawings} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">{p.partName}</div>
                    <div className="text-[11px] text-muted font-mono">{p.partCode}</div>
                    <div className="text-[11px] mt-1">
                      <span className="text-muted">Cần {p.needQty.toLocaleString("vi-VN")}</span>
                      {p.useFromStock ? (
                        <>
                          <span className="text-foreground font-semibold ml-2">
                            · Dùng kho {p.stockUseQty.toLocaleString("vi-VN")}
                          </span>
                          <span className="text-foreground font-semibold ml-2">
                            · Còn lại {p.stockLeftQty.toLocaleString("vi-VN")}
                          </span>
                        </>
                      ) : null}
                      <span className="text-foreground font-semibold ml-2">
                        · SX {p.sxQty.toLocaleString("vi-VN")}
                      </span>
                      {p.sxQty <= 0 && p.useFromStock ? (
                        <span className="text-emerald-700 font-semibold ml-2">— đủ kho</span>
                      ) : null}
                    </div>
                    {p.recipes.map((r) => (
                      <div key={r.id} className="text-[11px] text-primary mt-0.5">
                        {p.recipes.length > 1 || r.name !== "Quy trình" ? (
                          <span className="font-semibold">{r.name}: </span>
                        ) : null}
                        {r.steps.map(bomStepLabel).join(" → ")}
                      </div>
                    ))}
                  </div>
                  <span className="self-center text-[11px] font-semibold text-primary shrink-0">
                    Chi tiết
                  </span>
                </button>
              ))}
            </div>
          </Card>
        );
      })}

      {detail ? (
        <Modal title={detail.part.partName} onClose={() => setDetail(null)} size="lg">
          <div className="space-y-4">
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted">Thành phẩm: </span>
                <span className="font-semibold">{detail.order.productLine}</span>
              </div>
              <div className="text-xs text-muted font-mono">
                {detail.order.orderNo}
                {detail.order.productCode ? ` · ${detail.order.productCode}` : ""}
                {detail.part.partCode ? ` · ${detail.part.partCode}` : ""}
              </div>
              <div className="flex flex-wrap gap-3 text-sm pt-1">
                <span>
                  SL thành phẩm{" "}
                  <strong>{detail.order.targetQty.toLocaleString("vi-VN")}</strong>
                </span>
                <span>
                  Cần <strong>{detail.part.needQty.toLocaleString("vi-VN")}</strong>
                </span>
                {detail.part.useFromStock ? (
                  <>
                    <span>
                      Dùng kho <strong>{detail.part.stockUseQty.toLocaleString("vi-VN")}</strong>
                    </span>
                    <span>
                      Còn lại <strong>{detail.part.stockLeftQty.toLocaleString("vi-VN")}</strong>
                    </span>
                  </>
                ) : null}
                <span>
                  SX <strong>{detail.part.sxQty.toLocaleString("vi-VN")}</strong>
                </span>
              </div>
            </div>

            <FileSlideshow files={detail.part.drawings} title="Bản vẽ linh kiện" />

            <div>
              <div className="text-xs font-semibold text-muted mb-2">Công đoạn</div>
              {detail.part.recipes.map((r) => (
                <div key={r.id} className="mb-3">
                  <div className="text-sm font-semibold mb-1">{r.name}</div>
                  <ol className="list-decimal pl-5 space-y-1 text-sm">
                    {r.steps.map((s) => (
                      <li key={s.id}>
                        {bomStepLabel(s)}
                        {s.machine ? <span className="text-muted text-xs ml-2">· {s.machine}</span> : null}
                        {s.targetQty > 0 ? (
                          <span className="text-muted text-xs ml-2">
                            · SL {s.targetQty.toLocaleString("vi-VN")}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
