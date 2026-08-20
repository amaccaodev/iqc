/**
 * ComplaintsPage — Khiếu nại chất lượng
 * - QC: tạo khiếu nại, recheck
 * - Tổ trưởng: xác nhận + phương án xử lý
 * - Supervisor: đóng khiếu nại
 */
import { useState, useEffect, useCallback } from "react";
import type { QCComplaint } from "@shared/types";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { useOrders } from "../../hooks/useOrders";
import { useRoleUser } from "../../components/layout/RoleLayout";

const STATUS_COLOR: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  acknowledged: "bg-yellow-100 text-yellow-700",
  rework: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Mới gửi", acknowledged: "Tổ đã nhận", rework: "Đang xử lý",
  resolved: "Đã giải quyết", closed: "Đã đóng",
};

export default function ComplaintsPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  const isQC = user.role === "qc";
  const isTeamlead = user.role === "teamlead";
  const isSupervisor = user.role === "supervisor";

  const [complaints, setComplaints] = useState<QCComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<QCComplaint | null>(null);
  const [respondForm, setRespondForm] = useState({ actionType: "rework" as QCComplaint["actionType"], actionNote: "", reworkQty: "", scrapQty: "" });
  const [recheckForm, setRecheckForm] = useState({ result: "passed" as "passed" | "failed_again", note: "" });
  const [createForm, setCreateForm] = useState({ bomId: "", orderId: "", defectType: "", defectDescription: "", defectQty: "1", sampleTt: "" });
  const [saving, setSaving] = useState(false);

  const allBoms = orders.flatMap(o => o.boms.map(b => ({ ...b, orderId: o.id, orderNo: o.orderNo })));

  const load = useCallback(async () => {
    setLoading(true);
    try { setComplaints(await workflowApi.getComplaints()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!createForm.bomId || !createForm.defectType.trim() || !createForm.defectDescription.trim()) {
      alert("Vui lòng chọn BOM và điền thông tin lỗi."); return;
    }
    setSaving(true);
    try {
      await workflowApi.createComplaint({
        bomId: createForm.bomId, orderId: createForm.orderId,
        defectType: createForm.defectType, defectDescription: createForm.defectDescription,
        defectQty: Number(createForm.defectQty),
        sampleTt: createForm.sampleTt.split(",").map(s => Number(s.trim())).filter(Boolean),
        attachments: [], raisedBy: user.id ?? "", raisedName: user.name,
      });
      setShowCreate(false);
      setCreateForm({ bomId: "", orderId: "", defectType: "", defectDescription: "", defectQty: "1", sampleTt: "" });
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const acknowledge = async (id: string) => {
    try { await workflowApi.acknowledgeComplaint(id, user.id, user.name); void load(); }
    catch (e) { alert((e as Error).message); }
  };

  const respond = async () => {
    if (!selected || !respondForm.actionNote.trim()) { alert("Vui lòng mô tả phương án xử lý."); return; }
    setSaving(true);
    try {
      await workflowApi.respondToComplaint(selected.id, {
        actionType: respondForm.actionType ?? "rework", actionNote: respondForm.actionNote,
        actionBy: user.id ?? "", actionName: user.name,
        reworkQty: respondForm.reworkQty ? Number(respondForm.reworkQty) : undefined,
        scrapQty: respondForm.scrapQty ? Number(respondForm.scrapQty) : undefined,
      });
      setSelected(null);
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const recheck = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await workflowApi.recheckComplaint(selected.id, user.id, user.name, recheckForm.result, recheckForm.note);
      setSelected(null);
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const close = async (id: string) => {
    if (!confirm("Đóng khiếu nại này?")) return;
    try { await workflowApi.closeComplaint(id, user.id); void load(); }
    catch (e) { alert((e as Error).message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl">Khiếu nại chất lượng</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {isQC ? "Tạo và kiểm tra lại khiếu nại" : isTeamlead ? "Xử lý khiếu nại từ QC" : "Theo dõi và đóng khiếu nại"}
          </p>
        </div>
        {isQC && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-red-700 transition cursor-pointer border-0">
            <i className="fas fa-comment-dots" /> Tạo khiếu nại
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {Object.entries(STATUS_LABEL).map(([s, label]) => (
          <div key={s} className={`rounded-xl p-2 text-center ${STATUS_COLOR[s]}`}>
            <div className="text-xl font-bold">{complaints.filter(c => c.status === s).length}</div>
            <div className="text-[10px] font-medium">{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#94A3B8]"><i className="fas fa-spinner fa-spin text-2xl" /></div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-[#94A3B8] shadow-sm">
          <i className="fas fa-thumbs-up text-4xl block mb-3 text-green-400 opacity-60" />
          Không có khiếu nại nào
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map(c => (
            <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                    <span className="text-xs bg-[#EFF2F7] text-[#1B3A5C] px-2 py-0.5 rounded-full font-semibold">{c.defectType}</span>
                  </div>
                  <div className="font-semibold text-sm">{c.defectDescription}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    Số lượng lỗi: <strong>{c.defectQty}</strong>
                    {c.sampleTt.length > 0 && <span className="ml-1">· SP: {c.sampleTt.join(", ")}</span>}
                  </div>
                </div>
                <div className="text-xs text-[#94A3B8] text-right">
                  <div>{c.raisedName}</div>
                  <div>{new Date(c.raisedAt).toLocaleDateString("vi-VN")}</div>
                </div>
              </div>

              {c.actionNote && (
                <div className="mt-2 bg-blue-50 rounded-xl p-2 text-xs text-blue-800">
                  <i className="fas fa-tools mr-1" /><strong>Xử lý ({c.actionType}):</strong> {c.actionNote}
                  {c.reworkQty && <span className="ml-1">· Làm lại: {c.reworkQty}</span>}
                  {c.scrapQty && <span className="ml-1">· Loại: {c.scrapQty}</span>}
                </div>
              )}
              {c.qcRecheckNote && (
                <div className={`mt-2 rounded-xl p-2 text-xs ${c.qcRecheckResult === "passed" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  <i className={`fas ${c.qcRecheckResult === "passed" ? "fa-check-circle" : "fa-times-circle"} mr-1`} />
                  <strong>QC kiểm lại:</strong> {c.qcRecheckNote}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {isTeamlead && c.status === "open" && (
                  <button onClick={() => void acknowledge(c.id)}
                    className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0">
                    <i className="fas fa-hand mr-1" /> Xác nhận đã nhận
                  </button>
                )}
                {isTeamlead && c.status === "acknowledged" && (
                  <button onClick={() => { setSelected(c); setRespondForm({ actionType: "rework", actionNote: "", reworkQty: String(c.defectQty), scrapQty: "" }); }}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0">
                    <i className="fas fa-tools mr-1" /> Gửi phương án xử lý
                  </button>
                )}
                {isQC && c.status === "rework" && (
                  <button onClick={() => { setSelected(c); setRecheckForm({ result: "passed", note: "" }); }}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0">
                    <i className="fas fa-magnifying-glass mr-1" /> Kiểm tra lại
                  </button>
                )}
                {isSupervisor && c.status === "resolved" && (
                  <button onClick={() => void close(c.id)}
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0">
                    <i className="fas fa-lock mr-1" /> Đóng khiếu nại
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <h3 className="font-display font-700 text-lg">Tạo khiếu nại chất lượng</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#94A3B8] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Chọn BOM <span className="text-red-500">*</span></label>
                <select value={createForm.bomId} onChange={e => {
                  const bom = allBoms.find(b => b.id === e.target.value);
                  setCreateForm({ ...createForm, bomId: e.target.value, orderId: bom?.orderId ?? "" });
                }} className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] bg-white">
                  <option value="">— Chọn BOM —</option>
                  {allBoms.filter(b => b.status === "team_reported" || b.status === "qc_failed").map(b => (
                    <option key={b.id} value={b.id}>{b.orderNo} · {b.bomCode} — {b.partName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Loại lỗi <span className="text-red-500">*</span></label>
                <select value={createForm.defectType} onChange={e => setCreateForm({ ...createForm, defectType: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] bg-white">
                  <option value="">— Chọn loại lỗi —</option>
                  <option>Kích thước ngoài thông số</option>
                  <option>Ngoại quan (xước, lõm, vết nứt)</option>
                  <option>Sai vật liệu</option>
                  <option>Thiếu số lượng</option>
                  <option>Lỗi gia công</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Mô tả chi tiết lỗi <span className="text-red-500">*</span></label>
                <textarea value={createForm.defectDescription} onChange={e => setCreateForm({ ...createForm, defectDescription: e.target.value })} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Mô tả cụ thể lỗi, vị trí, biểu hiện..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Số lượng lỗi</label>
                  <input type="number" min="1" value={createForm.defectQty} onChange={e => setCreateForm({ ...createForm, defectQty: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">TT sản phẩm lỗi</label>
                  <input value={createForm.sampleTt} onChange={e => setCreateForm({ ...createForm, sampleTt: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                    placeholder="VD: 3, 7, 12" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => void create()} disabled={saving}
                  className="flex-1 bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-700 cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-paper-plane mr-2" />Gửi khiếu nại</>}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal (teamlead) */}
      {selected && isTeamlead && selected.status === "acknowledged" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-700 text-lg">Phương án xử lý</h3>
              <button onClick={() => setSelected(null)} className="text-[#94A3B8] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-3 text-sm text-red-800">
                <strong>{selected.defectType}</strong> — {selected.defectDescription} ({selected.defectQty} SP)
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Hành động</label>
                <div className="space-y-2">
                  {[{v:"rework",l:"Làm lại"},{v:"scrap",l:"Loại bỏ (phế phẩm)"},{v:"accept_as_is",l:"Chấp nhận nguyên trạng"}].map(opt => (
                    <label key={opt.v} className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer ${respondForm.actionType === opt.v ? "border-[#1B3A5C] bg-[#EEF2FF]" : "border-[#E2E8F0]"}`}>
                      <input type="radio" checked={respondForm.actionType === opt.v} onChange={() => setRespondForm({ ...respondForm, actionType: opt.v as QCComplaint["actionType"] })} className="accent-[#1B3A5C]" />
                      <span className="text-sm font-medium">{opt.l}</span>
                    </label>
                  ))}
                </div>
              </div>
              {respondForm.actionType === "rework" && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Số lượng làm lại</label>
                  <input type="number" value={respondForm.reworkQty} onChange={e => setRespondForm({ ...respondForm, reworkQty: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
                </div>
              )}
              {respondForm.actionType === "scrap" && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Số lượng loại bỏ</label>
                  <input type="number" value={respondForm.scrapQty} onChange={e => setRespondForm({ ...respondForm, scrapQty: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Ghi chú xử lý <span className="text-red-500">*</span></label>
                <textarea value={respondForm.actionNote} onChange={e => setRespondForm({ ...respondForm, actionNote: e.target.value })} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Mô tả cách xử lý cụ thể..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void respond()} disabled={saving}
                  className="flex-1 bg-[#1B3A5C] text-white text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-paper-plane mr-2" />Gửi phương án</>}
                </button>
                <button onClick={() => setSelected(null)} className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recheck Modal (QC) */}
      {selected && isQC && selected.status === "rework" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-700 text-lg">Kiểm tra lại</h3>
              <button onClick={() => setSelected(null)} className="text-[#94A3B8] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
                <strong>Đã xử lý:</strong> {selected.actionNote} ({selected.actionType})
              </div>
              <div className="flex gap-3">
                {[{ v: "passed", l: "Đã khắc phục — Đạt", cls: "border-green-500 bg-green-50 text-green-700" }, { v: "failed_again", l: "Vẫn lỗi — Không đạt", cls: "border-red-500 bg-red-50 text-red-700" }].map(opt => (
                  <label key={opt.v} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer ${recheckForm.result === opt.v ? opt.cls : "border-[#E2E8F0]"}`}>
                    <input type="radio" checked={recheckForm.result === opt.v} onChange={() => setRecheckForm({ ...recheckForm, result: opt.v as "passed" | "failed_again" })} className="sr-only" />
                    <i className={`fas ${opt.v === "passed" ? "fa-check-circle" : "fa-times-circle"} text-lg`} />
                    <span className="font-semibold text-xs">{opt.l}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Ghi chú kiểm tra</label>
                <textarea value={recheckForm.note} onChange={e => setRecheckForm({ ...recheckForm, note: e.target.value })} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Kết quả kiểm tra lại..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void recheck()} disabled={saving}
                  className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0 disabled:opacity-60 ${recheckForm.result === "passed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                  {saving ? <i className="fas fa-spinner fa-spin" /> : recheckForm.result === "passed" ? "Xác nhận đạt" : "Gửi lại khiếu nại"}
                </button>
                <button onClick={() => setSelected(null)} className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
