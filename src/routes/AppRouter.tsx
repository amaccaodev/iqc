import { Navigate, Route, Routes } from "react-router-dom";
import { roleHomePath } from "@shared/constants/labels";
import RoleLayout from "../components/layout/RoleLayout";
import { useAuth } from "../hooks/useAuth";
import LoginPage from "../pages/auth/LoginPage";
import AdminAccountsPage from "../pages/admin/AdminAccountsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminRolesPage from "../pages/admin/AdminRolesPage";
import DirectorApprovalsPage from "../pages/director/DirectorApprovalsPage";
import DirectorDashboardPage from "../pages/director/DirectorDashboardPage";
import DirectorOrdersPage from "../pages/director/DirectorOrdersPage";
import QCDashboardPage from "../pages/qc/QCDashboardPage";
import QCInspectPage from "../pages/qc/QCInspectPage";
import StatsDashboardPage from "../pages/stats/StatsDashboardPage";
import StatsReportsPage from "../pages/stats/StatsReportsPage";
import StatsRecordPage from "../pages/stats/StatsRecordPage";
import SupervisorAssignPage from "../pages/supervisor/SupervisorAssignPage";
import SupervisorDashboardPage from "../pages/supervisor/SupervisorDashboardPage";
import SupervisorOrdersPage from "../pages/supervisor/SupervisorOrdersPage";
import TeamLeadAssignPage from "../pages/teamlead/TeamLeadAssignPage";
import TeamLeadBomsPage from "../pages/teamlead/TeamLeadBomsPage";
import TeamLeadDashboardPage from "../pages/teamlead/TeamLeadDashboardPage";
import TeamLeadReportPage from "../pages/teamlead/TeamLeadReportPage";
import WorkerDashboardPage from "../pages/worker/WorkerDashboardPage";
import WorkerEntryPage from "../pages/worker/WorkerEntryPage";
import WorkerTaskEntryPage from "../pages/worker/WorkerTaskEntryPage";
import IncidentsPage from "../pages/shared/IncidentsPage";
import OvertimePage from "../pages/shared/OvertimePage";
import ComplaintsPage from "../pages/shared/ComplaintsPage";
import NotificationsPage from "../pages/shared/NotificationsPage";
import ProfilePage from "../pages/shared/ProfilePage";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomePath(user.role)} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/director" element={<RoleLayout role="director" />}>
        <Route path="dashboard" element={<DirectorDashboardPage />} />
        <Route path="orders" element={<DirectorOrdersPage />} />
        <Route path="approvals" element={<DirectorApprovalsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/supervisor" element={<RoleLayout role="supervisor" />}>
        <Route path="dashboard" element={<SupervisorDashboardPage />} />
        <Route path="orders" element={<SupervisorOrdersPage />} />
        <Route path="assign" element={<SupervisorAssignPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="overtime" element={<OvertimePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/teamlead" element={<RoleLayout role="teamlead" />}>
        <Route path="dashboard" element={<TeamLeadDashboardPage />} />
        <Route path="boms" element={<TeamLeadBomsPage />} />
        <Route path="assign" element={<TeamLeadAssignPage />} />
        <Route path="report" element={<TeamLeadReportPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="overtime" element={<OvertimePage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/worker" element={<RoleLayout role="worker" />}>
        <Route path="dashboard" element={<WorkerDashboardPage />} />
        <Route path="entry" element={<WorkerEntryPage />} />
        <Route path="task/:orderId/:bomId" element={<WorkerTaskEntryPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="overtime" element={<OvertimePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/qc" element={<RoleLayout role="qc" />}>
        <Route path="dashboard" element={<QCDashboardPage />} />
        <Route path="inspect" element={<QCInspectPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/stats" element={<RoleLayout role="stats" />}>
        <Route path="dashboard" element={<StatsDashboardPage />} />
        <Route path="reports" element={<StatsReportsPage />} />
        <Route path="record" element={<StatsRecordPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/admin" element={<RoleLayout role="admin" />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="accounts" element={<AdminAccountsPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
