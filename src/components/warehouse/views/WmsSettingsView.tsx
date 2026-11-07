import React, { useState } from "react";
import type { WmsDataState, WmsRole } from "../../../types/wms";
import { ROLE_PERMISSIONS } from "../../../services/wmsStorage";
import { WmsIcon } from "../WmsIcons";

interface WmsSettingsViewProps {
  data: WmsDataState;
  currentRole: WmsRole;
  onChangeRole: (role: WmsRole) => void;
  onAddTestData: () => void;
  onResetData: () => void;
}

export const WmsSettingsView: React.FC<WmsSettingsViewProps> = ({
  data,
  currentRole,
  onChangeRole,
  onAddTestData,
  onResetData,
}) => {
  const [tab, setTab] = useState<"roles" | "audit">("roles");
  const [auditSearch, setAuditSearch] = useState("");

  const filteredAudit = (data.auditLog || []).filter((a) => {
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      return (
        a.action.toLowerCase().includes(q) ||
        a.actor.toLowerCase().includes(q) ||
        (a.documentId || "").toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allRoles: WmsRole[] = [
    "Nhân viên kho",
    "Thủ kho",
    "Quản lý kho",
    "Kế toán kho",
    "Quản trị tập đoàn",
  ];

  const roleDescriptions: Record<WmsRole, string> = {
    "Nhân viên kho":
      "Xem phiếu, tạo phiếu nhập/xuất, tạo phiên kiểm kê, chỉnh sửa phiếu do mình tạo.",
    "Thủ kho":
      "Đầy đủ quyền nhân viên kho + duyệt phiếu nhập/xuất, xác nhận nhập/xuất thực tế, xuất/nhận điều chuyển kho, xử lý chênh lệch điều chuyển, xác nhận kiểm kê.",
    "Quản lý kho":
      "Toàn quyền nghiệp vụ kho, duyệt kiểm kê, sửa mọi phiếu, trả phiếu về chỉnh sửa (Return for edit).",
    "Kế toán kho":
      "Xem phiếu, tạo phiếu nhập/xuất, sửa phiếu của mình, duyệt phiếu nhập/xuất.",
    "Quản trị tập đoàn":
      "Toàn quyền quản trị hệ thống, cấu hình đơn vị và xóa sửa dữ liệu đặc quyền.",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Cài đặt hệ thống & Nhật ký kiểm toán</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mô phỏng phân quyền 5 vai trò (RBAC), kiểm soát nhật ký thao tác (Audit Trail) và công cụ dữ liệu thử nghiệm.
          </p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-muted/20 border border-border rounded-lg">
          <button
            type="button"
            onClick={() => setTab("roles")}
            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
              tab === "roles"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Phân quyền & Vai trò
          </button>
          <button
            type="button"
            onClick={() => setTab("audit")}
            className={`h-7 px-3 rounded-md text-xs font-semibold transition-all ${
              tab === "audit"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Nhật ký kiểm toán ({data.auditLog.length})
          </button>
        </div>
      </div>

      {tab === "roles" && (
        <div className="space-y-5">
          {/* Role selector card */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-foreground">Bộ chuyển vai trò tức thì (Role Switcher)</h2>
            <p className="text-xs text-muted-foreground">
              Chọn vai trò người dùng để kiểm tra ngay lập tức các giới hạn phân quyền trên giao diện:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
              {allRoles.map((role) => {
                const isActive = currentRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onChangeRole(role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                        : "bg-surface border-border hover:bg-surface-2 text-foreground"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>{role}</span>
                      {isActive && <WmsIcon name="check" size={14} />}
                    </div>
                    <div
                      className={`text-[10px] mt-1 line-clamp-2 ${
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {roleDescriptions[role]}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs text-muted-foreground">
              <span>
                Quyền đang áp dụng cho vai trò <strong>{currentRole}</strong>:{" "}
                <strong className="text-primary">{ROLE_PERMISSIONS[currentRole]?.length || 0} quyền</strong>
              </span>
              <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                {ROLE_PERMISSIONS[currentRole]?.map((perm) => (
                  <span
                    key={perm}
                    className="px-1.5 py-0.5 rounded bg-muted/20 text-[10px] font-mono border border-border"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Demo Data Management */}
          <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-xs">
            <h2 className="text-sm font-bold text-foreground">Công cụ Dữ liệu Mẫu (Demo & Test Tools)</h2>
            <p className="text-xs text-muted-foreground">
              Thao tác này giúp kiểm thử đầy đủ các kịch bản luân chuyển kho mà không làm ảnh hưởng đến cơ sở dữ liệu thật.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onAddTestData}
                className="h-8 px-4 rounded-md bg-secondary text-secondary-foreground text-xs font-semibold flex items-center gap-1.5 border border-border hover:bg-surface-2"
              >
                <WmsIcon name="plus" size={14} />
                <span>Nạp bộ dữ liệu kiểm thử WMS</span>
              </button>
              <button
                type="button"
                onClick={onResetData}
                className="h-8 px-4 rounded-md border border-red-500/30 text-red-600 text-xs font-semibold hover:bg-red-500/10 flex items-center gap-1.5"
              >
                <WmsIcon name="refresh" size={14} />
                <span>Khôi phục dữ liệu gốc ban đầu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm lịch sử theo hành động, người thực hiện, vai trò, mã chứng từ..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="absolute left-2.5 top-2 text-muted-foreground">
                  <WmsIcon name="search" size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-muted/20 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3">Thời điểm</th>
                  <th className="py-2.5 px-3">Hành động</th>
                  <th className="py-2.5 px-3">Người thực hiện</th>
                  <th className="py-2.5 px-3">Vai trò</th>
                  <th className="py-2.5 px-3">Mã phiếu liên quan</th>
                  <th className="py-2.5 px-3">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAudit.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Chưa có sự kiện kiểm toán nào được ghi lại.
                    </td>
                  </tr>
                ) : (
                  filteredAudit.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/10 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(a.at).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{a.action}</td>
                      <td className="py-2.5 px-3 font-medium">{a.actor}</td>
                      <td className="py-2.5 px-3 text-muted-foreground">{a.role}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {a.documentId || a.inventoryCountSessionId || "—"}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-muted-foreground">
                        {a.changes?.map((c) => `${c.field}: ${c.before} → ${c.after}`).join("; ") || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

