export interface ToastMessage {
  id: string
  type: "success" | "warning" | "error" | "info"
  message: string
}

interface ToastNotificationProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export default function ToastNotification({
  toasts,
  onRemove,
}: ToastNotificationProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let borderCls =
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
        let icon = "fa-circle-check text-emerald-500"

        if (toast.type === "error") {
          borderCls =
            "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
          icon = "fa-circle-xmark text-rose-500"
        } else if (toast.type === "warning") {
          borderCls =
            "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200"
          icon = "fa-triangle-exclamation text-amber-500"
        } else if (toast.type === "info") {
          borderCls =
            "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200"
          icon = "fa-circle-info text-sky-500"
        }

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-2xl border ${borderCls} p-3.5 shadow-lg backdrop-blur-md flex items-start justify-between gap-3 animate-fade-up`}
          >
            <div className="flex items-start gap-2.5">
              <i
                className={`fas ${icon} text-base mt-0.5 shrink-0`}
                aria-hidden="true"
              />
              <div className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(toast.id)}
              className="text-muted hover:text-foreground p-0.5 cursor-pointer shrink-0"
              aria-label="Đóng thông báo"
            >
              <i className="fas fa-xmark text-xs" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
