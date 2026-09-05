/**
 * LearningPage — Production assignment management
 * Teacher view: create, view submissions, grade inline
 * Student view: view assigned work, submit with file + comment, see grade
 */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Pagination } from "../../../components/ui/Pagination";
import {
  Plus, X, Upload, CheckCircle2, Clock, FileText,
  AlertCircle, Send, Eye, BookOpen, Edit3, Star} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useAssignments, useCreateAssignment, useLessons,
  useCreateLesson, useClassSections, useSubjects, useUpdateAssignment, useDeleteAssignment, useAssignmentById} from "../../../core/api/queries";
import { env } from "../../../config/env";
import * as A from "../../../core/api/apiAdapter";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { RowActions } from "../../../components/ui/RowActions";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { EditModal }  from "../../../components/ui/EditModal";

const parseMeta = (j?: string | null) => { try { return JSON.parse(j ?? "{}"); } catch { return {}; } };
const TYPES = ["HOMEWORK","PROJECT","ESSAY","LAB_REPORT","PRESENTATION","RESEARCH","CLASSWORK"];

// ─── Mock submissions for teacher grading view ────────────────────────────────
const MOCK_SUBMISSIONS = [
  { id:"sub1", studentId:"s1", studentName:"Ahmed Hassan",   submittedAt:"2026-09-01T20:10:00Z", fileName:"ahmed_math_hw.pdf",   comment:"Please check Q3",    grade:"", feedback:"", status:"SUBMITTED" },
  { id:"sub2", studentId:"s2", studentName:"Sara Butt",      submittedAt:"2026-09-01T18:45:00Z", fileName:"sara_assignment.docx",comment:"",                   grade:"", feedback:"", status:"SUBMITTED" },
  { id:"sub3", studentId:"s3", studentName:"Hassan Noor",    submittedAt:"2026-09-02T09:00:00Z", fileName:"hassan_work.pdf",     comment:"Done late sorry",    grade:"", feedback:"", status:"LATE" },
  { id:"sub4", studentId:"s4", studentName:"Mariam Shah",    submittedAt:null,                   fileName:null,                  comment:null,                 grade:"", feedback:"", status:"MISSING" },
  { id:"sub5", studentId:"s5", studentName:"Danish Ali",     submittedAt:"2026-08-31T22:55:00Z", fileName:"danish_essay.pdf",    comment:"Revised version",    grade:"A", feedback:"Excellent depth of analysis.", status:"GRADED" },
];

// ─── Student Submit Modal ─────────────────────────────────────────────────────
function SubmitModal({ assignment, onClose, onDone }: { assignment: any; onClose: () => void; onDone: () => void }) {
  const meta = parseMeta(assignment.metadataJson);
  const [localAsgns, setLocalAsgns] = useState<any[]>([]);
  const { user } = useAuth();
    
  const delAssignment = useDeleteAssignment();

  const tid = effectiveTenantId(user) ?? "";
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile]       = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);
  const [error, setError]     = useState("");

  const due = meta.dueDate ? new Date(meta.dueDate + "T" + (meta.dueTime ?? "23:59")) : null;
  const isLate = due ? due && new Date() > due : false;

  async function submit() {
    if (!file && !comment.trim()) { setError("Attach a file or write a comment before submitting."); return; }
    setSubmitting(true);
    try {
      await A.submitAssignment(assignment.id, file, comment, tid, user?.studentId ?? user?.id ?? "student");
      setDone(true);
      setTimeout(onDone, 1200);
    } catch { setError("Submission failed. Please try again."); }
    setSubmitting(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(520px,96vw)" }}>
        <div className="modal-head">
          <div>
            <h2 style={{ fontSize: 17 }}>Submit assignment</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{assignment.name}</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {done ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <CheckCircle2 size={52} style={{ color: "var(--success)", margin: "0 auto 14px", display: "block" }} />
            <b style={{ fontSize: 16, color: "var(--success)", display: "block" }}>Submitted successfully!</b>
            <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Your teacher has been notified.</p>
          </div>
        ) : (
          <>
            {/* Assignment details */}
            <div style={{ padding: "14px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  ["Subject", meta.subject ?? "—"],
                  ["Due", due ? due.toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "—"],
                  ["Total marks", String(meta.totalMarks ?? 100)],
                  ["Late submissions", meta.allowLate ? "Allowed" : "Not allowed"],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: l === "Due" && isLate ? "var(--danger)" : "var(--text)" }}>
                      {v}{l === "Due" && isLate && " (overdue)"}
                    </div>
                  </div>
                ))}
              </div>
              {meta.description && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10, lineHeight: 1.6 }}>{meta.description}</p>}
            </div>

            {isLate && !meta.allowLate && (
              <div style={{ margin: "14px 20px 0", padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 10, fontSize: 12, color: "var(--danger)", display: "flex", gap: 8, alignItems: "center" }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                This assignment does not accept late submissions. Contact your teacher.
              </div>
            )}

            <div className="human-form">
              {/* File upload */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: "var(--text-2)" }}>Attach file</div>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${file ? "var(--success)" : "var(--line-2)"}`,
                    borderRadius: 12, padding: "20px 16px", textAlign: "center",
                    cursor: "pointer", background: file ? "var(--success-bg)" : "var(--surface-2)",
                    transition: "all .15s",
                  }}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                >
                  {file ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                      <FileText size={20} style={{ color: "var(--success)" }} />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>{(file.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button style={{ marginLeft: 8, border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)" }}
                        onClick={e => { e.stopPropagation(); setFile(null); }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload size={24} style={{ color: "var(--muted-2)", margin: "0 auto 8px", display: "block" }} />
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>Drop file here or click to browse</div>
                      <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 4 }}>PDF, DOCX, JPG — max 50 MB</div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.xlsx,.pptx"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                </div>
              </div>

              {/* Comment */}
              <label className="human-field field-wide">
                <span>Comment for your teacher (optional)</span>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Any notes or questions about this submission…"
                  style={{ minHeight: 80, padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", width: "100%", fontSize: 13, resize: "vertical" }} />
              </label>
              {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            </div>

            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={onClose}>Cancel</button>
              <button className="primary" onClick={submit} disabled={!!(submitting || (isLate && !meta.allowLate))}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Send size={13} /> {submitting ? "Submitting…" : "Submit assignment"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Teacher: Grade Submissions Drawer ───────────────────────────────────────
function GradeDrawer({ assignment, onClose }: { assignment: any; onClose: () => void }) {
  const [subs, setSubs]   = useState(env.useMocks ? MOCK_SUBMISSIONS.map(s => ({ ...s })) : []);
  const [selected, setSel] = useState<typeof MOCK_SUBMISSIONS[0] | null>(null);

  useEffect(() => {
    if (env.useMocks || !assignment?.id) return;
    A.getSubmissions(assignment.id, "").then((res: any) => {
      const items = res?.items ?? res ?? [];
      setSubs(items.map((s: any) => ({
        id: s.id, studentId: s.studentId ?? "",
        studentName: s.studentName ?? s.name ?? "",
        submittedAt: s.submittedAt ?? s.createdAt,
        fileName: s.fileName ?? null, comment: s.comment ?? "",
        grade: s.grade ?? "", feedback: s.feedback ?? "",
        status: s.status ?? "SUBMITTED",
      })));
    }).catch(() => {});
  }, [assignment?.id]);
  const [grade, setGrade]  = useState("");
  const [feedback, setFb]  = useState("");
  const [saving, setSaving] = useState(false);

  const meta = parseMeta(assignment.metadataJson);
  const totalMarks = meta.totalMarks ?? 100;

  const counts = {
    submitted: subs.filter(s => s.status === "SUBMITTED").length,
    late:      subs.filter(s => s.status === "LATE").length,
    graded:    subs.filter(s => s.status === "GRADED").length,
    missing:   subs.filter(s => s.status === "MISSING").length,
  };

  async function saveGrade() {
    if (!selected || !grade) return;
    setSaving(true);
    try {
      await A.gradeSubmission(selected.id, { grade, feedback, marks: grade, tenantId: "" });
      setSubs(prev => prev.map(s => s.id === selected.id ? { ...s, grade, feedback, status: "GRADED" } : s));
      setSel(null); setGrade(""); setFb("");
    } catch { /* toast */ }
    setSaving(false);
  }

  const STATUS_COLOR: Record<string, string> = { SUBMITTED: "info", LATE: "warning", GRADED: "success", MISSING: "danger" };

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(820px,98vw)", maxHeight: "92vh" }}>
        <div className="modal-head">
          <div>
            <h2 style={{ fontSize: 17 }}>Grade submissions</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{assignment.name} · {meta.subject ?? ""} · Total: {totalMarks} marks</p>
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: "12px 20px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)", display: "flex", gap: 16, alignItems: "center" }}>
          {[["Submitted", counts.submitted, "info"], ["Late", counts.late, "warning"], ["Graded", counts.graded, "success"], ["Missing", counts.missing, "danger"]].map(([l, v, t]) => (
            <div key={String(l)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className={`status-pill ${t}`} style={{ fontSize: 10 }}>{v} {l}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)" }}>
            {counts.graded}/{subs.length} graded
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 360px" : "1fr", height: "calc(92vh - 130px)", overflow: "hidden" }}>
          {/* Submission list */}
          <div style={{ overflow: "auto", borderRight: selected ? "1px solid var(--line)" : "none" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Student", "Submitted", "File", "Grade", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", background: "var(--surface-2)", borderBottom: "1.5px solid var(--line)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", textAlign: h === "Actions" ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map(sub => (
                  <tr key={sub.id} style={{ background: selected?.id === sub.id ? "var(--indigo-soft)" : "" }}>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--indigo-soft)", color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flexShrink: 0 }}>
                          {sub.studentName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <b style={{ fontSize: 12 }}>{sub.studentName}</b>
                      </div>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--muted)" }}>
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" }) : "—"}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      {sub.fileName ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--accent)" }}>
                          <FileText size={12} /> {sub.fileName.length > 18 ? sub.fileName.slice(0, 18) + "…" : sub.fileName}
                        </span>
                      ) : <span style={{ fontSize: 11, color: "var(--muted-2)" }}>No file</span>}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      {sub.grade ? <b style={{ fontSize: 15, color: "var(--success)" }}>{sub.grade}</b> : <span style={{ color: "var(--muted-2)", fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      <span className={`status-pill ${STATUS_COLOR[sub.status] ?? "gray"}`} style={{ fontSize: 9 }}>{sub.status}</span>
                    </td>
                    <td style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>
                      {sub.status !== "MISSING" && (
                        <button className="table-action" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                          onClick={() => { setSel(sub); setGrade(sub.grade); setFb(sub.feedback); }}>
                          <Star size={10} /> {sub.status === "GRADED" ? "Re-grade" : "Grade"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grade panel */}
          {selected && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "auto" }}>
              <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
                <b style={{ fontSize: 13 }}>{selected.studentName}</b>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                  Submitted {selected.submittedAt ? new Date(selected.submittedAt).toLocaleString("en-PK") : "—"}
                </div>
                {selected.comment && (
                  <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)", fontSize: 12, fontStyle: "italic", color: "var(--muted)" }}>
                    "{selected.comment}"
                  </div>
                )}
              </div>
              <div style={{ padding: 18, flex: 1 }}>
                {selected.fileName && (
                  <button style={{ width: "100%", padding: "14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 16 }}>
                    <FileText size={20} style={{ color: "var(--accent)" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{selected.fileName}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>Click to preview</div>
                    </div>
                  </button>
                )}
                <label style={{ display: "grid", gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Marks (out of {totalMarks}) *</span>
                  <input type="number" min={0} max={totalMarks} value={grade} onChange={e => setGrade(e.target.value)}
                    placeholder={`0 – ${totalMarks}`}
                    style={{ height: 42, padding: "0 12px", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center" }} />
                  {grade && (
                    <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
                      {Math.round((Number(grade) / totalMarks) * 100)}% · Grade: <b>{computeGradeLabel(Number(grade), totalMarks)}</b>
                    </div>
                  )}
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Feedback to student</span>
                  <textarea value={feedback} onChange={e => setFb(e.target.value)}
                    placeholder="Constructive feedback that helps the student improve…"
                    style={{ minHeight: 100, padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: 10, fontSize: 13, resize: "vertical" }} />
                </label>
              </div>
              <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
                <button className="secondary" style={{ flex: 1 }} onClick={() => { setSel(null); setGrade(""); setFb(""); }}>Back</button>
                <button className="primary" style={{ flex: 1 }} onClick={saveGrade} disabled={!grade || saving}>
                  {saving ? "Saving…" : "Save grade"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function computeGradeLabel(marks: number, total: number): string {
  const pct = (marks / total) * 100;
  if (pct >= 90) return "A+"; if (pct >= 80) return "A"; if (pct >= 70) return "B+";
  if (pct >= 60) return "B"; if (pct >= 50) return "C"; if (pct >= 40) return "D"; return "F";
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function LearningPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const isTeacher = user?.role?.toLowerCase().includes("teacher");
  const isStudent = !isTeacher;

  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab]           = useState<"assignments" | "lessons">("assignments");
  const [search, setSearch]     = useState("");
  const [aModal, setAModal]     = useState(false);
  const [lModal, setLModal]     = useState(false);
  const [submitModal, setSubmit] = useState<any | null>(null);
  const [gradeDrawer, setGrade] = useState<any | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [editAsgnId, setEditAsgnId] = useState<string|null>(null);
  const [viewAsgnId, setViewAsgnId] = useState<string|null>(null);
  const viewAsgnOrEdit = viewAsgnId ?? editAsgnId;

  const { data: viewAsgnData } = useAssignmentById(viewAsgnOrEdit ?? undefined);

  const viewAsgnItem: any = viewAsgnData ?? null;
    const updAssignment = useUpdateAssignment();

  const [error, setError]       = useState("");

  const { data, isLoading } = useAssignments();
  const { data: lessonsData } = useLessons();
  const { data: sectionsData } = useClassSections();
  const { data: subjectsData } = useSubjects();
  const createAssignment = useCreateAssignment();
  const createLesson     = useCreateLesson();

  const assignments = (data as any)?.items       ?? (data as any) ?? [];
  const lessons     = (lessonsData as any)?.items ?? (lessonsData as any) ?? [];
  const sections    = (sectionsData as any)?.items ?? (sectionsData as any) ?? [];
  const subjects    = (subjectsData as any)?.items ?? (subjectsData as any) ?? [];

  const [aForm, setAForm] = useState({
    title: "", assignmentType: "HOMEWORK", sectionId: "", subjectId: "",
    dueDate: "", dueTime: "23:59", totalMarks: "100", description: "", allowLate: "true",
  });
  const [lForm, setLForm] = useState({ title: "", sectionId: "", description: "", sortOrder: "1" });

  const af = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAForm(p => ({ ...p, [k]: e.target.value }));
  const lf = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setLForm(p => ({ ...p, [k]: e.target.value }));

  const filtered = useMemo(() => assignments.filter((a: any) => {
    const m = parseMeta(a.metadataJson);
    return `${a.name} ${m.subject ?? ""} ${m.type ?? ""}`.toLowerCase().includes(search.toLowerCase());
  }), [assignments, search]);

  const now = new Date();
  const pending   = assignments.filter((a: any) => { const m = parseMeta(a.metadataJson); return m.status !== "SUBMITTED" && !submittedIds.has(a.id); }).length;
  const overdue   = assignments.filter((a: any) => { const m = parseMeta(a.metadataJson); return m.dueDate && new Date(m.dueDate) < now && !submittedIds.has(a.id); }).length;

  async function saveAssignment() {
    if (!aForm.title || !aForm.dueDate) { setError("Title and due date are required"); return; }
    const section = sections.find((s: any) => s.id === aForm.sectionId);
    const subject = subjects.find((s: any) => s.id === aForm.subjectId);
    try {
      await createAssignment.mutateAsync({
        tenantId: tid, name: aForm.title,
        metadataJson: JSON.stringify({
          type: aForm.assignmentType, sectionId: aForm.sectionId,
          sectionName: section?.name, subjectId: aForm.subjectId,
          subject: subject?.name ?? aForm.subjectId,
          dueDate: aForm.dueDate, dueTime: aForm.dueTime,
          totalMarks: Number(aForm.totalMarks),
          description: aForm.description,
          allowLate: aForm.allowLate === "true",
          status: "ACTIVE", createdAt: new Date().toISOString(),
        }),
      });
      setAModal(false);
      setAForm({ title: "", assignmentType: "HOMEWORK", sectionId: "", subjectId: "", dueDate: "", dueTime: "23:59", totalMarks: "100", description: "", allowLate: "true" });
      setError("");
    } catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  async function saveLesson() {
    if (!lForm.title) { setError("Title required"); return; }
    try {
      await createLesson.mutateAsync({
        tenantId: tid, name: lForm.title,
        metadataJson: JSON.stringify({ sectionId: lForm.sectionId, description: lForm.description, sortOrder: Number(lForm.sortOrder), resourceCount: 0 }),
      });
      setLModal(false); setLForm({ title: "", sectionId: "", description: "", sortOrder: "1" }); setError("");
    } catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
    HOMEWORK:     { bg: "#EFF6FF", color: "#2563EB" },
    PROJECT:      { bg: "#F5F3FF", color: "#7C3AED" },
    ESSAY:        { bg: "#ECFDF5", color: "#059669" },
    LAB_REPORT:   { bg: "#FFF7ED", color: "#EA580C" },
    PRESENTATION: { bg: "#FDF2F8", color: "#DB2777" },
    RESEARCH:     { bg: "#FFFBEB", color: "#D97706" },
    CLASSWORK:    { bg: "#F0FDF4", color: "#16A34A" },
  };

  return (
    <>
      <PageHeader
        title={isTeacher ? "Learning — Assignments" : "My Assignments"}
        subtitle={isTeacher ? "Create assignments, review submissions and grade student work" : "Your assignments, deadlines and submission status"}
        action={
          <div className="page-actions">
            {tab === "assignments" && isTeacher && (
              <button className="primary" onClick={() => { setAModal(true); setError(""); }}>
                <Plus size={14} /> New assignment
              </button>
            )}
            {tab === "lessons" && isTeacher && (
              <button className="primary" onClick={() => { setLModal(true); setError(""); }}>
                <Plus size={14} /> New lesson
              </button>
            )}
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label={isTeacher ? "Assignments" : "Total"} value={String(assignments.length)} note="" color="#6366F1" bg="#EEF2FF"><FileText size={20} /></StatCard>
        <StatCard label="Pending"  value={String(pending)}  note={isTeacher ? "awaiting submission" : "to complete"} color="#D97706" bg="#FFFBEB"><Clock size={20} /></StatCard>
        <StatCard label="Overdue"  value={String(overdue)}  note="" color={overdue > 0 ? "#DC2626" : "#10B981"} bg={overdue > 0 ? "#FEF2F2" : "#ECFDF5"}><AlertCircle size={20} /></StatCard>
        <StatCard label="Lessons"  value={String(lessons.length)} note="" color="#0D9488" bg="#F0FDFA"><BookOpen size={20} /></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "assignments" ? "active" : ""} onClick={() => setTab("assignments")}>📝 Assignments ({assignments.length})</button>
        <button className={tab === "lessons"     ? "active" : ""} onClick={() => setTab("lessons")}>📖 Lessons ({lessons.length})</button>
      </div>

      {tab === "assignments" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{ maxWidth: 300 }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" /></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, subject or type…" />
            </label>
          </div>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Assignment</th><th>Type</th><th>Subject</th>
                    <th>Class</th><th>Due</th><th>Marks</th><th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                      {isTeacher ? "No assignments yet. Create your first assignment →" : "No assignments assigned to you yet."}
                    </td></tr>
                  ) : filtered.map((a: any) => {
                    const m = parseMeta(a.metadataJson);
                    const due = m.dueDate ? new Date(m.dueDate + "T" + (m.dueTime ?? "23:59")) : null;
                    const isOverdue = due && due < now && !submittedIds.has(a.id);
                    const isSubmitted = submittedIds.has(a.id) || m.status === "SUBMITTED";
                    const typeStyle = TYPE_COLOR[m.type ?? "HOMEWORK"] ?? { bg: "#EEF2FF", color: "#6366F1" };

                    return (
                      <tr key={a.id}>
                        <td>
                          <div>
                            <b style={{ fontSize: 12 }}>{a.name}</b>
                            {m.description && (
                              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {m.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: typeStyle.bg, color: typeStyle.color, fontWeight: 700 }}>
                            {m.type ?? "HOMEWORK"}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, fontWeight: 600 }}>{m.subject ?? "—"}</td>
                        <td style={{ fontSize: 11, color: "var(--muted)" }}>{m.sectionName ?? "All"}</td>
                        <td>
                          <div style={{ fontSize: 11, fontWeight: isOverdue ? 700 : 400, color: isOverdue ? "var(--danger)" : "var(--text)" }}>
                            {due ? due.toLocaleDateString("en-PK", { day: "numeric", month: "short" }) : "—"}
                            {m.dueTime && <span style={{ color: "var(--muted)", fontSize: 10 }}> {m.dueTime}</span>}
                            {isOverdue && <span style={{ display: "block", fontSize: 9, color: "var(--danger)", fontWeight: 700 }}>OVERDUE</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}><b>{m.totalMarks ?? 100}</b></td>
                        <td>
                          <span className={`status-pill ${isSubmitted ? "success" : isOverdue ? "danger" : m.status === "GRADED" ? "purple" : "warning"}`} style={{ fontSize: 9 }}>
                            {isSubmitted ? "SUBMITTED" : isOverdue ? "OVERDUE" : m.status === "GRADED" ? "GRADED" : "PENDING"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                            {isTeacher && (
                              <button className="table-action" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                onClick={() => setGrade(a)}>
                                <Star size={10} /> Submissions
                              </button>
                            )}
                            {isStudent && !isSubmitted && (
                              <button className="table-action approve" style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                onClick={() => setSubmit(a)}>
                                <Upload size={10} /> Submit
                              </button>
                            )}
                            {isStudent && isSubmitted && (
                              <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>✓ Submitted</span>
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

      {tab === "lessons" && (
        <div className="surface">
          <div className="surface-head"><h3>Lessons & course content</h3></div>
          {lessons.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
              <BookOpen size={36} style={{ margin: "0 auto 12px", display: "block", opacity: .3 }} />
              <b>No lessons yet</b>
              {isTeacher && <p style={{ fontSize: 12, margin: "8px 0 0" }}>Organise your course content into lessons.</p>}
            </div>
          ) : (
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              {lessons.map((l: any) => {
                const m = parseMeta(l.metadataJson);
                return (
                  <div key={l.id} style={{ padding: "14px 16px", border: "1px solid var(--line)", borderRadius: 12, display: "flex", gap: 14, alignItems: "center", cursor: "pointer", transition: "all .12s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--indigo-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--indigo)" }}>{m.sortOrder ?? 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 13 }}>{l.name}</b>
                      {m.description && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{m.description}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.resourceCount ?? 0} resources</div>
                    {isTeacher && (
                      <button className="table-action" style={{ fontSize: 10 }}><Plus size={11} /> Add resource</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ASSIGNMENT MODAL ──────────────────────────────────────────── */}
      {aModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setAModal(false); }}>
          <div className="modal-card" style={{ width: "min(620px,96vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-head" style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
              <h2>New assignment</h2><button className="icon-button" onClick={() => setAModal(false)}><X size={18} /></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={aForm.title} onChange={af("title")} placeholder="e.g. Chapter 5 — Practice Problems" /></label>
              <label className="human-field"><span>Type</span>
                <select value={aForm.assignmentType} onChange={af("assignmentType")}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Class section</span>
                <select value={aForm.sectionId} onChange={af("sectionId")}>
                  <option value="">All classes</option>
                  {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Subject</span>
                <select value={aForm.subjectId} onChange={af("subjectId")}>
                  <option value="">— Select —</option>
                  {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Due date *</span><input type="date" value={aForm.dueDate} onChange={af("dueDate")} /></label>
              <label className="human-field"><span>Due time</span><input type="time" value={aForm.dueTime} onChange={af("dueTime")} /></label>
              <label className="human-field"><span>Total marks</span><input type="number" min={1} value={aForm.totalMarks} onChange={af("totalMarks")} /></label>
              <label className="human-field"><span>Late submissions</span>
                <select value={aForm.allowLate} onChange={af("allowLate")}>
                  <option value="true">Allowed</option>
                  <option value="false">Not allowed</option>
                </select>
              </label>
              <label className="human-field field-wide"><span>Instructions for students</span>
                <input value={aForm.description} onChange={af("description")} placeholder="What should students do? Any special instructions?" />
              </label>
            </div>
              {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setAModal(false)}>Cancel</button>
              <button className="primary" onClick={saveAssignment} disabled={createAssignment.isPending}>
                {createAssignment.isPending ? "Creating…" : "Create assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE LESSON MODAL ──────────────────────────────────────────────── */}
      {lModal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setLModal(false); }}>
          <div className="modal-card" style={{ width: "min(440px,96vw)" }}>
            <div className="modal-head"><h2>New lesson</h2><button className="icon-button" onClick={() => setLModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={lForm.title} onChange={lf("title")} placeholder="e.g. Chapter 3 — Newton's Laws of Motion" /></label>
              <label className="human-field"><span>Class section</span>
                <select value={lForm.sectionId} onChange={lf("sectionId")}>
                  <option value="">All</option>
                  {sections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Order</span><input type="number" min={1} value={lForm.sortOrder} onChange={lf("sortOrder")} /></label>
              <label className="human-field field-wide"><span>Description</span><input value={lForm.description} onChange={lf("description")} placeholder="Brief overview of this lesson" /></label>
            </div>
              {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setLModal(false)}>Cancel</button>
              <button className="primary" onClick={saveLesson} disabled={createLesson.isPending}>
                {createLesson.isPending ? "Creating…" : "Create lesson"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STUDENT SUBMIT MODAL ─────────────────────────────────────────────── */}
      {submitModal && (
        <SubmitModal
          assignment={submitModal}
          onClose={() => setSubmit(null)}
          onDone={() => { setSubmittedIds(prev => new Set([...prev, submitModal.id])); setSubmit(null); }}
        />
      )}

      {/* ── TEACHER GRADE DRAWER ─────────────────────────────────────────────── */}
      {gradeDrawer && (
        <GradeDrawer assignment={gradeDrawer} onClose={() => setGrade(null)} />
      )}

      {viewAsgnId && viewAsgnItem && (
        <ViewDrawer
          title="Assignment"
          item={viewAsgnItem}
          onClose={() => setViewAsgnId(null)}
          onEdit={() => { setEditAsgnId(viewAsgnId!); setViewAsgnId(null); }}
          fields={[
            { key: "name", label: "Title", wide: true },
            { key: "type", label: "Type" },
            { key: "subject", label: "Subject" },
            { key: "dueDate", label: "Due date" },
            { key: "totalMarks", label: "Total marks" },
            { key: "status", label: "Status" },
            { key: "description", label: "Instructions", wide: true },
          ]}
        />
      )}
      {editAsgnId && viewAsgnItem && (
        <EditModal
          title="Assignment"
          item={viewAsgnItem}
          onClose={() => setEditAsgnId(null)}
          onSave={async data => { await updAssignment.mutateAsync({id: editAsgnId!, body: data}); setEditAsgnId(null); }}
          fields={[
            { key: "name", label: "Title", type: "text", required: true, wide: true },
            { key: "dueDate", label: "Due date", type: "date" },
            { key: "totalMarks", label: "Total marks", type: "number" },
            { key: "description", label: "Instructions", type: "textarea", wide: true },
          ]}
        />
      )}
    </>
  );
}
