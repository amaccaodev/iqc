import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role, UserPublic } from "@shared/types";
import { MOBILE_NAV, NAV_CFG, ROLE_ICON, ROLE_LABEL } from "@shared/constants/labels";
import CountBadge from "../ui/CountBadge";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useOrders } from "../../hooks/useOrders";

interface RoleLayoutProps {
  role: Role;
}

export default function RoleLayout({ role }: RoleLayoutProps) {
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  const pendingCount = orders.filter((o) => o.pendingApproval).length;
  const desktopNav = NAV_CFG[role];
  const mobileNav = MOBILE_NAV[role];

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="flex flex-col min-h-screen bg-[#EFF2F7]">
      <header className="bg-[#1B3A5C] text-white px-4 h-14 flex items-center justify-between shadow-lg z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <i className={`fas ${ROLE_ICON[user.role]} text-sm text-white/90`} />
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-700 text-sm leading-tight">NOVO-VIỆT TIỆP</div>
            <div className="text-xs text-blue-300">
              {ROLE_LABEL[user.role]} – {user.name}
            </div>
          </div>
          <div className="sm:hidden font-display font-700 text-sm">{user.name}</div>
        </div>
        <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto">
          {desktopNav.map((n) => (
            <button
              key={n.id}
              onClick={() => navigate(n.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer border-0 whitespace-nowrap ${
                isActive(n.path)
                  ? "bg-white/20 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <i className={`fas ${n.fa} text-xs`} /> {n.label}
              {n.id === "approvals" && pendingCount > 0 ? (
                <CountBadge count={pendingCount} />
              ) : null}
              {n.id === "notifications" && unreadCount > 0 ? (
                <CountBadge count={unreadCount} />
              ) : null}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/${role}/notifications`)}
            className="sm:hidden relative w-9 h-9 rounded-full bg-white/10 text-white cursor-pointer border-0"
            aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
          >
            <i className="fas fa-bell text-sm" />
            {unreadCount > 0 ? (
              <CountBadge count={unreadCount} className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] text-[9px]" />
            ) : null}
          </button>
          <span className="hidden sm:block text-xs text-blue-300 font-mono">{user.employeeId}</span>
          <button
            onClick={() => void logout()}
            className="hidden sm:flex items-center gap-1.5 text-blue-300 hover:text-white text-xs transition-all cursor-pointer bg-transparent border-0 px-2 py-1 rounded hover:bg-white/10"
          >
            <i className="fas fa-right-from-bracket" /> Đăng xuất
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto pb-24 sm:pb-6">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Outlet />
        </div>
      </main>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E2E8F0] flex z-30 shadow-xl h-[72px]">
        {mobileNav.map((n) => {
          const active = isActive(n.path);
          return (
            <button
              key={n.id}
              onClick={() => navigate(n.path)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer border-0 bg-transparent relative"
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  active ? "bg-[#1B3A5C] text-white" : "text-[#94A3B8]"
                }`}
              >
                <i className={`fas ${n.fa} text-lg`} />
              </span>
              <span className={active ? "text-[#1B3A5C]" : "text-[#94A3B8]"}>{n.label}</span>
              {n.id === "approvals" && pendingCount > 0 ? (
                <CountBadge count={pendingCount} className="absolute top-1.5 right-1/3" />
              ) : null}
              {n.id === "notifications" && unreadCount > 0 ? (
                <CountBadge count={unreadCount} className="absolute top-1.5 right-1/3" />
              ) : null}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export function useRoleUser(): UserPublic {
  const { user } = useAuth();
  if (!user) throw new Error("Not authenticated");
  return user;
}
