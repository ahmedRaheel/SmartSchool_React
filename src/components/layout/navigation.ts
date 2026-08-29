import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Bus,
  CalendarCheck, CalendarDays, ClipboardCheck, FileCheck2, GraduationCap,
  HeartPulse, LayoutDashboard, Library, MessageCircle, Route, Settings,
  ShieldCheck, Users, Wallet, Workflow, Building2, ChartNoAxesCombined,
  Wrench, Cpu, Puzzle, ScrollText, Zap, UserCheck2,
} from "lucide-react";

export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
}
export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const D: NavigationItem = { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true };

const menus: Record<string, NavigationItem[]> = {
  superadmin: [
    D,
    { path: "/tenancy",      label: "Tenants",       icon: Building2 },
    { path: "/reports",      label: "Analytics",     icon: BarChart3 },
    { path: "/audit",        label: "Audit & Logs",  icon: ShieldCheck },
    { path: "/workflow",     label: "Support",       icon: Workflow },
    { path: "/ai",           label: "AI Control",    icon: Bot },
    { path: "/platform",     label: "API Health",    icon: HeartPulse },
    { path: "/settings",     label: "System Config", icon: Settings },
  ],
  tenant: [
    D,
    { path: "/setup",          label: "School Setup",   icon: Wrench },
    { path: "/organization",   label: "Schools & Campuses", icon: Building2 },
    { path: "/hr",             label: "Staff",          icon: Users },
    { path: "/academics",      label: "Academic Setup", icon: BookOpen },
    { path: "/finance",        label: "Finance",        icon: Wallet },
    { path: "/reports",        label: "Reports",        icon: BarChart3 },
    { path: "/ai",             label: "AI Insights",    icon: Bot },
  ],
  principal: [
    D,
    { path: "/academics",      label: "Academic",       icon: BookOpen },
    { path: "/setup",          label: "Departments",    icon: Building2 },
    { path: "/reports",        label: "Performance",    icon: ChartNoAxesCombined },
    { path: "/academics",      label: "Timetable",      icon: CalendarDays },
    { path: "/examinations",   label: "Exams",          icon: ClipboardCheck },
    { path: "/ai",             label: "AI Insights",    icon: Bot },
  ],
  admin: [
    D,
    { path: "/students",       label: "Students",       icon: GraduationCap,   badge: "2" },
    { path: "/admissions",     label: "Admissions",     icon: ClipboardCheck },
    { path: "/finance",        label: "Fees & Finance", icon: Wallet },
    { path: "/academics",      label: "Timetable",      icon: CalendarDays },
    { path: "/attendance",     label: "Attendance",     icon: CalendarCheck },
    { path: "/transport",      label: "Transport",      icon: Bus },
    { path: "/library",        label: "Library",        icon: Library },
    { path: "/communication",  label: "Communication",  icon: MessageCircle,   badge: "3" },
    { path: "/hr",             label: "HR",             icon: BriefcaseBusiness },
  ],
  teacher: [
    D,
    { path: "/academics",      label: "My Classes",     icon: Building2 },
    { path: "/attendance",     label: "Attendance",     icon: CalendarCheck },
    { path: "/examinations",   label: "Grade Book",     icon: ClipboardCheck },
    { path: "/learning",       label: "Assignments",    icon: FileCheck2 },
    { path: "/academics",      label: "Timetable",      icon: CalendarDays },
    { path: "/communication",  label: "Messages",       icon: MessageCircle,   badge: "3" },
    { path: "/ai",             label: "AI Assistant",   icon: Bot },
  ],
  student: [
    D,
    { path: "/academics",      label: "My Courses",     icon: BookOpen },
    { path: "/academics",      label: "Timetable",      icon: CalendarDays },
    { path: "/learning",       label: "Assignments",    icon: FileCheck2 },
    { path: "/examinations",   label: "My Grades",      icon: ClipboardCheck },
    { path: "/attendance",     label: "Attendance",     icon: CalendarCheck },
    { path: "/finance",        label: "Fee Status",     icon: Wallet },
    { path: "/ai",             label: "AI Tutor",       icon: Bot },
  ],
  parent: [
    D,
    { path: "/students",       label: "My Children",    icon: Users },
    { path: "/reports",        label: "Progress",       icon: ChartNoAxesCombined },
    { path: "/attendance",     label: "Attendance",     icon: CalendarCheck },
    { path: "/finance",        label: "Fees",           icon: Wallet },
    { path: "/transport",      label: "Transport",      icon: Bus },
    { path: "/communication",  label: "Messages",       icon: MessageCircle,   badge: "2" },
    { path: "/ai",             label: "AI Report",      icon: Bot },
  ],
  driver: [
    D,
    { path: "/transport",      label: "My Route",       icon: Route },
    { path: "/students",       label: "My Students",    icon: Users },
    { path: "/academics",      label: "School Timings", icon: CalendarDays },
    { path: "/communication",  label: "Messages",       icon: MessageCircle },
    { path: "/notifications",  label: "Notifications",  icon: Bell },
  ],
  system: [
    { path: "/",               label: "AI Dashboard",   icon: LayoutDashboard, end: true },
    { path: "/ai",             label: "Chatbot Config",  icon: Bot },
    { path: "/platform",       label: "Predictions",    icon: Zap },
    { path: "/workflow",       label: "Integrations",   icon: Puzzle },
    { path: "/audit",          label: "Logs",           icon: ScrollText },
  ],
};

const sectionTitles: Record<string, string> = {
  superadmin: "Platform",
  tenant:     "School Management",
  principal:  "Principal Workspace",
  admin:      "School Operations",
  teacher:    "Teacher Workspace",
  student:    "Student Workspace",
  parent:     "Parent Workspace",
  driver:     "Transport Workspace",
  system:     "AI & System",
};

export function navigationForRoles(roles: readonly string[]): NavigationSection[] {
  const r = roles.map(x => x.toLowerCase());
  const key =
    r.includes("superadmin") ? "superadmin" :
    r.includes("principal")  ? "principal"  :
    r.some(x => ["schooladmin","tenantadmin"].includes(x)) ? "tenant" :
    r.some(x => ["admin","adminoffice","officeadmin"].includes(x)) ? "admin" :
    r.includes("teacher")   ? "teacher"  :
    r.includes("student")   ? "student"  :
    r.some(x => ["parent","guardian"].includes(x)) ? "parent" :
    r.includes("driver")    ? "driver"   :
    r.includes("system")    ? "system"   :
    "tenant";

  return [{ title: sectionTitles[key] ?? "Workspace", items: menus[key] ?? [] }];
}
