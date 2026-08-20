import { ROLE_LABEL } from "@shared/constants/labels";
import { useAuth } from "../../hooks/useAuth";
import { useRoleUser } from "../../components/layout/RoleLayout";

export default function ProfilePage() {
  const user = useRoleUser();
  const { logout } = useAuth();

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-display font-800 text-xl mb-5">Hồ sơ</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2E8F0] text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center mx-auto mb-3 text-2xl">
          <i className="fas fa-user" />
        </div>
        <div className="font-display font-800 text-lg">{user.name}</div>
        <div className="text-sm text-[#64748B] mt-0.5">{ROLE_LABEL[user.role]}</div>
        <div className="font-mono text-xs text-[#1B3A5C] mt-2 bg-[#EFF2F7] inline-block px-3 py-1 rounded-full">
          {user.employeeId}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden mb-4">
        {[
          { icon: "fa-building", label: "Bộ phận", value: user.department || "—" },
          { icon: "fa-phone", label: "Điện thoại", value: user.phone || "—" },
          { icon: "fa-users", label: "Tổ", value: user.teamId || "—" },
        ].map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9] last:border-0">
            <i className={`fas ${row.icon} text-[#94A3B8] w-5`} />
            <div className="text-xs text-[#94A3B8] w-24">{row.label}</div>
            <div className="text-sm font-medium">{row.value}</div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void logout()}
        className="w-full bg-white border border-red-200 text-red-600 font-semibold py-3 rounded-2xl cursor-pointer hover:bg-red-50"
      >
        <i className="fas fa-right-from-bracket mr-2" />
        Đăng xuất
      </button>
    </div>
  );
}
