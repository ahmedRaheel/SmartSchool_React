import { createBrowserRouter } from "react-router-dom";
import { AppShell }            from "../../components/layout/AppShell";
import { RouteErrorPage }      from "../../components/ui/RouteErrorPage";
import { MockDataProvider }    from "../../mocks/MockDataProvider";

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

// HR
import { HrPage }              from "../../features/hr/pages/HrPage";
import { PayrollPage }         from "../../features/hr/pages/PayrollPage";

// Teacher
import { TeachersPage }        from "../../features/teachers/pages/TeachersPage";

// Organization / Setup
import { TenantSetupPage }     from "../../features/organization/pages/TenantSetupPage";
import { SettingsPage }        from "../../features/settings/pages/SettingsPage";

// Platform / Super Admin
import { TenantManagementPage }from "../../features/tenancy/pages/TenantManagementPage";
import { SubscriptionsPage }   from "../../features/platform/pages/SubscriptionsPage";
import { PlatformAdminPage }   from "../../features/platform/pages/PlatformAdminPage";
import { AuditPage }           from "../../features/platform/pages/AuditPage";

// New complete modules
import { WorkflowCenterPage }  from "../../features/workflow/pages/WorkflowCenterPage";
import { ActivitiesPage }      from "../../features/activities/pages/ActivitiesPage";
import { LearningPage }        from "../../features/learning/pages/LearningPage";
import { InventoryPage }       from "../../features/inventory/pages/InventoryPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <MockDataProvider><AppShell /></MockDataProvider>,
    errorElement: <RouteErrorPage />,
    children: [
      // Dashboard
      { index: true,                    element: <DashboardPage /> },
      { path: "profiles",               element: <ProfilesPage /> },

      // Actor portals
      { path: "my-portal",              element: <StudentPortalPage /> },
      { path: "parent-portal",          element: <ParentPortalPage /> },
      { path: "driver-portal",          element: <DriverPortalPage /> },
      { path: "teacher-workspace",      element: <TeachersPage /> },

      // School operations
      { path: "students",               element: <StudentsPage /> },
      { path: "finance",                element: <FinancePage /> },
      { path: "attendance",             element: <AttendancePage /> },
      { path: "transport",              element: <TransportPage /> },
      { path: "library",                element: <LibraryPage /> },
      { path: "examinations",           element: <ExaminationsPage /> },
      { path: "admissions",             element: <AdmissionsPage /> },
      { path: "communication",          element: <CommunicationPage /> },
      { path: "notifications",          element: <CommunicationPage /> },
      { path: "reports",                element: <ReportsPage /> },
      { path: "ai",                     element: <AiPage /> },

      // HR
      { path: "hr",                     element: <HrPage /> },
      { path: "payroll",                element: <PayrollPage /> },
      { path: "teachers",               element: <TeachersPage /> },

      // New complete modules
      { path: "workflow",               element: <WorkflowCenterPage /> },
      { path: "activities",             element: <ActivitiesPage /> },
      { path: "learning",               element: <LearningPage /> },
      { path: "assignments",            element: <LearningPage /> },
      { path: "inventory",              element: <InventoryPage /> },

      // School configuration
      { path: "setup",                  element: <TenantSetupPage /> },
      { path: "setup/*",                element: <TenantSetupPage /> },
      { path: "organization",           element: <TenantSetupPage /> },
      { path: "settings",               element: <SettingsPage /> },
      { path: "ai-config",              element: <TenantSetupPage /> },
      { path: "setup-finance",          element: <SettingsPage /> },
      { path: "setup-hr",               element: <HrPage /> },
      { path: "setup-lookup",           element: <SettingsPage /> },

      // Super Admin platform
      { path: "tenancy",                element: <TenantManagementPage /> },
      { path: "subscriptions",          element: <SubscriptionsPage /> },
      { path: "platform",               element: <PlatformAdminPage /> },
      { path: "ai-platform",            element: <PlatformAdminPage /> },
      { path: "ai-rag",                 element: <PlatformAdminPage /> },
      { path: "ai-predictions",         element: <AiPage /> },
      { path: "ai-tutor-mgmt",          element: <PlatformAdminPage /> },
      { path: "audit",                  element: <AuditPage /> },
      { path: "modules",                element: <PlatformAdminPage /> },

      // Misc
     // { path: "documents",              element: <DocumentsPage /> },
    ],
  },
]);
