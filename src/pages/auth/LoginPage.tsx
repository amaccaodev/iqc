import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { LoginResponse } from "@shared/types";
import { roleHomePath } from "@shared/constants/labels";
import { useAuth } from "../../hooks/useAuth";
import { enableDemoMode, isDemoMode } from "../../lib/demoMode";
import ThemeSwitcher from "../../components/ui/ThemeSwitcher";

export default function LoginPage() {
  const { user, login, loading } = useAuth();

  if (user) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return <LoginForm onLogin={login} loading={loading} />;
}

function LoginForm({
  onLogin,
  loading,
}: {
  onLogin: (employeeId: string, password: string) => Promise<LoginResponse>;
  loading: boolean;
}) {
  const [empId, setEmpId] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [pendingMsg, setPendingMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const demo = isDemoMode();

  const submit = async () => {
    try {
      setErr("");
      setPendingMsg("");
      const result = await onLogin(empId.trim(), pwd);
      if (result.status === "pending_device") {
        setPendingMsg(result.message ?? "Thiết bị mới đang chờ phê duyệt.");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Đăng nhập thất bại");
    }
  };

  const demoAccounts: Array<[string, string, string]> = [
    ["NV001", "GĐ", "fa-star"],
    ["NV010", "Quản đốc", "fa-hard-hat"],
    ["NV020", "Tổ trưởng", "fa-wrench"],
    ["NV030", "Công nhân", "fa-gear"],
    ["NV040", "QC", "fa-magnifying-glass"],
    ["NV000", "Admin", "fa-shield"],
  ];

  const inputCls =
    "w-full pl-10 py-3 border border-border rounded-xl text-sm bg-input text-foreground";

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] relative overflow-hidden">
      {/* ── Hero (desktop) ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex relative flex-col justify-between p-12 xl:p-16 overflow-hidden bg-brand-gradient-3 text-white">
        <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_30%,#000_20%,transparent_70%)]" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/20 blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-black/20 blur-3xl animate-float [animation-delay:-4s]" />

        <div className="relative flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur flex items-center justify-center">
            <i className="fas fa-industry text-lg" />
          </span>
          <div className="leading-tight">
            <h1 className="font-display font-800 text-lg tracking-tight">COPEX IQC</h1>
            <div className="text-xs text-white/70">CTCP Công nghệ Đồng</div>
          </div>
        </div>

        <div className="relative max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur px-3 py-1 text-xs font-semibold mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Hệ thống đang hoạt động
          </span>
          <h2 className="font-display font-800 text-4xl xl:text-5xl leading-[1.1] tracking-tight">
            Quản lý sản xuất &amp; đo kiểm
            <span className="block text-white/80">thông minh, theo thời gian thực.</span>
          </h2>
          <p className="mt-5 text-white/75 text-base leading-relaxed">
            Từ lệnh sản xuất, phân công, đo kiểm IQC đến kho và chốt ca — tất cả trên một nền tảng.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[
              ["fa-file-contract", "Lệnh SX"],
              ["fa-ruler-combined", "Đo kiểm"],
              ["fa-warehouse", "Kho"],
            ].map(([icon, label]) => (
              <div
                key={label}
                className="rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur p-4 transition-transform hover:-translate-y-1"
              >
                <i className={`fas ${icon} text-lg mb-3 block`} />
                <div className="text-sm font-semibold">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-white/60">© {new Date().getFullYear()} COPEX · IQC Platform</div>
      </aside>

      {/* ── Form ───────────────────────────────────────────────────── */}
      <main className="relative flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute top-4 right-4 z-10">
          <ThemeSwitcher variant="cycle" />
        </div>
        <div className="w-full max-w-md animate-fade-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-4 shadow-brand">
              <i className="fas fa-industry text-primary-foreground text-2xl" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30" />
            </div>
            <div className="text-muted text-[11px] uppercase tracking-[0.2em] mb-1">CTCP Công nghệ Đồng</div>
            <h1 className="font-display font-800 text-3xl tracking-tight">
              COPEX <span className="text-gradient">IQC</span>
            </h1>
            <p className="text-muted text-sm mt-1">Hệ thống Quản lý Sản xuất</p>
          </div>

          {demo && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              <i className="fas fa-flask mt-0.5" />
              <div>
                <strong className="font-semibold">DEMO UI</strong> — chạy mock data, không cần backend.
                Chọn tài khoản demo bên dưới rồi đăng nhập.
              </div>
            </div>
          )}

          <div className="glass-strong text-card-foreground rounded-3xl border border-border/70 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="font-display font-800 text-2xl text-foreground">Chào mừng trở lại 👋</h2>
              <p className="text-sm text-muted mt-1">Đăng nhập bằng mã nhân viên để tiếp tục.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Mã nhân viên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-id-badge absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none" />
                  <input
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                    placeholder="VD: NV001"
                    data-testid="login-employee-id"
                    className={`${inputCls} pr-3`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none" />
                  <input
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void submit()}
                    type={showPwd ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    data-testid="login-password"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface cursor-pointer bg-transparent border-0 transition-colors"
                  >
                    <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                  </button>
                </div>
              </div>
              {err && (
                <div
                  className="flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs bg-rose-50 dark:bg-rose-500/10 ring-1 ring-inset ring-rose-500/20 rounded-xl px-3 py-2.5"
                  data-testid="login-error"
                >
                  <i className="fas fa-circle-exclamation" />
                  {err}
                </div>
              )}
              {pendingMsg && (
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs bg-amber-50 dark:bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 rounded-xl px-3 py-2.5">
                  <i className="fas fa-mobile-screen-button mt-0.5" />
                  {pendingMsg}
                </div>
              )}
              <button
                type="button"
                onClick={() => void submit()}
                disabled={loading}
                data-testid="login-submit"
                className="group inline-flex items-center justify-center w-full gap-2 rounded-xl px-5 py-3.5 text-[15px] font-semibold border-0 select-none cursor-pointer bg-primary bg-brand-gradient text-primary-foreground shadow-brand transition-all duration-200 hover:brightness-110 hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin" /> Đang đăng nhập...
                  </>
                ) : (
                  <>
                    Đăng nhập
                    <i className="fas fa-arrow-right text-sm transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 pt-5 border-t border-border/70">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2.5">
                Tài khoản demo
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {demoAccounts.map(([id, r, icon]) => {
                  const selected = empId === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setEmpId(id);
                        setPwd(id === "NV000" ? "admin123" : "123456");
                      }}
                      className={`flex items-center gap-2 text-left px-2.5 py-2 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? "border-primary/50 bg-secondary"
                          : "border-border/70 bg-card/50 hover:border-primary/40 hover:bg-surface"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[11px] ${
                          selected ? "bg-brand-gradient text-primary-foreground" : "bg-surface text-primary"
                        }`}
                      >
                        <i className={`fas ${icon}`} />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block font-mono text-[11px] font-semibold text-foreground">{id}</span>
                        <span className="block text-[11px] text-muted truncate">{r}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {!demo && (
              <button
                type="button"
                onClick={() => enableDemoMode()}
                className="mt-4 w-full text-xs text-muted-foreground hover:text-primary bg-transparent border border-dashed border-border hover:border-primary/50 rounded-xl py-2.5 cursor-pointer transition-colors"
              >
                <i className="fas fa-flask mr-1.5" />
                Bật chế độ demo UI (bypass backend)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
