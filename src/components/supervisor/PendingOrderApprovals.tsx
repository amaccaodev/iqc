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

function QtyBox({ label, value, tone = "primary" }: { label: string; value: number; tone?: "primary" | "amber" }) {
  const toneCls =
    tone === "amber"
      ? "bg-amber-50 border-amber-300 text-amber-950 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-100"
      : "bg-primary/10 border-primary/40 text-primary";
  return (
    <div className={`rounded-xl border-2 px-3 py-2 min-w-[7.5rem] ${toneCls}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">{label}</div>
      <div className="text-2xl font-display font-800 tabular-nums leading-tight mt-0.5">
        {value.toLocaleString("vi-VN")}
      </div>
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
      toast.success(approve ? "Đã nhận sản xuất" : "Đã từ chối lệnh");
      setDetail(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!pending.length) return null;

  return (
    <div className="mb-5">
      <h3 className="font-display font-700 text-base lg:text-lg mb-3 flex items-center gap-2">
        <i className="fas fa-industry text-yellow-500" /> Nhận sản xuất
      </h3>
      {pending.map((o) => {
        const parts = withDrawings(o);
        return (
          <Card key={o.id} cls="p-4 mb-3 border-l-4 border-yellow-400">
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div className="min-w-0">
                <div className="font-semibold text-base">
                  {o.orderNo} – {o.productLine}
                </div>
                <div className="text-sm text-muted mt-1">
                  GĐ {o.createdBy}
                  {o.productCode ? ` · ${o.productCode}` : ""} · hạn {o.deadline || "—"}
                </div>
                <div className="mt-2">
                  <QtyBox label="SL thành phẩm yêu cầu" value={o.targetQty} tone="amber" />
                </div>
              </div>
              <div className="flex gap-2">
                <Btn size="sm" variant="success" onClick={() => void review(o.id, true)}>
                  <i className="fas fa-check" /> Nhận sản xuất
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => void review(o.id, false)}>
                  <i className="fas fa-times" /> Từ chối
                </Btn>
              </div>
            </div>

            <div className="space-y-2">
              {parts.map((p) => {
                const bomLabel =
                  p.recipes.map((r) => r.name).filter((n) => n && n !== "Quy trình").join(" · ") ||
                  p.partName;
                return (
                  <button
                    key={p.key}
                    type="button"
                    className="w-full text-left rounded-xl border border-border bg-surface/60 p-3 flex gap-3 cursor-pointer hover:bg-surface"
                    onClick={() => setDetail({ order: o, part: p })}
                  >
                    <DrawingThumb files={p.drawings} />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wide text-muted">
                          Tên BOM / linh kiện
                        </div>
                        <div className="font-display font-700 text-base text-foreground leading-snug">
                          {p.partName}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-0.5">{bomLabel}</div>
                        <div className="text-[11px] text-muted font-mono">{p.partCode}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <QtyBox label="SL yêu cầu" value={p.needQty} tone="amber" />
                        <QtyBox label="SL cần SX" value={p.sxQty} />
                      </div>
                      {p.useFromStock ? (
                        <div className="text-xs text-muted">
                          Dùng kho {p.stockUseQty.toLocaleString("vi-VN")} · Còn lại{" "}
                          {p.stockLeftQty.toLocaleString("vi-VN")}
                          {p.sxQty <= 0 ? (
                            <span className="text-emerald-700 font-semibold ml-2">— đủ kho</span>
                          ) : null}
                        </div>
                      ) : null}
                      {p.recipes.map((r) => (
                        <div key={r.id} className="text-[11px] text-muted">
                          {r.steps.map(bomStepLabel).join(" → ")}
                        </div>
                      ))}
                    </div>
                    <span className="self-center text-[11px] font-semibold text-primary shrink-0">
                      Chi tiết
                    </span>
                  </button>
                );
              })}
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
                <span className="font-semibold text-base">{detail.order.productLine}</span>
              </div>
              <div className="text-xs text-muted font-mono">
                {detail.order.orderNo}
                {detail.order.productCode ? ` · ${detail.order.productCode}` : ""}
                {detail.part.partCode ? ` · ${detail.part.partCode}` : ""}
              </div>
              <div className="font-display font-700 text-lg text-primary mt-1">
                {detail.part.recipes.map((r) => r.name).filter(Boolean).join(" · ") ||
                  detail.part.partName}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <QtyBox label="SL thành phẩm yêu cầu" value={detail.order.targetQty} tone="amber" />
                <QtyBox label="SL yêu cầu (linh kiện)" value={detail.part.needQty} tone="amber" />
                <QtyBox label="SL cần SX" value={detail.part.sxQty} />
              </div>
            </div>

            <FileSlideshow files={detail.part.drawings} title="Bản vẽ linh kiện" />

            <div>
              <div className="text-xs font-semibold text-muted mb-2">Công đoạn</div>
              {detail.part.recipes.map((r) => (
                <div key={r.id} className="mb-3">
                  <div className="text-base font-semibold mb-1">{r.name}</div>
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

            <div className="flex gap-2 pt-2">
              <Btn
                variant="success"
                cls="flex-1 justify-center"
                onClick={() => void review(detail.order.id, true)}
              >
                <i className="fas fa-check" /> Nhận sản xuất
              </Btn>
              <Btn variant="secondary" onClick={() => void review(detail.order.id, false)}>
                Từ chối
              </Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
