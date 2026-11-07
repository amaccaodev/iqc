import React, { useState } from "react";
import type { Warehouse, WmsDataState, WmsDocument, WmsRole } from "../../../types/wms";
import { hasPermission, logAuditAction, saveWmsData } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsApprovalsViewProps {
  data: WmsDataState;
  scopedWarehouses: Warehouse[];
  scopedDocs: WmsDocument[];
  currentActor: string;
  currentRole: WmsRole;
  onOpenDoc: (doc: WmsDocument) => void;
  onUpdateState: (newState: WmsDataState) => void;
}

export const WmsApprovalsView: React.FC<WmsApprovalsViewProps> = ({
  data,
  scopedDocs,
  currentActor,
  currentRole,
  onOpenDoc,
  onUpdateState,
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Reject modal state
  const [rejectingDoc, setRejectingDoc] = useState<WmsDocument | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const pendingDocs = scopedDocs.filter(
    (d) => d.status === "pending" && (filterType === "all" || d.type === filterType),
  );

  const filteredDocs = pendingDocs.filter((doc) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        doc.id.toLowerCase().includes(q) ||
        (doc.partner || "").toLowerCase().includes(q) ||
        (doc.creator || "").toLowerCase().includes(q) ||
        (doc.reference || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApprove = (doc: WmsDocument) => {
    if (doc.creator === currentActor) {
      alert("Quy tắc tách biệt nghiệp vụ: Bạn là người tạo phiếu nên không thể tự phê duyệt.");
      return;
    }

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const target = cloned.docs.find((d) => d.id === doc.id);
    if (!target) return;

    target.status = "approved";
    target.approver = currentActor;
    target.approvedAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();

    logAuditAction(cloned, "Phê duyệt phiếu", currentActor, currentRole, target.id);
    saveWmsData(cloned);
    onUpdateState(cloned);
  };

  const handleReturn = (doc: WmsDocument) => {
    const reason = prompt("Nhập lý do trả về để chỉnh sửa:");
    if (!reason || !reason.trim()) return;

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const target = cloned.docs.find((d) => d.id === doc.id);
    if (!target) return;

    target.status = "returned";
    target.returnReason = reason.trim();
    target.returnHistory = target.returnHistory || [];
    target.returnHistory.push({
      reason: reason.trim(),
      actor: currentActor,
      at: new Date().toISOString(),
    });
    target.updatedAt = new Date().toISOString();

    logAuditAction(cloned, "Trả về chỉnh sửa", currentActor, currentRole, target.id, [
      { field: "Lý do", before: "—", after: reason.trim() },
    ]);
    saveWmsData(cloned);
    onUpdateState(cloned);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingDoc || !rejectReason.trim()) return;

    const cloned: WmsDataState = JSON.parse(JSON.stringify(data));
    const target = cloned.docs.find((d) => d.id === rejectingDoc.id);
    if (!target) return;

    target.status = "rejected";
    target.rejectionReason = rejectReason.trim();
    target.rejectionHistory = target.rejectionHistory || [];
    target.rejectionHistory.push({
      reason: rejectReason.trim(),
      actor: currentActor,
      at: new Date().toISOString(),
    });
    target.updatedAt = new Date().toISOString();

    logAuditAction(cloned, "Từ chối phiếu", currentActor, currentRole, target.id, [
      { field: "Lý do từ chối", before: "—", after: rejectReason.trim() },
    ]);
    saveWmsData(cloned);
    onUpdateState(cloned);
    setRejectingDoc(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Trung tâm Phê duyệt tập trung</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Xử lý toàn bộ các phiếu nhập, xuất, điều chuyển đang chờ duyệt với cơ chế kiểm soát tách biệt vai trò (Segregation of Duties).
          </p>
        </div>
      </div>

      {/* Segregation of Duties Guidance Banner */}
      <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-foreground font-medium">
          <WmsIcon name="alert" size={16} className="text-primary" />
          <span>
            Quy định bảo mật: Người tạo phiếu không thể tự duyệt phiếu của mình. Người duyệt bắt buộc phải có thẩm quyền tương ứng với vai trò.
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground font-mono">
          Vai trò hiện tại: <strong className="text-primary">{currentRole}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 rounded-xl border border-border bg-card flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã phiếu, đối tác, người tạo, tham chiếu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute left-2.5 top-2 text-muted-foreground">
              <WmsIcon name="search" size={14} />
            </div>
          </div>
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả loại nghiệp vụ</option>
          <option value="inbound">Nhập kho</option>
          <option value="outbound">Xuất kho</option>
          <option value="transfer">Điều chuyển nội bộ</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Mã phiếu</th>
                <th className="py-2.5 px-3">Nghiệp vụ</th>
                <th className="py-2.5 px-3">Kho liên quan</th>
                <th className="py-2.5 px-3">Đối tác / Phân xưởng</th>
                <th className="py-2.5 px-3">Số tham chiếu</th>
                <th className="py-2.5 px-3">Ngày gửi duyệt</th>
                <th className="py-2.5 px-3 text-right">Số lượng mặt hàng</th>
                <th className="py-2.5 px-3">Người tạo</th>
                <th className="py-2.5 px-3">Trạng thái tự duyệt</th>
                <th className="py-2.5 px-3 text-right">Hành động duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-muted-foreground">
                    Không có phiếu nào đang chờ phê duyệt.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isCreator = doc.creator === currentActor;
                  const canApprove =
                    hasPermission(
                      currentRole,
                      doc.type === "inbound" ? "approve_inbound" : "approve_outbound",
                    ) && !isCreator;

                  return (
                    <tr key={doc.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">{doc.id}</td>
                      <td className="py-2.5 px-3 font-medium">
                        {doc.type === "inbound"
                          ? "Nhập kho"
                          : doc.type === "outbound"
                            ? "Xuất kho"
                            : "Điều chuyển"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {doc.type === "transfer"
                          ? `${doc.warehouseId} → ${doc.targetWarehouseId}`
                          : doc.warehouseId}
                      </td>
                      <td className="py-2.5 px-3 max-w-[150px] truncate">{doc.partner || "—"}</td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{doc.reference || "—"}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{doc.createdAt}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {doc.items.length} mặt hàng
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{doc.creator}</td>
                      <td className="py-2.5 px-3">
                        {isCreator ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Bạn là người tạo (Khóa duyệt)
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20">
                            Đủ điều kiện duyệt
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenDoc(doc)}
                          className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2"
                        >
                          Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReturn(doc)}
                          disabled={!canApprove}
                          className="h-6 px-2 rounded border border-border text-[11px] font-medium hover:bg-surface-2 disabled:opacity-40"
                        >
                          Trả về
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingDoc(doc);
                            setRejectReason("");
                          }}
                          disabled={!canApprove}
                          className="h-6 px-2 rounded border border-red-500/30 text-red-600 text-[11px] font-medium hover:bg-red-500/10 disabled:opacity-40"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(doc)}
                          disabled={!canApprove}
                          className="h-6 px-2.5 rounded bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 shadow-xs disabled:opacity-40"
                        >
                          Duyệt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingDoc && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-600">
                Từ chối phê duyệt phiếu {rejectingDoc.id}
              </h3>
              <button
                type="button"
                onClick={() => setRejectingDoc(null)}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/20 text-muted-foreground"
              >
                <WmsIcon name="x" size={14} />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-5 space-y-3.5 text-xs">
              <p className="text-muted-foreground">
                Vui lòng nhập lý do từ chối để giải trình cho người lập phiếu:
              </p>

              <div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full h-24 p-2.5 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingDoc(null)}
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
    </div>
  );
};

