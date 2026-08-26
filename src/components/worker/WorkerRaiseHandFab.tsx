import { useCallback, useEffect, useState } from "react";
import type { Machine, MachineChangeKind } from "@shared/types";
import { useAuth } from "../../hooks/useAuth";
import { catalogApi } from "../../services/api/CatalogApiService";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { SearchPicker } from "../ui";
import DraggableFab from "../ui/DraggableFab";
import ProposalActionButtons, { MACHINE_PROPOSAL_KIND_LABEL } from "./ProposalActionButtons";
import { toast } from "../../hooks/useToast";

interface WorkerRaiseHandFabProps {
  hidden?: boolean;
}

/**
 * FAB đề xuất: luôn hiện 3 lựa chọn Thay máy / Thêm máy / Báo hỏng,
 * rồi mở form tương ứng. Nhân viên chỉ chọn/nhập tên máy — không nhập mã máy.
 */
export default function WorkerRaiseHandFab({ hidden = false }: WorkerRaiseHandFabProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [kind, setKind] = useState<MachineChangeKind | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [saving, setSaving] = useState(false);
  const [fromMachineId, setFromMachineId] = useState("");
  const [fromMachineName, setFromMachineName] = useState("");
  const [toMachineName, setToMachineName] = useState("");
  const [reason, setReason] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

  useEffect(() => {
    void catalogApi
      .listMachines()
      .then((list) => setMachines(Array.isArray(list) ? list.filter((m) => m.active !== false) : []))
      .catch(() => setMachines([]));
  }, []);

  const searchMachines = useCallback(
    async (query: string) => {
      const q = query.trim().toLowerCase();
      return machines
        .filter((m) => !q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))
        .slice(0, 20)
        .map((m) => ({ id: m.id, label: m.name }));
    },
    [machines],
  );

  const resetForm = () => {
    setFromMachineId("");
    setFromMachineName("");
    setToMachineName("");
    setReason("");
    setSeverity("medium");
  };

  const openKind = (k: MachineChangeKind) => {
    setMenuOpen(false);
    resetForm();
    setKind(k);
  };

  const closeForm = () => {
    setKind(null);
    resetForm();
  };

  const submit = async () => {
    if (!user || !kind) return;
    if (!fromMachineName.trim()) {
      toast.error("Chọn hoặc nhập tên máy");
      return;
    }
    if (!reason.trim()) {
      toast.error(kind === "report_broken" ? "Nhập mô tả sự cố" : "Nhập lý do đề xuất");
      return;
    }
    if (kind === "change_machine" && !toMachineName.trim()) {
      toast.error("Nhập tên máy muốn thay thế");
      return;
    }
    if (kind === "add_machine" && !toMachineName.trim()) {
      toast.error("Nhập tên máy muốn thêm");
      return;
    }

    setSaving(true);
    try {
      if (kind === "report_broken") {
        const m = machines.find((x) => x.id === fromMachineId);
        await workflowApi.createIncident({
          machineId: fromMachineId || undefined,
          machineName: fromMachineName.trim(),
          machineCode: m?.code ?? "",
          severity,
          description: reason.trim(),
          reportedBy: user.id,
          reportedName: user.name,
        });
        toast.success("Đã gửi báo hỏng máy");
      } else {
        await catalogApi.createChangeRequest({
          requestedBy: user.id,
          requestedName: user.name,
          reason: reason.trim(),
          kind,
          target: "teamlead",
          fromMachine: fromMachineName.trim(),
          toMachine: toMachineName.trim(),
        });
        toast.success(`Đã gửi đề xuất: ${MACHINE_PROPOSAL_KIND_LABEL[kind]}`);
      }
      closeForm();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DraggableFab
        storageKey="iqc-fab-worker-raise"
        ariaLabel="Đề xuất máy"
        hidden={hidden}
        onPress={() => setMenuOpen(true)}
        className="bg-[#1B3A5C] text-white dark:bg-[var(--nav-active)]"
      >
        <span className="relative flex flex-col items-center justify-center leading-none">
          <i className="fas fa-hand text-xl" aria-hidden />
          <span className="text-[9px] font-semibold mt-0.5 tracking-wide">Đề xuất</span>
        </span>
      </DraggableFab>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
            aria-label="Đóng"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Đề xuất máy"
            className="relative z-10 w-full sm:max-w-md bg-card text-foreground rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center shrink-0">
                <i className="fas fa-hand" />
              </div>
              <div>
                <div className="font-display font-700 text-base">Đề xuất máy</div>
                <p className="text-xs text-muted">Chọn một trong 3 loại yêu cầu</p>
              </div>
            </div>

            <ProposalActionButtons onSelect={openKind} layout="list" />

            <button
              type="button"
              className="mt-3 w-full py-2.5 rounded-xl border-2 border-[#1B3A5C] bg-card text-sm font-semibold cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      {kind ? (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 border-0 cursor-pointer"
            aria-label="Đóng form"
            onClick={closeForm}
          />
          <div className="relative z-10 w-full sm:max-w-md bg-card text-foreground rounded-t-2xl sm:rounded-2xl shadow-xl border border-border p-5 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="font-display font-700 text-lg">
              {MACHINE_PROPOSAL_KIND_LABEL[kind]}
            </div>
            <p className="text-xs text-muted -mt-1">
              Chỉ cần tên máy — không cần mã máy.
            </p>

            {machines.length > 0 && (
              <label className="text-sm block">
                <span className="text-muted">
                  {kind === "add_machine" ? "Máy đang dùng (nếu có)" : "Chọn máy"}
                </span>
                <SearchPicker
                  className="mt-1"
                  value={fromMachineId}
                  displayValue={fromMachineName}
                  placeholder="Tìm theo tên máy…"
                  onSearch={searchMachines}
                  onChange={(id, item) => {
                    const m = machines.find((x) => x.id === id);
                    setFromMachineId(id);
                    setFromMachineName(m?.name ?? item?.label ?? "");
                  }}
                />
              </label>
            )}

            <label className="text-sm block">
              <span className="text-muted">Tên máy</span>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                placeholder="VD: Cam 0.1, Dập nóng D80T-01…"
                value={fromMachineName}
                onChange={(e) => {
                  setFromMachineName(e.target.value);
                  if (!e.target.value) setFromMachineId("");
                }}
              />
            </label>

            {(kind === "change_machine" || kind === "add_machine") && (
              <label className="text-sm block">
                <span className="text-muted">
                  {kind === "add_machine" ? "Tên máy muốn thêm" : "Tên máy thay thế"}
                </span>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Nhập tên máy…"
                  value={toMachineName}
                  onChange={(e) => setToMachineName(e.target.value)}
                />
              </label>
            )}

            {kind === "report_broken" && (
              <label className="text-sm block">
                <span className="text-muted">Mức độ</span>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                  value={severity}
                  onChange={(e) =>
                    setSeverity(e.target.value as "low" | "medium" | "high" | "critical")
                  }
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao</option>
                  <option value="critical">Khẩn cấp</option>
                </select>
              </label>
            )}

            <label className="text-sm block">
              <span className="text-muted">
                {kind === "report_broken" ? "Mô tả sự cố" : "Lý do"}
              </span>
              <textarea
                className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1 min-h-[80px]"
                placeholder={
                  kind === "report_broken"
                    ? "VD: Máy rung mạnh, dừng giữa ca…"
                    : kind === "add_machine"
                      ? "VD: Cần thêm máy để kịp định mức…"
                      : "VD: Máy hiện tại đo lệch, xin thay…"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl border-2 border-[#1B3A5C] bg-card text-sm font-semibold cursor-pointer"
                onClick={closeForm}
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white border-0 text-sm font-semibold cursor-pointer disabled:opacity-60"
                onClick={() => void submit()}
              >
                {saving ? "Đang gửi…" : "Gửi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
