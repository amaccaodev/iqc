import { useState } from "react"
import type { ExportOrder, ExportUser } from "../../types/exportOrder"
import {
  calculateOrderProgress,
  getMaterialById,
  getProjectById,
  getRequisitionById,
  getStatusBadgeInfo,
  getWarehouseById,
} from "../../services/exportOrderStorage"
import LightboxModal from "./LightboxModal"

interface OrderDetailModalProps {
  order: ExportOrder | null
  currentUser: ExportUser
  onClose: () => void
  onOpenPrint: (order: ExportOrder) => void
  onOpenIssueModal?: (order: ExportOrder) => void
}

export default function OrderDetailModal({
  order,
  currentUser,
  onClose,
  onOpenPrint,
  onOpenIssueModal,
}: OrderDetailModalProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [lightboxTitle, setLightboxTitle] = useState<string>("")
  const [activeTab, setActiveTab] = useState<"materials" | "photos" | "logs">(
    "materials",
  )

  if (!order) return null

  const project = getProjectById(order.projectId)
  const warehouse = getWarehouseById(order.warehouseId)
  const requisition = getRequisitionById(order.requisitionId)
  const statusInfo = getStatusBadgeInfo(order.status)
  const progress = calculateOrderProgress(order)

  // Check if warehouse keeper can issue this order
  const isKeeperForOrder =
    currentUser.roleType === "warehouse_keeper" &&
    currentUser.warehouseId === order.warehouseId
  const canIssue =
    isKeeperForOrder &&
    (order.status === "in_progress" || order.status === "partial")

  const openPhoto = (src: string, title: string) => {
    setLightboxSrc(src)
    setLightboxTitle(title)
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết lệnh xuất ${order.code}`}
        className="fixed inset-0 z-40 overflow-y-auto bg-black/70 backdrop-blur-sm flex justify-center p-3 sm:p-6 animate-fade-up"
      >
        <div className="relative w-full max-w-4xl bg-card rounded-3xl shadow-modal border border-border/80 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border/70 bg-surface/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-brand-gradient text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                <i className="fas fa-file-invoice" aria-hidden="true" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-extrabold text-lg sm:text-xl text-foreground tracking-tight">
                    {order.code}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.badgeCls}`}
                  >
                    <i
                      className={`fas ${statusInfo.icon} text-[10px]`}
                      aria-hidden="true"
                    />
                    <span>{statusInfo.label}</span>
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Lập bởi{" "}
                  <strong className="text-foreground">
                    {order.creatorName}
                  </strong>{" "}
                  ngày {order.createdAt} · Ngày xuất: {order.expectedDate}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canIssue && onOpenIssueModal && (
                <button
                  type="button"
                  onClick={() => onOpenIssueModal(order)}
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <i className="fas fa-truck-ramp-box" aria-hidden="true" />
                  <span>Mở phiếu xuất</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenPrint(order)}
                className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-surface text-foreground text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <i className="fas fa-print text-muted" aria-hidden="true" />
                <span>In A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng chi tiết"
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
              >
                <i className="fas fa-xmark text-sm" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* Progress Bar & Summary Cards */}
            <div className="rounded-2xl border border-border/80 bg-surface/50 p-4">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-foreground flex items-center gap-1.5">
                  <i
                    className="fas fa-chart-pie text-primary"
                    aria-hidden="true"
                  />
                  Tiến độ xuất kho hoàn tất:
                </span>
                <span className="text-primary font-bold">
                  {progress.percent}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted mt-2">
                <span>
                  Đã thực xuất:{" "}
                  <strong className="text-foreground">
                    {progress.totalIssued}
                  </strong>{" "}
                  / {progress.totalReq} (Đơn vị tính quy chuẩn)
                </span>
                <span>
                  Còn nợ công trình:{" "}
                  <strong className="text-rose-500 font-bold">
                    {Math.max(0, progress.totalReq - progress.totalIssued)}
                  </strong>
                </span>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border/70 bg-card/60">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                  Dự án / Công trình
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block">
                  {project?.name || order.projectId}
                </span>
                <span className="text-muted-foreground text-[11px] font-mono">
                  {project?.code}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card/60">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                  Kho xuất vật tư
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block">
                  {warehouse?.name || order.warehouseId}
                </span>
                <span className="text-muted text-[11px]">
                  Thủ kho:{" "}
                  <strong className="text-foreground">
                    {warehouse?.keeperName}
                  </strong>
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card/60">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                  Phiếu đề nghị liên kết
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block font-mono">
                  {requisition?.code || order.requisitionId}
                </span>
                <span className="text-muted text-[11px] truncate block">
                  {requisition?.title || "Phiếu đề nghị phê duyệt"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card/60">
                <span className="text-muted block text-[11px] uppercase tracking-wider font-semibold">
                  Xe vận chuyển
                </span>
                <span className="font-bold text-foreground text-sm mt-0.5 block font-mono">
                  {order.vehiclePlate || "Chưa phân xe"}
                </span>
                <span className="text-muted text-[11px]">
                  Ngày xuất: {order.expectedDate}
                </span>
              </div>
            </div>

            {/* Cancel or Short Close reason banner if any */}
            {order.cancelReason && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start gap-2.5">
                <i
                  className="fas fa-ban text-rose-500 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <strong className="block font-bold">
                    Lý do hủy lệnh xuất:
                  </strong>
                  <span>{order.cancelReason}</span>
                </div>
              </div>
            )}
            {order.closeShortReason && (
              <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-500/10 text-xs text-orange-700 dark:text-orange-300 font-medium flex items-start gap-2.5">
                <i
                  className="fas fa-lock text-orange-500 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <strong className="block font-bold">
                    Lý do đóng lệnh thiếu:
                  </strong>
                  <span>{order.closeShortReason}</span>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-border/70 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("materials")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "materials"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <i className="fas fa-list-check" aria-hidden="true" />
                <span>Bảng kê đối soát vật tư ({order.materials.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "photos"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <i className="fas fa-images" aria-hidden="true" />
                <span>
                  Hồ sơ &amp; Bộ sưu tập ảnh (
                  {order.initialPhotos.length + order.handoverPhotos.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "logs"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <i className="fas fa-timeline" aria-hidden="true" />
                <span>Nhật ký thao tác ({order.logs.length})</span>
              </button>
            </div>

            {/* TAB 1: Bảng kê đối soát 4 cột */}
            {activeTab === "materials" && (
              <div className="overflow-x-auto rounded-xl border border-border/70">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface text-muted uppercase text-[11px] font-bold border-b border-border/70">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Vật tư &amp; Quy cách</th>
                      <th className="py-2.5 px-3 text-center">ĐVT</th>
                      <th className="py-2.5 px-3 text-center">Được duyệt</th>
                      <th className="py-2.5 px-3 text-center">Yêu cầu</th>
                      <th className="py-2.5 px-3 text-center text-primary font-extrabold">
                        Đã xuất
                      </th>
                      <th className="py-2.5 px-3 text-center text-rose-500 font-extrabold">
                        Còn lại
                      </th>
                      <th className="py-2.5 px-3 text-center">Ảnh mẫu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {order.materials.map((m, idx) => {
                      const mat = getMaterialById(m.materialId)
                      const remaining = Math.max(
                        0,
                        (m.reqQty || 0) - (m.issuedQty || 0),
                      )
                      return (
                        <tr
                          key={m.materialId}
                          className="hover:bg-surface/50 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center text-muted font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            <div>{mat?.name || m.materialId}</div>
                            <div className="text-[11px] font-mono text-muted">
                              {mat?.code}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center text-muted">
                            {mat?.unit || "Cái"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-muted">
                            {m.approvedQty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-foreground">
                            {m.reqQty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {m.issuedQty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                            {remaining}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {m.photo ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openPhoto(
                                    m.photo!,
                                    `Ảnh vật tư: ${mat?.name}`,
                                  )
                                }
                                className="w-8 h-8 rounded-lg overflow-hidden border border-border inline-block hover:scale-105 transition-transform cursor-pointer"
                              >
                                <img
                                  src={m.photo}
                                  alt="Vật tư"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <span className="text-[11px] text-muted italic">
                                Chưa có
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Gallery Ảnh & Hồ sơ */}
            {activeTab === "photos" && (
              <div className="space-y-5">
                {/* Initial Requisition / Contract photos */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <i
                      className="fas fa-file-contract text-primary"
                      aria-hidden="true"
                    />
                    <span>
                      Hồ sơ chứng từ ban đầu (Phiếu đề nghị, Hợp đồng đã ký)
                    </span>
                  </h4>
                  {order.initialPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {order.initialPhotos.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            openPhoto(p, `Hồ sơ chứng từ đính kèm #${idx + 1}`)
                          }
                          className="group relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-surface cursor-pointer hover:border-primary transition-all shadow-sm"
                        >
                          <img
                            src={p}
                            alt={`Hồ sơ ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <i className="fas fa-magnifying-glass-plus" /> Xem
                            to
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                      Chưa có hồ sơ chứng từ đính kèm
                    </div>
                  )}
                </div>

                {/* Handover photos */}
                <div>
                  <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    <i
                      className="fas fa-truck-ramp-box text-emerald-500"
                      aria-hidden="true"
                    />
                    <span>
                      Ảnh thực tế bàn giao, nghiệm thu &amp; bốc dỡ tại bãi kho
                    </span>
                  </h4>
                  {order.handoverPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {order.handoverPhotos.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            openPhoto(p, `Ảnh thực tế bàn giao #${idx + 1}`)
                          }
                          className="group relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-surface cursor-pointer hover:border-primary transition-all shadow-sm"
                        >
                          <img
                            src={p}
                            alt={`Bàn giao ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <i className="fas fa-magnifying-glass-plus" /> Xem
                            to
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                      Chưa có ảnh bàn giao tại bãi kho
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Audit Trail / Nhật ký thao tác */}
            {activeTab === "logs" && (
              <div className="space-y-3">
                <div className="text-xs text-muted mb-2">
                  Toàn bộ tiến trình lịch sử phê duyệt, xuất kho và bàn giao
                  được lưu trữ bất biến.
                </div>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  {order.logs.map((log, idx) => (
                    <div key={idx} className="relative">
                      {/* Node circle */}
                      <span className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>
                      <div className="p-3 rounded-xl border border-border/70 bg-surface/50 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-foreground">
                            {log.action}
                          </span>
                          <span className="text-[11px] font-mono text-muted">
                            {log.time}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-primary mb-1">
                          Thực hiện bởi: {log.actor}
                        </div>
                        {log.note && (
                          <div className="text-muted text-[11px] italic">
                            "{log.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/70 bg-surface/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-card hover:bg-surface border border-border text-foreground font-bold text-xs cursor-pointer transition-colors"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox for full screen photo */}
      <LightboxModal
        src={lightboxSrc}
        title={lightboxTitle}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  )
}
