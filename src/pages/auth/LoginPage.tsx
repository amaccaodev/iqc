import { useState } from "react";
import { Navigate } from "react-router-dom";
import type { LoginResponse } from "@shared/types";
import { roleHomePath } from "@shared/constants/labels";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

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
  const { theme, toggleTheme } = useTheme();
  const [empId, setEmpId] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [pendingMsg, setPendingMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1923] via-primary to-ring flex flex-col items-center justify-center px-4 relative">
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center border border-white/20 bg-white/10 text-white cursor-pointer"
        aria-label={theme === "dark" ? "Chuyển chế độ sáng" : "Chuyển chế độ tối"}
      >
        <i className={`fas ${theme === "dark" ? "fa-sun" : "fa-moon"}`} />
      </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4 border border-white/20">
            <i className="fas fa-industry text-white text-2xl" />
          </div>
          <div className="text-white/60 text-xs uppercase tracking-widest mb-1">Công ty Cổ phần</div>
          <h1 className="font-display font-800 text-white text-2xl">NOVO-VIỆT TIỆP</h1>
          <p className="text-white/50 text-sm mt-1">Hệ thống Quản lý Sản xuất</p>
        </div>
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 shadow-2xl">
          <h2 className="font-display font-700 text-lg text-foreground mb-5">Đăng nhập</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                Mã nhân viên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-id-badge absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submit()}
                  placeholder="VD: NV001"
                  data-testid="login-employee-id"
                  className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                <input
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void submit()}
                  type={showPwd ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  data-testid="login-password"
                  className="w-full pl-9 pr-10 py-2.5 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted cursor-pointer bg-transparent border-0"
                >
                  <i className={`fas ${showPwd ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
            </div>
            {err && (
              <div
                className="flex items-center gap-2 text-red-700 dark:text-red-300 text-xs bg-red-50 dark:bg-red-950/50 rounded-lg p-2.5"
                data-testid="login-error"
              >
                <i className="fas fa-circle-exclamation" />
                {err}
              </div>
            )}
            {pendingMsg && (
              <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 text-xs bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2.5">
                <i className="fas fa-mobile-screen-button mt-0.5" />
                {pendingMsg}
              </div>
            )}
            <button
              type="button"
              onClick={() => void submit()}
              disabled={loading}
              data-testid="login-submit"
              className="inline-flex items-center font-medium rounded-lg transition-all cursor-pointer border-0 select-none px-5 py-3 text-base gap-2 bg-primary text-primary-foreground hover:bg-ring w-full justify-center disabled:opacity-60"
            >
              <i className="fas fa-right-to-bracket" /> {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium mb-2">Tài khoản demo:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted">
              {[
                ["NV001", "GĐ"],
                ["NV010", "Quản đốc"],
                ["NV020", "Tổ trưởng"],
                ["NV030", "Công nhân"],
                ["NV040", "QC"],
                ["NV000", "Admin"],
              ].map(([id, r]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setEmpId(id);
                    setPwd(id === "NV000" ? "admin123" : "123456");
                  }}
                  className="text-left px-2 py-1 rounded hover:bg-surface cursor-pointer bg-transparent border-0 transition-colors"
                >
                  <span className="font-mono text-primary">{id}</span> – {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
