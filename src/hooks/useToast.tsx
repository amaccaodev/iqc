import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "success" | "error" | "info" | "warning";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Nút xác nhận màu đỏ (xóa / nguy hiểm) */
  danger?: boolean;
}

type ToastItem = { id: string; message: string; kind: ToastKind };

type ToastApi = {
  (message: string, kind?: ToastKind): void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
};

type ToastContextValue = {
  toast: ToastApi;
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLE: Record<ToastKind, { bar: string; icon: string; iconClass: string }> = {
  success: { bar: "bg-emerald-500", icon: "fa-circle-check", iconClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" },
  error: { bar: "bg-rose-500", icon: "fa-circle-xmark", iconClass: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
  info: { bar: "bg-primary", icon: "fa-circle-info", iconClass: "bg-primary/12 text-primary" },
  warning: { bar: "bg-amber-500", icon: "fa-triangle-exclamation", iconClass: "bg-amber-500/12 text-amber-600 dark:text-amber-400" },
};

/** API toàn cục — dùng được cả ngoài hook (sau khi ToastProvider mount) */
let pushToast: ((message: string, kind?: ToastKind) => void) | null = null;
let openConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

function makeToastApi(
  push: (message: string, kind?: ToastKind) => void,
  confirmFn: (opts: ConfirmOptions) => Promise<boolean>,
): ToastApi {
  const api = ((message: string, kind: ToastKind = "info") => push(message, kind)) as ToastApi;
  api.success = (m) => push(m, "success");
  api.error = (m) => push(m, "error");
  api.info = (m) => push(m, "info");
  api.warning = (m) => push(m, "warning");
  api.confirm = (opts) =>
    confirmFn(typeof opts === "string" ? { message: opts } : opts);
  return api;
}

export const toast: ToastApi = makeToastApi(
  (message, kind) => {
    if (pushToast) pushToast(message, kind);
    else if (typeof console !== "undefined") console.warn(`[toast:${kind ?? "info"}]`, message);
  },
  (opts) => {
    if (openConfirm) return openConfirm(opts);
    if (typeof console !== "undefined") console.warn("[confirm]", opts.message);
    return Promise.resolve(false);
  },
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{
    opts: ConfirmOptions;
    resolve: (v: boolean) => void;
  } | null>(null);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) window.clearTimeout(t);
    timers.current.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "info") => {
      const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((prev) => [...prev.slice(-4), { id, message, kind }]);
      const ms = kind === "error" ? 5000 : 3200;
      const handle = window.setTimeout(() => dismiss(id), ms);
      timers.current.set(id, handle);
    },
    [dismiss],
  );

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const normalized = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setConfirmState({ opts: normalized, resolve });
    });
  }, []);

  useEffect(() => {
    pushToast = push;
    openConfirm = confirm;
    return () => {
      if (pushToast === push) pushToast = null;
      if (openConfirm === confirm) openConfirm = null;
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current.clear();
    };
  }, [push, confirm]);

  const api = useMemo(() => makeToastApi(push, confirm), [push, confirm]);

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast: api, confirm }}>
      {children}

      <div
        className="fixed z-[100] inset-x-0 bottom-20 sm:bottom-6 sm:inset-x-auto sm:right-6 sm:left-auto flex flex-col gap-2 px-3 sm:px-0 pointer-events-none max-w-md mx-auto sm:mx-0 w-full sm:w-[380px]"
        aria-live="polite"
      >
        {items.map((t) => {
          const style = KIND_STYLE[t.kind];
          return (
            <div
              key={t.id}
              className="relative overflow-hidden pointer-events-auto flex items-start gap-3 rounded-2xl border border-border/70 glass-strong shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] pl-4 pr-3 py-3"
              role="status"
            >
              <span className={`absolute left-0 inset-y-0 w-1 ${style.bar}`} />
              <span className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center ${style.iconClass}`}>
                <i className={`fas ${style.icon} text-sm`} />
              </span>
              <p className="flex-1 text-sm text-foreground leading-snug self-center">{t.message}</p>
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-surface border-0 bg-transparent cursor-pointer transition-colors"
                aria-label="Đóng"
                onClick={() => dismiss(t.id)}
              >
                <i className="fas fa-xmark text-xs" />
              </button>
            </div>
          );
        })}
      </div>

      {confirmState ? (
        <div
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="iqc-confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm border-0 cursor-pointer"
            aria-label="Đóng"
            onClick={() => closeConfirm(false)}
          />
          <div className="relative bg-card text-card-foreground rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl ring-1 ring-border/80 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${
                  confirmState.opts.danger
                    ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
                    : "bg-primary/12 text-primary"
                }`}
              >
                <i className={`fas ${confirmState.opts.danger ? "fa-triangle-exclamation" : "fa-circle-question"} text-lg`} />
              </span>
              <h3 id="iqc-confirm-title" className="font-display font-700 text-lg">
                {confirmState.opts.title || "Xác nhận"}
              </h3>
            </div>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{confirmState.opts.message}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 min-h-11 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer hover:bg-surface transition-colors"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.opts.cancelLabel || "Huỷ"}
              </button>
              <button
                type="button"
                className={`flex-1 min-h-11 rounded-xl border-0 text-white text-sm font-semibold cursor-pointer transition-all hover:brightness-110 ${
                  confirmState.opts.danger
                    ? "bg-gradient-to-br from-rose-500 to-red-600 shadow-[0_8px_20px_-8px_rgba(225,29,72,0.6)]"
                    : "bg-primary bg-brand-gradient shadow-brand"
                }`}
                onClick={() => closeConfirm(true)}
              >
                {confirmState.opts.confirmLabel || "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
