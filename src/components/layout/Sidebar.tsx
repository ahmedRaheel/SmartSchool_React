import { NavLink } from "react-router-dom";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Bus,
  CalendarCheck, ClipboardCheck, GraduationCap, HeartPulse, LayoutDashboard,
  ListTree, MessageCircle, Settings, ShieldCheck, SlidersHorizontal,
  Users, Wallet, Workflow, X
} from "lucide-react";
import { useAuth } from "../../features/auth/auth";

type NavItem = [string, string, any, string[]];

const navigation: NavItem[] = [
  ["/", "Dashboard", LayoutDashboard, ["*"]],
  ["/tenancy", "Tenants", GraduationCap, ["SuperAdmin"]],
  ["/platform", "Tenant Users", Users, ["SuperAdmin"]],
  ["/platform/features", "Plans & Features", SlidersHorizontal, ["SuperAdmin"]],
  ["/reference", "Lookups", ListTree, ["SuperAdmin", "SchoolAdmin", "Admin"]],
  ["/workflow", "Workflows", Workflow, ["SuperAdmin", "SchoolAdmin", "Admin", "Principal"]],
  ["/audit", "Audit & Impersonation", ShieldCheck, ["SuperAdmin"]],
  ["/observability", "System Health & Logs", HeartPulse, ["SuperAdmin"]],
  ["/organization", "Schools & Branches", GraduationCap, ["SchoolAdmin", "Admin", "Principal"]],
  ["/students", "Students", Users, ["SchoolAdmin", "Admin", "Principal", "Teacher"]],
  ["/teachers", "Teachers & Staff", Users, ["SchoolAdmin", "Admin", "Principal"]],
  ["/academics", "Academics", BookOpen, ["SchoolAdmin", "Admin", "Principal", "Teacher", "Student", "Parent"]],
  ["/attendance", "Attendance", CalendarCheck, ["SchoolAdmin", "Admin", "Principal", "Teacher", "Student", "Parent"]],
  ["/examinations", "Tests & Exams", ClipboardCheck, ["SchoolAdmin", "Admin", "Principal", "Teacher", "Student", "Parent", "Examiner"]],
  ["/finance", "Fees & Finance", Wallet, ["SchoolAdmin", "Admin", "Accountant", "Parent", "Student"]],
  ["/hr", "HR & Payroll", BriefcaseBusiness, ["SchoolAdmin", "Admin", "Principal", "HRManager", "Staff", "Teacher"]],
  ["/transport", "Transport", Bus, ["SchoolAdmin", "Admin", "TransportManager", "Driver", "Parent"]],
  ["/learning", "Learning", BookOpen, ["SchoolAdmin", "Admin", "Principal", "Teacher", "Student", "Parent"]],
  ["/communication", "Chat", MessageCircle, ["*"]],
  ["/notifications", "Notifications", Bell, ["*"]],
  ["/ai", "AI Assistant", Bot, ["*"]],
  ["/reports", "Reports & Analytics", BarChart3, ["SuperAdmin", "SchoolAdmin", "Admin", "Principal", "Examiner"]],
  ["/settings", "Settings", Settings, ["SuperAdmin", "SchoolAdmin", "Admin", "Principal"]],
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes("SuperAdmin");
  const visible = navigation.filter(
    ([, , , allowed]) => allowed.includes("*") || allowed.some((role) => roles.includes(role)),
  );

  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
            <span className="brand-mark"><GraduationCap size={22} /></span>
            <span>Smart<b>School</b></span>
          </div>
          <button className="sidebar-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="school-chip">
          <span>{user?.initials || "SS"}</span>
          <div>
            <b>{user?.name || "SmartSchool"}</b>
            <small>{isSuperAdmin ? "Platform master workspace" : `${user?.role || "User"} workspace`}</small>
          </div>
        </div>

        <div className="nav-label">{isSuperAdmin ? "Platform administration" : "Workspace"}</div>
        <nav className="nav">
          {visible.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={onClose}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {isSuperAdmin && (
          <div className="sidebar-upgrade">
            <Activity size={20} />
            <b>Platform services</b>
            <span>PostgreSQL • Redis • Kafka • Ollama</span>
            <div className="health-line"><i /> Observability enabled</div>
          </div>
        )}
      </aside>
    </>
  );
}
