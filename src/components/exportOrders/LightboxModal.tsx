import { useEffect } from "react"

interface LightboxModalProps {
  src: string | null
  title?: string
  onClose: () => void
}

export default function LightboxModal({
  src,
  title,
  onClose,
}: LightboxModalProps) {
  useEffect(() => {
    if (!src) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [src, onClose])

  if (!src) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || "Xem ảnh phóng to"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-up"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="w-full flex items-center justify-between py-2 px-3 text-white/90 text-sm font-semibold mb-2 bg-black/40 rounded-xl">
          <span className="truncate max-w-md">
            {title || "Ảnh chi tiết hồ sơ chứng từ"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ảnh"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <i className="fas fa-xmark text-base" aria-hidden="true" />
          </button>
        </div>

        {/* Image preview */}
        <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-neutral-900 flex items-center justify-center max-h-[80vh]">
          <img
            src={src}
            alt={title || "Ảnh chi tiết"}
            className="max-w-full max-h-[80vh] object-contain select-none"
          />
        </div>
      </div>
    </div>
  )
}
