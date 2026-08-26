import type { BOMItem, Machine, ProductionOrder, WorkerMachineAssignment } from "../types/index.js";
import { resolveBomTeamId, teamDisplayName, teamIdsMatch } from "../constants/teams.js";

/** Số đã làm của linh kiện: ưu tiên passQty, fallback số dòng đo đã nộp */
export function bomDoneQty(bom: BOMItem): number {
  const measured = bom.workerEntries.reduce((s, e) => s + e.rows.length, 0);
  return Math.max(bom.passQty || 0, measured);
}

export function bomProgressPct(bom: BOMItem): number {
  const target = bom.targetQty || 0;
  if (target <= 0) return 0;
  return Math.min(100, Math.round((bomDoneQty(bom) / target) * 100));
}

/**
 * Ước lượng thành phẩm lắp được = min(done của từng linh kiện / qtyPerUnit).
 * Khi mỗi BOM = 1 cái/SP thì = min(done).
 */
export function estimateFinishedQty(order: ProductionOrder): number {
  const parts = order.boms.filter((b) => !b.useFromStock || (b.targetQty ?? 0) > 0);
  if (!parts.length) return 0;
  return Math.min(
    ...parts.map((b) => {
      const need = Math.max(
        1,
        b.targetQty > 0 ? Math.ceil(b.targetQty / Math.max(1, order.targetQty || 1)) : 1,
      );
      return Math.floor(bomDoneQty(b) / need);
    }),
  );
}

export type PartProgressRow = {
  bom: BOMItem;
  done: number;
  target: number;
  fail: number;
  pct: number;
};

export function orderPartProgress(order: ProductionOrder): PartProgressRow[] {
  return order.boms.map((bom) => {
    const done = bomDoneQty(bom);
    const target = bom.targetQty || 0;
    return {
      bom,
      done,
      target,
      fail: bom.failQty || 0,
      pct: target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0,
    };
  });
}

/** Thời gian còn lại đến deadline (YYYY-MM-DD hoặc ISO) */
export function remainingUntilDeadline(
  deadline: string,
  now = Date.now(),
): {
  overdue: boolean;
  label: string;
  ms: number;
} {
  if (!deadline?.trim()) return { overdue: false, label: "—", ms: 0 };
  const raw = deadline.trim();
  const end = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59`)
    : new Date(raw);
  if (Number.isNaN(end.getTime())) return { overdue: false, label: "—", ms: 0 };
  const ms = end.getTime() - now;
  if (ms < 0) {
    const late = Math.abs(ms);
    const days = Math.floor(late / 86_400_000);
    const hours = Math.floor((late % 86_400_000) / 3_600_000);
    return {
      overdue: true,
      label: days > 0 ? `Quá hạn ${days} ngày ${hours} giờ` : `Quá hạn ${hours} giờ`,
      ms,
    };
  }
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const mins = Math.floor((ms % 3_600_000) / 60_000);
  if (days > 0) return { overdue: false, label: `${days} ngày ${hours} giờ`, ms };
  if (hours > 0) return { overdue: false, label: `${hours} giờ ${mins} phút`, ms };
  return { overdue: false, label: `${Math.max(1, mins)} phút`, ms };
}

export type MachineWorkRow = {
  machineKey: string;
  machineId?: string;
  machineName: string;
  /** Đã SX trên máy (tổng dòng đo / ước lượng theo CN gán máy) */
  doneQty: number;
  workers: Array<{ workerId: string; workerName: string; doneQty: number }>;
  /** Vị trí máy trên xưởng */
  location?: string;
  /** Tổ gắn với khu vực máy */
  teamId?: string;
  teamName?: string;
  /** Máy thuộc tổ khác với tổ phụ trách BOM */
  teamMismatch?: boolean;
};

function findCatalogMachine(
  catalog: Machine[] | undefined,
  machineId?: string,
  machineName?: string,
): Machine | undefined {
  if (!catalog?.length) return undefined;
  const name = (machineName ?? "").trim().toLowerCase();
  return catalog.find(
    (m) =>
      (machineId && m.id === machineId) ||
      (name && (m.name.toLowerCase() === name || m.code.toLowerCase() === name)),
  );
}

/** Gắn location / tổ từ danh mục máy; so khớp với tổ phụ trách BOM */
export function enrichMachineWorkRows(
  rows: MachineWorkRow[],
  catalog: Machine[] | undefined,
  bomTeamId?: string,
): MachineWorkRow[] {
  const bomTeam = bomTeamId || "";
  return rows.map((row) => {
    const m = findCatalogMachine(catalog, row.machineId, row.machineName);
    const teamId = m?.teamId || row.teamId || "";
    const teamName = teamDisplayName(teamId) || row.teamName;
    const teamMismatch = Boolean(
      bomTeam && teamId && !teamIdsMatch(bomTeam, teamId),
    );
    return {
      ...row,
      machineId: row.machineId || m?.id,
      machineName: row.machineName || m?.name || row.machineName,
      location: m?.location || row.location,
      teamId: teamId || undefined,
      teamName: teamName || undefined,
      teamMismatch,
    };
  });
}

/** Gom máy đang làm linh kiện: tên máy, đã SX, người được assign */
export function bomMachineWorkRows(
  bom: BOMItem,
  catalog?: Machine[],
): MachineWorkRow[] {
  const bomTeamId = resolveBomTeamId(bom);
  const assignments: WorkerMachineAssignment[] =
    bom.workerAssignments && bom.workerAssignments.length > 0
      ? bom.workerAssignments
      : (bom.assignedWorkers ?? []).map((name) => ({
          workerId: "",
          workerName: name,
          machineName: bom.machine?.trim() || "Chưa gán máy",
        }));

  let rows: MachineWorkRow[];

  if (!assignments.length) {
    if (bom.machine?.trim()) {
      rows = [
        {
          machineKey: bom.machine.trim(),
          machineName: bom.machine.trim(),
          doneQty: bomDoneQty(bom),
          workers: [],
        },
      ];
    } else {
      return [];
    }
  } else {
    const map = new Map<string, MachineWorkRow>();

    for (const a of assignments) {
      const machineName = a.machineName?.trim() || bom.machine?.trim() || "Chưa gán máy";
      const key = a.machineId || machineName;
      let row = map.get(key);
      if (!row) {
        row = {
          machineKey: key,
          machineId: a.machineId,
          machineName,
          doneQty: 0,
          workers: [],
        };
        map.set(key, row);
      }
      const entry = bom.workerEntries.find(
        (e) =>
          (a.workerId && e.workerId === a.workerId) || e.workerName === a.workerName,
      );
      const doneQty = entry?.rows.length ?? 0;
      row.workers.push({
        workerId: a.workerId || entry?.workerId || "",
        workerName: a.workerName,
        doneQty,
      });
      row.doneQty += doneQty;
    }

    const totalMeasured = [...map.values()].reduce((s, r) => s + r.doneQty, 0);
    if (totalMeasured === 0 && (bom.passQty || 0) > 0 && map.size > 0) {
      const share = Math.floor((bom.passQty || 0) / map.size);
      let rem = (bom.passQty || 0) - share * map.size;
      for (const row of map.values()) {
        row.doneQty = share + (rem > 0 ? 1 : 0);
        if (rem > 0) rem -= 1;
      }
    }

    rows = [...map.values()].sort((a, b) => a.machineName.localeCompare(b.machineName, "vi"));
  }

  return enrichMachineWorkRows(rows, catalog, bomTeamId);
}
