import { useCallback, useEffect, useState } from "react";
import type { Notification } from "@shared/types";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { authApi } from "../../services/api/AuthApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_ICON: Record<string, string> = {
  incident: "fa-triangle-exclamation text-orange-500",
  overtime: "fa-clock text-blue-500",
  complaint: "fa-comment-dots text-red-500",
  order: "fa-file-contract text-[#1B3A5C]",
  device: "fa-mobile-screen-button text-[#2D6EBD]",
};

export default function NotificationsPage() {
  const user = useRoleUser();
  const { refreshUnread } = useNotifications();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await workflowApi.getNotifications(user.id));
      await refreshUnread();
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user.id, refreshUnread]);

  useEffect(() => {
    void load();
  }, [load]);

  const markOne = async (id: string) => {
    try {
      await workflowApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      await refreshUnread();
    } catch {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await workflowApi.markAllRead(user.id);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await refreshUnread();
    } catch {
      /* ignore */
    }
  };

  const reviewDevice = async (n: Notification, approved: boolean) => {
    if (!n.refId) return;
    setBusyId(n.id);
    try {
      await authApi.reviewDevice(n.refId, approved);
      await markOne(n.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Không phê duyệt được thiết bị");
    } finally {
      setBusyId(null);
    }
  };

  const unread = items.filter((n) => !n.isRead).length;
  const canReviewDevice = ["director", "supervisor", "admin", "worker", "teamlead", "qc", "stats"].includes(user.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl">Thông báo</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {unread > 0 ? `${unread} chưa đọc` : "Không có thông báo mới"}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => void markAll()}
            className="text-xs font-semibold text-[#2D6EBD] cursor-pointer border-0 bg-transparent"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#94A3B8]">
          <i className="fas fa-spinner fa-spin text-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-[#94A3B8] shadow-sm">
          <i className="fas fa-bell-slash text-4xl block mb-3 opacity-30" />
          Chưa có thông báo
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              className={`w-full text-left rounded-2xl p-4 border ${
                n.isRead ? "bg-white border-[#E2E8F0]" : "bg-[#EEF2FF] border-[#C7D2FE]"
              }`}
            >
              <button
                type="button"
                onClick={() => void markOne(n.id)}
                className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
              >
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <i className={`fas ${TYPE_ICON[n.type] ?? "fa-bell text-[#64748B]"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{n.title}</div>
                    {n.body ? <div className="text-xs text-[#64748B] mt-0.5">{n.body}</div> : null}
                    <div className="text-[11px] text-[#94A3B8] mt-1">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />}
                </div>
              </button>
              {n.type === "device" && n.refType === "device_login" && n.refId && canReviewDevice && n.title.includes("Phê duyệt") && (
                <div className="flex gap-2 mt-3 ml-[52px]">
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => void reviewDevice(n, true)}
                    className="h-9 px-3 rounded-lg bg-[#16A34A] text-white text-xs font-semibold border-0 cursor-pointer disabled:opacity-50"
                  >
                    Cho phép
                  </button>
                  <button
                    type="button"
                    disabled={busyId === n.id}
                    onClick={() => void reviewDevice(n, false)}
                    className="h-9 px-3 rounded-lg bg-white text-[#DC2626] text-xs font-semibold border border-[#FECACA] cursor-pointer disabled:opacity-50"
                  >
                    Từ chối
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
