import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useDepartments, useCreateDepartment, useDeleteDepartment, useCampuses } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

export function DepartmentsTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data: departments, isLoading } = useDepartments();
  const { data: campuses } = useCampuses();
  const create = useCreateDepartment();
  const remove = useDeleteDepartment();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", campusId:"", email:"", telephone:"" });
  const [error, setError] = useState("");

  const items = (departments as any)?.items ?? (departments as any) ?? [];
  const campusItems = (campuses as any)?.items ?? (campuses as any) ?? [];

  async function save() {
    if (!form.name || !form.campusId) { setError("Campus and name required"); return; }
    try {
      await create.mutateAsync({ tenantId:tid, campusId:form.campusId, name:form.name, email:form.email||null, telephone:form.telephone||null });
      setModal(false); setForm({ name:"", campusId:"", email:"", telephone:"" }); setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Departments</h3><p>Academic and administrative departments</p></div>
          <button className="primary" onClick={() => { setModal(true); setError(""); }}><Plus size={14}/> Add department</button>
        </div>
        {isLoading ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th><th>Email</th><th>Phone</th><th/></tr></thead>
              <tbody>
                {items.length===0 ? <tr><td colSpan={5} style={{ textAlign:"center", padding:24, color:"var(--muted)" }}>No departments. Add one above.</td></tr>
                : items.map((d: any) => (
                    <tr key={d.id}>
                      <td><b>{d.name}</b></td>
                      <td><code style={{fontSize:11}}>{d.code}</code></td>
                      <td>{JSON.parse(d.metadataJson??"{}")?.email ?? "—"}</td>
                      <td>{JSON.parse(d.metadataJson??"{}")?.telephone ?? "—"}</td>
                      <td><button className="table-action danger-button" style={{fontSize:10}} onClick={()=>remove.mutate(d.id)}><Trash2 size={11}/></button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add department</h2><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Campus *</span>
                <select value={form.campusId} onChange={e=>setForm(p=>({...p,campusId:e.target.value}))}>
                  <option value="">— Select campus —</option>
                  {campusItems.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Mathematics"/></label>
              <label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/></label>
              <label className="human-field"><span>Telephone</span><input value={form.telephone} onChange={e=>setForm(p=>({...p,telephone:e.target.value}))}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={create.isPending}>{create.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
