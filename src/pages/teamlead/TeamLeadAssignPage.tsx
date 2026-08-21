import { useEffect, useMemo, useState } from "react";
import type { BOMItem, Machine, ProductionOrder, WorkerMachineAssignment } from "@shared/types";
import { resolveBomTeamId, resolveUserTeamId, teamIdsMatch } from "@shared/constants/teams";
import { Btn, Card, Modal } from "../../components/ui";
import { useRoleUser } from "../../components/layout/RoleLayout";
import { useOrders } from "../../hooks/useOrders";
import { useUsers } from "../../hooks/useUsers";
import { catalogApi } from "../../services/api/CatalogApiService";
import { orderApi } from "../../services/api/OrderApiService";
import type { User } from "../../_AppLegacy";

type AssignDraft = Record<string, { checked: boolean; machineId: string; machineName: string }>;

function occupancyByMachine(boms: BOMItem[]): Array<{ machine: string; count: number; workers: string[] }> {
  const map = new Map<string, { count: number; workers: string[] }>();
  for (const b of boms) {
    const list = b.workerAssignments?.length
      ? b.workerAssignments
      : b.assignedWorkers.map((name) => ({
          workerId: "",
          workerName: name,
          machineName: b.machine || "Chưa gán máy",
        }));
    for (const a of list) {
      const key = a.machineName || "Chưa gán máy";
      const cur = map.get(key) ?? { count: 0, workers: [] };
      cur.count += 1;
      if (!cur.workers.includes(a.workerName)) cur.workers.push(a.workerName);
      map.set(key, cur);
    }
  }
  return [...map.entries()]
    .map(([machine, v]) => ({ machine, count: v.count, workers: v.workers }))
    .sort((a, b) => b.count - a.count);
}

export default function TeamLeadAssignPage() {
  const user = useRoleUser();
  const { orders, setOrders, refreshOrders } = useOrders();
  const { users, refreshUsers } = useUsers();
  const myTeamId = resolveUserTeamId(user);

  const teamWorkers = useMemo(
    () =>
      users.filter(
        (u) => u.role === "worker" && u.active !== false && teamIdsMatch(resolveUserTeamId(u), myTeamId),
      ) as User[],
    [users, myTeamId],
  );

  const [machines, setMachines] = useState<Machine[]>([]);
  const [assignModal, setAssignModal] = useState<{ o: ProductionOrder; b: BOMItem } | null>(null);
  const [draft, setDraft] = useState<AssignDraft>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const myBOMs = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "completed" && o.status !== "draft")
        .flatMap((o) =>
          o.boms
            .filter((b) => teamIdsMatch(resolveBomTeamId(b), myTeamId))
            .map((b) => ({ o, b })),
        ),
    [orders, myTeamId],
  );

  const machineStats = useMemo(
    () => occupancyByMachine(myBOMs.map(({ b }) => b)),
    [myBOMs],
  );

  useEffect(() => {
    void refreshUsers();
    void catalogApi
      .listMachines()
      .then((list) => setMachines(Array.isArray(list) ? list.filter((m) => m.active !== false) : []))
      .catch(() => setMachines([]));
  }, [refreshUsers]);

  const openAssign = (o: ProductionOrder, b: BOMItem) => {
    const next: AssignDraft = {};
    for (const w of teamWorkers) {
      const existing = b.workerAssignments?.find(
        (a) => a.workerId === w.id || a.workerName === w.name,
      );
      const byName = !existing && b.assignedWorkers.includes(w.name);
      next[w.id] = {
        checked: Boolean(existing || byName),
        machineId: existing?.machineId ?? "",
        machineName: existing?.machineName || (byName ? b.machine : "") || "",
      };
    }
    setDraft(next);
    setErr("");
    setAssignModal({ o, b });
  };

  const saveAssignment = async () => {
    if (!assignModal) return;
    const { o, b } = assignModal;
    const assignments: WorkerMachineAssignment[] = [];
    for (const w of teamWorkers) {
      const row = draft[w.id];
      if (!row?.checked) continue;
      if (!row.machineName.trim()) {
        setErr(`Chọn máy cho ${w.name}`);
        return;
      }
      assignments.push({
        workerId: w.id,
        workerName: w.name,
        machineId: row.machineId || undefined,
        machineName: row.machineName.trim(),
      });
    }
    setSaving(true);
    setErr("");
    try {
      const names = assignments.map((a) => a.workerName);
      const updated = await orderApi.assignWorkers(o.id, b.id, names, assignments);
      setOrders(orders.map((x) => (x.id === updated.id ? updated : x)));
      await refreshOrders();
      setAssignModal(null);
    } catch (e) {
      setErr((e as Error).message || "Không lưu được phân công");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-800 text-xl mb-1">Gán máy cho nhân viên</h2>
        <p className="text-sm text-muted">
          Chọn linh kiện của tổ → gán từng công nhân vào máy. Xem nhanh bao nhiêu người đang làm trên mỗi máy.
        </p>
      </div>

      <Card cls="p-4">
        <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
          Nhân lực theo máy (tổ đang làm)
        </div>
        {machineStats.length === 0 ? (
          <div className="text-sm text-muted-foreground">Chưa có phân công máy.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {machineStats.map((s) => (
              <div key={s.machine} className="rounded-xl border border-border bg-surface px-3 py-2.5">
                <div className="font-semibold text-sm text-foreground">{s.machine}</div>
                <div className="text-lg font-display font-700 text-primary tabular-nums">
                  {s.count}{" "}
                  <span className="text-xs font-medium text-muted">công nhân</span>
                </div>
                <div className="text-[11px] text-muted mt-0.5 truncate">{s.workers.join(", ")}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {myBOMs.length === 0 ? (
        <Card cls="p-10 text-center text-muted-foreground">
          <i className="fas fa-inbox text-3xl block mb-2 opacity-30" />
          Chưa có BOM nào được phân cho tổ
        </Card>
      ) : (
        myBOMs.map(({ o, b }) => {
          const n = b.workerAssignments?.length || b.assignedWorkers.length;
          return (
            <Card key={b.id} cls="p-4">
              <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
              <div className="font-semibold text-sm">{b.partName}</div>
              <div className="text-xs text-muted-foreground mb-2">
                {o.orderNo} · {b.targetQty.toLocaleString()} cái
                {b.machine ? ` · Máy gợi ý: ${b.machine}` : ""}
              </div>
              {n > 0 ? (
                <div className="text-xs text-muted mb-3 space-y-0.5">
                  <div>
                    <i className="fas fa-users mr-1" />
                    {n} công nhân đang làm
                  </div>
                  {(b.workerAssignments?.length
                    ? b.workerAssignments
                    : b.assignedWorkers.map((name) => ({
                        workerName: name,
                        machineName: b.machine || "—",
                      }))
                  ).map((a, i) => (
                    <div key={`${a.workerName}-${i}`} className="pl-4">
                      {a.workerName} → <span className="font-medium text-primary">{a.machineName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-orange-600 mb-3">
                  <i className="fas fa-circle-exclamation mr-1" />
                  Chưa phân công nhân / máy
                </div>
              )}
              <Btn size="sm" onClick={() => openAssign(o, b)}>
                <i className="fas fa-user-gear" /> Phân công theo máy
              </Btn>
            </Card>
          );
        })
      )}

      {assignModal && (
        <Modal title={`Phân công máy: ${assignModal.b.partName}`} onClose={() => setAssignModal(null)}>
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3">
              <code className="text-xs font-mono text-primary font-bold">{assignModal.b.bomCode}</code>
              <div className="font-semibold text-sm mt-0.5">{assignModal.b.partName}</div>
              <div className="text-xs text-muted-foreground">{assignModal.o.orderNo}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-2">
                Chọn công nhân và máy phụ trách
              </label>
              {teamWorkers.length === 0 ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="italic">Không có công nhân trong tổ.</p>
                  <p>
                    Tổ hiện tại: <code className="font-mono">{myTeamId || "—"}</code>. Thử đăng xuất /
                    đăng nhập lại, hoặc thêm CN vào tổ trong Admin.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {teamWorkers.map((w) => {
                    const row = draft[w.id] ?? { checked: false, machineId: "", machineName: "" };
                    return (
                      <div
                        key={w.id}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          row.checked ? "border-[#1B3A5C] bg-secondary" : "border-border"
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.checked}
                            onChange={() =>
                              setDraft((prev) => ({
                                ...prev,
                                [w.id]: {
                                  ...row,
                                  checked: !row.checked,
                                  machineName:
                                    !row.checked && !row.machineName
                                      ? assignModal.b.machine || ""
                                      : row.machineName,
                                },
                              }))
                            }
                            className="accent-[#1B3A5C]"
                          />
                          <div>
                            <div className="font-semibold text-sm">{w.name}</div>
                            <div className="text-xs text-muted font-mono">{w.employeeId}</div>
                          </div>
                        </label>
                        {row.checked && (
                          <div className="mt-2 pl-7">
                            <select
                              className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-card"
                              value={row.machineId || row.machineName}
                              onChange={(e) => {
                                const val = e.target.value;
                                const m = machines.find((x) => x.id === val || x.name === val);
                                setDraft((prev) => ({
                                  ...prev,
                                  [w.id]: {
                                    ...row,
                                    machineId: m?.id ?? "",
                                    machineName: m?.name ?? val,
                                  },
                                }));
                              }}
                            >
                              <option value="">— Chọn máy —</option>
                              {machines.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                  {m.code ? ` (${m.code})` : ""}
                                </option>
                              ))}
                              {assignModal.b.machine &&
                                !machines.some((m) => m.name === assignModal.b.machine) && (
                                  <option value={assignModal.b.machine}>
                                    {assignModal.b.machine} (theo BOM)
                                  </option>
                                )}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {err && <div className="text-sm text-red-600">{err}</div>}

            <div className="flex gap-3">
              <Btn onClick={() => void saveAssignment()} disabled={saving}>
                <i className="fas fa-save" /> {saving ? "Đang lưu…" : "Lưu phân công"}
              </Btn>
              <Btn variant="secondary" onClick={() => setAssignModal(null)}>
                Hủy
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
