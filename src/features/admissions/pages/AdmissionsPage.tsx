import { useState, useMemo } from "react";
import { Plus, Search, Users, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useInquiries, useCreateInquiry, useUpdateInquiry } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const STATUSES = ["ALL","NEW","UNDER_REVIEW","APPROVED","ENROLLED","REJECTED"];
const STATUS_PILL: Record<string,string> = { NEW:"info", UNDER_REVIEW:"warning", APPROVED:"success", ENROLLED:"success", REJECTED:"danger" };
const SOURCES = ["Walk-In","Website","Referral","AI Chatbot","Phone","Social Media"];
const GRADES  = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

function parseMeta(json?: string|null) {
  try { return JSON.parse(json ?? "{}"); } catch { return {}; }
}

export function AdmissionsPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [q, setQ]         = useState("");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]   = useState({ applicantFirstName:"", applicantLastName:"", guardianName:"", guardianPhone:"", gradeApplied:"Grade 9", sourceOfInquiry:"Walk-In" });

  const { data, isLoading } = useInquiries();
  const createInquiry = useCreateInquiry();
  const updateInquiry = useUpdateInquiry();

  const items  = (data as any)?.items ?? (data as any) ?? [];
  const total  = (data as any)?.totalCount ?? items.length;

  const filtered = useMemo(() =>
    items.filter((i:any) => {
      const meta = parseMeta(i.metadataJson);
      const matchQ = `${i.name} ${i.code} ${meta.applicantFirstName} ${meta.guardianName}`.toLowerCase().includes(q.toLowerCase());
      const matchS = status === "ALL" || meta.status === status;
      return matchQ && matchS;
    }),
    [items, q, status]);

  function sf(k: string) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p => ({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.applicantFirstName || !form.guardianName || !form.guardianPhone) {
      setError("Applicant name, guardian name and phone required"); return;
    }
    const name = `${form.applicantFirstName} ${form.applicantLastName} — ${form.gradeApplied}`.trim();
    try {
      await createInquiry.mutateAsync({ tenantId: tid, name, metadataJson: JSON.stringify({ ...form, status:"NEW" }) });
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); setForm({ applicantFirstName:"", applicantLastName:"", guardianName:"", guardianPhone:"", gradeApplied:"Grade 9", sourceOfInquiry:"Walk-In" }); setError(""); }, 1500);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  async function updateStatus(id: string, newStatus: string) {
    const item = items.find((i:any) => i.id === id);
    if (!item) return;
    const meta = parseMeta(item.metadataJson);
    try {
      await updateInquiry.mutateAsync({ id, body: { tenantId: tid, name: item.name, metadataJson: JSON.stringify({ ...meta, status: newStatus }) } });
    } catch { /* silent */ }
  }

  const countByStatus = (s: string) => items.filter((i:any) => parseMeta(i.metadataJson).status === s).length;

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle={`${total} total inquiries in pipeline`}
        action={
          <div className="page-actions">
            <button className="primary" onClick={() => { setOpen(true); setError(""); setSuccess(false); }}><Plus size={14}/> New inquiry</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total inquiries" value={String(total)}              note="All time"    color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="New"             value={String(countByStatus("NEW"))}note="Awaiting"  color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
        <StatCard label="Approved"        value={String(countByStatus("APPROVED"))} note=""  color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Enrolled"        value={String(countByStatus("ENROLLED"))} note=""  color="#8B5CF6" bg="#F5F3FF"><Users size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8 }}>
            <label className="search-box" style={{ maxWidth:260 }}>
              <Search size={14}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or guardian…"/>
            </label>
            <select value={status} onChange={e=>setStatus(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading inquiries…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Ref #</th><th>Applicant</th><th>Grade</th><th>Guardian</th><th>Source</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No inquiries found.</td></tr>
                ) : filtered.map((inq:any) => {
                  const meta = parseMeta(inq.metadataJson);
                  return (
                    <tr key={inq.id}>
                      <td><code style={{ fontSize:11 }}>{inq.code}</code></td>
                      <td><b>{meta.applicantFirstName ?? ""} {meta.applicantLastName ?? ""}</b></td>
                      <td>{meta.gradeApplied ?? "—"}</td>
                      <td>
                        <div>{meta.guardianName ?? "—"}</div>
                        {meta.guardianPhone && <div style={{ fontSize:10, color:"var(--muted)" }}>{meta.guardianPhone}</div>}
                      </td>
                      <td>{meta.sourceOfInquiry ?? "—"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[meta.status ?? "NEW"] ?? "gray"}`}>{meta.status ?? "NEW"}</span></td>
                      <td>
                        <div className="row-actions">
                          {meta.status === "NEW" && <button className="table-action" style={{ fontSize:10 }} onClick={() => updateStatus(inq.id,"UNDER_REVIEW")}>Review</button>}
                          {meta.status === "UNDER_REVIEW" && <button className="table-action" style={{ fontSize:10 }} onClick={() => updateStatus(inq.id,"APPROVED")}>Approve</button>}
                          {meta.status === "APPROVED" && <button className="table-action" style={{ fontSize:10 }} onClick={() => updateStatus(inq.id,"ENROLLED")}>Enrol</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} shown</span></div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{ width:"min(540px,96vw)" }}>
            <div className="modal-head"><h2>New admission inquiry</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            {success && <div style={{ margin:"10px 20px 0", padding:"10px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:8, fontSize:12, color:"#065f46", fontWeight:600 }}>✅ Inquiry submitted!</div>}
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field"><span>Applicant first name *</span><input value={form.applicantFirstName} onChange={sf("applicantFirstName")}/></label>
              <label className="human-field"><span>Applicant last name</span><input value={form.applicantLastName} onChange={sf("applicantLastName")}/></label>
              <label className="human-field"><span>Grade applied for</span>
                <select value={form.gradeApplied} onChange={sf("gradeApplied")}>
                  {GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Source of inquiry</span>
                <select value={form.sourceOfInquiry} onChange={sf("sourceOfInquiry")}>
                  {SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Guardian name *</span><input value={form.guardianName} onChange={sf("guardianName")}/></label>
              <label className="human-field"><span>Guardian phone *</span><input value={form.guardianPhone} onChange={sf("guardianPhone")} placeholder="+92 300 0000000"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createInquiry.isPending||success}>{createInquiry.isPending?"Submitting…":success?"Submitted ✓":"Submit inquiry"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
