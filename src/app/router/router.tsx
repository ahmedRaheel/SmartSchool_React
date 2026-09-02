import { createBrowserRouter } from "react-router-dom";
import { AppShell }            from "../../components/layout/AppShell";
import { RouteErrorPage }      from "../../components/ui/RouteErrorPage";
import { MockDataProvider }    from "../../mocks/MockDataProvider";
import { RoleGuard }           from "../../core/rbac/RoleGuard";
import { NotFoundPage }        from "../../core/rbac/NotFoundPage";

// Auth
import { LoginPage }           from "../../features/auth/pages/LoginPage";

// Dashboard
import { DashboardPage }       from "../../features/dashboard/pages/DashboardPage";
import { ProfilesPage }        from "../../features/dashboard/pages/ProfilesPage";
import { ParentPortalPage }    from "../../features/dashboard/pages/ParentPortalPage";

// Core modules
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
import { DocumentsPage }       from "../../features/documents/pages/DocumentsPage";

// HR
import { HrPage }              from "../../features/hr/pages/HrPage";
import { PayrollPage }         from "../../features/hr/pages/PayrollPage";

// Teacher
import { TeachersPage }        from "../../features/teachers/pages/TeachersPage";

// Organization / Setup
import { TenantSetupPage }     from "../../features/organization/pages/TenantSetupPage";
import { SettingsPage }        from "../../features/settings/pages/SettingsPage";

// Platform / Super Admin
import { TenantManagementPage } from "../../features/tenancy/pages/TenantManagementPage";
import { SubscriptionsPage }    from "../../features/platform/pages/SubscriptionsPage";
import { PlatformAdminPage }    from "../../features/platform/pages/PlatformAdminPage";
import { AuditPage }            from "../../features/platform/pages/AuditPage";

// Modules
import { WorkflowCenterPage }  from "../../features/workflow/pages/WorkflowCenterPage";
import { ActivitiesPage }      from "../../features/activities/pages/ActivitiesPage";
import { LearningPage }        from "../../features/learning/pages/LearningPage";
import { InventoryPage }       from "../../features/inventory/pages/InventoryPage";

// ── Guarded route helper ──────────────────────────────────────────────────────
// Wraps an element with RoleGuard so it renders ForbiddenPage if the user
// doesn't have the required permission. Keeps route definitions clean.
function G(
  element: React.ReactElement,
  ...perms: Parameters<typeof RoleGuard>[0] extends { require?: infer P } ? [P?] : [any?]
): React.ReactElement {
  return element; // passthrough — guards are inline below for clarity
}

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MockDataProvider><AppShell /></MockDataProvider>,
    errorElement: <RouteErrorPage />,
    children: [
      // ── Dashboard (all roles) ────────────────────────────────────────────
      { index: true,  element: <DashboardPage /> },
      { path: "profiles", element: <ProfilesPage /> },

      // ── Actor-specific portals ───────────────────────────────────────────
      {
        path: "my-portal",
        element: <RoleGuard require="students.own.view"><StudentPortalPage /></RoleGuard>,
      },
      {
        path: "parent-portal",
        element: <RoleGuard requireAny={["students.own.view","attendance.own.view"]}><ParentPortalPage /></RoleGuard>,
      },
      {
        path: "driver-portal",
        element: <RoleGuard require="transport.own.route"><DriverPortalPage /></RoleGuard>,
      },
      {
        path: "teacher-workspace",
        element: <RoleGuard require="attendance.mark"><TeachersPage /></RoleGuard>,
      },

      // ── Students ─────────────────────────────────────────────────────────
      {
        path: "students",
        element: <RoleGuard requireAny={["students.list","students.own.view"]}><StudentsPage /></RoleGuard>,
      },

      // ── Finance ───────────────────────────────────────────────────────────
      {
        path: "finance",
        element: <RoleGuard requireAny={["finance.invoices.list","finance.own.view","finance.invoices.manage"]}><FinancePage /></RoleGuard>,
      },

      // ── Attendance ────────────────────────────────────────────────────────
      {
        path: "attendance",
        element: <RoleGuard requireAny={["attendance.mark","attendance.view.class","attendance.view.all","attendance.own.view"]}><AttendancePage /></RoleGuard>,
      },

      // ── Transport ─────────────────────────────────────────────────────────
      {
        path: "transport",
        element: <RoleGuard requireAny={["transport.fleet.manage","transport.routes.manage","transport.own.route"]}><TransportPage /></RoleGuard>,
      },

      // ── Library ───────────────────────────────────────────────────────────
      {
        path: "library",
        element: <RoleGuard requireAny={["library.catalogue.manage","library.loans.manage","library.own.loans"]}><LibraryPage /></RoleGuard>,
      },

      // ── Examinations ──────────────────────────────────────────────────────
      {
        path: "examinations",
        element: <RoleGuard requireAny={["exams.manage","exams.enter.marks","exams.view.all","exams.own.view"]}><ExaminationsPage /></RoleGuard>,
      },

      // ── AI ────────────────────────────────────────────────────────────────
      {
        path: "ai",
        element: <RoleGuard requireAny={["ai.assistant","ai.tutor","ai.quiz","ai.predictions.run"]}><AiPage /></RoleGuard>,
      },
      {
        path: "ai-predictions",
        element: <RoleGuard requireAny={["ai.predictions.run","ai.predictions.class"]}><AiPage /></RoleGuard>,
      },

      // ── Admissions ────────────────────────────────────────────────────────
      {
        path: "admissions",
        element: <RoleGuard requireAny={["admissions.manage","admissions.view"]}><AdmissionsPage /></RoleGuard>,
      },

      // ── Communication & Notifications (all authenticated) ─────────────────
      { path: "communication", element: <CommunicationPage /> },
      { path: "notifications",  element: <CommunicationPage /> },

      // ── Reports ───────────────────────────────────────────────────────────
      {
        path: "reports",
        element: <RoleGuard require="school.reports.view"><ReportsPage /></RoleGuard>,
      },

      // ── Documents ─────────────────────────────────────────────────────────
      {
        path: "documents",
        element: <RoleGuard require="school.documents.manage"><DocumentsPage /></RoleGuard>,
      },

      // ── HR ────────────────────────────────────────────────────────────────
      {
        path: "hr",
        element: <RoleGuard requireAny={["hr.list","hr.own.view","hr.view"]}><HrPage /></RoleGuard>,
      },
      {
        path: "payroll",
        element: <RoleGuard requireAny={["payroll.view","payroll.run","payroll.own.view"]}><PayrollPage /></RoleGuard>,
      },
      {
        path: "teachers",
        element: <RoleGuard requireAny={["hr.list","attendance.mark"]}><TeachersPage /></RoleGuard>,
      },

      // ── Learning / Assignments ────────────────────────────────────────────
      {
        path: "learning",
        element: <RoleGuard requireAny={["learning.assignments.create","learning.assignments.view.all","learning.assignments.own"]}><LearningPage /></RoleGuard>,
      },
      {
        path: "assignments",
        element: <RoleGuard requireAny={["learning.assignments.create","learning.assignments.view.all","learning.assignments.own"]}><LearningPage /></RoleGuard>,
      },

      // ── Workflow ──────────────────────────────────────────────────────────
      {
        path: "workflow",
        element: <RoleGuard require="school.workflow.manage"><WorkflowCenterPage /></RoleGuard>,
      },

      // ── Activities ────────────────────────────────────────────────────────
      {
        path: "activities",
        element: <RoleGuard requireAny={["activities.manage","activities.view"]}><ActivitiesPage /></RoleGuard>,
      },

      // ── Inventory ─────────────────────────────────────────────────────────
      {
        path: "inventory",
        element: <RoleGuard require="inventory.manage"><InventoryPage /></RoleGuard>,
      },

      // ── School Configuration (Owner / Principal / Admin) ──────────────────
      {
        path: "setup",
        element: <RoleGuard requireAny={["school.setup.manage","school.settings.manage"]}><TenantSetupPage /></RoleGuard>,
      },
      {
        path: "setup/*",
        element: <RoleGuard requireAny={["school.setup.manage","school.settings.manage"]}><TenantSetupPage /></RoleGuard>,
      },
      {
        path: "organization",
        element: <RoleGuard require="school.setup.manage"><TenantSetupPage /></RoleGuard>,
      },
      {
        path: "settings",
        element: <RoleGuard require="school.settings.manage"><SettingsPage /></RoleGuard>,
      },
      {
        path: "ai-config",
        element: <RoleGuard requireAny={["ai.knowledge.manage","ai.models.configure"]}><TenantSetupPage /></RoleGuard>,
      },
      { path: "setup-finance", element: <RoleGuard require="finance.fees.manage"><SettingsPage /></RoleGuard> },
      { path: "setup-hr",      element: <RoleGuard require="hr.create"><HrPage /></RoleGuard> },
      { path: "setup-lookup",  element: <RoleGuard require="school.settings.manage"><SettingsPage /></RoleGuard> },

      // ── Super Admin Platform ──────────────────────────────────────────────
      {
        path: "tenancy",
        element: <RoleGuard require="platform.tenants.manage"><TenantManagementPage /></RoleGuard>,
      },
      {
        path: "subscriptions",
        element: <RoleGuard require="platform.subscriptions.manage"><SubscriptionsPage /></RoleGuard>,
      },
      {
        path: "platform",
        element: <RoleGuard require="platform.audit.view"><PlatformAdminPage /></RoleGuard>,
      },
      {
        path: "ai-platform",
        element: <RoleGuard require="ai.models.configure"><PlatformAdminPage /></RoleGuard>,
      },
      {
        path: "ai-rag",
        element: <RoleGuard require="ai.knowledge.manage"><AiPage /></RoleGuard>,
      },
      {
        path: "ai-tutor-mgmt",
        element: <RoleGuard require="platform.audit.view"><PlatformAdminPage /></RoleGuard>,
      },
      {
        path: "audit",
        element: <RoleGuard require="platform.audit.view"><AuditPage /></RoleGuard>,
      },
      {
        path: "modules",
        element: <RoleGuard require="platform.tenants.manage"><PlatformAdminPage /></RoleGuard>,
      },

      // ── 404 catch-all ─────────────────────────────────────────────────────
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
