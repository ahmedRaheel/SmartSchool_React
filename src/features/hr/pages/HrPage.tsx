import { useState, useMemo } from "react";
import { BriefcaseBusiness, Plus, Search, Users, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useEmployees, useCreateEmployee, useSchools, useCampuses, useDepartments } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const STAFF_TYPES = ["TEACHER","DRIVER","PRINCIPAL","ADMIN_OFFICER","ACCOUNTANT","HR","LIBRARIAN","TRANSPORT","OTHER"];
const EMP_TYPES   = ["PERMANENT","CONTRACT","PART_TIME","PROBATION"];
const STATUS_PILL: Record<string,string> = { ACTIVE:"success", ON_LEAVE:"warning", TERMINATED:"danger", INACTIVE:"gray" };

export function HrPage() {
  const { user }  = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [q, setQ]         = useState("");
  const [tab, setTab]     = useState<"info"|"employment">("info");
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data, isLoading } = useEmployees();
  const { data: schools }   = useSchools();
  const { data: campuses }  = useCampuses();
  const { data: depts }     = useDepartments();
  const createEmployee = useCreateEmployee();

  const schoolItems  = (schools  as any)?.items ?? (schools  as any) ?? [];
  const campusItems  = (campuses as any)?.items ?? (campuses as any) ?? [];
  const deptItems    = (depts    as any)?.items ?? (depts    as any) ?? [];
  const items        = (data     as any)?.items ?? (data     as any) ?? [];
  const total        = (data     as any)?.totalCount ?? items.length;

  const [form, setForm] = useState({
    schoolId:"", branchId:"", departmentId:"",
    firstName:"", lastName:"", cnicNumber:"", dateOfBirth:"", gender:"", jobTitle:"",
    email:"", phone:"", alternatePhone:"", address:"", emergencyContactName:"", emergencyContactPhone:"",
    hireDate: new Date().toISOString().slice(0,10), employmentTypeCode:"PERMANENT", staffType:"TEACHER",
  });

  const filtered = useMemo(() =>
    items.filter((e:any) => `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.staffType}`.toLowerCase().includes(q.toLowerCase())),
    [items, q]);

  function sf(k: string) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p => ({...p,[k]:e.target.value})); }
  const filteredCampuses = form.schoolId ? campusItems.filter((c:any) => c.schoolId === form.schoolId) : campusItems;
  const filteredDepts    = form.branchId ? deptItems.filter((d:any) => !d.campusId || d.campusId === form.branchId) : deptItems;

  async function save() {
    if (!form.firstName || !form.schoolId || !form.branchId || !form.staffType || !form.employmentTypeCode || !form.hireDate) {
      setError("First name, school, campus, staff type, employment type and hire date are all required"); return;
    }
    try {
      await createEmployee.mutateAsync({ tenantId: tid, ...form, departmentId: form.departmentId || undefined, dateOfBirth: form.dateOfBirth || undefined, cnicNumber: form.cnicNumber || undefined });
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setError(""); setTab("info"); }, 1500);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  return (
    <>
      <PageHeader
        title="HR & Staff"
        subtitle={`${total} staff members across all departments`}
        action={
          <div className="page-actions">
            <button className="primary" onClick={() => { setOpen(true); setError(""); setSuccess(false); setTab("info"); }}>
              <Plus size={14}/> Add staff member
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total staff"    value={isLoading?"…":String(total)}                                                           note="" color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="Teachers"       value={isLoading?"…":String(items.filter((e:any)=>e.staffType==="TEACHER").length)}           note="" color="#2563EB" bg="#EFF6FF"><BriefcaseBusiness size={20}/></StatCard>
        <StatCard label="On leave"       value={isLoading?"…":String(items.filter((e:any)=>e.status==="ON_LEAVE").length)}             note="" color="#D97706" bg="#FFFBEB"><Users size={20}/></StatCard>
        <StatCard label="Drivers"        value={isLoading?"…":String(items.filter((e:any)=>e.staffType==="DRIVER").length)}            note="" color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:300 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name, ID or role…"/>
          </label>
        </div>
        {isLoading ? (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading staff…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Employee</th><th>Number</th><th>Role</th><th>Department</th><th>Hire date</th><th>Type</th><th>Status</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>
                    {q ? `No staff match "${q}"` : "No staff yet. Click Add staff member to get started."}
                  </td></tr>
                ) : filtered.map((e:any) => (
                  <tr key={e.id}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                          {(e.firstName[0] + (e.lastName?.[0] ?? "")).toUpperCase()}
                        </span>
                        <div>
                          <b>{e.firstName} {e.lastName ?? ""}</b>
                          {e.email && <div style={{ fontSize:10, color:"var(--muted)" }}>{e.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize:11 }}>{e.employeeNumber ?? "—"}</code></td>
                    <td><span className="status-pill info" style={{ fontSize:9 }}>{e.staffType}</span></td>
                    <td>{e.department ?? "—"}</td>
                    <td>{e.hireDate}</td>
                    <td>{e.employmentTypeCode}</td>
                    <td><span className={`status-pill ${STATUS_PILL[e.status] ?? "gray"}`}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} staff shown</span></div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width:"min(700px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head" style={{ position:"sticky", top:0, background:"var(--surface)", zIndex:1 }}>
              <h2>Add staff member</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>

            <div className="section-tabs" style={{ padding:"12px 20px 0" }}>
              {(["info","employment"] as const).map(t => (
                <button key={t} className={tab===t?"active":""} onClick={() => setTab(t)}>
                  {t==="info"?"Personal info":"Employment details"}
                </button>
              ))}
            </div>

            {success && (
              <div style={{ margin:"12px 20px 0", padding:"10px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:8, fontSize:12, color:"#065f46", fontWeight:600 }}>
                ✅ Staff member added successfully!
              </div>
            )}

            <div className="human-form">
              {tab === "info" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={sf("firstName")}/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={sf("lastName")}/></label>
                  <label className="human-field"><span>CNIC number</span><input value={form.cnicNumber} onChange={sf("cnicNumber")} placeholder="35202-0000000-0"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={sf("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={sf("gender")}>
                      <option value="">— Select —</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Job title</span><input value={form.jobTitle} onChange={sf("jobTitle")} placeholder="e.g. Senior Mathematics Teacher"/></label>
                  <label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={sf("email")}/></label>
                  <label className="human-field"><span>Phone</span><input value={form.phone} onChange={sf("phone")}/></label>
                  <label className="human-field"><span>Emergency contact</span><input value={form.emergencyContactName} onChange={sf("emergencyContactName")}/></label>
                  <label className="human-field"><span>Emergency phone</span><input value={form.emergencyContactPhone} onChange={sf("emergencyContactPhone")}/></label>
                  <label className="human-field field-wide"><span>Address</span><input value={form.address} onChange={sf("address")}/></label>
                </div>
              )}

              {tab === "employment" && (
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>School *</span>
                    <select value={form.schoolId} onChange={sf("schoolId")}>
                      <option value="">— Select school —</option>
                      {schoolItems.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Campus *</span>
                    <select value={form.branchId} onChange={sf("branchId")} disabled={!form.schoolId}>
                      <option value="">— Select campus —</option>
                      {filteredCampuses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Department</span>
                    <select value={form.departmentId} onChange={sf("departmentId")}>
                      <option value="">— Select department —</option>
                      {filteredDepts.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Staff type *</span>
                    <select value={form.staffType} onChange={sf("staffType")}>
                      {STAFF_TYPES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Employment type *</span>
                    <select value={form.employmentTypeCode} onChange={sf("employmentTypeCode")}>
                      {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Hire date *</span><input type="date" value={form.hireDate} onChange={sf("hireDate")}/></label>
                </div>
              )}

              {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
            </div>

            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createEmployee.isPending || success}>
                {createEmployee.isPending ? "Adding…" : success ? "Added ✓" : "Add staff member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
