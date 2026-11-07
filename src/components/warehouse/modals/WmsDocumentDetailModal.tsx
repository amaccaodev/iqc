import React, { useState } from "react";
import type { Product, Warehouse, WmsDataState, WmsDocument, WmsRole } from "../../../types/wms";
import { applyStockPosting, hasPermission, saveWmsData } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsDocumentDetailModalProps {
  doc: WmsDocument | null;
  onClose: () => void;
  data: WmsDataState;
  currentActor: string;
  currentRole: WmsRole;
  onUpdateState: (newState: WmsDataState) => void;
  onEditDoc?: (doc: WmsDocument) => void;
}

export const WmsDocumentDetailModal: React.FC<WmsDocumentDetailModalProps> = ({
  doc,
  onClose,
  data,
  currentActor,
  currentRole,
  onUpdateState,
  onEditDoc,
}) => {
  if (!doc) return null;

  // Execution modal state (entering actual quantities)
  const [isExecModalOpen, setIsExecModalOpen] = useState(false);
  const [actualQtys, setActualQtys] = useState<Record<number, number>>({});
  const [execError, setExecError] = useState("");

  // Rejection modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Transfer difference resolution modal state
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffReason, setDiffReason] = useState("");

  // Transfer dispatch / receive state
  const [transferMode, setTransferMode] = useState<"dispatch" | "receive">("dispatch");

  const productMap = new Map<string, Product>(data.products.map((p) => [p.id, p]));
  const warehouseMap = new Map<string, Warehouse>(data.warehouses.map((w) => [w.id, w]));

  const originWh = warehouseMap.get(doc.warehouseId);
  const targetWh = doc.targetWarehouseId ? warehouseMap.get(doc.targetWarehouseId) : null;

  // Permissions & Segregation of Duties
  const isCreator = doc.creator === currentActor;
  const canApprove =
    hasPermission(
      currentRole,
      doc.type === "inbound" ? "approve_inbound" : "approve_outbound",
    ) && !isCreator; // Segregation of duties: Creator cannot self-approve!

  const canConfirm =
    hasPermission(
      currentRole,
      doc.type === "inbound" ? "confirm_inbound" : "confirm_outbound",
    ) &&
    doc.status === "approved" &&
    !doc.posted;

  const canTransferDispatch =
    doc.type === "transfer" &&
    hasPermission(currentRole, "dispatch_transfer") &&
    doc.status === "approved" &&
    !doc.dispatchedAt;

  const canTransferReceive =
    doc.type === "transfer" &&
    hasPermission(currentRole, "receive_transfer") &&
    (doc.status === "in_transit" || doc.status === "partially_received");

  const canResolveDiff =
    doc.type === "transfer" &&
    hasPermission(currentRole, "resolve_transfer") &&
    (doc.status === "in_transit" || doc.status === "partially_received") &&
    !doc.transferResolved;

  // 1. APPROVE
  const handleApprove = () => {
    if (isCreator) {
      alert("Quy tắc tách biệt nghiệp vụ (Segregation of Duties): Người tạo phiếu không thể tự phê duyệt.");
      return;
    }
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    targetDoc.status = "approved";
    targetDoc.approver = currentActor;
    targetDoc.approvedAt = new Date().toISOString();
    targetDoc.updatedAt = new Date().toISOString();

    saveWmsData(cloned);
    onUpdateState(cloned);
  };

  // 2. REJECT
  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    targetDoc.status = "rejected";
    targetDoc.rejectionReason = rejectReason.trim();
    targetDoc.rejectionHistory = targetDoc.rejectionHistory || [];
    targetDoc.rejectionHistory.push({
      reason: rejectReason.trim(),
      actor: currentActor,
      at: new Date().toISOString(),
    });
    targetDoc.updatedAt = new Date().toISOString();

    saveWmsData(cloned);
    onUpdateState(cloned);
    setIsRejectModalOpen(false);
  };

  // 3. RETURN FOR EDIT
  const handleReturn = () => {
    const reason = prompt("Nhập lý do yêu cầu chỉnh sửa và nộp lại:");
    if (!reason || !reason.trim()) return;

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    targetDoc.status = "returned";
    targetDoc.returnReason = reason.trim();
    targetDoc.returnHistory = targetDoc.returnHistory || [];
    targetDoc.returnHistory.push({
      reason: reason.trim(),
      actor: currentActor,
      at: new Date().toISOString(),
    });
    targetDoc.updatedAt = new Date().toISOString();

    saveWmsData(cloned);
    onUpdateState(cloned);
  };

  // 4. PHYSICAL CONFIRMATION (Inbound / Outbound)
  const handleOpenExecution = () => {
    const initialQtys: Record<number, number> = {};
    doc.items.forEach((item, idx) => {
      initialQtys[idx] = item.actualQty !== undefined ? item.actualQty : item.qty;
    });
    setActualQtys(initialQtys);
    setExecError("");
    setIsExecModalOpen(true);
  };

  const handleSaveExecution = (e: React.FormEvent) => {
    e.preventDefault();
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    const linesToPost = targetDoc.items.map((item, idx) => ({
      productId: item.productId,
      qty: Number(actualQtys[idx]) || 0,
      lot: item.lot,
    }));

    if (linesToPost.some((l) => l.qty <= 0)) {
      setExecError("Số lượng thực tế của mỗi mặt hàng phải lớn hơn 0.");
      return;
    }

    const sign = doc.type === "inbound" ? 1 : -1;
    const result = applyStockPosting(
      cloned,
      targetDoc,
      sign,
      doc.warehouseId,
      doc.companyId,
      linesToPost,
      currentActor,
      currentRole,
    );

    if (!result.success) {
      setExecError(result.error || "Ghi nhận biến động tồn kho thất bại.");
      return;
    }

    // Save actual quantities to items
    targetDoc.items.forEach((item, idx) => {
      item.actualQty = Number(actualQtys[idx]) || 0;
    });
    targetDoc.status = "completed";
    targetDoc.executionStatus = "executed";

    saveWmsData(cloned);
    onUpdateState(cloned);
    setIsExecModalOpen(false);
  };

  // 5. TRANSFER DISPATCH
  const handleOpenTransferDispatch = () => {
    setTransferMode("dispatch");
    const initialQtys: Record<number, number> = {};
    doc.items.forEach((item, idx) => {
      initialQtys[idx] = item.shippedQty || item.requestedQty || item.qty;
    });
    setActualQtys(initialQtys);
    setExecError("");
    setIsExecModalOpen(true);
  };

  // 6. TRANSFER RECEIVE
  const handleOpenTransferReceive = () => {
    setTransferMode("receive");
    const initialQtys: Record<number, number> = {};
    doc.items.forEach((item, idx) => {
      const pendingReceive = (item.shippedQty || 0) - (item.receivedQty || 0);
      initialQtys[idx] = Math.max(0, pendingReceive);
    });
    setActualQtys(initialQtys);
    setExecError("");
    setIsExecModalOpen(true);
  };

  const handleSaveTransferMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    const isReceiving = transferMode === "receive";
    const warehouseId = isReceiving ? targetDoc.targetWarehouseId! : targetDoc.warehouseId;
    const companyId = isReceiving ? targetDoc.targetCompanyId! : targetDoc.companyId;

    const movements = targetDoc.items.map((item, idx) => ({
      productId: item.productId,
      qty: Number(actualQtys[idx]) || 0,
      lot: item.lot,
    }));

    if (movements.every((m) => m.qty <= 0)) {
      setExecError("Cần nhập số lượng thực tế lớn hơn 0.");
      return;
    }

    const sign = isReceiving ? 1 : -1;
    const postingKey = isReceiving ? `stock_receive_${Date.now()}` : "stock_dispatch";

    const result = applyStockPosting(
      cloned,
      targetDoc,
      sign,
      warehouseId,
      companyId,
      movements.filter((m) => m.qty > 0),
      currentActor,
      currentRole,
      postingKey,
    );

    if (!result.success) {
      setExecError(result.error || "Không thể thực hiện chuyển kho.");
      return;
    }

    const now = new Date().toISOString();
    if (!isReceiving) {
      targetDoc.items.forEach((item, idx) => {
        item.shippedQty = Number(actualQtys[idx]) || 0;
      });
      targetDoc.dispatchedAt = now;
      targetDoc.status = "in_transit";
    } else {
      targetDoc.items.forEach((item, idx) => {
        item.receivedQty = (item.receivedQty || 0) + (Number(actualQtys[idx]) || 0);
      });
      targetDoc.receivedAt = now;

      // Check if all received
      const allDone = targetDoc.items.every(
        (item) => (item.receivedQty || 0) >= (item.shippedQty || 0),
      );
      targetDoc.status = allDone ? "completed" : "partially_received";
    }

    saveWmsData(cloned);
    onUpdateState(cloned);
    setIsExecModalOpen(false);
  };

  // 7. RESOLVE TRANSFER DIFFERENCE
  const handleSaveTransferDifference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diffReason.trim()) return;

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const targetDoc = cloned.docs.find((d) => d.id === doc.id);
    if (!targetDoc) return;

    const now = new Date().toISOString();
    const lines = targetDoc.items.map((item) => ({
      productId: item.productId,
      lot: item.lot || "—",
      unshippedQty: Math.max(0, (item.requestedQty || item.qty) - (item.shippedQty || 0)),
      shippedNotReceivedQty: Math.max(0, (item.shippedQty || 0) - (item.receivedQty || 0)),
    }));

    targetDoc.transferResolved = true;
    targetDoc.transferResolution = {
      reason: diffReason.trim(),
      actor: currentActor,
      at: now,
      lines,
    };
    targetDoc.status = "completed";

    saveWmsData(cloned);
    onUpdateState(cloned);
    setIsDiffModalOpen(false);
  };

  // Print slip
  const handlePrint = () => {
    window.print();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-green-500/10 text-green-600 border-green-500/20",
    in_transit: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    partially_received: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
    rejected: "bg-red-500/10 text-red-600 border-red-500/20",
    returned: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/10 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base font-extrabold text-primary">{doc.id}</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                statusColors[doc.status] || "bg-muted text-muted-foreground border-border"
              }`}
            >
              {doc.status}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {doc.type === "inbound"
                ? "Phiếu nhập kho"
                : doc.type === "outbound"
                  ? "Phiếu xuất kho"
                  : "Phiếu điều chuyển"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 rounded border border-border text-xs font-semibold hover:bg-surface-2 flex items-center gap-1 text-muted-foreground hover:text-foreground"
              title="In phiếu A4 chuẩn"
            >
              <WmsIcon name="printer" size={14} />
              <span>In phiếu A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
            >
              <WmsIcon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Printable Section / Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Print Header only visible on print */}
          <div className="hidden print:block text-center border-b border-border pb-4 mb-4">
            <h1 className="text-lg font-black uppercase">
              {doc.type === "inbound"
                ? "PHIẾU NHẬP KHO VẬT TƯ"
                : doc.type === "outbound"
                  ? "PHIẾU XUẤT KHO VẬT TƯ"
                  : "LỆNH ĐIỀU CHUYỂN NỘI BỘ"}
            </h1>
            <p className="text-xs text-muted-foreground">Mã chứng từ: {doc.id} · Ngày: {doc.documentDate}</p>
          </div>

          {/* Alert Callouts */}
          {doc.status === "rejected" && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400">
              <strong className="block mb-0.5">Phiếu đã bị từ chối phê duyệt</strong>
              <p>Lý do: {doc.rejectionReason}</p>
            </div>
          )}

          {doc.status === "returned" && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400">
              <strong className="block mb-0.5">Phiếu được trả về để chỉnh sửa</strong>
              <p>Ghi chú: {doc.returnReason}</p>
            </div>
          )}

          {/* Workflow Progress Banner */}
          <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  doc.status !== "draft" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Tạo lập</span>
              </div>
              <span>→</span>
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  ["approved", "in_transit", "partially_received", "completed"].includes(doc.status)
                    ? "text-primary"
                    : doc.status === "pending"
                      ? "text-amber-600"
                      : "text-muted-foreground"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Phê duyệt</span>
              </div>
              <span>→</span>
              <div
                className={`flex items-center gap-1.5 font-bold ${
                  doc.status === "completed" ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Thực tế & Ghi sổ kho</span>
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground">
              Người tạo: <strong>{doc.creator}</strong> · Ngày lập: {doc.createdAt}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border bg-card">
            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Công ty
              </span>
              <span className="font-semibold text-foreground">{doc.companyId}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Kho {doc.type === "transfer" ? "nguồn" : "phụ trách"}
              </span>
              <span className="font-semibold text-foreground">
                {originWh?.name || doc.warehouseId}
              </span>
            </div>

            {doc.type === "transfer" && (
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                  Kho đích nhận
                </span>
                <span className="font-semibold text-teal-600">
                  {targetWh?.name || doc.targetWarehouseId}
                </span>
              </div>
            )}

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Loại nghiệp vụ
              </span>
              <span className="font-semibold text-foreground">{doc.kind || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Đối tác / Phân xưởng
              </span>
              <span className="font-semibold text-foreground">{doc.partner || "—"}</span>
            </div>

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Chứng từ tham chiếu
              </span>
              <span className="font-mono font-semibold text-foreground">{doc.reference || "—"}</span>
            </div>

            {/* Inbound source breakdown */}
            {doc.inboundSource && (
              <>
                {doc.inboundSource.purchaseOrder && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Số đơn mua (PO)
                    </span>
                    <span className="font-mono font-semibold">{doc.inboundSource.purchaseOrder}</span>
                  </div>
                )}
                {doc.inboundSource.voucherNo && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Số hóa đơn
                    </span>
                    <span className="font-mono font-semibold">{doc.inboundSource.voucherNo}</span>
                  </div>
                )}
                {doc.inboundSource.productionOrder && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                      Lệnh sản xuất
                    </span>
                    <span className="font-mono font-semibold">{doc.inboundSource.productionOrder}</span>
                  </div>
                )}
              </>
            )}

            <div>
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                Người phê duyệt
              </span>
              <span className="font-semibold text-foreground">{doc.approver || "Chưa duyệt"}</span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Danh sách vật tư / hàng hóa
              </h3>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {doc.items.length} mặt hàng
              </span>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                    <th className="py-2.5 px-3">Mã hàng</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Số lô</th>
                    <th className="py-2.5 px-3 text-right">SL Đề xuất</th>
                    {doc.type === "transfer" ? (
                      <>
                        <th className="py-2.5 px-3 text-right">Đã xuất đi</th>
                        <th className="py-2.5 px-3 text-right">Đã nhận kho đích</th>
                      </>
                    ) : (
                      <th className="py-2.5 px-3 text-right">SL Thực tế</th>
                    )}
                    <th className="py-2.5 px-3">ĐVT</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá vốn</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {doc.items.map((item, idx) => {
                    const prod = productMap.get(item.productId);
                    const qty = item.actualQty !== undefined ? item.actualQty : item.qty;
                    const cost = item.costPrice || prod?.costPrice || 0;
                    return (
                      <tr key={idx} className="hover:bg-muted/10 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">{item.productId}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground">{prod?.name || "—"}</td>
                        <td className="py-2.5 px-3 font-mono">{item.lot || "—"}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {item.qty.toLocaleString("vi-VN")}
                        </td>

                        {doc.type === "transfer" ? (
                          <>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-teal-600">
                              {(item.shippedQty || 0).toLocaleString("vi-VN")}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-green-600">
                              {(item.receivedQty || 0).toLocaleString("vi-VN")}
                            </td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-right font-mono font-black text-foreground">
                            {item.actualQty !== undefined
                              ? item.actualQty.toLocaleString("vi-VN")
                              : "Chưa ghi nhận"}
                          </td>
                        )}

                        <td className="py-2.5 px-3 text-muted-foreground">{item.unit || prod?.unit}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                          {cost ? `${cost.toLocaleString("vi-VN")} đ` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                          {cost ? `${(cost * qty).toLocaleString("vi-VN")} đ` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transfer Difference Summary if any */}
          {doc.transferResolved && doc.transferResolution && (
            <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-500/5 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold">
                <WmsIcon name="check" size={16} />
                <span>Đã kết thúc điều chuyển có chênh lệch</span>
              </div>
              <p className="text-xs text-foreground">Lý do: {doc.transferResolution.reason}</p>
              <div className="text-[11px] text-muted-foreground">
                Xử lý bởi: {doc.transferResolution.actor} lúc {doc.transferResolution.at}
              </div>
            </div>
          )}

          {/* Action Bar (Only visible on screen) */}
          <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              {isCreator && ["draft", "returned"].includes(doc.status) && onEditDoc && (
                <button
                  type="button"
                  onClick={() => onEditDoc(doc)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-semibold hover:bg-surface-2"
                >
                  Chỉnh sửa phiếu
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Segregation of duties alert if creator attempts to approve */}
              {doc.status === "pending" && isCreator && (
                <span className="text-[11px] text-amber-600 font-medium px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20">
                  ⚠️ Không thể tự duyệt phiếu do mình tạo
                </span>
              )}

              {/* Approval Buttons */}
              {doc.status === "pending" && canApprove && (
                <>
                  <button
                    type="button"
                    onClick={handleReturn}
                    className="h-8 px-3 rounded-md border border-border text-xs font-semibold hover:bg-surface-2"
                  >
                    Trả về sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(true)}
                    className="h-8 px-3 rounded-md border border-red-500/30 text-red-600 text-xs font-semibold hover:bg-red-500/10"
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90"
                  >
                    Phê duyệt
                  </button>
                </>
              )}

              {/* Step 2: Physical Confirmation Buttons */}
              {canConfirm && (
                <button
                  type="button"
                  onClick={handleOpenExecution}
                  className="h-8 px-4 rounded-md bg-green-600 text-white text-xs font-semibold shadow-xs hover:bg-green-700 flex items-center gap-1.5"
                >
                  <WmsIcon name="check" size={14} />
                  <span>Xác nhận {doc.type === "inbound" ? "nhập" : "xuất"} thực tế & Ghi sổ</span>
                </button>
              )}

              {/* Transfer Actions */}
              {canTransferDispatch && (
                <button
                  type="button"
                  onClick={handleOpenTransferDispatch}
                  className="h-8 px-4 rounded-md bg-teal-600 text-white text-xs font-semibold shadow-xs hover:bg-teal-700 flex items-center gap-1.5"
                >
                  <WmsIcon name="outbound" size={14} />
                  <span>Xuất chuyển kho (Bắt đầu vận chuyển)</span>
                </button>
              )}

              {canTransferReceive && (
                <button
                  type="button"
                  onClick={handleOpenTransferReceive}
                  className="h-8 px-4 rounded-md bg-green-600 text-white text-xs font-semibold shadow-xs hover:bg-green-700 flex items-center gap-1.5"
                >
                  <WmsIcon name="inbound" size={14} />
                  <span>Xác nhận nhận hàng tại kho đích</span>
                </button>
              )}

              {canResolveDiff && (
                <button
                  type="button"
                  onClick={() => setIsDiffModalOpen(true)}
                  className="h-8 px-3 rounded-md border border-amber-500/40 text-amber-700 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/10"
                >
                  Xử lý chênh lệch & Đóng lệnh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Sub-Modal (Input actual quantities) */}
      {isExecModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {doc.type === "transfer"
                  ? transferMode === "dispatch"
                    ? "Nhập số lượng thực xuất chuyển kho"
                    : "Nhập số lượng thực nhận tại kho đích"
                  : `Xác nhận số lượng thực tế: ${doc.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setIsExecModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form
              onSubmit={doc.type === "transfer" ? handleSaveTransferMovement : handleSaveExecution}
              className="p-5 space-y-4 text-xs"
            >
              {execError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 font-medium">
                  {execError}
                </div>
              )}

              <p className="text-muted-foreground">
                Nhập số lượng thực tế kiểm đếm. Số tồn kho chỉ thay đổi sau khi xác nhận; hệ thống hỗ trợ giao nhận từng phần (Partial Delivery).
              </p>

              <div className="space-y-3">
                {doc.items.map((item, idx) => {
                  const prod = productMap.get(item.productId);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-border bg-muted/10 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-foreground">{prod?.name || item.productId}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Lô: {item.lot || "—"} · Yêu cầu: {item.qty} {prod?.unit}
                        </div>
                      </div>

                      <div className="w-32">
                        <input
                          type="number"
                          step="any"
                          min={0}
                          value={actualQtys[idx] ?? item.qty}
                          onChange={(e) =>
                            setActualQtys({
                              ...actualQtys,
                              [idx]: Number(e.target.value),
                            })
                          }
                          className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExecModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-green-600 text-white text-xs font-semibold hover:bg-green-700 shadow-xs"
                >
                  Xác nhận vào sổ kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-600">Từ chối phê duyệt phiếu {doc.id}</h3>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleReject} className="p-5 space-y-3.5 text-xs">
              <p className="text-muted-foreground">
                Vui lòng nhập lý do từ chối để thông báo cho người lập phiếu chỉnh sửa hoặc giải trình.
              </p>

              <div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  placeholder="Ví dụ: Thiếu biên bản nghiệm thu; Sai đơn giá..."
                  className="w-full h-24 p-2.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shadow-xs"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Diff Resolution Modal */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold">Kết thúc điều chuyển có chênh lệch</h3>
              <button
                type="button"
                onClick={() => setIsDiffModalOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveTransferDifference} className="p-5 space-y-3.5 text-xs">
              <p className="text-muted-foreground">
                Giải trình lý do đóng lệnh khi bên nhận không nhận đủ số lượng điều chuyển (hao hụt, bể vỡ trong vận chuyển, bên gửi giữ lại...).
              </p>

              <div>
                <textarea
                  value={diffReason}
                  onChange={(e) => setDiffReason(e.target.value)}
                  required
                  placeholder="Ví dụ: Hao hụt tự nhiên do đóng gói; Đơn vị nhận chỉ cần số lượng thực giao..."
                  className="w-full h-24 p-2.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDiffModalOpen(false)}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:bg-muted/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 shadow-xs"
                >
                  Ghi nhận xử lý chênh lệch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

