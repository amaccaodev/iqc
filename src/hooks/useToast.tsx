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
  success: { bar: "border-l-emerald-500", icon: "fa-circle-check", iconClass: "text-emerald-600" },
  error: { bar: "border-l-red-500", icon: "fa-circle-xmark", iconClass: "text-red-600" },
  info: { bar: "border-l-primary", icon: "fa-circle-info", iconClass: "text-primary" },
  warning: { bar: "border-l-amber-500", icon: "fa-triangle-exclamation", iconClass: "text-amber-600" },
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
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card shadow-lg border-l-4 ${style.bar} px-3.5 py-3`}
              role="status"
            >
              <i className={`fas ${style.icon} ${style.iconClass} mt-0.5`} />
              <p className="flex-1 text-sm text-foreground leading-snug">{t.message}</p>
              <button
                type="button"
                className="text-muted hover:text-foreground border-0 bg-transparent cursor-pointer p-0.5"
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
            className="absolute inset-0 bg-black/50 backdrop-blur-sm border-0 cursor-pointer"
            aria-label="Đóng"
            onClick={() => closeConfirm(false)}
          />
          <div className="relative bg-card text-card-foreground rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl p-5 space-y-4">
            <h3 id="iqc-confirm-title" className="font-display font-700 text-base">
              {confirmState.opts.title || "Xác nhận"}
            </h3>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{confirmState.opts.message}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 min-h-11 rounded-xl border border-border bg-card text-sm font-semibold cursor-pointer"
                onClick={() => closeConfirm(false)}
              >
                {confirmState.opts.cancelLabel || "Huỷ"}
              </button>
              <button
                type="button"
                className={`flex-1 min-h-11 rounded-xl border-0 text-white text-sm font-semibold cursor-pointer ${
                  confirmState.opts.danger ? "bg-red-600" : "bg-primary"
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
