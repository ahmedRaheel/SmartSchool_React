import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, Users, ClipboardCheck } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { Pagination } from "../../../components/ui/Pagination";
import { useTeacherClasses, useTeacherStudents, useTeacherTimetable, useEmployees } from "../../../core/api/queries";
import { toItems } from "../../../core/utils/dataHelpers";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { useAuth } from "../../auth/auth";

interface TeacherClass {
  id: string;
  classSectionId: string;
  subject: string;
  subjectCode: string;
  classSection: string;
  campus: string;
  role: string;
  periodsPerWeek: number;
  totalStudents: number;
  pendingAssignments: number;
}

interface TeacherStudent {
  id: string;
  name: string;
  reg: string;
  section: string;
  status: string;
  classSectionId: string;
}

interface TeacherPeriod {
  id: string;
  classSectionId: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
  subject: string;
  section: string;
  room?: string;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TeachersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.roles.includes("Teacher") ?? false;
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const teacherId = isTeacher ? user?.employeeId ?? "" : selectedTeacher;
  const [tab, setTab] = useState<"classes" | "students" | "timetable">("classes");
  const [classSectionId, setClassSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const employees = useEmployees(1, !isTeacher);
  const classesQuery = useTeacherClasses(teacherId);
  const studentsQuery = useTeacherStudents(teacherId);
  const timetableQuery = useTeacherTimetable(teacherId);
  const classes = toItems(classesQuery.data) as TeacherClass[];
  const students = toItems(studentsQuery.data) as TeacherStudent[];
  const timetable = toItems(timetableQuery.data) as TeacherPeriod[];
  const pending = classes.reduce((total, item) => total + Number(item.pendingAssignments ?? 0), 0);
  const error = classesQuery.error ?? studentsQuery.error ?? timetableQuery.error;
  const loading = Boolean(teacherId) && (classesQuery.isLoading || studentsQuery.isLoading || timetableQuery.isLoading);
  const visibleStudents = students.filter(student => (!classSectionId || student.classSectionId === classSectionId) &&
    `${student.name} ${student.reg} ${student.section}`.toLowerCase().includes(search.toLowerCase()));
  const visibleTimetable = timetable.filter(period => !classSectionId || period.classSectionId === classSectionId);

  function selectClass(id: string) {
    setClassSectionId(id);
    setPage(1);
    setTab("students");
  }

  return <>
    <PageHeader title="Teacher Workspace" subtitle="Teaching assignments, enrolled students and scheduled lessons" />
    {!isTeacher && <label className="human-field" style={{ maxWidth: 420, marginBottom: 16 }}><span>Teacher</span>
      <select value={selectedTeacher} onChange={event => { setSelectedTeacher(event.target.value); setClassSectionId(""); setPage(1); }}>
        <option value="">Select teacher</option>
        {toItems(employees.data).filter((employee: any) => employee.staffType === "TEACHER").map((employee: any) =>
          <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName} — {employee.employeeNumber}</option>)}
      </select>
    </label>}
    {!teacherId && <p>Select a teacher to view their workspace.</p>}
    {loading && <p role="status">Loading teacher workspace…</p>}
    {error && <p role="alert" style={{ color: "var(--danger)" }}>{getErrorMessage(error)}</p>}
    {teacherId && <>
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="My classes" value={String(classes.length)} note="Current assignments" color="#2563EB" bg="#EFF6FF"><BookOpen size={20} /></StatCard>
        <StatCard label="My students" value={String(new Set(students.map(student => student.id)).size)} note="Active enrollments" color="#059669" bg="#ECFDF5"><Users size={20} /></StatCard>
        <StatCard label="Weekly periods" value={String(timetable.length)} note="Scheduled lessons" color="#7C3AED" bg="#F5F3FF"><CalendarDays size={20} /></StatCard>
        <StatCard label="To grade" value={String(pending)} note="Unreviewed submissions" color="#D97706" bg="#FFFBEB"><ClipboardCheck size={20} /></StatCard>
      </section>
      <div className="section-tabs">{(["classes", "students", "timetable"] as const).map(name =>
        <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name.charAt(0).toUpperCase() + name.slice(1)}</button>)}</div>
      {tab === "classes" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 290px), 1fr))", gap: 16 }}>
        {classes.map(item => <section className="surface" key={item.id} style={{ padding: 20 }}>
          <h3>{item.subject}</h3><p>{item.classSection} · {item.campus}</p>
          <p>{item.totalStudents} students · {item.periodsPerWeek} periods per week</p>
          <p>{item.role} · {item.pendingAssignments} submissions to grade</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="primary" onClick={() => selectClass(item.classSectionId)}>View students</button>
            <button className="secondary" onClick={() => navigate("/learning")}>Assignments</button>
            <button className="secondary" onClick={() => navigate(`/attendance?classSectionId=${item.classSectionId}`)}>Attendance</button>
          </div>
        </section>)}
        {!loading && !error && !classes.length && <p>No active teaching assignments.</p>}
      </div>}
      {tab !== "classes" && <section className="surface" style={{ marginTop: 16 }}>
        <div className="surface-head"><select aria-label="Class section" value={classSectionId} onChange={event => { setClassSectionId(event.target.value); setPage(1); }}>
          <option value="">All classes</option>
          {Array.from(new Map(classes.map(item => [item.classSectionId, item])).values()).map(item => <option key={item.classSectionId} value={item.classSectionId}>{item.classSection}</option>)}
        </select>{tab === "students" && <input aria-label="Search students" placeholder="Search students" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />}</div>
        {tab === "students" ? <>
          <div className="table-wrap"><table><thead><tr><th>Student</th><th>Registration</th><th>Class</th><th>Status</th></tr></thead><tbody>
            {visibleStudents.slice((page - 1) * 25, page * 25).map(student => <tr key={`${student.id}-${student.classSectionId}`}><td>{student.name}</td><td>{student.reg}</td><td>{student.section}</td><td>{student.status}</td></tr>)}
          </tbody></table></div>
          <Pagination page={page} pageSize={25} total={visibleStudents.length} onPage={setPage} label="students" />
        </> : <div className="table-wrap"><table><thead><tr><th>Day</th><th>Time</th><th>Period</th><th>Subject</th><th>Class</th><th>Room</th></tr></thead><tbody>
          {visibleTimetable.map(period => <tr key={period.id}><td>{dayNames[period.dayOfWeek % 7]}</td><td>{period.startTime.slice(0, 5)}–{period.endTime.slice(0, 5)}</td><td>{period.period}</td><td>{period.subject}</td><td>{period.section}</td><td>{period.room ?? "Unassigned"}</td></tr>)}
        </tbody></table>{!loading && !visibleTimetable.length && <p>No lessons scheduled for this selection.</p>}</div>}
      </section>}
    </>}
  </>;
}
