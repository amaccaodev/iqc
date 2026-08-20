import type { ProductionOrder } from "../../../shared/src/types/index.js";
import { SEED_ORDERS } from "../data/seed.js";

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

class OrderMemoryStore {
  private orders: ProductionOrder[] = clone(SEED_ORDERS);

  all() {
    return this.orders;
  }

  findById(id: string) {
    return this.orders.find((o) => o.id === id) ?? null;
  }

  replace(next: ProductionOrder[]) {
    this.orders = next;
  }
}

export const orderMemoryStore = new OrderMemoryStore();
