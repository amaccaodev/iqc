import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { Role } from "@shared/types";
import { MOBILE_NAV, NAV_CFG, ROLE_ICON, ROLE_LABEL, roleHomePath } from "@shared/constants/labels";
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

/** Chữ cái viết tắt từ họ tên (VD: "Nguyễn Văn An" → "VA") */
function initialsOf(name: string | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
  const tabNav = desktopNav.filter((n) => n.id !== "profile" && n.id !== "notifications");
  const notificationsPath = `/${role}/notifications`;
  const profilePath = `/${role}/profile`;
  const homePath = roleHomePath(role);
  const wideDesktop =
    role === "director" || role === "supervisor" || role === "admin" || role === "teamlead";
  const contentMaxW = wideDesktop ? "max-w-7xl" : "max-w-5xl";
  const demo = isDemoMode();
  const initials = initialsOf(user.name);
  const roleLabel = ROLE_LABEL[user.role] ?? user.role;

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

  const brand = (subtitle: ReactNode) => (
    <button
      type="button"
      onClick={() => navigate(homePath)}
      className="group flex items-center gap-3 shrink-0 bg-transparent border-0 cursor-pointer text-inherit p-0"
      aria-label="Về tổng quan"
    >
      <span className="relative w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
        <i className={`fas ${ROLE_ICON[user.role]} text-sm text-primary-foreground`} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
      </span>
      <span className="text-left leading-tight">
        <span className="block font-display font-800 text-[15px] tracking-tight text-header-foreground">
          COPEX
          <span className="text-gradient ml-1">IQC</span>
        </span>
        <span className="block text-[11px] text-header-muted">{subtitle}</span>
      </span>
    </button>
  );

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
        className={`group flex-1 flex flex-col items-center justify-center gap-1 text-[10px] cursor-pointer border-0 bg-transparent relative min-w-0 h-full transition-colors ${
          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
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
        <span
          className={`relative flex items-center justify-center h-7 rounded-full transition-all duration-300 ${
            active
              ? "w-12 bg-brand-gradient text-primary-foreground shadow-brand"
              : "w-9 group-active:scale-90"
          }`}
        >
          <i className={`fas ${fa} text-[15px]`} />
          {badge && badge > 0 ? (
            <CountBadge count={badge} className="absolute -top-1.5 -right-1.5 ring-2 ring-card" />
          ) : alertDot ? (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-card" />
          ) : null}
        </span>
        <span className={`truncate max-w-full px-0.5 ${active ? "font-bold" : "font-medium"}`}>
          {label}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col min-h-screen text-foreground">
      {/* ── Mobile header ───────────────────────────────────────────── */}
      <header className="sm:hidden flex h-14 items-center gap-2 px-3 glass border-b border-border/60 z-30 sticky top-0">
        {brand(
          <span className="flex items-center gap-1.5">
            {roleLabel}
            {demo ? <DemoPill /> : null}
          </span>,
        )}
        <div className="ml-auto flex items-center gap-1">
          <ThemeSwitcher variant="compact" />
          <button
            type="button"
            onClick={() => navigate(profilePath)}
            className="w-9 h-9 rounded-full bg-brand-gradient text-primary-foreground text-xs font-bold flex items-center justify-center border-0 cursor-pointer shadow-brand"
            aria-label="Hồ sơ"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* ── Tablet / desktop header ─────────────────────────────────── */}
      <header className="hidden sm:flex flex-col glass border-b border-border/60 z-30 sticky top-0">
        <div className={`w-full ${contentMaxW} mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-3`}>
          {brand(
            <span className="flex items-center gap-1.5">
              Hệ thống quản lý sản xuất
              {demo ? <DemoPill /> : null}
            </span>,
          )}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => navigate(notificationsPath)}
              className={`relative w-9 h-9 flex items-center justify-center rounded-xl border-0 cursor-pointer transition-colors ${
                isActive(notificationsPath)
                  ? "bg-secondary text-primary"
                  : "bg-transparent text-header-muted hover:text-header-foreground hover:bg-surface/80"
              }`}
              aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
              title="Thông báo"
            >
              <i className="fas fa-bell" />
              {unreadCount > 0 ? (
                <CountBadge count={unreadCount} className="absolute -top-0.5 -right-0.5 ring-2 ring-card" />
              ) : null}
            </button>
            <span className="w-px h-6 bg-border mx-1.5" aria-hidden />
            <button
              type="button"
              onClick={() => navigate(profilePath)}
              className={`flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full border cursor-pointer transition-all ${
                isActive(profilePath)
                  ? "border-primary/40 bg-secondary"
                  : "border-border/70 bg-card/60 hover:border-primary/40 hover:shadow-card"
              }`}
              title="Hồ sơ"
            >
              <span className="w-8 h-8 rounded-full bg-brand-gradient text-primary-foreground text-xs font-bold flex items-center justify-center">
                {initials}
              </span>
              <span className="hidden md:block text-left leading-tight max-w-[11rem]">
                <span className="block text-[13px] font-semibold text-header-foreground truncate">
                  {user.name}
                </span>
                <span className="block text-[11px] text-header-muted">{roleLabel}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-9 h-9 flex items-center justify-center rounded-xl border-0 bg-transparent text-header-muted hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <i className="fas fa-right-from-bracket" />
            </button>
          </div>
        </div>

        <nav
          className={`${hideCompactNav ? "hidden lg:block" : "block"} border-t border-border/50`}
          aria-label="Điều hướng chính"
        >
          <div
            className={`${contentMaxW} mx-auto flex items-center gap-1 overflow-x-auto px-3 sm:px-5 lg:px-7 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          >
            {tabNav.map((n) => {
              const active = isActive(n.path);
              const badge = navBadge(n.id);
              const alert = navAlert(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => navigate(n.path)}
                  className={`relative flex flex-col lg:flex-row items-center justify-center gap-1 lg:gap-2 min-w-[4.5rem] lg:min-w-0 px-3 py-1.5 lg:py-2 rounded-xl text-[11px] lg:text-[13px] cursor-pointer border-0 shrink-0 whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-card text-primary font-semibold shadow-card"
                      : "bg-transparent text-header-muted font-medium hover:text-header-foreground hover:bg-surface/70"
                  }`}
                  aria-label={
                    badge > 0
                      ? `${n.label}, ${badge} chưa đọc`
                      : alert
                        ? `${n.label}, có chốt ca chờ duyệt`
                        : n.label
                  }
                  aria-current={active ? "page" : undefined}
                >
                  <span className="relative">
                    <i className={`fas ${n.fa} text-sm lg:text-xs ${active ? "" : "opacity-80"}`} />
                    {badge > 0 ? (
                      <CountBadge count={badge} className="absolute -top-2 -right-3 lg:hidden" />
                    ) : alert ? (
                      <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 lg:hidden" />
                    ) : null}
                  </span>
                  <span>{n.label}</span>
                  {badge > 0 ? <CountBadge count={badge} className="hidden lg:flex" /> : null}
                  {alert ? (
                    <span
                      className="hidden lg:block w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse"
                      title="Có chốt ca chờ duyệt"
                    />
                  ) : null}
                  {active ? (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-6 rounded-full bg-brand-gradient" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main
        className="flex-1 overflow-auto sm:pb-8 transition-[padding] duration-200"
        style={{ paddingBottom: keyboardOpen ? "var(--keyboard-inset, 0px)" : undefined }}
      >
        <div
          className={`page-enter ${contentMaxW} mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 ${
            keyboardOpen || hideCompactNav ? "pb-2" : "pb-28 sm:pb-0"
          }`}
        >
          <Outlet />
        </div>
      </main>

      {/* ── Mobile floating tab bar ─────────────────────────────────── */}
      {!keyboardOpen && !hideCompactNav ? (
        <nav
          className="sm:hidden fixed bottom-0 inset-x-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
          aria-label="Điều hướng"
        >
          <div className="pointer-events-auto glass-strong border border-border/60 rounded-2xl h-16 flex items-stretch px-1 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)]">
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
          </div>
        </nav>
      ) : null}
      {role === "worker" && isWorkerTaskDetail ? (
        <WorkerRaiseHandFab hidden={keyboardOpen} />
      ) : null}
    </div>
  );
}

function DemoPill() {
  return (
    <span className="rounded-full px-1.5 py-px bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-1 ring-inset ring-amber-500/30 text-[9px] font-bold tracking-wider">
      DEMO
    </span>
  );
}
