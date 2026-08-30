import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { useLookupTypes, useLookupValues, useCreateLookup, useDeleteLookup } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

const SYSTEM_TYPES = ["GENDER","BLOOD_GROUP","EMPLOYMENT_TYPE","LEAVE_TYPE","NATIONALITY","RELIGION","MARITAL_STATUS","GRADE_SYSTEM","FEE_FREQUENCY"];

export function LookupConfigTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data: types, isLoading: tLoad } = useLookupTypes();
  const [selected, setSelected] = useState(SYSTEM_TYPES[0]);
  const { data: values, isLoading: vLoad } = useLookupValues(selected);
  const createLookup = useCreateLookup();
  const deleteLookup = useDeleteLookup();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ code:"", name:"", sortOrder:"10" });
  const [error, setError] = useState("");

  const typeList = Array.isArray(types) ? types : (SYSTEM_TYPES as string[]);
  const valueList = Array.isArray(values) ? values : [];

  async function save() {
    if (!form.code || !form.name) { setError("Code and name required"); return; }
    try {
      await createLookup.mutateAsync({ tenantId:tid, typeCode:selected, code:form.code.toUpperCase(), name:form.name, sortOrder:Number(form.sortOrder), isActive:true });
      setModal(false); setForm({ code:"", name:"", sortOrder:"10" }); setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:12, alignItems:"start" }}>
        <div className="surface" style={{ padding:8 }}>
          <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px 4px", fontWeight:700, textTransform:"uppercase", letterSpacing:.8 }}>Lookup types</div>
          {tLoad ? <div style={{ padding:10, color:"var(--muted)", fontSize:12 }}>Loading…</div> :
            typeList.map((t: string) => (
              <button key={t} onClick={() => setSelected(t)}
                style={{ width:"100%", padding:"8px 10px", border:"none", borderRadius:8, cursor:"pointer", textAlign:"left", fontSize:11, fontWeight:selected===t?600:400, background:selected===t?"var(--navy)":t==="transparent", color:selected===t?"#fff":"var(--text)", marginBottom:2 }}>
                {t.replace(/_/g," ")}
              </button>
            ))
          }
        </div>

        <div className="surface">
          <div className="surface-head">
            <div><h3>{selected.replace(/_/g," ")}</h3><p>Lookup values for this type</p></div>
            <button className="primary" onClick={()=>{ setModal(true); setError(""); setForm({ code:"", name:"", sortOrder:"10" }); }}><Plus size={14}/> Add value</button>
          </div>
          {vLoad ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Name</th><th>Code</th><th>Sort</th><th>Status</th><th/></tr></thead>
                <tbody>
                  {valueList.length===0
                    ? <tr><td colSpan={5} style={{ textAlign:"center", padding:24, color:"var(--muted)" }}>No values for this type.</td></tr>
                    : valueList.map((v: any) => (
                        <tr key={v.id}>
                          <td><b>{v.name}</b></td>
                          <td><code style={{fontSize:11}}>{v.code}</code></td>
                          <td>{v.sortOrder ?? "—"}</td>
                          <td><span className={`status-pill ${v.isActive?"success":"gray"}`}>{v.isActive?"Active":"Inactive"}</span></td>
                          <td><button className="table-action danger-button" style={{fontSize:10}} onClick={()=>deleteLookup.mutate(v.id)}><Trash2 size={11}/></button></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setModal(false); }}>
          <div className="modal-card" style={{ width:"min(440px,96vw)" }}>
            <div className="modal-head"><h2>Add lookup value</h2><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Type</span>
                <input value={selected} readOnly style={{ background:"var(--surface-2)", color:"var(--muted)" }}/>
              </label>
              <label className="human-field"><span>Code * (uppercase)</span><input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="e.g. AB_POS"/></label>
              <label className="human-field"><span>Display name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. AB+"/></label>
              <label className="human-field"><span>Sort order</span><input type="number" value={form.sortOrder} onChange={e=>setForm(p=>({...p,sortOrder:e.target.value}))}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createLookup.isPending}>{createLookup.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
