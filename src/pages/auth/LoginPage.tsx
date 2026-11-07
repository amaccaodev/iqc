import { useState } from "react"
import { Navigate } from "react-router-dom"
import type { LoginResponse } from "@shared/types"
import { roleHomePath } from "@shared/constants/labels"
import { useAuth } from "../../hooks/useAuth"
import { enableDemoMode, isDemoMode } from "../../lib/demoMode"
import ThemeSwitcher from "../../components/ui/ThemeSwitcher"

export default function LoginPage() {
  const { user, login, loading } = useAuth()

  if (user) {
    return <Navigate to={roleHomePath(user.role)} replace />
  }

  return <LoginForm onLogin={login} loading={loading} />
}

function LoginForm({
  onLogin,
  loading,
}: {
  onLogin: (employeeId: string, password: string) => Promise<LoginResponse>
  loading: boolean
}) {
  const [empId, setEmpId] = useState("")
  const [pwd, setPwd] = useState("")
  const [err, setErr] = useState("")
  const [pendingMsg, setPendingMsg] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [empIdError, setEmpIdError] = useState("")
  const [pwdError, setPwdError] = useState("")
  const demo = isDemoMode()

  const submit = async () => {
    const trimmedId = empId.trim()
    let hasValidationError = false

    if (!trimmedId) {
      setEmpIdError("Vui lòng nhập mã nhân viên.")
      hasValidationError = true
    } else {
      setEmpIdError("")
    }

    if (!pwd) {
      setPwdError("Vui lòng nhập mật khẩu.")
      hasValidationError = true
    } else {
      setPwdError("")
    }

    if (hasValidationError) {
      setErr("Vui lòng điền đầy đủ mã nhân viên và mật khẩu.")
      return
    }

    try {
      setErr("")
      setPendingMsg("")
      const result = await onLogin(trimmedId, pwd)
      if (result.status === "pending_device") {
        setPendingMsg(result.message ?? "Thiết bị mới đang chờ phê duyệt.")
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Đăng nhập thất bại")
    }
  }

  const handleSelectDemo = (id: string) => {
    setEmpId(id)
    setPwd(id === "NV000" ? "admin123" : "123456")
    setEmpIdError("")
    setPwdError("")
    setErr("")
  }

  const demoAccounts: Array<[string, string, string]> = [
    ["NV001", "GĐ", "fa-star"],
    ["NV010", "Quản đốc", "fa-hard-hat"],
    ["NV020", "Tổ trưởng", "fa-wrench"],
    ["NV030", "Công nhân", "fa-gear"],
    ["NV040", "QC", "fa-magnifying-glass"],
    ["NV000", "Admin", "fa-shield"],
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between lg:grid lg:grid-cols-12 relative overflow-hidden">
      {/* ── Background ambient decorative orbs ── */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-primary-2/10 blur-3xl animate-float [animation-delay:-4s]"
        aria-hidden="true"
      />

      {/* ── Hero Column (Desktop / Enterprise Showcase) ── */}
      <aside className="hidden lg:flex lg:col-span-7 xl:col-span-7 relative flex-col justify-between p-10 xl:p-14 2xl:p-16 border-r border-border/70 bg-surface/50 backdrop-blur-md overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] [background-size:36px_36px] pointer-events-none [mask-image:radial-gradient(ellipse_at_30%_30%,#000_20%,transparent_75%)]"
          aria-hidden="true"
        />

        {/* Brand header */}
        <div className="relative flex items-center gap-3.5 z-10">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-primary-foreground flex items-center justify-center shadow-brand ring-1 ring-inset ring-foreground/10 shrink-0">
            <i className="fas fa-industry text-xl" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display font-extrabold text-xl tracking-tight text-foreground">
              COPEX <span className="text-gradient">IQC</span>
            </h1>
            <p className="text-xs font-medium text-muted tracking-wide mt-0.5">
              CTCP CÔNG NGHỆ ĐỒNG · SMART MES &amp; IQC
            </p>
          </div>
        </div>

        {/* Hero Central Content */}
        <div className="relative max-w-xl z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Hệ thống vận hành trực tuyến · Tiêu chuẩn ISO 9001:2015</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl xl:text-4xl 2xl:text-5xl leading-[1.18] tracking-tight text-foreground">
            Quản lý sản xuất &amp; đo kiểm
            <span className="block text-gradient mt-1">
              thông minh, theo thời gian thực.
            </span>
          </h2>

          <p className="mt-5 text-muted text-sm xl:text-base leading-relaxed">
            Số hóa toàn diện chu trình sản xuất công nghiệp: từ điều phối lệnh
            sản xuất, phân bổ công đoạn, đo kiểm IQC dung sai milimet đến xuất
            nhập kho và chốt ca tức thời.
          </p>

          {/* Feature Highlights Grid */}
          <div className="mt-8 grid grid-cols-3 gap-3.5">
            {[
              {
                icon: "fa-file-invoice",
                title: "Lệnh SX",
                desc: "Phân bổ & giám sát",
              },
              {
                icon: "fa-ruler-combined",
                title: "Đo kiểm IQC",
                desc: "Dung sai ±0.01mm",
              },
              {
                icon: "fa-boxes-stacked",
                title: "Kho & Chốt ca",
                desc: "Minh bạch tức thời",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl bg-card/75 border border-border/80 p-4 shadow-card hover:shadow-card-hover hover:border-primary/50 hover:-translate-y-1 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center mb-3 transition-transform group-hover:scale-110">
                  <i className={`fas ${icon} text-sm`} aria-hidden="true" />
                </div>
                <div className="text-sm font-bold text-foreground">{title}</div>
                <div className="text-xs text-muted mt-0.5">{desc}</div>
              </div>
            ))}
          </div>

          {/* Metric preview pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-medium text-muted">
              <i
                className="fas fa-check-double text-emerald-500"
                aria-hidden="true"
              />
              Độ chính xác đo kiểm 99.8%
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-medium text-muted">
              <i className="fas fa-bolt text-amber-500" aria-hidden="true" />
              Độ trễ đồng bộ &lt; 200ms
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-border/70 text-[11px] font-medium text-muted">
              <i
                className="fas fa-shield-halved text-primary"
                aria-hidden="true"
              />
              Bảo mật thiết bị đa tầng
            </span>
          </div>
        </div>

        {/* Hero Footer */}
        <div className="relative z-10 flex items-center justify-between pt-6 border-t border-border/60 text-xs text-muted">
          <span>
            © {new Date().getFullYear()} COPEX · IQC Industrial Platform
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <i
              className="fas fa-circle-check text-emerald-500"
              aria-hidden="true"
            />
            Hệ thống an toàn
          </span>
        </div>
      </aside>

      {/* ── Main Form Column ── */}
      <main className="lg:col-span-5 xl:col-span-5 relative flex flex-col justify-center items-center px-4 py-8 sm:px-8 xl:px-12 w-full min-h-screen">
        {/* Top bar controls */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
          <ThemeSwitcher variant="cycle" />
        </div>

        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile & Tablet Header */}
          <div className="text-center mb-6 sm:mb-8 lg:hidden">
            <div className="relative w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-3 shadow-brand ring-1 ring-inset ring-foreground/10">
              <i
                className="fas fa-industry text-primary-foreground text-2xl"
                aria-hidden="true"
              />
            </div>
            <div className="text-muted text-[11px] uppercase tracking-[0.2em] font-semibold mb-1">
              CTCP Công nghệ Đồng
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-foreground">
              COPEX <span className="text-gradient">IQC</span>
            </h1>
            <p className="text-muted text-xs sm:text-sm mt-1">
              Hệ thống Quản lý Sản xuất &amp; Đo kiểm
            </p>
          </div>

          {/* Demo Alert if demo mode is enabled */}
          {demo && (
            <div
              role="status"
              className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-200 animate-fade-up"
            >
              <i
                className="fas fa-flask text-amber-500 mt-0.5 shrink-0"
                aria-hidden="true"
              />
              <div className="leading-relaxed">
                <strong className="font-semibold">DEMO UI:</strong> Chạy dữ liệu
                giả lập (mock data), không cần backend. Chọn tài khoản demo bên
                dưới rồi nhấn Đăng nhập.
              </div>
            </div>
          )}

          {/* Card Container */}
          <div className="bg-card/85 glass-strong text-card-foreground rounded-3xl border border-border/80 shadow-card p-6 sm:p-8 relative">
            <div className="mb-6">
              <h2 className="font-display font-extrabold text-2xl text-foreground tracking-tight">
                Chào mừng trở lại 👋
              </h2>
              <p className="text-sm text-muted mt-1">
                Đăng nhập bằng mã nhân viên để tiếp tục phiên làm việc.
              </p>
            </div>

            {/* Native accessible form */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submit()
              }}
              noValidate
              className="space-y-4"
            >
              {/* Employee ID Field */}
              <div>
                <label
                  htmlFor="login-employee-id"
                  className="block text-xs font-semibold text-foreground/90 mb-1.5"
                >
                  Mã nhân viên{" "}
                  <span className="text-rose-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <div className="relative group">
                  <i
                    className="fas fa-id-badge absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors text-sm pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-employee-id"
                    data-testid="login-employee-id"
                    type="text"
                    autoComplete="username"
                    value={empId}
                    onChange={(e) => {
                      setEmpId(e.target.value)
                      if (empIdError) setEmpIdError("")
                      if (err) setErr("")
                    }}
                    placeholder="VD: NV001, NV010, NV030..."
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={!!empIdError || (!!err && !empId.trim())}
                    aria-describedby={
                      empIdError ? "employee-id-error" : undefined
                    }
                    className={`w-full pl-10 pr-4 py-3 bg-input text-foreground border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-muted-foreground/60 disabled:opacity-50 disabled:cursor-not-allowed ${
                      empIdError
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-border hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                </div>
                {empIdError && (
                  <p
                    id="employee-id-error"
                    className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1.5 animate-fade-up font-medium"
                    role="alert"
                  >
                    <i
                      className="fas fa-circle-exclamation text-[11px]"
                      aria-hidden="true"
                    />
                    <span>{empIdError}</span>
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-foreground/90"
                  >
                    Mật khẩu{" "}
                    <span className="text-rose-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Tối thiểu 6 ký tự
                  </span>
                </div>
                <div className="relative group">
                  <i
                    className="fas fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors text-sm pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    data-testid="login-password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={pwd}
                    onChange={(e) => {
                      setPwd(e.target.value)
                      if (pwdError) setPwdError("")
                      if (err) setErr("")
                    }}
                    placeholder="Nhập mật khẩu"
                    disabled={loading}
                    aria-required="true"
                    aria-invalid={!!pwdError || (!!err && !pwd)}
                    aria-describedby={pwdError ? "password-error" : undefined}
                    className={`w-full pl-10 pr-11 py-3 bg-input text-foreground border rounded-xl text-sm transition-all focus:outline-none focus:ring-4 placeholder:text-muted-foreground/60 disabled:opacity-50 disabled:cursor-not-allowed ${
                      pwdError
                        ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-border hover:border-primary/40 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPwd}
                    aria-controls="login-password"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition-colors"
                  >
                    <i
                      className={`fas ${
                        showPwd ? "fa-eye-slash" : "fa-eye"
                      } text-sm transition-transform duration-200`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
                {pwdError && (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs text-rose-500 dark:text-rose-400 flex items-center gap-1.5 animate-fade-up font-medium"
                    role="alert"
                  >
                    <i
                      className="fas fa-circle-exclamation text-[11px]"
                      aria-hidden="true"
                    />
                    <span>{pwdError}</span>
                  </p>
                )}
              </div>

              {/* Login Error Alert */}
              {err && (
                <div
                  data-testid="login-error"
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-700 dark:text-rose-300 animate-fade-up font-medium"
                >
                  <i
                    className="fas fa-circle-exclamation text-sm text-rose-500 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="leading-relaxed">{err}</div>
                </div>
              )}

              {/* Pending Device Alert */}
              {pendingMsg && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200 animate-fade-up font-medium"
                >
                  <i
                    className="fas fa-mobile-screen-button text-sm text-amber-500 mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="leading-relaxed">{pendingMsg}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                data-testid="login-submit"
                className="group relative inline-flex items-center justify-center w-full gap-2.5 rounded-xl px-5 py-3.5 text-sm sm:text-base font-semibold border-0 select-none cursor-pointer bg-primary bg-brand-gradient text-primary-foreground shadow-brand transition-all duration-200 hover:brightness-105 hover:-translate-y-0.5 hover:shadow-card-hover active:translate-y-0 active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <i
                      className="fas fa-circle-notch fa-spin text-sm"
                      aria-hidden="true"
                    />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <i
                      className="fas fa-arrow-right text-sm transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Accounts Selector */}
            <div className="mt-6 pt-5 border-t border-border/70">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Tài khoản demo
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Nhấp để điền nhanh
                </span>
              </div>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                role="region"
                aria-label="Tài khoản mẫu"
              >
                {demoAccounts.map(([id, r, icon]) => {
                  const selected = empId === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectDemo(id)}
                      aria-label={`Chọn tài khoản ${r} (${id})`}
                      aria-pressed={selected}
                      className={`group flex items-center gap-2 text-left p-2 rounded-xl border cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected
                          ? "border-primary/60 bg-secondary text-secondary-foreground shadow-sm ring-1 ring-primary/30"
                          : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-surface text-foreground hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[11px] transition-transform group-hover:scale-105 ${
                          selected
                            ? "bg-brand-gradient text-primary-foreground shadow-sm"
                            : "bg-surface text-primary"
                        }`}
                      >
                        <i className={`fas ${icon}`} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block font-mono-data text-[11px] font-bold text-foreground">
                          {id}
                        </span>
                        <span className="block text-[11px] text-muted truncate">
                          {r}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Demo UI toggle when not in demo mode */}
            {!demo && (
              <button
                type="button"
                onClick={() => enableDemoMode()}
                className="mt-4 w-full text-xs text-muted hover:text-foreground bg-surface/40 hover:bg-surface/80 border border-dashed border-border/80 hover:border-primary/50 rounded-xl py-2.5 cursor-pointer transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <i className="fas fa-flask text-amber-500" aria-hidden="true" />
                <span>Bật chế độ demo UI (không cần backend)</span>
              </button>
            )}

            {/* Security footer note */}
            <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <i
                className="fas fa-shield-halved text-emerald-500 text-[10px]"
                aria-hidden="true"
              />
              <span>Hệ thống bảo mật nội bộ · Truy cập có kiểm soát</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
