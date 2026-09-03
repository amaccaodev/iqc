import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Role } from "@shared/types";
import {
  WORKFLOW_BACKLOG,
  WORKFLOW_STATUS_LABEL,
  WORKFLOW_STEPS,
  type WorkflowStep,
} from "@shared/constants/workflow";
import { useAuth } from "../../hooks/useAuth";

const STATUS_STYLE = {
  done: "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]",
  partial: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
  planned: "bg-surface text-muted border-border",
};

export default function WorkflowMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pick, setPick] = useState<WorkflowStep | null>(null);

  const canOpen = (step: WorkflowStep) => {
    if (!user || !step.path) return false;
    if (user.role === "admin" || user.role === "director") return true;
    return user.role === step.role;
  };

  const summary = useMemo(() => {
    const done = WORKFLOW_STEPS.filter((s) => s.status === "done").length;
    const partial = WORKFLOW_STEPS.filter((s) => s.status === "partial").length;
    return { done, partial, total: WORKFLOW_STEPS.length };
  }, []);

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display font-700 text-base flex items-center gap-2">
            <i className="fas fa-diagram-project text-primary" /> Quy trình sản xuất
          </h3>
          <p className="text-xs text-muted mt-0.5">
            {summary.done} hoàn thành · {summary.partial} đang làm
          </p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm overflow-x-auto">
        <div className="min-w-[280px] space-y-2">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.id}>
              <button
                type="button"
                onClick={() => setPick(step)}
                className={`w-full text-left rounded-xl border px-3 py-3 cursor-pointer transition-colors hover:border-ring ${STATUS_STYLE[step.status]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{step.title}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{step.subtitle}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 flex-shrink-0">
                    {WORKFLOW_STATUS_LABEL[step.status]}
                  </span>
                </div>
              </button>
              {i < WORKFLOW_STEPS.length - 1 ? (
                <div className="flex justify-center py-1 text-[#CBD5E1]">
                  <i className="fas fa-arrow-down text-xs" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-semibold text-muted mb-2">Backlog phát triển</div>
          <div className="flex flex-wrap gap-2">
            {WORKFLOW_BACKLOG.map((b) => (
              <span
                key={b.label}
                className={`text-[10px] px-2 py-1 rounded-lg border ${STATUS_STYLE[b.status]}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {pick ? (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center keyboard-aware-overlay"
          onClick={() => setPick(null)}
        >
          <div
            className="bg-card rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[min(88vh,calc(100dvh-var(--keyboard-inset,0px)-1rem))] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <div className="sm:hidden w-10 h-1 bg-border rounded-full mx-auto mb-3" />
              <div className="flex justify-between gap-3">
                <div>
                  <div className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mb-2 ${STATUS_STYLE[pick.status]}`}>
                    {WORKFLOW_STATUS_LABEL[pick.status]}
                  </div>
                  <h4 className="font-display font-700 text-base">{pick.title}</h4>
                  <p className="text-sm text-muted mt-1">{pick.subtitle}</p>
                </div>
                <button type="button" onClick={() => setPick(null)} className="w-9 h-9 rounded-full bg-surface border-0 cursor-pointer text-lg">×</button>
              </div>
            </div>
            <div className="px-5 pb-5 overflow-y-auto flex-1">
              <div className="text-xs font-semibold text-muted mb-2">Chức năng liên quan</div>
              <ul className="space-y-1.5 mb-4">
                {pick.features.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <i className="fas fa-check text-[#16A34A] text-xs mt-1" />
                    {f}
                  </li>
                ))}
              </ul>
              {pick.path && canOpen(pick) ? (
                <button
                  type="button"
                  onClick={() => {
                    navigate(pick.path!);
                    setPick(null);
                  }}
                  className="w-full h-11 rounded-xl bg-primary text-white text-sm font-semibold border-0 cursor-pointer"
                >
                  Mở màn hình {roleLabel(pick.role)}
                </button>
              ) : pick.path ? (
                <p className="text-xs text-muted-foreground text-center">Đăng nhập vai {roleLabel(pick.role as Role)} để mở màn hình này</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function roleLabel(role: Role | "worker") {
  const m: Record<string, string> = {
    director: "GĐ",
    supervisor: "Quản đốc",
    teamlead: "Tổ trưởng",
    worker: "Công nhân",
    qc: "QC",
    stats: "Thống kê",
    mechanic: "Cơ điện",
    admin: "Admin",
  };
  return m[role] ?? role;
}
