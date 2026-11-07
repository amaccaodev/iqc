import type { Machine } from "../types/machine";
import { defaultMachinesSeed } from "./machineSeedData";

export const MACHINE_STORAGE_KEY = "iqc_machines_enterprise_v1";

/**
 * Tải danh sách máy móc từ localStorage. Nếu chưa có thì khởi tạo 12 máy mẫu.
 */
export function loadMachinesData(): Machine[] {
  try {
    const raw = localStorage.getItem(MACHINE_STORAGE_KEY);
    if (!raw) {
      const initial = JSON.parse(JSON.stringify(defaultMachinesSeed));
      saveMachinesData(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = JSON.parse(JSON.stringify(defaultMachinesSeed));
      saveMachinesData(initial);
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error("Lỗi khi đọc dữ liệu máy móc từ localStorage:", err);
    return JSON.parse(JSON.stringify(defaultMachinesSeed));
  }
}

/**
 * Lưu danh sách máy móc vào localStorage
 */
export function saveMachinesData(machines: Machine[]): boolean {
  try {
    localStorage.setItem(MACHINE_STORAGE_KEY, JSON.stringify(machines));
    return true;
  } catch (err) {
    console.error("Lỗi khi ghi dữ liệu máy móc vào localStorage:", err);
    return false;
  }
}

/**
 * Reset về dữ liệu ban đầu
 */
export function resetMachinesData(): Machine[] {
  const initial = JSON.parse(JSON.stringify(defaultMachinesSeed));
  saveMachinesData(initial);
  return initial;
}

/**
 * Kiểm tra ngày bảo trì có gấp hay không (quá hạn hoặc còn dưới 7 ngày)
 */
export function isMaintenanceUrgent(nextDateStr: string): boolean {
  if (!nextDateStr) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(nextDateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}

/**
 * Tính số ngày còn lại đến đợt bảo trì tiếp theo (âm nghĩa là đã quá hạn)
 */
export function getDaysUntilMaintenance(nextDateStr: string): number {
  if (!nextDateStr) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(nextDateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
