import { useAuth } from "../../auth/auth";
import { useAdminDashboard, useStudentDashboard, useTeacherDashboard, useParentDashboard, useDriverDashboard, useEarlyWarning } from "../../../core/api/queries";
import { StatCard } from "../../../components/ui/StatCard";
import { PageHeader } from "../../../components/ui/PageHeader";
import { BookOpen, Bus, Calendar, CreditCard, GraduationCap, TrendingDown, TrendingUp, Users, Wallet, Zap } from "lucide-react";

function fmt(n?: number, prefix="") { return n !== undefined ? `${prefix}${n.toLocaleString()}` : "…"; }
function pct(a?: number, b?: number) { if (!a || !b) return "0%"; return `${Math.round((a/b)*100)}%`; }

// ─── Actor dashboards ────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: d, isLoading } = useAdminDashboard();
  const l = isLoading || !d;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="School management overview"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Students"         value={fmt(d?.Students)}                    note={`${fmt(d?.ActiveStudents)} active`}   color="#2563EB" bg="#EFF6FF"><GraduationCap size={20}/></StatCard>
        <StatCard label="Staff"            value={fmt(d?.Employees)}                   note=""                                     color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="Collected"        value={l?"…":`PKR ${((d!.CollectedAmount)/1000).toFixed(0)}K`} note={`${pct(d?.CollectedAmount, (d?.CollectedAmount??0)+(d?.OutstandingAmount??0))} collected`} color="#10B981" bg="#ECFDF5"><Wallet size={20}/></StatCard>
        <StatCard label="Outstanding"      value={l?"…":`PKR ${((d!.OutstandingAmount)/1000).toFixed(0)}K`} note=""              color="#D97706" bg="#FFFBEB"><CreditCard size={20}/></StatCard>
        <StatCard label="Exams"            value={fmt(d?.Exams)}                       note=""                                     color="#8B5CF6" bg="#F5F3FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Passed results"   value={fmt(d?.PassedResults)}               note={`${fmt(d?.FailedResults)} failed`}   color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Vehicles"         value={fmt(d?.Vehicles)}                    note={`${fmt(d?.Drivers)} drivers`}        color="#6366F1" bg="#EEF2FF"><Bus size={20}/></StatCard>
        <StatCard label="Notifications"    value={fmt(d?.UnreadNotifications)}         note="Unread"                              color="#EF4444" bg="#FFF0F1"><Zap size={20}/></StatCard>
      </section>

      <div className="grid-2">
        <div className="surface">
          <div className="surface-head"><h3>Quick actions</h3></div>
          <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {[
              ["Enrol new student",    "/students"],
              ["Add staff member",    "/hr"],
              ["Record fee payment",  "/finance"],
              ["Process admissions",  "/admissions"],
              ["View AI insights",    "/ai"],
              ["School configuration","/setup"],
            ].map(([label, path]) => (
              <a key={path} href={path}
                style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", borderRadius:8, border:"1px solid var(--line)", fontSize:12, fontWeight:500, color:"var(--text)", textDecoration:"none" }}
                onMouseEnter={e=>(e.currentTarget.style.background="var(--surface-2)")}
                onMouseLeave={e=>(e.currentTarget.style.background="")}>
                {label} <span style={{ color:"var(--muted)" }}>→</span>
              </a>
            ))}
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Financial summary</h3></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { label:"Total invoices",      value:fmt(d?.Invoices) },
              { label:"Outstanding invoices",value:fmt(d?.OutstandingInvoices) },
              { label:"Collected (PKR)",     value:l?"…":`${((d!.CollectedAmount)/1000).toFixed(1)}K` },
              { label:"Outstanding (PKR)",   value:l?"…":`${((d!.OutstandingAmount)/1000).toFixed(1)}K` },
              { label:"Guardians on file",   value:fmt(d?.Guardians) },
            ].map(r => (
              <div key={r.label} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                <span style={{ color:"var(--muted)" }}>{r.label}</span>
                <b>{r.value}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const { data: d, isLoading } = useStudentDashboard();
  const { data: warnings } = useEarlyWarning(user?.studentId ?? "");
  const highRisk = warnings?.filter((w:any) => w.riskLevel === "High").length ?? 0;
  return (
    <>
      <PageHeader title={isLoading ? "My Dashboard" : `Welcome, ${d?.FirstName ?? "Student"}`} subtitle={`Student No: ${d?.StudentNumber ?? "—"} · Status: ${d?.Status ?? "—"}`}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Enrollments"      value={String(d?.Enrollments ?? 0)}         note="This academic year" color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Exam results"     value={String(d?.Results ?? 0)}             note="Submitted"         color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Outstanding fees" value={String(d?.OutstandingInvoices ?? 0)} note="Unpaid invoices"   color="#D97706" bg="#FFFBEB"><Wallet size={20}/></StatCard>
        <StatCard label="AI risk alerts"   value={highRisk > 0 ? String(highRisk) : "Clear"} note={highRisk>0?"Action needed":"On track"} color={highRisk>0?"#EF4444":"#10B981"} bg={highRisk>0?"#FFF0F1":"#ECFDF5"}><Zap size={20}/></StatCard>
      </section>
      {highRisk > 0 && warnings?.filter((w:any)=>w.riskLevel==="High").map((w:any,i:number) => (
        <div key={i} style={{ display:"flex", gap:12, padding:"12px 16px", background:"var(--danger-bg)", border:"1px solid #fecdd3", borderRadius:10, marginBottom:10, fontSize:12 }}>
          <span style={{ fontSize:20 }}>🚨</span>
          <div><b style={{ display:"block" }}>{w.outcome}</b><span style={{ color:"var(--muted)" }}>Factors: {Array.isArray(w.factors)?w.factors.join(", "):"See AI panel"}</span></div>
        </div>
      ))}
      <div className="surface">
        <div className="surface-head"><h3>Quick links</h3></div>
        <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
          {[["My Portal","/my-portal"],["My Grades","/examinations"],["Fee Status","/finance"],["Library","/library"],["AI Tutor","/ai"]].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}
              onMouseEnter={e=>(e.currentTarget.style.background="var(--surface-2)")}
              onMouseLeave={e=>(e.currentTarget.style.background="")}>{l}</a>
          ))}
        </div>
      </div>
    </>
  );
}

function TeacherDashboard() {
  const { data: d } = useTeacherDashboard();
  return (
    <>
      <PageHeader title={`Welcome, ${d?.FirstName ?? "Teacher"}`} subtitle={`Employee: ${d?.EmployeeNumber ?? "—"} · Status: ${d?.Status ?? "—"}`}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Course assignments" value={String(d?.CourseAssignments ?? 0)} note="Current term" color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Pending leaves"     value={String(d?.PendingLeaves ?? 0)}     note=""           color="#D97706" bg="#FFFBEB"><Calendar size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Quick links</h3></div>
        <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
          {[["My Workspace","/teacher-workspace"],["Attendance","/attendance"],["Grade Book","/examinations"],["Assignments","/learning"],["AI Assistant","/ai"]].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}>{l}</a>
          ))}
        </div>
      </div>
    </>
  );
}

function ParentDashboard() {
  const { data: d } = useParentDashboard();
  return (
    <>
      <PageHeader title={`Welcome, ${d?.FullName ?? "Parent"}`} subtitle="Parent portal"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Children" value={String(d?.Children ?? 0)} note="Enrolled" color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="Outstanding fees" value={String(d?.OutstandingInvoices ?? 0)} note="Unpaid" color="#D97706" bg="#FFFBEB"><Wallet size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Quick links</h3></div>
        <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
          {[["My Children","/parent-portal"],["Fees","/finance"],["Transport","/transport"],["Messages","/communication"],["Parent AI","/ai"]].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}>{l}</a>
          ))}
        </div>
      </div>
    </>
  );
}

function DriverDashboard() {
  const { data: d } = useDriverDashboard();
  return (
    <>
      <PageHeader title={d?.FullName ?? "Driver Dashboard"} subtitle={`Driver No: ${d?.DriverNumber ?? "—"} · Status: ${d?.Status ?? "—"}`}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Active routes" value={String(d?.ActiveVehicleAssignments ?? 0)} note="" color="#2563EB" bg="#EFF6FF"><Bus size={20}/></StatCard>
        <StatCard label="License expires" value={d?.LicenseExpiresOn ?? "—"} note="" color="#D97706" bg="#FFFBEB"><Calendar size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Quick links</h3></div>
        <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
          {[["My Route","/driver-portal"],["Transport","/transport"],["Students","/students"],["Messages","/communication"]].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}>{l}</a>
          ))}
        </div>
      </div>
    </>
  );
}

function SuperAdminDashboard() {
  return (
    <>
      <PageHeader title="Platform Dashboard" subtitle="SaaS operations — all tenants"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Platform MRR"  value="$52.4K"    note="↑ 14% YoY"       color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Schools"       value="4"         note="Active tenants"   color="#2563EB" bg="#EFF6FF"><GraduationCap size={20}/></StatCard>
        <StatCard label="Total students" value="8,250"    note="Platform-wide"    color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="AI requests"   value="24,891"    note="Last 30 days"     color="#8B5CF6" bg="#F5F3FF"><Zap size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Platform links</h3></div>
        <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
          {[["Tenants","/tenancy"],["Subscriptions","/subscriptions"],["Platform AI","/ai-platform"],["Audit Logs","/audit"],["AI Logs","/platform"]].map(([l,p]) => (
            <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}>{l}</a>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Router by role ──────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";

  if (role.includes("superadmin")) return <SuperAdminDashboard/>;
  if (role.includes("student"))    return <StudentDashboard/>;
  if (role.includes("teacher"))    return <TeacherDashboard/>;
  if (role.includes("parent") || role.includes("guardian")) return <ParentDashboard/>;
  if (role.includes("driver"))     return <DriverDashboard/>;
  return <AdminDashboard/>;
}
