import type { BOMStatus, OrderStatus, Priority } from "@shared/types";

export const sColor = (s: OrderStatus): string =>
  (
    {
      draft: "bg-gray-100 text-gray-600",
      pending_approval: "bg-yellow-100 text-yellow-700",
      approved: "bg-blue-100 text-blue-700",
      in_progress: "bg-indigo-100 text-indigo-700",
      completed: "bg-green-100 text-green-700",
    } satisfies Record<OrderStatus, string>
  )[s];

export const bColor = (s: BOMStatus): string =>
  (
    {
      unassigned: "bg-gray-100 text-gray-500",
      assigned: "bg-blue-100 text-blue-700",
      in_progress: "bg-indigo-100 text-indigo-700",
      team_reported: "bg-yellow-100 text-yellow-700",
      qc_passed: "bg-green-100 text-green-700",
      qc_failed: "bg-red-100 text-red-700",
    } satisfies Record<BOMStatus, string>
  )[s];

export const pColor = (p: Priority): string =>
  (
    {
      normal: "bg-slate-100 text-slate-600",
      high: "bg-orange-100 text-orange-700",
      urgent: "bg-red-100 text-red-700",
    } satisfies Record<Priority, string>
  )[p];

export const fileIcon = (t: string) =>
  ({
    pdf: "fa-file-pdf text-red-500",
    image: "fa-file-image text-blue-500",
    cad: "fa-cube text-teal-600",
    excel: "fa-file-excel text-green-600",
    word: "fa-file-word text-blue-600",
    other: "fa-file text-gray-400",
  })[t] ?? "fa-file text-gray-400";

export const ROLE_COLOR: Record<string, string> = {
  director: "bg-[#EEF2FF] text-[#4F46E5]",
  supervisor: "bg-[#EFF6FF] text-[#2563EB]",
  teamlead: "bg-[#FFFBEB] text-[#D97706]",
  worker: "bg-[#F0FDF4] text-[#16A34A]",
  qc: "bg-[#FAF5FF] text-[#7C3AED]",
  stats: "bg-[#F0FDFA] text-[#0F766E]",
  admin: "bg-[#FFF1F2] text-[#DC2626]",
};
