import type { ShiftClose, ShiftUnlockRequest } from "../types/index.js";

export type ShiftScope = { workerId: string; orderId: string; bomId: string };

const PENDING_CLOSE: ReadonlySet<string> = new Set(["pending_teamlead"]);

export function localDayKey(isoOrDate: string | Date): string {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameLocalDay(iso: string, now = new Date()): boolean {
  return localDayKey(iso) === localDayKey(now);
}

function inScope<T extends ShiftScope>(row: T, scope: ShiftScope): boolean {
  return row.workerId === scope.workerId && row.orderId === scope.orderId && row.bomId === scope.bomId;
}

export function closesTodayForScope(
  closes: ShiftClose[],
  scope: ShiftScope,
  now = new Date(),
): ShiftClose[] {
  const day = localDayKey(now);
  return closes
    .filter((c) => inScope(c, scope) && localDayKey(c.createdAt) === day)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Cùng ngày, cũ → mới — dùng đánh số Lần chốt 1, 2, … */
export function closesTodayChronological(
  closes: ShiftClose[],
  scope: ShiftScope,
  now = new Date(),
): ShiftClose[] {
  return [...closesTodayForScope(closes, scope, now)].reverse();
}

export function unlocksTodayForScope(
  unlocks: ShiftUnlockRequest[],
  scope: ShiftScope,
  now = new Date(),
): ShiftUnlockRequest[] {
  const day = localDayKey(now);
  return unlocks
    .filter((u) => inScope(u, scope) && localDayKey(u.createdAt) === day)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function latestNonRejected(closes: ShiftClose[]): ShiftClose | null {
  return closes.find((c) => c.status !== "rejected") ?? null;
}

function approvedUnlockAfter(
  unlocks: ShiftUnlockRequest[],
  afterIso: string,
): boolean {
  return unlocks.some((u) => u.status === "approved" && u.createdAt > afterIso);
}

export type ShiftLockUi = {
  canClose: boolean;
  canUnlock: boolean;
  /** Sau chốt ca: khóa đo kiểm đến khi tổ trưởng duyệt mở khóa */
  canMeasure: boolean;
  /** Chưa duyệt tổ trưởng — CN được sửa phiếu chốt ca */
  canEditClose: boolean;
  pendingClose: ShiftClose | null;
  /** close = Chốt ca; unlock = Mở khóa; edit = Sửa chốt ca */
  button: "close" | "unlock" | "edit";
  hint: string;
  waitingTeamlead: boolean;
};

export function shiftLockState(
  closes: ShiftClose[],
  unlocks: ShiftUnlockRequest[],
  scope: ShiftScope,
  now = new Date(),
): ShiftLockUi {
  const todayCloses = closesTodayForScope(closes, scope, now);
  const todayUnlocks = unlocksTodayForScope(unlocks, scope, now);
  const latest = latestNonRejected(todayCloses);
  const pendingUnlock = todayUnlocks.find((u) => u.status === "pending_teamlead") ?? null;
  const closeAtTeamlead = todayCloses.some((c) => PENDING_CLOSE.has(c.status));
  const unlockedAfterLatest = latest ? approvedUnlockAfter(todayUnlocks, latest.createdAt) : false;
  const locked = Boolean(latest) && !unlockedAfterLatest;

  if (!locked) {
    return {
      canClose: true,
      canUnlock: false,
      canMeasure: true,
      canEditClose: false,
      pendingClose: null,
      button: "close",
      hint: todayCloses.length > 0 ? "Đã mở khóa — có thể đo kiểm và chốt ca tiếp." : "",
      waitingTeamlead: false,
    };
  }

  const pendingClose = todayCloses.find((c) => PENDING_CLOSE.has(c.status)) ?? null;

  if (closeAtTeamlead) {
    return {
      canClose: false,
      canUnlock: false,
      canMeasure: false,
      canEditClose: true,
      pendingClose,
      button: "edit",
      hint: "Phiếu chờ tổ trưởng duyệt — có thể sửa số đạt/hỏng. Sau khi duyệt, xin mở khóa để chốt ca tiếp.",
      waitingTeamlead: true,
    };
  }

  if (pendingUnlock) {
    return {
      canClose: false,
      canUnlock: false,
      canMeasure: false,
      canEditClose: false,
      pendingClose: null,
      button: "unlock",
      hint: "Đã gửi yêu cầu mở khóa — chờ tổ trưởng duyệt. Chưa đo kiểm tiếp được.",
      waitingTeamlead: true,
    };
  }

  return {
    canClose: false,
    canUnlock: true,
    canMeasure: false,
    canEditClose: false,
    pendingClose: null,
    button: "unlock",
    hint: "Tổ trưởng đã duyệt chốt ca — bấm Mở khóa rồi mới đo kiểm / chốt ca tiếp.",
    waitingTeamlead: false,
  };
}

export function assertCanEditShiftClose(
  closes: ShiftClose[],
  closeId: string,
  workerId: string,
): ShiftClose {
  const row = closes.find((c) => c.id === closeId);
  if (!row) throw new Error("Không tìm thấy phiếu chốt ca");
  if (row.workerId !== workerId) throw new Error("Không được sửa phiếu của người khác");
  if (row.status !== "pending_teamlead") {
    throw new Error("Tổ trưởng đã duyệt — không sửa được. Xin mở khóa để chốt ca tiếp.");
  }
  return row;
}

export function assertCanCreateShiftClose(
  closes: ShiftClose[],
  unlocks: ShiftUnlockRequest[],
  scope: ShiftScope,
  now = new Date(),
): void {
  const state = shiftLockState(closes, unlocks, scope, now);
  if (state.canClose) return;
  if (state.waitingTeamlead) {
    throw new Error(state.hint || "Đang chờ tổ trưởng duyệt — không gửi thêm.");
  }
  throw new Error("Cần mở khóa (tổ trưởng duyệt) trước khi chốt ca tiếp.");
}

export function assertCanRequestUnlock(
  closes: ShiftClose[],
  unlocks: ShiftUnlockRequest[],
  scope: ShiftScope,
  now = new Date(),
): void {
  const state = shiftLockState(closes, unlocks, scope, now);
  if (state.canUnlock) return;
  if (state.canClose) {
    throw new Error("Chưa chốt ca hoặc đã mở khóa — không cần gửi yêu cầu.");
  }
  throw new Error(state.hint || "Đã có đơn ở tổ trưởng — chờ duyệt, không gửi thêm.");
}

/** Chặn nộp số đo khi đã chốt ca mà chưa được mở khóa */
export function assertCanSubmitWorkerRow(
  closes: ShiftClose[],
  unlocks: ShiftUnlockRequest[],
  scope: ShiftScope,
  now = new Date(),
): void {
  const state = shiftLockState(closes, unlocks, scope, now);
  if (state.canMeasure) return;
  throw new Error(state.hint || "Đã chốt ca — cần mở khóa trước khi đo kiểm tiếp.");
}
