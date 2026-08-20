import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ProductionOrder } from "@shared/types";
import { orderApi } from "../services/api/OrderApiService";

interface OrdersContextValue {
  orders: ProductionOrder[];
  setOrders: (orders: ProductionOrder[]) => void;
  refreshOrders: () => Promise<void>;
  loading: boolean;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrdersState] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await orderApi.getAll();
      setOrdersState(Array.isArray(data) ? data : []);
    } catch {
      setOrdersState([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshOrders();
    return orderApi.subscribe(setOrdersState);
  }, [refreshOrders]);

  const setOrders = useCallback((next: ProductionOrder[]) => {
    setOrdersState(next);
    void orderApi.setOrdersLocally(() => next);
  }, []);

  const value = useMemo(
    () => ({ orders, setOrders, refreshOrders, loading }),
    [orders, setOrders, refreshOrders, loading],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
