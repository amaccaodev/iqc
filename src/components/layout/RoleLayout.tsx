import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "@shared/types";
import { MOBILE_NAV, NAV_CFG, ROLE_ICON, roleHomePath } from "@shared/constants/labels";
import CountBadge from "../ui/CountBadge";
import WorkerRaiseHandFab from "../worker/WorkerRaiseHandFab";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { useKeyboardViewport } from "../../hooks/useKeyboardViewport";
import { useOrders } from "../../hooks/useOrders";
import { isDemoMode } from "../../lib/demoMode";
import { salaryApi } from "../../services/api/SalaryApiService";
import ThemeSwitcher from "../ui/ThemeSwitcher";

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
  const tabletNav = desktopNav.filter((n) => n.id !== "profile");
  const notificationsPath = `/${role}/notifications`;
  const homePath = roleHomePath(role);
  const wideDesktop =
    role === "director" || role === "supervisor" || role === "admin" || role === "teamlead";
  const contentMaxW = wideDesktop ? "max-w-7xl" : "max-w-5xl";

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  /** Detail đo kiểm CN: ẩn nav compact để tập trung thao tác */
  const isWorkerTaskDetail = role === "worker" && /\/worker\/task\//.test(location.pathname);
  const hideCompactNav = isWorkerTaskDetail;

  const navBadge = (id: string) => {
    if (id === "approvals") return pendingCount;
    if (id === "notifications") return unreadCount;
    return 0;
  };
  const navAlert = (id: string) =>
    (id === "production" || id === "shifts") && shiftCloseAlert;

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
      <header className="sm:hidden flex h-12 items-center px-3 bg-header text-header-foreground z-30 sticky top-0 border-b border-border/30">
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="flex items-center gap-2 bg-transparent border-0 cursor-pointer text-inherit p-0"
          aria-label="Về tổng quan"
        >
          <div className="w-8 h-8 bg-nav-active flex items-center justify-center">
            <i className={`fas ${ROLE_ICON[user.role]} text-sm text-nav-active-fg`} />
          </div>
          <div className="text-left">
            <div className="font-display font-700 text-sm leading-tight">COPEX</div>
            <div className="text-[10px] text-header-muted">Tổng quan</div>
          </div>
        </button>
        <div className="ml-auto">
          <ThemeSwitcher variant="compact" />
        </div>
      </header>
      <header className="hidden sm:flex flex-col bg-header text-header-foreground z-30 sticky top-0 border-b border-border/30">
        <div className="flex h-14 items-center justify-between px-4 gap-3">
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="flex items-center gap-3 shrink-0 bg-transparent border-0 cursor-pointer text-inherit p-0"
            aria-label="Về tổng quan"
          >
            <div className="w-8 h-8 bg-nav-active flex items-center justify-center">
              <i className={`fas ${ROLE_ICON[user.role]} text-sm text-nav-active-fg`} />
            </div>
            <div className="text-left">
              <div className="font-display font-700 text-sm leading-tight">COPEX</div>
              <div className="text-xs text-header-muted flex items-center gap-1.5">
                IQC
                {isDemoMode() ? (
                  <span className="rounded px-1 py-0.5 bg-amber-500/25 text-amber-200 text-[10px] font-semibold tracking-wide">
                    DEMO
                  </span>
                ) : null}
              </div>
            </div>
          </button>
          <nav className="hidden lg:flex items-center gap-0.5 overflow-x-auto min-w-0 flex-1 justify-center [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {desktopNav.map((n) => {
              const active = isActive(n.path);
              const badge = navBadge(n.id);
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
                  {badge > 0 ? <CountBadge count={badge} /> : null}
                  {navAlert(n.id) ? (
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Có chốt ca chờ duyệt" />
                  ) : null}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => navigate(`/${role}/profile`)}
              className={`flex items-center gap-1.5 hover:bg-nav-active/80 text-xs transition-colors cursor-pointer bg-transparent border-0 px-2 py-1.5 ${
                isActive(`/${role}/profile`)
                  ? "text-nav-active"
                  : "text-header-muted hover:text-header-foreground"
              }`}
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
        </div>
        {!hideCompactNav ? (
          <nav
            className="lg:hidden flex items-stretch overflow-x-auto px-1 border-t border-white/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Điều hướng tablet"
          >
            {tabletNav.map((n) => {
              const active = isActive(n.path);
              const badge = navBadge(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(n.path)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 min-w-[4.5rem] px-2.5 py-2 text-[10px] font-medium cursor-pointer border-0 bg-transparent shrink-0 ${
                    active ? "text-nav-active" : "text-header-muted"
                  }`}
                  aria-label={
                    badge > 0
                      ? `${n.label}, ${badge} chưa đọc`
                      : navAlert(n.id)
                        ? `${n.label}, có chốt ca chờ duyệt`
                        : n.label
                  }
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    <i className={`fas ${n.fa} text-sm`} />
                    {badge > 0 ? (
                      <CountBadge count={badge} className="absolute -top-1.5 -right-2.5" />
                    ) : navAlert(n.id) ? (
                      <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
                    ) : null}
                  </span>
                  <span className={active ? "font-semibold" : "font-medium"}>{n.label}</span>
                  {active ? (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-nav-active" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        ) : null}
      </header>

      <main
        className="flex-1 overflow-auto sm:pb-6 transition-[padding] duration-200"
        style={{ paddingBottom: keyboardOpen ? "var(--keyboard-inset, 0px)" : undefined }}
      >
        <div
          className={`${contentMaxW} mx-auto px-4 sm:px-6 lg:px-8 py-5 ${
            keyboardOpen || hideCompactNav ? "pb-2" : "pb-24 sm:pb-0"
          }`}
        >
          <Outlet />
        </div>
      </main>
      {!keyboardOpen && !hideCompactNav ? (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-bottom-nav border-t border-border flex z-30 h-[72px]">
          {mobileTabs.map((n) =>
            mobileNavButton(
              n.id,
              n.path,
              n.label,
              n.fa,
              n.id === "approvals" ? pendingCount : undefined,
              (n.id === "production" || n.id === "shifts") && shiftCloseAlert,
            ),
          )}
          {mobileNavButton("notifications", notificationsPath, "Thông báo", "fa-bell", unreadCount)}
          {profileItem
            ? mobileNavButton("profile", profileItem.path, profileItem.label, profileItem.fa)
            : null}
        </nav>
      ) : null}
      {role === "worker" && isWorkerTaskDetail ? (
        <WorkerRaiseHandFab hidden={keyboardOpen} />
      ) : null}
    </div>
  );
}
