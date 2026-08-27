import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Bus,
  CalendarCheck,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  ListTree,
  MessageCircle,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

export const ALL_ROLES = ["*"] as const;

export interface NavigationSection {
  title: string;
  roles: readonly string[];
  items: readonly NavigationItem[];
}

export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles: readonly string[];
  badge?: string;
}

const platformRoles = ["SuperAdmin"] as const;
const administrationRoles = ["SuperAdmin", "SchoolAdmin", "TenantAdmin", "Admin", "AdminOffice", "Principal"] as const;
const academicRoles = [...administrationRoles, "Teacher", "Student", "Parent"] as const;

export const navigationSections: readonly NavigationSection[] = [
  {
    title: "Platform",
    roles: ALL_ROLES,
    items: [
      { path: "/", label: "Dashboard", icon: LayoutDashboard, roles: ALL_ROLES },
      { path: "/tenancy", label: "Tenants", icon: GraduationCap, roles: platformRoles },
      { path: "/platform", label: "Tenant users", icon: Users, roles: platformRoles },
      { path: "/profiles", label: "Users & impersonation", icon: UserCog, roles: administrationRoles },
      { path: "/platform/features", label: "Plans & features", icon: SlidersHorizontal, roles: platformRoles },
      { path: "/audit", label: "Audit & impersonation log", icon: ShieldCheck, roles: platformRoles },
      { path: "/observability", label: "API health & error logs", icon: HeartPulse, roles: platformRoles },
    ],
  },
  {
    title: "School management",
    roles: administrationRoles,
    items: [
      { path: "/organization", label: "Schools & branches", icon: GraduationCap, roles: administrationRoles },
      { path: "/students", label: "Students", icon: Users, roles: [...administrationRoles, "Teacher"] },
      { path: "/admissions", label: "Admissions & enquiries", icon: ClipboardCheck, roles: administrationRoles },
      { path: "/admission-criteria", label: "Admission criteria", icon: ClipboardCheck, roles: administrationRoles },
      { path: "/teachers", label: "Teachers & workload", icon: Users, roles: administrationRoles },
      { path: "/academics", label: "Academics", icon: BookOpen, roles: academicRoles },
      { path: "/workflow", label: "Workflow center", icon: Workflow, roles: academicRoles },
    ],
  },
  {
    title: "Academic operations",
    roles: ALL_ROLES,
    items: [
      { path: "/attendance", label: "Attendance & leave", icon: CalendarCheck, roles: academicRoles },
      { path: "/examinations", label: "Tests, exams & results", icon: ClipboardCheck, roles: [...academicRoles, "Examiner"] },
      { path: "/learning", label: "Assignments & learning", icon: FileCheck2, roles: academicRoles },
      { path: "/finance", label: "Fees & finance", icon: Wallet, roles: [...administrationRoles, "Accountant", "Parent", "Student"] },
      { path: "/hr", label: "HR & leave", icon: BriefcaseBusiness, roles: [...administrationRoles, "HRManager", "Staff", "Teacher"] },
      { path: "/payroll", label: "Payroll & increments", icon: Wallet, roles: [...administrationRoles, "HRManager", "Accountant"] },
      { path: "/transport", label: "Transport", icon: Bus, roles: [...administrationRoles, "TransportManager", "Driver", "Parent"] },
      { path: "/library", label: "Library", icon: BookOpen, roles: [...academicRoles, "Librarian"] },
      { path: "/documents", label: "Documents & certificates", icon: FileCheck2, roles: academicRoles },
      { path: "/activities", label: "Activities & awards", icon: Activity, roles: academicRoles },
      { path: "/inventory", label: "Inventory & purchasing", icon: BriefcaseBusiness, roles: [...administrationRoles, "Accountant"] },
    ],
  },
  {
    title: "Communication & AI",
    roles: ALL_ROLES,
    items: [
      { path: "/communication", label: "Chat", icon: MessageCircle, roles: ALL_ROLES, badge: "3" },
      { path: "/notifications", label: "Notifications", icon: Bell, roles: ALL_ROLES, badge: "2" },
      { path: "/ai", label: "AI assistant & predictions", icon: Bot, roles: ALL_ROLES },
      { path: "/reports", label: "Reports & analytics", icon: BarChart3, roles: [...administrationRoles, "Examiner"] },
      { path: "/reference", label: "Lookups", icon: ListTree, roles: administrationRoles },
      { path: "/settings", label: "Settings", icon: Settings, roles: administrationRoles },
    ],
  },
];

export function hasAnyRole(requiredRoles: readonly string[], userRoles: readonly string[]): boolean {
  return requiredRoles.includes("*") || requiredRoles.some((role) => userRoles.includes(role));
}
