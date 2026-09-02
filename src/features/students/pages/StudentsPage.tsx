import React, { useState, useEffect } from "react";
import { EditModal } from "../../../components/ui/EditModal";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { RowActions } from "../../../components/ui/RowActions";
import { Pagination } from "../../../components/ui/Pagination";
import { Plus, Search, X, GraduationCap, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import {
  useStudents, useCreateStudent, useCreateEnrollment,
  useCampuses, useAcademicYears, useClassSections, useGradeLevels,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

export function StudentsPage() {
  const { user } = useAuth();
  const [viewStudent, setViewStudent] = useState<any|null>(null);
  const [editStudent, setEditStudent] = useState<any|null>(null);
  const tid = effectiveTenantId(user) ?? "";
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab] = useState<"list"|"new">("list");
  const [step, setStep] = useState<1|2|3>(1);
  const [search, setSearch] = useState("");
  const [newStudentId, setNewStudentId] = useState("");
  const [docCompliant, setDocComp] = useState(false);
  const [error, setError] = useState("");

  const [students, setStudents] = useState<any[]>([]);
  const { data, isLoading } = useStudents();
  useEffect(()=>{ const s=(data as any)?.items??(data as any)??[]; setStudents(s); },[data]);
  const { data: campusesData } = useCampuses();
  const { data: yearsData }    = useAcademicYears();
  const { data: sectionsData } = useClassSections();
  const { data: gradesData }   = useGradeLevels();
  const createStudent    = useCreateStudent();
  const createEnrollment = useCreateEnrollment();

  const campuses = (campusesData as any)?.items ?? (campusesData as any) ?? [];
  const years    = (yearsData as any)?.items    ?? (yearsData as any) ?? [];
  const sections = (sectionsData as any)?.items ?? (sectionsData as any) ?? [];
  const grades   = (gradesData as any)?.items   ?? (gradesData as any) ?? [];

  const [form, setForm] = useState({
    schoolId:"", branchId:"", academicYearId:"", classSectionId:"",
    firstName:"", lastName:"", dateOfBirth:"", gender:"",
    admissionDate: new Date().toISOString().slice(0,10),
  });

  function sf(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  const filteredStu = students;  // use mutable local state
  const filtered = filteredStu.filter((s: any) =>
    `${s.firstName} ${s.lastName} ${s.studentNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCampuses = campuses;
  const filteredYears    = form.branchId
    ? years.filter((y: any) => { try { return JSON.parse(y.metadataJson ?? "{}").campusId === form.branchId; } catch { return true; } })
    : years;
  const filteredSections = form.branchId
    ? sections.filter((s: any) => { try { return JSON.parse(s.metadataJson ?? "{}").campusId === form.branchId; } catch { return true; } })
    : sections;

  async function saveStep1() {
    if (!form.firstName || !form.branchId || !form.academicYearId || !form.classSectionId) {
      setError("Name, campus, academic year and class section are required"); return;
    }
    setError("");
    try {
      const campus = campuses.find((c: any) => c.id === form.branchId);
      const result: any = await createStudent.mutateAsync({
        tenantId: tid,
        schoolId: campus?.schoolId ?? form.schoolId,
        branchId: form.branchId,
        academicYearId: form.academicYearId,
        classSectionId: form.classSectionId,
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        admissionDate: form.admissionDate,
      });
      setNewStudentId(result?.id ?? `stu-mock-${Date.now()}`);
      setStep(2);
    } catch(e: any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  const byStatus = (s: string) => students.filter((x: any) => x.status === s).length;

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Student registration with enrollment and document compliance"
        action={
          <div className="page-actions">
            {tab === "list" && (
              <button className="primary" onClick={() => { setTab("new"); setStep(1); setNewStudentId(""); setDocComp(false); setError(""); }}>
                <Plus size={14}/> Register student
              </button>
            )}
            {tab === "new" && <button className="secondary" onClick={() => setTab("list")}>← Back to list</button>}
          </div>
        }
      />

      {tab === "list" && (
        <>
          <section className="metric-grid" style={{ marginBottom:20 }}>
            <StatCard label="Total students" value={String((data as any)?.totalCount ?? students.length)} note="" color="#2563EB" bg="#EFF6FF"><GraduationCap size={20}/></StatCard>
            <StatCard label="Active"  value={String(byStatus("ACTIVE"))}  note="" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
            <StatCard label="Pending" value={String(byStatus("PENDING"))} note="" color="#D97706" bg="#FFFBEB"><AlertCircle size={20}/></StatCard>
            <StatCard label="Guardians" value="1,890" note="Linked" color="#8B5CF6" bg="#F5F3FF"><Users size={20}/></StatCard>
          </section>
          <div className="surface">
            <div className="surface-head">
              <label className="search-box" style={{ maxWidth:280 }}>
                <Search size={14}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…"/>
              </label>
            </div>
            {isLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
              <div className="table-wrap">
                <table className="premium-table">
                  <thead><tr><th>Name</th><th>Reg #</th><th>Gender</th><th>DOB</th><th>Admission date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No students found.</td></tr>
                      : filtered.map((s: any) => (
                        <tr key={s.id}>
                          <td>
                            <div className="person-cell">
                              <span className="row-avatar" style={{ background:"#EFF6FF", color:"#2563EB" }}>
                                {s.firstName?.[0]}{s.lastName?.[0] ?? ""}
                              </span>
                              <b>{s.firstName} {s.lastName ?? ""}</b>
                            </div>
                          </td>
                          <td><code style={{ fontSize:11 }}>{s.studentNumber ?? "—"}</code></td>
                          <td>{s.gender ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{s.dateOfBirth ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{s.admissionDate ?? "—"}</td>
                          <td><span className={`status-pill ${s.status === "ACTIVE" ? "success" : s.status === "PENDING" ? "warning" : s.status === "SUSPENDED" ? "danger" : "gray"}`}>{s.status}</span></td>
                          <td>
                            <div className="row-actions">
                              {s.status !== "ACTIVE" && (
                                <>
                                  <RowActions
                                    onView={() => setViewStudent(s)}
                                    onEdit={() => setEditStudent(s)}
                                    onDelete={() => setLocalEmp(p => p.filter((x:any) => x.id !== s.id))}
                                    deleteLabel="student"
                                    extra={[]}
                                  />
                                  <button className="table-action approve" title="Approve student"
                                    onClick={e => { e.stopPropagation(); setStudents(p => p.map((x:any) => x.id===s.id ? {...x,status:"ACTIVE"}:x)); }}>
                                    ✓ Approve
                                  </button>
                                </>
                              )}
                              {s.status === "ACTIVE" && (
                                <button className="table-action hold" title="Put on hold"
                                  onClick={e => { e.stopPropagation(); setStudents(p => p.map((x:any) => x.id===s.id ? {...x,status:"ON_HOLD"}:x)); }}>
                                  ⏸ Hold
                                </button>
                              )}
                              {s.status !== "SUSPENDED" && (
                                <button className="table-action reject" title="Suspend student"
                                  onClick={e => { e.stopPropagation(); setStudents(p => p.map((x:any) => x.id===s.id ? {...x,status:"SUSPENDED"}:x)); }}>
                                  ✗
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
          </div>
        </>
      )}

      {tab === "new" && (
        <div style={{ maxWidth:720, margin:"0 auto" }}>
          {/* Step bar */}
          <div style={{ display:"flex", gap:0, marginBottom:20, border:"1px solid var(--line)", borderRadius:12, overflow:"hidden" }}>
            {[
              { n:1, label:"Student & enrollment info" },
              { n:2, label:"Upload required documents" },
              { n:3, label:"Review & complete" },
            ].map((s, i) => (
              <div key={s.n} style={{ flex:1, padding:"12px 16px", background: step===s.n ? "#EEF2FF" : step>s.n ? "#ECFDF5" : "var(--surface)", borderRight: i<2 ? "1px solid var(--line)" : "none", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color: step===s.n ? "#6366F1" : step>s.n ? "#059669" : "var(--muted)" }}>
                  {step > s.n ? "✓" : `Step ${s.n}`}
                </div>
                <div style={{ fontSize:12, marginTop:2, color: step>=s.n ? "var(--text)" : "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="surface">
              <div className="surface-head"><h3>Student registration</h3><p>These details come from an accepted admission application</p></div>
              <div className="human-form">
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>Enrollment</div>
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>Campus / Branch *</span>
                    <select value={form.branchId} onChange={sf("branchId")}>
                      <option value="">— Select campus —</option>
                      {filteredCampuses.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.branchType === "MALE" ? "Boys" : c.branchType === "FEMALE" ? "Girls" : "Co-Ed"})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="human-field"><span>Academic year *</span>
                    <select value={form.academicYearId} onChange={sf("academicYearId")}>
                      <option value="">— Select —</option>
                      {filteredYears.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Class section *</span>
                    <select value={form.classSectionId} onChange={sf("classSectionId")}>
                      <option value="">— Select —</option>
                      {filteredSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Admission date</span>
                    <input type="date" value={form.admissionDate} onChange={sf("admissionDate")}/>
                  </label>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4, marginTop:10 }}>Personal info</div>
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={sf("firstName")}/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={sf("lastName")}/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={sf("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={sf("gender")}>
                      <option value="">—</option><option>Male</option><option>Female</option>
                    </select>
                  </label>
                </div>
                {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setTab("list")}>Cancel</button>
                <button className="primary" onClick={saveStep1} disabled={createStudent.isPending}>
                  {createStudent.isPending ? "Saving…" : "Next: Documents →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="surface">
              <div className="surface-head">
                <div><h3>Required documents</h3><p>These must be uploaded for student registration to be complete</p></div>
              </div>
              <div style={{ padding:"0 20px 20px" }}>
                <DocumentUploader
                  actorType="STUDENT"
                  entityId={newStudentId}
                  tenantId={tid}
                  onComplianceChange={setDocComp}
                  title="Student registration documents"
                />
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="primary" onClick={() => setStep(3)}>
                  {docCompliant ? "Next: Review →" : "Continue without all docs →"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="surface">
              <div className="surface-head"><h3>Review & complete</h3></div>
              <div style={{ padding:"0 20px 20px" }}>
                {!docCompliant && (
                  <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #fde68a", borderRadius:10, marginBottom:14, fontSize:12 }}>
                    <AlertCircle size={16} style={{ color:"#D97706", flexShrink:0 }}/>
                    <span>Some required documents are missing. The student will be saved as <b>PENDING</b> until all documents are submitted.</span>
                  </div>
                )}
                {docCompliant && (
                  <div style={{ padding:"12px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:10, marginBottom:14, fontSize:12, color:"#065f46" }}>
                    ✅ All required documents uploaded. Student will be activated immediately.
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                  {[
                    ["Name", `${form.firstName} ${form.lastName}`],
                    ["Gender", form.gender || "—"],
                    ["Campus", campuses.find((c: any) => c.id === form.branchId)?.name ?? "—"],
                    ["Class section", sections.find((s: any) => s.id === form.classSectionId)?.name ?? "—"],
                    ["Academic year", years.find((y: any) => y.id === form.academicYearId)?.name ?? "—"],
                    ["Documents", docCompliant ? "✓ Complete" : "⚠ Incomplete"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display:"flex", gap:8, padding:"8px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                      <span style={{ width:120, color:"var(--muted)", flexShrink:0 }}>{l}</span>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="primary" onClick={() => setTab("list")}>✓ Complete registration</button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewStudent && (
        <ViewDrawer
          title="Student"
          item={viewStudent}
          onClose={() => setViewStudent(null)}
          fields={[
            { key: "firstName", label: "First name" },
            { key: "lastName", label: "Last name" },
            { key: "studentNumber", label: "Reg #" },
            { key: "gender", label: "Gender" },
            { key: "dateOfBirth", label: "Date of birth" },
            { key: "status", label: "Status" },
          ]}
        />
      )}
    </>
  );
}
