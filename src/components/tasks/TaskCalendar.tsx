import React, { useMemo, useState } from "react";
import type { Task } from "../../types/task";
import { isTaskOverdue } from "../../services/taskStorage";
import { TASK_STATUS_META, TaskIcon } from "./TaskIcons";

interface TaskCalendarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

type CalendarScale = "week" | "month";

const WEEKDAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export const TaskCalendar: React.FC<TaskCalendarProps> = ({ tasks, onSelectTask }) => {
  const [scale, setScale] = useState<CalendarScale>("week");
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());

  const toDateKey = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const todayKey = toDateKey(new Date());

  // Nhóm công việc theo ngày YYYY-MM-DD
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [tasks]);

  // Tính danh sách các ngày cần hiển thị
  const calendarDays = useMemo(() => {
    const base = new Date(anchorDate);
    base.setHours(0, 0, 0, 0);

    if (scale === "week") {
      // Đưa về Thứ Hai của tuần hiện tại
      const dayOfWeek = base.getDay(); // 0 = CN, 1 = T2
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(base);
      monday.setDate(base.getDate() + diffToMonday);

      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { date: d, inCurrentMonth: true };
      });
    }

    // Chế độ xem Tháng
    const firstOfMonth = new Date(base.getFullYear(), base.getMonth(), 1);
    const startDay = firstOfMonth.getDay();
    const offset = startDay === 0 ? -6 : 1 - startDay;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() + offset);

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return {
        date: d,
        inCurrentMonth: d.getMonth() === base.getMonth(),
      };
    });
  }, [anchorDate, scale]);

  const handleNavigate = (dir: -1 | 0 | 1) => {
    if (dir === 0) {
      setAnchorDate(new Date());
      return;
    }
    const next = new Date(anchorDate);
    if (scale === "week") {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setAnchorDate(next);
  };

  const periodTitle = useMemo(() => {
    if (scale === "week" && calendarDays.length === 7) {
      const first = calendarDays[0].date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
      const last = calendarDays[6].date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      return `Tuần: ${first} – ${last}`;
    }
    return anchorDate.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [anchorDate, calendarDays, scale]);

  return (
    <section
      aria-label="Lịch theo dõi công việc"
      className="rounded-xl border border-border bg-card overflow-hidden shadow-xs"
    >
      {/* Thanh điều khiển lịch */}
      <div className="p-3.5 border-b border-border flex flex-wrap items-center justify-between gap-2.5 bg-muted/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate(-1)}
            aria-label="Kỳ trước"
            className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted/20 flex items-center justify-center text-foreground cursor-pointer"
          >
            <TaskIcon name="chevronLeft" size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleNavigate(0)}
            className="h-8 px-3 rounded-lg border border-border bg-card hover:bg-muted/20 text-xs font-bold text-foreground cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handleNavigate(1)}
            aria-label="Kỳ tiếp theo"
            className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-muted/20 flex items-center justify-center text-foreground cursor-pointer"
          >
            <TaskIcon name="chevronRight" size={15} />
          </button>
          <h3 className="text-sm font-black text-foreground ml-1 capitalize">
            {periodTitle}
          </h3>
        </div>

        {/* Chú thích màu trạng thái + Chuyển đổi Tuần / Tháng */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden xl:flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" /> Chưa làm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Đang làm
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Chờ duyệt
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Hoàn thành
            </span>
            <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
              ⚠ Quá hạn
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Chế độ xem lịch"
            className="inline-flex items-center p-1 rounded-lg bg-muted/25 border border-border"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scale === "week"}
              onClick={() => setScale("week")}
              className={`h-7 px-3 rounded-md text-xs font-bold cursor-pointer ${
                scale === "week"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Theo Tuần
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scale === "month"}
              onClick={() => setScale("month")}
              className={`h-7 px-3 rounded-md text-xs font-bold cursor-pointer ${
                scale === "month"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Theo Tháng
            </button>
          </div>
        </div>
      </div>

      {/* Lưới lịch */}
      <div className="overflow-x-auto">
        <div className="min-w-[780px]">
          {/* Header Thứ trong tuần */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/20">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="py-2 px-3 text-center text-[11px] font-bold uppercase text-muted-foreground border-r last:border-r-0 border-border"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Các ô ngày */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {calendarDays.map(({ date, inCurrentMonth }) => {
              const key = toDateKey(date);
              const isToday = key === todayKey;
              const dayTasks = tasksByDate[key] || [];

              return (
                <div
                  key={key}
                  className={`p-2 flex flex-col gap-1.5 ${
                    scale === "week" ? "min-h-[260px]" : "min-h-[125px]"
                  } ${
                    !inCurrentMonth ? "bg-muted/10 opacity-60" : "bg-card"
                  } ${isToday ? "ring-2 ring-inset ring-primary/50 bg-primary/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                        {dayTasks.length} việc
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-56 pr-0.5">
                    {dayTasks.map((task) => {
                      const overdue = isTaskOverdue(task);
                      const statusMeta = TASK_STATUS_META[task.status];
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => onSelectTask(task)}
                          className={`w-full text-left p-1.5 rounded-lg border text-[11px] transition-all cursor-pointer hover:brightness-95 ${
                            overdue
                              ? "border-red-500/50 bg-red-500/15 text-red-600 dark:text-red-400"
                              : statusMeta.badgeClass
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 font-mono text-[10px] font-bold">
                            <span>{task.code}</span>
                            <span>{overdue ? "⚠ Quá hạn" : statusMeta.shortLabel}</span>
                          </div>
                          <div className="font-semibold text-foreground line-clamp-2 mt-0.5 leading-tight">
                            {task.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                            👤 {task.assigneeName.split("(")[0].trim()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

