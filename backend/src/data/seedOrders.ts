import type { ProductionOrder } from "../../../shared/src/types/index.js";
import { buildDemoCatalogOrders } from "../../../shared/src/data/buildCatalogOrders.js";

export const SEED_ORDERS: ProductionOrder[] = buildDemoCatalogOrders();
