import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Bus,
  CalendarCheck, ClipboardCheck, FileCheck2, GraduationCap,
  LayoutDashboard, Library, MessageCircle, Route, Settings,
  ShieldCheck, Users, Wallet, Workflow, Building2, ChartNoAxesCombined,
  Cpu, ScrollText, Zap, Globe, CreditCard, Package, Brain, BookMarked,
  FlaskConical, MapPin, Sparkles, UserCircle, Briefcase, FileText,
  Home, Star, Calendar,
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

// ─── MENUS PER ROLE ──────────────────────────────────────────────────────────
const MENUS: Record<string, { title: string; sections: NavigationSection[] }> = {

  superadmin: {
    title: "Platform — SaaS",
    sections: [
      {
        title: "Platform",
        items: [
          D,
          { path: "/tenancy",        label: "Schools / Tenants", icon: Globe },
          { path: "/subscriptions",  label: "Subscriptions",     icon: CreditCard },
          { path: "/audit",          label: "Audit & Logs",      icon: ShieldCheck },
        ],
      },
      {
        title: "AI Platform",
        items: [
          { path: "/ai-platform",    label: "Model Config",      icon: Cpu },
          { path: "/ai-rag",         label: "Knowledge / RAG",   icon: BookMarked },
          { path: "/ai-predictions", label: "Predictions",       icon: Zap },
          { path: "/platform",       label: "Exec Logs",         icon: ScrollText },
        ],
      },
      {
        title: "System",
        items: [
          { path: "/workflow",       label: "Workflow Centre",   icon: Workflow },
          { path: "/modules",        label: "Module Manager",    icon: Package },
        ],
      },
    ],
  },

  // School Owner — full access to all school modules
  tenant: {
    title: "School Owner",
    sections: [
      {
        title: "Overview",
        items: [
          D,
          { path: "/reports",        label: "Reports & Analytics", icon: BarChart3 },
          { path: "/ai",             label: "AI Insights",       icon: Sparkles },
        ],
      },
      {
        title: "Students",
        items: [
          { path: "/students",       label: "Students",          icon: GraduationCap },
          { path: "/admissions",     label: "Admissions",        icon: ClipboardCheck },
          { path: "/attendance",     label: "Attendance",        icon: CalendarCheck },
          { path: "/examinations",   label: "Examinations",      icon: ClipboardCheck },
          { path: "/learning",       label: "Assignments",       icon: FileCheck2 },
        ],
      },
      {
        title: "Operations",
        items: [
          { path: "/finance",        label: "Finance & Fees",    icon: Wallet },
          { path: "/hr",             label: "HR & Staff",        icon: BriefcaseBusiness },
          { path: "/payroll",        label: "Payroll",           icon: Briefcase },
          { path: "/transport",      label: "Transport",         icon: Bus },
          { path: "/library",        label: "Library",           icon: Library },
          { path: "/inventory",      label: "Inventory",         icon: Package },
          { path: "/documents",      label: "Documents",         icon: FileText },
          { path: "/activities",     label: "Activities",        icon: Star },
          { path: "/workflow",       label: "Workflow",          icon: Workflow },
        ],
      },
      {
        title: "Configuration",
        items: [
          { path: "/setup",          label: "School Setup",      icon: Building2 },
          { path: "/settings",       label: "Settings",          icon: Settings },
          { path: "/ai-config",      label: "AI Config",         icon: Brain },
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
        ],
      },
    ],
  },

  principal: {
    title: "Principal",
    sections: [
      {
        title: "Overview",
        items: [
          D,
          { path: "/reports",        label: "Performance",       icon: ChartNoAxesCombined },
          { path: "/ai",             label: "AI Insights",       icon: Sparkles },
        ],
      },
      {
        title: "Academic",
        items: [
          { path: "/students",       label: "Students",          icon: GraduationCap },
          { path: "/attendance",     label: "Attendance",        icon: CalendarCheck },
          { path: "/examinations",   label: "Exams & Results",   icon: ClipboardCheck },
          { path: "/learning",       label: "Learning",          icon: BookOpen },
          { path: "/activities",     label: "Activities",        icon: Star },
        ],
      },
      {
        title: "Administration",
        items: [
          { path: "/hr",             label: "Staff",             icon: Users },
          { path: "/communication",  label: "Communication",     icon: MessageCircle },
          { path: "/audit",          label: "Audit Logs",        icon: ShieldCheck },
        ],
      },
    ],
  },

  // Admin / Admin Officer
  admin: {
    title: "School Operations",
    sections: [
      {
        title: "Overview",
        items: [
          D,
          { path: "/reports",        label: "Reports",           icon: BarChart3 },
          { path: "/ai",             label: "AI Insights",       icon: Sparkles },
        ],
      },
      {
        title: "Students",
        items: [
          { path: "/students",       label: "Students",          icon: GraduationCap },
          { path: "/admissions",     label: "Admissions",        icon: ClipboardCheck },
          { path: "/attendance",     label: "Attendance",        icon: CalendarCheck },
          { path: "/examinations",   label: "Examinations",      icon: ClipboardCheck },
          { path: "/learning",       label: "Assignments",       icon: FileCheck2 },
        ],
      },
      {
        title: "Operations",
        items: [
          { path: "/finance",        label: "Fees & Finance",    icon: Wallet },
          { path: "/hr",             label: "HR",                icon: BriefcaseBusiness },
          { path: "/payroll",        label: "Payroll",           icon: Briefcase },
          { path: "/transport",      label: "Transport",         icon: Bus },
          { path: "/library",        label: "Library",           icon: Library },
          { path: "/inventory",      label: "Inventory",         icon: Package },
          { path: "/activities",     label: "Activities",        icon: Star },
          { path: "/workflow",       label: "Workflow",          icon: Workflow },
        ],
      },
      {
        title: "Communication",
        items: [
          { path: "/communication",  label: "Messages",          icon: MessageCircle, badge: "3" },
          { path: "/setup",          label: "School Setup",      icon: Settings },
        ],
      },
    ],
  },

  teacher: {
    title: "Teacher Workspace",
    sections: [
      {
        title: "My Workspace",
        items: [
          D,
          { path: "/teacher-workspace", label: "Dashboard",     icon: LayoutDashboard },
          { path: "/attendance",     label: "Attendance",        icon: CalendarCheck },
          { path: "/examinations",   label: "Grade Book",        icon: ClipboardCheck },
          { path: "/learning",       label: "Assignments",       icon: FileCheck2 },
        ],
      },
      {
        title: "Resources",
        items: [
          { path: "/students",       label: "My Students",       icon: GraduationCap },
          { path: "/library",        label: "Library",           icon: Library },
          { path: "/activities",     label: "Activities",        icon: Star },
        ],
      },
      {
        title: "AI & Communication",
        items: [
          { path: "/ai",             label: "AI Assistant",      icon: Bot },
          { path: "/communication",  label: "Messages",          icon: MessageCircle, badge: "3" },
          { path: "/notifications",  label: "Notifications",     icon: Bell },
        ],
      },
    ],
  },

  student: {
    title: "Student Portal",
    sections: [
      {
        title: "My Learning",
        items: [
          D,
          { path: "/my-portal",      label: "My Profile",        icon: UserCircle },
          { path: "/attendance",     label: "Attendance",        icon: CalendarCheck },
          { path: "/examinations",   label: "My Grades",         icon: ClipboardCheck },
          { path: "/learning",       label: "Assignments",       icon: FileCheck2 },
        ],
      },
      {
        title: "Services",
        items: [
          { path: "/finance",        label: "Fee Status",        icon: Wallet },
          { path: "/library",        label: "Library",           icon: Library },
          { path: "/activities",     label: "Activities & Awards", icon: Star },
          { path: "/transport",      label: "My Bus",            icon: Bus },
        ],
      },
      {
        title: "AI & Connect",
        items: [
          { path: "/ai",             label: "AI Tutor",          icon: Bot },
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
          { path: "/notifications",  label: "Notifications",     icon: Bell },
        ],
      },
    ],
  },

  parent: {
    title: "Parent Portal",
    sections: [
      {
        title: "My Children",
        items: [
          D,
          { path: "/parent-portal",  label: "My Children",       icon: Users },
          { path: "/finance",        label: "Fees & Payments",   icon: Wallet },
          { path: "/transport",      label: "Bus Tracking",      icon: Bus },
        ],
      },
      {
        title: "AI & Connect",
        items: [
          { path: "/ai",             label: "Parent AI",         icon: Bot },
          { path: "/communication",  label: "Messages",          icon: MessageCircle, badge: "2" },
          { path: "/notifications",  label: "Notifications",     icon: Bell },
        ],
      },
    ],
  },

  driver: {
    title: "Driver Workspace",
    sections: [
      {
        title: "Transport",
        items: [
          D,
          { path: "/driver-portal",  label: "My Route",          icon: MapPin },
          { path: "/transport",      label: "Fleet & Routes",    icon: Route },
          { path: "/students",       label: "Student Manifest",  icon: Users },
        ],
      },
      {
        title: "Communication",
        items: [
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
          { path: "/notifications",  label: "Notifications",     icon: Bell },
        ],
      },
    ],
  },

  examiner: {
    title: "Examiner Workspace",
    sections: [
      {
        title: "Examinations",
        items: [
          D,
          { path: "/examinations",   label: "Exams & Results",   icon: ClipboardCheck },
          { path: "/students",       label: "Students",          icon: GraduationCap },
          { path: "/reports",        label: "Reports",           icon: BarChart3 },
        ],
      },
      {
        title: "Communication",
        items: [
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
        ],
      },
    ],
  },

  accountant: {
    title: "Finance",
    sections: [
      {
        title: "Finance",
        items: [
          D,
          { path: "/finance",        label: "Invoices & Payments", icon: Wallet },
          { path: "/payroll",        label: "Payroll",             icon: Briefcase },
          { path: "/reports",        label: "Reports",             icon: BarChart3 },
          { path: "/students",       label: "Students",            icon: GraduationCap },
        ],
      },
      {
        title: "Setup",
        items: [
          { path: "/setup",          label: "Fee Configuration",  icon: Settings },
        ],
      },
    ],
  },

  hrmanager: {
    title: "HR Management",
    sections: [
      {
        title: "HR",
        items: [
          D,
          { path: "/hr",             label: "Staff Management",  icon: BriefcaseBusiness },
          { path: "/payroll",        label: "Payroll",           icon: Briefcase },
          { path: "/workflow",       label: "Leave Approvals",   icon: Workflow },
          { path: "/reports",        label: "HR Reports",        icon: BarChart3 },
        ],
      },
      {
        title: "Communication",
        items: [
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
        ],
      },
    ],
  },

  librarian: {
    title: "Library",
    sections: [
      {
        title: "Library",
        items: [
          D,
          { path: "/library",        label: "Book Catalogue",    icon: Library },
          { path: "/students",       label: "Students",          icon: GraduationCap },
          { path: "/communication",  label: "Messages",          icon: MessageCircle },
        ],
      },
    ],
  },
};

// ─── ROLE RESOLUTION — matches all backend role strings ─────────────────────
function resolveMenuKey(roles: readonly string[]): string {
  const r = roles.map(x => x.toLowerCase().trim());

  if (r.some(x => x === "superadmin"))                                        return "superadmin";
  // Tenant/Owner BEFORE admin — "TenantAdmin" must not fall to admin
  if (r.some(x => ["tenant","schoolowner","tenantadmin","owner"].includes(x))) return "tenant";
  if (r.some(x => x === "principal"))                                          return "principal";
  if (r.some(x => x === "examiner"))                                           return "examiner";
  if (r.some(x => x === "accountant"))                                         return "accountant";
  if (r.some(x => ["hrmanager","hr"].includes(x)))                             return "hrmanager";
  if (r.some(x => x === "librarian"))                                          return "librarian";
  if (r.some(x => x === "driver"))                                             return "driver";
  if (r.some(x => x === "parent" || x === "guardian"))                         return "parent";
  if (r.some(x => x === "student"))                                            return "student";
  if (r.some(x => x === "teacher"))                                            return "teacher";
  if (r.some(x => ["admin","schooladmin","adminofficer","staff"].includes(x))) return "admin";
  return "admin";
}

export function navigationForRoles(roles: readonly string[]): NavigationSection[] {
  const key  = resolveMenuKey(roles);
  const menu = MENUS[key] ?? MENUS["admin"];
  return menu.sections;
}
