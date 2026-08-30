import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useStudents, useCreateStudent } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import type { Student } from "../../../core/api/smartschoolApi";

const GRADES   = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SECTIONS = ["A","B","C","D"];
const EMPTY_FORM = {
  firstName:"", lastName:"", dateOfBirth:"", gender:"Male",
  gradeLevel:"Grade 9", section:"A", admissionDate:"", status:"ACTIVE",
  phone:"", address:"", guardianName:"", guardianPhone:"",
  guardianEmail:"", cnicNumber:"", nationality:"",
};

export function StudentsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const { data, isLoading, refetch } = useStudents();
  const createStudent = useCreateStudent();

  const [q, setQ]             = useState("");
  const [open, setOpen]       = useState(false);
  const [tab, setTab]         = useState<"personal"|"academic"|"guardian">("personal");
  const [form, setForm]       = useState(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const students = data?.items ?? [];
  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName ?? ""}`.toLowerCase().includes(q.toLowerCase()) ||
    s.studentNumber.toLowerCase().includes(q.toLowerCase())
  );

  function openAdd() { setForm(EMPTY_FORM); setTab("personal"); setOpen(true); setError(""); }
  const f = (k: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.firstName) { setError("First name is required."); return; }
    setSaving(true); setError("");
    try {
      await createStudent.mutateAsync({
        tenantId,
        firstName:     form.firstName.trim(),
        lastName:      form.lastName.trim() || null,
        dateOfBirth:   form.dateOfBirth || null,
        gender:        form.gender,
        status:        form.status,
        admissionDate: form.admissionDate || null,
        cnicNumber:    form.cnicNumber || null,
        phone:         form.phone || null,
        address:       form.address || null,
      });
      setOpen(false);
      void refetch();
    } catch (err: any) {
      setError(err?.message ?? "Could not create student. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const STATUS_PILL: Record<string, string> = {
    ACTIVE:"success", INACTIVE:"gray", GRADUATED:"info",
    WITHDRAWN:"warning", PENDING:"warning",
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={data ? `${data.totalCount.toLocaleString()} students enrolled · AY 2025–26` : "Loading…"}
        action={
          <div className="page-actions">
            <button className="secondary">Export CSV</button>
            <button className="primary" onClick={openAdd}><Plus size={15}/> Enroll student</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total students" value={isLoading ? "…" : (data?.totalCount ?? 0).toLocaleString()} note="Enrolled" color="#2563EB" bg="#EFF6FF"><span style={{ fontSize: 20 }}>🎓</span></StatCard>
        <StatCard label="Active"         value={isLoading ? "…" : students.filter(s => s.status === "ACTIVE").length.toLocaleString()} note="" color="#10B981" bg="#ECFDF5"><span style={{ fontSize: 20 }}>✅</span></StatCard>
        <StatCard label="This page"      value={String(filtered.length)} note="Filtered results" color="#D97706" bg="#FFFBEB"><span style={{ fontSize: 20 }}>📋</span></StatCard>
        <StatCard label="Pages"          value={data ? String(Math.ceil(data.totalCount / (data.pageSize || 50))) : "…"} note="Total pages" color="#8B5CF6" bg="#F5F3FF"><span style={{ fontSize: 20 }}>📄</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth: 320 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or roll number…"/>
          </label>
          <button className="primary" onClick={openAdd}><Plus size={14}/> Enroll student</button>
        </div>

        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading students…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Student</th><th>Roll No.</th><th>Status</th><th>Gender</th>
                  <th>Admission date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>No students found.</td></tr>
                ) : filtered.map(s => (
                  <tr key={s.studentId}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                          {(s.firstName[0] + (s.lastName?.[0] ?? "")).toUpperCase()}
                        </span>
                        <div>
                          <b>{s.firstName} {s.lastName ?? ""}</b>
                        </div>
                      </div>
                    </td>
                    <td><code style={{ fontSize: 11 }}>{s.studentNumber}</code></td>
                    <td><span className={`status-pill ${STATUS_PILL[s.status] ?? "gray"}`}>{s.status}</span></td>
                    <td>{s.gender ?? "—"}</td>
                    <td>{s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : "—"}</td>
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
          <span>Showing {filtered.length} of {data?.totalCount ?? 0} students</span>
        </div>
      </div>

      {/* ── Enroll Student Modal ── */}
      {open && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width: "min(700px, 96vw)", maxHeight: "90vh", overflowY: "auto" }}>
            <div className="modal-head" style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--surface)" }}>
              <h2>Enroll new student</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>

            <div className="section-tabs" style={{ padding: "10px 20px 0", marginBottom: 0, borderBottom: "1px solid var(--line)" }}>
              {(["personal","academic","guardian"] as const).map(t => (
                <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                  {t === "personal" ? "👤 Personal" : t === "academic" ? "📚 Academic" : "👨‍👩‍👧 Guardian"}
                </button>
              ))}
            </div>

            <div className="human-form">
              {tab === "personal" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={f("firstName")} placeholder="First name"/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={f("lastName")} placeholder="Last name"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={f("gender")}><option>Male</option><option>Female</option></select>
                  </label>
                  <label className="human-field"><span>CNIC</span><input value={form.cnicNumber} onChange={f("cnicNumber")} placeholder="XXXXX-XXXXXXX-X"/></label>
                  <label className="human-field"><span>Phone</span><input value={form.phone} onChange={f("phone")} placeholder="+92 300 0000000"/></label>
                  <label className="human-field field-wide"><span>Address</span><textarea value={form.address} onChange={f("address")} style={{ minHeight: 72 }}/></label>
                </div>
              )}
              {tab === "academic" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Grade / Class *</span>
                    <select value={form.gradeLevel} onChange={f("gradeLevel")}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
                  </label>
                  <label className="human-field"><span>Section *</span>
                    <select value={form.section} onChange={f("section")}>{SECTIONS.map(s => <option key={s}>{s}</option>)}</select>
                  </label>
                  <label className="human-field"><span>Admission date</span><input type="date" value={form.admissionDate} onChange={f("admissionDate")}/></label>
                  <label className="human-field"><span>Status</span>
                    <select value={form.status} onChange={f("status")}>
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Nationality</span><input value={form.nationality} onChange={f("nationality")} placeholder="e.g. Pakistani"/></label>
                </div>
              )}
              {tab === "guardian" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Guardian name *</span><input value={form.guardianName} onChange={f("guardianName")}/></label>
                  <label className="human-field"><span>Guardian phone</span><input value={form.guardianPhone} onChange={f("guardianPhone")} placeholder="+92 300 0000000"/></label>
                  <label className="human-field"><span>Guardian email</span><input type="email" value={form.guardianEmail} onChange={f("guardianEmail")}/></label>
                </div>
              )}
              {error && <div style={{ color: "var(--text-danger)", fontSize: 12, marginTop: 4 }}>{error}</div>}
            </div>

            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              {tab !== "personal" && <button className="secondary" onClick={() => setTab(tab === "guardian" ? "academic" : "personal")}>← Back</button>}
              <div style={{ flex: 1 }} />
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              {tab !== "guardian"
                ? <button className="primary" onClick={() => setTab(tab === "personal" ? "academic" : "guardian")}>Next →</button>
                : <button className="primary" onClick={() => void save()} disabled={saving || !form.firstName}>{saving ? "Saving…" : "Enroll student"}</button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
