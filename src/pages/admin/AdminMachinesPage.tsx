import { useCallback, useEffect, useState } from "react";
import type { Machine, MachineParam } from "@shared/types";
import { TEAMS, teamDisplayName } from "@shared/constants/teams";
import { Btn, Card } from "../../components/ui";
import { catalogApi } from "../../services/api/CatalogApiService";
import { toast } from "../../hooks/useToast";

const field = "w-full border border-border rounded-lg px-3 py-2 text-sm";

export default function AdminMachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [form, setForm] = useState({
    code: "",
    name: "",
    location: "",
    teamId: "",
    paramLabel: "",
    paramUnit: "mm",
    paramMin: "",
    paramMax: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setMachines(await catalogApi.listMachines());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Nhập mã và tên máy");
      return;
    }
    if (!form.teamId) {
      toast.error("Chọn tổ / khu vực máy");
      return;
    }
    const params: MachineParam[] = [];
    if (form.paramLabel.trim()) {
      params.push({
        label: form.paramLabel.trim(),
        unit: form.paramUnit || undefined,
        min: form.paramMin ? Number(form.paramMin) : undefined,
        max: form.paramMax ? Number(form.paramMax) : undefined,
      });
    }
    setSaving(true);
    try {
      await catalogApi.createMachine({
        code: form.code.trim(),
        name: form.name.trim(),
        location: form.location.trim(),
        teamId: form.teamId,
        params,
        active: true,
      });
      setForm({
        code: "",
        name: "",
        location: "",
        teamId: "",
        paramLabel: "",
        paramUnit: "mm",
        paramMin: "",
        paramMax: "",
      });
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const ok = await toast.confirm({
      title: "Ngưng máy",
      message: "Ngưng hoạt động máy này?",
      confirmLabel: "Ngưng",
      danger: true,
    });
    if (!ok) return;
    await catalogApi.deleteMachine(id);
    await load();
  };

  return (
    <div>
      <h2 className="font-display font-800 text-xl mb-1">Quản lý máy móc</h2>
      <p className="text-sm text-muted mb-5">
        Mỗi máy gắn <strong className="font-semibold text-foreground">vị trí (location)</strong> và{" "}
        <strong className="font-semibold text-foreground">tổ</strong> — tổ trưởng chỉ phân công máy
        thuộc khu vực tổ mình.
      </p>

      <Card cls="mb-4 p-4">
        <div className="font-semibold mb-3">Thêm máy</div>
        <div className="grid sm:grid-cols-2 gap-2 mb-2">
          <input
            className={field}
            placeholder="Mã máy"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            className={field}
            placeholder="Tên máy"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={field}
            placeholder="Vị trí / location (vd: Khu Lắp ráp — Bàn C1)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
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
        <div className="text-xs text-muted mb-1">Thông số đo (tuỳ chọn)</div>
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
        <Btn onClick={() => !saving && void add()}>Thêm máy</Btn>
      </Card>

      <div className="space-y-2">
        {machines.map((m) => (
          <Card key={m.id} cls="p-4">
            <div className="flex justify-between gap-2">
              <div>
                <code className="text-xs text-muted">{m.code}</code>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-muted mt-1">
                  <i className="fas fa-location-dot mr-1" />
                  {m.location || "Chưa có location"}
                  {" · "}
                  <i className="fas fa-users mr-1" />
                  {teamDisplayName(m.teamId) || "Chưa gắn tổ"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(m.params ?? []).map((p) => `${p.label}${p.unit ? ` (${p.unit})` : ""}`).join(", ") ||
                    "Chưa có thông số"}
                </div>
              </div>
              <button
                type="button"
                className="text-red-500 text-sm border-0 bg-transparent cursor-pointer"
                onClick={() => void remove(m.id)}
              >
                Ngưng
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
