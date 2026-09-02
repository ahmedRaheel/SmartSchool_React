/**
 * ExaminationsPage — Production-grade exam management
 * ─ Create and schedule exams
 * ─ Enter marks per student per subject (inline editable grid)
 * ─ Auto-compute grade + grade point from configured scale
 * ─ Publish results with one click → status changes to PUBLISHED
 * ─ Grade scale configuration
 */
import { useState, useMemo, useRef } from "react";
import { Pagination } from "../../../components/ui/Pagination";
import {
  ClipboardCheck, Plus, Search, X, BookOpen, CheckCircle2,
  AlertCircle, Edit3, Save, Send, Eye, Lock, Unlock, Trophy,
} from "lucide-react";
import { PageHeader }  from "../../../components/ui/PageHeader";
import { StatCard }    from "../../../components/ui/StatCard";
import {
  useExams, useCreateExam, useGradeScales, useCreateGradeScale,
  useExamResults, useCampuses, useStudents, useClassSections,
} from "../../../core/api/queries";
import * as A from "../../../core/api/apiAdapter";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

// ─ types ────────────────────────────────────────────────────────────────────
interface GradeScaleEntry { name: string; min: number; max: number; gradePoint: string; }
interface ResultRow {
  studentId: string; name: string; regNo: string;
  marksObtained: number | ""; percentage: number | "";
  grade: string; gradePoint: string; status: string; dirty: boolean;
}

const EXAM_TYPES = ["UNIT_TEST","MID_TERM","FINAL","ANNUAL","MOCK","ENTRANCE","OLEVEL","ALEVEL"];
const SUBJECTS   = ["Mathematics","Physics","Chemistry","English","Urdu","Computer Science","Biology","History","Islamiyat","Pakistan Studies"];

function parseMeta(j?: string | null) { try { return JSON.parse(j ?? "{}"); } catch { return {}; } }

// Mock students for result entry
const MOCK_STUDENTS_RESULT: ResultRow[] = [
  { studentId:"s1", name:"Ahmed Hassan",    regNo:"2024-0921", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s2", name:"Sara Butt",       regNo:"2024-0922", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s3", name:"Hassan Noor",     regNo:"2024-0923", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s4", name:"Mariam Shah",     regNo:"2024-0924", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s5", name:"Danish Ali",      regNo:"2024-0925", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s6", name:"Zara Khan",       regNo:"2024-0926", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s7", name:"Farrukh Rashid",  regNo:"2024-0927", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
  { studentId:"s8", name:"Nadia Imran",     regNo:"2024-0928", marksObtained:"", percentage:"", grade:"", gradePoint:"", status:"PENDING", dirty:false },
];

const DEFAULT_SCALE: GradeScaleEntry[] = [
  { name:"A+", min:90, max:100, gradePoint:"4.0" },
  { name:"A",  min:80, max:89,  gradePoint:"3.7" },
  { name:"B+", min:70, max:79,  gradePoint:"3.3" },
  { name:"B",  min:60, max:69,  gradePoint:"3.0" },
  { name:"C",  min:50, max:59,  gradePoint:"2.0" },
  { name:"D",  min:40, max:49,  gradePoint:"1.0" },
  { name:"F",  min:0,  max:39,  gradePoint:"0.0" },
];

function computeGrade(pct: number, scale: GradeScaleEntry[]): { grade: string; gradePoint: string; status: string } {
  const entry = scale.find(s => pct >= s.min && pct <= s.max);
  return { grade: entry?.name ?? "F", gradePoint: entry?.gradePoint ?? "0.0", status: pct >= 40 ? "PASSED" : "FAILED" };
}

// ─ Marks Entry Grid ─────────────────────────────────────────────────────────
function MarksEntryGrid({ exam, scale, onClose }: { exam: any; scale: GradeScaleEntry[]; onClose: () => void }) {
  const meta = parseMeta(exam.metadataJson);
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  const totalMarks = meta.marks ?? 100;
  const [subject, setSubject]     = useState(SUBJECTS[0]);
  const [rows, setRows]           = useState<ResultRow[]>((env.useMocks ? MOCK_STUDENTS_RESULT : []).map(r => ({ ...r })));
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const dirtyCount = rows.filter(r => r.dirty).length;
  const enteredCount = rows.filter(r => r.marksObtained !== "").length;
  const passCount = rows.filter(r => r.status === "PASSED").length;
  const avgPct = enteredCount > 0
    ? Math.round(rows.filter(r => r.percentage !== "").reduce((a, r) => a + Number(r.percentage), 0) / enteredCount)
    : 0;

  function updateMarks(studentId: string, raw: string) {
    const val = raw === "" ? "" : Math.min(totalMarks, Math.max(0, Number(raw)));
    setRows(prev => prev.map(r => {
      if (r.studentId !== studentId) return r;
      if (val === "") return { ...r, marksObtained: "", percentage: "", grade: "", gradePoint: "", status: "PENDING", dirty: true };
      const pct = Math.round((Number(val) / totalMarks) * 100);
      const { grade, gradePoint, status } = computeGrade(pct, scale);
      return { ...r, marksObtained: Number(val), percentage: pct, grade, gradePoint, status, dirty: true };
    }));
    setSaved(false);
  }

  // Tab key moves to next student
  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault();
      const next = rows[idx + 1];
      if (next) inputRefs.current[next.studentId]?.focus();
    }
  }

  async function saveAll() {
    setSaving(true);
    try {
      await Promise.all(
        rows.filter(r => r.dirty && r.marksObtained !== "").map(r =>
          A.enterExamResult({
            tenantId: tid, studentId: r.studentId, examId: exam.id,
            subject, marksObtained: r.marksObtained, percentage: r.percentage,
            grade: r.grade, gradePoint: r.gradePoint, status: r.status,
          })
        )
      );
      setRows(prev => prev.map(r => ({ ...r, dirty: false })));
      setSaved(true);
    } catch { /* toast in real app */ }
    setSaving(false);
  }

  async function publish() {
    if (enteredCount < rows.length) {
      if (!confirm("Not all students have marks entered. Publish anyway?")) return;
    }
    setPublishing(true);
    try { await A.publishResults(exam.id, tid); setPublished(true); }
    catch { /* toast */ }
    setPublishing(false);
  }

  const GRADE_COLOR: Record<string, string> = { "A+":"#059669","A":"#059669","B+":"#2563EB","B":"#2563EB","C":"#D97706","D":"#9333EA","F":"#DC2626" };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(860px,98vw)", maxHeight: "94vh" }}>
        {/* Header */}
        <div className="modal-head" style={{ background: "var(--surface)", borderRadius: "var(--r-xl) var(--r-xl) 0 0" }}>
          <div>
            <h2 style={{ fontSize: 17, letterSpacing: "-.4px" }}>{exam.name}</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
              Total marks: <b>{totalMarks}</b> · Enter marks below — grade is auto-computed
            </p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--line)", display: "flex", gap: 10, alignItems: "center", background: "var(--surface-2)" }}>
          <label style={{ fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            Subject:
            <select value={subject} onChange={e => setSubject(e.target.value)}
              style={{ height: 34, padding: "0 10px", border: "1.5px solid var(--line)", borderRadius: 9, background: "var(--surface)", fontSize: 12 }}>
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Summary chips */}
            <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--surface)", border: "1px solid var(--line)" }}>
              {enteredCount}/{rows.length} entered
            </span>
            {enteredCount > 0 && (
              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "var(--success-bg)", border: "1px solid var(--success-border)", color: "var(--success)" }}>
                Avg {avgPct}% · {passCount} passed
              </span>
            )}
            {saved && !dirtyCount && (
              <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>✓ Saved</span>
            )}
            {dirtyCount > 0 && (
              <button className="primary" style={{ height: 34, fontSize: 12, gap: 5 }} onClick={saveAll} disabled={saving}>
                <Save size={13} /> {saving ? "Saving…" : `Save (${dirtyCount} unsaved)`}
              </button>
            )}
            {!published ? (
              <button onClick={publish} disabled={publishing || enteredCount === 0}
                style={{ height: 34, padding: "0 16px", borderRadius: 9, border: "none", background: enteredCount > 0 ? "#7C3AED" : "var(--line)", color: enteredCount > 0 ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: enteredCount > 0 ? "pointer" : "not-allowed" }}>
                <Send size={13} /> {publishing ? "Publishing…" : "Publish results"}
              </button>
            ) : (
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7C3AED", display: "flex", alignItems: "center", gap: 5 }}>
                <Trophy size={14} /> Results published
              </span>
            )}
          </div>
        </div>

        {/* Marks grid */}
        <div style={{ overflow: "auto", maxHeight: "calc(94vh - 180px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ position: "sticky", top: 0, zIndex: 1 }}>
                {["#","Student","Reg #","Marks obtained","/ "+totalMarks,"Percentage","Grade","Grade point","Status"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 14px", background: "var(--surface-2)", borderBottom: "1.5px solid var(--line)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".7px", color: "var(--muted)", textAlign: i <= 2 ? "left" : "center", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.studentId} style={{ background: row.dirty ? "rgba(14,165,233,.04)" : "" }}>
                  <td style={{ padding: "10px 14px", color: "var(--muted)", fontSize: 11, borderBottom: "1px solid var(--line)" }}>{idx + 1}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--indigo-soft)", color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {row.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <b style={{ fontSize: 12 }}>{row.name}</b>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)" }}>
                    <code style={{ fontSize: 11, color: "var(--muted)" }}>{row.regNo}</code>
                  </td>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
                    <input
                      ref={el => { inputRefs.current[row.studentId] = el; }}
                      type="number" min={0} max={totalMarks}
                      value={row.marksObtained}
                      onChange={e => updateMarks(row.studentId, e.target.value)}
                      onKeyDown={e => handleKeyDown(e, idx)}
                      placeholder="—"
                      style={{
                        width: 70, height: 34, textAlign: "center",
                        border: `2px solid ${row.dirty ? "var(--accent)" : "var(--line)"}`,
                        borderRadius: 8, background: "var(--surface)", fontSize: 13,
                        fontWeight: 700, color: "var(--text)", outline: "none",
                        transition: "border-color .15s",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>/{totalMarks}</td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
                    <b style={{ fontSize: 13, color: row.percentage !== "" ? (Number(row.percentage) >= 50 ? "var(--success)" : "var(--danger)") : "var(--muted)" }}>
                      {row.percentage !== "" ? `${row.percentage}%` : "—"}
                    </b>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
                    {row.grade ? (
                      <span style={{ fontWeight: 800, fontSize: 15, color: GRADE_COLOR[row.grade] ?? "var(--muted)" }}>{row.grade}</span>
                    ) : <span style={{ color: "var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{row.gradePoint || "—"}</span>
                  </td>
                  <td style={{ padding: "10px 14px", borderBottom: "1px solid var(--line)", textAlign: "center" }}>
                    <span className={`status-pill ${row.status === "PASSED" ? "success" : row.status === "FAILED" ? "danger" : "gray"}`} style={{ fontSize: 9 }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {enteredCount > 0 && (
              <tfoot>
                <tr style={{ background: "var(--surface-2)" }}>
                  <td colSpan={5} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "var(--muted)", borderTop: "2px solid var(--line)" }}>Class summary</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", borderTop: "2px solid var(--line)" }}>
                    <b style={{ color: avgPct >= 50 ? "var(--success)" : "var(--danger)" }}>{avgPct}%</b>
                  </td>
                  <td colSpan={3} style={{ padding: "12px 14px", textAlign: "center", borderTop: "2px solid var(--line)", fontSize: 11, color: "var(--muted)" }}>
                    {passCount} passed · {enteredCount - passCount} failed · {rows.length - enteredCount} not entered
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

// ─ Main Page ────────────────────────────────────────────────────────────────
export function ExaminationsPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab] = useState<"exams" | "grades" | "results">("exams");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [gsOpen, setGsOpen] = useState(false);
  const [markEntry, setMarkEntry] = useState<any | null>(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", examType: "MID_TERM", campusId: "", startDate: "",
    endDate: "", totalMarks: "500", passMarks: "200", description: "",
  });
  const [gsForm, setGsForm] = useState({ name: "", minPercent: "", maxPercent: "", gradePoint: "" });

  const { data, isLoading } = useExams();
  const { data: scalesData } = useGradeScales();
  const { data: resultsData } = useExamResults();
  const { data: campusesData } = useCampuses();
  const createExam = useCreateExam();
  const createGradeScale = useCreateGradeScale();

  const items    = (data as any)?.items       ?? (data as any) ?? [];
  const scales   = (scalesData as any)?.items ?? (scalesData as any) ?? [];
  const results  = (resultsData as any)?.items ?? (resultsData as any) ?? [];
  const campuses = (campusesData as any)?.items ?? (campusesData as any) ?? [];

  // Build scale from DB or use defaults
  const activeScale: GradeScaleEntry[] = scales.length > 0
    ? scales.map((s: any) => { const m = parseMeta(s.metadataJson); return { name: s.name, min: m.minPercent ?? 0, max: m.maxPercent ?? 100, gradePoint: m.gradePoint ?? "0.0" }; })
    : DEFAULT_SCALE;

  const sf  = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
  const gsf = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setGsForm(p => ({ ...p, [k]: e.target.value }));

  const filtered = useMemo(() => items.filter((e: any) =>
    `${e.name} ${parseMeta(e.metadataJson).type ?? ""}`.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  async function saveExam() {
    if (!form.name || !form.startDate) { setError("Name and start date are required"); return; }
    try {
      await createExam.mutateAsync({
        tenantId: tid, name: form.name,
        metadataJson: JSON.stringify({
          type: form.examType, campusId: form.campusId || undefined,
          start: form.startDate, end: form.endDate || form.startDate,
          marks: Number(form.totalMarks), passMarks: Number(form.passMarks),
          description: form.description, status: "SCHEDULED",
        }),
      });
      setOpen(false);
      setForm({ name: "", examType: "MID_TERM", campusId: "", startDate: "", endDate: "", totalMarks: "500", passMarks: "200", description: "" });
      setError("");
    } catch (e: any) { setError(e?.message ?? "Failed to create exam"); }
  }

  async function saveGradeScale() {
    if (!gsForm.name || !gsForm.minPercent || !gsForm.maxPercent) { setError("All fields required"); return; }
    try {
      await createGradeScale.mutateAsync({
        tenantId: tid, name: gsForm.name,
        metadataJson: JSON.stringify({ minPercent: Number(gsForm.minPercent), maxPercent: Number(gsForm.maxPercent), gradePoint: gsForm.gradePoint }),
      });
      setGsOpen(false); setGsForm({ name: "", minPercent: "", maxPercent: "", gradePoint: "" }); setError("");
    } catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  const scheduled = items.filter((e: any) => parseMeta(e.metadataJson).status === "SCHEDULED").length;
  const active    = items.filter((e: any) => ["IN_PROGRESS", "RESULT_ENTRY"].includes(parseMeta(e.metadataJson).status ?? "")).length;
  const published = items.filter((e: any) => parseMeta(e.metadataJson).status === "PUBLISHED").length;

  const STATUS_PILL: Record<string, string> = { SCHEDULED: "info", IN_PROGRESS: "warning", RESULT_ENTRY: "warning", PUBLISHED: "success", CANCELLED: "danger", DRAFT: "gray" };

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle="Schedule exams, enter marks student-by-student, auto-compute grades, publish results"
        action={
          <div className="page-actions">
            {tab === "exams"  && <button className="primary" onClick={() => { setOpen(true); setError(""); }}><Plus size={14} /> Schedule exam</button>}
            {tab === "grades" && <button className="primary" onClick={() => { setGsOpen(true); setError(""); }}><Plus size={14} /> Add grade boundary</button>}
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total exams"      value={String(items.length)} note="" color="#2563EB" bg="#EFF6FF"><ClipboardCheck size={20} /></StatCard>
        <StatCard label="Scheduled"        value={String(scheduled)}   note="" color="#D97706" bg="#FFFBEB"><BookOpen size={20} /></StatCard>
        <StatCard label="In progress"      value={String(active)}      note="" color="#EF4444" bg="#FFF0F1"><AlertCircle size={20} /></StatCard>
        <StatCard label="Results published" value={String(published)}  note="" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20} /></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "exams"   ? "active" : ""} onClick={() => setTab("exams")}>📝 Exams ({items.length})</button>
        <button className={tab === "grades"  ? "active" : ""} onClick={() => setTab("grades")}>🎯 Grade scale ({scales.length || DEFAULT_SCALE.length})</button>
        <button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}>📊 Results ({results.length})</button>
      </div>

      {/* ── EXAMS TAB ─────────────────────────────────────────────────────────── */}
      {tab === "exams" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{ maxWidth: 280 }}>
              <Search size={14} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams…" />
            </label>
          </div>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Exam</th><th>Type</th><th>Campus</th><th>Date</th>
                    <th>Total marks</th><th>Pass marks</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                      No exams yet. Schedule your first exam →
                    </td></tr>
                  ) : filtered.map((e: any) => {
                    const meta = parseMeta(e.metadataJson);
                    const campus = campuses.find((c: any) => c.id === meta.campusId);
                    const canEnterMarks = !["PUBLISHED", "CANCELLED"].includes(meta.status ?? "");
                    return (
                      <tr key={e.id}>
                        <td>
                          <b style={{ fontSize: 12 }}>{e.name}</b>
                          {meta.description && <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{meta.description}</div>}
                        </td>
                        <td>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--indigo-soft)", color: "var(--indigo)", fontWeight: 700 }}>
                            {meta.type ?? "—"}
                          </span>
                        </td>
                        <td style={{ fontSize: 11 }}>{campus?.name ?? "All campuses"}</td>
                        <td style={{ fontSize: 11 }}>{meta.start ?? "—"}{meta.end && meta.end !== meta.start ? ` → ${meta.end}` : ""}</td>
                        <td style={{ textAlign: "center" }}><b>{meta.marks ?? "—"}</b></td>
                        <td style={{ textAlign: "center", fontSize: 11, color: "var(--muted)" }}>{meta.passMarks ?? "—"}</td>
                        <td><span className={`status-pill ${STATUS_PILL[meta.status ?? "SCHEDULED"] ?? "info"}`}>{meta.status ?? "SCHEDULED"}</span></td>
                        <td>
                          <div className="row-actions">
                            {canEnterMarks && (
                              <button className="table-action" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                onClick={() => setMarkEntry(e)}>
                                <Edit3 size={11} /> Enter marks
                              </button>
                            )}
                            {meta.status === "PUBLISHED" && (
                              <button className="table-action" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                                <Eye size={11} /> View results
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
        </div>
      )}

      {/* ── GRADE SCALE TAB ─────────────────────────────────────────────────── */}
      {tab === "grades" && (
        <div className="surface">
          <div className="surface-head">
            <div>
              <h3>Grade scale</h3>
              <p>Marks boundaries used for automatic grade computation during result entry</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Grade</th><th>Min %</th><th>Max %</th><th>Grade point</th><th>Sample (out of 100)</th></tr></thead>
              <tbody>
                {(scales.length > 0 ? scales.map((s: any) => { const m = parseMeta(s.metadataJson); return { name: s.name, min: m.minPercent, max: m.maxPercent, gradePoint: m.gradePoint }; }) : DEFAULT_SCALE)
                  .map((s: GradeScaleEntry, i: number) => (
                    <tr key={i}>
                      <td>
                        <span style={{ fontSize: 18, fontWeight: 800, color: ({ "A+": "#059669", A: "#059669", "B+": "#2563EB", B: "#2563EB", C: "#D97706", D: "#9333EA", F: "#DC2626" } as any)[s.name] ?? "var(--text)" }}>
                          {s.name}
                        </span>
                      </td>
                      <td><b>{s.min}%</b></td>
                      <td><b>{s.max}%</b></td>
                      <td style={{ fontWeight: 700 }}>{s.gradePoint}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${s.max}%`, background: ({ "A+": "#059669", A: "#10B981", "B+": "#2563EB", B: "#3B82F6", C: "#D97706", D: "#9333EA", F: "#DC2626" } as any)[s.name] ?? "var(--muted)", borderRadius: 999 }} />
                          </div>
                          <span style={{ fontSize: 10, color: "var(--muted)" }}>{s.min}–{s.max}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {scales.length === 0 && (
            <div style={{ padding: "10px 20px 16px", fontSize: 11, color: "var(--muted)" }}>
              Showing default grade scale. Add custom grades above to override.
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS TAB ─────────────────────────────────────────────────────── */}
      {tab === "results" && (
        <div className="surface">
          <div className="surface-head"><h3>Published results</h3><p>Results become visible to students and parents once published</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Student</th><th>Exam / Subject</th><th>Marks</th><th>%</th><th>Grade</th><th>Grade point</th><th>Status</th></tr></thead>
              <tbody>
                {results.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                    No results yet. Enter marks using the "Enter marks" button on any exam.
                  </td></tr>
                ) : results.map((r: any) => {
                  const meta = parseMeta(r.metadataJson);
                  const GCOL: Record<string, string> = { "A+": "#059669", A: "#059669", "B+": "#2563EB", B: "#2563EB", C: "#D97706", F: "#DC2626" };
                  return (
                    <tr key={r.id}>
                      <td style={{ fontSize: 12 }}>{meta.studentName ?? meta.studentId ?? "—"}</td>
                      <td style={{ fontSize: 11 }}>{meta.subject ?? "—"}</td>
                      <td><b>{meta.marksObtained ?? "—"}</b></td>
                      <td><b style={{ color: Number(meta.percentage) >= 50 ? "var(--success)" : "var(--danger)" }}>{meta.percentage ? `${meta.percentage}%` : "—"}</b></td>
                      <td><b style={{ fontSize: 15, color: GCOL[meta.grade] ?? "var(--muted)" }}>{meta.grade ?? "—"}</b></td>
                      <td style={{ fontWeight: 700 }}>{meta.gradePoint ?? "—"}</td>
                      <td><span className={`status-pill ${meta.status === "PASSED" ? "success" : meta.status === "FAILED" ? "danger" : "gray"}`}>{meta.status ?? "PENDING"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CREATE EXAM MODAL ─────────────────────────────────────────────── */}
      {open && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width: "min(580px,96vw)" }}>
            <div className="modal-head"><h2>Schedule exam</h2><button className="icon-button" onClick={() => setOpen(false)}><X size={18} /></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Exam name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Mid-Term Examinations — September 2026" /></label>
                <label className="human-field"><span>Type</span>
                  <select value={form.examType} onChange={sf("examType")}>{EXAM_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <label className="human-field"><span>Campus</span>
                  <select value={form.campusId} onChange={sf("campusId")}>
                    <option value="">All campuses</option>
                    {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate} onChange={sf("startDate")} /></label>
                <label className="human-field"><span>End date</span><input type="date" value={form.endDate} onChange={sf("endDate")} /></label>
                <label className="human-field"><span>Total marks</span><input type="number" value={form.totalMarks} onChange={sf("totalMarks")} /></label>
                <label className="human-field"><span>Pass marks</span><input type="number" value={form.passMarks} onChange={sf("passMarks")} /></label>
                <label className="human-field field-wide"><span>Description</span><input value={form.description} onChange={sf("description")} placeholder="Optional" /></label>
              </div>
              {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveExam} disabled={createExam.isPending}>{createExam.isPending ? "Scheduling…" : "Schedule exam"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD GRADE SCALE MODAL ──────────────────────────────────────────── */}
      {gsOpen && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setGsOpen(false); }}>
          <div className="modal-card" style={{ width: "min(420px,96vw)" }}>
            <div className="modal-head"><h2>Add grade boundary</h2><button className="icon-button" onClick={() => setGsOpen(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Grade label *</span><input value={gsForm.name} onChange={gsf("name")} placeholder="e.g. A+ or Distinction" /></label>
              <label className="human-field"><span>Min % *</span><input type="number" value={gsForm.minPercent} onChange={gsf("minPercent")} placeholder="80" /></label>
              <label className="human-field"><span>Max % *</span><input type="number" value={gsForm.maxPercent} onChange={gsf("maxPercent")} placeholder="100" /></label>
              <label className="human-field"><span>Grade point (GPA)</span><input value={gsForm.gradePoint} onChange={gsf("gradePoint")} placeholder="4.00" /></label>
            </div>
              {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setGsOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveGradeScale} disabled={createGradeScale.isPending}>{createGradeScale.isPending ? "Saving…" : "Save boundary"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MARKS ENTRY MODAL ─────────────────────────────────────────────── */}
      {markEntry && <MarksEntryGrid exam={markEntry} scale={activeScale} onClose={() => setMarkEntry(null)} />}
    </>
  );
}
