import { createBrowserRouter } from "react-router-dom";
import { AppShell }          from "../../components/layout/AppShell";
import { RouteErrorPage }    from "../../components/ui/RouteErrorPage";
import { DashboardPage }     from "../../features/dashboard/pages/DashboardPage";
import { LoginPage }         from "../../features/auth/pages/LoginPage";
import { StudentsPage }      from "../../features/students/pages/StudentsPage";
import { FinancePage }       from "../../features/finance/pages/FinancePage";
import { AttendancePage }    from "../../features/attendance/pages/AttendancePage";
import { TransportPage }     from "../../features/transport/pages/TransportPage";
import { LibraryPage }       from "../../features/library/pages/LibraryPage";
import { ExaminationsPage }  from "../../features/examinations/pages/ExaminationsPage";
import { HrPage }            from "../../features/hr/pages/HrPage";
import { AiPage }            from "../../features/ai/pages/AiPage";
import { AdmissionsPage }    from "../../features/admissions/pages/AdmissionsPage";
import { CommunicationPage } from "../../features/communication/pages/CommunicationPage";
import { ReportsPage }       from "../../features/reports/pages/ReportsPage";
import { AcademicsPage }     from "../../features/academics/pages/AcademicsPage";
import { TenantManagementPage } from "../../features/tenancy/pages/TenantManagementPage";
import { SettingsPage }      from "../../features/settings/pages/SettingsPage";
import { ProfilesPage }      from "../../features/dashboard/pages/ProfilesPage";
import { WorkflowCenterPage } from "../../features/workflow/pages/WorkflowCenterPage";
import { OrganizationPage }  from "../../features/organization/pages/OrganizationPage";
import { ModulePlaceholder } from "../../components/ui/ModulePlaceholder";
import { MockDataProvider }  from "../../mocks/MockDataProvider";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MockDataProvider><AppShell /></MockDataProvider>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true,           element: <DashboardPage /> },

      // ── Core modules ──────────────────────────────────────
      { path: "students",      element: <StudentsPage /> },
      { path: "finance",       element: <FinancePage /> },
      { path: "attendance",    element: <AttendancePage /> },
      { path: "transport",     element: <TransportPage /> },
      { path: "library",       element: <LibraryPage /> },
      { path: "examinations",  element: <ExaminationsPage /> },
      { path: "hr",            element: <HrPage /> },
      { path: "payroll",       element: <HrPage /> },
      { path: "ai",            element: <AiPage /> },
      { path: "admissions",    element: <AdmissionsPage /> },
      { path: "communication", element: <CommunicationPage /> },
      { path: "reports",       element: <ReportsPage /> },
      { path: "academics",     element: <AcademicsPage /> },

      // ── Setup / configuration ─────────────────────────────
      { path: "setup",         element: <SettingsPage /> },
      { path: "setup/*",       element: <SettingsPage /> },
      { path: "settings",      element: <SettingsPage /> },
      { path: "organization",  element: <OrganizationPage /> },

      // ── Platform / admin ──────────────────────────────────
      { path: "tenancy",       element: <TenantManagementPage /> },
      { path: "profiles",      element: <ProfilesPage /> },
      { path: "workflow",      element: <WorkflowCenterPage /> },

      // ── Placeholder routes (API-backed, connect backend) ──
      { path: "platform",      element: <ModulePlaceholder module="Platform Health & Observability" /> },
      { path: "audit",         element: <ModulePlaceholder module="Audit & Logs" /> },
      { path: "teachers",      element: <HrPage /> },
      { path: "learning",      element: <ModulePlaceholder module="Learning & Assignments" /> },
      { path: "activities",    element: <ModulePlaceholder module="Events & Activities" /> },
      { path: "notifications", element: <ModulePlaceholder module="Notifications Centre" /> },
      { path: "observability", element: <ModulePlaceholder module="Observability" /> },
      { path: "documents",     element: <ModulePlaceholder module="Documents" /> },
    ],
  },
]);
