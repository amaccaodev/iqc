import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { BOMItem, ProductionOrder } from "@shared/types";
import { orderApi } from "../services/api/OrderApiService";

/** Mở đúng lệnh / linh kiện từ `?orderId=` `&bomId=` (thông báo, deep link). */
export function useOrderDeepLink(orders: ProductionOrder[]): {
  orderId: string;
  bomId: string;
  order: ProductionOrder | null;
  bom: BOMItem | null;
} {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const bomId = searchParams.get("bomId") || "";
  const [order, setOrder] = useState<ProductionOrder | null>(null);
  const [bom, setBom] = useState<BOMItem | null>(null);
  const token = useRef("");

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setBom(null);
      token.current = "";
      return;
    }
    const apply = (o: ProductionOrder) => {
      setOrder(o);
      setBom(bomId ? (o.boms.find((b) => b.id === bomId) ?? null) : null);
    };
    const local = orders.find((o) => o.id === orderId);
    if (local) {
      apply(local);
      return;
    }
    const key = `${orderId}/${bomId}`;
    if (token.current === key) return;
    token.current = key;
    let cancelled = false;
    void orderApi
      .getById(orderId)
      .then((o) => {
        if (!cancelled) apply(o);
      })
      .catch(() => {
        if (!cancelled) {
          setOrder(null);
          setBom(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, bomId, orders]);

  return { orderId, bomId, order, bom };
}
