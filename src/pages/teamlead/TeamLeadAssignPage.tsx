import { useEffect, useMemo, useState } from "react";
import type { BOMItem, Machine, ProductionOrder, WorkerMachineAssignment } from "@shared/types";
import { resolveBomTeamId, resolveUserTeamId, teamIdsMatch, filterMachinesForTeam } from "@shared/constants/teams";
import {
  bomProcessLockReason,
  bomPartGroupKey,
  isBomProcessUnlocked,
} from "@shared/utils/bomProcess";
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
        )
        .sort((a, b) => {
          const ga = bomPartGroupKey(a.b).localeCompare(bomPartGroupKey(b.b), "vi");
          if (ga !== 0) return ga;
          return (a.b.processSeq ?? 0) - (b.b.processSeq ?? 0);
        }),
    [orders, myTeamId],
  );

  const teamMachines = useMemo(
    () => filterMachinesForTeam(machines, myTeamId),
    [machines, myTeamId],
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
    if (!isBomProcessUnlocked(o, b)) {
      setErr(bomProcessLockReason(o, b) || "Quy trình chưa mở");
      return;
    }
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
    if (!isBomProcessUnlocked(o, b)) {
      setErr(bomProcessLockReason(o, b) || "Quy trình chưa mở");
      return;
    }
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
    if (!assignments.length) {
      setErr("Chọn ít nhất một công nhân và máy");
      return;
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
        <h2 className="font-display font-800 text-xl mb-1">Phân công quy trình</h2>
        <p className="text-sm text-muted">
          Mỗi linh kiện (sheet Mẫu van) tách thành các quy trình tuần tự. Gán theo{" "}
          <strong className="font-semibold text-foreground">tên quy trình → máy → người</strong>. Hết
          quy trình trước mới mở quy trình sau.
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

      {err && !assignModal && (
        <div className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      {myBOMs.length === 0 ? (
        <Card cls="p-10 text-center text-muted-foreground">
          <i className="fas fa-inbox text-3xl block mb-2 opacity-30" />
          Chưa có quy trình nào được phân cho tổ
        </Card>
      ) : (
        myBOMs.map(({ o, b }) => {
          const n = b.workerAssignments?.length || b.assignedWorkers.length;
          const unlocked = isBomProcessUnlocked(o, b);
          const lock = bomProcessLockReason(o, b);
          return (
            <Card key={b.id} cls={`p-4 ${unlocked ? "" : "opacity-75"}`}>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <code className="text-[11px] font-mono text-primary font-bold">{b.bomCode}</code>
                {b.processSeq != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-primary">
                    QT {b.processSeq}
                  </span>
                )}
                {!unlocked && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    Chờ QT trước
                  </span>
                )}
              </div>
              <div className="text-xs text-muted mb-0.5">
                Linh kiện: <span className="font-medium text-foreground">{b.partGroup || b.partName}</span>
              </div>
              <div className="font-semibold text-sm text-primary">
                Quy trình: {b.process || "—"}
              </div>
              <div className="text-xs text-muted-foreground mb-2">
                {o.orderNo} · {b.targetQty.toLocaleString()} cái
                {b.machine ? ` · Máy ĐMKT: ${b.machine}` : ""}
              </div>
              {lock && (
                <div className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  <i className="fas fa-lock mr-1" />
                  {lock}
                </div>
              )}
              {n > 0 ? (
                <div className="text-xs text-muted mb-3 space-y-0.5">
                  <div>
                    <i className="fas fa-users mr-1" />
                    {n} người · máy đã gán
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
                  Chưa gán người / máy cho quy trình này
                </div>
              )}
              <Btn size="sm" onClick={() => openAssign(o, b)} disabled={!unlocked}>
                <i className="fas fa-user-gear" /> Phân công (quy trình · máy · người)
              </Btn>
            </Card>
          );
        })
      )}

      {assignModal && (
        <Modal
          title={`Phân công: ${assignModal.b.process || assignModal.b.partName}`}
          onClose={() => setAssignModal(null)}
        >
          <div className="space-y-4">
            <div className="bg-background rounded-xl p-3 space-y-1">
              <div className="text-xs text-muted">
                Linh kiện:{" "}
                <span className="font-medium text-foreground">
                  {assignModal.b.partGroup || assignModal.b.partName}
                </span>
              </div>
              <div className="font-semibold text-sm text-primary">
                Quy trình: {assignModal.b.process || "—"}
                {assignModal.b.processSeq != null ? ` (QT ${assignModal.b.processSeq})` : ""}
              </div>
              <code className="text-xs font-mono text-muted">{assignModal.b.bomCode}</code>
              <div className="text-xs text-muted-foreground">{assignModal.o.orderNo}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted mb-2">
                Chọn người đảm nhiệm và máy
              </label>
              {teamWorkers.length === 0 ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="italic">Không có công nhân trong tổ.</p>
                  <p>
                    Tổ hiện tại: <code className="font-mono">{myTeamId || "—"}</code>
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
                            <label className="block text-[11px] text-muted mb-1">Máy</label>
                            <select
                              className="w-full border border-border rounded-lg px-2.5 py-2 text-sm bg-card"
                              value={row.machineId || row.machineName}
                              onChange={(e) => {
                                const val = e.target.value;
                                const m = teamMachines.find((x) => x.id === val || x.name === val);
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
                              <option value="">— Chọn máy (theo khu vực tổ) —</option>
                              {teamMachines.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                  {m.code ? ` (${m.code})` : ""}
                                  {m.location ? ` · ${m.location}` : ""}
                                </option>
                              ))}
                              {assignModal.b.machine &&
                                !teamMachines.some((m) => m.name === assignModal.b.machine) && (
                                  <option value={assignModal.b.machine}>
                                    {assignModal.b.machine} (theo ĐMKT)
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
