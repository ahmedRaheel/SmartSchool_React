import { createBrowserRouter } from "react-router-dom";
import { AppShell }            from "../../components/layout/AppShell";
import { RouteErrorPage }      from "../../components/ui/RouteErrorPage";
import { MockDataProvider }    from "../../mocks/MockDataProvider";

// ── Auth ──────────────────────────────────────────────────────────────────────
import { LoginPage }           from "../../features/auth/pages/LoginPage";

// ── Dashboard / Profiles ──────────────────────────────────────────────────────
import { DashboardPage }       from "../../features/dashboard/pages/DashboardPage";
import { ProfilesPage }        from "../../features/dashboard/pages/ProfilesPage";
import { ParentPortalPage }    from "../../features/dashboard/pages/ParentPortalPage";

// ── Core school operations ────────────────────────────────────────────────────
import { StudentsPage }        from "../../features/students/pages/StudentsPage";
import { StudentPortalPage }   from "../../features/students/pages/StudentPortalPage";
import { FinancePage }         from "../../features/finance/pages/FinancePage";
import { AttendancePage }      from "../../features/attendance/pages/AttendancePage";
import { TransportPage }       from "../../features/transport/pages/TransportPage";
import { DriverPortalPage }    from "../../features/transport/pages/DriverPortalPage";
import { LibraryPage }         from "../../features/library/pages/LibraryPage";
import { ExaminationsPage }    from "../../features/examinations/pages/ExaminationsPage";
import { AiPage }              from "../../features/ai/pages/AiPage";
import { AdmissionsPage }      from "../../features/admissions/pages/AdmissionsPage";
import { CommunicationPage }   from "../../features/communication/pages/CommunicationPage";
import { ReportsPage }         from "../../features/reports/pages/ReportsPage";
import { AcademicsPage }       from "../../features/academics/pages/AcademicsPage";

// ── HR / Payroll ──────────────────────────────────────────────────────────────
import { HrPage }              from "../../features/hr/pages/HrPage";
import { PayrollPage }         from "../../features/hr/pages/PayrollPage";

// ── Teacher workspace ─────────────────────────────────────────────────────────
import { TeachersPage }        from "../../features/teachers/pages/TeachersPage";

// ── Tenant configuration (school owner) ──────────────────────────────────────
import { TenantSetupPage }     from "../../features/organization/pages/TenantSetupPage";
import { OrganizationPage }    from "../../features/organization/pages/OrganizationPage";
import { SettingsPage }        from "../../features/settings/pages/SettingsPage";

// ── Super Admin ───────────────────────────────────────────────────────────────
import { TenantManagementPage }from "../../features/tenancy/pages/TenantManagementPage";
import { SubscriptionsPage }   from "../../features/platform/pages/SubscriptionsPage";
import { PlatformAdminPage }   from "../../features/platform/pages/PlatformAdminPage";
import { AuditPage }           from "../../features/platform/pages/AuditPage";

// ── Workflow ──────────────────────────────────────────────────────────────────
import { WorkflowCenterPage }  from "../../features/workflow/pages/WorkflowCenterPage";

// ── Fallback ──────────────────────────────────────────────────────────────────
import { ModulePlaceholder }   from "../../components/ui/ModulePlaceholder";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MockDataProvider><AppShell /></MockDataProvider>,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true,                   element: <DashboardPage /> },

      // ── Actor portals ──────────────────────────────────────────
      { path: "my-portal",             element: <StudentPortalPage /> },
      { path: "parent-portal",         element: <ParentPortalPage /> },
      { path: "driver-portal",         element: <DriverPortalPage /> },
      { path: "teacher-workspace",     element: <TeachersPage /> },
      { path: "profiles",              element: <ProfilesPage /> },

      // ── Core school modules ────────────────────────────────────
      { path: "students",              element: <StudentsPage /> },
      { path: "finance",               element: <FinancePage /> },
      { path: "attendance",            element: <AttendancePage /> },
      { path: "transport",             element: <TransportPage /> },
      { path: "library",               element: <LibraryPage /> },
      { path: "examinations",          element: <ExaminationsPage /> },
      { path: "ai",                    element: <AiPage /> },
      { path: "admissions",            element: <AdmissionsPage /> },
      { path: "communication",         element: <CommunicationPage /> },
      { path: "reports",               element: <ReportsPage /> },
      { path: "academics",             element: <AcademicsPage /> },

      // ── HR / Staff ─────────────────────────────────────────────
      { path: "hr",                    element: <HrPage /> },
      { path: "teachers",              element: <TeachersPage /> },
      { path: "payroll",               element: <PayrollPage /> },

      // ── Tenant self-configuration ──────────────────────────────
      { path: "organization",          element: <OrganizationPage /> },
      { path: "setup",                 element: <TenantSetupPage /> },
      { path: "setup/*",               element: <TenantSetupPage /> },
      { path: "setup-finance",         element: <SettingsPage /> },
      { path: "setup-hr",              element: <HrPage /> },
      { path: "setup-lookup",          element: <SettingsPage /> },
      { path: "ai-config",             element: <TenantSetupPage /> },
      { path: "settings",              element: <SettingsPage /> },

      // ── Super Admin platform ───────────────────────────────────
      { path: "tenancy",               element: <TenantManagementPage /> },
      { path: "subscriptions",         element: <SubscriptionsPage /> },
      { path: "modules",               element: <ModulePlaceholder module="Module Manager" /> },
      { path: "platform",              element: <PlatformAdminPage /> },
      { path: "ai-platform",           element: <PlatformAdminPage /> },
      { path: "ai-rag",                element: <PlatformAdminPage /> },
      { path: "ai-predictions",        element: <PlatformAdminPage /> },
      { path: "ai-tutor-mgmt",         element: <PlatformAdminPage /> },
      { path: "audit",                 element: <AuditPage /> },

      // ── Shared ────────────────────────────────────────────────
      { path: "workflow",              element: <WorkflowCenterPage /> },
      { path: "learning",              element: <ModulePlaceholder module="Learning & Assignments" /> },
      { path: "activities",            element: <ModulePlaceholder module="Events & Activities" /> },
      { path: "notifications",         element: <CommunicationPage /> },
      { path: "documents",             element: <ModulePlaceholder module="Documents" /> },
    ],
  },
]);
