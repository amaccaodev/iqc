/**
 * OvertimePage — Đề xuất làm thêm / OT
 * - worker/teamlead: tạo đề xuất
 * - supervisor: xem và duyệt/từ chối
 */
import { useState, useEffect, useCallback } from "react";
import type { OvertimeRequest } from "@shared/types";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { useRoleUser } from "../../components/layout/RoleLayout";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  completed: "bg-gray-100 text-gray-600",
};
const STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối", completed: "Hoàn thành",
};

export default function OvertimePage() {
  const user = useRoleUser();
  const canCreate = user.role === "worker" || user.role === "teamlead";
  const canReview = user.role === "supervisor";

  const [items, setItems] = useState<OvertimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewModal, setReviewModal] = useState<OvertimeRequest | null>(null);
  const [form, setForm] = useState({ reason: "", proposedDate: "", proposedHours: "2", workerNames: "" });
  const [reviewForm, setReviewForm] = useState({ approved: true, note: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await workflowApi.getOvertimeRequests()); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form.reason.trim() || !form.proposedDate) { alert("Vui lòng điền lý do và ngày đề xuất."); return; }
    setSaving(true);
    try {
      const workerNames = form.workerNames.split(",").map(s => s.trim()).filter(Boolean);
      await workflowApi.createOvertimeRequest({
        requestedBy: user.id, requestedName: user.name,
        reason: form.reason, proposedDate: form.proposedDate,
        proposedHours: Number(form.proposedHours),
        workerIds: [], workerNames,
      });
      setShowCreate(false);
      setForm({ reason: "", proposedDate: "", proposedHours: "2", workerNames: "" });
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const review = async () => {
    if (!reviewModal) return;
    setSaving(true);
    try {
      await workflowApi.reviewOvertime(reviewModal.id, reviewForm.approved, user.id, reviewForm.note);
      setReviewModal(null);
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl">Đề xuất làm thêm (OT)</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {canCreate ? "Tạo và theo dõi đề xuất làm thêm giờ" : "Duyệt đề xuất làm thêm giờ"}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2a4f78] transition cursor-pointer border-0">
            <i className="fas fa-plus" /> Tạo đề xuất
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {(["pending","approved","rejected","completed"] as const).map(s => (
          <div key={s} className={`rounded-xl p-3 text-center ${STATUS_COLOR[s].replace("text-","")}`}>
            <div className="text-2xl font-bold">{items.filter(i => i.status === s).length}</div>
            <div className="text-xs font-medium">{STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[#94A3B8]"><i className="fas fa-spinner fa-spin text-2xl" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-[#94A3B8] shadow-sm">
          <i className="fas fa-clock text-4xl block mb-3 opacity-30" />
          Không có đề xuất OT nào
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2E8F0]">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[item.status]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                  </div>
                  <div className="font-semibold text-sm">{item.reason}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">
                    <i className="fas fa-calendar mr-1" />{item.proposedDate} ·
                    <i className="fas fa-clock mx-1" />{item.proposedHours} giờ
                    {item.workerNames.length > 0 && <span className="ml-1">· {item.workerNames.join(", ")}</span>}
                  </div>
                </div>
                <div className="text-xs text-[#94A3B8] text-right">
                  <div>{item.requestedName}</div>
                  <div>{new Date(item.requestedAt).toLocaleDateString("vi-VN")}</div>
                </div>
              </div>
              {item.supervisorNote && (
                <div className={`mt-2 rounded-xl p-2 text-xs ${item.status === "approved" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  <i className="fas fa-comment mr-1" /><strong>Quản đốc:</strong> {item.supervisorNote}
                </div>
              )}
              {canReview && item.status === "pending" && (
                <button onClick={() => { setReviewModal(item); setReviewForm({ approved: true, note: "" }); }}
                  className="mt-3 text-xs bg-[#1B3A5C] text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer border-0 hover:bg-[#2a4f78]">
                  <i className="fas fa-gavel mr-1" /> Duyệt / Từ chối
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-700 text-lg">Tạo đề xuất OT</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#94A3B8] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Lý do làm thêm <span className="text-red-500">*</span></label>
                <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="VD: Cần hoàn thành lệnh LSX-2024-001 trước deadline..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Ngày đề xuất <span className="text-red-500">*</span></label>
                  <input type="date" value={form.proposedDate} onChange={e => setForm({ ...form, proposedDate: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1">Số giờ OT</label>
                  <input type="number" min="1" max="8" step="0.5" value={form.proposedHours}
                    onChange={e => setForm({ ...form, proposedHours: e.target.value })}
                    className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Công nhân tham gia (cách nhau bằng dấu phẩy)</label>
                <input value={form.workerNames} onChange={e => setForm({ ...form, workerNames: e.target.value })}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="VD: Nguyễn A, Trần B, Lê C" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void create()} disabled={saving}
                  className="flex-1 bg-[#1B3A5C] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#2a4f78] cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-paper-plane mr-2" />Gửi đề xuất</>}
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-display font-700 text-lg">Duyệt đề xuất OT</h3>
              <button onClick={() => setReviewModal(null)} className="text-[#94A3B8] cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#EFF2F7] rounded-xl p-3 text-sm">
                <div className="font-semibold">{reviewModal.reason}</div>
                <div className="text-xs text-[#64748B] mt-1">{reviewModal.proposedDate} · {reviewModal.proposedHours}h · {reviewModal.requestedName}</div>
              </div>
              <div className="flex gap-3">
                {[{ v: true, label: "Duyệt", cls: "border-green-500 bg-green-50 text-green-700" }, { v: false, label: "Từ chối", cls: "border-red-500 bg-red-50 text-red-700" }].map(opt => (
                  <label key={String(opt.v)} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer ${reviewForm.approved === opt.v ? opt.cls : "border-[#E2E8F0]"}`}>
                    <input type="radio" checked={reviewForm.approved === opt.v} onChange={() => setReviewForm({ ...reviewForm, approved: opt.v })} className="sr-only" />
                    <i className={`fas ${opt.v ? "fa-check-circle" : "fa-times-circle"} text-lg`} />
                    <span className="font-semibold text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">Ghi chú</label>
                <textarea value={reviewForm.note} onChange={e => setReviewForm({ ...reviewForm, note: e.target.value })} rows={2}
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C] resize-none"
                  placeholder="Ghi chú thêm..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void review()} disabled={saving}
                  className={`flex-1 text-white text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0 disabled:opacity-60 ${reviewForm.approved ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                  {saving ? <i className="fas fa-spinner fa-spin" /> : reviewForm.approved ? "Phê duyệt" : "Từ chối"}
                </button>
                <button onClick={() => setReviewModal(null)} className="px-4 bg-[#EFF2F7] text-[#64748B] text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
