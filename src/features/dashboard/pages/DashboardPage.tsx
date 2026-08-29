import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, BookOpen, Bot, Building2, Bus,
  CalendarDays, CheckCircle2, Clock3, GraduationCap, HeartPulse, IndianRupee,
  Route, Server, Sparkles, TrendingUp, UserCheck, Users, Wallet,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { http }       from "../../../core/api/httpClient";
import { useAuth }    from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

/* ─── helpers ─────────────────────────────────────────────── */
const money = (v: number) => `PKR ${(v / 1_000_000).toFixed(1)}M`;

function roleKey(roles: string[]): string {
  const r = roles.map(x => x.toLowerCase());
  if (r.includes("superadmin"))                              return "super";
  if (r.includes("principal"))                               return "principal";
  if (r.some(x => ["schooladmin","tenantadmin"].includes(x))) return "tenant";
  if (r.some(x => ["admin","adminoffice","officeadmin"].includes(x))) return "office";
  if (r.includes("teacher"))  return "teacher";
  if (r.includes("student"))  return "student";
  if (r.some(x => ["parent","guardian"].includes(x))) return "parent";
  if (r.includes("driver"))   return "driver";
  return "tenant";
}

const fallback: Record<string, number | string> = {
  students: 2840, teachers: 128, attendance: 88.4,
  income: 8_400_000, tenants: 52, users: 94821, apiMs: 128, availability: 99.98,
};

/* ─── shared sub-components ───────────────────────────────── */
function MetricGrid({ items }: { items: { label: string; value: string; note?: string; icon: React.ElementType; color?: string; bg?: string }[] }) {
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

function AiInsight({ title = "AI Insights", body }: { title?: string; body: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="ai-brief surface">
      <div className="ai-orb"><Sparkles size={20} /></div>
      <div>
        <span className="eyebrow">SmartSchool Intelligence</span>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="ai-actions">
          <button className="soft-button" onClick={() => nav("/ai")}>Review analysis</button>
          <button className="text-button">Ask AI <ArrowRight size={13} /></button>
        </div>
      </div>
    </div>
  );
}

function TopStudentsTable({ teacherMode = false }: { teacherMode?: boolean }) {
  const data = teacherMode
    ? [["Ahmed Raza","9-A","72%","C","D ↓"],["Sara Khan","9-A","81%","B","C ↓"],["Zoya Ali","10-B","79%","C+","C ↓"]]
    : [["Ahmed Hassan","10-A","96%","A","A+ ↑"],["Sara Khan","9-B","94%","A","A+ ↑"],["Ali Raza","8-A","91%","A","A ↑"]];

  return (
    <section className="surface dashboard-card">
      <div className="surface-head">
        <div>
          <h3>{teacherMode ? "Students requiring attention" : "Top performing students"}</h3>
          <p>{teacherMode ? "AI-ranked by intervention priority" : "Academic leaders this term"}</p>
        </div>
        <button className="text-button">View all <ArrowRight size={13} /></button>
      </div>
      <div className="table-wrap">
        <table className="premium-table">
          <thead><tr><th>Student</th><th>Class</th><th>Attendance</th><th>Current</th><th>Predicted</th></tr></thead>
          <tbody>
            {data.map(([name, cls, att, cur, pred], i) => (
              <tr key={i}>
                <td><b>{name}</b></td>
                <td>{cls}</td><td>{att}</td><td>{cur}</td>
                <td>
                  <span className={`status-pill ${pred.includes("↓") ? "danger" : "success"}`}>{pred}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ─── role dashboards ─────────────────────────────────────── */
function SuperDashboard({ d }: { d: any }) {
  return (
    <>
      <MetricGrid items={[
        { label: "Tenants",        value: String(d.tenants ?? 52),    note: "↑ 8 this quarter",    icon: Building2,  color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Platform Users", value: Number(d.users ?? 94821).toLocaleString(), note: "↑ 12% growth", icon: Users, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Availability",   value: `${d.availability ?? 99.98}%`, note: "All services healthy", icon: HeartPulse, color: "#10B981", bg: "#ECFDF5" },
        { label: "Avg API",        value: `${d.apiMs ?? 128} ms`,     note: "↓ 14ms improvement",  icon: Server,     color: "#D97706", bg: "#FFFBEB" },
      ]} />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Platform performance</h3><p>Requests, latency and reliability</p></div><BarChart3 size={18} /></div>
          <div className="performance-chart">
            {[42,58,51,72,64,82,76].map((h,i) => <i key={i} style={{ height: `${h}%` }} />)}
          </div>
          <div className="chart-legend"><span>2.8M API requests</span><b>P95 310ms · Error 0.18%</b></div>
        </section>
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Platform health</h3><p>Live infrastructure</p></div><CheckCircle2 size={18} /></div>
          <div className="health-stack">
            {["API Gateway","PostgreSQL","Redis Cache","Kafka","AI / Claude"].map(x => (
              <div key={x}><span><i />{x}</span><b>Healthy</b></div>
            ))}
          </div>
        </section>
      </div>
      <section className="surface dashboard-card">
        <div className="surface-head"><div><h3>Errors & operations</h3><p>Last 24 hours</p></div></div>
        <div className="mini-stat-row">
          <div><b>3</b><span>Critical errors</span></div>
          <div><b>18</b><span>Exceptions</span></div>
          <div><b>47</b><span>Warnings</span></div>
          <div><b>0.18%</b><span>API error rate</span></div>
        </div>
      </section>
    </>
  );
}

function TenantDashboard({ d }: { d: any }) {
  return (
    <>
      <MetricGrid items={[
        { label: "Total Students",     value: Number(d.students ?? 2840).toLocaleString(), note: "↑ 4.2% enrollment",    icon: GraduationCap, color: "#2563EB", bg: "#EFF6FF" },
        { label: "Teaching Staff",     value: String(d.teachers ?? 128),                  note: "↑ 2.1% this year",     icon: Users,         color: "#0F2241", bg: "#EEF2FF" },
        { label: "Fee Collection",     value: `${d.feeRate ?? 91}%`,                      note: "↑ 4% vs last month",  icon: Wallet,        color: "#10B981", bg: "#ECFDF5" },
        { label: "Attendance Today",   value: `${d.attendance ?? 88.4}%`,                 note: "↑ 1.8% vs last week", icon: UserCheck,     color: "#D97706", bg: "#FFFBEB" },
      ]} />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Academic performance</h3><p>School-wide outcome distribution</p></div></div>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 20, alignItems: "center", padding: "12px 22px 20px" }}>
            <div className="ratio-ring"><b>82%</b><span>Pass rate</span></div>
            <div className="ratio-copy">
              {[["Pass ratio","82%","success-text"],["Fail ratio","18%","danger-text"],["Average grade","B+",""],["Improvement","+6%","success-text"]].map(([l,v,cls]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 9, borderBottom: "1px solid var(--line)", fontSize: 11 }}>
                  <span>{l}</span><b className={cls}>{v}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
        <AiInsight body={<><b>14 students</b> have high predicted probability of failing Mathematics. Attendance, missing assignments and declining quiz scores are the strongest indicators.</>} />
      </div>
      <TopStudentsTable />
      <div className="dashboard-two" style={{ marginTop: 14 }}>
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Finance</h3><p>Current fee collection</p></div><IndianRupee size={18} /></div>
          <div style={{ padding: "4px 20px", fontSize: 27, fontWeight: 800 }}>{money(d.income ?? 8_400_000)} <small style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>collected</small></div>
          <div className="prog-track" style={{ margin: "8px 20px" }}><div className="prog-fill" style={{ width: "87%", background: "var(--purple)" }} /></div>
          <div className="chart-legend"><span>Expected PKR 9.7M</span><b>Outstanding PKR 1.3M</b></div>
        </section>
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Pending approvals</h3><p>Items requiring action</p></div></div>
          <div className="approval-grid">
            {[["12","Student leaves"],["5","Teacher leaves"],["8","Admissions"],["4","Fee requests"]].map(([n,l]) => (
              <button key={l}><b>{n}</b><span>{l}</span></button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function OfficeDashboard() {
  return (
    <>
      <MetricGrid items={[
        { label: "Classes Today",     value: "14", note: "Across 5 branches", icon: BookOpen,   color: "#2563EB", bg: "#EFF6FF" },
        { label: "Exams Soon",        value: "7",  note: "Next 14 days",       icon: CalendarDays, color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Teachers Absent",   value: "3",  note: "Coverage required",  icon: Users,      color: "#EF4444", bg: "#FFF0F1" },
        { label: "Today's Attendance", value: "88.4%", note: "↑ 1.8%",        icon: UserCheck,  color: "#10B981", bg: "#ECFDF5" },
      ]} />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Today's schedule</h3><p>Operational class plan</p></div><CalendarDays size={18} /></div>
          <div className="timeline-list">
            {[["08:00","Grade 8-A","Mathematics","Mr. Ahmed"],["09:00","Grade 10-B","Physics","Ms. Sana"],["10:00","Grade 7-A","English","Mr. Ali"],["11:30","Grade 9-A","Chemistry","Dr. Noman"]].map(([t,cls,sub,tc]) => (
              <div key={t}><b>{t}</b><span>{cls} · {sub}</span><small>{tc}</small></div>
            ))}
          </div>
        </section>
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Teacher workload</h3><p>Balance before assigning periods</p></div></div>
          {[["Ahmed Khan",80],["Sara Ali",96],["Zain Ahmed",61]].map(([n,v]: any) => (
            <div key={n} style={{ padding: "4px 0 8px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", padding:"0 18px", fontSize: 11 }}><span>{n}</span><b>{v}%</b></div>
              <div className="prog-track" style={{ margin: "6px 18px 0" }}><div className="prog-fill" style={{ width:`${v}%`, background: v > 90 ? "var(--warning)" : "var(--purple)" }} /></div>
            </div>
          ))}
        </section>
      </div>
      <div className="quick-actions">
        <button className="primary">Create Timetable</button>
        <button className="secondary">Schedule Exam</button>
        <button className="secondary">Assign Teacher</button>
        <button className="soft-button">Generate Report</button>
      </div>
    </>
  );
}

function TeacherDashboard() {
  return (
    <>
      <MetricGrid items={[
        { label: "My Students",    value: "186", note: "Across assigned classes", icon: Users,         color: "#0F2241", bg: "#EEF2FF" },
        { label: "Today's Classes", value: "5",  note: "Next: 9-A at 10:00",     icon: BookOpen,      color: "#2563EB", bg: "#EFF6FF" },
        { label: "To Grade",       value: "14",  note: "Needs attention",          icon: CheckCircle2, color: "#D97706", bg: "#FFFBEB" },
        { label: "At Risk",        value: "8",   note: "AI intervention suggested", icon: AlertTriangle, color: "#EF4444", bg: "#FFF0F1" },
      ]} />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Today's classes</h3><p>5 classes on your timetable</p></div><Clock3 size={18} /></div>
          <div className="timeline-list">
            {[["08:00","Mathematics","9-A","done"],["09:30","Mathematics","10-B","done"],["11:00","Mathematics","8-A","current"],["14:00","Math Lab","9-A","upcoming"]].map(([t,sub,cls,s]) => (
              <div key={t}><b>{t}</b><span>{sub} · {cls}</span><small className={s === "current" ? "success-text" : ""}>{s === "current" ? "🟢 Now" : s === "done" ? "Done" : "Upcoming"}</small></div>
            ))}
          </div>
        </section>
        <AiInsight title="Student risk alerts" body={<><b>3 students in 9-B</b> show declining scores 3 months running. Early intervention recommended.</>} />
      </div>
      <TopStudentsTable teacherMode />
    </>
  );
}

function StudentDashboard() {
  return (
    <>
      <MetricGrid items={[
        { label: "Attendance",      value: "92%",  note: "Good standing",   icon: UserCheck,   color: "#10B981", bg: "#ECFDF5" },
        { label: "Current Grade",   value: "B+",   note: "↑ Improving",     icon: TrendingUp,  color: "#2563EB", bg: "#EFF6FF" },
        { label: "Assignments Due", value: "3",    note: "1 due tomorrow",  icon: BookOpen,    color: "#D97706", bg: "#FFFBEB" },
        { label: "Upcoming Tests",  value: "2",    note: "Next: Physics",   icon: CheckCircle2, color: "#8B5CF6", bg: "#F5F3FF" },
      ]} />
      <AiInsight
        title="Your AI Tutor prediction"
        body={<>You are on track to improve Physics from <b>C+ to B</b>. Completing your two remaining assignments is the highest-impact next step. CS performance is top 5% of class! 🎉</>}
      />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>My progress</h3><p>Current vs predicted grade</p></div></div>
          <div className="subject-progress">
            {[["Mathematics","B+","A"],["English","A","A"],["Physics","C+","B"],["CS","A","A+"],["History","C","B-"]].map(([sub,cur,pred]) => (
              <div key={sub}>
                <b>{sub}</b>
                <span>{cur} <ArrowRight size={12} /> <strong style={{ color: "var(--success)" }}>{pred}</strong></span>
              </div>
            ))}
          </div>
        </section>
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Assignments</h3><p>Needs your attention</p></div></div>
          <div className="task-list">
            <div><b>Physics Project</b><span className="status-pill danger">Due tomorrow</span></div>
            <div><b>Mathematics Assignment 08</b><span>Due Aug 25</span></div>
            <div><b>English Essay</b><span style={{ color: "var(--success)", fontWeight: 700 }}>Submitted ✓</span></div>
            <div><b>History Report</b><span>Due Sep 1</span></div>
          </div>
        </section>
      </div>
    </>
  );
}

function ParentDashboard() {
  return (
    <>
      <div className="child-switcher">
        <span>Viewing child</span>
        <select>
          <option>Ahmed Hassan · Grade 9-A</option>
          <option>Hina Hassan · Grade 7-B</option>
        </select>
      </div>
      <MetricGrid items={[
        { label: "Ahmed — Attendance", value: "92%",  note: "Good standing",          icon: UserCheck,  color: "#10B981", bg: "#ECFDF5" },
        { label: "Ahmed — Grade",      value: "B+",   note: "↑ Improving",            icon: TrendingUp, color: "#2563EB", bg: "#EFF6FF" },
        { label: "AI Predicted Grade", value: "A",    note: "81% confidence",          icon: Sparkles,   color: "#8B5CF6", bg: "#F5F3FF" },
        { label: "Fee Outstanding",    value: "$0",   note: "All clear ✓",            icon: Wallet,     color: "#10B981", bg: "#ECFDF5" },
      ]} />
      <div className="dashboard-two">
        <section className="surface dashboard-card">
          <div className="surface-head"><div><h3>Ahmed's progress</h3><p>Subject-level academic outlook</p></div></div>
          <div className="subject-progress">
            {[["Mathematics","B+","A"],["English","A","A"],["Physics","C+","B"],["CS","A","A+"]].map(([s,c,p]) => (
              <div key={s}><b>{s}</b><span>{c} <ArrowRight size={12} /> <strong style={{ color: "var(--success)" }}>{p}</strong></span></div>
            ))}
          </div>
        </section>
        <AiInsight
          title="Parent insight"
          body="Ahmed is a top CS and English performer — consider STEM enrichment this summer. Hina has perfect attendance and is in top 5% of her class!"
        />
      </div>
    </>
  );
}

function DriverDashboard() {
  return (
    <>
      <MetricGrid items={[
        { label: "Assigned Students", value: "12",    note: "Morning & afternoon",   icon: Users,  color: "#2563EB", bg: "#EFF6FF" },
        { label: "Morning Pickup",    value: "06:30", note: "Ends 07:45",            icon: Bus,    color: "#10B981", bg: "#ECFDF5" },
        { label: "Afternoon Drop",    value: "13:30", note: "Ends 15:00",            icon: Route,  color: "#0F2241", bg: "#EEF2FF" },
        { label: "Schedule Changes",  value: "1",     note: "Grade 6 early dismissal", icon: AlertTriangle, color: "#EF4444", bg: "#FFF0F1" },
      ]} />
      <section className="surface dashboard-card" style={{ maxWidth: 900 }}>
        <div className="surface-head"><div><h3>My students today</h3><p>School timing for children on your route</p></div><Bus size={18} /></div>
        {[["Ahmed Ali","Grade 9-A","08:00","14:00"],["Sara Ahmed","Grade 6-B","08:00","12:30"],["Zain Khan","Grade 4-A","07:45","13:30"],["Maryam Raza","Grade 7-A","08:00","14:00"]].map(([n,cls,s,e]) => (
          <div className="driver-row" key={n}>
            <span className="avatar">{n.split(" ").map(w => w[0]).join("")}</span>
            <div><b>{n}</b><small>{cls}</small></div>
            <span>Starts <b>{s}</b></span>
            <span>Dismissal <b>{e}</b></span>
          </div>
        ))}
      </section>
    </>
  );
}

/* ─── Main export ─────────────────────────────────────────── */
export function DashboardPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const role = roleKey(user?.roles ?? [user?.role ?? ""]);

  const endpoint =
    role === "student" ? `/api/dashboard/student/${user?.studentId}`   :
    role === "parent"  ? `/api/dashboard/parent/${user?.id}`           :
    role === "teacher" ? `/api/dashboard/teacher/${user?.teacherId ?? user?.employeeId}` :
    role === "driver"  ? `/api/dashboard/driver/${user?.driverId}`     :
    "/api/dashboard/admin";

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["dashboard", endpoint, effectiveTenantId(user)],
    queryFn: async () => {
      try { return (await http.get(endpoint, { params: { tenantId: effectiveTenantId(user) } })).data as any; }
      catch { return fallback; }
    },
    retry: false,
  });

  const d = { ...fallback, ...(data ?? {}) };

  const titles: Record<string, [string, string]> = {
    super:     ["Platform Overview", "Monitor tenants, reliability, API performance and operations"],
    principal: ["Principal Dashboard", "Academic performance, departments and staff"],
    tenant:    ["School Command Center", "Academic, operational and financial performance at a glance"],
    office:    ["School Operations", "Timetables, exams, staffing and today's operational workload"],
    teacher:   [`Good day, ${user?.name?.split(" ")[0] ?? "Teacher"} 👋`, "Your classes, grading workload and students who need attention"],
    student:   [`Hi, ${user?.name?.split(" ")[0] ?? "Student"} 👋`, "Your school day, progress, assignments and predictions"],
    parent:    ["Family Dashboard", "Attendance, results, progress and predictions for your children"],
    driver:    ["Transport Dashboard", "School timings and students assigned to your route"],
  };

  const [title, subtitle] = titles[role] ?? ["Dashboard", ""];

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="page-actions">
            <button className="secondary" onClick={() => refetch()}>{isFetching ? "Refreshing…" : "Refresh"}</button>
            {role === "super"   && <button className="primary" onClick={() => nav("/tenancy")}><Building2 size={15} /> Add Tenant</button>}
            {role === "tenant"  && <button className="primary" onClick={() => nav("/students")}><Users size={15} /> Manage Students</button>}
            {role === "teacher" && <button className="primary" onClick={() => nav("/ai")}><Bot size={15} /> Ask AI</button>}
          </div>
        }
      />
      {role === "super"     ? <SuperDashboard d={d} />   :
       role === "principal" ? <TenantDashboard d={d} />  :
       role === "tenant"    ? <TenantDashboard d={d} />  :
       role === "office"    ? <OfficeDashboard />         :
       role === "teacher"   ? <TeacherDashboard />        :
       role === "student"   ? <StudentDashboard />        :
       role === "parent"    ? <ParentDashboard />         :
                              <DriverDashboard />}
    </>
  );
}
