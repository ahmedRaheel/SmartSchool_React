import type { LucideIcon } from "lucide-react";
import {
  Activity, BarChart3, Bell, BookOpen, Bot, BriefcaseBusiness, Bus, CalendarCheck,
  ClipboardCheck, FileCheck2, GraduationCap, HeartPulse, LayoutDashboard, MessageCircle,
  Settings, ShieldCheck, SlidersHorizontal, UserCog, Users, Wallet, Workflow, Building2,
  ChartNoAxesCombined, Library, CalendarDays, Wrench
} from "lucide-react";

export interface NavigationItem { path:string; label:string; icon:LucideIcon; badge?:string; }
export interface NavigationSection { title:string; items:NavigationItem[]; }

const D:NavigationItem={path:"/",label:"Dashboard",icon:LayoutDashboard};
const menus:Record<string,NavigationItem[]>={
  superadmin:[D,{path:"/tenancy",label:"Tenants",icon:GraduationCap},{path:"/reports",label:"Analytics",icon:BarChart3},{path:"/audit",label:"Audit Logs",icon:ShieldCheck},{path:"/workflow",label:"Support",icon:Workflow},{path:"/ai",label:"AI Control",icon:Bot},{path:"/settings",label:"System Config",icon:Settings},{path:"/observability",label:"API Health",icon:HeartPulse}],
  tenant:[D,{path:"/setup",label:"School Setup",icon:Wrench},{path:"/organization",label:"Schools & Branches",icon:Building2},{path:"/setup/departments",label:"Departments",icon:Activity},{path:"/academics",label:"Academic Setup",icon:BookOpen},{path:"/setup/fee-types",label:"Fee Types",icon:Wallet},{path:"/hr",label:"Staff",icon:Users},{path:"/finance",label:"Finance",icon:Wallet},{path:"/reports",label:"Reports",icon:BarChart3},{path:"/ai",label:"AI Insights",icon:Bot}],
  principal:[D,{path:"/setup",label:"School Setup",icon:Wrench},{path:"/academics",label:"Academic",icon:BookOpen},{path:"/setup/departments",label:"Departments",icon:Building2},{path:"/reports",label:"Performance",icon:ChartNoAxesCombined},{path:"/academics",label:"Timetable",icon:CalendarDays},{path:"/examinations",label:"Exams",icon:ClipboardCheck},{path:"/ai",label:"AI Insights",icon:Bot}],
  admin:[D,{path:"/setup",label:"School Setup",icon:Wrench},{path:"/students",label:"Students",icon:GraduationCap},{path:"/admissions",label:"Admissions",icon:ClipboardCheck},{path:"/finance",label:"Fees & Finance",icon:Wallet},{path:"/academics",label:"Timetable",icon:CalendarDays},{path:"/attendance",label:"Attendance",icon:CalendarCheck},{path:"/transport",label:"Transport",icon:Bus},{path:"/library",label:"Library",icon:Library},{path:"/communication",label:"Communication",icon:MessageCircle,badge:"3"},{path:"/activities",label:"Events",icon:Activity},{path:"/hr",label:"HR",icon:BriefcaseBusiness}],
  teacher:[D,{path:"/academics",label:"My Classes",icon:Building2},{path:"/attendance",label:"Attendance",icon:CalendarCheck},{path:"/examinations",label:"Grade Book",icon:ClipboardCheck},{path:"/learning",label:"Assignments",icon:FileCheck2},{path:"/academics",label:"Timetable",icon:CalendarDays},{path:"/communication",label:"Messages",icon:MessageCircle,badge:"3"},{path:"/ai",label:"AI Assistant",icon:Bot}],
  student:[D,{path:"/academics",label:"My Courses",icon:BookOpen},{path:"/academics",label:"Timetable",icon:CalendarDays},{path:"/learning",label:"Assignments",icon:FileCheck2},{path:"/examinations",label:"My Grades",icon:ClipboardCheck},{path:"/attendance",label:"Attendance",icon:CalendarCheck},{path:"/finance",label:"Fee Status",icon:Wallet},{path:"/activities",label:"Events",icon:Activity},{path:"/ai",label:"AI Tutor",icon:Bot}],
  parent:[D,{path:"/students",label:"My Children",icon:Users},{path:"/reports",label:"Progress",icon:ChartNoAxesCombined},{path:"/attendance",label:"Attendance",icon:CalendarCheck},{path:"/finance",label:"Fees",icon:Wallet},{path:"/transport",label:"Transport",icon:Bus},{path:"/communication",label:"Messages",icon:MessageCircle,badge:"3"},{path:"/ai",label:"AI Report",icon:Bot}],
  driver:[D,{path:"/transport",label:"My Route",icon:Bus},{path:"/transport",label:"Assigned Students",icon:Users},{path:"/academics",label:"School Timings",icon:CalendarDays},{path:"/communication",label:"Messages",icon:MessageCircle},{path:"/notifications",label:"Notifications",icon:Bell}],
};

export function navigationForRoles(roles:readonly string[]):NavigationSection[]{
  const r=roles.map(x=>x.toLowerCase());
  const key=r.includes("superadmin")?"superadmin":r.includes("principal")?"principal":r.some(x=>["schooladmin","tenantadmin"].includes(x))?"tenant":r.some(x=>["admin","adminoffice","officeadmin"].includes(x))?"admin":r.includes("teacher")?"teacher":r.includes("student")?"student":r.some(x=>["parent","guardian"].includes(x))?"parent":r.includes("driver")?"driver":"tenant";
  return [{title:key==="superadmin"?"Platform":key==="tenant"?"School Management":key==="principal"?"Principal Workspace":key==="admin"?"School Operations":key==="teacher"?"Teacher Workspace":key==="student"?"Student Workspace":key==="parent"?"Parent Workspace":"Transport Workspace",items:menus[key]}];
}
