import type { BOMItem, Bom, BomProcess, ProcessStage, ProductionOrder, SemiProduct } from "../types/index.js";
import { TEAMS, teamDisplayName } from "../constants/teams.js";
import { measurementSpecsToMaterialSpecs } from "../utils/specValidation.js";
import {
  DMKT_BOM_PROCESSES,
  DMKT_BOMS,
  DMKT_PRODUCTS,
  DMKT_SEMI,
} from "./dmktCatalog.js";

function teamToStage(teamId?: string): ProcessStage | undefined {
  if (teamId === "t_hot") return "hot_forge";
  if (teamId === "t_auto") return "auto";
  if (teamId === "t_asm") return "assembly";
  return undefined;
}

function processesOf(bomId: string, all: BomProcess[]): BomProcess[] {
  return all.filter((p) => p.bomId === bomId).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Một linh kiện → 1 quy trình (BOM đầu tiên) → từng bước = 1 job runtime. */
export function jobsFromCatalogPart(
  sp: SemiProduct,
  qty: number,
  opts: {
    boms: Bom[];
    processes: BomProcess[];
    assignTeams?: boolean;
    recipeId?: string;
  },
): BOMItem[] {
  const recipes = opts.boms.filter((b) => b.semiProductId === sp.id);
  const recipe = (opts.recipeId ? recipes.find((b) => b.id === opts.recipeId) : undefined) ?? recipes[0];
  if (!recipe) return [];
  const steps = processesOf(recipe.id, opts.processes);
  const materialSpecs = measurementSpecsToMaterialSpecs(sp.measurementSpecs ?? {});
  const specCols = materialSpecs.map((s) => s.label);
  while (specCols.length < 11) specCols.push("");

  return steps.map((step, idx) => {
    const seq = step.sortOrder || idx + 1;
    const teamId = step.productionTeamId || "";
    const assigned = Boolean(opts.assignTeams && teamId);
    return {
      id: `b-${sp.id}-${seq}`,
      bomCode: "",
      partCode: sp.code,
      partName: sp.name,
      partGroup: sp.name,
      processSeq: seq,
      rawMaterial: sp.name,
      machine: "",
      process: step.name,
      catalogBomId: recipe.id,
      catalogBomName: recipe.name,
      catalogProcessId: step.id,
      targetQty: qty,
      passQty: 0,
      failQty: 0,
      assignedTeamId: assigned ? teamId : "",
      assignedTeamName: assigned ? teamDisplayName(teamId) || TEAMS.find((t) => t.id === teamId)?.name || "" : "",
      assignedWorkers: [],
      workerAssignments: [],
      processStage: teamToStage(teamId),
      status: assigned ? "assigned" : "unassigned",
      quota: step.quotaPerShift ? String(step.quotaPerShift) : undefined,
      specCols,
      materialSpecs: materialSpecs.length ? materialSpecs : undefined,
      techNote: "",
      workerEntries: [],
      semiProductId: sp.id,
      attachments: [],
    } satisfies BOMItem;
  });
}

export function jobsForProduct(
  productId: string,
  qty: number,
  opts?: { assignTeams?: boolean },
): BOMItem[] {
  const semis = DMKT_SEMI.filter((s) => s.productId === productId && s.active !== false);
  return semis.flatMap((sp) =>
    jobsFromCatalogPart(sp, qty, {
      boms: DMKT_BOMS,
      processes: DMKT_BOM_PROCESSES,
      assignTeams: opts?.assignTeams,
    }),
  );
}

function withCodes(orderNo: string, jobs: BOMItem[]): BOMItem[] {
  const base = orderNo.replace(/-/g, "");
  return jobs.map((b, i) => ({
    ...b,
    bomCode: b.bomCode || `BOM-${base}-${String(i + 1).padStart(3, "0")}`,
  }));
}

/** Lệnh demo sạch: van góc ABS (7 linh kiện) + lệnh chờ duyệt. */
export function buildDemoCatalogOrders(): ProductionOrder[] {
  const p1 = DMKT_PRODUCTS.find((p) => p.id === "p1");
  if (!p1) return [];

  const inProgressJobs = withCodes("LSX-2026-001", jobsForProduct("p1", 100, { assignTeams: true })).map((b) => {
    if (b.id === "b-sp-novo-vg-15-01-1") {
      return {
        ...b,
        machine: "CP",
        status: "in_progress" as const,
        assignedWorkers: ["Cường 2T3"],
        workerAssignments: [{ workerId: "u6", workerName: "Cường 2T3", machineName: "CP" }],
        passQty: 40,
      };
    }
    if (b.id === "b-sp-novo-vg-15-02-1") {
      return {
        ...b,
        machine: "CP",
        status: "in_progress" as const,
        assignedWorkers: ["Nga 3/43"],
        workerAssignments: [{ workerId: "u7", workerName: "Nga 3/43", machineName: "CP" }],
        passQty: 40,
      };
    }
    return b;
  });

  const pendingJobs = withCodes("LSX-2026-002", jobsForProduct("p1", 100, { assignTeams: false }));

  return [
    {
      id: "o1",
      orderNo: "LSX-2026-001",
      productId: "p1",
      productCode: p1.code,
      productLine: p1.name,
      customer: "Nội bộ",
      targetQty: 100,
      createdBy: "Nguyễn Văn An",
      createdAt: "04/09/2026",
      deadline: "2026-09-20",
      priority: "high",
      status: "in_progress",
      pendingApproval: false,
      shift: "day",
      note: "Lệnh demo — 7 linh kiện, mỗi linh kiện 1 quy trình (nhiều bước).",
      attachments: [],
      boms: inProgressJobs,
    },
    {
      id: "o-pending",
      orderNo: "LSX-2026-002",
      productId: "p1",
      productCode: p1.code,
      productLine: p1.name,
      customer: "Nội bộ",
      targetQty: 100,
      createdBy: "Nguyễn Văn An",
      createdAt: "04/09/2026",
      deadline: "2026-09-25",
      priority: "normal",
      status: "pending_approval",
      pendingApproval: true,
      shift: "day",
      note: "Chờ Quản đốc duyệt BOM / quy trình.",
      attachments: [],
      boms: pendingJobs,
    },
  ];
}
