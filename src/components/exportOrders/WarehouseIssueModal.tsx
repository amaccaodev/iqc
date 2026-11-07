import { useState, useEffect } from "react"
import type { ExportOrder, ExportUser } from "../../types/exportOrder"
import {
  compressImageFile,
  getMaterialById,
  getProjectById,
  getWarehouseById,
} from "../../services/exportOrderStorage"

interface WarehouseIssueModalProps {
  order: ExportOrder | null
  currentUser: ExportUser
  isOpen: boolean
  onClose: () => void
  onConfirmIssue: (
    updatedOrder: ExportOrder,
    issueType: "full" | "partial" | "close_short",
    note: string,
  ) => void
}

export default function WarehouseIssueModal({
  order,
  currentUser,
  isOpen,
  onClose,
  onConfirmIssue,
}: WarehouseIssueModalProps) {
  // Local state for this issue batch: map materialId -> quantity to issue this round
  const [issueQtys, setIssueQtys] = useState<Record<string, number>>({})
  const [handoverPhotos, setHandoverPhotos] = useState<string[]>([])
  const [issueNote, setIssueNote] = useState("")
  const [isCompressing, setIsCompressing] = useState(false)
  const [isClosingShort, setIsClosingShort] = useState(false)
  const [closeReason, setCloseReason] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (!isOpen || !order) return
    // Default: fill with remaining quantity (Xuất đủ 100% by default)
    const initial: Record<string, number> = {}
    for (const m of order.materials) {
      const remaining = Math.max(0, (m.reqQty || 0) - (m.issuedQty || 0))
      initial[m.materialId] = remaining
    }
    setIssueQtys(initial)
    setHandoverPhotos([])
    setIssueNote("")
    setIsClosingShort(false)
    setCloseReason("")
    setErrorMsg("")
  }, [isOpen, order])

  if (!isOpen || !order) return null

  const project = getProjectById(order.projectId)
  const warehouse = getWarehouseById(order.warehouseId)

  // Set 100% full issue
  const handleSetFull = () => {
    const full: Record<string, number> = {}
    for (const m of order.materials) {
      const remaining = Math.max(0, (m.reqQty || 0) - (m.issuedQty || 0))
      full[m.materialId] = remaining
    }
    setIssueQtys(full)
  }

  // Set 0 for all
  const handleClear = () => {
    const empty: Record<string, number> = {}
    for (const m of order.materials) {
      empty[m.materialId] = 0
    }
    setIssueQtys(empty)
  }

  // Upload handover photo with Canvas compression
  const handleHandoverPhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setIsCompressing(true)
      const compressedList: string[] = []
      for (let i = 0; i < files.length; i++) {
        const b64 = await compressImageFile(files[i], 1024, 0.75)
        compressedList.push(b64)
      }
      setHandoverPhotos([...handoverPhotos, ...compressedList])
    } catch (e) {
      console.error(e)
    } finally {
      setIsCompressing(false)
    }
  }

  const handleConfirm = () => {
    setErrorMsg("")

    // If close short, reason is required
    if (isClosingShort) {
      if (!closeReason.trim()) {
        setErrorMsg("Bắt buộc nhập lý do giải trình khi đóng lệnh thiếu.")
        return
      }
    }

    // Validate quantities
    let totalThisBatch = 0
    for (const m of order.materials) {
      const thisRound = issueQtys[m.materialId] || 0
      const remaining = Math.max(0, (m.reqQty || 0) - (m.issuedQty || 0))
      if (thisRound < 0) {
        setErrorMsg("Số lượng thực xuất không được âm.")
        return
      }
      if (thisRound > remaining) {
        const mat = getMaterialById(m.materialId)
        setErrorMsg(
          `Số lượng xuất cho ${mat?.name} vượt quá số dư còn lại (${remaining})!`,
        )
        return
      }
      totalThisBatch += thisRound
    }

    if (totalThisBatch === 0 && !isClosingShort) {
      setErrorMsg("Vui lòng nhập số lượng thực xuất đợt này lớn hơn 0.")
      return
    }

    const now = new Date()
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().substring(0, 5)}`

    // Update materials cumulative
    const updatedMaterials = order.materials.map((m) => {
      const thisRound = issueQtys[m.materialId] || 0
      return {
        ...m,
        issuedQty: (m.issuedQty || 0) + thisRound,
      }
    })

    // Check if fully completed
    const allCompleted = updatedMaterials.every((m) => m.issuedQty >= m.reqQty)

    let newStatus: ExportOrder["status"]
    let issueType: "full" | "partial" | "close_short"

    if (isClosingShort) {
      newStatus = "completed"
      issueType = "close_short"
    } else if (allCompleted) {
      newStatus = "completed"
      issueType = "full"
    } else {
      newStatus = "partial"
      issueType = "partial"
    }

    const logAction =
      issueType === "close_short"
        ? "Đóng lệnh thiếu (Nghiệm thu đóng lệnh)"
        : issueType === "full"
          ? "Xuất kho hoàn tất (100%)"
          : "Xuất kho một phần (Partial Delivery)"

    const logNote =
      issueType === "close_short"
        ? `Lý do đóng lệnh: ${closeReason}`
        : issueNote
          ? `Ghi chú bãi kho: ${issueNote}`
          : `Xuất đợt này: ${totalThisBatch} sản phẩm/vật tư`

    const updatedOrder: ExportOrder = {
      ...order,
      status: newStatus,
      materials: updatedMaterials,
      handoverPhotos: [...order.handoverPhotos, ...handoverPhotos],
      closeShortReason: isClosingShort ? closeReason : order.closeShortReason,
      logs: [
        ...order.logs,
        {
          time: timeStr,
          actor: `${currentUser.name} (${currentUser.role})`,
          action: logAction,
          note: logNote,
        },
      ],
    }

    onConfirmIssue(updatedOrder, issueType, logNote)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-fade-up"
    >
      <div className="relative w-full max-w-3xl bg-card rounded-3xl shadow-modal border border-border flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-surface/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              <i className="fas fa-truck-ramp-box" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-foreground">
                Thực hiện Xuất kho · Lệnh {order.code}
              </h2>
              <div className="text-xs text-muted">
                Thủ kho:{" "}
                <strong className="text-foreground">{currentUser.name}</strong>{" "}
                · Kho: {warehouse?.name || order.warehouseId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-card hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
          >
            <i className="fas fa-xmark text-sm" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 font-bold flex items-center gap-2">
              <i className="fas fa-circle-exclamation text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project & Vehicle Info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-surface/50 border border-border/80 text-xs">
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                Dự án nhận
              </span>
              <strong className="text-foreground">{project?.name}</strong>
            </div>
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                Xe vận chuyển
              </span>
              <strong className="text-foreground font-mono">
                {order.vehiclePlate || "Chưa gán xe"}
              </strong>
            </div>
            <div>
              <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                Ngày xuất dự kiến
              </span>
              <strong className="text-foreground">{order.expectedDate}</strong>
            </div>
          </div>

          {/* Quick full/clear helper buttons */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <i
                className="fas fa-clipboard-list text-primary"
                aria-hidden="true"
              />
              <span>Số lượng thực xuất đợt này</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetFull}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
              >
                Xuất đủ 100%
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="px-2 py-1 text-xs text-muted hover:text-foreground cursor-pointer"
              >
                Xóa nhập
              </button>
            </div>
          </div>

          {/* Reconciliation Table */}
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface text-muted uppercase text-[11px] font-bold border-b border-border">
                <tr>
                  <th className="p-2.5">Vật tư</th>
                  <th className="p-2.5 text-center w-14">ĐVT</th>
                  <th className="p-2.5 text-center w-20">Yêu cầu</th>
                  <th className="p-2.5 text-center w-20">Đã xuất trước</th>
                  <th className="p-2.5 text-center w-20 text-rose-500">
                    Còn lại
                  </th>
                  <th className="p-2.5 text-center w-28 text-primary font-bold">
                    Xuất đợt này
                  </th>
                  <th className="p-2.5 text-center w-24">Sau đợt này</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {order.materials.map((m) => {
                  const mat = getMaterialById(m.materialId)
                  const remaining = Math.max(
                    0,
                    (m.reqQty || 0) - (m.issuedQty || 0),
                  )
                  const thisRound = issueQtys[m.materialId] ?? remaining
                  const futureRemaining = Math.max(0, remaining - thisRound)

                  return (
                    <tr key={m.materialId}>
                      <td className="p-2.5 font-medium text-foreground">
                        <div>{mat?.name || m.materialId}</div>
                        <div className="text-[11px] font-mono text-muted">
                          {mat?.code}
                        </div>
                      </td>
                      <td className="p-2.5 text-center text-muted">
                        {mat?.unit || "Cái"}
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold">
                        {m.reqQty}
                      </td>
                      <td className="p-2.5 text-center font-mono text-emerald-600 dark:text-emerald-400">
                        {m.issuedQty}
                      </td>
                      <td className="p-2.5 text-center font-mono text-rose-600 dark:text-rose-400 font-bold">
                        {remaining}
                      </td>
                      <td className="p-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={thisRound}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0)
                            setIssueQtys({ ...issueQtys, [m.materialId]: val })
                          }}
                          className="w-20 px-2 py-1 text-center font-mono font-bold text-sm rounded-lg border border-primary bg-input text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5 text-center font-mono text-xs">
                        {futureRemaining === 0 ? (
                          <span className="text-emerald-500 font-bold">
                            ✓ Hết dư
                          </span>
                        ) : (
                          <span className="text-orange-500 font-bold">
                            Còn nợ {futureRemaining}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Đóng lệnh thiếu toggle */}
          <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-orange-900 dark:text-orange-200">
              <input
                type="checkbox"
                checked={isClosingShort}
                onChange={(e) => setIsClosingShort(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <span>
                Đóng lệnh thiếu (Bên nhận không có nhu cầu lấy tiếp số lượng còn
                lại)
              </span>
            </label>
            {isClosingShort && (
              <div className="pt-2 animate-fade-up">
                <label className="block text-[11px] font-bold text-orange-900 dark:text-orange-200 mb-1">
                  Lý do giải trình đóng lệnh thiếu{" "}
                  <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="VD: Thay đổi thiết kế dầm, đội thi công thừa vật tư, không xuất tiếp số còn nợ..."
                  className="w-full px-3 py-2 rounded-lg border border-orange-400 bg-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}
          </div>

          {/* Ảnh bàn giao & nghiệm thu bãi kho (Canvas compression) */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <i
                    className="fas fa-camera text-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Ảnh biên bản bàn giao, phiếu ký nhận &amp; bốc dỡ xe hàng
                  </span>
                </h4>
                <div className="text-[11px] text-muted">
                  Chụp phiếu có chữ ký lái xe / đại diện thi công và ảnh bốc dỡ
                  tại bãi kho.
                </div>
              </div>

              <label className="px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs cursor-pointer flex items-center gap-1.5">
                <i className="fas fa-camera" aria-hidden="true" />
                <span>
                  {isCompressing ? "Đang nén..." : "+ Chụp/Tải ảnh bàn giao"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  disabled={isCompressing}
                  className="hidden"
                  onChange={(e) => handleHandoverPhotoUpload(e.target.files)}
                />
              </label>
            </div>

            {handoverPhotos.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-2">
                {handoverPhotos.map((src, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-surface"
                  >
                    <img
                      src={src}
                      alt={`Bàn giao đợt này ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setHandoverPhotos(
                          handoverPhotos.filter((_, i) => i !== idx),
                        )
                      }
                      className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Xóa ảnh"
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                Khuyến nghị tải ít nhất 1 ảnh biên bản ký nhận hoặc ảnh xe hàng
                đã bốc dỡ xong.
              </div>
            )}
          </div>

          {/* Ghi chú xuất kho */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Ghi chú đợt xuất kho
            </label>
            <input
              type="text"
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              placeholder="VD: Xuất chuyến 1 lúc 14h30, lái xe kiểm đếm đủ bao bì niêm phong..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-surface text-foreground font-semibold text-xs cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-2 shadow-brand"
          >
            <i className="fas fa-circle-check" aria-hidden="true" />
            <span>Xác nhận xuất kho &amp; Lưu hồ sơ</span>
          </button>
        </div>
      </div>
    </div>
  )
}
