import type { BOMStatus, OrderStatus, Priority } from "@shared/types";

export const sColor = (s: OrderStatus): string =>
  (
    {
      draft: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300",
      pending_approval: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300",
      approved: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300",
      in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300",
      completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    } satisfies Record<OrderStatus, string>
  )[s];

export const bColor = (s: BOMStatus): string =>
  (
    {
      unassigned: "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400",
      assigned: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300",
      in_progress: "bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300",
      team_reported: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300",
      qc_passed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300",
      qc_failed: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300",
    } satisfies Record<BOMStatus, string>
  )[s];

export const pColor = (p: Priority): string =>
  (
    {
      normal: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300",
      high: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300",
      urgent: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300",
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
  supervisor: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  teamlead: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  worker: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  qc: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  stats: "bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300",
  admin: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};
