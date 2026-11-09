import React from "react";
import type { TaskCategory, TaskPriority, TaskStatus } from "../../types/task";

export type TaskIconName =
  | "clipboard"
  | "play"
  | "clock"
  | "check"
  | "alert"
  | "calendar"
  | "kanban"
  | "list"
  | "search"
  | "filter"
  | "plus"
  | "user"
  | "link"
  | "repeat"
  | "paperclip"
  | "message"
  | "history"
  | "wrench"
  | "bell"
  | "x"
  | "edit"
  | "chevronLeft"
  | "chevronRight";

interface TaskIconProps {
  name: TaskIconName;
  size?: number;
  className?: string;
}

export const TaskIcon: React.FC<TaskIconProps> = ({ name, size = 16, className = "" }) => {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };

  switch (name) {
    case "clipboard":
      return (
        <svg {...props}>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6M9 16h6" />
        </svg>
      );
    case "play":
      return (
        <svg {...props}>
          <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "check":
      return (
        <svg {...props}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...props}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "kanban":
      return (
        <svg {...props}>
          <rect x="3" y="3" width="5" height="18" rx="1" />
          <rect x="10" y="3" width="5" height="12" rx="1" />
          <rect x="17" y="3" width="4" height="15" rx="1" />
        </svg>
      );
    case "list":
      return (
        <svg {...props}>
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      );
    case "search":
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "filter":
      return (
        <svg {...props}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
      );
    case "plus":
      return (
        <svg {...props}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    case "user":
      return (
        <svg {...props}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "link":
      return (
        <svg {...props}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    case "repeat":
      return (
        <svg {...props}>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v1a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "paperclip":
      return (
        <svg {...props}>
          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
      );
    case "message":
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "history":
      return (
        <svg {...props}>
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      );
    case "wrench":
      return (
        <svg {...props}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      );
    case "bell":
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props}>
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      );
    case "chevronLeft":
      return (
        <svg {...props}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case "chevronRight":
      return (
        <svg {...props}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case "x":
    default:
      return (
        <svg {...props}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
  }
};

export const TASK_STATUS_META: Record<
  TaskStatus,
  { label: string; shortLabel: string; icon: TaskIconName; badgeClass: string; dotClass: string }
> = {
  todo: {
    label: "Chưa bắt đầu",
    shortLabel: "Chưa làm",
    icon: "clock",
    badgeClass: "bg-muted/30 text-foreground border-border",
    dotClass: "bg-muted-foreground",
  },
  in_progress: {
    label: "Đang làm",
    shortLabel: "Đang làm",
    icon: "play",
    badgeClass: "bg-primary/15 text-primary border-primary/30",
    dotClass: "bg-primary",
  },
  pending_review: {
    label: "Chờ duyệt",
    shortLabel: "Chờ duyệt",
    icon: "clipboard",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    dotClass: "bg-amber-500",
  },
  completed: {
    label: "Hoàn thành",
    shortLabel: "Hoàn thành",
    icon: "check",
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
};

export const TASK_PRIORITY_META: Record<
  TaskPriority,
  { label: string; symbol: string; badgeClass: string }
> = {
  low: {
    label: "Thấp",
    symbol: "▽",
    badgeClass: "bg-muted/25 text-muted-foreground border-border",
  },
  medium: {
    label: "Trung bình",
    symbol: "◇",
    badgeClass: "bg-primary/12 text-primary border-primary/25",
  },
  high: {
    label: "Cao",
    symbol: "△",
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  urgent: {
    label: "Khẩn cấp",
    symbol: "⚡",
    badgeClass: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/35",
  },
};

export const TASK_CATEGORY_META: Record<TaskCategory, { icon: string; badgeClass: string }> = {
  "Vận hành": { icon: "⚙️", badgeClass: "bg-primary/10 text-primary border-primary/20" },
  "Bảo trì": { icon: "🔧", badgeClass: "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/25" },
  "Kiểm tra chất lượng": { icon: "🔬", badgeClass: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25" },
  "Kho": { icon: "📦", badgeClass: "bg-muted/30 text-foreground border-border" },
  "Vận chuyển": { icon: "🚛", badgeClass: "bg-primary/10 text-foreground border-border" },
};

