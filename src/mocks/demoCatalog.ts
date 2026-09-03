import type { ProductStructureLine } from "@shared/types";
import {
  DMKT_BOM_PROCESSES,
  DMKT_BOMS,
  DMKT_MACHINES,
  DMKT_PRODUCTS,
  DMKT_SEMI,
  DMKT_WAREHOUSE,
} from "@shared/data/dmktCatalog";
import {
  SAMPLE_BOM_PROCESSES,
  SAMPLE_BOMS,
  SAMPLE_MACHINES,
  SAMPLE_PRODUCTS,
  SAMPLE_SEMI,
  SAMPLE_WAREHOUSE,
} from "@shared/data/sampleInspection";

/** Catalog ĐMKT + phiếu kiểm tra mẫu — VITE_DEMO_MODE / GitHub Pages */
export const DEMO_PRODUCTS = [...SAMPLE_PRODUCTS, ...DMKT_PRODUCTS];
export const DEMO_SEMI = [...SAMPLE_SEMI, ...DMKT_SEMI];
export const DEMO_BOMS = [...SAMPLE_BOMS, ...DMKT_BOMS];
export const DEMO_BOM_PROCESSES = [...SAMPLE_BOM_PROCESSES, ...DMKT_BOM_PROCESSES];
export const DEMO_MACHINES = [...SAMPLE_MACHINES, ...DMKT_MACHINES];
export const DEMO_WAREHOUSE = [...SAMPLE_WAREHOUSE, ...DMKT_WAREHOUSE];

function processesOf(bomId: string) {
  return DEMO_BOM_PROCESSES.filter((p) => p.bomId === bomId).sort((a, b) => a.sortOrder - b.sortOrder);
}

export const DEMO_PRODUCT_BOMS: ProductStructureLine[] = DEMO_SEMI.filter((s) => s.productId === "p1").map(
  (s) => {
    const boms = DEMO_BOMS.filter((b) => b.semiProductId === s.id).map((b) => ({
      ...b,
      processes: processesOf(b.id),
    }));
    return {
      semiProductId: s.id,
      qtyPerUnit: 1,
      stockQty: DEMO_WAREHOUSE.find((w) => w.itemId === s.id)?.qty ?? 0,
      semiProduct: s,
      boms,
    };
  },
);
