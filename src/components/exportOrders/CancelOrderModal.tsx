import { useState } from "react"
import type { ExportOrder, ExportUser } from "../../types/exportOrder"

interface CancelOrderModalProps {
  order: ExportOrder | null
  currentUser: ExportUser
  isOpen: boolean
  onClose: () => void
  onConfirmCancel: (order: ExportOrder, reason: string) => void
}

export default function CancelOrderModal({
  order,
  currentUser,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")

  if (!isOpen || !order) return null

  const handleCancel = () => {
    if (!reason.trim()) {
      setError("Bắt buộc nhập lý do giải trình khi hủy lệnh xuất.")
      return
    }

    const now = new Date()
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().substring(0, 5)}`

    const updatedOrder: ExportOrder = {
      ...order,
      status: "cancelled",
      cancelReason: reason.trim(),
      logs: [
        ...order.logs,
        {
          time: timeStr,
          actor: `${currentUser.name} (${currentUser.role})`,
          action: "Hủy lệnh xuất",
          note: `Lý do giải trình: ${reason.trim()}`,
        },
      ],
    }

    onConfirmCancel(updatedOrder, reason.trim())
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-up"
    >
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-modal border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg shrink-0">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-display font-extrabold text-base text-foreground">
              Hủy lệnh xuất {order.code}
            </h3>
            <div className="text-xs text-muted">
              Hành động này sẽ dừng quy trình xuất vật tư đến kho.
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 font-bold">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">
            Lý do giải trình hủy lệnh <span className="text-rose-500">*</span>:
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError("")
            }}
            placeholder="VD: Thay đổi kế hoạch thi công dầm, chuyển đổi chủng loại thép, hủy đề nghị từ ban QLDA..."
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-border bg-input text-foreground focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-surface text-foreground font-semibold text-xs cursor-pointer"
          >
            Quay lại
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
          >
            Xác nhận Hủy lệnh
          </button>
        </div>
      </div>
    </div>
  )
}
