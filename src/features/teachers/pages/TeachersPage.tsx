import { RowActions } from "../../../components/ui/RowActions";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { env } from "../../../config/env";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Clock, Users, ClipboardCheck, GraduationCap,
  CalendarDays, ChevronRight, Bot, FileCheck2, Star} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useTeacherDashboard, useTeacherStudents, useTeacherTimetable,
  useTeacherWorkload, useTeacherClasses} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";

// ─── Rich mock class data — what actually matters for a teacher ───────────────
const MOCK_MY_CLASSES = [
  {
    id: "ca1",
    subject: "Mathematics",
    subjectCode: "MATH",
    classSection: "Grade 9-A (Boys)",
    sectionCode: "9A-B",
    campus: "Main Campus",
    role: "Primary Teacher",
    periodsPerWeek: 6,
    totalStudents: 38,
    schedule: [
      { day: "Monday",    period: "P-1", time: "08:00–08:45", room: "Room 101" },
      { day: "Wednesday", period: "P-2", time: "09:00–09:45", room: "Room 101" },
      { day: "Friday",    period: "P-3", time: "10:00–10:45", room: "Room 101" },
    ],
    nextClass: { day: "Monday", time: "08:00 AM", room: "Room 101" },
    recentActivity: "Unit Test 2 graded — avg 67%",
    pendingAssignments: 2,
    color: "#2563EB", bg: "#EFF6FF",
  },
  {
    id: "ca2",
    subject: "Mathematics",
    subjectCode: "MATH",
    classSection: "Grade 9-B (Boys)",
    sectionCode: "9B-B",
    campus: "Main Campus",
    role: "Primary Teacher",
    periodsPerWeek: 6,
    totalStudents: 35,
    schedule: [
      { day: "Tuesday",  period: "P-1", time: "08:00–08:45", room: "Room 102" },
      { day: "Thursday", period: "P-2", time: "09:00–09:45", room: "Room 102" },
      { day: "Saturday", period: "P-1", time: "08:00–08:45", room: "Room 102" },
    ],
    nextClass: { day: "Tuesday", time: "08:00 AM", room: "Room 102" },
    recentActivity: "Assignment 5 submitted — 28/35 students",
    pendingAssignments: 1,
    color: "#7C3AED", bg: "#F5F3FF",
  },
  {
    id: "ca3",
    subject: "Mathematics",
    subjectCode: "MATH",
    classSection: "Grade 10-A (Boys)",
    sectionCode: "10A",
    campus: "Main Campus",
    role: "Primary Teacher",
    periodsPerWeek: 5,
    totalStudents: 33,
    schedule: [
      { day: "Monday",   period: "P-4", time: "11:00–11:45", room: "Room 103" },
      { day: "Wednesday",period: "P-3", time: "10:00–10:45", room: "Room 103" },
      { day: "Friday",   period: "P-5", time: "12:00–12:45", room: "Room 103" },
    ],
    nextClass: { day: "Monday", time: "11:00 AM", room: "Room 103" },
    recentActivity: "Mid-term results published — 78% pass rate",
    pendingAssignments: 0,
    color: "#059669", bg: "#ECFDF5",
  },
  {
    id: "ca4",
    subject: "Mathematics",
    subjectCode: "MATH",
    classSection: "Grade 9-A (Girls)",
    sectionCode: "9A-G",
    campus: "Girls Branch",
    role: "Relief Teacher",
    periodsPerWeek: 3,
    totalStudents: 41,
    schedule: [
      { day: "Tuesday",  period: "P-4", time: "11:00–11:45", room: "G-Room 205" },
      { day: "Thursday", period: "P-4", time: "11:00–11:45", room: "G-Room 205" },
    ],
    nextClass: { day: "Tuesday", time: "11:00 AM", room: "G-Room 205" },
    recentActivity: "No recent activity",
    pendingAssignments: 0,
    color: "#DB2777", bg: "#FDF2F8",
  },
];

const MOCK_MY_STUDENTS = [
  { id:"s1", name:"Ahmed Hassan",  reg:"STU-0001", section:"Grade 9-A (Boys)",  attendance:88, lastGrade:"72%", status:"ACTIVE"  },
  { id:"s2", name:"Omar Raza",     reg:"STU-0003", section:"Grade 9-A (Boys)",  attendance:65, lastGrade:"55%", status:"ACTIVE"  },
  { id:"s3", name:"Hamza Sheikh",  reg:"STU-0007", section:"Grade 9-A (Boys)",  attendance:95, lastGrade:"88%", status:"ACTIVE"  },
  { id:"s4", name:"Bilal Khan",    reg:"STU-0009", section:"Grade 9-A (Boys)",  attendance:72, lastGrade:"61%", status:"ACTIVE"  },
  { id:"s5", name:"Zain Ali",      reg:"STU-0005", section:"Grade 9-B (Boys)",  attendance:90, lastGrade:"79%", status:"ACTIVE"  },
  { id:"s6", name:"Usman Mahmood", reg:"STU-0011", section:"Grade 9-B (Boys)",  attendance:85, lastGrade:"83%", status:"ACTIVE"  },
  { id:"s7", name:"Sara Malik",    reg:"STU-0002", section:"Grade 9-A (Girls)", attendance:98, lastGrade:"91%", status:"ACTIVE"  },
  { id:"s8", name:"Fatima Khan",   reg:"STU-0004", section:"Grade 9-A (Girls)", attendance:92, lastGrade:"86%", status:"ACTIVE"  },
  { id:"s9", name:"Hina Raza",     reg:"STU-0010", section:"Grade 10-A (Boys)", attendance:55, lastGrade:"48%", status:"PENDING" },
];

const MOCK_TIMETABLE = [
  { day:"Monday",    period:"P-1", time:"08:00–08:45", subject:"Mathematics", section:"Grade 9-A (Boys)",  room:"Room 101" },
  { day:"Monday",    period:"P-4", time:"11:00–11:45", subject:"Mathematics", section:"Grade 10-A (Boys)", room:"Room 103" },
  { day:"Tuesday",   period:"P-1", time:"08:00–08:45", subject:"Mathematics", section:"Grade 9-B (Boys)",  room:"Room 102" },
  { day:"Tuesday",   period:"P-4", time:"11:00–11:45", subject:"Mathematics", section:"Grade 9-A (Girls)", room:"G-Room 205" },
  { day:"Wednesday", period:"P-2", time:"09:00–09:45", subject:"Mathematics", section:"Grade 9-A (Boys)",  room:"Room 101" },
  { day:"Wednesday", period:"P-3", time:"10:00–10:45", subject:"Mathematics", section:"Grade 10-A (Boys)", room:"Room 103" },
  { day:"Thursday",  period:"P-2", time:"09:00–09:45", subject:"Mathematics", section:"Grade 9-B (Boys)",  room:"Room 102" },
  { day:"Thursday",  period:"P-4", time:"11:00–11:45", subject:"Mathematics", section:"Grade 9-A (Girls)", room:"G-Room 205" },
  { day:"Friday",    period:"P-3", time:"10:00–10:45", subject:"Mathematics", section:"Grade 9-A (Boys)",  room:"Room 101" },
  { day:"Friday",    period:"P-5", time:"12:00–12:45", subject:"Mathematics", section:"Grade 10-A (Boys)", room:"Room 103" },
  { day:"Saturday",  period:"P-1", time:"08:00–08:45", subject:"Mathematics", section:"Grade 9-B (Boys)",  room:"Room 102" },
];

const DAYS_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

type Tab = "classes" | "timetable" | "students";

export function TeachersPage() {
  const { user } = useAuth();
  const [viewSt, setViewSt] = useState<any|null>(null);
  const nav = useNavigate();
  const eid = user?.employeeId ?? "";

  const [tab, setTab]           = useState<Tab>("classes");
  const [activeClass, setActive]= useState<string | null>(null);
  const [studentFilter, setStF] = useState("");

  const { data: dash }    = useTeacherDashboard(eid);
  const { data: workload }= useTeacherWorkload(eid);
  const wl = (workload as any) ?? {};

  const totalStudents  = (env.useMocks ? MOCK_MY_CLASSES : []).reduce((a, c) => a + c.totalStudents, 0);
  const totalPeriods   = (env.useMocks ? MOCK_MY_CLASSES : []).reduce((a, c) => a + c.periodsPerWeek, 0);
  const pendingTotal   = (env.useMocks ? MOCK_MY_CLASSES : []).reduce((a, c) => a + c.pendingAssignments, 0);

  const filteredStudents = (env.useMocks ? MOCK_MY_STUDENTS : []).filter(s =>
    !studentFilter || s.name.toLowerCase().includes(studentFilter.toLowerCase()) ||
    s.section.toLowerCase().includes(studentFilter.toLowerCase()) ||
    s.reg.includes(studentFilter)
  );

  const selectedClass = (env.useMocks ? MOCK_MY_CLASSES : []).find(c => c.id === activeClass);

  return (
    <>
      <PageHeader
        title={`${dash?.FirstName ?? user?.name ?? "Teacher"}'s Workspace`}
        subtitle={`${dash?.EmployeeNumber ?? "—"} · Mathematics · ${(env.useMocks ? MOCK_MY_CLASSES : []).length} classes this term`}
      />

      {/* KPI strip */}
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="My classes"     value={String((env.useMocks ? MOCK_MY_CLASSES : []).length)}        note="This term"       color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Total students" value={String(totalStudents)}                 note="Across all classes" color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Periods/week"   value={String(totalPeriods)}                  note=""                color="#8B5CF6" bg="#F5F3FF"><Clock size={20}/></StatCard>
        <StatCard label="Pending tasks"  value={String(pendingTotal)}                  note="Assignments to grade" color={pendingTotal > 0 ? "#D97706" : "#10B981"} bg={pendingTotal > 0 ? "#FFFBEB" : "#ECFDF5"}><ClipboardCheck size={20}/></StatCard>
      </section>

      {/* Tabs */}
      <div className="section-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "classes"   ? "active" : ""} onClick={() => { setTab("classes");   setActive(null); }}>
          📚 My Classes ({(env.useMocks ? MOCK_MY_CLASSES : []).length})
        </button>
        <button className={tab === "timetable" ? "active" : ""} onClick={() => setTab("timetable")}>
          🕐 Weekly Timetable
        </button>
        <button className={tab === "students"  ? "active" : ""} onClick={() => setTab("students")}>
          👩‍🎓 My Students ({(env.useMocks ? MOCK_MY_STUDENTS : []).length})
        </button>
      </div>

      {/* ── MY CLASSES ── */}
      {tab === "classes" && !activeClass && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(env.useMocks ? MOCK_MY_CLASSES : []).map(cls => (
            <div key={cls.id}
              style={{ background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 14,
                       overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}
              onClick={() => setActive(cls.id)}>

              {/* Class header bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                            borderBottom: "1px solid var(--line)" }}>
                {/* Subject badge */}
                <div style={{ width: 52, height: 52, borderRadius: 14, background: cls.bg,
                               display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                               flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: cls.color }}>
                    {cls.subjectCode}
                  </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
                    <b style={{ fontSize: 15 }}>{cls.classSection}</b>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20,
                                   background: cls.role === "Primary Teacher" ? "#EEF2FF" : "#FDF2F8",
                                   color: cls.role === "Primary Teacher" ? "#6366F1" : "#DB2777",
                                   fontWeight: 700 }}>
                      {cls.role}
                    </span>
                    {cls.pendingAssignments > 0 && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20,
                                     background: "#FFFBEB", color: "#D97706", fontWeight: 700 }}>
                        {cls.pendingAssignments} to grade
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>
                    {cls.subject} · {cls.campus} · <code style={{ fontSize: 11 }}>{cls.sectionCode}</code>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: cls.color }}>{cls.totalStudents}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Students</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: cls.color }}>{cls.periodsPerWeek}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>Periods/wk</div>
                  </div>
                </div>
                <ChevronRight size={18} style={{ color: "var(--muted)", flexShrink: 0 }}/>
              </div>

              {/* Class footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "10px 20px",
                            background: "var(--surface-2)", fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669" }}>
                  <CalendarDays size={12}/>
                  <b>Next: {cls.nextClass.day} {cls.nextClass.time}</b> · {cls.nextClass.room}
                </span>
                <span style={{ color: "var(--muted)" }}>|</span>
                <span style={{ color: "var(--muted)" }}>{cls.recentActivity}</span>
                <div style={{ flex: 1 }}/>
                {/* Schedule pills */}
                <div style={{ display: "flex", gap: 4 }}>
                  {cls.schedule.map((s, i) => (
                    <span key={i} style={{ padding: "2px 8px", borderRadius: 20, background: cls.bg,
                                           color: cls.color, fontSize: 10, fontWeight: 600 }}>
                      {s.day.slice(0,3)} {s.period}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CLASS DETAIL ── */}
      {tab === "classes" && activeClass && selectedClass && (
        <div>
          {/* Back button */}
          <button className="secondary" style={{ marginBottom: 14, fontSize: 12 }}
            onClick={() => setActive(null)}>
            ← Back to my classes
          </button>

          {/* Detail header */}
          <div className="surface" style={{ marginBottom: 14 }}>
            <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: selectedClass.bg,
                             display: "flex", flexDirection: "column", alignItems: "center",
                             justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: selectedClass.color }}>
                  {selectedClass.subjectCode}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{selectedClass.classSection}</h2>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 3 }}>
                  {selectedClass.subject} · {selectedClass.campus} · {selectedClass.role}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="primary" style={{ fontSize: 11 }} onClick={() => nav("/attendance")}>
                  📋 Mark attendance
                </button>
                <button className="secondary" style={{ fontSize: 11 }} onClick={() => nav("/learning")}>
                  📝 Add assignment
                </button>
                <button className="secondary" style={{ fontSize: 11 }} onClick={() => nav("/examinations")}>
                  📊 Grade book
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", borderTop: "1px solid var(--line)" }}>
              {[
                { label: "Students",     value: selectedClass.totalStudents },
                { label: "Periods/week", value: selectedClass.periodsPerWeek },
                { label: "To grade",     value: selectedClass.pendingAssignments },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: "14px", textAlign: "center",
                                       borderRight: i < 2 ? "1px solid var(--line)" : "none" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: selectedClass.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule for this class */}
          <div className="surface" style={{ marginBottom: 14 }}>
            <div className="surface-head"><h3>Class schedule</h3><p>Regular periods this week</p></div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexWrap: "wrap", gap: 10 }}>
              {selectedClass.schedule.map((s, i) => (
                <div key={i} style={{ padding: "12px 16px", borderRadius: 10,
                                       background: selectedClass.bg, border: `1px solid ${selectedClass.color}30`,
                                       minWidth: 160 }}>
                  <div style={{ fontWeight: 700, color: selectedClass.color, fontSize: 13 }}>{s.day}</div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>{s.time}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                    {s.period} · {s.room}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Students in this class */}
          <div className="surface">
            <div className="surface-head">
              <h3>Students in {selectedClass.sectionCode}</h3>
              <p>{selectedClass.totalStudents} students enrolled</p>
            </div>
            <div className="table-wrap">
              <table className="premium-table">
                <thead>
                  <tr><th>Name</th><th>Reg #</th><th>Attendance</th><th>Last grade</th><th>Status</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th></tr>
                </thead>
                <tbody>
                  {(env.useMocks ? MOCK_MY_STUDENTS : [])
                    .filter(s => s.section === selectedClass.classSection)
                    .map(s => (
                      <tr key={s.id}>
                        <td>
                          <div className="person-cell">
                            <span className="row-avatar" style={{ background: selectedClass.bg, color: selectedClass.color, fontSize: 11 }}>
                              {s.name.split(" ").map(w => w[0]).join("")}
                            </span>
                            <b>{s.name}</b>
                          </div>
                        </td>
                        <td><code style={{ fontSize: 11 }}>{s.reg}</code></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 60, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.attendance}%`,
                                             background: s.attendance >= 75 ? "#10B981" : "#EF4444",
                                             borderRadius: 999 }}/>
                            </div>
                            <span style={{ fontSize: 11, color: s.attendance < 75 ? "#EF4444" : "var(--text)", fontWeight: s.attendance < 75 ? 700 : 400 }}>
                              {s.attendance}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <b style={{ color: parseInt(s.lastGrade) >= 50 ? "#10B981" : "#EF4444" }}>
                            {s.lastGrade}
                          </b>
                        </td>
                        <td><span className={`status-pill ${s.status === "ACTIVE" ? "success" : "warning"}`}>{s.status}</span></td>
<td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <RowActions
                                onView={() => s.id}
                                onEdit={() => setViewSt(s)}
                                                                deleteLabel="record"
                              />
                            </td>
                      </tr>
                    ))}
                  {(env.useMocks ? MOCK_MY_STUDENTS : []).filter(s => s.section === selectedClass.classSection).length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "var(--muted)", fontSize: 12 }}>
                      Student data loads from /api/teachers/{`{id}`}/students
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── WEEKLY TIMETABLE ── */}
      {tab === "timetable" && (
        <div className="surface">
          <div className="surface-head"><h3>Weekly timetable</h3><p>All scheduled periods across all classes</p></div>
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th style={{ minWidth: 90 }}>Day</th>
                  <th>Period</th>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Class</th>
                  <th>Room</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DAYS_ORDER.flatMap(day =>
                  (env.useMocks ? MOCK_TIMETABLE : []).filter(t => t.day === day).map((t, i) => {
                    const cls = (env.useMocks ? MOCK_MY_CLASSES : []).find(c => c.classSection === t.section);
                    return (
                      <tr key={`${day}-${i}`}>
                        {i === 0 && (
                          <td rowSpan={(env.useMocks ? MOCK_TIMETABLE : []).filter(x => x.day === day).length}
                            style={{ fontWeight: 700, verticalAlign: "middle",
                                     background: "var(--surface-2)", fontSize: 12 }}>
                            {day}
                          </td>
                        )}
                        <td>
                          <span style={{ padding: "2px 8px", borderRadius: 6, background: cls?.bg ?? "#EEF2FF",
                                          color: cls?.color ?? "#6366F1", fontSize: 11, fontWeight: 600 }}>
                            {t.period}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>{t.time}</td>
                        <td><b style={{ fontSize: 12 }}>{t.subject}</b></td>
                        <td>
                          <button className="text-button" style={{ fontSize: 12 }}
                            onClick={() => { setTab("classes"); setActive((env.useMocks ? MOCK_MY_CLASSES : []).find(c => c.classSection === t.section)?.id ?? null); }}>
                            {t.section}
                          </button>
                        </td>
                        <td style={{ fontSize: 11 }}>{t.room}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ALL MY STUDENTS ── */}
      {tab === "students" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>All my students</h3><p>Students across all {(env.useMocks ? MOCK_MY_CLASSES : []).length} classes</p></div>
            <label className="search-box" style={{ maxWidth: 260 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={studentFilter} onChange={e => setStF(e.target.value)} placeholder="Search by name, section…"/>
            </label>
          </div>

          {/* At-risk banner */}
          {(env.useMocks ? MOCK_MY_STUDENTS : []).filter(s => s.attendance < 75).length > 0 && (
            <div style={{ margin: "0 20px 14px",padding: "10px 14px", background: "#FFF0F1",
                           border: "1px solid #fecdd3", borderRadius: 10, fontSize: 12, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span>
                <b>{(env.useMocks ? MOCK_MY_STUDENTS : []).filter(s => s.attendance < 75).length} students</b> have attendance below 75% —
                {" "}<button className="text-button" onClick={() => nav("/ai")}>run AI prediction →</button>
              </span>
            </div>
          )}

          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Student</th><th>Reg #</th><th>Class</th><th>Attendance</th><th>Last grade</th><th>Status</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th></tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => {
                  const cls = (env.useMocks ? MOCK_MY_CLASSES : []).find(c => c.classSection === s.section);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="person-cell">
                          <span className="row-avatar" style={{ background: cls?.bg ?? "#EEF2FF", color: cls?.color ?? "#6366F1", fontSize: 11 }}>
                            {s.name.split(" ").map(w => w[0]).join("")}
                          </span>
                          <b>{s.name}</b>
                        </div>
                      </td>
                      <td><code style={{ fontSize: 11 }}>{s.reg}</code></td>
                      <td>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20,
                                        background: cls?.bg ?? "#EEF2FF", color: cls?.color ?? "#6366F1" }}>
                          {s.section}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 60, height: 6, borderRadius: 999, background: "var(--surface-2)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${s.attendance}%`,
                                           background: s.attendance >= 75 ? "#10B981" : "#EF4444", borderRadius: 999 }}/>
                          </div>
                          <span style={{ fontSize: 11, color: s.attendance < 75 ? "#EF4444" : "var(--text)",
                                          fontWeight: s.attendance < 75 ? 700 : 400 }}>
                            {s.attendance}%
                          </span>
                          {s.attendance < 75 && <span style={{ fontSize: 10, color: "#EF4444" }}>⚠</span>}
                        </div>
                      </td>
                      <td>
                        <b style={{ color: parseInt(s.lastGrade) >= 50 ? "#10B981" : "#EF4444" }}>{s.lastGrade}</b>
                      </td>
                      <td><span className={`status-pill ${s.status === "ACTIVE" ? "success" : "warning"}`}>{s.status}</span></td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>No students match "{studentFilter}"</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>{filteredStudents.length} students shown</span></div>
        </div>
      )}

      {viewSt && (
        <ViewDrawer title="Student" item={viewSt} onClose={() => setViewSt(null)}
          fields={[
            { key: "name",       label: "Name", wide: true },
            { key: "regNo",      label: "Reg #" },
            { key: "section",    label: "Class" },
            { key: "attendance", label: "Attendance %" },
            { key: "avgGrade",   label: "Avg grade" },
            { key: "pendingAssignments", label: "Pending work" },
          ]} />
      )}
    </>
  );
}
