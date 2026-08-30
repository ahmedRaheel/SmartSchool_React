import { useState } from "react";
import { BookOpen, CheckCircle2, TrendingUp, Wallet, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";
import { useStudentDashboard, useEarlyWarning, useAskChatbot } from "../../../core/api/queries";

const MY_COURSES = [
  { subject:"Mathematics",    teacher:"Ms. Aisha Siddiqui", grade:"B+", pct:82, credits:4 },
  { subject:"Physics",        teacher:"Mr. Tariq Jameel",   grade:"A",  pct:91, credits:4 },
  { subject:"English",        teacher:"Mrs. Rehana Pervez", grade:"B",  pct:78, credits:3 },
  { subject:"Computer Sci.",  teacher:"Dr. Noman Arif",     grade:"A+", pct:97, credits:4 },
  { subject:"History",        teacher:"Mr. Fahad Ali",      grade:"C+", pct:68, credits:3 },
  { subject:"Chemistry",      teacher:"Ms. Zara Khan",      grade:"B+", pct:84, credits:4 },
];

const MY_ASSIGNMENTS = [
  { title:"Chapter 5 — Quadratic Equations", subject:"Mathematics", due:"Sep 5",  status:"Pending" },
  { title:"Mechanics Lab Report",            subject:"Physics",     due:"Sep 3",  status:"Submitted"},
  { title:"Essay — My School Journey",       subject:"English",     due:"Sep 10", status:"Pending" },
  { title:"Python Assignment 3",             subject:"Comp. Sci.",  due:"Sep 8",  status:"Graded",  grade:"A+" },
];

const TIMETABLE: Record<string, { subject:string; time:string; room:string }[]> = {
  Mon: [{ subject:"Mathematics", time:"8:00–9:00",  room:"101" },{ subject:"English",    time:"9:00–10:00",  room:"204" },{ subject:"Physics",  time:"11:00–12:00", room:"Lab 1" }],
  Tue: [{ subject:"Computer Sci.",time:"8:00–9:00", room:"Lab 2"},{ subject:"Chemistry",  time:"10:00–11:00", room:"Lab 2"},{ subject:"History",  time:"13:00–14:00", room:"306" }],
  Wed: [{ subject:"Mathematics", time:"8:00–9:00",  room:"101" },{ subject:"Physics",    time:"11:00–12:00", room:"Lab 1"},{ subject:"English",  time:"14:00–15:00", room:"204" }],
  Thu: [{ subject:"History",     time:"8:00–9:00",  room:"306" },{ subject:"Chemistry",  time:"10:00–11:00", room:"Lab 2"},{ subject:"Comp. Sci.",time:"13:00–14:00", room:"Lab 2"}],
  Fri: [{ subject:"Mathematics", time:"8:00–9:00",  room:"101" },{ subject:"English",    time:"9:00–10:00",  room:"204" }],
};

type Tab = "courses"|"timetable"|"assignments"|"fees";
const GRADE_COLOR: Record<string,string> = { "A+":"#10B981","A":"#10B981","B+":"#2563EB","B":"#2563EB","C+":"#D97706","C":"#D97706","D":"#EF4444" };

export function StudentPortalPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("courses");
  const { data: dash, isLoading } = useStudentDashboard();
  const { data: warnings } = useEarlyWarning(user?.studentId ?? "");

  const avgPct = Math.round(MY_COURSES.reduce((a,c) => a+c.pct, 0) / MY_COURSES.length);
  const highRisk = warnings?.filter(w => w.riskLevel === "High").length ?? 0;

  return (
    <>
      <PageHeader
        title={`My Portal`}
        subtitle={dash ? `${dash.FirstName} ${dash.LastName ?? ""} · ${dash.StudentNumber}` : "Student workspace"}
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="My courses"     value={String(MY_COURSES.length)}                          note="This term"       color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Average grade"  value={`${avgPct}%`}                                       note="Across subjects" color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Assignments due" value={String(MY_ASSIGNMENTS.filter(a=>a.status==="Pending").length)} note="Pending submission" color="#D97706" bg="#FFFBEB"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="AI risk alerts" value={highRisk > 0 ? String(highRisk) : "All clear"}      note={highRisk > 0 ? "Action needed":"✓ On track"} color={highRisk>0?"#EF4444":"#10B981"} bg={highRisk>0?"#FFF0F1":"#ECFDF5"}><Zap size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {(["courses","timetable","assignments","fees"] as Tab[]).map(t => (
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
            {t==="courses"?"📚 My Courses":t==="timetable"?"📅 Timetable":t==="assignments"?"📝 Assignments":"💳 Fee Status"}
          </button>
        ))}
      </div>

      {/* ── Courses ── */}
      {tab === "courses" && (
        <div className="surface">
          <div className="surface-head"><h3>Enrolled courses</h3><p>Current term performance</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Subject</th><th>Teacher</th><th>Progress</th><th>Grade</th></tr></thead>
              <tbody>
                {MY_COURSES.map(c => (
                  <tr key={c.subject}>
                    <td><b>{c.subject}</b></td>
                    <td style={{ fontSize:12 }}>{c.teacher}</td>
                    <td style={{ minWidth:140 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ flex:1, height:6, borderRadius:4, background:"var(--surface-2)", overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${c.pct}%`, background: c.pct>=90?"#10B981":c.pct>=75?"#2563EB":c.pct>=60?"#F59E0B":"#EF4444", borderRadius:4 }}/>
                        </div>
                        <span style={{ fontSize:11, fontWeight:600, width:32, textAlign:"right" }}>{c.pct}%</span>
                      </div>
                    </td>
                    <td>
                      <b style={{ fontSize:14, color: GRADE_COLOR[c.grade] ?? "var(--text)" }}>{c.grade}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Timetable ── */}
      {tab === "timetable" && (
        <div className="surface">
          <div className="surface-head"><h3>My timetable</h3><p>Current week class schedule</p></div>
          <div style={{ padding:"0 20px 20px", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
            {["Mon","Tue","Wed","Thu","Fri"].map(day => (
              <div key={day}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:8, textTransform:"uppercase", letterSpacing:.8 }}>{day}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {(TIMETABLE[day] ?? []).map((cls, i) => (
                    <div key={i} style={{ padding:"8px 10px", borderRadius:9, background:"#EEF2FF", border:"1px solid #e0e7ff" }}>
                      <div style={{ fontSize:11, fontWeight:600, color:"#3730a3" }}>{cls.subject}</div>
                      <div style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>{cls.time}</div>
                      <div style={{ fontSize:9, color:"var(--muted)" }}>Room {cls.room}</div>
                    </div>
                  ))}
                  {(TIMETABLE[day] ?? []).length === 0 && (
                    <div style={{ fontSize:11, color:"var(--muted)", padding:"8px 0" }}>No classes</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Assignments ── */}
      {tab === "assignments" && (
        <div className="surface">
          <div className="surface-head"><h3>My assignments</h3><p>Pending, submitted and graded</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {MY_ASSIGNMENTS.map((a,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div>
                  <b style={{ fontSize:13 }}>{a.title}</b>
                  <div style={{ display:"flex", gap:10, marginTop:4 }}>
                    <span style={{ fontSize:11, color:"var(--muted)" }}>{a.subject}</span>
                    <span style={{ fontSize:11, color: a.status==="Pending" && new Date(a.due) < new Date() ? "var(--danger)" : "var(--muted)" }}>Due: {a.due}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {a.grade && <b style={{ fontSize:14, color:"#10B981" }}>{a.grade}</b>}
                  <span className={`status-pill ${a.status==="Submitted"?"info":a.status==="Graded"?"success":"warning"}`}>{a.status}</span>
                  {a.status === "Pending" && <button className="primary" style={{ fontSize:11 }}>Submit</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fees ── */}
      {tab === "fees" && (
        <div className="surface">
          <div className="surface-head"><h3>Fee status</h3><p>Monthly invoices and payment history</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { month:"August 2026",    amount:4500, status:"Paid",    date:"Aug 5"  },
              { month:"July 2026",      amount:4500, status:"Paid",    date:"Jul 3"  },
              { month:"June 2026",      amount:4500, status:"Paid",    date:"Jun 6"  },
              { month:"September 2026", amount:4500, status:"Pending", date:"Sep 20" },
            ].map((f,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div>
                  <b style={{ fontSize:13 }}>{f.month}</b>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>Due: {f.date}</div>
                </div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <b style={{ fontSize:16 }}>PKR {f.amount.toLocaleString()}</b>
                  <span className={`status-pill ${f.status==="Paid"?"success":"warning"}`}>{f.status}</span>
                  {f.status === "Pending" && <button className="primary" style={{ fontSize:11 }}>Pay now</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
