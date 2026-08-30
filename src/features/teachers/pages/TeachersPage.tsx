import { useState } from "react";
import { BookOpen, Clock, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useTeacherDashboard, useTeacherStudents, useTeacherTimetable, useTeacherWorkload, useTeacherClasses } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const DAYS = ["","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export function TeachersPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const eid = user?.employeeId ?? "";
  const [tab, setTab] = useState<"dashboard"|"timetable"|"students"|"classes">("dashboard");

  const { data: dash }     = useTeacherDashboard(eid);
  const { data: students } = useTeacherStudents(eid);
  const { data: timetable} = useTeacherTimetable(eid);
  const { data: workload } = useTeacherWorkload(eid);
  const { data: classes }  = useTeacherClasses(eid);

  const studentList  = Array.isArray(students)  ? students  : [];
  const timetableList= Array.isArray(timetable) ? timetable : [];
  const classesList  = Array.isArray(classes)   ? classes   : [];
  const wl = (workload as any) ?? {};

  return (
    <>
      <PageHeader title="Teacher Workspace" subtitle={`Welcome, ${dash?.FirstName ?? user?.name ?? "Teacher"} — ${dash?.EmployeeNumber ?? ""}`}/>

      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}>📊 Dashboard</button>
        <button className={tab==="timetable"?"active":""} onClick={()=>setTab("timetable")}>🕐 Timetable</button>
        <button className={tab==="students"?"active":""}  onClick={()=>setTab("students")}>👩‍🎓 Students ({studentList.length})</button>
        <button className={tab==="classes"?"active":""}   onClick={()=>setTab("classes")}>📚 Classes ({classesList.length})</button>
      </div>

      {tab === "dashboard" && (
        <>
          <section className="metric-grid" style={{ marginBottom:20 }}>
            <StatCard label="Course assignments" value={String(dash?.CourseAssignments ?? wl.activeAssignments ?? 0)} note="" color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
            <StatCard label="Students"           value={String(studentList.length)}                                    note="In my classes" color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
            <StatCard label="Periods/week"       value={String(wl.periodsPerWeek ?? 0)}                               note="" color="#8B5CF6" bg="#F5F3FF"><Clock size={20}/></StatCard>
            <StatCard label="Pending leaves"     value={String(dash?.PendingLeaves ?? 0)}                             note="" color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
          </section>
          <div className="surface">
            <div className="surface-head"><h3>Quick links</h3></div>
            <div style={{ padding:"0 16px 16px", display:"flex", flexWrap:"wrap", gap:8 }}>
              {[["Attendance","/attendance"],["Grade Book","/examinations"],["Assignments","/learning"],["AI Assistant","/ai"],["Leave Request","/hr"]].map(([l,p]) => (
                <a key={p} href={p} style={{ padding:"8px 16px", border:"1px solid var(--line)", borderRadius:8, fontSize:12, color:"var(--text)", textDecoration:"none" }}
                  onMouseEnter={e=>(e.currentTarget.style.background="var(--surface-2)")}
                  onMouseLeave={e=>(e.currentTarget.style.background="")}>{l}</a>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "timetable" && (
        <div className="surface">
          <div className="surface-head"><h3>My timetable</h3><p>Current term schedule</p></div>
          {timetableList.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>No timetable entries found.</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Day</th><th>Period</th><th>Time</th><th>Class</th><th>Course</th><th>Room</th></tr></thead>
                <tbody>
                  {timetableList.map((t:any,i:number) => (
                    <tr key={i}>
                      <td><b>{DAYS[t.DayOfWeek ?? t.dayOfWeek] ?? t.DayOfWeek ?? t.dayOfWeek}</b></td>
                      <td>{t.Period ?? t.period ?? "—"}</td>
                      <td style={{ fontSize:11 }}>{t.StartTime ?? t.startTime ?? "—"} – {t.EndTime ?? t.endTime ?? "—"}</td>
                      <td><code style={{ fontSize:11 }}>{t.ClassSectionId ?? t.classSectionId ?? "—"}</code></td>
                      <td><code style={{ fontSize:11 }}>{t.CourseOfferingId ?? t.courseOfferingId ?? "—"}</code></td>
                      <td>{t.RoomId ?? t.roomId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "students" && (
        <div className="surface">
          <div className="surface-head"><h3>My students</h3><p>Students enrolled across my classes</p></div>
          {studentList.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>No students found. Add class assignments first.</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Student</th><th>Reg #</th><th>Class Section</th><th>Status</th></tr></thead>
                <tbody>
                  {studentList.map((s:any,i:number) => (
                    <tr key={i}>
                      <td><b>{s.FirstName ?? s.firstName} {s.LastName ?? s.lastName ?? ""}</b></td>
                      <td><code style={{ fontSize:11 }}>{s.StudentNumber ?? s.studentNumber ?? "—"}</code></td>
                      <td><code style={{ fontSize:11 }}>{s.ClassSectionId ?? s.classSectionId ?? "—"}</code></td>
                      <td><span className={`status-pill ${(s.Status ?? s.status)==="ACTIVE"?"success":"gray"}`}>{s.Status ?? s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "classes" && (
        <div className="surface">
          <div className="surface-head"><h3>My class assignments</h3><p>Courses I am assigned to teach</p></div>
          {classesList.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>No class assignments found.</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Course</th><th>Class section</th><th>Role</th><th>Periods/week</th><th>Effective from</th></tr></thead>
                <tbody>
                  {classesList.map((c:any,i:number) => (
                    <tr key={i}>
                      <td><code style={{ fontSize:11 }}>{c.CourseOfferingId ?? c.courseOfferingId ?? "—"}</code></td>
                      <td><code style={{ fontSize:11 }}>{c.ClassSectionId ?? c.classSectionId ?? "—"}</code></td>
                      <td>{c.Role ?? c.role ?? "PRIMARY"}</td>
                      <td>{c.PeriodsPerWeek ?? c.periodsPerWeek ?? "—"}</td>
                      <td>{c.EffectiveFrom ?? c.effectiveFrom ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
