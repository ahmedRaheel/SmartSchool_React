import { Navigate, createBrowserRouter, useLocation } from "react-router-dom";
import { AppShell } from "../../components/layout/AppShell";
import { useAuth } from "../../features/auth/auth";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { ProfilesPage } from "../../features/dashboard/pages/ProfilesPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { StudentsPage } from "../../features/students/pages/StudentsPage";
import { TeachersPage } from "../../features/teachers/pages/TeachersPage";
import { AcademicsPage } from "../../features/academics/pages/AcademicsPage";
import { ExaminationsPage } from "../../features/examinations/pages/ExaminationsPage";
import { AttendancePage } from "../../features/attendance/pages/AttendancePage";
import { FinancePage } from "../../features/finance/pages/FinancePage";
import { HrPage } from "../../features/hr/pages/HrPage";
import { LibraryPage } from "../../features/library/pages/LibraryPage";
import { TransportPage } from "../../features/transport/pages/TransportPage";
import { CommunicationPage } from "../../features/communication/pages/CommunicationPage";
import { AiPage } from "../../features/ai/pages/AiPage";
import { ReportsPage } from "../../features/reports/pages/ReportsPage";
import { RealModulePage } from "../../components/ui/RealModulePage";
import { SettingsPage } from "../../features/settings/pages/SettingsPage";
import { PlatformAdminPage } from "../../features/platform/pages/PlatformAdminPage";
import { WorkflowCenterPage } from "../../features/workflow/pages/WorkflowCenterPage";
function ProtectedShell() {
    const { user } = useAuth();
    const location = useLocation();
    return user ? <AppShell /> : <Navigate to="/login" replace state={{ from: location.pathname }}/>;
}
export const router = createBrowserRouter([
    { path: "/login", element: <LoginPage /> },
    {
        path: "/",
        element: <ProtectedShell />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: "profiles", element: <ProfilesPage /> },
            { path: "platform", element: <PlatformAdminPage /> },
            { path: "students", element: <StudentsPage /> },
            { path: "teachers", element: <TeachersPage /> },
            { path: "academics", element: <AcademicsPage /> },
            { path: "examinations", element: <ExaminationsPage /> },
            { path: "attendance", element: <AttendancePage /> },
            { path: "finance", element: <FinancePage /> },
            { path: "hr", element: <HrPage /> },
            { path: "library", element: <LibraryPage /> },
            { path: "transport", element: <TransportPage /> },
            { path: "communication", element: <CommunicationPage /> },
            { path: "ai", element: <AiPage /> },
            { path: "admissions", element: <RealModulePage module="admissions" /> },
            { path: "activities", element: <RealModulePage module="activities" /> },
            { path: "inventory", element: <RealModulePage module="inventory" /> },
            { path: "learning", element: <RealModulePage module="learning" /> },
            { path: "organization", element: <RealModulePage module="organization" /> },
            { path: "payroll", element: <RealModulePage module="payroll" /> },
            { path: "documents", element: <RealModulePage module="documents" /> },
            { path: "workflow", element: <WorkflowCenterPage /> },
            { path: "tenancy", element: <RealModulePage module="tenancy" /> },
            { path: "reports", element: <ReportsPage /> },
            { path: "settings", element: <SettingsPage /> },
        ],
    },
]);

