import type { BOMStatus, OrderStatus, Priority } from "@shared/types";

export const sColor = (s: OrderStatus): string =>
  (
    {
      draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
      pending_approval: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      approved: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
      completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    } satisfies Record<OrderStatus, string>
  )[s];

export const bColor = (s: BOMStatus): string =>
  (
    {
      unassigned: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
      assigned: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
      team_reported: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
      qc_passed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
      qc_failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    } satisfies Record<BOMStatus, string>
  )[s];

export const pColor = (p: Priority): string =>
  (
    {
      normal: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      urgent: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
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
  director: "bg-secondary text-primary",
  supervisor: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  teamlead: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  worker: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  qc: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  stats: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  admin: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};
