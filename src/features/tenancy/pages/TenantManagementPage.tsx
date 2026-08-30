import { useState } from "react";
import { Building2, Plus, Shield, X, ExternalLink } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useTenants, useCreateTenant, useImpersonate } from "../../../core/api/queries";
import type { CreateTenantRequest } from "../../../core/api/backendContracts";

const EMPTY: CreateTenantRequest = {
  name:"", adminFirstName:"", adminLastName:"", adminEmail:"",
  adminPhoneNumber:"", contactName:"", contactEmail:"",
  contactPhone:"", contactAddress:"",
};

const STATUS_PILL: Record<string,string> = { ACTIVE:"success", TRIAL:"warning", SUSPENDED:"danger", INACTIVE:"gray" };

export function TenantManagementPage() {
  const { data, isLoading, refetch } = useTenants();
  const createTenant = useCreateTenant();
  const impersonate  = useImpersonate();

  const [open, setOpen]       = useState(false);
  const [form, setForm]       = useState<CreateTenantRequest>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [created, setCreated] = useState<{email:string;password:string}|null>(null);
  const [impersonating, setImpersonating] = useState<string|null>(null);

  const tenants = (data as any)?.items ?? (data as any) ?? [];

  const f = (k: keyof CreateTenantRequest) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  function parseMeta(json?: string|null) {
    try { return JSON.parse(json ?? "{}"); } catch { return {}; }
  }

  async function save() {
    const required: (keyof CreateTenantRequest)[] = ["name","adminFirstName","adminLastName","adminEmail","contactName","contactEmail","contactPhone","contactAddress"];
    const missing = required.find(k => !form[k]);
    if (missing) { setError(`${missing} is required`); return; }
    setSaving(true); setError("");
    try {
      const res = await createTenant.mutateAsync(form);
      setCreated({ email: (res as any)?.adminAccount?.email ?? form.adminEmail, password: (res as any)?.adminAccount?.temporaryPassword ?? "Generated" });
      setOpen(false);
      void refetch();
    } catch(e: any) { setError(e?.message ?? "Failed to create tenant"); }
    finally { setSaving(false); }
  }

  async function doImpersonate(tenantId: string, adminEmail: string) {
    setImpersonating(tenantId);
    try {
      await impersonate.mutateAsync({ targetUserId: adminEmail, reason: "Super Admin platform support" });
    } catch {
      alert("Impersonation failed. Check that the tenant admin account exists.");
    } finally { setImpersonating(null); }
  }

  return (
    <>
      <PageHeader
        title="School / Tenant Management"
        subtitle="SaaS platform — all schools and organisations"
        action={
          <div className="page-actions">
            <button className="primary" onClick={() => { setOpen(true); setForm(EMPTY); setError(""); setCreated(null); }}>
              <Plus size={15}/> Onboard school
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total schools"  value={isLoading?"…":String(tenants.length)} note="" color="#2563EB" bg="#EFF6FF"><Building2 size={20}/></StatCard>
        <StatCard label="Active"         value={isLoading?"…":String(tenants.filter((t:any)=>parseMeta(t.metadataJson).status==="ACTIVE").length)} note="" color="#10B981" bg="#ECFDF5"><Building2 size={20}/></StatCard>
        <StatCard label="Trial"          value={isLoading?"…":String(tenants.filter((t:any)=>parseMeta(t.metadataJson).status==="TRIAL").length)}  note="" color="#D97706" bg="#FFFBEB"><Building2 size={20}/></StatCard>
        <StatCard label="Platform MRR"   value="$52.4K"                              note="↑ 14% YoY" color="#8B5CF6" bg="#F5F3FF"><Shield size={20}/></StatCard>
      </section>

      {/* Success message after create */}
      {created && (
        <div style={{ background:"#ECFDF5", border:"1.5px solid #a7f3d0", borderRadius:12, padding:"14px 20px", marginBottom:16, fontSize:12 }}>
          <b>✅ School created successfully!</b>
          <div style={{ marginTop:6, color:"#065f46" }}>Admin credentials — Email: <code>{created.email}</code> · Temporary password: <code>{created.password}</code></div>
          <div style={{ marginTop:4, color:"#065f46" }}>The admin must change password on first login.</div>
        </div>
      )}

      <div className="surface">
        <div className="surface-head"><h3>All schools on platform</h3></div>
        {isLoading ? (
          <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Loading schools…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>School</th><th>Code</th><th>City</th><th>Plan</th><th>Students</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tenants.length===0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>No schools yet. Click "Onboard school" to add the first one.</td></tr>
                ) : tenants.map((t: any) => {
                  const meta = parseMeta(t.metadataJson);
                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="person-cell">
                          <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                            {t.name.slice(0,2).toUpperCase()}
                          </span>
                          <div>
                            <b>{t.name}</b>
                            {meta.adminEmail && <div style={{ fontSize:10, color:"var(--muted)" }}>{meta.adminEmail}</div>}
                          </div>
                        </div>
                      </td>
                      <td><code style={{ fontSize:11 }}>{t.code}</code></td>
                      <td>{meta.city ?? "—"}</td>
                      <td>
                        <span style={{ padding:"2px 8px", borderRadius:5, fontSize:10, fontWeight:600,
                          background: meta.subscriptionPlan==="Enterprise"?"#F5F3FF":meta.subscriptionPlan==="Pro"?"#EFF6FF":"#FFFBEB",
                          color: meta.subscriptionPlan==="Enterprise"?"#8B5CF6":meta.subscriptionPlan==="Pro"?"#2563EB":"#D97706",
                        }}>
                          {meta.subscriptionPlan ?? "Starter"}
                        </span>
                      </td>
                      <td>{meta.studentCount ? meta.studentCount.toLocaleString() : "—"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[meta.status ?? "ACTIVE"] ?? "gray"}`}>{meta.status ?? "Active"}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="table-action" style={{ fontSize:10 }}
                            disabled={impersonating===t.id}
                            onClick={() => doImpersonate(t.id, meta.adminEmail ?? "")}>
                            {impersonating===t.id ? "…" : <><Shield size={11}/> Impersonate</>}
                          </button>
                          <button className="table-action" style={{ fontSize:10 }}>Manage</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{tenants.length} schools on platform</span></div>
      </div>

      {/* Onboard School Modal */}
      {open && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setOpen(false); }}>
          <div className="modal-card" style={{ width:"min(720px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head" style={{ position:"sticky", top:0, zIndex:1, background:"var(--surface)" }}>
              <h2>Onboard new school</h2>
              <button className="icon-button" onClick={() => setOpen(false)}><X size={18}/></button>
            </div>

            <div className="human-form">
              <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:.8, padding:"4px 0 8px", borderBottom:"1px solid var(--line)", marginBottom:16 }}>School information</div>
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>School name *</span><input value={form.name} onChange={f("name")} placeholder="e.g. City Grammar School"/></label>
              </div>

              <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:.8, padding:"16px 0 8px", borderBottom:"1px solid var(--line)", marginBottom:16 }}>Admin account (auto-created)</div>
              <div className="human-form-grid">
                <label className="human-field"><span>First name *</span><input value={form.adminFirstName} onChange={f("adminFirstName")}/></label>
                <label className="human-field"><span>Last name *</span><input value={form.adminLastName} onChange={f("adminLastName")}/></label>
                <label className="human-field"><span>Admin email * </span><input type="email" value={form.adminEmail} onChange={f("adminEmail")} placeholder="admin@school.edu"/></label>
                <label className="human-field"><span>Admin phone</span><input value={form.adminPhoneNumber ?? ""} onChange={f("adminPhoneNumber")}/></label>
              </div>

              <div style={{ fontSize:12, fontWeight:600, color:"var(--muted)", textTransform:"uppercase", letterSpacing:.8, padding:"16px 0 8px", borderBottom:"1px solid var(--line)", marginBottom:16 }}>Contact details</div>
              <div className="human-form-grid">
                <label className="human-field"><span>Contact name *</span><input value={form.contactName} onChange={f("contactName")}/></label>
                <label className="human-field"><span>Contact email *</span><input type="email" value={form.contactEmail} onChange={f("contactEmail")}/></label>
                <label className="human-field"><span>Contact phone *</span><input value={form.contactPhone} onChange={f("contactPhone")}/></label>
                <label className="human-field field-wide"><span>Contact address *</span><textarea value={form.contactAddress} onChange={e => setForm(p=>({...p,contactAddress:e.target.value}))} style={{ minHeight:64 }} placeholder="Full mailing address"/></label>
              </div>

              {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
            </div>

            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={saving}>{saving?"Creating school…":"Onboard school"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
