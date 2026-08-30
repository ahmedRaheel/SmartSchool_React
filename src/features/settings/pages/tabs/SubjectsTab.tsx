import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useSubjects, useCreateSubject, useCampuses } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

export function SubjectsTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data: subjects, isLoading } = useSubjects();
  const { data: campuses } = useCampuses();
  const create = useCreateSubject();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", branchId:"" });
  const [error, setError] = useState("");

  const items = (subjects as any)?.items ?? (subjects as any) ?? [];
  const campusItems = (campuses as any)?.items ?? (campuses as any) ?? [];

  async function save() {
    if (!form.name||!form.branchId) { setError("Campus and name required"); return; }
    try {
      await create.mutateAsync({ tenantId:tid, branchId:form.branchId, name:form.name });
      setModal(false); setForm({ name:"", branchId:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Subjects</h3><p>Academic subjects offered per campus</p></div>
          <button className="primary" onClick={()=>{setModal(true);setError("");setForm({name:"",branchId:""})} }><Plus size={14}/> Add subject</button>
        </div>
        {isLoading ? <div style={{padding:20,color:"var(--muted)"}}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Subject</th><th>Code</th></tr></thead>
              <tbody>
                {items.length===0 ? <tr><td colSpan={2} style={{textAlign:"center",padding:24,color:"var(--muted)"}}>No subjects yet.</td></tr>
                : items.map((s:any)=><tr key={s.id}><td><b>{s.name}</b></td><td><code style={{fontSize:11}}>{s.code}</code></td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-card" style={{ width:"min(440px,96vw)" }}>
            <div className="modal-head"><h2>Add subject</h2><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Campus *</span>
                <select value={form.branchId} onChange={e=>setForm(p=>({...p,branchId:e.target.value}))}>
                  <option value="">— Select campus —</option>
                  {campusItems.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Subject name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Mathematics"/></label>
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
