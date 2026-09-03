import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { notificationTargetPath } from "@shared/utils/notificationLinks";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { authApi } from "../../services/api/AuthApiService";
import { useRoleUser } from "../../hooks/useRoleUser";
import { useNotifications } from "../../hooks/useNotifications";
import { ResponsiveDataList } from "../../components/ui";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { toast } from "../../hooks/useToast";

const TYPE_ICON: Record<string, string> = {
  incident: "fa-triangle-exclamation text-orange-500",
  overtime: "fa-clock text-blue-500",
  complaint: "fa-comment-dots text-red-500",
  order: "fa-file-contract text-primary",
  shift: "fa-clipboard-check text-[#16A34A]",
  approval: "fa-industry text-amber-600",
  device: "fa-mobile-screen text-[#4F46E5]",
};

function NotificationBody({
  n,
  canReviewDevice,
  busyId,
  onOpen,
  onReview,
}: {
  n: Notification;
  canReviewDevice: boolean;
  busyId: string | null;
  onOpen: (n: Notification) => void;
  onReview: (n: Notification, approved: boolean) => void;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        n.isRead ? "bg-card border-border" : "bg-secondary border-[#C7D2FE]"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(n)}
        className="w-full text-left bg-transparent border-0 p-0 cursor-pointer"
      >
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0">
            <i className={`fas ${TYPE_ICON[n.type] ?? "fa-bell text-muted"}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">{n.title}</div>
            {n.body ? <div className="text-xs text-muted mt-0.5">{n.body}</div> : null}
            <div className="text-[11px] text-muted-foreground mt-1">
              {new Date(n.createdAt).toLocaleString("vi-VN")}
            </div>
          </div>
          {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#4F46E5] mt-2 flex-shrink-0" />}
        </div>
      </button>
      {n.type === "device" &&
        n.refType === "device_login" &&
        n.refId &&
        canReviewDevice &&
        n.title.includes("Phê duyệt") && (
          <div className="flex gap-2 mt-3 ml-[52px]">
            <button
              type="button"
              disabled={busyId === n.id}
              onClick={() => onReview(n, true)}
              className="h-9 px-3 rounded-lg bg-[#16A34A] text-white text-xs font-semibold border-0 cursor-pointer disabled:opacity-50"
            >
              Cho phép
            </button>
            <button
              type="button"
              disabled={busyId === n.id}
              onClick={() => onReview(n, false)}
              className="h-9 px-3 rounded-lg bg-card text-[#DC2626] text-xs font-semibold border border-[#FECACA] cursor-pointer disabled:opacity-50"
            >
              Từ chối
            </button>
          </div>
        )}
    </div>
  );
}

export default function NotificationsPage() {
  const user = useRoleUser();
  const navigate = useNavigate();
  const { refreshUnread } = useNotifications();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const fetchPage = useStableFetch((query) => workflowApi.listNotifications(user.id, query));
  const { items, total, page, pageSize, setPage, setPageSize, q, setQ, loading, refresh } = usePagedList({
    fetchPage,
    pageSize: LIST_UI_PAGE_SIZE,
  });

  useEffect(() => {
    void workflowApi
      .listNotifications(user.id, { unreadOnly: true, page: 1, pageSize: 1 })
      .then((d) => setUnreadTotal(d.total))
      .catch(() => setUnreadTotal(0));
  }, [user.id, items]);

  const markOne = async (id: string) => {
    try {
      await workflowApi.markRead(id);
      refresh();
      await refreshUnread();
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (n: Notification) => {
    if (!n.isRead) await markOne(n.id);
    const href = notificationTargetPath(user.role, n);
    if (href) navigate(href);
  };

  const markAll = async () => {
    try {
      await workflowApi.markAllRead(user.id);
      refresh();
      await refreshUnread();
      setUnreadTotal(0);
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
      toast.error(e instanceof Error ? e.message : "Không phê duyệt được thiết bị");
    } finally {
      setBusyId(null);
    }
  };

  const canReviewDevice = useMemo(
    () =>
      ["director", "supervisor", "admin", "worker", "teamlead", "qc", "stats"].includes(user.role),
    [user.role],
  );

  const renderItem = useCallback(
    (n: Notification) => (
      <NotificationBody
        n={n}
        canReviewDevice={canReviewDevice}
        busyId={busyId}
        onOpen={(item) => void openNotification(item)}
        onReview={(item, ok) => void reviewDevice(item, ok)}
      />
    ),
    [canReviewDevice, busyId, user.role],
  );

  return (
    <div className="max-w-full min-w-0">
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="font-display font-800 text-xl">Thông báo</h2>
          <p className="text-sm text-muted mt-0.5">
            {unreadTotal > 0 ? `${unreadTotal} chưa đọc` : "Không có thông báo mới"} · {total} tổng
          </p>
        </div>
        {unreadTotal > 0 && (
          <button
            type="button"
            onClick={() => void markAll()}
            className="text-xs font-semibold text-primary cursor-pointer border-0 bg-transparent shrink-0"
          >
            Đánh dấu đã đọc
          </button>
        )}
      </div>

      <div className="mb-4">
        <input
          className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="Tìm tiêu đề, nội dung…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">
          <i className="fas fa-spinner fa-spin text-2xl" />
        </div>
      ) : (
        <ResponsiveDataList
          items={items}
          getKey={(n) => n.id}
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={setPageSize}
          emptyText="Chưa có thông báo"
          columns={[
            {
              key: "title",
              header: "Thông báo",
              render: (n) => (
                <div className="flex items-start gap-2">
                  <i className={`fas ${TYPE_ICON[n.type] ?? "fa-bell text-muted"}`} />
                  <div>
                    <div className={`font-semibold text-sm ${n.isRead ? "" : "text-primary"}`}>
                      {n.title}
                    </div>
                    {n.body ? <div className="text-xs text-muted">{n.body}</div> : null}
                  </div>
                </div>
              ),
            },
            {
              key: "time",
              header: "Thời gian",
              render: (n) => (
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("vi-VN")}
                </span>
              ),
            },
            {
              key: "read",
              header: "TT",
              className: "text-center",
              render: (n) =>
                n.isRead ? (
                  <span className="text-xs text-muted-foreground">Đã đọc</span>
                ) : (
                  <span className="text-xs font-semibold text-[#4F46E5]">Mới</span>
                ),
            },
          ]}
          renderCard={renderItem}
          onRowClick={(n) => void openNotification(n)}
        />
      )}
    </div>
  );
}
