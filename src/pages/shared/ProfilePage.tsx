import { useState } from "react";
import { ROLE_LABEL } from "@shared/constants/labels";
import { useAuth } from "../../hooks/useAuth";
import { useRoleUser } from "../../hooks/useRoleUser";
import { authApi } from "../../services/api/AuthApiService";
import { Btn, Input, ThemeSwitcher } from "../../components/ui";

type ProfileTab = "info" | "password";

export default function ProfilePage() {
  const user = useRoleUser();
  const { logout } = useAuth();
  const [tab, setTab] = useState<ProfileTab>("info");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleChangePassword = async () => {
    setPwdMsg(null);
    if (!currentPassword || !newPassword) {
      setPwdMsg({ ok: false, text: "Nhập mật khẩu hiện tại và mật khẩu mới." });
      return;
    }
    if (newPassword.length < 4) {
      setPwdMsg({ ok: false, text: "Mật khẩu mới tối thiểu 4 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ ok: false, text: "Xác nhận mật khẩu mới không khớp." });
      return;
    }
    setSavingPwd(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwdMsg({ ok: true, text: "Đã đổi mật khẩu." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setPwdMsg({ ok: false, text: (e as Error).message || "Không đổi được mật khẩu." });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h2 className="font-display font-800 text-xl text-center">Hồ sơ / Cài đặt</h2>

      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-surface border border-border"
        role="tablist"
        aria-label="Mục hồ sơ"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "info"}
          onClick={() => setTab("info")}
          className={`py-2.5 px-2 rounded-lg text-sm font-semibold border-0 cursor-pointer transition-colors ${
            tab === "info"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-transparent text-muted hover:text-foreground"
          }`}
        >
          <i className="fas fa-id-card mr-1.5" />
          Thông tin cá nhân
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "password"}
          onClick={() => setTab("password")}
          className={`py-2.5 px-2 rounded-lg text-sm font-semibold border-0 cursor-pointer transition-colors ${
            tab === "password"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-transparent text-muted hover:text-foreground"
          }`}
        >
          <i className="fas fa-key mr-1.5" />
          Đổi mật khẩu
        </button>
      </div>

      {tab === "info" ? (
        <div className="space-y-4" role="tabpanel">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border text-center">
            <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-3 text-2xl">
              <i className="fas fa-user" />
            </div>
            <div className="font-display font-800 text-lg">{user.name}</div>
            <div className="text-sm text-muted mt-0.5">{ROLE_LABEL[user.role]}</div>
            <div className="font-mono text-xs text-primary mt-2 bg-background inline-block px-3 py-1 rounded-full">
              {user.employeeId}
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {[
              { icon: "fa-id-badge", label: "Vai trò", value: ROLE_LABEL[user.role] },
              { icon: "fa-building", label: "Bộ phận", value: user.department || "—" },
              { icon: "fa-phone", label: "Điện thoại", value: user.phone || "—" },
              { icon: "fa-users", label: "Tổ", value: user.teamId || "—" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0"
              >
                <i className={`fas ${row.icon} text-muted-foreground w-5`} />
                <div className="text-xs text-muted-foreground w-24">{row.label}</div>
                <div className="text-sm font-medium">{row.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3">
            <div className="text-sm font-semibold text-foreground mb-2">Giao diện</div>
            <ThemeSwitcher />
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            className="w-full bg-card border border-red-200 text-red-600 font-semibold py-3 rounded-2xl cursor-pointer hover:bg-red-50"
          >
            <i className="fas fa-right-from-bracket mr-2" />
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-4 space-y-3" role="tabpanel">
          <div className="text-sm font-semibold text-foreground">Đổi mật khẩu</div>
          <Input
            label="Mật khẩu hiện tại"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="••••••••"
            required
          />
          <Input
            label="Mật khẩu mới"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Tối thiểu 4 ký tự"
            required
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Nhập lại mật khẩu mới"
            required
          />
          {pwdMsg ? (
            <div
              className={`text-sm rounded-lg px-3 py-2 ${
                pwdMsg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {pwdMsg.text}
            </div>
          ) : null}
          <Btn onClick={() => void handleChangePassword()} disabled={savingPwd} cls="w-full">
            {savingPwd ? "Đang lưu…" : "Cập nhật mật khẩu"}
          </Btn>
        </div>
      )}
    </div>
  );
}
