/**
 * AdminRolesPage — Quản lý Roles và Groups (tổ)
 * Thêm / xóa role, thêm / xóa nhóm, gán role cho user, gán user vào nhóm
 */
import { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../../lib/apiBase";

interface Role { id: string; label: string; description: string }
interface Group { id: string; name: string; lead: string; lead_short: string; description: string }

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tab, setTab] = useState<"roles" | "groups">("roles");
  const [newRole, setNewRole] = useState({ id: "", label: "", description: "" });
  const [newGroup, setNewGroup] = useState({ id: "", name: "", lead: "", lead_short: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [r, g] = await Promise.all([
      fetch(`${API_BASE}/roles`).then(res => res.json()),
      fetch(`${API_BASE}/groups`).then(res => res.json()),
    ]);
    if (r.success) setRoles(r.data as Role[]);
    if (g.success) setGroups(g.data as Group[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addRole = async () => {
    if (!newRole.id.trim() || !newRole.label.trim()) { alert("ID và tên role là bắt buộc."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/roles`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newRole) });
      if (!res.ok) throw new Error(await res.text());
      setNewRole({ id: "", label: "", description: "" });
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm(`Xóa role "${id}"?`)) return;
    try {
      await fetch(`${API_BASE}/roles/${id}`, { method: "DELETE" });
      void load();
    } catch (e) { alert((e as Error).message); }
  };

  const addGroup = async () => {
    if (!newGroup.id.trim() || !newGroup.name.trim()) { alert("ID và tên tổ là bắt buộc."); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/groups`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newGroup) });
      if (!res.ok) throw new Error(await res.text());
      setNewGroup({ id: "", name: "", lead: "", lead_short: "", description: "" });
      void load();
    } catch (e) { alert((e as Error).message); }
    finally { setSaving(false); }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm(`Xóa tổ "${id}"?`)) return;
    try {
      await fetch(`${API_BASE}/groups/${id}`, { method: "DELETE" });
      void load();
    } catch (e) { alert((e as Error).message); }
  };

  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-1">Quản lý Roles & Tổ</h2>
      <p className="text-sm text-muted mb-5">Thêm, sửa, xóa vai trò và nhóm/tổ trong hệ thống</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {([["roles", "fa-shield-halved", "Roles"], ["groups", "fa-users", "Tổ / Nhóm"]] as const).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer border-0 transition ${tab === t ? "bg-primary text-white" : "bg-card text-muted hover:bg-surface"}`}>
            <i className={`fas ${icon}`} /> {label}
          </button>
        ))}
      </div>

      {tab === "roles" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold text-sm mb-3">Thêm Role mới</h3>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">ID (slug) <span className="text-red-500">*</span></label>
                <input value={newRole.id} onChange={e => setNewRole({ ...newRole, id: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="vd: mechanic" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Tên hiển thị <span className="text-red-500">*</span></label>
                <input value={newRole.label} onChange={e => setNewRole({ ...newRole, label: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="vd: Cơ điện" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Mô tả</label>
                <input value={newRole.description} onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="Mô tả quyền..." />
              </div>
            </div>
            <button onClick={() => void addRole()} disabled={saving}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2a4f78] cursor-pointer border-0 disabled:opacity-60">
              <i className="fas fa-plus mr-2" />Thêm Role
            </button>
          </div>

          <div className="space-y-2">
            {roles.map(r => (
              <div key={r.id} className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center justify-between">
                <div>
                  <span className="bg-background text-primary text-xs font-mono font-bold px-2 py-0.5 rounded mr-2">{r.id}</span>
                  <span className="font-semibold text-sm">{r.label}</span>
                  {r.description && <span className="text-xs text-muted-foreground ml-2">— {r.description}</span>}
                </div>
                <button onClick={() => void deleteRole(r.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 cursor-pointer border-0 bg-transparent">
                  <i className="fas fa-trash" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "groups" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
            <h3 className="font-semibold text-sm mb-3">Thêm Tổ / Nhóm mới</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">ID <span className="text-red-500">*</span></label>
                <input value={newGroup.id} onChange={e => setNewGroup({ ...newGroup, id: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="vd: t5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Tên tổ <span className="text-red-500">*</span></label>
                <input value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="vd: Tổ 5" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Tổ trưởng</label>
                <input value={newGroup.lead} onChange={e => setNewGroup({ ...newGroup, lead: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="Họ tên tổ trưởng" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">Tên viết tắt</label>
                <input value={newGroup.lead_short} onChange={e => setNewGroup({ ...newGroup, lead_short: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A5C]"
                  placeholder="VD: N.V.A" />
              </div>
            </div>
            <button onClick={() => void addGroup()} disabled={saving}
              className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#2a4f78] cursor-pointer border-0 disabled:opacity-60">
              <i className="fas fa-plus mr-2" />Thêm Tổ
            </button>
          </div>

          <div className="space-y-2">
            {groups.map(g => (
              <div key={g.id} className="bg-card rounded-xl p-3 shadow-sm border border-border flex items-center justify-between">
                <div>
                  <span className="bg-background text-primary text-xs font-mono font-bold px-2 py-0.5 rounded mr-2">{g.id}</span>
                  <span className="font-semibold text-sm">{g.name}</span>
                  {g.lead && <span className="text-xs text-muted ml-2">TT: {g.lead}</span>}
                </div>
                <button onClick={() => void deleteGroup(g.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 cursor-pointer border-0 bg-transparent">
                  <i className="fas fa-trash" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
