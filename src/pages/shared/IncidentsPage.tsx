/**
 * IncidentsPage — dùng cho worker (báo sự cố) và supervisor (xem + xác nhận).
 * Role "cơ điện" chưa có trong hệ thống → supervisor xử lý luôn.
 */
import { useState, useEffect, useCallback } from "react";
import type { MachineIncident } from "@shared/types";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";

const SEVERITY_COLOR: Record<string, string> = {
  low: "bg-blue-100 text-blue-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};
const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp", medium: "Trung bình", high: "Cao", critical: "Nghiêm trọng",
};
const STATUS_COLOR: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  assigned: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Mới", assigned: "Đã tiếp nhận", in_progress: "Đang xử lý",
  resolved: "Đã xử lý", closed: "Đã đóng",
};

export default function IncidentsPage() {
  const user = useRoleUser();
  const isWorker = user.role === "worker" || user.role === "teamlead";
  const isSupervisor = user.role === "supervisor";

  const [incidents, setIncidents] = useState<MachineIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [resolveModal, setResolveModal] = useState<MachineIncident | null>(null);
  const [form, setForm] = useState({
    machineName: "", machineCode: "", severity: "medium" as MachineIncident["severity"],
    description: "",
  });
  const [resolveForm, setResolveForm] = useState({ resolutionNote: "", downtimeMinutes: "0" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setIncidents(await workflowApi.getIncidents()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const createIncident = async () => {
    if (!form.machineName.trim() || !form.description.trim()) {
      alert("Vui lòng điền tên máy và mô tả sự cố."); return;
    }
    setSaving(true);
    try {
      await workflowApi.createIncident({
        machineName: form.machineName, machineCode: form.machineCode,
        severity: form.severity, description: form.description,
        reportedBy: user.id, reportedName: user.name,
      });
      setShowCreate(false);
      setForm({ machineName: "", machineCode: "", severity: "medium", description: "" });
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleResolve = async () => {
    if (!resolveModal) return;
    if (!resolveForm.resolutionNote.trim()) { alert("Vui lòng điền ghi chú xử lý."); return; }
    setSaving(true);
    try {
      await workflowApi.resolveIncident(
        resolveModal.id, user.id, user.name,
        resolveForm.resolutionNote, Number(resolveForm.downtimeMinutes),
      );
      setResolveModal(null);
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const handleAssign = async (id: string) => {
    try { await workflowApi.assignIncident(id, user.id, user.name); void load(); }
    catch (e) { alert((e as Error).message); }
  };

  const handleConfirm = async (id: string) => {
    try { await workflowApi.confirmIncident(id, user.id); void load(); }
    catch (e) { alert((e as Error).message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl">Sự cố máy</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {isWorker ? "Báo cáo và theo dõi sự cố thiết bị" : "Tiếp nhận và xử lý sự cố máy"}
          </p>
        </div>
        {isWorker && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2a4f78] transition cursor-pointer border-0"
          >
            <i className="fas fa-triangle-exclamation" /> Báo sự cố
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Mới", status: "open", color: "text-red-600 bg-red-50" },
          { label: "Đang xử lý", status: "in_progress", color: "text-blue-600 bg-blue-50" },
          { label: "Đã xử lý", status: "resolved", color: "text-green-600 bg-green-50" },
          { label: "Đã đóng", status: "closed", color: "text-gray-600 bg-gray-50" },
        ].map(({ label, status, color }) => (
          <div key={status} className={`rounded-xl p-3 text-center ${color}`}>
            <div className="text-2xl font-bold">{incidents.filter(i => i.status === status).length}</div>
            <div className="text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-[#94A3B8]"><i className="fas fa-spinner fa-spin text-2xl" /></div>
      ) : incidents.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-[#94A3B8] shadow-sm">
          <i className="fas fa-check-circle text-4xl block mb-3 text-green-400 opacity-60" />
          Không có sự cố nào
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SEVERITY_COLOR[inc.severity]}`}>
                      {SEVERITY_LABEL[inc.severity]}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[inc.status]}`}>
                      {STATUS_LABEL[inc.status]}
                    </span>
                  </div>
                  <div className="font-semibold text-sm">{inc.machineName}
                    {inc.machineCode && <span className="text-[#94A3B8] font-normal ml-1">({inc.machineCode})</span>}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">{inc.description}</div>
                </div>
                <div className="text-xs text-[#94A3B8] text-right">
                  <div>{inc.reportedName}</div>
                  <div>{new Date(inc.reportedAt).toLocaleString("vi-VN")}</div>
                </div>
              </div>

              {inc.resolutionNote && (
                <div className="mt-2 bg-green-50 rounded-xl p-2 text-xs text-green-800">
                  <i className="fas fa-wrench mr-1" /> <strong>Xử lý:</strong> {inc.resolutionNote}
                  {inc.downtimeMinutes > 0 && <span className="ml-2 text-orange-600">· Dừng {inc.downtimeMinutes} phút</span>}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex flex-wrap gap-2">
                {isSupervisor && inc.status === "open" && (
                  <button onClick={() => void handleAssign(inc.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0 hover:bg-blue-700">
                    <i className="fas fa-hand-pointer mr-1" /> Tiếp nhận
                  </button>
                )}
                {isSupervisor && (inc.status === "assigned" || inc.status === "in_progress") && (
                  <button onClick={() => setResolveModal(inc)}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0 hover:bg-green-700">
                    <i className="fas fa-check mr-1" /> Đánh dấu xử lý xong
                  </button>
                )}
                {isSupervisor && inc.status === "resolved" && (
                  <button onClick={() => void handleConfirm(inc.id)}
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0 hover:bg-gray-700">
                    <i className="fas fa-lock mr-1" /> Đóng sự cố
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-display font-700 text-lg">Báo sự cố máy</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#94A3B8] hover:text-[#1B3A5C] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Tên máy <span className="text-red-500">*</span></label>
                <input value={form.machineName} onChange={e => setForm({ ...form, machineName: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="VD: Máy tiện CNC-01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Mã máy</label>
                <input value={form.machineCode} onChange={e => setForm({ ...form, machineCode: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="VD: TK-01" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Mức độ nghiêm trọng</label>
                <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as MachineIncident["severity"] })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] bg-white">
                  <option value="low">Thấp — ảnh hưởng nhỏ</option>
                  <option value="medium">Trung bình — cần xử lý sớm</option>
                  <option value="high">Cao — ảnh hưởng sản xuất</option>
                  <option value="critical">Nghiêm trọng — dừng máy</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Mô tả sự cố <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Mô tả hiện tượng, vị trí, thời điểm xảy ra..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void createIncident()} disabled={saving}
                  className="flex-1 bg-[#1B3A5C] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2a4f78] transition cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-paper-plane mr-2" />Gửi báo cáo</>}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#E2E8F0] transition cursor-pointer border-0">
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-display font-700 text-lg">Xác nhận đã xử lý</h3>
              <button onClick={() => setResolveModal(null)} className="text-[#94A3B8] hover:text-[#1B3A5C] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#EFF2F7] rounded-xl p-3 text-sm">
                <strong>{resolveModal.machineName}</strong> — {resolveModal.description}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Ghi chú xử lý <span className="text-red-500">*</span></label>
                <textarea value={resolveForm.resolutionNote} onChange={e => setResolveForm({ ...resolveForm, resolutionNote: e.target.value })} rows={3}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Mô tả nguyên nhân và cách xử lý..." />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Thời gian dừng máy (phút)</label>
                <input type="number" min="0" value={resolveForm.downtimeMinutes}
                  onChange={e => setResolveForm({ ...resolveForm, downtimeMinutes: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void handleResolve()} disabled={saving}
                  className="flex-1 bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-green-700 transition cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-check mr-2" />Xác nhận xử lý xong</>}
                </button>
                <button onClick={() => setResolveModal(null)}
                  className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
