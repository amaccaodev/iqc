import React from "react";
import type { Task, TaskKpiFilter } from "../../types/task";
import { isTaskOverdue } from "../../services/taskStorage";
import { TaskIcon } from "./TaskIcons";

interface TaskKpiBarProps {
  tasks: Task[];
  activeKpi: TaskKpiFilter;
  onSelectKpi: (filter: TaskKpiFilter) => void;
}

export const TaskKpiBar: React.FC<TaskKpiBarProps> = ({
  tasks,
  activeKpi,
  onSelectKpi,
}) => {
  const totalCount = tasks.length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const pendingReviewCount = tasks.filter((t) => t.status === "pending_review").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;

  // Tính tỷ lệ hoàn thành đúng hạn trong 7 ngày gần nhất
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekTasks = tasks.filter((t) => {
    const dueMs = new Date(t.dueDate).getTime();
    return dueMs >= sevenDaysAgo;
  });
  const completedOnTimeWeek = weekTasks.filter((t) => {
    if (t.status !== "completed") return false;
    if (!t.completedAt) return true;
    return new Date(t.completedAt).getTime() <= new Date(t.dueDate).getTime();
  }).length;
  const dueOrCompletedWeek = weekTasks.filter(
    (t) => t.status === "completed" || isTaskOverdue(t),
  ).length;
  const onTimeRate =
    dueOrCompletedWeek > 0
      ? Math.round((completedOnTimeWeek / dueOrCompletedWeek) * 100)
      : 100;

  const cards: Array<{
    key: TaskKpiFilter;
    label: string;
    value: number;
    subtext: string;
    icon: "clipboard" | "clock" | "play" | "check" | "alert";
    accentClass: string;
    activeRing: string;
  }> = [
    {
      key: "all",
      label: "Tổng công việc",
      value: totalCount,
      subtext: "Toàn bộ việc trong phạm vi",
      icon: "clipboard",
      accentClass: "text-foreground bg-muted/25 border-border",
      activeRing: "ring-2 ring-primary border-primary bg-primary/5",
    },
    {
      key: "todo",
      label: "Chưa bắt đầu",
      value: todoCount,
      subtext: "Chờ công nhân tiếp nhận",
      icon: "clock",
      accentClass: "text-muted-foreground bg-muted/20 border-border",
      activeRing: "ring-2 ring-primary border-primary bg-primary/5",
    },
    {
      key: "in_progress",
      label: "Đang làm",
      value: inProgressCount,
      subtext: "Đang thực thi tại xưởng",
      icon: "play",
      accentClass: "text-primary bg-primary/12 border-primary/25",
      activeRing: "ring-2 ring-primary border-primary bg-primary/10",
    },
    {
      key: "pending_review",
      label: "Chờ duyệt",
      value: pendingReviewCount,
      subtext: "Chờ Quản đốc / KCS nghiệm thu",
      icon: "clipboard",
      accentClass: "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30",
      activeRing: "ring-2 ring-amber-500 border-amber-500 bg-amber-500/10",
    },
    {
      key: "completed",
      label: "Hoàn thành",
      value: completedCount,
      subtext: "Đã nghiệm thu đạt yêu cầu",
      icon: "check",
      accentClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      activeRing: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/10",
    },
    {
      key: "overdue",
      label: "Quá hạn",
      value: overdueCount,
      subtext: overdueCount > 0 ? "Cần đôn đốc xử lý ngay!" : "Không có việc trễ hạn",
      icon: "alert",
      accentClass:
        overdueCount > 0
          ? "text-red-600 dark:text-red-400 bg-red-500/15 border-red-500/35"
          : "text-muted-foreground bg-muted/20 border-border",
      activeRing: "ring-2 ring-red-500 border-red-500 bg-red-500/10",
    },
  ];

  const handleCardClick = (key: TaskKpiFilter) => {
    if (activeKpi === key && key !== "all") {
      onSelectKpi("all");
    } else {
      onSelectKpi(key);
    }
  };

  return (
    <section aria-label="Thống kê chỉ số công việc" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
      {cards.map((card) => {
        const isSelected = activeKpi === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => handleCardClick(card.key)}
            aria-pressed={isSelected}
            className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between bg-card hover:bg-muted/15 focus:outline-none focus:ring-2 focus:ring-ring ${
              isSelected ? card.activeRing : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[11px] font-bold text-muted-foreground truncate">
                {card.label}
              </span>
              <span
                className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${card.accentClass}`}
              >
                <TaskIcon name={card.icon} size={13} />
              </span>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-1">
              <span className="text-xl sm:text-2xl font-black font-mono text-foreground">
                {card.value}
              </span>
              {isSelected && (
                <span className="text-[10px] font-bold text-primary uppercase">
                  Đang lọc
                </span>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground mt-1 truncate">
              {card.subtext}
            </p>
          </button>
        );
      })}

      {/* Thẻ 7: Tỷ lệ hoàn thành đúng hạn trong tuần */}
      <div
        className="p-3 rounded-xl border border-border bg-card flex flex-col justify-between col-span-2 sm:col-span-3 lg:col-span-1"
        role="region"
        aria-label="Tỷ lệ hoàn thành đúng hạn trong tuần"
      >
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground truncate">
            Đúng hạn tuần
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            SLA
          </span>
        </div>

        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            {onTimeRate}%
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {completedOnTimeWeek}/{dueOrCompletedWeek} việc
          </span>
        </div>

        <div className="mt-1.5 w-full h-2 rounded-full bg-muted/30 overflow-hidden">
          <div
            style={{ width: `${onTimeRate}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
          />
        </div>
      </div>
    </section>
  );
};

