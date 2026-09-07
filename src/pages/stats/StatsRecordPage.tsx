/**
 * StatsRecordPage — Ghi sản lượng theo ca (Stats role)
 * Thống kê ghi: số lượng sx, đạt, lỗi, làm lại, downtime
 */
import { useState, useEffect } from "react";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { workflowApi } from "../../services/api/WorkflowApiService";
import { useOrders } from "../../hooks/useOrders";
import { useRoleUser } from "../../hooks/useRoleUser";
import { toast } from "../../hooks/useToast";
import { PaginationBar } from "../../components/ui";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";

export default function StatsRecordPage() {
  const user = useRoleUser();
  const { orders } = useOrders();
  const fetchStats = useStableFetch((query) => workflowApi.listStats(query));
  const {
    items: stats,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    q,
    setQ,
    loading,
    refresh,
  } = usePagedList({ fetchPage: fetchStats, pageSize: LIST_UI_PAGE_SIZE });
  const [summary, setSummary] = useState({ produced: 0, pass: 0, fail: 0, rework: 0 });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bomId: "", orderId: "", statDate: new Date().toISOString().slice(0, 10),
    shift: "day" as "day" | "night",
    qtyProduced: "", qtyPass: "", qtyFail: "", qtyRework: "", downtimeMins: "0", note: "",
  });

  const allBoms = orders.flatMap(o => o.boms.map(b => ({ ...b, orderId: o.id, orderNo: o.orderNo })));

  useEffect(() => {
    void workflowApi.getStats().then((all) => {
      setSummary({
        produced: all.reduce((s, r) => s + r.qtyProduced, 0),
        pass: all.reduce((s, r) => s + r.qtyPass, 0),
        fail: all.reduce((s, r) => s + r.qtyFail, 0),
        rework: all.reduce((s, r) => s + r.qtyRework, 0),
      });
    }).catch(() => {});
  }, [total]);

  const save = async () => {
    if (!form.bomId || !form.qtyProduced) { toast.error("Vui lòng chọn BOM và nhập số lượng sản xuất."); return; }
    setSaving(true);
    try {
      await workflowApi.upsertStat({
        orderId: form.orderId, bomId: form.bomId, statDate: form.statDate, shift: form.shift,
        recordedBy: user.id, recordedName: user.name,
        qtyProduced: Number(form.qtyProduced), qtyPass: Number(form.qtyPass),
        qtyFail: Number(form.qtyFail), qtyRework: Number(form.qtyRework),
        downtimeMins: Number(form.downtimeMins), note: form.note,
      });
      setShowForm(false);
      setForm({ bomId: "", orderId: "", statDate: new Date().toISOString().slice(0, 10), shift: "day", qtyProduced: "", qtyPass: "", qtyFail: "", qtyRework: "", downtimeMins: "0", note: "" });
      void refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-800 text-xl">Ghi sản lượng ca</h2>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition cursor-pointer border-0">
          <i className="fas fa-pen-to-square" /> Ghi ca
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: "Tổng SX", value: summary.produced, icon: "fa-boxes-stacked", color: "bg-blue-50 text-blue-700" },
          { label: "Đạt", value: summary.pass, icon: "fa-circle-check", color: "bg-green-50 text-green-700" },
          { label: "Lỗi", value: summary.fail, icon: "fa-circle-xmark", color: "bg-red-50 text-red-700" },
          { label: "Làm lại", value: summary.rework, icon: "fa-rotate", color: "bg-yellow-50 text-yellow-700" },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <div className="flex items-center gap-2 mb-1">
              <i className={`fas ${icon}`} />
              <span className="text-xs font-semibold">{label}</span>
            </div>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <input
        className="w-full border border-border rounded-xl px-3 py-2 text-sm mb-3 bg-input focus:outline-none focus:border-primary"
        placeholder="Tìm BOM, lệnh, ghi chú…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* Records */}
      {loading ? (
        <div className="text-center py-10 text-muted-foreground"><i className="fas fa-spinner fa-spin text-2xl" /></div>
      ) : stats.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center text-muted-foreground shadow-sm">
          <i className="fas fa-chart-simple text-4xl block mb-3 opacity-30" />
          Chưa có dữ liệu nào được ghi
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted">Ngày / Ca</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted">BOM</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted">SX</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted">Đạt</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted">Lỗi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted">Làm lại</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted">Dừng (p)</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? "bg-card" : "bg-surface"}>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-xs">{s.statDate}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${s.shift === "day" ? "bg-yellow-100 text-yellow-700" : "bg-indigo-100 text-indigo-700"}`}>
                      {s.shift === "day" ? "Ca ngày" : "Ca đêm"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{s.bomId}</td>
                  <td className="px-4 py-2.5 text-right font-semibold">{s.qtyProduced}</td>
                  <td className="px-4 py-2.5 text-right text-green-600 font-semibold">{s.qtyPass}</td>
                  <td className="px-4 py-2.5 text-right text-red-600 font-semibold">{s.qtyFail}</td>
                  <td className="px-4 py-2.5 text-right text-yellow-600 font-semibold">{s.qtyRework}</td>
                  <td className="px-4 py-2.5 text-right text-muted">{s.downtimeMins}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-3">
            <PaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              onPage={setPage}
              onPageSize={setPageSize}
            />
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
              <h3 className="font-display font-700 text-lg">Ghi sản lượng ca</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground cursor-pointer border-0 bg-transparent text-xl">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Ngày <span className="text-red-500">*</span></label>
                  <input type="date" value={form.statDate} onChange={e => setForm({ ...form, statDate: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Ca</label>
                  <select value={form.shift} onChange={e => setForm({ ...form, shift: e.target.value as "day" | "night" })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-card">
                    <option value="day">Ca ngày</option>
                    <option value="night">Ca đêm</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">BOM <span className="text-red-500">*</span></label>
                <select value={form.bomId} onChange={e => {
                  const bom = allBoms.find(b => b.id === e.target.value);
                  setForm({ ...form, bomId: e.target.value, orderId: bom?.orderId ?? "" });
                }} className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary bg-card">
                  <option value="">— Chọn BOM —</option>
                  {allBoms.map(b => (
                    <option key={b.id} value={b.id}>{b.orderNo} · {b.bomCode} — {b.partName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "qtyProduced", label: "Số lượng sản xuất", required: true },
                  { key: "qtyPass", label: "Số lượng đạt" },
                  { key: "qtyFail", label: "Số lượng lỗi" },
                  { key: "qtyRework", label: "Số lượng làm lại" },
                  { key: "downtimeMins", label: "Thời gian dừng (phút)" },
                ].map(({ key, label, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-muted mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
                    <input type="number" min="0" value={form[key as keyof typeof form] as string}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Ghi chú</label>
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={2}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
                  placeholder="Ghi chú thêm về ca sản xuất..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => void save()} disabled={saving}
                  className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 cursor-pointer border-0 disabled:opacity-60">
                  {saving ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-save mr-2" />Lưu số liệu</>}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 bg-background text-muted text-sm font-semibold py-2.5 rounded-xl cursor-pointer border-0">Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
