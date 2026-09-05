/**
 * DashboardPage — routes to actor-specific premium dashboard.
 * Each actor sees ONLY data relevant to their role:
 *   SuperAdmin   → Platform-wide SaaS metrics
 *   SchoolAdmin  → Full school operations command centre
 *   Principal    → Academic oversight with AI insights
 *   Teacher      → My classes, timetable, assignments
 *   Student      → My grades, fees, AI tutor quick access
 *   Parent       → My children's status, fees, alerts
 *   Driver       → My route, vehicle, assigned students
 *   Examiner     → Pending results, upcoming exams
 *   Accountant   → Finance overview, outstanding collections
 */
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth";
import { useAdminDashboard, useStudentDashboard, useTeacherDashboard,
         useParentDashboard, useDriverDashboard, useEarlyWarning,
         useInvoices, useStudents, useEmployees, useExams, useActivities } from "../../../core/api/queries";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  BookOpen, Bot, Bus, Calendar, CheckCircle2, ChevronRight,
  CreditCard, GraduationCap, TrendingDown, TrendingUp, Users,
  Wallet, Zap, Clock, FileText, AlertTriangle, Star} from "lucide-react";

const fmt  = (n?: number|null, pre = "") => n !== undefined && n !== null ? `${pre}${Number(n).toLocaleString()}` : "—";
const pkr  = (n?: number|null) => n !== undefined && n !== null ? `PKR ${(Number(n)/1000).toFixed(0)}K` : "—";
const pct  = (a?: number, b?: number) => (!a || !b) ? "—" : `${Math.round((a/b)*100)}%`;

function QuickLink({ label, path, icon }: { label:string; path:string; icon?:string }) {
  const nav = useNavigate();
  return (
    <button onClick={() => nav(path)}
      style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px",
               border:"1px solid var(--line)", borderRadius:10, background:"var(--surface)",
               cursor:"pointer", fontSize:12, fontWeight:500, color:"var(--text)", width:"100%", textAlign:"left" }}
      onMouseEnter={e => (e.currentTarget.style.background="var(--surface-2)")}
      onMouseLeave={e => (e.currentTarget.style.background="var(--surface)")}>
      <span>{icon && <span style={{marginRight:8}}>{icon}</span>}{label}</span>
      <ChevronRight size={12} style={{color:"var(--muted)"}}/>
    </button>
  );
}

function AIAlert({ message, level="warning" }: { message: string; level?: "warning"|"danger" }) {
  return (
    <div style={{ display:"flex", gap:12, padding:"12px 16px",
                  background: level==="danger" ? "#FFF0F1" : "#FFFBEB",
                  border: `1px solid ${level==="danger"?"#fecdd3":"#fde68a"}`,
                  borderRadius:10, fontSize:12 }}>
      <AlertTriangle size={16} style={{color:level==="danger"?"#EF4444":"#D97706",flexShrink:0,marginTop:1}}/>
      <span>{message}</span>
    </div>
  );
}

// ─── SUPER ADMIN ──────────────────────────────────────────────────────────────
function SuperAdminDashboard() {
  const nav = useNavigate();
  const tenants   = [
    { name:"Al-Noor Academy",     plan:"Pro",        students:3240, status:"ACTIVE",  mrr:249, city:"Lahore"    },
    { name:"Bright Future",       plan:"Enterprise", students:4800, status:"ACTIVE",  mrr:799, city:"Islamabad" },
    { name:"City Grammar School", plan:"Trial",      students:920,  status:"TRIAL",   mrr:0,   city:"Karachi"   },
    { name:"The Knowledge Hub",   plan:"Starter",    students:340,  status:"ACTIVE",  mrr:99,  city:"Lahore"    },
  ];
  const totalMRR = tenants.reduce((a,t)=>a+t.mrr,0);
  const totalStudents = tenants.reduce((a,t)=>a+t.students,0);
  const PLAN_COLOR: Record<string,string> = { Pro:"#2563EB", Enterprise:"#7C3AED", Trial:"#D97706", Starter:"#6B7280" };

  return (
    <>
      <PageHeader title="Platform Dashboard" subtitle="SaaS operations — across all tenants"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Monthly MRR"      value={`$${totalMRR.toLocaleString()}`}  note="All active plans"  color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Active schools"   value={String(tenants.filter(t=>t.status==="ACTIVE").length)} note={`${tenants.length} total`} color="#2563EB" bg="#EFF6FF"><GraduationCap size={20}/></StatCard>
        <StatCard label="Platform students" value={totalStudents.toLocaleString()} note="All tenants"       color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="AI requests (30d)" value="24,891"                          note="All tenants"       color="#8B5CF6" bg="#F5F3FF"><Zap size={20}/></StatCard>
      </section>

      <div className="grid-2" style={{marginBottom:16}}>
        <div className="surface">
          <div className="surface-head"><h3>Tenant portfolio</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>School</th><th>Plan</th><th>Students</th><th>MRR</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {tenants.map(t=>(
                  <tr key={t.name}>
                    <td><b style={{fontSize:12}}>{t.name}</b><div style={{fontSize:10,color:"var(--muted)"}}>{t.city}</div></td>
                    <td><span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:`${PLAN_COLOR[t.plan]}15`,color:PLAN_COLOR[t.plan]}}>{t.plan}</span></td>
                    <td>{t.students.toLocaleString()}</td>
                    <td><b>${t.mrr}/mo</b></td>
                    <td><span className={`status-pill ${t.status==="ACTIVE"?"success":"warning"}`}>{t.status}</span></td>
                    <td><button className="table-action" style={{fontSize:10}} onClick={()=>nav("/tenancy")}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Platform quick access</h3></div>
          <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <QuickLink label="Tenant Management"   path="/tenancy"       icon="🏫"/>
            <QuickLink label="Subscriptions"       path="/subscriptions" icon="💰"/>
            <QuickLink label="AI Platform Admin"   path="/ai-platform"   icon="🧠"/>
            <QuickLink label="Audit Logs"          path="/audit"         icon="📋"/>
            <QuickLink label="Workflow Centre"     path="/workflow"      icon="⚙️"/>
            <QuickLink label="System Health"       path="/platform"      icon="🔧"/>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── SCHOOL ADMIN / PRINCIPAL ──────────────────────────────────────────────────
function AdminDashboard({ role = "SchoolAdmin" }: { role?: string }) {
  const { data: d, isLoading } = useAdminDashboard();
  const { data: studData }     = useStudents(1);
  const { data: examsData }    = useExams();
  const { data: actData }      = useActivities();
  const nav = useNavigate();

  const exams      = (examsData as any)?.items ?? (examsData as any) ?? [];
  const activities = (actData as any)?.items ?? (actData as any) ?? [];

  return (
    <>
      <PageHeader
        title={role === "Principal" ? "Principal's Dashboard" : "School Command Centre"}
        subtitle={`${new Date().toLocaleDateString("en-PK", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}`}
      />

      {/* Primary KPI row */}
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Students"         value={isLoading?"…":fmt(d?.Students)}           note={`${fmt(d?.ActiveStudents)} active`}   color="#2563EB" bg="#EFF6FF"><GraduationCap size={20}/></StatCard>
        <StatCard label="Staff"            value={isLoading?"…":fmt(d?.Employees)}          note="All campus"                            color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="Collected"        value={isLoading?"…":pkr(d?.CollectedAmount)}    note={pct(d?.CollectedAmount, (d?.CollectedAmount??0)+(d?.OutstandingAmount??0))+" collected"} color="#10B981" bg="#ECFDF5"><Wallet size={20}/></StatCard>
        <StatCard label="Outstanding"      value={isLoading?"…":pkr(d?.OutstandingAmount)}  note={`${fmt(d?.OutstandingInvoices)} invoices`} color="#D97706" bg="#FFFBEB"><CreditCard size={20}/></StatCard>
        <StatCard label="Exams"            value={isLoading?"…":fmt(d?.Exams)}              note=""                                      color="#8B5CF6" bg="#F5F3FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Pass rate"        value={isLoading?"…":pct(d?.PassedResults, (d?.PassedResults??0)+(d?.FailedResults??0))} note={`${fmt(d?.FailedResults)} failed`} color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Vehicles"         value={isLoading?"…":fmt(d?.Vehicles)}           note={`${fmt(d?.Drivers)} drivers`}          color="#6366F1" bg="#EEF2FF"><Bus size={20}/></StatCard>
        <StatCard label="Notifications"    value={isLoading?"…":fmt(d?.UnreadNotifications)} note="Unread"                              color="#EF4444" bg="#FFF0F1"><Zap size={20}/></StatCard>
      </section>

      <div className="grid-2" style={{marginBottom:16}}>
        {/* AI Insights panel */}
        <div className="surface">
          <div className="surface-head">
            <div>
              <h3 style={{display:"flex",alignItems:"center",gap:8}}><Bot size={16} style={{color:"#8B5CF6"}}/>AI Insights</h3>
              <p>Predictions and alerts from the AI engine</p>
            </div>
            <button className="secondary" style={{fontSize:11}} onClick={()=>nav("/ai")}>View all →</button>
          </div>
          <div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <AIAlert message="47 students flagged as high dropout risk this term — review AI Predictions for intervention plans." level="danger"/>
            <AIAlert message="Transport delay predicted on Route C tomorrow due to road works. Consider alternate route." level="warning"/>
            <AIAlert message="Fee collection rate is 89% — 12% above last month. 312 invoices still outstanding." level="warning"/>
            <div style={{padding:"10px 14px",background:"#ECFDF5",border:"1px solid #a7f3d0",borderRadius:10,fontSize:12}}>
              ✅ 94% attendance rate this week — best in last 6 months
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="surface">
          <div className="surface-head"><h3>Quick actions</h3></div>
          <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <QuickLink label="Enrol new student"      path="/students"     icon="🎓"/>
            <QuickLink label="Add staff member"       path="/hr"           icon="👤"/>
            <QuickLink label="Record fee payment"     path="/finance"      icon="💳"/>
            <QuickLink label="Process admissions"     path="/admissions"   icon="📋"/>
            <QuickLink label="Mark attendance"        path="/attendance"   icon="✅"/>
            <QuickLink label="Create exam"            path="/examinations" icon="📝"/>
            <QuickLink label="AI predictions"         path="/ai"           icon="🧠"/>
            <QuickLink label="School configuration"   path="/setup"        icon="⚙️"/>
          </div>
        </div>
      </div>

      {/* Financial + Exam summary */}
      <div className="grid-2" style={{marginBottom:16}}>
        <div className="surface">
          <div className="surface-head"><h3>Financial overview</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            {[
              { label:"Total invoices",       value: fmt(d?.Invoices)                                },
              { label:"Outstanding invoices", value: fmt(d?.OutstandingInvoices), warn:true           },
              { label:"Collected (PKR)",      value: pkr(d?.CollectedAmount),   good:true             },
              { label:"Outstanding (PKR)",    value: pkr(d?.OutstandingAmount), warn:true             },
              { label:"Guardians on file",    value: fmt(d?.Guardians)                                },
            ].map(r=>(
              <div key={r.label} style={{display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid var(--surface-2)",fontSize:12}}>
                <span style={{color:"var(--muted)"}}>{r.label}</span>
                <b style={{color:r.good?"#10B981":r.warn?"#D97706":"var(--text)"}}>{r.value}</b>
              </div>
            ))}
            <button className="primary" style={{width:"100%",marginTop:12,fontSize:11}} onClick={()=>nav("/finance")}>
              View full finance report →
            </button>
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Upcoming activities</h3></div>
          <div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:8}}>
            {activities.length === 0 ? (
              <div style={{padding:24,textAlign:"center",color:"var(--muted)",fontSize:12}}>No upcoming activities. <button className="text-button" onClick={()=>nav("/activities")}>Add one →</button></div>
            ) : activities.slice(0,4).map((a:any)=>{
              let meta: any = {};
              try { meta = JSON.parse(a.metadataJson??"{}"); } catch {}
              return (
                <div key={a.id} style={{display:"flex",gap:10,padding:"10px 12px",border:"1px solid var(--line)",borderRadius:10,alignItems:"center"}}>
                  <span style={{fontSize:18}}>📅</span>
                  <div style={{flex:1}}>
                    <b style={{fontSize:12,display:"block"}}>{a.name}</b>
                    <span style={{fontSize:10,color:"var(--muted)"}}>{meta.date??"-"} · {meta.venue??"-"}</span>
                  </div>
                  <span className="status-pill info" style={{fontSize:9}}>{meta.type??"Event"}</span>
                </div>
              );
            })}
            <button className="secondary" style={{fontSize:11}} onClick={()=>nav("/activities")}>All activities →</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TEACHER ──────────────────────────────────────────────────────────────────
function TeacherDashboard() {
  const { data: d, isLoading } = useTeacherDashboard();
  const nav = useNavigate();

  return (
    <>
      <PageHeader
        title={isLoading ? "Teacher Workspace" : `Good day, ${d?.FirstName ?? "Teacher"} 👋`}
        subtitle={`Employee: ${d?.EmployeeNumber ?? "—"} · Status: ${d?.Status ?? "—"}`}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Course assignments" value={fmt(d?.CourseAssignments)} note="This term"   color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Pending leaves"     value={fmt(d?.PendingLeaves)}     note=""            color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
      </section>

      <div className="grid-2" style={{marginBottom:16}}>
        <div className="surface">
          <div className="surface-head">
            <div><h3 style={{display:"flex",alignItems:"center",gap:8}}><Bot size={16} style={{color:"#8B5CF6"}}/>AI for Teachers</h3></div>
          </div>
          <div style={{padding:"0 16px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{padding:"14px 16px",background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1px solid #C7D2FE",borderRadius:12,fontSize:12}}>
              <div style={{fontWeight:700,marginBottom:6,color:"#6366F1"}}>🧠 AI Teaching Assistant</div>
              <p style={{margin:"0 0 10px",color:"#475569",lineHeight:1.6}}>Ask anything about your students, generate lesson plans, get quiz ideas or predict student performance.</p>
              <button className="primary" style={{fontSize:11,height:32}} onClick={()=>nav("/ai")}>Open AI assistant →</button>
            </div>
            <AIAlert message="3 students in your Grade 9-A class show declining attendance — see AI predictions." level="warning"/>
          </div>
        </div>

        <div className="surface">
          <div className="surface-head"><h3>My workspace</h3></div>
          <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <QuickLink label="My classes & timetable"  path="/teacher-workspace" icon="📅"/>
            <QuickLink label="Mark attendance"          path="/attendance"        icon="✅"/>
            <QuickLink label="Grade book"               path="/examinations"      icon="📊"/>
            <QuickLink label="Assignments"              path="/learning"          icon="📝"/>
            <QuickLink label="Student list"             path="/students"          icon="👥"/>
            <QuickLink label="Apply for leave"          path="/hr"                icon="🏖️"/>
            <QuickLink label="Library"                  path="/library"           icon="📚"/>
            <QuickLink label="Communication"            path="/communication"     icon="💬"/>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── STUDENT ──────────────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuth();
  const { data: d, isLoading } = useStudentDashboard();
  const { data: warnings } = useEarlyWarning(user?.studentId ?? "");
  const nav = useNavigate();
  const risks = (warnings as any[] | undefined)?.filter(w => w.riskLevel === "High" || w.riskLevel === "Critical") ?? [];

  return (
    <>
      <PageHeader
        title={isLoading ? "My Portal" : `Welcome back, ${d?.FirstName ?? "Student"} 👋`}
        subtitle={`Reg No: ${d?.StudentNumber ?? "—"} · ${d?.Status ?? "—"}`}
      />

      {risks.length > 0 && (
        <div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
          {risks.map((r:any,i:number) => (
            <AIAlert key={i} message={`⚠️ AI Alert: ${r.outcome}. Factors: ${Array.isArray(r.factors) ? r.factors.slice(0,2).join(", ") : "See AI panel"}`} level="danger"/>
          ))}
        </div>
      )}

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Enrollments"       value={fmt(d?.Enrollments)}         note="This year"    color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Exam results"      value={fmt(d?.Results)}             note="Submitted"    color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Outstanding fees"  value={fmt(d?.OutstandingInvoices)} note="Unpaid"       color={d?.OutstandingInvoices?"#EF4444":"#10B981"} bg={d?.OutstandingInvoices?"#FFF0F1":"#ECFDF5"}><Wallet size={20}/></StatCard>
        <StatCard label="AI risk"           value={risks.length > 0 ? "⚠️ Alert" : "✅ Clear"} note={risks.length>0?"See details":"On track"} color={risks.length>0?"#EF4444":"#10B981"} bg={risks.length>0?"#FFF0F1":"#ECFDF5"}><Zap size={20}/></StatCard>
      </section>

      <div className="grid-2" style={{marginBottom:16}}>
        <div className="surface">
          <div className="surface-head">
            <div><h3 style={{display:"flex",alignItems:"center",gap:8}}><Bot size={16} style={{color:"#8B5CF6"}}/>AI Tutor</h3></div>
          </div>
          <div style={{padding:"0 16px 16px"}}>
            <div style={{padding:"16px",background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1px solid #C7D2FE",borderRadius:12,fontSize:12,marginBottom:12}}>
              <div style={{fontWeight:700,marginBottom:6,color:"#6366F1"}}>🧠 Ask your AI tutor</div>
              <p style={{margin:"0 0 10px",color:"#475569",lineHeight:1.6}}>Get instant help with any subject — explanations, practice problems, quizzes.</p>
              <button className="primary" style={{fontSize:11,height:32}} onClick={()=>nav("/ai")}>Start learning →</button>
            </div>
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>My portal</h3></div>
          <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <QuickLink label="My profile & grades"  path="/my-portal"      icon="🎓"/>
            <QuickLink label="Fee status & invoices" path="/finance"        icon="💳"/>
            <QuickLink label="Library"               path="/library"        icon="📚"/>
            <QuickLink label="Exam schedule"         path="/examinations"   icon="📝"/>
            <QuickLink label="Assignments"           path="/learning"       icon="📋"/>
            <QuickLink label="Messages"              path="/communication"  icon="💬"/>
            <QuickLink label="Activities"            path="/activities"     icon="🏆"/>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PARENT ───────────────────────────────────────────────────────────────────
function ParentDashboard() {
  const { data: d, isLoading } = useParentDashboard();
  const nav = useNavigate();

  return (
    <>
      <PageHeader
        title={isLoading ? "Parent Portal" : `Welcome, ${d?.FullName ?? "Parent"} 👋`}
        subtitle="Monitor your children's academic journey"
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Children enrolled" value={fmt(d?.Children)}           note="Active"     color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="Outstanding fees"  value={fmt(d?.OutstandingInvoices)}note="Unpaid"     color={d?.OutstandingInvoices?"#EF4444":"#10B981"} bg={d?.OutstandingInvoices?"#FFF0F1":"#ECFDF5"}><Wallet size={20}/></StatCard>
      </section>

      <div className="grid-2" style={{marginBottom:16}}>
        <div className="surface">
          <div className="surface-head"><div><h3 style={{display:"flex",alignItems:"center",gap:8}}><Bot size={16} style={{color:"#8B5CF6"}}/>Parent AI Assistant</h3><p>Ask about your children's performance, fees, transport</p></div></div>
          <div style={{padding:"0 16px 16px"}}>
            <div style={{padding:"16px",background:"linear-gradient(135deg,#FDF9C4,#FFFBEB)",border:"1px solid #FDE68A",borderRadius:12,fontSize:12,marginBottom:10}}>
              <div style={{fontWeight:700,marginBottom:6,color:"#D97706"}}>💬 AI Parent Assistant</div>
              <p style={{margin:"0 0 10px",color:"#92400E",lineHeight:1.6}}>Ask about fee dues, attendance summaries, results and more in natural language.</p>
              <button className="primary" style={{fontSize:11,height:32,background:"#D97706"}} onClick={()=>nav("/ai")}>Ask now →</button>
            </div>
            {d?.OutstandingInvoices ? (
              <AIAlert message={`${d.OutstandingInvoices} outstanding invoice${d.OutstandingInvoices>1?"s":""} — click to view fee details.`} level="warning"/>
            ) : (
              <div style={{padding:"10px 14px",background:"#ECFDF5",border:"1px solid #a7f3d0",borderRadius:10,fontSize:12}}>✅ All fees are up to date.</div>
            )}
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Parent portal</h3></div>
          <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
            <QuickLink label="My children's profiles"  path="/parent-portal" icon="👨‍👩‍👧"/>
            <QuickLink label="Fee & payments"           path="/finance"       icon="💳"/>
            <QuickLink label="Bus tracking"             path="/transport"     icon="🚌"/>
            <QuickLink label="Communication"            path="/communication" icon="💬"/>
            <QuickLink label="Activities & events"      path="/activities"    icon="🏆"/>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DRIVER ───────────────────────────────────────────────────────────────────
function DriverDashboard() {
  const { data: d, isLoading } = useDriverDashboard();
  const nav = useNavigate();

  return (
    <>
      <PageHeader
        title={isLoading ? "Driver Workspace" : `Welcome, ${d?.FullName ?? "Driver"} 🚌`}
        subtitle={`Driver No: ${d?.DriverNumber ?? "—"} · Status: ${d?.Status ?? "—"}`}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Active routes"  value={fmt(d?.ActiveVehicleAssignments)} note="Assigned"    color="#2563EB" bg="#EFF6FF"><Bus size={20}/></StatCard>
        <StatCard label="Licence expiry" value={d?.LicenseExpiresOn ?? "—"}       note="Licence date" color="#D97706" bg="#FFFBEB"><Calendar size={20}/></StatCard>
      </section>

      <div className="surface" style={{marginBottom:16}}>
        <div className="surface-head"><h3>My workspace</h3></div>
        <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <QuickLink label="My route details"   path="/driver-portal" icon="🗺️"/>
          <QuickLink label="Vehicle info"       path="/transport"     icon="🚌"/>
          <QuickLink label="Student manifest"   path="/transport"     icon="👥"/>
          <QuickLink label="Messages"           path="/communication" icon="💬"/>
        </div>
      </div>
    </>
  );
}

// ─── ACCOUNTANT ───────────────────────────────────────────────────────────────
function AccountantDashboard() {
  const { data: d, isLoading } = useAdminDashboard();
  const nav = useNavigate();

  return (
    <>
      <PageHeader title="Finance Dashboard" subtitle="Fee collection, invoices and financial management"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Collected"   value={isLoading?"…":pkr(d?.CollectedAmount)}  note="This period" color="#10B981" bg="#ECFDF5"><Wallet size={20}/></StatCard>
        <StatCard label="Outstanding" value={isLoading?"…":pkr(d?.OutstandingAmount)} note={`${fmt(d?.OutstandingInvoices)} invoices`} color="#D97706" bg="#FFFBEB"><CreditCard size={20}/></StatCard>
        <StatCard label="Total invoices" value={isLoading?"…":fmt(d?.Invoices)} note="" color="#2563EB" bg="#EFF6FF"><FileText size={20}/></StatCard>
        <StatCard label="Collection rate" value={isLoading?"…":pct(d?.CollectedAmount,(d?.CollectedAmount??0)+(d?.OutstandingAmount??0))} note="" color="#8B5CF6" bg="#F5F3FF"><TrendingUp size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Finance actions</h3></div>
        <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <QuickLink label="Invoices & collections" path="/finance"  icon="📄"/>
          <QuickLink label="Fee structures"         path="/setup"    icon="⚙️"/>
          <QuickLink label="Payroll"                path="/payroll"  icon="💰"/>
          <QuickLink label="Reports"                path="/reports"  icon="📊"/>
        </div>
      </div>
    </>
  );
}

// ─── EXAMINER ─────────────────────────────────────────────────────────────────
function ExaminerDashboard() {
  const nav = useNavigate();
  const { data: examsData } = useExams();
  const exams = (examsData as any)?.items ?? (examsData as any) ?? [];
  let pending = 0, upcoming = 0;
  for(const e of exams) {
    let meta: any = {};
    try { meta = JSON.parse(e.metadataJson??"{}"); } catch {}
    if(meta.status==="IN_PROGRESS"||meta.status==="RESULT_ENTRY") pending++;
    if(meta.status==="SCHEDULED") upcoming++;
  }

  return (
    <>
      <PageHeader title="Examination Dashboard" subtitle="Manage exams, results and grade scales"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Upcoming exams" value={String(upcoming)} note="" color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Result pending" value={String(pending)}  note="" color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
        <StatCard label="Total exams"    value={String(exams.length)} note="" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Exam actions</h3></div>
        <div style={{padding:"0 14px 16px",display:"flex",flexDirection:"column",gap:8}}>
          <QuickLink label="All examinations"   path="/examinations" icon="📝"/>
          <QuickLink label="Grade scales"       path="/examinations" icon="📊"/>
          <QuickLink label="Student results"    path="/examinations" icon="🎓"/>
          <QuickLink label="Reports"            path="/reports"      icon="📋"/>
        </div>
      </div>
    </>
  );
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();

  if (role.includes("superadmin"))                          return <SuperAdminDashboard/>;
  if (role.includes("student"))                             return <StudentDashboard/>;
  if (role.includes("teacher"))                             return <TeacherDashboard/>;
  if (role.includes("parent") || role.includes("guardian")) return <ParentDashboard/>;
  if (role.includes("driver"))                              return <DriverDashboard/>;
  if (role.includes("examiner"))                            return <ExaminerDashboard/>;
  if (role.includes("accountant"))                          return <AccountantDashboard/>;
  if (role.includes("principal"))                           return <AdminDashboard role="Principal"/>;
  // Tenant / School Owner — full admin dashboard
  if (role === "tenant" || role.includes("owner"))          return <AdminDashboard role="School Owner"/>;
  // SchoolAdmin, Admin, HRManager, all others
  return <AdminDashboard/>;
}
