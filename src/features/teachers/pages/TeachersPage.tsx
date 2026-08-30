import { useState } from "react";
import { BookOpen, Calendar, ClipboardCheck, Plus, Search, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";
import { useTeacherDashboard, useTeacherWorkload, useTeacherTimetable } from "../../../core/api/queries";
import { teachersApi } from "../../../core/api/smartschoolApi";
import { useQuery } from "@tanstack/react-query";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const TIMETABLE_PERIODS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri"];

// Generate demo timetable grid
function demoTimetable(name: string) {
  const subjects = ["Mathematics","Physics","Chemistry","English","Computer Science","Biology","History"];
  const grid: Record<string, Record<string, string>> = {};
  DAYS.forEach(d => {
    grid[d] = {};
    TIMETABLE_PERIODS.forEach((p, pi) => {
      if (pi < 6 && Math.random() > 0.35) {
        grid[d][p] = subjects[Math.floor(Math.random() * subjects.length)];
      }
    });
  });
  return grid;
}

type Tab = "dashboard"|"timetable"|"students"|"assignments";

export function TeachersPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const eid = user?.employeeId ?? "";
  const [tab, setTab] = useState<Tab>("dashboard");
  const [q, setQ]     = useState("");

  const { data: dashboard, isLoading: dLoading } = useTeacherDashboard();
  const { data: workload,  isLoading: wLoading }  = useTeacherWorkload();
  const { data: students,  isLoading: sLoading }  = useQuery({
    queryKey: ["teacher-students", eid, tenantId],
    queryFn: () => teachersApi.students(eid, tenantId).then(r => r.data),
    enabled: !!eid && tab === "students",
  });

  const timetable = demoTimetable(user?.name ?? "");
  const sItems = (students as any)?.items ?? (students as any)?.value?.items ?? [];
  const wItems = (workload  as any)?.items ?? (workload  as any)?.value?.items ?? [];

  const COLOR_MAP: Record<string, string> = {
    "Mathematics":"#2563EB","Physics":"#8B5CF6","Chemistry":"#10B981",
    "English":"#F59E0B","Computer Science":"#0F2241","Biology":"#EF4444","History":"#6366F1",
  };

  return (
    <>
      <PageHeader
        title="Teacher Workspace"
        subtitle={dashboard ? `${dashboard.FirstName} ${dashboard.LastName ?? ""} · ${dashboard.CourseAssignments} course assignments` : "Loading…"}
      />

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {(["dashboard","timetable","students","assignments"] as Tab[]).map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "dashboard"   ? "📊 Overview"
           : t === "timetable"  ? "📅 My Timetable"
           : t === "students"   ? "👥 My Students"
           : "📝 Assignments"}
          </button>
        ))}
      </div>

      {/* ── Dashboard ── */}
      {tab === "dashboard" && (
        <>
          <section className="metric-grid" style={{ marginBottom:20 }}>
            <StatCard label="Course assignments" value={dLoading ? "…" : String(dashboard?.CourseAssignments ?? 0)} note="This term" color="#0F2241" bg="#EEF2FF"><BookOpen size={20}/></StatCard>
            <StatCard label="Students" value="186" note="Across all classes" color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
            <StatCard label="Pending leaves" value={dLoading ? "…" : String(dashboard?.PendingLeaves ?? 0)} note="" color="#D97706" bg="#FFFBEB"><Calendar size={20}/></StatCard>
            <StatCard label="Gradebook entries" value="124" note="Marked this month" color="#10B981" bg="#ECFDF5"><ClipboardCheck size={20}/></StatCard>
          </section>

          <div className="grid-2">
            <div className="surface">
              <div className="surface-head"><h3>My classes</h3><p>Assigned sections this term</p></div>
              <div style={{ padding:"0 20px 20px" }}>
                {["Grade 9-A · Mathematics","Grade 10-B · Mathematics","Grade 11-A · Statistics","Grade 9-B · Mathematics"].map((cls, i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                    <div>
                      <b style={{ display:"block" }}>{cls.split(" · ")[0]}</b>
                      <span style={{ color:"var(--muted)" }}>{cls.split(" · ")[1]}</span>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="table-action" style={{ fontSize:10 }}>Grade book</button>
                      <button className="table-action" style={{ fontSize:10 }}>Attendance</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="surface">
              <div className="surface-head"><h3>AI student alerts</h3><p>Students needing attention</p></div>
              <div style={{ padding:"0 16px 16px" }}>
                {[
                  { name:"Omar Raza",   cls:"9-A", issue:"Attendance 72% · Grades declining", level:"high"   },
                  { name:"Sara Malik",  cls:"10-B",issue:"Grade dropped from B to C this month",level:"medium" },
                  { name:"Zain Ali",    cls:"9-B", issue:"3 missing assignments this week",    level:"medium" },
                ].map((a, i) => (
                  <div key={i} style={{
                    display:"flex", gap:10, padding:"10px 12px", borderRadius:10, marginBottom:8,
                    background: a.level === "high" ? "var(--danger-bg)" : "var(--warning-bg)",
                    border: `1.5px solid ${a.level === "high" ? "#fecdd3" : "#fde68a"}`,
                  }}>
                    <span style={{ fontSize:18 }}>{a.level === "high" ? "🚨" : "⚠️"}</span>
                    <div>
                      <b style={{ fontSize:12 }}>{a.name} · {a.cls}</b>
                      <p style={{ fontSize:11, color:"var(--muted)", margin:"2px 0 0" }}>{a.issue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Timetable ── */}
      {tab === "timetable" && (
        <div className="surface" style={{ overflowX:"auto" }}>
          <div className="surface-head"><h3>My timetable</h3><p>Current week schedule</p></div>
          <div style={{ padding:"0 20px 20px", minWidth:600 }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ padding:"8px 10px", textAlign:"left", color:"var(--muted)", fontWeight:600, borderBottom:"1.5px solid var(--line)", width:64 }}>Period</th>
                  {DAYS.map(d => (
                    <th key={d} style={{ padding:"8px 10px", textAlign:"center", color:"var(--muted)", fontWeight:600, borderBottom:"1.5px solid var(--line)" }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMETABLE_PERIODS.map(p => (
                  <tr key={p}>
                    <td style={{ padding:"8px 10px", fontSize:10, color:"var(--muted)", fontWeight:600 }}>{p}</td>
                    {DAYS.map(d => {
                      const subj = timetable[d]?.[p];
                      return (
                        <td key={d} style={{ padding:4, textAlign:"center" }}>
                          {subj ? (
                            <div style={{
                              padding:"6px 8px", borderRadius:8, fontSize:10, fontWeight:500,
                              background: (COLOR_MAP[subj] ?? "#6366F1") + "22",
                              color: COLOR_MAP[subj] ?? "#6366F1",
                              border: `1px solid ${(COLOR_MAP[subj] ?? "#6366F1")}44`,
                            }}>
                              {subj}
                            </div>
                          ) : (
                            <div style={{ color:"var(--surface-2)", fontSize:9 }}>—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Students ── */}
      {tab === "students" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{ maxWidth:280 }}>
              <Search size={14}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search students…"/>
            </label>
          </div>
          {sLoading ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Loading students…</div>
          ) : sItems.length === 0 ? (
            <div style={{ padding:"20px", color:"var(--muted)", fontSize:12 }}>
              {eid ? "No students found for your assigned classes." : "Connect backend to view your students."}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Student</th><th>Class</th><th>Status</th></tr></thead>
                <tbody>
                  {sItems.filter((s: any) => JSON.stringify(s).toLowerCase().includes(q.toLowerCase())).map((s: any) => (
                    <tr key={s.studentId ?? s.id}>
                      <td><b>{s.firstName} {s.lastName ?? ""}</b></td>
                      <td>{s.className ?? s.class ?? "—"}</td>
                      <td><span className="status-pill success">{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Assignments ── */}
      {tab === "assignments" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Assignments</h3><p>Created and pending review</p></div>
            <button className="primary"><Plus size={14}/> New assignment</button>
          </div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { title:"Chapter 5 — Quadratic Equations", class:"Grade 9-A", due:"Sep 5",  submissions:8,  total:10, status:"Open"   },
              { title:"Mechanics Lab Report",            class:"Grade 11-A",due:"Sep 3",  submissions:18, total:18, status:"Closed" },
              { title:"English Essay — My Journey",      class:"Grade 10-B",due:"Sep 10", submissions:0,  total:22, status:"Open"   },
            ].map((a, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div>
                  <b style={{ fontSize:13 }}>{a.title}</b>
                  <div style={{ display:"flex", gap:10, marginTop:4 }}>
                    <span style={{ fontSize:11, color:"var(--muted)" }}>{a.class}</span>
                    <span style={{ fontSize:11, color:"var(--muted)" }}>Due: {a.due}</span>
                    <span style={{ fontSize:11 }}>{a.submissions}/{a.total} submitted</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span className={`status-pill ${a.status === "Open" ? "success" : "gray"}`}>{a.status}</span>
                  <button className="table-action" style={{ fontSize:10 }}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
