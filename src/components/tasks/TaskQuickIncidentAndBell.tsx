import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task, TaskNotification } from "../../types/task";
import { TaskIcon } from "./TaskIcons";

interface TaskQuickIncidentModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmitIncident: (
    task: Task,
    machineCode: string,
    severity: "low" | "medium" | "high" | "critical",
    description: string,
    goToIncidentsTab: boolean,
  ) => void;
}

export const TaskQuickIncidentModal: React.FC<TaskQuickIncidentModalProps> = ({
  task,
  onClose,
  onSubmitIncident,
}) => {
  const [machineCode, setMachineCode] = useState(task?.machineCode || "CNC-01");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("high");
  const [description, setDescription] = useState("");
  const [goToTab, setGoToTab] = useState(true);

  if (!task) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmitIncident(
      task,
      machineCode.trim() || task.machineCode || "CNC-01",
      severity,
      description.trim(),
      goToTab,
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-inc-title"
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-red-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <TaskIcon name="alert" size={16} />
            <h3 id="quick-inc-title">Báo hỏng máy từ công việc {task.code}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="w-7 h-7 rounded hover:bg-muted/20 flex items-center justify-center text-muted-foreground cursor-pointer"
          >
            <TaskIcon name="x" size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="qi-machine" className="block text-[11px] font-bold text-muted-foreground mb-1">
                Mã máy gặp sự cố
              </label>
              <input
                id="qi-machine"
                type="text"
                required
                value={machineCode}
                onChange={(e) => setMachineCode(e.target.value)}
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background font-mono text-foreground"
              />
            </div>
            <div>
              <label htmlFor="qi-severity" className="block text-[11px] font-bold text-muted-foreground mb-1">
                Mức độ sự cố
              </label>
              <select
                id="qi-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as "low" | "medium" | "high" | "critical")}
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-foreground"
              >
                <option value="low">Thấp (Chưa dừng máy)</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao (Dừng máy ngay)</option>
                <option value="critical">Khẩn cấp (Nguy hiểm)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="qi-desc" className="block text-[11px] font-bold text-muted-foreground mb-1">
              Mô tả hiện tượng hỏng hóc <span className="text-red-500">*</span>
            </label>
            <textarea
              id="qi-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Gãy dao phay ngón Ø12, trục chính rung mạnh hoặc báo lỗi servo..."
              className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
            <input
              type="checkbox"
              checked={goToTab}
              onChange={(e) => setGoToTab(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <span>Chuyển thẳng sang tab Báo hỏng (/director/incidents) sau khi gửi</span>
          </label>

          <div className="pt-2 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-muted/15 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-8 px-4 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              Phát cảnh báo sự cố máy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TaskNotificationPopoverProps {
  notifications: TaskNotification[];
  onSelectNotification: (n: TaskNotification) => void;
  onMarkAllRead: () => void;
}

export const TaskNotificationPopover: React.FC<TaskNotificationPopoverProps> = ({
  notifications,
  onSelectNotification,
  onMarkAllRead,
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Thông báo công việc (${unreadCount} chưa đọc)`}
        className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted/15 text-xs font-bold text-foreground inline-flex items-center gap-1.5 cursor-pointer relative"
      >
        <TaskIcon name="bell" size={14} className="text-primary" />
        <span className="hidden sm:inline">Thông báo việc</span>
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-mono font-black">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo công việc"
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-2xl z-40 overflow-hidden"
        >
          <div className="px-3.5 py-2.5 border-b border-border bg-muted/15 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              Thông báo công việc ({unreadCount} mới)
            </span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Đọc tất cả
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/director/notifications")}
                className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Tất cả TB →
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Chưa có thông báo công việc nào.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelectNotification(n);
                    setOpen(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-muted/15 transition-colors cursor-pointer space-y-1 ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary">
                      {n.taskCode} •{" "}
                      {n.type === "assigned"
                        ? "📥 Giao việc"
                        : n.type === "due_soon"
                          ? "⏰ Sắp đến hạn <24h"
                          : "↩ Bị trả lại"}
                    </span>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs font-bold text-foreground">{n.title}</div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2">{n.message}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

