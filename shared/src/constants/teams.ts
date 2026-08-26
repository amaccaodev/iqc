import type { BOMItem, ProcessStage, Team } from "../types/index.js";

/** 3 tổ quy trình tuần tự: Dập nóng → Tự động → Lắp ráp */
export const TEAMS: Team[] = [
  { id: "t_hot", name: "Tổ Dập nóng", lead: "Phạm Văn Chí", leadShort: "P.V.Chí" },
  { id: "t_auto", name: "Tổ Tự động", lead: "Phạm Văn Sang", leadShort: "P.V.Sang" },
  { id: "t_asm", name: "Tổ Lắp ráp", lead: "Nguyễn Thị Hoa", leadShort: "N.T.Hoa" },
];

export const PROCESS_STAGE_TEAM: Record<ProcessStage, string> = {
  hot_forge: "t_hot",
  auto: "t_auto",
  assembly: "t_asm",
};

export const PROCESS_STAGE_LABEL: Record<ProcessStage, string> = {
  hot_forge: "Dập nóng",
  auto: "Tự động",
  assembly: "Lắp ráp",
};

/**
 * Alias ID tổ cũ (seed groups t1/t2/t3) ↔ tổ quy trình (t_hot/…).
 * Login từ Supabase có thể trả t1 trong khi BOM gán t_hot.
 */
export const TEAM_ID_ALIASES: Record<string, string> = {
  t1: "t_hot",
  t2: "t_auto",
  t3: "t_asm",
  t_hot: "t_hot",
  t_auto: "t_auto",
  t_asm: "t_asm",
};

export function canonicalTeamId(id?: string | null): string {
  if (!id) return "";
  return TEAM_ID_ALIASES[id] ?? id;
}

export function teamIdsMatch(a?: string | null, b?: string | null): boolean {
  const ca = canonicalTeamId(a);
  const cb = canonicalTeamId(b);
  return Boolean(ca && cb && ca === cb);
}

/** Suy teamId từ tên phòng ban / tổ (DB cũ: "Tổ 1", "Tổ Dập nóng", …) */
export function inferTeamIdFromDepartment(department?: string | null): string {
  const d = (department ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!d) return "";
  if (d.includes("dap nong") || d.includes("to 1") || /(^|\s)t1(\s|$)/.test(d)) return "t_hot";
  if (d.includes("tu dong") || d.includes("to 2") || /(^|\s)t2(\s|$)/.test(d)) return "t_auto";
  if (d.includes("lap rap") || d.includes("to 3") || /(^|\s)t3(\s|$)/.test(d)) return "t_asm";
  return "";
}

/** Suy ra teamId chuẩn từ BOM (id / tên tổ / công đoạn) */
export function resolveBomTeamId(
  bom: Pick<BOMItem, "assignedTeamId" | "assignedTeamName" | "processStage" | "process">,
): string {
  if (bom.assignedTeamId) return canonicalTeamId(bom.assignedTeamId);
  if (bom.processStage && PROCESS_STAGE_TEAM[bom.processStage]) {
    return PROCESS_STAGE_TEAM[bom.processStage];
  }
  const blob = `${bom.assignedTeamName ?? ""} ${bom.process ?? ""}`.toLowerCase();
  if (blob.includes("dập nóng") || blob.includes("dap nong") || blob.includes("hot")) return "t_hot";
  if (blob.includes("tự động") || blob.includes("tu dong") || blob.includes("auto")) return "t_auto";
  if (blob.includes("lắp ráp") || blob.includes("lap rap") || blob.includes("assembly")) return "t_asm";
  return "";
}

/** teamId hiệu lực của user: group id → alias → suy từ department */
export function resolveUserTeamId(user: {
  teamId?: string | null;
  department?: string | null;
}): string {
  return canonicalTeamId(user.teamId) || inferTeamIdFromDepartment(user.department) || "";
}

/** Nhãn tổ chuẩn (Tên – viết tắt tổ trưởng) */
export function teamDisplayName(teamId?: string | null): string {
  const id = canonicalTeamId(teamId);
  const t = TEAMS.find((x) => x.id === id);
  return t ? `${t.name} – ${t.leadShort}` : "";
}

/** Máy thuộc tổ (không gán teamId = dùng chung / legacy) */
export function machineBelongsToTeam(
  machine: { teamId?: string | null; active?: boolean },
  teamId?: string | null,
): boolean {
  if (machine.active === false) return false;
  const want = canonicalTeamId(teamId);
  if (!want) return true;
  if (!machine.teamId) return true;
  return teamIdsMatch(machine.teamId, want);
}

export function filterMachinesForTeam<T extends { teamId?: string | null; active?: boolean }>(
  machines: T[],
  teamId?: string | null,
): T[] {
  return machines.filter((m) => machineBelongsToTeam(m, teamId));
}
