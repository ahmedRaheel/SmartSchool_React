import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useFeeTypes, useCreateFeeType } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

export function FeeTypesTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data: feeTypes, isLoading } = useFeeTypes();
  const create = useCreateFeeType();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", amount:"", frequency:"MONTHLY", isRequired:"false" });
  const [error, setError] = useState("");

  const items = Array.isArray(feeTypes) ? feeTypes : (feeTypes as any)?.items ?? [];

  async function save() {
    if (!form.name||!form.amount) { setError("Name and amount required"); return; }
    try {
      await create.mutateAsync({ tenantId:tid, name:form.name, metadataJson: JSON.stringify({ amount:Number(form.amount), frequency:form.frequency, isRequired:form.isRequired==="true" }) });
      setModal(false); setForm({ name:"", amount:"", frequency:"MONTHLY", isRequired:"false" }); setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Fee types</h3></div>
          <button className="primary" onClick={()=>{setModal(true);setError("");}}><Plus size={14}/> Add fee type</button>
        </div>
        {isLoading ? <div style={{padding:20,color:"var(--muted)"}}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th><th>Amount</th><th>Frequency</th><th>Required</th></tr></thead>
              <tbody>
                {items.length===0 ? <tr><td colSpan={5} style={{textAlign:"center",padding:24,color:"var(--muted)"}}>No fee types yet.</td></tr>
                : items.map((ft:any)=>{
                  let meta:any={}; try{meta=JSON.parse(ft.metadataJson??"{}") }catch{}
                  return <tr key={ft.id}><td><b>{ft.name}</b></td><td><code style={{fontSize:11}}>{ft.code}</code></td><td>PKR {meta.amount?.toLocaleString()??0}</td><td>{meta.frequency??"-"}</td><td><span className={`status-pill ${meta.isRequired?"success":"gray"}`}>{meta.isRequired?"Required":"Optional"}</span></td></tr>
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-card" style={{ width:"min(460px,96vw)" }}>
            <div className="modal-head"><h2>Add fee type</h2><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Tuition Fee"/></label>
              <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))}/></label>
              <label className="human-field"><span>Frequency</span>
                <select value={form.frequency} onChange={e=>setForm(p=>({...p,frequency:e.target.value}))}>
                  <option value="MONTHLY">Monthly</option><option value="TERM">Per term</option>
                  <option value="ANNUAL">Annual</option><option value="ONCE">One-time</option>
                </select>
              </label>
              <label className="human-field"><span>Required?</span>
                <select value={form.isRequired} onChange={e=>setForm(p=>({...p,isRequired:e.target.value}))}>
                  <option value="false">Optional</option><option value="true">Required</option>
                </select>
              </label>
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
