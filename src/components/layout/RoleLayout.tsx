import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role, UserPublic } from "@shared/types";
import { MOBILE_NAV, NAV_CFG, ROLE_ICON } from "@shared/constants/labels";
import CountBadge from "../ui/CountBadge";
import WorkerRaiseHandFab from "../worker/WorkerRaiseHandFab";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useKeyboardViewport } from "../../hooks/useKeyboardViewport";
import { useOrders } from "../../hooks/useOrders";
import { isDemoMode } from "../../lib/demoMode";
import { salaryApi } from "../../services/api/SalaryApiService";

const PENDING_SHIFT = new Set(["pending_teamlead", "pending_qc", "pending_supervisor"]);

interface RoleLayoutProps {
  role: Role;
}

export default function RoleLayout({ role }: RoleLayoutProps) {
  const { user, logout } = useAuth();
  const { orders } = useOrders();
  const { unreadCount } = useNotifications();
  const { keyboardOpen } = useKeyboardViewport();
  const location = useLocation();
  const navigate = useNavigate();
  const [shiftCloseAlert, setShiftCloseAlert] = useState(false);

  useEffect(() => {
    if (role !== "supervisor" && role !== "teamlead") {
      setShiftCloseAlert(false);
      return;
    }
    let cancelled = false;
    void salaryApi
      .listShiftCloses()
      .then((rows) => {
        if (cancelled) return;
        const hit =
          role === "teamlead"
            ? rows.some((r) => r.status === "pending_teamlead")
            : rows.some((r) => PENDING_SHIFT.has(r.status));
        setShiftCloseAlert(hit);
      })
      .catch(() => {
        if (!cancelled) setShiftCloseAlert(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, location.pathname]);

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  const pendingCount = orders.filter((o) => o.pendingApproval).length;
  const desktopNav = NAV_CFG[role];
  const mobileNav = MOBILE_NAV[role];
  const profileItem = mobileNav.find((n) => n.id === "profile");
  const mobileTabs = mobileNav.filter((n) => n.id !== "profile");
  const notificationsPath = `/${role}/notifications`;
  const wideDesktop = role === "director" || role === "supervisor" || role === "admin";
  const contentMaxW = wideDesktop ? "max-w-7xl" : "max-w-5xl";
  const desktopNavClass = wideDesktop
    ? "hidden md:flex items-center gap-0.5 overflow-x-auto"
    : "hidden lg:flex items-center gap-0.5 overflow-x-auto";

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const mobileNavButton = (
    key: string,
    path: string,
    label: string,
    fa: string,
    badge?: number,
    alertDot?: boolean,
  ) => {
    const active = isActive(path);
    return (
      <button
        key={key}
        type="button"
        onClick={() => navigate(path)}
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium cursor-pointer border-0 bg-transparent relative min-w-0 h-full ${
          active ? "text-nav-active" : "text-muted-foreground"
        }`}
        aria-label={
          badge && badge > 0
            ? `${label}, ${badge} chưa đọc`
            : alertDot
              ? `${label}, có chốt ca chờ duyệt`
              : label
        }
        aria-current={active ? "page" : undefined}
      >
        <i className={`fas ${fa} text-lg`} />
        <span className={active ? "font-semibold" : "font-medium"}>{label}</span>
        {badge && badge > 0 ? (
          <CountBadge count={badge} className="absolute top-1.5 right-1/3" />
        ) : alertDot ? (
          <span className="absolute top-1.5 right-1/3 w-2 h-2 rounded-full bg-red-500" />
        ) : null}
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="hidden sm:flex bg-header text-header-foreground px-4 h-14 items-center justify-between z-30 sticky top-0 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-nav-active flex items-center justify-center">
            <i className={`fas ${ROLE_ICON[user.role]} text-sm text-nav-active-fg`} />
          </div>
          <div>
            <div className="font-display font-700 text-sm leading-tight">NOVO-VIỆT TIỆP</div>
            <div className="text-xs text-header-muted flex items-center gap-1.5">
              IQC
              {isDemoMode() ? (
                <span className="rounded px-1 py-0.5 bg-amber-500/25 text-amber-200 text-[10px] font-semibold tracking-wide">
                  DEMO
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <nav className={desktopNavClass}>
          {desktopNav.map((n) => {
            const active = isActive(n.path);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => navigate(n.path)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border-0 bg-transparent whitespace-nowrap ${
                  active
                    ? "text-nav-active"
                    : "text-header-muted hover:text-header-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <i className={`fas ${n.fa} text-xs`} /> {n.label}
                {n.id === "approvals" && pendingCount > 0 ? (
                  <CountBadge count={pendingCount} />
                ) : null}
                {n.id === "production" && shiftCloseAlert ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Có chốt ca chờ duyệt" />
                ) : null}
                {n.id === "notifications" && unreadCount > 0 ? (
                  <CountBadge count={unreadCount} />
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => navigate(`/${role}/profile`)}
            className="flex items-center gap-1.5 text-header-muted hover:text-header-foreground hover:bg-nav-active/80 text-xs transition-colors cursor-pointer bg-transparent border-0 px-2 py-1.5"
          >
            <i className="fas fa-user" /> Hồ sơ
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex items-center gap-1.5 text-header-muted hover:text-header-foreground hover:bg-nav-active/80 text-xs transition-colors cursor-pointer bg-transparent border-0 px-2 py-1.5"
          >
            <i className="fas fa-right-from-bracket" /> Đăng xuất
          </button>
        </div>
      </header>

      <main
        className="flex-1 overflow-auto sm:pb-6 transition-[padding] duration-200"
        style={{ paddingBottom: keyboardOpen ? "var(--keyboard-inset, 0px)" : undefined }}
      >
        <div
          className={`${contentMaxW} mx-auto px-4 sm:px-6 lg:px-8 py-5 ${keyboardOpen ? "pb-2" : "pb-24 sm:pb-0"}`}
        >
          <Outlet />
        </div>
      </main>
      {!keyboardOpen ? (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-bottom-nav border-t border-border flex z-30 h-[72px]">
          {mobileTabs.map((n) =>
            mobileNavButton(
              n.id,
              n.path,
              n.label,
              n.fa,
              n.id === "approvals" ? pendingCount : undefined,
              n.id === "production" && shiftCloseAlert,
            ),
          )}
          {mobileNavButton("notifications", notificationsPath, "Thông báo", "fa-bell", unreadCount)}
          {profileItem
            ? mobileNavButton("profile", profileItem.path, profileItem.label, profileItem.fa)
            : null}
        </nav>
      ) : null}
      {role === "worker" ? <WorkerRaiseHandFab hidden={keyboardOpen} /> : null}
    </div>
  );
}

export function useRoleUser(): UserPublic {
  const { user } = useAuth();
  if (!user) throw new Error("Not authenticated");
  return user;
}
