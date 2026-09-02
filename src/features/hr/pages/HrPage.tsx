import React, { useEffect, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import { useEmployees, useCreateEmployee, useCampuses, useDepartments } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { Users, Briefcase, UserCheck, AlertCircle } from "lucide-react";

const STAFF_TYPES = ["TEACHER","DRIVER","PRINCIPAL","ADMIN_OFFICER","ACCOUNTANT","HR","LIBRARIAN","TRANSPORT","OTHER"];
const EMPLOYMENT_TYPES = ["PERMANENT","CONTRACT","PART_TIME"];

export function HrPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"list"|"new">("list");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<1|2|3>(1);
  const [newEmpId, setNewEmpId] = useState("");
  const [docCompliant, setDocComp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [localEmp, setLocalEmp] = useState<any[]>([]);
  const { data, isLoading } = useEmployees();
  useEffect(()=>{ setLocalEmp((data as any)?.items??(data as any)??[]); },[data]);
  const { data: campusesData } = useCampuses();
  const { data: deptsData } = useDepartments();
  const createEmployee = useCreateEmployee();

  const employees = localEmp;
  const campuses  = (campusesData as any)?.items ?? (campusesData as any) ?? [];
  const depts     = (deptsData as any)?.items ?? (deptsData as any) ?? [];

  const [form, setForm] = useState({
    schoolId: "", branchId: "", departmentId: "",
    firstName: "", lastName: "", cnicNumber: "", dateOfBirth: "", gender: "",
    jobTitle: "", staffType: "TEACHER", employmentTypeCode: "PERMANENT",
    email: "", phone: "", alternatePhone: "", address: "",
    emergencyContactName: "", emergencyContactPhone: "",
    hireDate: new Date().toISOString().slice(0,10),
    qualification: "",
  });

  function sf(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  const filtered = employees.filter((e: any) =>
    `${e.firstName} ${e.lastName} ${e.jobTitle} ${e.staffType}`.toLowerCase().includes(search.toLowerCase())
  );

  async function saveStep1() {
    if (!form.firstName || !form.branchId || !form.staffType || !form.hireDate) {
      setError("First name, campus, staff type and hire date are required"); return;
    }
    setError("");
    try {
      const result: any = await createEmployee.mutateAsync({
        tenantId: tid,
        schoolId: campuses.find((c:any) => c.id === form.branchId)?.schoolId ?? "",
        branchId: form.branchId,
        departmentId: form.departmentId || undefined,
        firstName: form.firstName, lastName: form.lastName || undefined,
        cnicNumber: form.cnicNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        jobTitle: form.jobTitle || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        hireDate: form.hireDate,
        employmentTypeCode: form.employmentTypeCode,
        staffType: form.staffType,
      });
      setNewEmpId(result?.id ?? `emp-mock-${Date.now()}`);
      setStep(2);
    } catch(e: any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  const STAFF_ACTOR: Record<string,string> = {
    TEACHER: "TEACHER", DRIVER: "DRIVER", ADMIN_OFFICER: "ADMIN_OFFICER",
    PRINCIPAL: "TEACHER", ACCOUNTANT: "EMPLOYEE", HR: "EMPLOYEE",
    LIBRARIAN: "EMPLOYEE", TRANSPORT: "DRIVER", OTHER: "EMPLOYEE",
  };

  const staffByType = (t: string) => employees.filter((e:any) => e.staffType === t).length;

  return (
    <>
      <PageHeader title="HR & Staff" subtitle="Employee management with document compliance"
        action={<div className="page-actions">
          {tab === "list" && <button className="primary" onClick={() => { setTab("new"); setStep(1); setNewEmpId(""); setDocComp(false); setSubmitted(false); setError(""); }}><Plus size={14}/> Add staff</button>}
          {tab === "new"  && <button className="secondary" onClick={() => setTab("list")}>← Back to list</button>}
        </div>}
      />

      {tab === "list" && (
        <>
          <section className="metric-grid" style={{ marginBottom:20 }}>
            <StatCard label="Total staff" value={String(employees.length)}    note=""           color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
            <StatCard label="Teachers"    value={String(staffByType("TEACHER"))} note=""        color="#2563EB" bg="#EFF6FF"><UserCheck size={20}/></StatCard>
            <StatCard label="Drivers"     value={String(staffByType("DRIVER"))}  note=""        color="#D97706" bg="#FFFBEB"><Briefcase size={20}/></StatCard>
            <StatCard label="Admin"       value={String(staffByType("ADMIN_OFFICER"))} note=""  color="#8B5CF6" bg="#F5F3FF"><Users size={20}/></StatCard>
          </section>
          <div className="surface">
            <div className="surface-head">
              <label className="search-box" style={{ maxWidth:280 }}>
                <Search size={14}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"/>
              </label>
            </div>
            {isLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
              <div className="table-wrap">
                <table className="premium-table">
                  <thead><tr><th>Name</th><th>Employee #</th><th>Role</th><th>Department</th><th>Campus</th><th>Hire date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No staff found.</td></tr>
                      : filtered.map((e: any) => (
                        <tr key={e.id}>
                          <td>
                            <div className="person-cell">
                              <span className="row-avatar">{e.firstName?.[0]}{e.lastName?.[0]??""}</span>
                              <div><b>{e.firstName} {e.lastName ?? ""}</b><div style={{ fontSize:10, color:"var(--muted)" }}>{e.email ?? ""}</div></div>
                            </div>
                          </td>
                          <td><code style={{ fontSize:11 }}>{e.employeeNumber ?? "—"}</code></td>
                          <td>
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#EEF2FF", color:"#6366F1", fontWeight:700 }}>
                              {e.staffType ?? "—"}
                            </span>
                          </td>
                          <td style={{ fontSize:11 }}>{e.department ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{e.jobTitle ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : "—"}</td>
                          <td><span className={`status-pill ${e.status === "ACTIVE" ? "success" : e.status === "ON_LEAVE" ? "warning" : e.status === "PENDING" ? "info" : "danger"}`}>{e.status}</span></td>
                          <td>
                            <div className="row-actions">
                              {e.status !== "ACTIVE" && e.status !== "TERMINATED" && (
                                <button className="table-action approve"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"ACTIVE"}:x)); }}>
                                  ✓ Approve
                                </button>
                              )}
                              {e.status === "ACTIVE" && (
                                <button className="table-action hold"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"ON_LEAVE"}:x)); }}>
                                  ⏸ Leave
                                </button>
                              )}
                              {e.status !== "TERMINATED" && (
                                <button className="table-action reject"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"TERMINATED"}:x)); }}>
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
            <div className="table-footer"><span>{filtered.length} staff members</span></div>
          </div>
        </>
      )}

      {tab === "new" && (
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          {/* Step indicator */}
          <div style={{ display:"flex", gap:0, marginBottom:20, border:"1px solid var(--line)", borderRadius:12, overflow:"hidden" }}>
            {[
              { n:1, label:"Personal & Role info" },
              { n:2, label:"Upload required documents" },
              { n:3, label:"Review & confirm" },
            ].map((s, i) => (
              <div key={s.n} style={{ flex:1, padding:"12px 16px", background: step===s.n ? "#EEF2FF" : step>s.n ? "#ECFDF5" : "var(--surface)", borderRight: i<2 ? "1px solid var(--line)" : "none", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color: step===s.n ? "#6366F1" : step>s.n ? "#059669" : "var(--muted)" }}>
                  {step > s.n ? "✓" : `Step ${s.n}`}
                </div>
                <div style={{ fontSize:12, marginTop:2, color: step>=s.n ? "var(--text)" : "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Step 1 — Personal info */}
          {step === 1 && (
            <div className="surface">
              <div className="surface-head"><h3>Staff information</h3></div>
              <div className="human-form">
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>Role & placement</div>
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>Campus *</span>
                    <select value={form.branchId} onChange={sf("branchId")}>
                      <option value="">— Select campus —</option>
                      {campuses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Staff type *</span>
                    <select value={form.staffType} onChange={sf("staffType")}>
                      {STAFF_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Employment type</span>
                    <select value={form.employmentTypeCode} onChange={sf("employmentTypeCode")}>
                      {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Department</span>
                    <select value={form.departmentId} onChange={sf("departmentId")}>
                      <option value="">— None —</option>
                      {depts.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Job title</span><input value={form.jobTitle} onChange={sf("jobTitle")} placeholder="e.g. Senior Mathematics Teacher"/></label>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4, marginTop:10 }}>Personal details</div>
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={sf("firstName")}/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={sf("lastName")}/></label>
                  <label className="human-field"><span>CNIC</span><input value={form.cnicNumber} onChange={sf("cnicNumber")} placeholder="35202-0000000-0"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={sf("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={sf("gender")}>
                      <option value="">—</option><option>Male</option><option>Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Qualification</span><input value={form.qualification} onChange={sf("qualification")} placeholder="e.g. MSc Mathematics"/></label>
                  <label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={sf("email")}/></label>
                  <label className="human-field"><span>Phone</span><input value={form.phone} onChange={sf("phone")}/></label>
                  <label className="human-field"><span>Hire date *</span><input type="date" value={form.hireDate} onChange={sf("hireDate")}/></label>
                  <label className="human-field field-wide"><span>Address</span><input value={form.address} onChange={sf("address")}/></label>
                  <label className="human-field"><span>Emergency contact name</span><input value={form.emergencyContactName} onChange={sf("emergencyContactName")}/></label>
                  <label className="human-field"><span>Emergency contact phone</span><input value={form.emergencyContactPhone} onChange={sf("emergencyContactPhone")}/></label>
                </div>
                {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setTab("list")}>Cancel</button>
                <button className="primary" onClick={saveStep1} disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? "Saving…" : "Next: Upload documents →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Documents */}
          {step === 2 && (
            <div className="surface">
              <div className="surface-head">
                <div>
                  <h3>Required documents</h3>
                  <p>All marked required must be uploaded before the employee can be approved</p>
                </div>
              </div>
              <div style={{ padding:"0 20px 20px" }}>
                <DocumentUploader
                  actorType={STAFF_ACTOR[form.staffType] ?? "EMPLOYEE"}
                  entityId={newEmpId}
                  tenantId={tid}
                  staffType={form.staffType}
                  onComplianceChange={setDocComp}
                  title={`Documents for ${form.staffType}`}
                />
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="primary" onClick={() => setStep(3)}>
                  {docCompliant ? "Next: Review →" : "Skip for now →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="surface">
              <div className="surface-head"><h3>Review & confirm</h3></div>
              <div style={{ padding:"0 20px 20px" }}>
                {!docCompliant && (
                  <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #fde68a", borderRadius:10, marginBottom:14, fontSize:12 }}>
                    <AlertCircle size={16} style={{ color:"#D97706", flexShrink:0 }}/>
                    <span>Not all required documents have been uploaded. The employee will be saved as <b>PENDING_DOCUMENTS</b> and must upload remaining documents before approval.</span>
                  </div>
                )}
                {docCompliant && (
                  <div style={{ padding:"12px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:10, marginBottom:14, fontSize:12, color:"#065f46" }}>
                    ✅ All required documents uploaded. Employee is ready for approval.
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                  {[
                    ["Name", `${form.firstName} ${form.lastName}`],
                    ["Staff type", form.staffType],
                    ["Employment", form.employmentTypeCode],
                    ["Hire date", form.hireDate],
                    ["Email", form.email || "—"],
                    ["Phone", form.phone || "—"],
                    ["Campus", campuses.find((c:any)=>c.id===form.branchId)?.name ?? form.branchId],
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
                <button className="primary" onClick={() => { setSubmitted(true); setTab("list"); }}>
                  ✓ Confirm & save employee
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
