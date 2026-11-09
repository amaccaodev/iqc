import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Task, TaskStatus } from "../../types/task";
import { isTaskOverdue } from "../../services/taskStorage";
import {
  TASK_CATEGORY_META,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  TaskIcon,
} from "./TaskIcons";

interface TaskKanbanProps {
  tasks: Task[];
  isManager: boolean;
  onSelectTask: (task: Task) => void;
  onChangeStatus: (taskId: string, nextStatus: TaskStatus) => void;
}

const KANBAN_COLUMNS: Array<{ status: TaskStatus; title: string; subtitle: string }> = [
  { status: "todo", title: "Chưa làm", subtitle: "Chờ tiếp nhận" },
  { status: "in_progress", title: "Đang làm", subtitle: "Đang thực thi tại xưởng" },
  { status: "pending_review", title: "Chờ duyệt", subtitle: "Chờ nghiệm thu / KCS" },
  { status: "completed", title: "Hoàn thành", subtitle: "Đã duyệt đạt yêu cầu" },
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({
  tasks,
  isManager,
  onSelectTask,
  onChangeStatus,
}) => {
  const navigate = useNavigate();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverColumn(null);
    if (!taskId) return;

    // Công nhân không tự duyệt sang Hoàn thành mà phải qua Chờ duyệt
    if (!isManager && targetStatus === "completed") {
      onChangeStatus(taskId, "pending_review");
      return;
    }
    onChangeStatus(taskId, targetStatus);
  };

  return (
    <section
      aria-label="Bảng Kanban quản lý công việc"
      className="flex gap-3.5 overflow-x-auto pb-3 snap-x snap-mandatory lg:grid lg:grid-cols-4"
    >
      {KANBAN_COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const meta = TASK_STATUS_META[col.status];
        const isOver = dragOverColumn === col.status;

        return (
          <div
            key={col.status}
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => handleDrop(e, col.status)}
            role="region"
            aria-label={`Cột ${col.title} (${colTasks.length} công việc)`}
            className={`min-w-[285px] sm:min-w-[310px] lg:min-w-0 snap-start rounded-xl border p-3 flex flex-col transition-all ${
              isOver
                ? "border-primary bg-primary/10 ring-2 ring-primary"
                : "border-border bg-muted/15"
            }`}
          >
            {/* Header cột */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${meta.dotClass}`} />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wide text-foreground">
                    {col.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground">{col.subtitle}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-card border border-border text-foreground">
                {colTasks.length}
              </span>
            </div>

            {/* Danh sách thẻ trong cột */}
            <div className="space-y-2.5 flex-1 min-h-[320px]">
              {colTasks.length === 0 ? (
                <div className="h-36 rounded-lg border border-dashed border-border flex items-center justify-center text-[11px] text-muted-foreground p-4 text-center">
                  Kéo thả thẻ công việc vào cột <strong>&nbsp;{col.title}</strong>
                </div>
              ) : (
                colTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const priorityMeta = TASK_PRIORITY_META[task.priority];
                  const catMeta = TASK_CATEGORY_META[task.category];

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      onClick={() => onSelectTask(task)}
                      className={`p-3 rounded-xl border bg-card shadow-xs transition-all cursor-grab active:cursor-grabbing hover:border-primary/50 space-y-2 ${
                        overdue ? "border-red-500/45" : "border-border"
                      } ${draggedTaskId === task.id ? "opacity-50" : ""}`}
                    >
                      {/* Dòng 1: Mã CV + Mức ưu tiên */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[11px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25">
                          {task.code}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${priorityMeta.badgeClass}`}
                        >
                          {priorityMeta.symbol} {priorityMeta.label}
                        </span>
                      </div>

                      {/* Dòng 2: Tiêu đề */}
                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                        {task.title}
                      </h4>

                      {/* Dòng 3: Loại việc & Liên kết */}
                      <div
                        className="flex flex-wrap items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${catMeta.badgeClass}`}
                        >
                          {catMeta.icon} {task.category}
                        </span>
                        {task.orderCode && (
                          <button
                            type="button"
                            onClick={() => navigate("/director/orders")}
                            className="px-1.5 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary font-mono text-[10px] font-bold hover:bg-primary/20 cursor-pointer"
                          >
                            {task.orderCode}
                          </button>
                        )}
                        {task.machineCode && (
                          <button
                            type="button"
                            onClick={() => navigate("/director/machines")}
                            className="px-1.5 py-0.5 rounded border border-border bg-muted/25 text-foreground font-mono text-[10px] font-semibold hover:bg-muted/40 cursor-pointer"
                          >
                            ⚙️ {task.machineCode}
                          </button>
                        )}
                        {task.warehouseCode && (
                          <button
                            type="button"
                            onClick={() => navigate("/director/warehouse")}
                            className="px-1.5 py-0.5 rounded border border-border bg-muted/25 text-foreground font-mono text-[10px] font-semibold hover:bg-muted/40 cursor-pointer"
                          >
                            📦 {task.warehouseCode}
                          </button>
                        )}
                      </div>

                      {/* Dòng 4: Thanh tiến độ */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Tiến độ checklist</span>
                          <span className="font-mono font-bold text-foreground">
                            {task.progress}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            style={{ width: `${task.progress}%` }}
                            className={`h-full ${
                              task.status === "completed"
                                ? "bg-emerald-500"
                                : overdue
                                  ? "bg-red-500"
                                  : "bg-primary"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Dòng 5: Người nhận + Hạn + Nhãn Quá hạn */}
                      <div className="pt-1.5 border-t border-border flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-muted-foreground truncate">
                          👤 {task.assigneeName.split("(")[0].trim()}
                        </span>
                        {overdue ? (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 text-[10px] font-black uppercase shrink-0">
                            ⚠ Quá hạn
                          </span>
                        ) : (
                          <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                            {new Date(task.dueDate).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Dòng 6: Điều khiển chuyển trạng thái bằng bàn phím (Accessibility) */}
                      <div
                        className="pt-1 flex items-center justify-between gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label
                          htmlFor={`kanban-status-${task.id}`}
                          className="text-[10px] text-muted-foreground font-medium"
                        >
                          Chuyển cột:
                        </label>
                        <select
                          id={`kanban-status-${task.id}`}
                          aria-label={`Đổi trạng thái cho công việc ${task.code}`}
                          value={task.status}
                          onChange={(e) =>
                            onChangeStatus(task.id, e.target.value as TaskStatus)
                          }
                          className="h-6 px-1.5 rounded border border-border bg-background text-[10px] font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                        >
                          <option value="todo">Chưa làm</option>
                          <option value="in_progress">Đang làm</option>
                          <option value="pending_review">Chờ duyệt</option>
                          {isManager && <option value="completed">Hoàn thành</option>}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};

