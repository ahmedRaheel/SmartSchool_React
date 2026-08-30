import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Bus,
  CalendarCheck, CalendarDays, ClipboardCheck, FileCheck2, GraduationCap,
  HeartPulse, LayoutDashboard, Library, MessageCircle, Route, Settings,
  ShieldCheck, Users, Wallet, Workflow, Building2, ChartNoAxesCombined,
  Cpu, ScrollText, Zap, Globe, CreditCard, Package, Brain, BookMarked,
  FlaskConical, MapPin, Sparkles, UserCircle, Briefcase,
} from "lucide-react";

export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  end?: boolean;
}
export interface NavigationSection { title: string; items: NavigationItem[]; }

const D: NavigationItem = { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true };

const menus: Record<string, NavigationItem[]> = {

  // ── SUPER ADMIN — SaaS platform operator only ─────────────────────────────
  superadmin: [
    D,
    { path: "/tenancy",        label: "Schools / Tenants",  icon: Globe },
    { path: "/subscriptions",  label: "Subscriptions",      icon: CreditCard },
    { path: "/modules",        label: "Module Manager",     icon: Package },
    { path: "/platform",       label: "API Health",         icon: HeartPulse },
    { path: "/audit",          label: "Audit & Logs",       icon: ShieldCheck },
    { path: "/ai-platform",    label: "AI Platform",        icon: Brain },
    { path: "/workflow",       label: "Support Tickets",    icon: Workflow },
  ],

  // ── TENANT / SCHOOL OWNER — owns all school config ───────────────────────
  tenant: [
    D,
    { path: "/organization",   label: "School & Campuses",  icon: Building2 },
    { path: "/setup",          label: "Academic Setup",     icon: BookOpen },
    { path: "/setup-finance",  label: "Fee Structure",      icon: Wallet },
    { path: "/ai-config",      label: "AI Configuration",   icon: Brain },
    { path: "/settings",       label: "Lookup & Settings",  icon: Settings },
    { path: "/reports",        label: "Reports",            icon: BarChart3 },
    { path: "/finance",        label: "Finance Overview",   icon: Wallet },
    { path: "/hr",             label: "HR & Payroll",       icon: BriefcaseBusiness },
    { path: "/students",       label: "Students",           icon: GraduationCap },
  ],

  // ── PRINCIPAL ────────────────────────────────────────────────────────────
  principal: [
    D,
    { path: "/reports",        label: "Performance",        icon: ChartNoAxesCombined },
    { path: "/academics",      label: "Academic Overview",  icon: BookOpen },
    { path: "/students",       label: "Students",           icon: GraduationCap },
    { path: "/examinations",   label: "Exams & Results",    icon: ClipboardCheck },
    { path: "/hr",             label: "Staff",              icon: Users },
    { path: "/attendance",     label: "Attendance",         icon: CalendarCheck },
    { path: "/ai",             label: "AI Insights",        icon: Sparkles },
    { path: "/communication",  label: "Communication",      icon: MessageCircle },
    { path: "/audit",          label: "Audit Logs",         icon: ShieldCheck },
  ],

  // ── ADMIN OFFICER ─────────────────────────────────────────────────────────
  admin: [
    D,
    { path: "/students",       label: "Students",           icon: GraduationCap,  badge: "" },
    { path: "/admissions",     label: "Admissions",         icon: ClipboardCheck },
    { path: "/finance",        label: "Fees & Finance",     icon: Wallet },
    { path: "/attendance",     label: "Attendance",         icon: CalendarCheck },
    { path: "/hr",             label: "HR",                 icon: BriefcaseBusiness },
    { path: "/payroll",        label: "Payroll",            icon: Briefcase },
    { path: "/transport",      label: "Transport",          icon: Bus },
    { path: "/library",        label: "Library",            icon: Library },
    { path: "/communication",  label: "Communication",      icon: MessageCircle,  badge: "3" },
    { path: "/reports",        label: "Reports",            icon: BarChart3 },
  ],

  // ── TEACHER ──────────────────────────────────────────────────────────────
  teacher: [
    D,
    { path: "/teacher-workspace", label: "My Workspace",   icon: Briefcase },
    { path: "/academics",      label: "My Classes",         icon: Building2 },
    { path: "/attendance",     label: "Attendance",         icon: CalendarCheck },
    { path: "/examinations",   label: "Grade Book",         icon: ClipboardCheck },
    { path: "/learning",       label: "Assignments",        icon: FileCheck2 },
    { path: "/communication",  label: "Messages",           icon: MessageCircle, badge: "3" },
    { path: "/ai",             label: "AI Assistant",       icon: Bot },
  ],

  // ── STUDENT ──────────────────────────────────────────────────────────────
  student: [
    D,
    { path: "/my-portal",      label: "My Portal",          icon: UserCircle },
    { path: "/academics",      label: "My Courses",         icon: BookOpen },
    { path: "/attendance",     label: "Attendance",         icon: CalendarCheck },
    { path: "/examinations",   label: "My Grades",          icon: ClipboardCheck },
    { path: "/finance",        label: "Fee Status",         icon: Wallet },
    { path: "/library",        label: "Library",            icon: Library },
    { path: "/ai",             label: "AI Tutor",           icon: Bot },
    { path: "/communication",  label: "Notifications",      icon: Bell },
  ],

  // ── PARENT ───────────────────────────────────────────────────────────────
  parent: [
    D,
    { path: "/parent-portal",  label: "My Children",        icon: Users },
    { path: "/finance",        label: "Fees",               icon: Wallet },
    { path: "/transport",      label: "Transport",          icon: Bus },
    { path: "/communication",  label: "Messages",           icon: MessageCircle, badge: "2" },
    { path: "/ai",             label: "Parent AI",          icon: Bot },
    { path: "/notifications",  label: "Notifications",      icon: Bell },
  ],

  // ── DRIVER ───────────────────────────────────────────────────────────────
  driver: [
    D,
    { path: "/driver-portal",  label: "My Route",           icon: MapPin },
    { path: "/transport",      label: "Transport",          icon: Route },
    { path: "/students",       label: "My Students",        icon: Users },
    { path: "/communication",  label: "Messages",           icon: MessageCircle },
    { path: "/notifications",  label: "Notifications",      icon: Bell },
  ],

  // ── SYSTEM / AI PLATFORM ─────────────────────────────────────────────────
  system: [
    { path: "/",               label: "AI Dashboard",       icon: LayoutDashboard, end: true },
    { path: "/ai-platform",    label: "Model Config",       icon: Cpu },
    { path: "/ai-rag",         label: "Knowledge / RAG",    icon: BookMarked },
    { path: "/ai-predictions", label: "Predictions",        icon: Zap },
    { path: "/ai-tutor-mgmt",  label: "AI Tutor",           icon: FlaskConical },
    { path: "/workflow",       label: "Integrations",       icon: Workflow },
    { path: "/audit",          label: "AI Logs",            icon: ScrollText },
  ],
};

const sectionTitles: Record<string, string> = {
  superadmin: "Platform — SaaS Operations",
  tenant:     "School Owner — Configuration",
  principal:  "Principal Workspace",
  admin:      "School Operations",
  teacher:    "Teacher Workspace",
  student:    "Student Workspace",
  parent:     "Parent Workspace",
  driver:     "Transport Workspace",
  system:     "AI Platform Management",
};

export function navigationForRoles(roles: readonly string[]): NavigationSection[] {
  const r = roles.map(x => x.toLowerCase());
  const key =
    r.includes("superadmin")  ? "superadmin" :
    r.includes("principal")   ? "principal"  :
    r.some(x => ["schooladmin","tenantadmin"].includes(x)) ? "tenant" :
    r.some(x => ["admin","adminoffice","officeadmin","accountant"].includes(x)) ? "admin" :
    r.includes("teacher")    ? "teacher"  :
    r.includes("student")    ? "student"  :
    r.some(x => ["parent","guardian"].includes(x)) ? "parent" :
    r.includes("driver")     ? "driver"   :
    r.includes("system")     ? "system"   :
    "tenant";

  return [{ title: sectionTitles[key] ?? "Workspace", items: menus[key] ?? [] }];
}
