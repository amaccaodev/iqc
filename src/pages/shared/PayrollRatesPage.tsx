import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmployeeProductRate, Role } from "@shared/types";
import { ROLE_LABEL } from "@shared/constants/labels";
import { LIST_UI_PAGE_SIZE } from "@shared/constants/pagination";
import { catalogApi } from "../../services/api/CatalogApiService";
import { salaryApi } from "../../services/api/SalaryApiService";
import { userApi } from "../../services/api/UserApiService";
import { Btn, Card, ResponsiveDataList, SearchPicker } from "../../components/ui";
import { useRoleUser } from "../../hooks/useRoleUser";
import { createEntityPickerSearch } from "../../core/entityPicker";
import { usePagedList, useStableFetch } from "../../hooks/usePagedList";
import { downloadPayrollTemplate, parsePayrollCsv } from "../../utils/payrollImport";

type Tab = "list" | "import";

const PAYROLL_ROLES: Role[] = ["worker", "teamlead", "qc", "stats", "supervisor"];

export default function PayrollRatesPage() {
  const { role } = useRoleUser();
  const canImport = role === "admin" || role === "director";
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("list");
  const fetchUsers = useStableFetch((query) => userApi.list(query));
  const {
    items: users,
    total,
    page,
    pageSize,
    setPage,
    setPageSize,
    q,
    setQ,
    refresh: refreshUsers,
  } = usePagedList({
    fetchPage: fetchUsers,
    filters: { roles: PAYROLL_ROLES },
    pageSize: LIST_UI_PAGE_SIZE,
    enabled: tab === "list",
  });

  const [rates, setRates] = useState<EmployeeProductRate[]>([]);
  const [productCache, setProductCache] = useState<Record<string, { name: string; code: string }>>(
    {},
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<ReturnType<typeof parsePayrollCsv>>([]);
  const [importMsg, setImportMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [editUserId, setEditUserId] = useState("");
  const [editUserLabel, setEditUserLabel] = useState("");
  const [editProductId, setEditProductId] = useState("");
  const [editProductLabel, setEditProductLabel] = useState("");
  const [editRate, setEditRate] = useState("");
  const [showAddRate, setShowAddRate] = useState(false);

  const loadRates = useCallback(() => {
    void salaryApi.listRates().then(setRates).catch(() => setRates([]));
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const ratesByUser = useMemo(() => {
    const map = new Map<string, EmployeeProductRate[]>();
    for (const r of rates) {
      map.set(r.userId, [...(map.get(r.userId) ?? []), r]);
    }
    return map;
  }, [rates]);

  useEffect(() => {
    const ids = [...new Set(rates.map((r) => r.productId))].filter((id) => !productCache[id]);
    if (!ids.length) return;
    void catalogApi.searchProducts({ page: 1, pageSize: 100 }).then((paged) => {
      setProductCache((prev) => {
        const next = { ...prev };
        for (const p of paged.items) next[p.id] = { name: p.name, code: p.code };
        return next;
      });
    });
  }, [rates, productCache]);

  const productName = (id: string) => productCache[id]?.name ?? id;
  const productCode = (id: string) => productCache[id]?.code ?? id;

  const searchUsers = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => userApi.list(query),
        (u) => ({
          id: u.id,
          label: `${u.employeeId} — ${u.name}`,
          subLabel: `${ROLE_LABEL[u.role]} · ${u.department || "—"}`,
        }),
        { roles: PAYROLL_ROLES },
      ),
    [],
  );

  const searchProducts = useMemo(
    () =>
      createEntityPickerSearch(
        (query) => catalogApi.searchProducts(query),
        (p) => ({
          id: p.id,
          label: `${p.code} — ${p.name}`,
          subLabel: p.description || undefined,
        }),
      ),
    [],
  );

  const saveRate = async () => {
    if (!editUserId || !editProductId) return;
    await salaryApi.upsertRate(editUserId, editProductId, Number(editRate) || 0);
    setEditRate("");
    setShowAddRate(false);
    loadRates();
    setExpandedId(editUserId);
    refreshUsers();
  };

  const onPickFile = async (file: File) => {
    const text = await file.text();
    const rows = parsePayrollCsv(text);
    setImportPreview(rows);
    setImportMsg(rows.length ? `Đọc được ${rows.length} dòng` : "Không đọc được dòng nào — kiểm tra định dạng CSV");
  };

  const runImport = async () => {
    if (!importPreview.length) return;
    setBusy(true);
    setImportMsg("");
    try {
      const result = await salaryApi.importRows(importPreview);
      const errText = result.errors.length ? `\n${result.errors.slice(0, 5).join("\n")}` : "";
      setImportMsg(
        `Cập nhật ${result.profileUpdates} hồ sơ, ${result.rateUpdates} đơn giá lương.${errText}`,
      );
      setImportPreview([]);
      if (fileRef.current) fileRef.current.value = "";
      loadRates();
      refreshUsers();
      setTab("list");
    } catch (e) {
      setImportMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3 mb-4 lg:mb-6">
        <div>
          <h2 className="font-display font-800 text-xl lg:text-2xl">Quản lý lương nhân viên</h2>
        </div>
        <div className="flex gap-2">
          <Btn variant={tab === "list" ? "primary" : "secondary"} onClick={() => setTab("list")}>
            <i className="fas fa-users" /> Danh sách
          </Btn>
          {canImport && (
            <Btn
              variant={tab === "import" ? "primary" : "secondary"}
              onClick={() => setTab("import")}
            >
              <i className="fas fa-file-excel" /> Import Excel/CSV
            </Btn>
          )}
        </div>
      </div>

      {tab === "import" && canImport && (
        <Card cls="p-4 lg:p-5 mb-4 space-y-4">
          <h3 className="font-semibold text-sm">Import từ Excel / CSV</h3>
          <div className="flex flex-wrap gap-2">
            <Btn variant="secondary" onClick={downloadPayrollTemplate}>
              <i className="fas fa-download" /> Tải file mẫu CSV
            </Btn>
            <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
              <i className="fas fa-upload" /> Chọn file .csv
            </Btn>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickFile(f);
              }}
            />
          </div>
          {importPreview.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-xl">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="text-left p-2">Mã NV</th>
                    <th className="text-left p-2">Họ tên</th>
                    <th className="text-left p-2">Chức vụ</th>
                    <th className="text-left p-2">Phòng ban</th>
                    <th className="text-left p-2">Mã SP</th>
                    <th className="text-right p-2">Đơn giá</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 12).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="p-2 font-mono">{r.employeeId}</td>
                      <td className="p-2">{r.name ?? "—"}</td>
                      <td className="p-2">{r.roleLabel ?? "—"}</td>
                      <td className="p-2">{r.department ?? "—"}</td>
                      <td className="p-2 font-mono">{r.productCode ?? "—"}</td>
                      <td className="p-2 text-right tabular-nums">
                        {r.rateVnd != null ? r.rateVnd.toLocaleString("vi-VN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.length > 12 && (
                <p className="text-xs text-muted-foreground p-2">… và {importPreview.length - 12} dòng nữa</p>
              )}
            </div>
          )}
          {importMsg && <p className="text-sm text-muted whitespace-pre-wrap">{importMsg}</p>}
          {importPreview.length > 0 && (
            <Btn onClick={() => void runImport()} cls={busy ? "opacity-60" : ""}>
              <i className="fas fa-check" /> {busy ? "Đang import…" : "Xác nhận import"}
            </Btn>
          )}
        </Card>
      )}

      {tab === "list" && (
        <>
          <Card cls="p-3 lg:p-4 mb-4">
            <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3 items-end">
              <label className="text-sm block min-w-0">
                <span className="text-muted">Tìm nhân viên</span>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm mt-1"
                  placeholder="Mã NV, tên, phòng ban…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div className="text-xs text-muted lg:text-right">
                {total} nhân viên · {rates.length} đơn giá lương · trang {page}
              </div>
              {!showAddRate ? (
                <Btn size="sm" onClick={() => setShowAddRate(true)}>
                  <i className="fas fa-plus" /> Thêm
                </Btn>
              ) : null}
            </div>
          </Card>

          {showAddRate ? (
          <Card cls="p-3 lg:p-4 mb-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-sm">Thêm / sửa đơn giá thủ công</div>
              <button
                type="button"
                className="text-sm text-muted border-0 bg-transparent cursor-pointer"
                onClick={() => {
                  setShowAddRate(false);
                  setEditRate("");
                }}
              >
                Hủy
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <SearchPicker
                value={editUserId}
                displayValue={editUserLabel}
                placeholder="Tìm NV (mã / tên)…"
                onSearch={searchUsers}
                onChange={(id, item) => {
                  setEditUserId(id);
                  setEditUserLabel(item?.label ?? "");
                }}
              />
              <SearchPicker
                value={editProductId}
                displayValue={editProductLabel}
                placeholder="Tìm SP (mã / tên)…"
                onSearch={searchProducts}
                onChange={(id, item) => {
                  setEditProductId(id);
                  setEditProductLabel(item?.label ?? "");
                  if (item) {
                    setProductCache((prev) => ({
                      ...prev,
                      [id]: {
                        name: item.label.split(" — ")[1] ?? item.label,
                        code: item.label.split(" — ")[0] ?? id,
                      },
                    }));
                  }
                }}
              />
              <input
                className="border border-border rounded-lg px-3 py-2 text-sm"
                placeholder="Đơn giá VND/SP"
                value={editRate}
                onChange={(e) => setEditRate(e.target.value)}
              />
              <Btn onClick={() => void saveRate()}>
                <i className="fas fa-save" /> Lưu
              </Btn>
            </div>
          </Card>
          ) : null}

          <ResponsiveDataList
            items={users}
            getKey={(u) => u.id}
            page={page}
            pageSize={pageSize}
            total={total}
            onPage={setPage}
            onPageSize={setPageSize}
            emptyText="Không có nhân viên phù hợp"
            onRowClick={(u) => setExpandedId(expandedId === u.id ? null : u.id)}
            columns={[
              {
                key: "name",
                header: "Nhân viên",
                render: (u) => (
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <code className="text-[11px] text-muted">{u.employeeId}</code>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Chức vụ",
                render: (u) => ROLE_LABEL[u.role],
              },
              {
                key: "dept",
                header: "Phòng ban",
                render: (u) => u.department || "—",
              },
              {
                key: "phone",
                header: "SĐT",
                render: (u) => u.phone || "—",
              },
              {
                key: "rates",
                header: "Đơn giá",
                className: "text-right",
                render: (u) => (
                  <span className="font-medium text-primary">
                    {(ratesByUser.get(u.id) ?? []).length}
                  </span>
                ),
              },
            ]}
            renderCard={(u) => {
              const userRates = ratesByUser.get(u.id) ?? [];
              const open = expandedId === u.id;
              return (
                <Card cls="overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left p-3 flex items-start gap-3 cursor-pointer border-0 bg-transparent"
                    onClick={() => setExpandedId(open ? null : u.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-primary flex items-center justify-center shrink-0">
                      <i className="fas fa-user text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{u.name}</span>
                        <code className="text-[11px] bg-surface px-1.5 py-0.5 rounded">
                          {u.employeeId}
                        </code>
                        <span className="text-xs bg-background px-2 py-0.5 rounded">
                          {ROLE_LABEL[u.role]}
                        </span>
                      </div>
                      <div className="text-xs text-muted flex flex-wrap gap-x-3">
                        <span>{u.department || "—"}</span>
                        <span>{u.phone || "—"}</span>
                        <span className="text-primary font-medium">
                          {userRates.length} đơn giá lương
                        </span>
                      </div>
                    </div>
                    <i className={`fas fa-chevron-${open ? "up" : "down"} text-[#CBD5E1] mt-1`} />
                  </button>
                  {open && (
                    <div className="border-t border-border px-3 pb-3">
                      {userRates.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-3">Chưa liên kết đơn giá sản phẩm</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-2 pt-3">
                          {userRates.map((r) => (
                            <div
                              key={r.id}
                              className="border border-border rounded-lg p-2.5 text-sm bg-[#FAFBFC]"
                            >
                              <div className="font-medium truncate">{productName(r.productId)}</div>
                              <code className="text-[10px] text-muted">
                                {productCode(r.productId)}
                              </code>
                              <div className="font-bold text-primary mt-1 tabular-nums">
                                {r.rateVnd.toLocaleString("vi-VN")} đ/SP
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <Btn
                        size="sm"
                        variant="secondary"
                        cls="mt-3"
                        onClick={() => {
                          setEditUserId(u.id);
                          setEditUserLabel(`${u.employeeId} — ${u.name}`);
                          setExpandedId(u.id);
                          setShowAddRate(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <i className="fas fa-plus" /> Thêm đơn giá
                      </Btn>
                    </div>
                  )}
                </Card>
              );
            }}
          />

          {/* Desktop expanded rates under table selection */}
          {expandedId && (
            <Card cls="hidden lg:block p-4 mt-3">
              <div className="font-semibold text-sm mb-3">
                Đơn giá — {users.find((u) => u.id === expandedId)?.name ?? ""}
              </div>
              {(ratesByUser.get(expandedId) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa liên kết đơn giá sản phẩm</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {(ratesByUser.get(expandedId) ?? []).map((r) => (
                    <div
                      key={r.id}
                      className="border border-border rounded-lg p-2.5 text-sm bg-[#FAFBFC]"
                    >
                      <div className="font-medium truncate">{productName(r.productId)}</div>
                      <code className="text-[10px] text-muted">{productCode(r.productId)}</code>
                      <div className="font-bold text-primary mt-1 tabular-nums">
                        {r.rateVnd.toLocaleString("vi-VN")} đ/SP
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
