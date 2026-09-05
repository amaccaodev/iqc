import type { BOMItem, ProductionOrder } from "../types/index.js";

/** Gom job runtime theo linh kiện (không theo từng bước quy trình). */
export function orderPartKey(
  b: Pick<BOMItem, "semiProductId" | "partGroup" | "partName" | "partCode" | "id">,
): string {
  return (b.semiProductId || b.partGroup || b.partName || b.partCode || b.id).trim();
}

export function bomStepLabel(b: Pick<BOMItem, "process">): string {
  const raw = (b.process || "").replace(/^\d+\s*[:.]\s*/, "").trim();
  return raw || "—";
}

export type OrderJobRecipe = {
  id: string;
  name: string;
  steps: BOMItem[];
};

export type OrderPartGroup = {
  key: string;
  partName: string;
  partCode: string;
  semiProductId?: string;
  jobs: BOMItem[];
  recipes: OrderJobRecipe[];
  sxQty: number;
  needQty: number;
  stockUseQty: number;
  stockLeftQty: number;
  useFromStock: boolean;
};

export function groupOrderJobsByPart(jobs: BOMItem[]): OrderPartGroup[] {
  const map = new Map<string, BOMItem[]>();
  for (const b of jobs) {
    const key = orderPartKey(b);
    const list = map.get(key) ?? [];
    list.push(b);
    map.set(key, list);
  }
  return [...map.entries()].map(([key, partJobs]) => {
    const first = partJobs[0];
    const recipeMap = new Map<string, BOMItem[]>();
    for (const j of partJobs) {
      const rk = j.catalogBomId || "_one";
      const list = recipeMap.get(rk) ?? [];
      list.push(j);
      recipeMap.set(rk, list);
    }
    const recipes: OrderJobRecipe[] = [...recipeMap.entries()].map(([id, steps]) => ({
      id,
      name: steps[0]?.catalogBomName || "Quy trình",
      steps: [...steps].sort((a, b) => (a.processSeq ?? 0) - (b.processSeq ?? 0)),
    }));
    const sxQty = Math.max(0, ...partJobs.map((j) => j.targetQty || 0));
    const stockUseQty = partJobs.reduce((s, j) => Math.max(s, j.stockUseQty || 0), 0);
    return {
      key,
      partName: first.partName,
      partCode: first.partCode || first.bomCode,
      semiProductId: first.semiProductId,
      jobs: partJobs,
      recipes,
      sxQty,
      stockUseQty,
      stockLeftQty: partJobs.reduce((s, j) => Math.max(s, j.stockLeftQty ?? 0), 0),
      useFromStock: partJobs.some((j) => j.useFromStock && (j.stockUseQty ?? 0) > 0),
      needQty: sxQty + stockUseQty,
    };
  });
}

export function countOrderParts(order: Pick<ProductionOrder, "boms">): number {
  return groupOrderJobsByPart(order.boms ?? []).length;
}

export function partProcessChain(part: OrderPartGroup): string {
  const recipe = part.recipes[0];
  const steps = recipe?.steps ?? part.jobs;
  return steps.map(bomStepLabel).filter((s) => s !== "—").join(" → ");
}
