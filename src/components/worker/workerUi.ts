/** Shared worker action-button classes — same size, border, and radius everywhere. */
export const WORKER_BTN_BASE =
  "flex items-center justify-center gap-2 rounded-xl text-sm font-bold border-2 border-primary shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const WORKER_BTN_PRIMARY = `${WORKER_BTN_BASE} min-h-12 bg-primary text-primary-foreground`;

export const WORKER_BTN_SECONDARY = `${WORKER_BTN_BASE} min-h-12 bg-card text-primary hover:bg-secondary`;

export const WORKER_BTN_GHOST = `${WORKER_BTN_BASE} min-h-11 bg-card text-foreground hover:bg-secondary`;

export const WORKER_DOCK_VAR = "--worker-dock-h";
