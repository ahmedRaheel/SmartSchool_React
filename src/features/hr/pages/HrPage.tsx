import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useEmployees, useCreateEmployee } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const DEPTS = ["Mathematics","Sciences","Languages","Social Studies","CS","Admin","Finance","HR"];
const ROLES = ["Teacher","Head of Department","Admin Officer","Accountant","Librarian","Driver","Support Staff"];

const EMPTY = {
  firstName:"", lastName:"", cnicNumber:"", dateOfBirth:"", gender:"Male",
  email:"", phone:"", role:"Teacher", department:"Mathematics",
  hireDate:"", employmentTypeCode:"PERMANENT", status:"ACTIVE",
  qualification:"", address:"",
};

export function HrPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const { data, isLoading, refetch } = useEmployees();
  const createEmployee = useCreateEmployee();

  const [q, setQ]           = useState("");
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<"personal"|"employment">("personal");
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const employees = data?.items ?? [];
  const filtered  = employees.filter(e =>
    `${e.firstName} ${e.lastName ?? ""}`.toLowerCase().includes(q.toLowerCase()) ||
    e.employeeNumber.toLowerCase().includes(q.toLowerCase())
  );

  const f = (k: keyof typeof EMPTY) => (ev: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: ev.target.value }));

  async function save() {
    if (!form.firstName) { setError("First name is required."); return; }
    setSaving(true); setError("");
    try {
      await createEmployee.mutateAsync({
        tenantId,
        firstName:          form.firstName.trim(),
        lastName:           form.lastName.trim() || null,
        cnicNumber:         form.cnicNumber || null,
        email:              form.email || null,
        phone:              form.phone || null,
        hireDate:           form.hireDate || null,
        employmentTypeCode: form.employmentTypeCode,
        status:             form.status,
        dateOfBirth:        form.dateOfBirth || null,
        gender:             form.gender,
      });
      setOpen(false);
      void refetch();
    } catch (err: any) {
      setError(err?.message ?? "Could not create staff member. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const STATUS_PILL: Record<string, string> = {
    ACTIVE:"success", INACTIVE:"gray", TERMINATED:"danger", ON_LEAVE:"warning",
  };

  return (
    <>
      <PageHeader
        title="HR Management"
        subtitle={data ? `${data.totalCount.toLocaleString()} staff records · AY 2025–26` : "Loading…"}
        action={
          <div className="page-actions">
            <button className="secondary">Export</button>
            <button className="primary" onClick={() => { setForm(EMPTY); setTab("personal"); setOpen(true); setError(""); }}>
              <Plus size={15}/> Add staff
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total staff"  value={isLoading ? "…" : (data?.totalCount ?? 0).toLocaleString()} note="" color="#0F2241" bg="#EEF2FF"><span style={{ fontSize: 20 }}>👥</span></StatCard>
        <StatCard label="Active"       value={isLoading ? "…" : employees.filter(e => e.status === "ACTIVE").length.toLocaleString()} note="" color="#10B981" bg="#ECFDF5"><span style={{ fontSize: 20 }}>✅</span></StatCard>
        <StatCard label="On leave"     value={isLoading ? "…" : employees.filter(e => e.status === "ON_LEAVE").length.toLocaleString()} note="" color="#D97706" bg="#FFFBEB"><span style={{ fontSize: 20 }}>🏖️</span></StatCard>
        <StatCard label="Payroll due"  value="Sep 1" note="" color="#2563EB" bg="#EFF6FF"><span style={{ fontSize: 20 }}>💳</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth: 320 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff by name or number…"/>
          </label>
          <button className="primary" onClick={() => { setForm(EMPTY); setTab("personal"); setOpen(true); setError(""); }}>
            <Plus size={14}/> Add staff
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading staff…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Name</th><th>Employee No.</th><th>Email</th><th>Hire date</th><th>Type</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>No staff found.</td></tr>
                ) : filtered.map(e => (
                  <tr key={e.employeeId}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background: "#EEF2FF", color: "#6366F1" }}>
                          {(e.firstName[0] + (e.lastName?.[0] ?? "")).toUpperCase()}
                        </span>
                        <b>{e.firstName} {e.lastName ?? ""}</b>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 11 }}>{e.employeeNumber}</code></td>
                    <td>{e.email ?? "—"}</td>
                    <td>{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : "—"}</td>
                    <td>{e.employmentTypeCode ?? "—"}</td>
                    <td><span className={`status-pill ${STATUS_PILL[e.status] ?? "gray"}`}>{e.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="table-action">View</button>
                        <button className="table-action">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          <span>Showing {filtered.length} of {data?.totalCount ?? 0}</span>
        </div>
      </div>

      {/* ── Add Staff Modal ── */}
      {open && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width: "min(700px, 96vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-head" style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface)" }}>
              <h2>Add staff member</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>
            <div className="section-tabs" style={{ padding: "10px 20px 0", marginBottom: 0, borderBottom: "1px solid var(--line)" }}>
              {(["personal","employment"] as const).map(t => (
                <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                  {t === "personal" ? "👤 Personal info" : "💼 Employment"}
                </button>
              ))}
            </div>
            <div className="human-form">
              {tab === "personal" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={f("firstName")}/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={f("lastName")}/></label>
                  <label className="human-field"><span>CNIC</span><input value={form.cnicNumber} onChange={f("cnicNumber")} placeholder="XXXXX-XXXXXXX-X"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={f("gender")}><option>Male</option><option>Female</option></select>
                  </label>
                  <label className="human-field"><span>Phone</span><input value={form.phone} onChange={f("phone")} placeholder="+92 300 0000000"/></label>
                  <label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={f("email")}/></label>
                  <label className="human-field"><span>Qualification</span><input value={form.qualification} onChange={f("qualification")} placeholder="e.g. MSc Mathematics"/></label>
                </div>
              )}
              {tab === "employment" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Role / Position *</span>
                    <select value={form.role} onChange={f("role")}>{ROLES.map(r => <option key={r}>{r}</option>)}</select>
                  </label>
                  <label className="human-field"><span>Department</span>
                    <select value={form.department} onChange={f("department")}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select>
                  </label>
                  <label className="human-field"><span>Hire date</span><input type="date" value={form.hireDate} onChange={f("hireDate")}/></label>
                  <label className="human-field"><span>Employment type</span>
                    <select value={form.employmentTypeCode} onChange={f("employmentTypeCode")}>
                      <option value="PERMANENT">Permanent</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="PART_TIME">Part-time</option>
                      <option value="VISITING">Visiting</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Status</span>
                    <select value={form.status} onChange={f("status")}>
                      <option value="ACTIVE">Active</option>
                      <option value="ON_LEAVE">On Leave</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                </div>
              )}
              {error && <div style={{ color: "var(--text-danger)", fontSize: 12, marginTop: 4 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              {tab === "employment" && <button className="secondary" onClick={() => setTab("personal")}>← Back</button>}
              <div style={{ flex: 1 }} />
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              {tab === "personal"
                ? <button className="primary" onClick={() => setTab("employment")}>Next →</button>
                : <button className="primary" onClick={() => void save()} disabled={saving || !form.firstName}>{saving ? "Saving…" : "Save staff"}</button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
