import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAdmissions, useCreateAdmission } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import type { Admission } from "../../../core/api/smartschoolApi";

const GRADES   = ["Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SOURCES  = ["Walk-In","Website","Referral","AI Chatbot","Social Media","Phone"];
const STATUSES = ["NEW","UNDER_REVIEW","TEST_SCHEDULED","APPROVED","REJECTED","ENROLLED","WITHDRAWN"];

const STATUS_LABEL: Record<string,string> = {
  NEW:"New", UNDER_REVIEW:"Under Review", TEST_SCHEDULED:"Test Scheduled",
  APPROVED:"Approved", REJECTED:"Rejected", ENROLLED:"Enrolled", WITHDRAWN:"Withdrawn",
};
const STATUS_PILL: Record<string,string> = {
  NEW:"warning", UNDER_REVIEW:"info", TEST_SCHEDULED:"info",
  APPROVED:"success", REJECTED:"danger", ENROLLED:"purple", WITHDRAWN:"gray",
};

const EMPTY = {
  applicantFirstName:"", applicantLastName:"", guardianName:"", guardianPhone:"",
  guardianEmail:"", gradeApplied:"Grade 9", sourceOfInquiry:"Walk-In",
  status:"NEW", notes:"",
};

export function AdmissionsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const { data, isLoading, refetch } = useAdmissions();
  const createAdmission = useCreateAdmission();

  const [q, setQ]             = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const admissions = data?.items ?? [];
  const filtered   = admissions.filter(a =>
    (statusFilter === "ALL" || a.status === statusFilter) &&
    (`${a.applicantFirstName} ${a.applicantLastName ?? ""}`.toLowerCase().includes(q.toLowerCase()))
  );

  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!form.applicantFirstName || !form.guardianName) {
      setError("Applicant name and guardian name are required.");
      return;
    }
    setSaving(true); setError("");
    try {
      await createAdmission.mutateAsync({
        tenantId,
        applicantFirstName: form.applicantFirstName.trim(),
        applicantLastName:  form.applicantLastName.trim() || null,
        guardianName:       form.guardianName.trim(),
        guardianPhone:      form.guardianPhone || null,
        guardianEmail:      form.guardianEmail || null,
        gradeApplied:       form.gradeApplied,
        sourceOfInquiry:    form.sourceOfInquiry,
        status:             form.status,
        notes:              form.notes || null,
      });
      setOpen(false);
      void refetch();
    } catch (err: any) {
      setError(err?.message ?? "Could not create application. Please try again.");
    } finally { setSaving(false); }
  }

  const counts = {
    approved:  admissions.filter(a => a.status === "APPROVED").length,
    pending:   admissions.filter(a => ["NEW","UNDER_REVIEW","TEST_SCHEDULED"].includes(a.status)).length,
    rejected:  admissions.filter(a => a.status === "REJECTED").length,
    enrolled:  admissions.filter(a => a.status === "ENROLLED").length,
  };

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Inquiry → application → test → approval → enrolment pipeline"
        action={
          <div className="page-actions">
            <button className="primary" onClick={() => { setForm(EMPTY); setOpen(true); setError(""); }}>
              <Plus size={15}/> New application
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total applications" value={String(admissions.length)}  note="This cycle"  color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📋</span></StatCard>
        <StatCard label="Approved"           value={String(counts.approved)}    note=""            color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="Pending review"     value={String(counts.pending)}     note=""            color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>⏳</span></StatCard>
        <StatCard label="Enrolled"           value={String(counts.enrolled)}    note="Completed"   color="#8B5CF6" bg="#F5F3FF"><span style={{fontSize:20}}>🎓</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <label className="search-box" style={{ maxWidth:260 }}>
              <Search size={14}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search applicant…"/>
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}
            >
              <option value="ALL">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <button className="primary" onClick={() => { setForm(EMPTY); setOpen(true); setError(""); }}>
            <Plus size={14}/> New application
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading applications…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Applicant</th><th>Grade applied</th><th>Guardian</th>
                  <th>Source</th><th>Inquiry date</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No applications found.</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.admissionInquiryId}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background:"#EFF6FF", color:"#2563EB" }}>
                          {(a.applicantFirstName[0] + (a.applicantLastName?.[0] ?? "")).toUpperCase()}
                        </span>
                        <b>{a.applicantFirstName} {a.applicantLastName ?? ""}</b>
                      </div>
                    </td>
                    <td>{a.gradeApplied ?? "—"}</td>
                    <td>{a.guardianName ?? "—"}</td>
                    <td>{a.source ?? "—"}</td>
                    <td>{new Date(a.inquiryDate).toLocaleDateString()}</td>
                    <td><span className={`status-pill ${STATUS_PILL[a.status] ?? "gray"}`}>{STATUS_LABEL[a.status] ?? a.status}</span></td>
                    <td>
                      <div className="row-actions">
                        <button className="table-action">View</button>
                        {a.status === "APPROVED" && <button className="table-action" style={{ color:"var(--text-success)" }}>Enroll</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>Showing {filtered.length} of {admissions.length}</span></div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width:"min(680px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head" style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface)" }}>
              <h2>New admission application</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field"><span>First name *</span><input value={form.applicantFirstName} onChange={f("applicantFirstName")} placeholder="Child's first name"/></label>
                <label className="human-field"><span>Last name</span><input value={form.applicantLastName} onChange={f("applicantLastName")}/></label>
                <label className="human-field"><span>Grade applying for *</span>
                  <select value={form.gradeApplied} onChange={f("gradeApplied")}>{GRADES.map(g => <option key={g}>{g}</option>)}</select>
                </label>
                <label className="human-field"><span>Status</span>
                  <select value={form.status} onChange={f("status")}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
                </label>
                <label className="human-field"><span>Guardian name *</span><input value={form.guardianName} onChange={f("guardianName")}/></label>
                <label className="human-field"><span>Guardian phone</span><input value={form.guardianPhone} onChange={f("guardianPhone")} placeholder="+92 300 0000000"/></label>
                <label className="human-field"><span>Guardian email</span><input type="email" value={form.guardianEmail} onChange={f("guardianEmail")}/></label>
                <label className="human-field"><span>Source of inquiry</span>
                  <select value={form.sourceOfInquiry} onChange={f("sourceOfInquiry")}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
                </label>
                <label className="human-field field-wide"><span>Notes</span><textarea value={form.notes} onChange={f("notes")} style={{ minHeight:72 }} placeholder="Any additional information…"/></label>
              </div>
              {error && <div style={{ color:"var(--text-danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => void save()} disabled={saving || !form.applicantFirstName || !form.guardianName}>
                {saving ? "Saving…" : "Save application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
