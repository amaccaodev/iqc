import type { ProductionOrder } from "../../../shared/src/types/index.js";
import { BaseRepository } from "../core/BaseRepository.js";
import { SEED_ORDERS } from "../data/seed.js";

export class OrderRepository extends BaseRepository<ProductionOrder> {
  constructor() {
    super(SEED_ORDERS);
  }

  findByOrderNo(orderNo: string): ProductionOrder | undefined {
    return this.findAll().find((o) => o.orderNo === orderNo);
  }
}

export const orderRepository = new OrderRepository();
