import React, { useState } from "react";
import { Building2, Plus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useTenants, useCreateTenant, useImpersonate } from "../../../core/api/queries";
import { useNavigate } from "react-router-dom";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

const PLANS: Record<string,{color:string;bg:string}> = {
  Starter:    { color:"#6B7280", bg:"#F9FAFB" },
  Pro:        { color:"#2563EB", bg:"#EFF6FF" },
  Enterprise: { color:"#7C3AED", bg:"#F5F3FF" },
  Trial:      { color:"#D97706", bg:"#FFFBEB" },
};

export function TenantManagementPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<any>(null);
  const [form, setForm] = useState({
    name:"", adminFirstName:"", adminLastName:"", adminEmail:"", adminPhoneNumber:"",
    contactName:"", contactEmail:"", contactPhone:"", contactAddress:"",
  });

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(25);
  const [localTenants, setLocalTenants] = React.useState<any[]>([]);
  const { data, isLoading, isFetching } = useTenants(page, pageSize);
  React.useEffect(()=>{
    const rows = (data as any)?.items;
    setLocalTenants(Array.isArray(rows) ? rows : []);
  },[data]);
  const createTenant = useCreateTenant();
  const impersonate  = useImpersonate();

  const tenants = localTenants;
  const total   = (data as any)?.totalCount ?? (data as any)?.total ?? tenants.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function sf(k:string){ return (e:React.ChangeEvent<HTMLInputElement>)=>setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name||!form.adminEmail||!form.adminFirstName||!form.contactName||!form.contactEmail||!form.contactPhone||!form.contactAddress) {
      setError("All required fields must be filled"); return;
    }
    try {
      const result = await createTenant.mutateAsync(form);
      setSuccess(result); setError("");
    } catch(e:any) { setError(e?.response?.data?.message??e?.message??"Failed"); }
  }

  async function doImpersonate(tenantId: string) {
    try {
      await impersonate.mutateAsync({ targetUserId: tenantId, reason: "Admin support" });
      navigate("/");
    } catch(e) { /* show toast */ }
  }

  const byPlan = (plan: string) => tenants.filter((t:any)=>parseMeta(t.metadataJson).plan===plan).length;
  const totalStudents = tenants.reduce((a:number,t:any)=>a+(parseMeta(t.metadataJson).students??0),0);

  return (
    <>
      <PageHeader title="Tenant Management" subtitle={`${total} schools on platform`}
        action={<div className="page-actions"><button className="primary" onClick={()=>{setOpen(true);setError("");setSuccess(null);}}><Plus size={14}/> Onboard school</button></div>}/>

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total schools"   value={String(total)}               note="All tenants"  color="#0F2241" bg="#EEF2FF"><Building2 size={20}/></StatCard>
        <StatCard label="Total students"  value={totalStudents.toLocaleString()} note="Platform-wide"color="#2563EB" bg="#EFF6FF"><Building2 size={20}/></StatCard>
        <StatCard label="Enterprise"      value={String(byPlan("Enterprise"))} note=""            color="#7C3AED" bg="#F5F3FF"><Building2 size={20}/></StatCard>
        <StatCard label="On trial"        value={String(byPlan("Trial"))}     note=""             color="#D97706" bg="#FFFBEB"><Building2 size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>All tenants</h3></div>
        {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>School</th><th>Code</th><th>City</th><th>Plan</th><th>Students</th><th>Branches</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {tenants.map((t:any)=>{
                  const meta=parseMeta(t.metadataJson);
                  const plan=PLANS[meta.plan??"Starter"]??PLANS["Starter"];
                  return (
                    <tr key={t.id}>
                      <td><b>{t.name}</b><div style={{fontSize:10,color:"var(--muted)"}}>{meta.adminEmail}</div></td>
                      <td><code style={{fontSize:11}}>{t.code}</code></td>
                      <td>{meta.city??"-"}</td>
                      <td><span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:plan.bg,color:plan.color}}>{meta.plan??"Starter"}</span></td>
                      <td>{(meta.students??0).toLocaleString()}</td>
                      <td>{meta.branches??1}</td>
                      <td><span className={`status-pill ${meta.status==="ACTIVE"?"success":meta.status==="TRIAL"?"warning":"gray"}`}>{meta.status??"ACTIVE"}</span></td>
                      <td>
                        <div className="row-actions">
                          <button className="table-action" style={{fontSize:10}} onClick={()=>doImpersonate(t.tenantId)}>
                            🔐 Enter
                          </button>
                          {meta.status !== "ACTIVE" && (
                            <button className="table-action approve" style={{fontSize:10}}
                              onClick={()=>setLocalTenants(p=>p.map((x:any)=>x.id===t.id?{...x,metadataJson:JSON.stringify({...parseMeta(x.metadataJson),status:"ACTIVE"})}:x))}>
                              ✓ Activate
                            </button>
                          )}
                          {meta.status === "ACTIVE" && (
                            <button className="table-action hold" style={{fontSize:10}}
                              onClick={()=>setLocalTenants(p=>p.map((x:any)=>x.id===t.id?{...x,metadataJson:JSON.stringify({...parseMeta(x.metadataJson),status:"TRIAL"})}:x))}>
                              → Trial
                            </button>
                          )}
                          {meta.status !== "SUSPENDED" && (
                            <button className="table-action reject" style={{fontSize:10}}
                              onClick={()=>setLocalTenants(p=>p.map((x:any)=>x.id===t.id?{...x,metadataJson:JSON.stringify({...parseMeta(x.metadataJson),status:"SUSPENDED"})}:x))}>
                              ✗ Suspend
                            </button>
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
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"12px 16px",borderTop:"1px solid var(--line)",flexWrap:"wrap"}}>
          <div style={{fontSize:12,color:"var(--muted)"}}>
            Page {page} of {totalPages} · {total} tenants {isFetching && !isLoading ? "· Refreshing…" : ""}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <label style={{fontSize:12,color:"var(--muted)"}}>
              Rows&nbsp;
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                style={{padding:"6px 8px",border:"1px solid var(--line)",borderRadius:6}}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <button className="secondary" disabled={page <= 1 || isFetching} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
            <button className="secondary" disabled={page >= totalPages || isFetching} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(640px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,background:"var(--surface)",zIndex:1}}>
              <h2>Onboard new school</h2>
              <button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button>
            </div>

            {success ? (
              <div style={{padding:"24px 20px"}}>
                <div style={{padding:"16px 18px",background:"#ECFDF5",border:"1px solid #a7f3d0",borderRadius:12,marginBottom:16}}>
                  <b style={{display:"block",marginBottom:6,color:"#065f46"}}>✅ School onboarded successfully!</b>
                  <div style={{fontSize:12,color:"#065f46"}}>Tenant ID: <code>{success.tenantId}</code></div>
                  {success.adminAccount && (
                    <>
                      <div style={{fontSize:12,color:"#065f46",marginTop:4}}>Admin email: <code>{success.adminAccount.email}</code></div>
                      <div style={{fontSize:12,color:"#065f46",marginTop:4}}>Temp password: <code>{success.adminAccount.temporaryPassword}</code></div>
                    </>
                  )}
                </div>
                <button className="primary" onClick={()=>{ setOpen(false); setSuccess(null); setForm({ name:"", adminFirstName:"", adminLastName:"", adminEmail:"", adminPhoneNumber:"", contactName:"", contactEmail:"", contactPhone:"", contactAddress:"" }); }}>Close</button>
              </div>
            ) : (
              <>
                <div className="human-form">
                  <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>School info</div>
                  <div className="human-form-grid">
                    <label className="human-field field-wide"><span>School name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Al-Noor Academy"/></label>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginTop:8,marginBottom:4}}>Admin account</div>
                  <div className="human-form-grid">
                    <label className="human-field"><span>First name *</span><input value={form.adminFirstName} onChange={sf("adminFirstName")}/></label>
                    <label className="human-field"><span>Last name *</span><input value={form.adminLastName} onChange={sf("adminLastName")}/></label>
                    <label className="human-field"><span>Admin email *</span><input type="email" value={form.adminEmail} onChange={sf("adminEmail")}/></label>
                    <label className="human-field"><span>Phone</span><input value={form.adminPhoneNumber} onChange={sf("adminPhoneNumber")}/></label>
                  </div>
                  <div style={{fontSize:11,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:.8,marginTop:8,marginBottom:4}}>Contact info</div>
                  <div className="human-form-grid">
                    <label className="human-field"><span>Contact name *</span><input value={form.contactName} onChange={sf("contactName")}/></label>
                    <label className="human-field"><span>Contact email *</span><input type="email" value={form.contactEmail} onChange={sf("contactEmail")}/></label>
                    <label className="human-field"><span>Contact phone *</span><input value={form.contactPhone} onChange={sf("contactPhone")}/></label>
                    <label className="human-field field-wide"><span>Contact address *</span><input value={form.contactAddress} onChange={sf("contactAddress")}/></label>
                  </div>
                  {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
                </div>
                <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
                  <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
                  <button className="primary" onClick={save} disabled={createTenant.isPending}>{createTenant.isPending?"Creating…":"Create tenant"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
