/** Shared worker action-button classes — consistent radius, gradient, and micro-interactions */
export const WORKER_BTN_BASE =
  "flex items-center justify-center gap-2 rounded-2xl text-sm font-bold border transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

export const WORKER_BTN_PRIMARY = `${WORKER_BTN_BASE} min-h-12 border-transparent bg-primary bg-brand-gradient text-primary-foreground shadow-brand hover:brightness-110`;

export const WORKER_BTN_SECONDARY = `${WORKER_BTN_BASE} min-h-12 border-border/80 bg-card text-primary shadow-card hover:border-primary/40 hover:bg-secondary`;

export const WORKER_BTN_GHOST = `${WORKER_BTN_BASE} min-h-11 border-border/80 bg-card text-foreground shadow-card hover:border-primary/30 hover:bg-surface`;

export const WORKER_DOCK_VAR = "--worker-dock-h";
