import { GradeScalePanel } from "./GradeScalePanel";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Save, Send, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Pagination } from "../../../components/ui/Pagination";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";

type Exam = { id: string; name: string; code: string; examTypeCode: string; classSection: string; startDate: string; endDate: string; status: string; subjectCount: number };
type Allocation = { classSectionId: string; classSection: string; courseOfferingId: string; course: string };
type Subject = { id: string; name: string; totalMarks: number; passingMarks: number | null; examDate: string };
type ResultRow = { studentId: string; studentName: string; studentNumber: string; examSubjectId: string; resultId: string | null; marksObtained: number | null; percentage: number | null; grade: string | null; isAbsent: boolean; remarks: string | null };
type Draft = ResultRow & { marks: string; dirty?: boolean };
type SubjectDraft = { courseOfferingId: string; name: string; totalMarks: string; passingMarks: string; examDate: string };

export function ExaminationsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const permissions = usePermissions();
  const canManage = permissions.can("exams.manage") || permissions.can("exams.enter.marks");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", classSectionId: "", examTypeCode: "MID_TERM", startDate: "", endDate: "" });
  const [subjects, setSubjects] = useState<SubjectDraft[]>([]);
  const exams = useQuery({ queryKey: ["exams", tenantId, page, pageSize], enabled: !!tenantId,
    queryFn: async () => (await api.get<{ items: Exam[]; totalCount: number }>("/api/examinations/exam", { params: { tenantId, page, pageSize } })).data });
  const setup = useQuery({ queryKey: ["exam-setup", tenantId], enabled: !!tenantId && canManage,
    queryFn: async () => (await api.get<{ items: Allocation[] }>("/api/examinations/setup", { params: { tenantId } })).data.items });
  const allocations = setup.data ?? [];
  const classes = Array.from(new Map(allocations.map(item => [item.classSectionId, item.classSection])).entries());
  const courses = allocations.filter(item => item.classSectionId === form.classSectionId);

  async function createExam() {
    setError("");
    if (!form.name.trim() || !form.classSectionId || !form.startDate || !form.endDate || subjects.length === 0) {
      setError("Enter a name, class, dates and at least one subject."); return;
    }
    setSaving(true);
    try {
      await api.post("/api/examinations/exam", { ...form, tenantId, subjects: subjects.map(item => ({
        courseOfferingId: item.courseOfferingId, totalMarks: Number(item.totalMarks),
        passingMarks: Number(item.passingMarks), examDate: item.examDate || form.startDate,
      })) });
      setOpen(false); setSubjects([]); setForm({ name: "", classSectionId: "", examTypeCode: "MID_TERM", startDate: "", endDate: "" });
      await exams.refetch();
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }

  return <>
    <PageHeader title="Examinations" subtitle="Schedule subjects, record marks and publish results for students and parents."
      action={canManage ? <button className="primary" onClick={() => { setError(""); setOpen(true); }}><Plus size={16}/> Schedule exam</button> : undefined}/>
    {(error || exams.error || setup.error) && <p className="form-error" role="alert">{error || getErrorMessage(exams.error || setup.error)}</p>}
    <section className="surface">
      <div className="surface-head"><h3>{canManage ? "Exam schedule" : "Published results"}</h3><p>{exams.data?.totalCount ?? 0} exams</p></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Exam</th><th>Class</th><th>Dates</th><th>Subjects</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>{exams.isLoading ? <tr><td colSpan={6}>Loading exams…</td></tr> : exams.data?.items.length ? exams.data.items.map(exam => <tr key={exam.id}>
          <td><b>{exam.name}</b><small style={{ display: "block" }}>{exam.code} · {exam.examTypeCode}</small></td><td>{exam.classSection}</td>
          <td>{exam.startDate} – {exam.endDate}</td><td>{exam.subjectCount}</td><td><span className={`status-pill ${exam.status === "PUBLISHED" ? "success" : "info"}`}>{exam.status}</span></td>
          <td><button className="secondary" onClick={() => setSelected(exam)}>{canManage && exam.status !== "PUBLISHED" ? "Enter marks" : "View results"}</button></td>
        </tr>) : <tr><td colSpan={6}>No exams are available.</td></tr>}</tbody>
      </table></div>
      <Pagination page={page} pageSize={pageSize} total={exams.data?.totalCount ?? 0} onPage={setPage} onPageSize={setPageSize}/>
    </section>
    {canManage && <GradeScalePanel tenantId={tenantId}/>}
    {open && <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(850px,96vw)" }} role="dialog" aria-modal="true" aria-label="Schedule exam">
      <div className="modal-head"><h2>Schedule exam</h2><button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button></div>
      <div className="human-form"><div className="human-form-grid">
        <label className="human-field field-wide"><span>Exam name *</span><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label className="human-field"><span>Class section *</span><select value={form.classSectionId} onChange={e => { setForm({ ...form, classSectionId: e.target.value }); setSubjects([]); }}><option value="">Select class</option>{classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="human-field"><span>Exam type</span><select value={form.examTypeCode} onChange={e => setForm({ ...form, examTypeCode: e.target.value })}>{["UNIT_TEST", "MID_TERM", "FINAL", "ANNUAL", "MOCK", "ENTRANCE", "OLEVEL", "ALEVEL"].map(type => <option key={type}>{type}</option>)}</select></label>
        <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}/></label>
        <label className="human-field"><span>End date *</span><input type="date" min={form.startDate} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}/></label>
      </div><h3>Exam subjects</h3><p>Select courses allocated to this class. Marks and dates are saved for each subject.</p>
      {courses.length === 0 && <p>No course allocations are available for this class. Add teaching allocations in Academic Setup first.</p>}
      {courses.map(course => { const draft = subjects.find(item => item.courseOfferingId === course.courseOfferingId); return <div key={course.courseOfferingId} style={{ padding: 10, borderBottom: "1px solid var(--line)" }}>
        <label><input type="checkbox" checked={!!draft} onChange={e => setSubjects(e.target.checked ? [...subjects, { courseOfferingId: course.courseOfferingId, name: course.course, totalMarks: "100", passingMarks: "40", examDate: form.startDate }] : subjects.filter(item => item.courseOfferingId !== course.courseOfferingId))}/> {course.course}</label>
        {draft && <div className="human-form-grid">{([['totalMarks', 'Total marks'], ['passingMarks', 'Passing marks'], ['examDate', 'Exam date']] as const).map(([field, label]) => <label className="human-field" key={field}><span>{label}</span><input type={field === "examDate" ? "date" : "number"} min={field === "examDate" ? form.startDate : 0} max={field === "examDate" ? form.endDate : undefined} value={draft[field]} onChange={e => setSubjects(subjects.map(item => item.courseOfferingId === draft.courseOfferingId ? { ...item, [field]: e.target.value } : item))}/></label>)}</div>}
      </div>; })}
      {error && <p className="form-error" role="alert">{error}</p>}</div>
      <div className="modal-actions"><button className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void createExam()}>{saving ? "Saving…" : "Schedule exam"}</button></div>
    </section></div>}
    {selected && <ExamResults exam={selected} tenantId={tenantId} canManage={canManage} onClose={() => setSelected(null)} onPublished={() => { setSelected({ ...selected, status: "PUBLISHED" }); void exams.refetch(); }}/>} 
  </>;
}

function ExamResults({ exam, tenantId, canManage, onClose, onPublished }: { exam: Exam; tenantId: string; canManage: boolean; onClose: () => void; onPublished: () => void }) {
  const [subjectId, setSubjectId] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const editable = canManage && exam.status !== "PUBLISHED";
  const results = useQuery({ queryKey: ["exam-results", tenantId, exam.id],
    queryFn: async () => (await api.get<{ subjects: Subject[]; rows: ResultRow[] }>(`/api/examinations/exam/${exam.id}/results`, { params: { tenantId } })).data });
  useEffect(() => { if (results.data) { setDrafts(results.data.rows.map(row => ({ ...row, marks: row.marksObtained === null ? "" : String(row.marksObtained) }))); setSubjectId(value => value || results.data.subjects[0]?.id || ""); } }, [results.data]);
  const subject = results.data?.subjects.find(item => item.id === subjectId);
  const rows = useMemo(() => drafts.filter(row => row.examSubjectId === subjectId), [drafts, subjectId]);
  const dirty = drafts.filter(row => row.dirty);
  function update(row: Draft, patch: Partial<Draft>) { setNotice(""); setDrafts(items => items.map(item => item.studentId === row.studentId && item.examSubjectId === row.examSubjectId ? { ...item, ...patch, dirty: true } : item)); }
  async function save() {
    setError("");
    if (dirty.some(row => !row.isAbsent && (row.marks === "" || !Number.isFinite(Number(row.marks))))) { setError("Enter marks or mark absent for each changed student."); return; }
    setSaving(true);
    try {
      await api.put(`/api/examinations/exam/${exam.id}/results`, { tenantId, examId: exam.id, rows: dirty.map(row => ({ studentId: row.studentId, examSubjectId: row.examSubjectId, marksObtained: row.isAbsent ? null : Number(row.marks), isAbsent: row.isAbsent, remarks: row.remarks })) });
      await results.refetch(); setNotice("Results saved.");
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  async function publish() {
    setSaving(true); setError("");
    try { await api.post(`/api/examinations/exam/${exam.id}/publish`, { tenantId, examId: exam.id }); onPublished(); setNotice("Results published. Students and parents can now view them."); }
    catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  return <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(1080px,98vw)" }} role="dialog" aria-modal="true" aria-label="Exam results">
    <div className="modal-head"><div><h2>{exam.name}</h2><p>{exam.classSection} · {exam.status}</p></div><button className="icon-button" onClick={onClose}><X size={18}/></button></div>
    <div className="human-form">
      <label className="human-field"><span>Subject</span><select value={subjectId} onChange={e => setSubjectId(e.target.value)}>{results.data?.subjects.map(item => <option key={item.id} value={item.id}>{item.name} · {item.examDate} · {item.totalMarks} marks</option>)}</select></label>
      {(error || results.error) && <p className="form-error" role="alert">{error || getErrorMessage(results.error)}</p>}{notice && <p role="status">{notice}</p>}
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Marks / {subject?.totalMarks ?? "—"}</th><th>Absent</th><th>%</th><th>Grade</th><th>Result</th><th>Remarks</th></tr></thead><tbody>
        {results.isLoading ? <tr><td colSpan={7}>Loading enrolled students…</td></tr> : rows.length === 0 ? <tr><td colSpan={7}>No enrolled students are available for this subject.</td></tr> : rows.map(row => <tr key={row.studentId}>
          <td><b>{row.studentName}</b><small style={{ display: "block" }}>{row.studentNumber}</small></td><td><input aria-label={`Marks for ${row.studentName}`} type="number" min={0} max={subject?.totalMarks} step="0.01" disabled={!editable || row.isAbsent} value={row.marks} onChange={e => update(row, { marks: e.target.value })} style={{ width: 90 }}/></td>
          <td><input type="checkbox" aria-label={`${row.studentName} absent`} disabled={!editable} checked={row.isAbsent} onChange={e => update(row, { isAbsent: e.target.checked })}/></td>
          <td>{row.dirty ? "Save to calculate" : row.percentage ?? "—"}</td><td>{row.dirty ? "—" : row.grade ?? "—"}</td><td>{row.isAbsent ? "Absent" : row.marks === "" ? "Pending" : Number(row.marks) >= (subject?.passingMarks ?? 0) ? "Passed" : "Failed"}</td>
          <td><input aria-label={`Remarks for ${row.studentName}`} disabled={!editable} value={row.remarks ?? ""} onChange={e => update(row, { remarks: e.target.value })}/></td>
        </tr>)}
      </tbody></table></div>
    </div>
    <div className="modal-actions"><button className="secondary" onClick={onClose}>Close</button>{editable && <><button className="primary" disabled={saving || dirty.length === 0} onClick={() => void save()}><Save size={14}/> Save {dirty.length ? `(${dirty.length})` : ""}</button><button className="primary" disabled={saving || dirty.length > 0 || !drafts.length} onClick={() => void publish()}><Send size={14}/> Publish all results</button></>}</div>
  </section></div>;
}
