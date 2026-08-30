import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useSubjects, useCreateSubject } from "../../../../core/api/queries";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { useAuth } from "../../../auth/auth";
import { useCampuses } from "../../../../core/api/queries";

export function SubjectsTab() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const { data: campuses } = useCampuses();
  const campusId = campuses?.items?.[0]?.id ?? "";
  const { data, isLoading } = useSubjects();
  const createSubject = useCreateSubject();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name:"", isElective:false });
  const [err,  setErr]  = useState("");

  const items = data?.items ?? [];

  async function save() {
    if (!form.name) { setErr("Name required."); return; }
    setErr("");
    try {
      await createSubject.mutateAsync({ tenantId, branchId:campusId||tenantId, name:form.name, metadataJson:JSON.stringify({isElective:form.isElective}) });
      setOpen(false); setForm({name:"",isElective:false});
    } catch(e:any) { setErr(e?.message??"Failed."); }
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Subjects</h3><p>All academic subjects offered by the school</p></div>
          <button className="primary" onClick={()=>{setOpen(true);setErr("");}}><Plus size={14}/> Add subject</button>
        </div>
        {isLoading ? <div style={{padding:30,textAlign:"center",color:"var(--muted)"}}>Loading…</div> :
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Code</th><th>Subject</th><th>Elective</th></tr></thead>
            <tbody>
              {items.length===0 ? <tr><td colSpan={3} style={{padding:24,textAlign:"center",color:"var(--muted)"}}>No subjects yet.</td></tr>
              : items.map(s=>{
                const m = s.metadataJson?JSON.parse(s.metadataJson):{};
                return <tr key={s.id}><td><code style={{fontSize:11}}>{s.code}</code></td><td><b>{s.name}</b></td><td><span className={`status-pill ${m.isElective?"info":"gray"}`}>{m.isElective?"Yes":"No"}</span></td></tr>;
              })}
            </tbody>
          </table>
        </div>}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(460px,96vw)"}}>
            <div className="modal-head"><h2>Add subject</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Subject name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Mathematics"/></label>
                <label className="human-field"><span>Is elective?</span>
                  <select value={form.isElective?"1":"0"} onChange={e=>setForm(p=>({...p,isElective:e.target.value==="1"}))}>
                    <option value="0">No — core subject</option><option value="1">Yes — elective</option>
                  </select>
                </label>
              </div>
              {err && <div style={{color:"var(--danger)",fontSize:12}}>{err}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createSubject.isPending||!form.name}>{createSubject.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
