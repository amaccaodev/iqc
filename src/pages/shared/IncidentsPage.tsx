/**
 * IncidentsPage — worker/teamlead báo sự cố; Cơ điện / supervisor xử lý.
 */
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Machine, MachineIncident } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { catalogApi } from "../../services/api/CatalogApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { ResponsiveDataList, SearchPicker } from "../../components/ui";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};
const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  assigned: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Mới",
  assigned: "Đã tiếp nhận",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đã đóng",
};

export default function IncidentsPage() {
  const user = useRoleUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const isWorker = user.role === "worker" || user.role === "teamlead";
  const isHandler = user.role === "supervisor" || user.role === "mechanic";

  const fetchIncidents = useStableFetch((query) => workflowApi.listIncidents(query));
  const {
    items: incidents,
    total,
    page,
    pageSize,
    setPage,
    q,
    setQ,
    loading,
    refresh,
  } = usePagedList({ fetchPage: fetchIncidents, pageSize: LIST_UI_PAGE_SIZE });

  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [resolveModal, setResolveModal] = useState<MachineIncident | null>(null);
  const [form, setForm] = useState({
    machineId: "",
    machineName: "",
    machineCode: "",
    severity: "medium" as MachineIncident["severity"],
    description: "",
  });
  const [resolveForm, setResolveForm] = useState({ resolutionNote: "", downtimeMinutes: "0" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isWorker) return;
    if (searchParams.get("create") !== "1") return;
    setShowCreate(true);
    const next = new URLSearchParams(searchParams);
    next.delete("create");
    setSearchParams(next, { replace: true });
  }, [isWorker, searchParams, setSearchParams]);

  const loadStats = useCallback(async () => {
    try {
      setStatusCounts(await workflowApi.getIncidentStats());
    } catch {
      setStatusCounts({});
    }
  }, []);

  useEffect(() => {
    void loadStats();
    void catalogApi.listMachines().then((mac) => setMachines(mac.filter((m) => m.active))).catch(() => setMachines([]));
  }, [loadStats]);

  const searchMachines = useCallback(
    async (query: string) => {
      const qLower = query.trim().toLowerCase();
      const filtered = machines.filter(
        (m) =>
          !qLower ||
          m.code.toLowerCase().includes(qLower) ||
          m.name.toLowerCase().includes(qLower),
      );
      return filtered.slice(0, 15).map((m) => ({
        id: m.id,
        label: `${m.code} — ${m.name}`,
      }));
    },
    [machines],
  );

  const pickMachine = (id: string, item: { id: string; label: string } | null) => {
    const m = machines.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      machineId: id,
      machineName: m?.name ?? item?.label.split(" — ")[1] ?? f.machineName,
      machineCode: m?.code ?? item?.label.split(" — ")[0] ?? f.machineCode,
    }));
  };

  const createIncident = async () => {
    if (!form.machineName.trim() || !form.description.trim()) {
      alert("Vui lòng điền tên máy và mô tả sự cố.");
      return;
    }
    setSaving(true);
    try {
      await workflowApi.createIncident({
        machineId: form.machineId || undefined,
        machineName: form.machineName,
        machineCode: form.machineCode,
        severity: form.severity,
        description: form.description,
        reportedBy: user.id,
        reportedName: user.name,
      });
      setShowCreate(false);
      setForm({ machineId: "", machineName: "", machineCode: "", severity: "medium", description: "" });
      refresh();
      void loadStats();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    if (!resolveForm.resolutionNote.trim()) {
      alert("Vui lòng điền ghi chú xử lý.");
      return;
    }
    setSaving(true);
    try {
      await workflowApi.resolveIncident(
        resolveModal.id,
        user.id,
        user.name,
        resolveForm.resolutionNote,
        Number(resolveForm.downtimeMinutes),
      );
      setResolveModal(null);
      refresh();
      void loadStats();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (id: string) => {
    try {
      await workflowApi.assignIncident(id, user.id, user.name);
      refresh();
      void loadStats();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await workflowApi.confirmIncident(id, user.id);
      refresh();
      void loadStats();
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const renderActions = (inc: MachineIncident) =>
    isHandler ? (
      <div className="flex flex-wrap gap-2 mt-3">
        {inc.status === "open" && (
          <button
            type="button"
            onClick={() => void handleAssign(inc.id)}
            className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg border-0 cursor-pointer"
          >
            <i className="fas fa-hand-pointer mr-1" /> Tiếp nhận
          </button>
        )}
        {(inc.status === "assigned" || inc.status === "in_progress" || inc.status === "open") && (
          <button
            type="button"
            onClick={() => {
              setResolveModal(inc);
              setResolveForm({ resolutionNote: "", downtimeMinutes: "0" });
            }}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg border-0 cursor-pointer"
          >
            Hoàn thành
          </button>
        )}
        {user.role === "supervisor" && inc.status === "resolved" && (
          <button
            type="button"
            onClick={() => void handleConfirm(inc.id)}
            className="text-xs bg-slate-600 text-white px-3 py-1.5 rounded-lg border-0 cursor-pointer"
          >
            Xác nhận đóng
          </button>
        )}
      </div>
    ) : null;

  return (
    <div className="max-w-full min-w-0">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl"><i className="fas fa-triangle-exclamation text-orange-500 mr-2" />Báo hỏng</h2>
          <p className="text-sm text-muted mt-0.5">
            {isWorker
              ? "Báo cáo và theo dõi sự cố thiết bị"
              : user.role === "mechanic"
                ? "Hàng đợi Cơ điện — tiếp nhận và hoàn thành"
                : "Tiếp nhận và xử lý sự cố máy"}
          </p>
        </div>
        {isWorker && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl cursor-pointer border-0"
          >
            <i className="fas fa-triangle-exclamation" /> Báo sự cố
          </button>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-5">
        {(
          [
            ["open", "Mới"],
            ["assigned", "Tiếp nhận"],
            ["in_progress", "Đang sửa"],
            ["resolved", "Xong"],
          ] as const
        ).map(([st, label]) => (
          <div key={st} className="bg-card rounded-xl border border-border p-3 text-center">
            <div className="text-lg font-bold text-primary">{statusCounts[st] ?? 0}</div>
            <div className="text-[11px] text-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <input
          className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          placeholder="Tìm máy, mã, mô tả sự cố…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="text-xs text-muted-foreground mt-1">{total} sự cố · trang {page}</p>
      </div>

      {loading ? (
        <div className="text-center text-muted py-10">Đang tải...</div>
      ) : (
        <ResponsiveDataList
          items={incidents}
          getKey={(inc) => inc.id}
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          emptyText="Chưa có sự cố"
          columns={[
            {
              key: "machine",
              header: "Máy",
              render: (inc) => (
                <div>
                  <div className="font-semibold">{inc.machineName}</div>
                  <code className="text-xs text-muted">{inc.machineCode}</code>
                </div>
              ),
            },
            {
              key: "desc",
              header: "Mô tả",
              render: (inc) => <span className="text-sm text-muted">{inc.description}</span>,
            },
            {
              key: "severity",
              header: "Mức độ",
              render: (inc) => (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[inc.severity]}`}>
                  {SEVERITY_LABEL[inc.severity]}
                </span>
              ),
            },
            {
              key: "status",
              header: "Trạng thái",
              render: (inc) => (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[inc.status]}`}>
                  {STATUS_LABEL[inc.status]}
                </span>
              ),
            },
            {
              key: "time",
              header: "Báo lúc",
              render: (inc) => (
                <span className="text-xs text-muted-foreground">
                  {new Date(inc.reportedAt).toLocaleString("vi-VN")}
                </span>
              ),
            },
          ]}
          renderCard={(inc) => (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-semibold">
                    {inc.machineName}{" "}
                    <code className="text-xs text-muted">{inc.machineCode}</code>
                  </div>
                  <div className="text-sm text-muted mt-1">{inc.description}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {inc.reportedName} · {new Date(inc.reportedAt).toLocaleString("vi-VN")}
                    {inc.downtimeMinutes ? ` · Downtime ${inc.downtimeMinutes} phút` : ""}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[inc.severity]}`}>
                    {SEVERITY_LABEL[inc.severity]}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[inc.status]}`}>
                    {STATUS_LABEL[inc.status]}
                  </span>
                </div>
              </div>
              {renderActions(inc)}
              {inc.resolutionNote ? (
                <div className="mt-2 text-xs bg-green-50 text-green-800 rounded-lg px-3 py-2">
                  Xử lý: {inc.resolutionNote}
                </div>
              ) : null}
            </div>
          )}
        />
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-5 space-y-3">
            <div className="font-bold text-lg">Báo sự cố máy</div>
            {machines.length > 0 && (
              <label className="text-sm block">
                <span className="text-muted">Chọn máy</span>
                <SearchPicker
                  className="mt-1"
                  value={form.machineId}
                  displayValue={form.machineId ? `${form.machineCode} — ${form.machineName}` : ""}
                  placeholder="Tìm máy…"
                  onSearch={searchMachines}
                  onChange={pickMachine}
                />
              </label>
            )}
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Tên máy"
              value={form.machineName}
              onChange={(e) => setForm({ ...form, machineName: e.target.value })}
            />
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              placeholder="Mã máy"
              value={form.machineCode}
              onChange={(e) => setForm({ ...form, machineCode: e.target.value })}
            />
            <select
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as MachineIncident["severity"] })}
            >
              {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px]"
              placeholder="Mô tả (thông số sai...)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 rounded-xl border border-border bg-card cursor-pointer" onClick={() => setShowCreate(false)}>
                Huỷ
              </button>
              <button
                type="button"
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-primary text-white border-0 cursor-pointer"
                onClick={() => void createIncident()}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-5 space-y-3">
            <div className="font-bold text-lg">Hoàn thành sửa máy</div>
            <div className="text-sm text-muted">{resolveModal.machineName}</div>
            <textarea
              className="w-full border border-border rounded-lg px-3 py-2 text-sm min-h-[80px]"
              placeholder="Ghi chú xử lý"
              value={resolveForm.resolutionNote}
              onChange={(e) => setResolveForm({ ...resolveForm, resolutionNote: e.target.value })}
            />
            <input
              className="w-full border border-border rounded-lg px-3 py-2 text-sm"
              type="number"
              placeholder="Downtime (phút)"
              value={resolveForm.downtimeMinutes}
              onChange={(e) => setResolveForm({ ...resolveForm, downtimeMinutes: e.target.value })}
            />
            <div className="flex gap-2">
              <button type="button" className="flex-1 py-2 rounded-xl border border-border bg-card cursor-pointer" onClick={() => setResolveModal(null)}>
                Huỷ
              </button>
              <button
                type="button"
                disabled={saving}
                className="flex-1 py-2 rounded-xl bg-green-600 text-white border-0 cursor-pointer"
                onClick={() => void handleResolve()}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
