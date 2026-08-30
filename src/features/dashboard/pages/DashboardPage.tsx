import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Bot, Building2, Bus, CheckCircle2,
  GraduationCap, HeartPulse, Route, Server, Sparkles, TrendingUp,
  UserCheck, Users, Wallet,
} from "lucide-react";
import { PageHeader }     from "../../../components/ui/PageHeader";
import { StatCard }       from "../../../components/ui/StatCard";
import { useAuth }        from "../../auth/auth";
import {
  useAdminDashboard, useStudentDashboard, useTeacherDashboard,
  useParentDashboard, useDriverDashboard, useEarlyWarning,
} from "../../../core/api/queries";

function roleKey(roles: string[]): string {
  const r = roles.map(x => x.toLowerCase());
  if (r.includes("superadmin"))                               return "super";
  if (r.includes("principal"))                                return "principal";
  if (r.some(x => ["schooladmin","tenantadmin"].includes(x))) return "tenant";
  if (r.some(x => ["admin","adminoffice","officeadmin"].includes(x))) return "office";
  if (r.includes("teacher"))   return "teacher";
  if (r.includes("student"))   return "student";
  if (r.some(x => ["parent","guardian"].includes(x)))         return "parent";
  if (r.includes("driver"))    return "driver";
  return "tenant";
}

// ─── Shared components ────────────────────────────────────────────────────────
function MetricGrid({ items }: {
  items: { label: string; value: string; note?: string; icon: React.ElementType; color?: string; bg?: string }[]
}) {
  return (
    <section className="metric-grid" style={{ marginBottom: 20 }}>
      {items.map(({ label, value, note, icon: Icon, color = "#2563EB", bg = "#EFF6FF" }) => (
        <StatCard key={label} label={label} value={value} note={note} color={color} bg={bg}>
          <Icon size={20} />
        </StatCard>
      ))}
    </section>
  );
}

function AiInsight({ title = "AI Intelligence", body }: { title?: string; body: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="surface ai-brief">
      <div className="ai-orb"><Sparkles size={20} /></div>
      <div>
        <span className="eyebrow">SmartSchool Intelligence</span>
        <h3 style={{ margin: "4px 0 6px" }}>{title}</h3>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.65 }}>{body}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="soft-button" style={{ fontSize: 11 }} onClick={() => nav("/ai")}>
            Review analysis
          </button>
          <button className="text-button" onClick={() => nav("/ai")}>
            Ask AI <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="surface" style={{ padding: 40, textAlign: "center", color: "var(--text-secondary)" }}>
      Loading dashboard…
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="surface" style={{ padding: 24, color: "var(--text-danger)", fontSize: 13 }}>
      {message}
    </div>
  );
}

// ─── Super Admin ──────────────────────────────────────────────────────────────
function SuperDashboard() {
  const nav = useNavigate();
  return (
    <>
      <MetricGrid items={[
        { label: "Platform Tenants",  value: "52",     note: "↑ 8 this quarter",   icon: Building2,  color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Platform Users",    value: "94,821", note: "↑ 12% growth",       icon: Users,      color: "#2563EB", bg: "#EFF6FF" },
        { label: "API Availability",  value: "99.98%", note: "All services healthy",icon: HeartPulse, color: "#10B981", bg: "#ECFDF5" },
        { label: "Avg API Response",  value: "128 ms", note: "↓ 14ms improvement", icon: Server,     color: "#D97706", bg: "#FFFBEB" },
      ]} />
      <AiInsight
        title="Platform intelligence"
        body={
          <>3 tenants approaching storage limits (&gt;85%). Revenue grew 14.2% YoY.
          City Grammar on trial — strong conversion signal: 890 students, 4.2% fee default rate.</>
        }
      />
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="surface">
          <div className="surface-head"><h3>Infrastructure health</h3><p>Live platform components</p></div>
          <div className="health-stack">
            {["API Gateway", "PostgreSQL", "Redis Cache", "Kafka", "AI / Ollama", "SignalR Hub"].map(svc => (
              <div key={svc}>
                <span><i />{svc}</span><b style={{ color: "var(--text-success)" }}>Healthy</b>
              </div>
            ))}
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Pending actions</h3><p>Require your attention</p></div>
          <div className="approval-grid">
            {[["3","Tenants nearing storage"],["5","Pending support tickets"],["2","Failed Kafka topics"],["1","Expired subscriptions"]].map(([n,l]) => (
              <button key={l} onClick={() => nav("/tenancy")}><b>{n}</b><span>{l}</span></button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Tenant / Principal ───────────────────────────────────────────────────────
function TenantDashboard() {
  const { data, isLoading, error } = useAdminDashboard();
  const nav = useNavigate();
  if (isLoading) return <LoadingCard />;
  if (error) return <ErrorCard message="Could not load dashboard data." />;
  const d = data!;
  return (
    <>
      <MetricGrid items={[
        { label: "Total Students",   value: d.Students.toLocaleString(),    note: "Enrolled",        icon: GraduationCap, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Staff",            value: d.Employees.toLocaleString(),   note: "Active employees",icon: Users,         color: "#0F2241", bg: "#EEF2FF" },
        { label: "Outstanding Fees", value: `${d.OutstandingInvoices}`,     note: "Unpaid invoices", icon: Wallet,        color: d.OutstandingInvoices > 0 ? "#EF4444" : "#10B981", bg: d.OutstandingInvoices > 0 ? "#FFF0F1" : "#ECFDF5" },
        { label: "Unread Alerts",    value: d.UnreadNotifications.toLocaleString(), note: "",        icon: CheckCircle2,  color: "#D97706", bg: "#FFFBEB" },
      ]} />
      <AiInsight
        title="School intelligence"
        body="14 students have high predicted dropout probability. History department average dropped 7% in Grade 9. Fee default risk highest in Grade 6 cohort."
      />
      <div className="grid-2" style={{ marginTop: 14 }}>
        <div className="surface">
          <div className="surface-head"><h3>Fleet at a glance</h3></div>
          <div className="mini-stat-row">
            <div><b>{d.Vehicles}</b><span>Vehicles</span></div>
            <div><b>{d.Drivers}</b><span>Drivers</span></div>
            <div><b>{d.Exams}</b><span>Exams</span></div>
            <div><b>{d.Guardians}</b><span>Guardians</span></div>
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Quick actions</h3></div>
          <div className="approval-grid">
            {[["Students","/students"],["Admissions","/admissions"],["Finance","/finance"],["AI Insights","/ai"]].map(([l,p]) => (
              <button key={l} onClick={() => nav(p)}><span>{l}</span></button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Teacher ─────────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error } = useTeacherDashboard();
  const nav = useNavigate();
  if (isLoading) return <LoadingCard />;
  if (error || !data) return (
    <>
      <MetricGrid items={[
        { label: "My Classes",        value: "4",  note: "Assigned sections",    icon: Building2,   color: "#0F2241", bg: "#EEF2FF" },
        { label: "Course Assignments",value: "—",  note: "Loading…",             icon: CheckCircle2,color: "#2563EB", bg: "#EFF6FF" },
        { label: "Pending Leaves",    value: "—",  note: "",                     icon: AlertTriangle,color:"#D97706", bg: "#FFFBEB" },
        { label: "Students",          value: "186",note: "Across all classes",   icon: Users,       color: "#10B981", bg: "#ECFDF5" },
      ]} />
      <AiInsight title="Student risk alerts" body="3 students in 9-B show declining scores 3 months running. Early intervention recommended." />
    </>
  );
  return (
    <>
      <MetricGrid items={[
        { label: "Course Assignments", value: String(data.CourseAssignments), note: "This term", icon: Building2, color: "#0F2241", bg: "#EEF2FF" },
        { label: "Pending Leaves",     value: String(data.PendingLeaves),     note: "",           icon: AlertTriangle, color: "#D97706", bg: "#FFFBEB" },
        { label: "Employee No.",       value: data.EmployeeNumber,            note: data.Status,  icon: Users,    color: "#2563EB", bg: "#EFF6FF" },
        { label: "AI Assistant",       value: "Ready",                        note: "Ask anything",icon: Bot,     color: "#8B5CF6", bg: "#F5F3FF" },
      ]} />
      <AiInsight title="Teacher AI insights" body="3 students in your classes show declining attendance and grade trends. Early intervention recommended. Class 10-A is your top performer this semester." />
      <div className="surface" style={{ marginTop: 14, padding: "0 0 4px" }}>
        <div className="surface-head"><h3>Quick navigation</h3></div>
        <div className="approval-grid" style={{ padding: "0 16px 16px" }}>
          {[["My Classes","/academics"],["Attendance","/attendance"],["Grade Book","/examinations"],["AI Assistant","/ai"]].map(([l,p]) => (
            <button key={l} onClick={() => nav(p)}><span>{l}</span></button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Student ─────────────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useStudentDashboard();
  const { data: warnings } = useEarlyWarning(user?.studentId ?? "");
  const nav = useNavigate();
  const warningCount = warnings?.filter(w => w.riskLevel === "High").length ?? 0;
  return (
    <>
      <MetricGrid items={[
        { label: "Enrollments",       value: isLoading ? "…" : String(data?.Enrollments ?? 0),       note: "Active courses",icon: CheckCircle2,color: "#10B981", bg: "#ECFDF5" },
        { label: "Exam Results",      value: isLoading ? "…" : String(data?.Results ?? 0),           note: "Published",     icon: TrendingUp,  color: "#2563EB", bg: "#EFF6FF" },
        { label: "Outstanding Fees",  value: isLoading ? "…" : String(data?.OutstandingInvoices ?? 0),note: "Unpaid invoices",icon: Wallet,     color: (data?.OutstandingInvoices ?? 0) > 0 ? "#EF4444" : "#10B981", bg: (data?.OutstandingInvoices ?? 0) > 0 ? "#FFF0F1" : "#ECFDF5" },
        { label: "Risk Alerts",       value: String(warningCount),                                   note: warningCount > 0 ? "Action needed" : "All clear",icon: AlertTriangle, color: warningCount > 0 ? "#EF4444" : "#10B981", bg: warningCount > 0 ? "#FFF0F1" : "#ECFDF5" },
      ]} />
      <AiInsight
        title="AI Tutor prediction"
        body={warnings && warnings.length > 0
          ? `You have ${warnings.length} area${warnings.length > 1 ? "s" : ""} flagged for attention. Click to review your personalised study recommendations.`
          : "You are on track. Completing pending assignments is your highest-impact next step. CS performance is top 5% of class! 🎉"
        }
      />
      <div className="surface" style={{ marginTop: 14 }}>
        <div className="surface-head"><h3>Go to</h3></div>
        <div className="approval-grid" style={{ padding: "0 16px 16px" }}>
          {[["My Courses","/academics"],["Assignments","/learning"],["My Grades","/examinations"],["AI Tutor","/ai"]].map(([l,p]) => (
            <button key={l} onClick={() => nav(p)}><span>{l}</span></button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Parent ───────────────────────────────────────────────────────────────────
function ParentDashboard() {
  const { data, isLoading } = useParentDashboard();
  const nav = useNavigate();
  return (
    <>
      <div className="child-switcher">
        <span>Viewing child</span>
        <select><option>Ahmed Hassan · Grade 9-A</option><option>Hina Hassan · Grade 7-B</option></select>
      </div>
      <MetricGrid items={[
        { label: "Children",         value: isLoading ? "…" : String(data?.Children ?? 0),           note: "Enrolled",     icon: Users,      color: "#2563EB", bg: "#EFF6FF" },
        { label: "Outstanding Fees", value: isLoading ? "…" : String(data?.OutstandingInvoices ?? 0),note: "Unpaid",       icon: Wallet,     color: (data?.OutstandingInvoices ?? 0) > 0 ? "#EF4444" : "#10B981", bg: (data?.OutstandingInvoices ?? 0) > 0 ? "#FFF0F1" : "#ECFDF5" },
        { label: "Messages",         value: "3",                                                      note: "Unread",       icon: CheckCircle2, color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Parent AI",        value: "Ready",                                                  note: "Ask anything", icon: Bot,        color: "#0F2241", bg: "#EEF2FF" },
      ]} />
      <AiInsight
        title="Parent AI insight"
        body="Ahmed is a top CS and English performer — consider STEM enrichment this summer. Hina has perfect attendance and is in the top 5% of her class!"
      />
    </>
  );
}

// ─── Driver ───────────────────────────────────────────────────────────────────
function DriverDashboard() {
  const { data, isLoading } = useDriverDashboard();
  if (isLoading) return <LoadingCard />;
  return (
    <>
      <MetricGrid items={[
        { label: "Active Assignments", value: String(data?.ActiveVehicleAssignments ?? 0), note: "Vehicle–driver pairs", icon: Bus,   color: "#2563EB", bg: "#EFF6FF" },
        { label: "Driver No.",         value: data?.DriverNumber ?? "—",                   note: data?.Status,          icon: Route, color: "#10B981", bg: "#ECFDF5" },
        { label: "License Expires",    value: data?.LicenseExpiresOn ? new Date(data.LicenseExpiresOn).toLocaleDateString() : "—", note: "", icon: CheckCircle2, color: "#D97706", bg: "#FFFBEB" },
        { label: "Transport AI",       value: "Active",                                    note: "Route optimisation",  icon: Bot,   color: "#8B5CF6", bg: "#F5F3FF" },
      ]} />
      <AiInsight title="Route optimisation" body="AI suggests departing 8 minutes earlier today — heavy traffic expected on Northern Bypass at 07:40. Alternative via Ring Road saves 11 minutes." />
    </>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const role = roleKey(user?.roles ?? [user?.role ?? ""]);

  const titles: Record<string, [string, string]> = {
    super:     ["Platform Overview",       "Monitor tenants, API health and operational metrics"],
    tenant:    ["School Command Centre",   "Academic, operational and financial overview"],
    principal: ["Principal Dashboard",     "Academic performance, departments and staff"],
    office:    ["School Operations",       "Today's timetable, tasks and operational workload"],
    teacher:   [`Good day, ${user?.name?.split(" ")[0] ?? "Teacher"} 👋`, "Your classes, students and AI assistant"],
    student:   [`Hi, ${user?.name?.split(" ")[0] ?? "Student"} 👋`, "Your progress, assignments and AI tutor"],
    parent:    ["Family Dashboard",        "Your children's progress and school updates"],
    driver:    ["Transport Dashboard",     "Your route, students and school timings"],
  };

  const [title, subtitle] = titles[role] ?? ["Dashboard", ""];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="page-actions">
            {role === "super"   && <button className="primary" onClick={() => nav("/tenancy")}><Building2 size={15}/> Add Tenant</button>}
            {role === "tenant"  && <button className="primary" onClick={() => nav("/students")}><Users size={15}/> Manage Students</button>}
            {role === "teacher" && <button className="primary" onClick={() => nav("/ai")}><Bot size={15}/> Ask AI</button>}
            {role === "student" && <button className="primary" onClick={() => nav("/ai")}><Bot size={15}/> AI Tutor</button>}
          </div>
        }
      />
      {role === "super"   && <SuperDashboard />}
      {(role === "tenant" || role === "principal" || role === "office") && <TenantDashboard />}
      {role === "teacher" && <TeacherDashboard />}
      {role === "student" && <StudentDashboard />}
      {role === "parent"  && <ParentDashboard />}
      {role === "driver"  && <DriverDashboard />}
    </>
  );
}
