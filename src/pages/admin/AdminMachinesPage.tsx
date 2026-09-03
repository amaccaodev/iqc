import { useState } from "react";
import type { Machine } from "@shared/types";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { TEAMS, teamDisplayName } from "@shared/constants/teams";
import { Btn, Card, IconAction, ResponsiveDataList } from "../../components/ui";
import { catalogApi } from "../../services/api/CatalogApiService";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { toast } from "../../hooks/useToast";

const field = "w-full border border-border rounded-lg px-3 py-2 text-sm";

const emptyForm = {
  code: "",
  name: "",
  teamId: "",
  paramLabel: "",
  paramUnit: "mm",
  paramMin: "",
  paramMax: "",
};

export default function AdminMachinesPage() {
  const fetchMachines = useStableFetch((query) => catalogApi.searchMachines(query));
  const { items, total, page, pageSize, setPage, setPageSize, q, setQ, refresh, loading } = usePagedList({
    fetchPage: fetchMachines,
    pageSize: LIST_UI_PAGE_SIZE,
  });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const specsFromForm = () => {
    const specs: Record<string, unknown> = editing ? { ...(editing.specs ?? {}) } : {};
    if (form.paramLabel.trim()) {
      specs[form.paramLabel.trim()] = {
        unit: form.paramUnit || undefined,
        min: form.paramMin ? Number(form.paramMin) : undefined,
        max: form.paramMax ? Number(form.paramMax) : undefined,
      };
    }
    return specs;
  };

  const startAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (m: Machine) => {
    setEditing(m);
    setShowForm(true);
    setForm({
      code: m.accountingCode || m.code || "",
      name: m.name,
      teamId: m.productionTeamId || m.teamId || "",
      paramLabel: "",
      paramUnit: "mm",
      paramMin: "",
      paramMax: "",
    });
  };

  const save = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Nhập mã kế toán và tên máy");
      return;
    }
    if (!form.teamId) {
      toast.error("Chọn tổ / khu vực máy");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        accountingCode: form.code.trim(),
        code: form.code.trim(),
        name: form.name.trim(),
        productionTeamId: form.teamId,
        teamId: form.teamId,
        specs: specsFromForm(),
        active: true,
      };
      if (editing) await catalogApi.updateMachine(editing.id, payload);
      else await catalogApi.createMachine(payload);
      const wasEdit = Boolean(editing);
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      refresh();
      toast.success(wasEdit ? "Đã cập nhật máy" : "Đã thêm máy");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await toast.confirm({
      title: "Ngưng máy",
      message: "Ngưng hoạt động máy này? Tổ trưởng sẽ không phân công được nữa.",
      confirmLabel: "Ngưng",
      danger: true,
    });
    if (!ok) return;
    await catalogApi.deleteMachine(id);
    if (editing?.id === id) {
      setEditing(null);
      setForm(emptyForm);
      setShowForm(false);
    }
    refresh();
  };

  return (
    <div className="max-w-full min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display font-800 text-xl">Quản lý thiết bị (máy)</h2>
        {!showForm ? (
          <Btn onClick={startAdd}>
            <i className="fas fa-plus" /> Thêm
          </Btn>
        ) : null}
      </div>

      {showForm ? (
      <Card cls="mb-4 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="font-semibold">{editing ? `Sửa máy — ${editing.name}` : "Thêm máy"}</div>
          <button
            type="button"
            className="text-sm text-muted border-0 bg-transparent cursor-pointer"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setShowForm(false);
            }}
          >
            Hủy
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
          <input
            className={field}
            placeholder="Mã kế toán"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className={field}
            placeholder="Tên máy"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className={field}
            value={form.teamId}
            onChange={(e) => setForm({ ...form, teamId: e.target.value })}
          >
            <option value="">— Tổ / khu vực —</option>
            {TEAMS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} – {t.leadShort}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-muted mb-1">Thông số máy</div>
        <div className="grid sm:grid-cols-4 gap-2 mb-3">
          <input
            className={field}
            placeholder="Tên thông số"
            value={form.paramLabel}
            onChange={(e) => setForm({ ...form, paramLabel: e.target.value })}
          />
          <input
            className={field}
            placeholder="Đơn vị"
            value={form.paramUnit}
            onChange={(e) => setForm({ ...form, paramUnit: e.target.value })}
          />
          <input
            className={field}
            placeholder="Min"
            value={form.paramMin}
            onChange={(e) => setForm({ ...form, paramMin: e.target.value })}
          />
          <input
            className={field}
            placeholder="Max"
            value={form.paramMax}
            onChange={(e) => setForm({ ...form, paramMax: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => !saving && void save()}>Lưu máy</Btn>
        </div>
      </Card>
      ) : null}

      <Card cls="p-3">
        <input
          className={`${field} mb-3`}
          placeholder="Tìm mã / tên máy…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading ? <div className="text-sm text-muted mb-2">Đang tải…</div> : null}
        <ResponsiveDataList
          items={items}
          getKey={(m) => m.id}
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={setPageSize}
          emptyText="Chưa có máy"
          columns={[
            {
              key: "code",
              header: "Mã KT",
              render: (m) => <code className="text-xs">{m.accountingCode || m.code}</code>,
            },
            {
              key: "name",
              header: "Tên máy",
              render: (m) => <span className="font-semibold">{m.name}</span>,
            },
            {
              key: "team",
              header: "Tổ",
              render: (m) => (
                <span className="text-sm">
                  {teamDisplayName(m.productionTeamId || m.teamId) || "—"}
                </span>
              ),
            },
            {
              key: "specs",
              header: "Thông số",
              render: (m) => (
                <span className="text-xs text-muted">
                  {Object.keys(m.specs ?? {}).length ? Object.keys(m.specs).join(", ") : "—"}
                </span>
              ),
            },
            {
              key: "act",
              header: "",
              className: "text-right w-24",
              render: (m) => (
                <div className="flex gap-1.5 justify-end">
                  <IconAction icon="fa-pen" label="Sửa" onClick={() => startEdit(m)} />
                  <IconAction icon="fa-trash" label="Ngưng / xóa" tone="danger" onClick={() => void remove(m.id)} />
                </div>
              ),
            },
          ]}
          renderCard={(m) => (
            <Card cls="p-3">
              <div className="flex justify-between gap-2">
                <div>
                  <code className="text-xs text-muted">{m.accountingCode || m.code}</code>
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {teamDisplayName(m.productionTeamId || m.teamId) || "Chưa gắn tổ"}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <IconAction icon="fa-pen" label="Sửa" onClick={() => startEdit(m)} />
                  <IconAction icon="fa-trash" label="Ngưng / xóa" tone="danger" onClick={() => void remove(m.id)} />
                </div>
              </div>
            </Card>
          )}
        />
      </Card>
    </div>
  );
}
