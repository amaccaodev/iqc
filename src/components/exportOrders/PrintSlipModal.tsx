import type { ExportOrder } from "../../types/exportOrder"
import {
  getMaterialById,
  getProjectById,
  getRequisitionById,
  getWarehouseById,
} from "../../services/exportOrderStorage"

interface PrintSlipModalProps {
  order: ExportOrder | null
  onClose: () => void
}

export default function PrintSlipModal({
  order,
  onClose,
}: PrintSlipModalProps) {
  if (!order) return null

  const project = getProjectById(order.projectId)
  const warehouse = getWarehouseById(order.warehouseId)
  const requisition = getRequisitionById(order.requisitionId)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-4xl bg-card rounded-2xl shadow-modal border border-border flex flex-col max-h-[92vh]">
        {/* Top Action Bar (Hidden on print) */}
        <div className="print:hidden flex items-center justify-between p-4 border-b border-border bg-surface rounded-t-2xl">
          <div className="flex items-center gap-2">
            <i
              className="fas fa-print text-primary text-base"
              aria-hidden="true"
            />
            <span className="font-extrabold text-sm sm:text-base text-foreground">
              Xem trước Bản in Phiếu xuất kho A4 ({order.code})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm cursor-pointer transition-all flex items-center gap-2 shadow-sm"
            >
              <i className="fas fa-print" aria-hidden="true" />
              <span>In phiếu ngay (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng xem trước"
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card hover:bg-surface border border-border text-foreground transition-colors cursor-pointer"
            >
              <i className="fas fa-xmark text-sm" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area (A4 layout styling) */}
        <div className="p-6 sm:p-10 overflow-y-auto print:p-0 print:overflow-visible bg-white text-black font-sans text-[13px] leading-relaxed">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
            <div>
              <div className="font-bold text-base uppercase tracking-tight">
                CÔNG TY CỔ PHẦN CÔNG NGHỆ ĐỒNG (COPEX IQC)
              </div>
              <div className="text-xs text-neutral-600">
                Hệ thống Quản lý Sản xuất &amp; Điều phối Vật tư Công trình
              </div>
              <div className="text-xs text-neutral-600">
                Hotline điều phối: 1900-8888 | www.copex-iqc.vn
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm">Mẫu số: 02-VT</div>
              <div className="text-xs text-neutral-600">
                (Ban hành theo Thông tư 200/2014/TT-BTC)
              </div>
              <div className="font-mono text-xs font-bold mt-1">
                Số lệnh: <span className="text-red-700">{order.code}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
              PHIẾU XUẤT KHO VẬT TƯ KIÊM BIÊN BẢN BÀN GIAO
            </h1>
            <div className="text-xs italic text-neutral-600 mt-1">
              Ngày xuất dự kiến: {order.expectedDate} · Ngày lập phiếu:{" "}
              {order.createdAt}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-2 gap-x-6 mb-6 text-xs sm:text-sm">
            <div>
              <span className="font-bold">Công trình / Dự án nhận:</span>{" "}
              {project ? project.name : "N/A"}
            </div>
            <div>
              <span className="font-bold">Kho xuất hàng:</span>{" "}
              {warehouse ? warehouse.name : "N/A"}
            </div>
            <div>
              <span className="font-bold">Căn cứ Phiếu đề nghị:</span>{" "}
              {requisition
                ? `${requisition.code} (${requisition.title})`
                : "N/A"}
            </div>
            <div>
              <span className="font-bold">Phương tiện / Biển số xe:</span>{" "}
              <span className="font-mono font-bold">
                {order.vehiclePlate || "Chưa gán"}
              </span>
            </div>
            <div>
              <span className="font-bold">Người lập lệnh:</span>{" "}
              {order.creatorName}
            </div>
            <div>
              <span className="font-bold">Thủ kho phụ trách:</span>{" "}
              {warehouse?.keeperName || "Thủ kho"}
            </div>
            {order.notes && (
              <div className="col-span-2 italic text-neutral-700">
                <span className="font-bold not-italic">Ghi chú điều phối:</span>{" "}
                {order.notes}
              </div>
            )}
          </div>

          {/* Material Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-black text-xs sm:text-sm">
              <thead>
                <tr className="bg-neutral-100 text-center font-bold">
                  <th className="border border-black p-2 w-10">STT</th>
                  <th className="border border-black p-2 text-left">
                    Tên vật tư, quy cách
                  </th>
                  <th className="border border-black p-2 w-16">ĐVT</th>
                  <th className="border border-black p-2 w-20">Được duyệt</th>
                  <th className="border border-black p-2 w-20">Yêu cầu</th>
                  <th className="border border-black p-2 w-20">Thực xuất</th>
                  <th className="border border-black p-2 w-20">Còn lại</th>
                  <th className="border border-black p-2 w-28">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {order.materials.map((m, idx) => {
                  const mat = getMaterialById(m.materialId)
                  const remaining = Math.max(
                    0,
                    (m.reqQty || 0) - (m.issuedQty || 0),
                  )
                  return (
                    <tr key={m.materialId} className="text-center">
                      <td className="border border-black p-2">{idx + 1}</td>
                      <td className="border border-black p-2 text-left font-medium">
                        <div>{mat?.name || m.materialId}</div>
                        <div className="text-[11px] font-mono text-neutral-600">
                          {mat?.code}
                        </div>
                      </td>
                      <td className="border border-black p-2">
                        {mat?.unit || "Cái"}
                      </td>
                      <td className="border border-black p-2 font-mono">
                        {m.approvedQty}
                      </td>
                      <td className="border border-black p-2 font-mono font-bold">
                        {m.reqQty}
                      </td>
                      <td className="border border-black p-2 font-mono font-bold text-blue-800">
                        {m.issuedQty}
                      </td>
                      <td className="border border-black p-2 font-mono text-red-700">
                        {remaining}
                      </td>
                      <td className="border border-black p-2 text-left text-xs italic">
                        {remaining === 0 ? "Xuất đủ" : `Còn thiếu ${remaining}`}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-4 gap-4 text-center mt-12 pt-4">
            <div>
              <div className="font-bold text-xs uppercase">Người lập phiếu</div>
              <div className="text-[11px] italic text-neutral-500">
                (Ký, họ tên)
              </div>
              <div className="h-16" />
              <div className="font-bold text-xs">{order.creatorName}</div>
            </div>
            <div>
              <div className="font-bold text-xs uppercase">
                Người vận chuyển
              </div>
              <div className="text-[11px] italic text-neutral-500">
                (Ký, họ tên)
              </div>
              <div className="h-16" />
              <div className="font-bold text-xs">
                {order.vehiclePlate || "Lái xe"}
              </div>
            </div>
            <div>
              <div className="font-bold text-xs uppercase">Thủ kho xuất</div>
              <div className="text-[11px] italic text-neutral-500">
                (Ký, họ tên)
              </div>
              <div className="h-16" />
              <div className="font-bold text-xs">
                {warehouse?.keeperName || "Thủ kho"}
              </div>
            </div>
            <div>
              <div className="font-bold text-xs uppercase">
                Đại diện nhận hàng
              </div>
              <div className="text-[11px] italic text-neutral-500">
                (Ký, họ tên)
              </div>
              <div className="h-16" />
              <div className="font-bold text-xs">Chỉ huy trưởng CT</div>
            </div>
          </div>

          {/* Footer print info */}
          <div className="mt-12 text-[10px] text-neutral-500 text-center border-t border-neutral-300 pt-3">
            In từ hệ thống Quản lý Sản xuất &amp; Đo kiểm COPEX IQC · Bản quyền
            thuộc CTCP Công nghệ Đồng · Thời gian in:{" "}
            {new Date().toLocaleString("vi-VN")}
          </div>
        </div>
      </div>
    </div>
  )
}
