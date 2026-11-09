import React from "react";
import { useNavigate } from "react-router-dom";
import type { Task, TaskStatus } from "../../types/task";
import { isTaskDueSoon, isTaskOverdue } from "../../services/taskStorage";
import {
  TASK_CATEGORY_META,
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  TaskIcon,
} from "./TaskIcons";

interface TaskTableProps {
  tasks: Task[];
  isManager: boolean;
  onSelectTask: (task: Task) => void;
  onChangeStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onQuickReportIncident: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  isManager,
  onSelectTask,
  onChangeStatus,
  onQuickReportIncident,
}) => {
  const navigate = useNavigate();

  const formatDateTime = (iso: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/20 text-[11px] font-bold uppercase text-muted-foreground">
              <th className="py-3 px-3.5">Mã & Công việc</th>
              <th className="py-3 px-3">Liên kết hệ thống</th>
              <th className="py-3 px-3">Ưu tiên</th>
              <th className="py-3 px-3">Giao / Phụ trách</th>
              <th className="py-3 px-3">Hạn hoàn thành</th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 px-3 w-32">Tiến độ</th>
              <th className="py-3 px-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const overdue = isTaskOverdue(task);
              const dueSoon = isTaskDueSoon(task);
              const statusMeta = TASK_STATUS_META[task.status];
              const priorityMeta = TASK_PRIORITY_META[task.priority];
              const catMeta = TASK_CATEGORY_META[task.category];
              const doneChecklist = task.checklist.filter((c) => c.completed).length;

              return (
                <tr
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className={`transition-colors cursor-pointer hover:bg-muted/15 ${
                    overdue ? "bg-red-500/5" : ""
                  }`}
                >
                  {/* 1. Mã việc, Tiêu đề, Loại việc */}
                  <td className="py-3 px-3.5 align-top max-w-xs">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-mono text-[11px] font-black text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/25">
                        {task.code}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${catMeta.badgeClass}`}
                      >
                        {catMeta.icon} {task.category}
                      </span>
                      {task.recurrence !== "none" && (
                        <span
                          className="px-1.5 py-0.5 rounded border border-border bg-muted/25 text-[10px] font-semibold text-muted-foreground inline-flex items-center gap-1"
                          title={task.recurrenceLabel || "Việc lặp lại định kỳ"}
                        >
                          <TaskIcon name="repeat" size={10} />
                          <span>{task.recurrenceLabel || "Lặp lại"}</span>
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-foreground line-clamp-2 leading-snug">
                      {task.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {task.workshop} {task.line ? `• ${task.line}` : ""}
                    </div>
                    {task.returnReason && task.status !== "completed" && (
                      <div className="mt-1 px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        ↩ Bị trả lại: {task.returnReason}
                      </div>
                    )}
                  </td>

                  {/* 2. Liên kết: Lệnh SX, Máy móc, Kho */}
                  <td
                    className="py-3 px-3 align-top"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-start gap-1">
                      {task.orderCode && (
                        <button
                          type="button"
                          onClick={() => navigate("/director/orders")}
                          className="px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 font-mono text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          title={`Chuyển tới Lệnh SX: ${task.orderName || task.orderCode}`}
                        >
                          <TaskIcon name="link" size={10} />
                          <span>{task.orderCode}</span>
                        </button>
                      )}
                      {task.machineCode && (
                        <button
                          type="button"
                          onClick={() => navigate("/director/machines")}
                          className="px-2 py-0.5 rounded border border-border bg-muted/25 hover:bg-muted/40 text-foreground font-mono text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          title={`Chuyển tới Máy móc: ${task.machineName || task.machineCode}`}
                        >
                          <span>⚙️ {task.machineCode}</span>
                        </button>
                      )}
                      {task.warehouseCode && (
                        <button
                          type="button"
                          onClick={() => navigate("/director/warehouse")}
                          className="px-2 py-0.5 rounded border border-border bg-muted/25 hover:bg-muted/40 text-foreground font-mono text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          title={`Chuyển tới Kho: ${task.warehouseName || task.warehouseCode}`}
                        >
                          <span>📦 {task.warehouseCode}</span>
                        </button>
                      )}
                      {!task.orderCode && !task.machineCode && !task.warehouseCode && (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </div>
                  </td>

                  {/* 3. Mức ưu tiên */}
                  <td className="py-3 px-3 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold ${priorityMeta.badgeClass}`}
                    >
                      <span>{priorityMeta.symbol}</span>
                      <span>{priorityMeta.label}</span>
                    </span>
                  </td>

                  {/* 4. Người giao / Người phụ trách */}
                  <td className="py-3 px-3 align-top">
                    <div className="font-semibold text-foreground">{task.assigneeName}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Giao bởi: {task.assignerName}
                    </div>
                  </td>

                  {/* 5. Hạn hoàn thành & Nhãn Quá hạn */}
                  <td className="py-3 px-3 align-top whitespace-nowrap">
                    <div
                      className={`font-mono text-xs font-semibold ${
                        overdue
                          ? "text-red-600 dark:text-red-400 font-bold"
                          : "text-foreground"
                      }`}
                    >
                      {formatDateTime(task.dueDate)}
                    </div>
                    {overdue && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/35 text-red-600 dark:text-red-400 text-[10px] font-black uppercase">
                        <TaskIcon name="alert" size={11} />
                        <span>Quá hạn</span>
                      </span>
                    )}
                    {!overdue && dueSoon && (
                      <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        <TaskIcon name="clock" size={10} />
                        <span>Sắp đến hạn (&lt;24h)</span>
                      </span>
                    )}
                  </td>

                  {/* 6. Trạng thái */}
                  <td className="py-3 px-3 align-top whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${statusMeta.badgeClass}`}
                    >
                      <TaskIcon name={statusMeta.icon} size={12} />
                      <span>{statusMeta.label}</span>
                    </span>
                  </td>

                  {/* 7. Tiến độ % */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-bold text-foreground">{task.progress}%</span>
                      {task.checklist.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {doneChecklist}/{task.checklist.length} mục
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
                      <div
                        style={{ width: `${task.progress}%` }}
                        className={`h-full transition-all ${
                          task.status === "completed"
                            ? "bg-emerald-500"
                            : overdue
                              ? "bg-red-500"
                              : "bg-primary"
                        }`}
                      />
                    </div>
                  </td>

                  {/* 8. Hành động nhanh */}
                  <td
                    className="py-3 px-3.5 align-top text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {task.status === "todo" && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(task.id, "in_progress")}
                          className="h-7 px-2.5 rounded-md bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 text-[11px] font-bold cursor-pointer"
                        >
                          Nhận việc
                        </button>
                      )}
                      {task.status === "in_progress" && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(task.id, "pending_review")}
                          className="h-7 px-2.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Gửi duyệt
                        </button>
                      )}
                      {task.status === "pending_review" && isManager && (
                        <button
                          type="button"
                          onClick={() => onChangeStatus(task.id, "completed")}
                          className="h-7 px-2.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                        >
                          Duyệt
                        </button>
                      )}
                      {task.machineCode && (
                        <button
                          type="button"
                          onClick={() => onQuickReportIncident(task)}
                          className="h-7 px-2 rounded-md border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-[11px] font-bold cursor-pointer"
                          title={`Báo hỏng nhanh máy ${task.machineCode}`}
                        >
                          Báo hỏng
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelectTask(task)}
                        className="h-7 px-2.5 rounded-md border border-border bg-background hover:bg-muted/20 text-[11px] font-semibold text-foreground cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

