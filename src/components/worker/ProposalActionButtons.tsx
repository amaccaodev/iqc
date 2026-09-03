import type { MachineChangeKind } from "@shared/types";
import { WORKER_BTN_GHOST } from "./workerUi";

export const MACHINE_PROPOSAL_KIND_LABEL: Record<MachineChangeKind, string> = {
  change_machine: "Thay máy",
  add_machine: "Thêm máy",
  report_broken: "Báo hỏng",
};

export const MACHINE_PROPOSAL_ACTIONS: Array<{
  kind: MachineChangeKind;
  label: string;
  hint: string;
  fa: string;
}> = [
  {
    kind: "change_machine",
    label: "Thay máy",
    hint: "Đổi sang máy khác khi đang sản xuất",
    fa: "fa-right-left",
  },
  {
    kind: "add_machine",
    label: "Thêm máy",
    hint: "Bổ sung thêm máy cho cùng quy trình",
    fa: "fa-plus",
  },
  {
    kind: "report_broken",
    label: "Báo hỏng",
    hint: "Máy hỏng — cần cơ điện / tổ trưởng",
    fa: "fa-triangle-exclamation",
  },
];

interface ProposalActionButtonsProps {
  onSelect: (kind: MachineChangeKind) => void;
  /** vertical list (FAB sheet) | grid (info panel) */
  layout?: "list" | "grid";
}

/** Cùng style cho Thay máy / Thêm máy / Báo hỏng */
export default function ProposalActionButtons({
  onSelect,
  layout = "list",
}: ProposalActionButtonsProps) {
  const wrap =
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-3 gap-2"
      : "space-y-2";

  return (
    <div className={wrap}>
      {MACHINE_PROPOSAL_ACTIONS.map((a) => (
        <button
          key={a.kind}
          type="button"
          onClick={() => onSelect(a.kind)}
          className={`${WORKER_BTN_GHOST} w-full justify-start text-left font-semibold shadow-none px-3 py-3`}
        >
          <span className="w-9 h-9 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
            <i className={`fas ${a.fa}`} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">{a.label}</span>
            <span className="block text-[11px] text-muted">{a.hint}</span>
          </span>
          <i className="fas fa-chevron-right text-muted text-xs" />
        </button>
      ))}
    </div>
  );
}
