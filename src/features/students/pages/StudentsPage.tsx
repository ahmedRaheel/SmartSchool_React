import { useState, useMemo } from "react";
import { Check, Plus, Search, UserPlus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useStudents, useCreateStudent, useSchools, useCampuses,
  useAcademicYears, useClassSections,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const STATUS_PILL: Record<string,string> = { ACTIVE:"success", PENDING:"warning", INACTIVE:"gray", SUSPENDED:"danger" };

export function StudentsPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [q, setQ]         = useState("");
  const [open, setOpen]   = useState(false);
  const [tab, setTab]     = useState<"info"|"enroll"|"guardian">("info");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useStudents();
  const { data: schools }   = useSchools();
  const { data: campuses }  = useCampuses();
  const createStudent = useCreateStudent();

  // Cascading form state
  const [form, setForm] = useState({
    schoolId:"", branchId:"", academicYearId:"", classSectionId:"",
    firstName:"", lastName:"", dateOfBirth:"", gender:"", admissionDate: new Date().toISOString().slice(0,10),
  });

  const schoolItems  = (schools  as any)?.items ?? (schools  as any) ?? [];
  const campusItems  = (campuses as any)?.items ?? (campuses as any) ?? [];
  const items        = (data     as any)?.items ?? (data     as any) ?? [];
  const total        = (data     as any)?.totalCount ?? items.length;

  // Filter campuses by selected school
  const filteredCampuses = form.schoolId ? campusItems.filter((c:any) => c.schoolId === form.schoolId) : campusItems;

  const { data: acYears }  = useAcademicYears(form.branchId || undefined);
  const { data: sections } = useClassSections();
  const yearItems    = (acYears  as any)?.items ?? (acYears  as any) ?? [];
  const sectionItems = (sections as any)?.items ?? (sections as any) ?? [];

  const filtered = useMemo(() =>
    items.filter((s:any) => `${s.firstName} ${s.lastName} ${s.studentNumber}`.toLowerCase().includes(q.toLowerCase())),
    [items, q]);

  function sf(k: string) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => { setForm(p => ({...p, [k]: e.target.value})); setError(""); }; }

  async function save() {
    if (!form.firstName) { setError("First name required"); return; }
    if (!form.schoolId || !form.branchId || !form.academicYearId || !form.classSectionId) {
      setError("School, campus, academic year and class section are all required"); return;
    }
    try {
      await createStudent.mutateAsync({ tenantId: tid, ...form, admissionDate: form.admissionDate || undefined, dateOfBirth: form.dateOfBirth || undefined });
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setForm({ schoolId:"", branchId:"", academicYearId:"", classSectionId:"", firstName:"", lastName:"", dateOfBirth:"", gender:"", admissionDate: new Date().toISOString().slice(0,10) }); setError(""); setTab("info"); }, 1500);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed to enrol student"); }
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${total.toLocaleString()} enrolled across all grades`}
        action={
          <div className="page-actions">
            <button className="primary" onClick={() => { setOpen(true); setError(""); setSuccess(false); setTab("info"); }}>
              <UserPlus size={14}/> Enrol student
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total students" value={isLoading?"…":total.toLocaleString()}    note="All grades"    color="#2563EB" bg="#EFF6FF"><UserPlus size={20}/></StatCard>
        <StatCard label="Active"         value={isLoading?"…":String(items.filter((s:any)=>s.status==="ACTIVE").length)}  note="Enrolled"     color="#10B981" bg="#ECFDF5"><Check size={20}/></StatCard>
        <StatCard label="Pending"        value={isLoading?"…":String(items.filter((s:any)=>s.status==="PENDING").length)} note="Awaiting"     color="#D97706" bg="#FFFBEB"><UserPlus size={20}/></StatCard>
        <StatCard label="Shown"          value={String(filtered.length)}                                                   note="After filter" color="#8B5CF6" bg="#F5F3FF"><Search size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:300 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or number…"/>
          </label>
        </div>
        {isLoading ? (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading students…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Student</th><th>Reg #</th><th>Gender</th><th>Date of Birth</th><th>Admission</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>
                    {q ? `No students match "${q}"` : "No students yet. Click Enrol to add one."}
                  </td></tr>
                ) : filtered.map((s:any) => (
                  <tr key={s.id}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                          {(s.firstName[0] + (s.lastName?.[0] ?? "")).toUpperCase()}
                        </span>
                        <b>{s.firstName} {s.lastName ?? ""}</b>
                      </div>
                    </td>
                    <td><code style={{ fontSize:11 }}>{s.studentNumber ?? "—"}</code></td>
                    <td>{s.gender ?? "—"}</td>
                    <td>{s.dateOfBirth ?? "—"}</td>
                    <td>{s.admissionDate ?? "—"}</td>
                    <td><span className={`status-pill ${STATUS_PILL[s.status] ?? "gray"}`}>{s.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="table-action" style={{ fontSize:10 }}>View</button>
                        <button className="table-action" style={{ fontSize:10 }}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} students shown</span></div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width:"min(640px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head" style={{ position:"sticky", top:0, background:"var(--surface)", zIndex:1 }}>
              <h2>Enrol new student</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>

            <div className="section-tabs" style={{ padding:"12px 20px 0" }}>
              {(["info","enroll","guardian"] as const).map(t => (
                <button key={t} className={tab===t?"active":""} onClick={() => setTab(t)}>
                  {t==="info"?"Personal info":t==="enroll"?"Enrolment":"Guardian"}
                </button>
              ))}
            </div>

            {success && (
              <div style={{ margin:"12px 20px 0", padding:"10px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:8, fontSize:12, color:"#065f46", fontWeight:600 }}>
                ✅ Student enrolled successfully!
              </div>
            )}

            <div className="human-form">
              {tab === "info" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={sf("firstName")} placeholder="Ahmed"/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={sf("lastName")} placeholder="Hassan"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={sf("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={sf("gender")}>
                      <option value="">— Select —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Admission date</span><input type="date" value={form.admissionDate} onChange={sf("admissionDate")}/></label>
                </div>
              )}

              {tab === "enroll" && (
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>School *</span>
                    <select value={form.schoolId} onChange={sf("schoolId")}>
                      <option value="">— Select school —</option>
                      {schoolItems.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Campus / Branch *</span>
                    <select value={form.branchId} onChange={sf("branchId")} disabled={!form.schoolId}>
                      <option value="">— Select campus —</option>
                      {filteredCampuses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Academic year *</span>
                    <select value={form.academicYearId} onChange={sf("academicYearId")} disabled={!form.branchId}>
                      <option value="">— Select year —</option>
                      {yearItems.map((y:any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Class section *</span>
                    <select value={form.classSectionId} onChange={sf("classSectionId")} disabled={!form.academicYearId}>
                      <option value="">— Select class —</option>
                      {sectionItems.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                </div>
              )}

              {tab === "guardian" && (
                <div>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Guardian details can be added after enrolment from the student profile.</p>
                </div>
              )}

              {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
            </div>

            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createStudent.isPending || success}>
                {createStudent.isPending ? "Enrolling…" : success ? "Enrolled ✓" : "Enrol student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
