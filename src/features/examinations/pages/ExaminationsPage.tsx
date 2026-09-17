import { GradeScalePanel } from "./GradeScalePanel";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Download, FileUp, Plus, RefreshCw, Save, Send, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Pagination } from "../../../components/ui/Pagination";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";

type Exam = {
  id: string;
  name: string;
  code: string;
  examTypeCode: string;
  classSection: string;
  startDate: string;
  endDate: string;
  status: string;
  subjectCount: number;
};

type Allocation = {
  classSectionId: string;
  classSection: string;
  courseOfferingId: string;
  course: string;
};

type SubjectDraft = {
  courseOfferingId: string;
  name: string;
  totalMarks: string;
  passingMarks: string;
  examDate: string;
};

type Subject = {
  id: string;
  name: string;
  totalMarks: number;
  passingMarks: number | null;
  examDate: string;
};

type ResultRow = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  examSubjectId: string;
  resultId: string | null;
  marksObtained: number | null;
  percentage: number | null;
  grade: string | null;
  isAbsent: boolean;
  remarks: string | null;
};

type TaskOption = {
  examSubjectId: string;
  subject: string;
  courseOfferingId: string;
  teacherCourseAssignmentId: string;
  teacherEmployeeId: string;
  teacherUserId: string;
  teacherName: string;
};

type ExamTask = {
  taskId: string;
  examId: string;
  exam: string;
  examSubjectId: string;
  subject: string;
  classSection: string;
  teacherEmployeeId: string;
  teacherUserId: string;
  teacherName: string;
  taskType: "EXAM_PAPER" | "RESULT_ENTRY";
  title: string;
  instructions: string | null;
  assignedAt: string;
  dueAt: string;
  status: string;
  submittedAt: string | null;
  completedAt: string | null;
  submissionNotes: string | null;
  submissionFileName: string | null;
  isOverdue: boolean;
};

type ResultTaskRoster = {
  taskId: string;
  examId: string;
  examSubjectId: string;
  subject: string;
  totalMarks: number;
  passingMarks: number | null;
  dueAt: string;
  status: string;
  rows: Array<{
    studentId: string;
    studentName: string;
    studentNumber: string;
    marksObtained: number | null;
    isAbsent: boolean;
    remarks: string | null;
  }>;
};

type ResultDraft = ResultTaskRoster["rows"][number] & { marks: string; dirty?: boolean };

function dueLabel(value: string) {
  return new Date(value).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });
}

function taskStatusClass(task: ExamTask) {
  if (task.status === "COMPLETED") return "success";
  if (task.status === "SUBMITTED") return "info";
  if (task.isOverdue || task.status === "OVERDUE") return "danger";
  return "warning";
}

export function ExaminationsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const permissions = usePermissions();
  const canCreateExam = permissions.can("exams.create");
  const canAssignTasks = permissions.can("exams.tasks.assign");
  const canUpdateTasks = permissions.can("exams.tasks.update");
  const canPublish = permissions.can("exams.publish");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsExam, setResultsExam] = useState<Exam | null>(null);
  const [taskExam, setTaskExam] = useState<Exam | null>(null);
  const [activeTeacherTask, setActiveTeacherTask] = useState<ExamTask | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", classSectionId: "", examTypeCode: "MID_TERM", startDate: "", endDate: "" });
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);

  const exams = useQuery({
    queryKey: ["exams", tenantId, page, pageSize],
    enabled: !!tenantId,
    queryFn: async () => (await api.get<{ items: Exam[]; totalCount: number }>("/api/examinations/exam", { params: { tenantId, page, pageSize } })).data,
  });

  const setup = useQuery({
    queryKey: ["exam-setup", tenantId],
    enabled: !!tenantId && canCreateExam,
    queryFn: async () => (await api.get<{ items: Allocation[] }>("/api/examinations/setup", { params: { tenantId } })).data.items,
  });

  const teacherTasks = useQuery({
    queryKey: ["my-exam-tasks", tenantId],
    enabled: !!tenantId && canUpdateTasks,
    queryFn: async () => (await api.get<{ items: ExamTask[] }>("/api/examinations/tasks/my", { params: { tenantId } })).data.items,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!canUpdateTasks || !teacherTasks.data?.length || activeTeacherTask) return;
    const requestedTaskId = new URLSearchParams(window.location.search).get("task");
    const requestedTask = teacherTasks.data.find(task => task.taskId === requestedTaskId);
    if (requestedTask) setActiveTeacherTask(requestedTask);
  }, [activeTeacherTask, canUpdateTasks, teacherTasks.data]);

  const allocations = setup.data ?? [];
  const classes = Array.from(new Map(allocations.map(item => [item.classSectionId, item.classSection])).entries());
  const courses = allocations.filter(item => item.classSectionId === form.classSectionId);

  async function createExam() {
    setError("");
    if (!form.name.trim() || !form.classSectionId || !form.startDate || !form.endDate || subjects.length === 0) {
      setError("Enter a name, class, dates and at least one subject.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/examinations/exam", {
        ...form,
        tenantId,
        subjects: subjects.map(item => ({
          courseOfferingId: item.courseOfferingId,
          totalMarks: Number(item.totalMarks),
          passingMarks: Number(item.passingMarks),
          examDate: item.examDate || form.startDate,
        })),
      });
      setCreateOpen(false);
      setSubjects([]);
      setForm({ name: "", classSectionId: "", examTypeCode: "MID_TERM", startDate: "", endDate: "" });
      await exams.refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle={permissions.isExaminer
          ? "Create exams, assign subject work to teachers and publish completed results."
          : permissions.isTeacher
            ? "Work only on exam-paper and result tasks assigned to your subjects."
            : "View examination schedules and published results."}
        action={canCreateExam ? (
          <button className="primary" onClick={() => { setError(""); setCreateOpen(true); }}>
            <Plus size={16} /> Create exam
          </button>
        ) : undefined}
      />

      {(error || exams.error || setup.error || teacherTasks.error) && (
        <p className="form-error" role="alert">
          {error || getErrorMessage(exams.error || setup.error || teacherTasks.error)}
        </p>
      )}

      {canUpdateTasks && (
        <TeacherTaskPanel
          tenantId={tenantId}
          tasks={teacherTasks.data ?? []}
          loading={teacherTasks.isLoading}
          onRefresh={() => void teacherTasks.refetch()}
          onOpen={setActiveTeacherTask}
        />
      )}

      <section className="surface">
        <div className="surface-head">
          <div className="surface-head-left">
            <h3>Exam schedule</h3>
            <p>{exams.data?.totalCount ?? 0} exams · creation is restricted to Examiner</p>
          </div>
        </div>
        <div className="table-wrap sticky-head">
          <table className="premium-table">
            <thead><tr><th>Exam</th><th>Class</th><th>Dates</th><th>Subjects</th><th>Status</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
            <tbody>
              {exams.isLoading ? (
                <tr><td colSpan={6}>Loading exams…</td></tr>
              ) : exams.data?.items.length ? exams.data.items.map(exam => (
                <tr key={exam.id}>
                  <td><b>{exam.name}</b><small style={{ display: "block" }}>{exam.code} · {exam.examTypeCode}</small></td>
                  <td>{exam.classSection}</td>
                  <td>{exam.startDate} – {exam.endDate}</td>
                  <td>{exam.subjectCount}</td>
                  <td><span className={`status-pill ${exam.status === "PUBLISHED" ? "success" : "info"}`}>{exam.status}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <div className="page-actions" style={{ justifyContent: "flex-end" }}>
                      {canAssignTasks && exam.status !== "PUBLISHED" && (
                        <button className="secondary" onClick={() => setTaskExam(exam)}>Teacher tasks</button>
                      )}
                      <button className="soft-button" onClick={() => setResultsExam(exam)}>View results</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6}>No exams are available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageSize={pageSize} total={exams.data?.totalCount ?? 0} onPage={setPage} onPageSize={setPageSize} />
      </section>

      {(permissions.isExaminer || permissions.isPrincipal) && <GradeScalePanel tenantId={tenantId} />}

      {createOpen && (
        <div className="modal-backdrop">
          <section className="modal-card" style={{ width: "min(850px,96vw)" }} role="dialog" aria-modal="true" aria-label="Create exam">
            <div className="modal-head"><div><h2>Create exam</h2><p>Only the Examiner role can save a new exam.</p></div><button className="icon-button" onClick={() => setCreateOpen(false)}><X size={18} /></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Exam name *</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
                <label className="human-field"><span>Class section *</span><select value={form.classSectionId} onChange={e => { setForm({ ...form, classSectionId: e.target.value }); setSubjects([]); }}><option value="">Select class</option>{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
                <label className="human-field"><span>Exam type</span><select value={form.examTypeCode} onChange={e => setForm({ ...form, examTypeCode: e.target.value })}>{["CLASS_TEST", "MONTHLY_TEST", "MID_TERM", "ANNUAL", "PRE_BOARD", "SUPPLEMENTARY", "FINAL", "MOCK"].map(type => <option key={type}>{type}</option>)}</select></label>
                <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></label>
                <label className="human-field"><span>End date *</span><input type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></label>
              </div>
              <h3>Exam subjects</h3>
              <p>Select the subjects scheduled for this class. Teacher tasks are assigned after the exam is created.</p>
              {courses.length === 0 && <p>No subject allocations are available for this class. Configure teaching allocations first.</p>}
              {courses.map(course => {
                const draft = subjects.find(item => item.courseOfferingId === course.courseOfferingId);
                return (
                  <div key={course.courseOfferingId} style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
                    <label><input type="checkbox" checked={!!draft} onChange={e => setSubjects(e.target.checked ? [...subjects, { courseOfferingId: course.courseOfferingId, name: course.course, totalMarks: "100", passingMarks: "40", examDate: form.startDate }] : subjects.filter(item => item.courseOfferingId !== course.courseOfferingId))} /> {course.course}</label>
                    {draft && <div className="human-form-grid">{([['totalMarks', 'Total marks'], ['passingMarks', 'Passing marks'], ['examDate', 'Exam date']] as const).map(([field, label]) => <label className="human-field" key={field}><span>{label}</span><input type={field === "examDate" ? "date" : "number"} min={field === "examDate" ? form.startDate : 0} max={field === "examDate" ? form.endDate : undefined} value={draft[field]} onChange={e => setSubjects(subjects.map(item => item.courseOfferingId === draft.courseOfferingId ? { ...item, [field]: e.target.value } : item))} /></label>)}</div>}
                  </div>
                );
              })}
              {error && <p className="form-error" role="alert">{error}</p>}
            </div>
            <div className="modal-actions"><button className="secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void createExam()}>{saving ? "Saving…" : "Create exam"}</button></div>
          </section>
        </div>
      )}

      {taskExam && <ExamTaskManager exam={taskExam} tenantId={tenantId} onClose={() => setTaskExam(null)} />}
      {activeTeacherTask && <TeacherTaskModal task={activeTeacherTask} tenantId={tenantId} onClose={() => setActiveTeacherTask(null)} onSaved={() => void teacherTasks.refetch()} />}
      {resultsExam && <ExamResults exam={resultsExam} tenantId={tenantId} canPublish={canPublish} onClose={() => setResultsExam(null)} onPublished={() => { setResultsExam({ ...resultsExam, status: "PUBLISHED" }); void exams.refetch(); }} />}
    </>
  );
}

function TeacherTaskPanel({ tenantId, tasks, loading, onRefresh, onOpen }: { tenantId: string; tasks: ExamTask[]; loading: boolean; onRefresh: () => void; onOpen: (task: ExamTask) => void }) {
  void tenantId;
  const openTasks = tasks.filter(task => task.status !== "COMPLETED");
  const overdue = openTasks.filter(task => task.isOverdue || task.status === "OVERDUE").length;
  return (
    <section className="surface" style={{ marginBottom: 20 }}>
      <div className="surface-head">
        <div className="surface-head-left"><h3>My examiner-assigned tasks</h3><p>{openTasks.length} active · {overdue} overdue · reminders are sent automatically from the due time.</p></div>
        <button className="icon-button" title="Refresh tasks" onClick={onRefresh}><RefreshCw size={16} /></button>
      </div>
      <div className="table-wrap sticky-head"><table className="premium-table">
        <thead><tr><th>Exam / Subject</th><th>Task</th><th>Due</th><th>Status</th><th>Submission</th><th style={{ textAlign: "right" }}>Action</th></tr></thead>
        <tbody>{loading ? <tr><td colSpan={6}>Loading assigned tasks…</td></tr> : tasks.length === 0 ? <tr><td colSpan={6}>No exam tasks are assigned to you.</td></tr> : tasks.map(task => <tr key={task.taskId}>
          <td><b>{task.exam}</b><small style={{ display: "block" }}>{task.classSection} · {task.subject}</small></td>
          <td>{task.taskType === "EXAM_PAPER" ? "Upload exam paper" : "Enter / update results"}<small style={{ display: "block" }}>{task.instructions || "No additional instructions"}</small></td>
          <td><Clock3 size={13} style={{ verticalAlign: "middle", marginRight: 5 }} />{dueLabel(task.dueAt)}</td>
          <td><span className={`status-pill ${taskStatusClass(task)}`}>{task.isOverdue && task.status !== "COMPLETED" ? "OVERDUE" : task.status}</span></td>
          <td>{task.submissionFileName || (task.submittedAt ? `Submitted ${dueLabel(task.submittedAt)}` : "Pending")}</td>
          <td style={{ textAlign: "right" }}><button className="primary" disabled={task.status === "COMPLETED"} onClick={() => onOpen(task)}>{task.taskType === "EXAM_PAPER" ? "Upload / update" : "Update results"}</button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
  );
}

function ExamTaskManager({ exam, tenantId, onClose }: { exam: Exam; tenantId: string; onClose: () => void }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editTask, setEditTask] = useState<ExamTask | null>(null);
  const [form, setForm] = useState({ examSubjectId: "", teacherCourseAssignmentId: "", taskType: "EXAM_PAPER", title: "", instructions: "", dueAt: "" });

  const options = useQuery({ queryKey: ["exam-task-options", tenantId, exam.id], queryFn: async () => (await api.get<{ items: TaskOption[] }>(`/api/examinations/exam/${exam.id}/task-options`, { params: { tenantId } })).data.items });
  const tasks = useQuery({ queryKey: ["exam-tasks", tenantId, exam.id], queryFn: async () => (await api.get<{ items: ExamTask[] }>(`/api/examinations/exam/${exam.id}/tasks`, { params: { tenantId } })).data.items });
  const selectedSubjectOptions = (options.data ?? []).filter(option => option.examSubjectId === form.examSubjectId);
  const subjectOptions = Array.from(new Map((options.data ?? []).map(option => [option.examSubjectId, option.subject])).entries());

  async function assignTask() {
    setError("");
    if (!form.examSubjectId || !form.teacherCourseAssignmentId || !form.taskType || !form.title.trim() || !form.dueAt) {
      setError("Select a subject, assigned teacher, task type and due time.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/api/examinations/exam/${exam.id}/tasks`, { tenantId, examId: exam.id, ...form, dueAt: new Date(form.dueAt).toISOString() });
      setAssignOpen(false);
      setForm({ examSubjectId: "", teacherCourseAssignmentId: "", taskType: "EXAM_PAPER", title: "", instructions: "", dueAt: "" });
      await tasks.refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function complete(task: ExamTask) {
    setError("");
    try {
      await api.post(`/api/examinations/tasks/${task.taskId}/complete`, null, { params: { tenantId } });
      await tasks.refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function reopen(task: ExamTask) {
    const next = window.prompt("New due date/time (YYYY-MM-DDTHH:mm)", task.dueAt.slice(0, 16));
    if (!next) return;
    setError("");
    try {
      await api.post(`/api/examinations/tasks/${task.taskId}/reopen`, { tenantId, taskId: task.taskId, dueAt: new Date(next).toISOString() });
      await tasks.refetch();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(1120px,98vw)" }} role="dialog" aria-modal="true" aria-label="Exam teacher tasks">
    <div className="modal-head"><div><h2>{exam.name} · Teacher tasks</h2><p>{exam.classSection} · Examiner assigns only teachers allocated to each subject.</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="human-form">
      <div className="page-actions" style={{ marginBottom: 14 }}><button className="primary" onClick={() => { setError(""); setAssignOpen(true); }}><Plus size={14} /> Assign task</button></div>
      {(error || options.error || tasks.error) && <p className="form-error" role="alert">{error || getErrorMessage(options.error || tasks.error)}</p>}
      <div className="table-wrap sticky-head"><table className="premium-table">
        <thead><tr><th>Subject / Teacher</th><th>Task</th><th>Due</th><th>Status</th><th>Submission</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
        <tbody>{tasks.isLoading ? <tr><td colSpan={6}>Loading tasks…</td></tr> : tasks.data?.length ? tasks.data.map(task => <tr key={task.taskId}>
          <td><b>{task.subject}</b><small style={{ display: "block" }}>{task.teacherName}</small></td>
          <td>{task.taskType === "EXAM_PAPER" ? "Exam paper" : "Result entry"}<small style={{ display: "block" }}>{task.title}</small></td>
          <td>{dueLabel(task.dueAt)}</td>
          <td><span className={`status-pill ${taskStatusClass(task)}`}>{task.isOverdue && task.status !== "COMPLETED" ? "OVERDUE" : task.status}</span></td>
          <td>{task.submissionFileName ? <a href={`/api/examinations/tasks/${task.taskId}/paper?tenantId=${tenantId}`} onClick={event => { event.preventDefault(); void api.get(`/api/examinations/tasks/${task.taskId}/paper`, { params: { tenantId }, responseType: "blob" }).then(response => { const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = task.submissionFileName || "exam-paper"; anchor.click(); URL.revokeObjectURL(url); }); }}><Download size={13} /> {task.submissionFileName}</a> : task.submittedAt ? `Submitted ${dueLabel(task.submittedAt)}` : "Pending"}</td>
          <td style={{ textAlign: "right" }}><div className="page-actions" style={{ justifyContent: "flex-end" }}><button className="soft-button" onClick={() => setEditTask(task)}>Edit due time</button>{task.status === "SUBMITTED" && <button className="primary" onClick={() => void complete(task)}><CheckCircle2 size={13} /> Complete</button>}{task.status === "COMPLETED" && <button className="secondary" onClick={() => void reopen(task)}>Reopen</button>}</div></td>
        </tr>) : <tr><td colSpan={6}>No teacher tasks assigned yet.</td></tr>}</tbody>
      </table></div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Close</button></div>

    {assignOpen && <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(680px,96vw)" }}>
      <div className="modal-head"><div><h2>Assign subject task</h2><p>The teacher list is restricted to the selected subject’s active teaching allocation.</p></div><button className="icon-button" onClick={() => setAssignOpen(false)}><X size={18} /></button></div>
      <div className="human-form"><div className="human-form-grid">
        <label className="human-field"><span>Subject *</span><select value={form.examSubjectId} onChange={e => setForm(current => ({ ...current, examSubjectId: e.target.value, teacherCourseAssignmentId: "" }))}><option value="">Select subject</option>{subjectOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="human-field"><span>Assigned teacher *</span><select value={form.teacherCourseAssignmentId} onChange={e => setForm(current => ({ ...current, teacherCourseAssignmentId: e.target.value }))}><option value="">Select teacher</option>{selectedSubjectOptions.map(option => <option key={option.teacherCourseAssignmentId} value={option.teacherCourseAssignmentId}>{option.teacherName}</option>)}</select></label>
        <label className="human-field"><span>Task *</span><select value={form.taskType} onChange={e => setForm(current => ({ ...current, taskType: e.target.value, title: e.target.value === "EXAM_PAPER" ? "Prepare and upload exam paper" : "Enter and submit subject results" }))}><option value="EXAM_PAPER">Upload exam paper</option><option value="RESULT_ENTRY">Enter / update results</option></select></label>
        <label className="human-field"><span>Due date & time *</span><input type="datetime-local" value={form.dueAt} onChange={e => setForm(current => ({ ...current, dueAt: e.target.value }))} /></label>
        <label className="human-field field-wide"><span>Task title *</span><input value={form.title} onChange={e => setForm(current => ({ ...current, title: e.target.value }))} /></label>
        <label className="human-field field-wide"><span>Instructions</span><textarea value={form.instructions} onChange={e => setForm(current => ({ ...current, instructions: e.target.value }))} placeholder="Paper format, chapters, moderation notes, result-entry instructions…" /></label>
      </div>{error && <p className="form-error">{error}</p>}</div>
      <div className="modal-actions"><button className="secondary" onClick={() => setAssignOpen(false)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void assignTask()}>{saving ? "Assigning…" : "Assign task"}</button></div>
    </section></div>}

    {editTask && <TaskDeadlineModal task={editTask} tenantId={tenantId} onClose={() => setEditTask(null)} onSaved={async () => { setEditTask(null); await tasks.refetch(); }} />}
  </section></div>;
}

function TaskDeadlineModal({ task, tenantId, onClose, onSaved }: { task: ExamTask; tenantId: string; onClose: () => void; onSaved: () => Promise<void> }) {
  const [dueAt, setDueAt] = useState(task.dueAt.slice(0, 16));
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true); setError("");
    try {
      await api.put(`/api/examinations/tasks/${task.taskId}`, { tenantId, taskId: task.taskId, dueAt: new Date(dueAt).toISOString(), instructions: instructions.trim() || null });
      await onSaved();
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(560px,96vw)" }}>
    <div className="modal-head"><div><h2>Update task deadline</h2><p>{task.teacherName} · {task.subject}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="human-form"><div className="human-form-grid"><label className="human-field"><span>Due date & time</span><input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} /></label><label className="human-field field-wide"><span>Instructions</span><textarea value={instructions} onChange={e => setInstructions(e.target.value)} /></label></div>{error && <p className="form-error">{error}</p>}</div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save changes"}</button></div>
  </section></div>;
}

function TeacherTaskModal({ task, tenantId, onClose, onSaved }: { task: ExamTask; tenantId: string; onClose: () => void; onSaved: () => void }) {
  if (task.taskType === "RESULT_ENTRY") {
    return <TaskResultEntryModal task={task} tenantId={tenantId} onClose={onClose} onSaved={onSaved} />;
  }
  return <PaperUploadModal task={task} tenantId={tenantId} onClose={onClose} onSaved={onSaved} />;
}

function PaperUploadModal({ task, tenantId, onClose, onSaved }: { task: ExamTask; tenantId: string; onClose: () => void; onSaved: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(task.submissionNotes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function upload() {
    if (!file) { setError("Select a PDF, DOC or DOCX exam paper."); return; }
    const data = new FormData(); data.append("file", file); data.append("notes", notes);
    setSaving(true); setError("");
    try {
      await api.post(`/api/examinations/tasks/${task.taskId}/paper`, data, { params: { tenantId }, headers: { "Content-Type": "multipart/form-data" } });
      onSaved(); onClose();
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(620px,96vw)" }}>
    <div className="modal-head"><div><h2>Upload exam paper</h2><p>{task.exam} · {task.subject} · Due {dueLabel(task.dueAt)}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="human-form"><div className="human-form-grid"><label className="human-field field-wide"><span>Exam paper *</span><input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label><label className="human-field field-wide"><span>Submission notes</span><textarea value={notes} onChange={e => setNotes(e.target.value)} /></label></div><p>Maximum 15 MB. You can replace the file until the deadline or until the Examiner marks the task complete.</p>{error && <p className="form-error">{error}</p>}</div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={saving || task.isOverdue} onClick={() => void upload()}><FileUp size={14} /> {saving ? "Uploading…" : "Upload / update paper"}</button></div>
  </section></div>;
}

function TaskResultEntryModal({ task, tenantId, onClose, onSaved }: { task: ExamTask; tenantId: string; onClose: () => void; onSaved: () => void }) {
  const roster = useQuery({ queryKey: ["exam-task-results", tenantId, task.taskId], queryFn: async () => (await api.get<ResultTaskRoster>(`/api/examinations/tasks/${task.taskId}/results`, { params: { tenantId } })).data });
  const [drafts, setDrafts] = useState<ResultDraft[]>([]);
  const [notes, setNotes] = useState(task.submissionNotes ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (roster.data) setDrafts(roster.data.rows.map(row => ({ ...row, marks: row.marksObtained == null ? "" : String(row.marksObtained) }))); }, [roster.data]);
  function update(studentId: string, patch: Partial<ResultDraft>) { setDrafts(items => items.map(item => item.studentId === studentId ? { ...item, ...patch, dirty: true } : item)); }
  async function save() {
    const changed = drafts.filter(row => row.dirty);
    if (changed.length === 0) { setError("Update at least one student result."); return; }
    if (changed.some(row => !row.isAbsent && (row.marks === "" || !Number.isFinite(Number(row.marks))))) { setError("Enter marks or mark the student absent."); return; }
    setSaving(true); setError("");
    try {
      await api.put(`/api/examinations/tasks/${task.taskId}/results`, { tenantId, taskId: task.taskId, notes: notes.trim() || null, rows: changed.map(row => ({ studentId: row.studentId, marksObtained: row.isAbsent ? null : Number(row.marks), isAbsent: row.isAbsent, remarks: row.remarks })) });
      await roster.refetch(); onSaved();
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(1080px,98vw)" }}>
    <div className="modal-head"><div><h2>Update assigned results</h2><p>{task.exam} · {task.subject} · Due {dueLabel(task.dueAt)}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="human-form">{(error || roster.error) && <p className="form-error">{error || getErrorMessage(roster.error)}</p>}<div className="table-wrap sticky-head"><table className="premium-table"><thead><tr><th>Student</th><th>Marks / {roster.data?.totalMarks ?? "—"}</th><th>Absent</th><th>Remarks</th></tr></thead><tbody>{roster.isLoading ? <tr><td colSpan={4}>Loading roster…</td></tr> : drafts.map(row => <tr key={row.studentId}><td><b>{row.studentName}</b><small style={{ display: "block" }}>{row.studentNumber}</small></td><td><input type="number" min={0} max={roster.data?.totalMarks} disabled={row.isAbsent || task.isOverdue} value={row.marks} onChange={e => update(row.studentId, { marks: e.target.value })} style={{ width: 100 }} /></td><td><input type="checkbox" disabled={task.isOverdue} checked={row.isAbsent} onChange={e => update(row.studentId, { isAbsent: e.target.checked })} /></td><td><input disabled={task.isOverdue} value={row.remarks ?? ""} onChange={e => update(row.studentId, { remarks: e.target.value })} /></td></tr>)}</tbody></table></div><label className="human-field field-wide"><span>Submission notes</span><textarea value={notes} onChange={e => setNotes(e.target.value)} /></label></div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Close</button><button className="primary" disabled={saving || task.isOverdue} onClick={() => void save()}><Save size={14} /> {saving ? "Saving…" : "Save assigned results"}</button></div>
  </section></div>;
}

function ExamResults({ exam, tenantId, canPublish, onClose, onPublished }: { exam: Exam; tenantId: string; canPublish: boolean; onClose: () => void; onPublished: () => void }) {
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const results = useQuery({ queryKey: ["exam-results", tenantId, exam.id], queryFn: async () => (await api.get<{ subjects: Subject[]; rows: ResultRow[] }>(`/api/examinations/exam/${exam.id}/results`, { params: { tenantId } })).data });
  useEffect(() => { if (results.data) setSubjectId(value => value || results.data.subjects[0]?.id || ""); }, [results.data]);
  const subject = results.data?.subjects.find(item => item.id === subjectId);
  const rows = useMemo(() => (results.data?.rows ?? []).filter(row => row.examSubjectId === subjectId), [results.data, subjectId]);
  async function publish() {
    setSaving(true); setError("");
    try { await api.post(`/api/examinations/exam/${exam.id}/publish`, { tenantId, examId: exam.id }); onPublished(); setNotice("Results published. Students and parents can now view them."); }
    catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(1080px,98vw)" }} role="dialog" aria-modal="true" aria-label="Exam results">
    <div className="modal-head"><div><h2>{exam.name}</h2><p>{exam.classSection} · {exam.status}</p></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="human-form"><label className="human-field"><span>Subject</span><select value={subjectId} onChange={e => setSubjectId(e.target.value)}>{results.data?.subjects.map(item => <option key={item.id} value={item.id}>{item.name} · {item.examDate} · {item.totalMarks} marks</option>)}</select></label>{(error || results.error) && <p className="form-error">{error || getErrorMessage(results.error)}</p>}{notice && <p role="status">{notice}</p>}<div className="table-wrap sticky-head"><table className="premium-table"><thead><tr><th>Student</th><th>Marks / {subject?.totalMarks ?? "—"}</th><th>Absent</th><th>%</th><th>Grade</th><th>Result</th><th>Remarks</th></tr></thead><tbody>{results.isLoading ? <tr><td colSpan={7}>Loading results…</td></tr> : rows.length === 0 ? <tr><td colSpan={7}>No results entered for this subject yet.</td></tr> : rows.map(row => <tr key={row.studentId}><td><b>{row.studentName}</b><small style={{ display: "block" }}>{row.studentNumber}</small></td><td>{row.isAbsent ? "—" : row.marksObtained ?? "Pending"}</td><td>{row.isAbsent ? "Yes" : "No"}</td><td>{row.percentage ?? "—"}</td><td>{row.grade ?? "—"}</td><td>{row.isAbsent ? "Absent" : row.marksObtained == null ? "Pending" : Number(row.marksObtained) >= Number(subject?.passingMarks ?? 0) ? "Passed" : "Failed"}</td><td>{row.remarks || "—"}</td></tr>)}</tbody></table></div></div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Close</button>{canPublish && exam.status !== "PUBLISHED" && <button className="primary" disabled={saving} onClick={() => void publish()}><Send size={14} /> {saving ? "Publishing…" : "Publish completed results"}</button>}</div>
  </section></div>;
}
