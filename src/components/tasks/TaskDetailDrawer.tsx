import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task, TaskAttachment, TaskStatus } from "../../types/task";
import { isTaskOverdue } from "../../services/taskStorage";
import {
  TASK_CATEGORY_META,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  TaskIcon,
} from "./TaskIcons";
import { TaskActivityAndFiles } from "./TaskActivityAndFiles";

interface TaskDetailDrawerProps {
  task: Task | null;
  isManager: boolean;
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onChangeStatus: (taskId: string, nextStatus: TaskStatus, returnReason?: string) => void;
  onToggleChecklist: (taskId: string, itemId: string) => void;
  onAddChecklistItem: (taskId: string, title: string) => void;
  onUpdateActualHours: (taskId: string, actualHours: number) => void;
  onAddAttachment: (taskId: string, file: Omit<TaskAttachment, "id" | "uploadedBy" | "uploadedAt">) => void;
  onRemoveAttachment: (taskId: string, attachmentId: string) => void;
  onAddComment: (taskId: string, content: string) => void;
  onQuickReportIncident: (task: Task) => void;
}

type DrawerTab = "overview" | "attachments" | "activity";

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  isManager,
  onClose,
  onEditTask,
  onChangeStatus,
  onToggleChecklist,
  onAddChecklistItem,
  onUpdateActualHours,
  onAddAttachment,
  onRemoveAttachment,
  onAddComment,
  onQuickReportIncident,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DrawerTab>("overview");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showReturnBox, setShowReturnBox] = useState(false);
  const [returnReasonText, setReturnReasonText] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!task) return null;

  const overdue = isTaskOverdue(task);
  const statusMeta = TASK_STATUS_META[task.status];
  const priorityMeta = TASK_PRIORITY_META[task.priority];
  const catMeta = TASK_CATEGORY_META[task.category];
  const doneCount = task.checklist.filter((c) => c.completed).length;

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    onAddChecklistItem(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReasonText.trim()) return;
    onChangeStatus(task.id, "in_progress", returnReasonText.trim());
    setReturnReasonText("");
    setShowReturnBox(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-drawer-title"
    >
      <div className="bg-card border-l border-border w-full max-w-2xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-muted/10 flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/25">
                {task.code}
              </span>
              <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${catMeta.badgeClass}`}>
                {catMeta.icon} {task.category}
              </span>
              <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${priorityMeta.badgeClass}`}>
                {priorityMeta.symbol} Ưu tiên {priorityMeta.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold inline-flex items-center gap-1 ${statusMeta.badgeClass}`}>
                <TaskIcon name={statusMeta.icon} size={11} />
                <span>{statusMeta.label}</span>
              </span>
              {overdue && (
                <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 text-[11px] font-black uppercase">
                  ⚠ Quá hạn
                </span>
              )}
            </div>
            <h2 id="task-drawer-title" className="text-base sm:text-lg font-bold text-foreground">
              {task.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              {task.workshop} {task.line ? `• ${task.line}` : ""} • Giao bởi <strong className="text-foreground">{task.assignerName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isManager && (
              <button type="button" onClick={() => onEditTask(task)} className="h-8 px-2.5 rounded-lg border border-border bg-card hover:bg-muted/20 text-xs font-semibold text-foreground inline-flex items-center gap-1 cursor-pointer">
                <TaskIcon name="edit" size={13} />
                <span>Sửa / Giao lại</span>
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Đóng chi tiết công việc" className="w-8 h-8 rounded-lg hover:bg-muted/20 flex items-center justify-center text-muted-foreground cursor-pointer">
              <TaskIcon name="x" size={16} />
            </button>
          </div>
        </div>

        {/* Hành động nghiệp vụ nhanh */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-border bg-background flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {task.status === "todo" && (
              <button type="button" onClick={() => onChangeStatus(task.id, "in_progress")} className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-bold cursor-pointer">▶ Bắt đầu thực hiện</button>
            )}
            {task.status === "in_progress" && (
              <button type="button" onClick={() => onChangeStatus(task.id, "pending_review")} className="h-7 px-3 rounded-md bg-amber-500 text-black text-xs font-bold cursor-pointer">✓ Gửi duyệt hoàn thành</button>
            )}
            {task.status === "pending_review" && isManager && (
              <>
                <button type="button" onClick={() => onChangeStatus(task.id, "completed")} className="h-7 px-3 rounded-md bg-emerald-600 text-white text-xs font-bold cursor-pointer">✓ Phê duyệt hoàn thành</button>
                <button type="button" onClick={() => setShowReturnBox((v) => !v)} className="h-7 px-3 rounded-md border border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold cursor-pointer">↩ Trả lại làm lại</button>
              </>
            )}
          </div>
          <button type="button" onClick={() => onQuickReportIncident(task)} className="h-7 px-2.5 rounded-md border border-red-500/35 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
            <TaskIcon name="alert" size={12} />
            <span>Báo hỏng máy nhanh</span>
          </button>
        </div>

        {showReturnBox && (
          <form onSubmit={handleConfirmReturn} className="px-5 py-3 border-b border-border bg-amber-500/10 flex items-center gap-2">
            <input type="text" required aria-label="Lý do trả lại công việc" value={returnReasonText} onChange={(e) => setReturnReasonText(e.target.value)} placeholder="Nhập lý do trả lại để thông báo cho người phụ trách..." className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground" />
            <button type="submit" className="h-8 px-3 rounded-lg bg-amber-500 text-black text-xs font-bold cursor-pointer">Xác nhận trả lại</button>
          </form>
        )}

        {/* Tab điều hướng */}
        <div role="tablist" className="flex items-center gap-1 border-b border-border px-4 sm:px-5 bg-background">
          {(
            [
              { id: "overview", label: `Checklist & Chi tiết (${doneCount}/${task.checklist.length})` },
              { id: "attachments", label: `Tệp đính kèm (${task.attachments.length})` },
              { id: "activity", label: `Bình luận & Lịch sử (${task.comments.length + task.history.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              className={`h-10 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Nội dung Tab */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto text-xs space-y-5">
          {activeTab === "overview" ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border border-border bg-muted/10">
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Người phụ trách</span>
                  <div className="font-bold text-foreground mt-0.5">{task.assigneeName}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Hạn hoàn thành</span>
                  <div className={`font-mono font-bold mt-0.5 ${overdue ? "text-red-500" : "text-foreground"}`}>
                    {new Date(task.dueDate).toLocaleString("vi-VN")}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Chu kỳ lặp lại</span>
                  <div className="font-semibold text-foreground mt-0.5">{task.recurrenceLabel || "Không lặp lại"}</div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">Giờ ước tính</span>
                  <div className="font-mono font-bold text-foreground mt-0.5">{task.estimatedHours} giờ</div>
                </div>
                <div className="col-span-2">
                  <label htmlFor="drawer-actual-hours" className="block text-[10px] font-bold uppercase text-muted-foreground">
                    Giờ thực tế đã làm (So với {task.estimatedHours}h ước tính)
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      id="drawer-actual-hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={task.actualHours}
                      onChange={(e) => onUpdateActualHours(task.id, Number(e.target.value) || 0)}
                      className="w-24 h-7 px-2 rounded border border-border bg-background font-mono text-xs text-foreground"
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {task.actualHours > task.estimatedHours ? `⚠ Vượt ${(task.actualHours - task.estimatedHours).toFixed(1)}h ước tính` : "✓ Trong định mức"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">Liên kết:</span>
                {task.orderCode && (
                  <button type="button" onClick={() => navigate("/director/orders")} className="h-7 px-2.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-mono text-xs font-bold hover:bg-primary/20 cursor-pointer">
                    🔗 Lệnh SX: {task.orderCode} ({task.orderName})
                  </button>
                )}
                {task.machineCode && (
                  <button type="button" onClick={() => navigate("/director/machines")} className="h-7 px-2.5 rounded-lg border border-border bg-muted/25 text-foreground font-mono text-xs font-bold hover:bg-muted/40 cursor-pointer">
                    ⚙️ Máy: {task.machineCode} ({task.machineName})
                  </button>
                )}
                {task.warehouseCode && (
                  <button type="button" onClick={() => navigate("/director/warehouse")} className="h-7 px-2.5 rounded-lg border border-border bg-muted/25 text-foreground font-mono text-xs font-bold hover:bg-muted/40 cursor-pointer">
                    📦 Kho: {task.warehouseCode} ({task.warehouseName})
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase text-muted-foreground">Mô tả chi tiết công việc</h3>
                <p className="p-3 rounded-xl border border-border bg-card text-foreground leading-relaxed">{task.description}</p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground">Checklist việc con ({doneCount}/{task.checklist.length})</h3>
                  <span className="font-mono text-xs font-black text-primary">Tiến độ tự tính: {task.progress}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted/30 overflow-hidden">
                  <div style={{ width: `${task.progress}%` }} className="h-full bg-primary transition-all duration-300" />
                </div>
                <div className="space-y-1.5">
                  {task.checklist.map((item) => (
                    <label key={item.id} className={`p-2.5 rounded-lg border flex items-center gap-2.5 cursor-pointer ${item.completed ? "border-emerald-500/30 bg-emerald-500/10" : "border-border bg-card hover:bg-muted/15"}`}>
                      <input type="checkbox" checked={item.completed} onChange={() => onToggleChecklist(task.id, item.id)} className="w-4 h-4 accent-primary cursor-pointer" />
                      <span className={`flex-1 font-medium ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.title}</span>
                    </label>
                  ))}
                </div>
                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                  <input type="text" aria-label="Thêm đầu việc con mới vào checklist" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="Thêm bước kiểm tra / việc con mới..." className="flex-1 h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground" />
                  <button type="submit" className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted/20 text-xs font-bold text-foreground cursor-pointer">+ Thêm mục</button>
                </form>
              </div>
            </>
          ) : (
            <TaskActivityAndFiles
              task={task}
              activeSubTab={activeTab}
              onAddAttachment={onAddAttachment}
              onRemoveAttachment={onRemoveAttachment}
              onAddComment={onAddComment}
            />
          )}
        </div>
      </div>
    </div>
  );
};
