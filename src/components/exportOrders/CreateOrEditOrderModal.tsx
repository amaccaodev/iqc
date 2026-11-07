import { useState, useEffect } from "react"
import type {
  ExportOrder,
  ExportUser,
  OrderMaterialItem,
} from "../../types/exportOrder"
import {
  compressImageFile,
  generateNextOrderCode,
  getMaterialById,
  MATERIALS,
  PROJECTS,
  REQUISITIONS,
  WAREHOUSES,
} from "../../services/exportOrderStorage"

interface CreateOrEditOrderModalProps {
  orderToEdit: ExportOrder | null
  existingOrders: ExportOrder[]
  currentUser: ExportUser
  isOpen: boolean
  onClose: () => void
  onSave: (order: ExportOrder, action: "save_draft" | "publish") => void
}

export default function CreateOrEditOrderModal({
  orderToEdit,
  existingOrders,
  currentUser,
  isOpen,
  onClose,
  onSave,
}: CreateOrEditOrderModalProps) {
  const isEditing = !!orderToEdit
  const isOnlyEditVehicleNotes = isEditing && orderToEdit.status !== "draft"

  const [code, setCode] = useState("")
  const [projectId, setProjectId] = useState(PROJECTS[0]?.id || "")
  const [warehouseId, setWarehouseId] = useState(WAREHOUSES[0]?.id || "")
  const [requisitionId, setRequisitionId] = useState(REQUISITIONS[0]?.id || "")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [materials, setMaterials] = useState<OrderMaterialItem[]>([])
  const [initialPhotos, setInitialPhotos] = useState<string[]>([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [validationError, setValidationError] = useState("")

  // Filter requisitions by selected project
  const availableRequisitions = REQUISITIONS.filter(
    (r) => r.projectId === projectId,
  )

  useEffect(() => {
    if (!isOpen) return

    if (orderToEdit) {
      setCode(orderToEdit.code)
      setProjectId(orderToEdit.projectId)
      setWarehouseId(orderToEdit.warehouseId)
      setRequisitionId(orderToEdit.requisitionId)
      setVehiclePlate(orderToEdit.vehiclePlate || "")
      setExpectedDate(orderToEdit.expectedDate || "")
      setNotes(orderToEdit.notes || "")
      setMaterials(orderToEdit.materials || [])
      setInitialPhotos(orderToEdit.initialPhotos || [])
      setValidationError("")
    } else {
      // Create new
      const nextCode = generateNextOrderCode(existingOrders)
      setCode(nextCode)
      const defaultProj = PROJECTS[0]?.id || ""
      setProjectId(defaultProj)
      const defaultReq =
        REQUISITIONS.find((r) => r.projectId === defaultProj) || REQUISITIONS[0]
      setRequisitionId(defaultReq?.id || "")
      setWarehouseId(WAREHOUSES[0]?.id || "")
      setVehiclePlate("")
      // Tomorrow as default expected date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setExpectedDate(tomorrow.toISOString().split("T")[0])
      setNotes("")

      // Populate default materials from requisition quotas
      if (defaultReq && defaultReq.quotas) {
        const initialMats: OrderMaterialItem[] = Object.entries(
          defaultReq.quotas,
        ).map(([matId, quota]) => ({
          materialId: matId,
          approvedQty: quota,
          reqQty: Math.round(quota * 0.7),
          issuedQty: 0,
        }))
        setMaterials(initialMats)
      } else {
        setMaterials([])
      }
      setInitialPhotos([])
      setValidationError("")
    }
  }, [isOpen, orderToEdit, existingOrders])

  // When project changes, update requisition & warehouse mapping
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId)
    const firstReq = REQUISITIONS.find((r) => r.projectId === newProjId)
    if (firstReq) {
      setRequisitionId(firstReq.id)
      loadMaterialsFromRequisition(firstReq.id)
    }
    // Auto map warehouse based on project
    if (newProjId === "DA-LANDMARK") setWarehouseId("KHO-LM")
    else if (newProjId === "DA-HAMNGAM") setWarehouseId("KHO-HN")
    else if (newProjId === "DA-METRO") setWarehouseId("KHO-METRO")
    else if (newProjId === "DA-GOVAP") setWarehouseId("KHO-GV")
    else if (newProjId === "DA-BINHDUONG") setWarehouseId("KHO-BD")
  }

  const handleRequisitionChange = (newReqId: string) => {
    setRequisitionId(newReqId)
    loadMaterialsFromRequisition(newReqId)
  }

  const loadMaterialsFromRequisition = (reqId: string) => {
    const req = REQUISITIONS.find((r) => r.id === reqId)
    if (req && req.quotas) {
      const mats: OrderMaterialItem[] = Object.entries(req.quotas).map(
        ([matId, quota]) => ({
          materialId: matId,
          approvedQty: quota,
          reqQty: Math.round(quota * 0.6),
          issuedQty: 0,
        }),
      )
      setMaterials(mats)
    }
  }

  // Add material item
  const handleAddMaterial = (matId: string) => {
    if (materials.some((m) => m.materialId === matId)) return
    const req = REQUISITIONS.find((r) => r.id === requisitionId)
    const approved = req?.quotas[matId] ?? 100
    setMaterials([
      ...materials,
      { materialId: matId, approvedQty: approved, reqQty: 10, issuedQty: 0 },
    ])
  }

  // Remove material item
  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, idx) => idx !== index))
  }

  // Update material quantity
  const handleQtyChange = (index: number, val: number) => {
    const updated = [...materials]
    updated[index].reqQty = val
    setMaterials(updated)
  }

  // Upload row material photo with Canvas compression
  const handleRowPhotoUpload = async (index: number, file: File) => {
    try {
      setIsCompressing(true)
      const compressed = await compressImageFile(file, 800, 0.7)
      const updated = [...materials]
      updated[index].photo = compressed
      setMaterials(updated)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCompressing(false)
    }
  }

  // Upload document photos with Canvas compression
  const handleDocumentPhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    try {
      setIsCompressing(true)
      const compressedList: string[] = []
      for (let i = 0; i < files.length; i++) {
        const b64 = await compressImageFile(files[i], 1024, 0.75)
        compressedList.push(b64)
      }
      setInitialPhotos([...initialPhotos, ...compressedList])
    } catch (e) {
      console.error("Error compressing document photos:", e)
    } finally {
      setIsCompressing(false)
    }
  }

  // Check quota violations
  const hasQuotaExceeded = materials.some((m) => m.reqQty > m.approvedQty)

  const handleSubmit = (actionType: "save_draft" | "publish") => {
    if (!code.trim()) {
      setValidationError("Vui lòng nhập mã lệnh xuất.")
      return
    }
    if (materials.length === 0 && !isOnlyEditVehicleNotes) {
      setValidationError("Vui lòng thêm ít nhất một dòng vật tư cần xuất.")
      return
    }
    if (
      hasQuotaExceeded &&
      actionType === "publish" &&
      !isOnlyEditVehicleNotes
    ) {
      setValidationError(
        "Có dòng vật tư vượt định mức phê duyệt! Vui lòng điều chỉnh trước khi phát hành.",
      )
      return
    }

    const now = new Date()
    const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().substring(0, 5)}`

    let orderData: ExportOrder
    if (orderToEdit) {
      orderData = {
        ...orderToEdit,
        vehiclePlate: vehiclePlate.trim(),
        expectedDate: expectedDate || orderToEdit.expectedDate,
        notes: notes.trim(),
        status:
          actionType === "publish" && orderToEdit.status === "draft"
            ? "pending"
            : orderToEdit.status,
      }

      if (!isOnlyEditVehicleNotes) {
        orderData.projectId = projectId
        orderData.warehouseId = warehouseId
        orderData.requisitionId = requisitionId
        orderData.materials = materials
        orderData.initialPhotos = initialPhotos
      }

      // Append log
      orderData.logs = [
        ...orderData.logs,
        {
          time: timeStr,
          actor: `${currentUser.name} (${currentUser.role})`,
          action:
            actionType === "publish" && orderToEdit.status === "draft"
              ? "Phát hành lệnh xuất"
              : "Cập nhật thông tin lệnh",
          note: notes ? `Ghi chú: ${notes}` : undefined,
        },
      ]
    } else {
      orderData = {
        id: `ord-${Date.now()}`,
        code: code.trim(),
        status: actionType === "publish" ? "pending" : "draft",
        projectId,
        warehouseId,
        requisitionId,
        vehiclePlate: vehiclePlate.trim(),
        creatorName: currentUser.name,
        createdAt: timeStr,
        expectedDate: expectedDate || timeStr.split(" ")[0],
        notes: notes.trim(),
        materials,
        initialPhotos,
        handoverPhotos: [],
        logs: [
          {
            time: timeStr,
            actor: `${currentUser.name} (${currentUser.role})`,
            action:
              actionType === "publish"
                ? "Phát hành lệnh xuất"
                : "Tạo lệnh xuất nháp",
            note: notes ? `Ghi chú: ${notes}` : "Lập lệnh mới qua hệ thống",
          },
        ],
      }
    }

    onSave(orderData, actionType)
    onClose()
  }

  if (!isOpen) return null

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
              <i className="fas fa-file-signature" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display font-extrabold text-base sm:text-lg text-foreground">
                {isOnlyEditVehicleNotes
                  ? `Chỉnh sửa thông tin xe/ghi chú (${orderToEdit?.code})`
                  : isEditing
                    ? `Chỉnh sửa lệnh xuất nháp (${orderToEdit?.code})`
                    : "Tạo Lệnh xuất kho vật tư mới"}
              </h2>
              <div className="text-xs text-muted">
                {isOnlyEditVehicleNotes
                  ? "Lệnh đã phát hành: Chỉ cho phép cập nhật biển số xe vận chuyển và ghi chú điều phối."
                  : "Liên kết phiếu đề nghị đã duyệt và tự động gán kho phụ trách tương ứng."}
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
          {validationError && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
              <i
                className="fas fa-circle-exclamation text-rose-500"
                aria-hidden="true"
              />
              <span>{validationError}</span>
            </div>
          )}

          {/* Code, Project, Requisition, Warehouse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Mã lệnh */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Mã lệnh xuất <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                disabled={isEditing}
                onChange={(e) => setCode(e.target.value)}
                placeholder="LX-2026-XXXX"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>

            {/* Dự án */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Công trình / Dự án nhận <span className="text-rose-500">*</span>
              </label>
              <select
                value={projectId}
                disabled={isOnlyEditVehicleNotes}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Phiếu đề nghị */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Phiếu đề nghị xuất đã duyệt{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={requisitionId}
                disabled={isOnlyEditVehicleNotes}
                onChange={(e) => handleRequisitionChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                {availableRequisitions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} - {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Kho xuất tự động gán */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Kho xuất vật tư (Tự động gán theo phiếu){" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                value={warehouseId}
                disabled={isOnlyEditVehicleNotes}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Thủ kho: {w.keeperName})
                  </option>
                ))}
              </select>
            </div>

            {/* Biển số xe */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Biển số xe / Phương tiện vận chuyển
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="VD: 51C-882.14, Xe cẩu 10T..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Ngày dự kiến xuất */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Ngày dự kiến xuất kho
              </label>
              <input
                type="date"
                value={expectedDate}
                disabled={isOnlyEditVehicleNotes}
                onChange={(e) => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              Ghi chú điều phối &amp; Hướng dẫn giao nhận
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú yêu cầu đặc biệt về niêm chì, khung giờ xe vào công trình, số điện thoại phụ trách bốc dỡ..."
              className="w-full px-3 py-2 rounded-xl border border-border bg-input text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Danh mục vật tư xuất kho (Read-only if only editing vehicle/notes) */}
          {!isOnlyEditVehicleNotes && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <i
                      className="fas fa-boxes-stacked text-primary"
                      aria-hidden="true"
                    />
                    <span>
                      Danh mục vật tư xuất kho ({materials.length} loại)
                    </span>
                  </h3>
                  <div className="text-[11px] text-muted">
                    Hạn mức phê duyệt lấy từ phiếu đề nghị. Cảnh báo đỏ nếu đề
                    xuất vượt mức.
                  </div>
                </div>

                {/* Quick Add Dropdown */}
                <select
                  aria-label="Thêm vật tư vào lệnh"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddMaterial(e.target.value)
                      e.target.value = ""
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 text-xs font-bold bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-xl cursor-pointer"
                >
                  <option value="" disabled>
                    + Thêm vật tư khác...
                  </option>
                  {MATERIALS.filter(
                    (m) => !materials.some((im) => im.materialId === m.id),
                  ).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface text-muted uppercase text-[11px] font-bold border-b border-border">
                    <tr>
                      <th className="p-2.5">Vật tư</th>
                      <th className="p-2.5 text-center w-16">ĐVT</th>
                      <th className="p-2.5 text-center w-24">
                        Hạn mức (Được duyệt)
                      </th>
                      <th className="p-2.5 text-center w-28">SL Đề xuất</th>
                      <th className="p-2.5 text-center w-24">Ảnh vật tư</th>
                      <th className="p-2.5 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materials.map((m, idx) => {
                      const mat = getMaterialById(m.materialId)
                      const isOver = m.reqQty > m.approvedQty
                      return (
                        <tr
                          key={m.materialId}
                          className={isOver ? "bg-rose-500/10" : ""}
                        >
                          <td className="p-2.5 font-medium text-foreground">
                            <div>{mat?.name || m.materialId}</div>
                            <div className="text-[11px] font-mono text-muted">
                              {mat?.code}
                            </div>
                          </td>
                          <td className="p-2.5 text-center text-muted">
                            {mat?.unit || "Cái"}
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold text-muted">
                            {m.approvedQty}
                          </td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min={1}
                              value={m.reqQty}
                              onChange={(e) =>
                                handleQtyChange(
                                  idx,
                                  Number(e.target.value) || 0,
                                )
                              }
                              className={`w-20 px-2 py-1 text-center font-bold font-mono border rounded-lg bg-input text-foreground ${
                                isOver
                                  ? "border-rose-500 text-rose-600 focus:ring-rose-500"
                                  : "border-border focus:ring-primary"
                              }`}
                            />
                            {isOver && (
                              <div className="text-[10px] text-rose-500 font-bold mt-0.5">
                                Vượt {m.reqQty - m.approvedQty}!
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-border hover:bg-surface text-muted hover:text-foreground">
                              <i
                                className="fas fa-camera text-primary"
                                aria-hidden="true"
                              />
                              <span>{m.photo ? "Đã có ảnh" : "Tải ảnh"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleRowPhotoUpload(idx, e.target.files[0])
                                  }
                                }}
                              />
                            </label>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(idx)}
                              aria-label={`Xóa vật tư ${mat?.name}`}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted hover:text-rose-500 hover:bg-surface cursor-pointer"
                            >
                              <i
                                className="fas fa-trash-can text-xs"
                                aria-hidden="true"
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Đính kèm hồ sơ & chứng từ (Canvas compression) */}
          {!isOnlyEditVehicleNotes && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <i
                      className="fas fa-paperclip text-primary"
                      aria-hidden="true"
                    />
                    <span>Hồ sơ chứng từ đính kèm (Nén tự động Canvas)</span>
                  </h3>
                  <div className="text-[11px] text-muted">
                    Phiếu đề nghị đã ký, hợp đồng, chứng chỉ CO/CQ. Ảnh tự động
                    nén tối ưu bộ nhớ.
                  </div>
                </div>

                <label className="px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-xs cursor-pointer flex items-center gap-1.5">
                  <i
                    className="fas fa-cloud-arrow-up text-xs"
                    aria-hidden="true"
                  />
                  <span>
                    {isCompressing ? "Đang nén..." : "+ Tải ảnh chứng từ"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={isCompressing}
                    className="hidden"
                    onChange={(e) => handleDocumentPhotoUpload(e.target.files)}
                  />
                </label>
              </div>

              {initialPhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-2">
                  {initialPhotos.map((src, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-surface"
                    >
                      <img
                        src={src}
                        alt={`Chứng từ ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setInitialPhotos(
                            initialPhotos.filter((_, i) => i !== idx),
                          )
                        }
                        className="absolute top-1 right-1 w-6 h-6 rounded-md bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <i className="fas fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                  Chưa có chứng từ đính kèm. Bấm "+ Tải ảnh chứng từ" để bổ sung
                  phiếu đề nghị đã ký.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-surface/70 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-surface text-foreground font-semibold text-xs cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            {!isOnlyEditVehicleNotes && (
              <button
                type="button"
                onClick={() => handleSubmit("save_draft")}
                className="px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-surface text-foreground font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
              >
                <i
                  className="fas fa-floppy-disk text-muted"
                  aria-hidden="true"
                />
                <span>Lưu nháp</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSubmit("publish")}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-2 shadow-brand"
            >
              <i className="fas fa-paper-plane" aria-hidden="true" />
              <span>
                {isOnlyEditVehicleNotes
                  ? "Lưu cập nhật"
                  : isEditing
                    ? "Phát hành lệnh ngay"
                    : "Phát hành lệnh xuất"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
