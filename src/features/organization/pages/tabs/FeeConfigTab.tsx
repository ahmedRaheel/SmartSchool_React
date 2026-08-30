import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useFeeTypes, useCreateFeeType, useFeeStructure, useCreateFeeStructure, useGradeLevels } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

const FREQ_OPTIONS = [
  { value:"Monthly",  label:"Monthly"  },
  { value:"Term",     label:"Per term" },
  { value:"Annual",   label:"Annual"   },
  { value:"OneTime",  label:"One-time" },
];

export function FeeConfigTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const { data: feeTypes,    isLoading: ftLoad } = useFeeTypes();
  const { data: feeStructure,isLoading: fsLoad } = useFeeStructure();
  const { data: grades }                          = useGradeLevels();
  const createFeeType      = useCreateFeeType();
  const createFeeStructure = useCreateFeeStructure();

  const [tab, setTab] = useState<"types"|"structure">("types");
  const [ftModal, setFtModal] = useState(false);
  const [fsModal, setFsModal] = useState(false);
  const [ftForm, setFtForm]   = useState({ name:"", frequency:"Monthly", description:"" });
  const [fsForm, setFsForm]   = useState({ gradeLevelId:"", feeTypeId:"", amount:"", frequency:"Monthly" });
  const [error, setError]     = useState("");

  const feeTypeItems      = Array.isArray(feeTypes)     ? feeTypes     : (feeTypes     as any)?.items ?? [];
  const feeStructureItems = Array.isArray(feeStructure) ? feeStructure : (feeStructure as any)?.items ?? [];
  const gradeItems        = (grades as any)?.items ?? (grades as any) ?? [];

  async function saveFeeType() {
    if (!ftForm.name) { setError("Name required"); return; }
    try {
      await createFeeType.mutateAsync({ tenantId:tid, name:ftForm.name, frequency:ftForm.frequency, description:ftForm.description||undefined });
      setFtModal(false); setFtForm({ name:"", frequency:"Monthly", description:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveFeeStructure() {
    if (!fsForm.gradeLevelId||!fsForm.feeTypeId||!fsForm.amount) { setError("Grade, fee type and amount required"); return; }
    try {
      await createFeeStructure.mutateAsync({ tenantId:tid, gradeLevelId:fsForm.gradeLevelId, feeTypeId:fsForm.feeTypeId, amount:Number(fsForm.amount), frequency:fsForm.frequency });
      setFsModal(false); setFsForm({ gradeLevelId:"", feeTypeId:"", amount:"", frequency:"Monthly" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="types"?"active":""} onClick={()=>setTab("types")}>💰 Fee types</button>
        <button className={tab==="structure"?"active":""} onClick={()=>setTab("structure")}>📊 Fee structure</button>
      </div>

      {tab === "types" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Fee types</h3><p>Define fee categories — note: no MetadataJson, explicit fields</p></div>
            <button className="primary" onClick={()=>{setFtModal(true);setError("");}}><Plus size={14}/> Add fee type</button>
          </div>
          {ftLoad ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Name</th><th>Code</th><th>Frequency</th><th>Description</th><th>Status</th></tr></thead>
                <tbody>
                  {feeTypeItems.length===0 ? <tr><td colSpan={5} style={{ textAlign:"center", padding:24, color:"var(--muted)" }}>No fee types yet.</td></tr>
                  : feeTypeItems.map((ft:any) => (
                    <tr key={ft.id}>
                      <td><b>{ft.name}</b></td>
                      <td><code style={{fontSize:11}}>{ft.code}</code></td>
                      <td>{FREQ_OPTIONS.find(f=>f.value===ft.frequency)?.label ?? ft.frequency ?? "—"}</td>
                      <td style={{ fontSize:11, color:"var(--muted)" }}>{ft.description ?? "—"}</td>
                      <td><span className={`status-pill ${ft.isActive?"success":"gray"}`}>{ft.isActive?"Active":"Inactive"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "structure" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Fee structure</h3><p>Per-grade fee assignments linking grade levels to fee types</p></div>
            <button className="primary" onClick={()=>{setFsModal(true);setError("");}}><Plus size={14}/> Add fee structure</button>
          </div>
          {fsLoad ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
            feeStructureItems.length===0 ? (
              <div style={{ padding:24, textAlign:"center", color:"var(--muted)", fontSize:12 }}>No fee structures yet. Add fee types first, then create grade-level assignments.</div>
            ) : (
              <div className="table-wrap">
                <table className="premium-table">
                  <thead><tr><th>Name</th><th>Code</th></tr></thead>
                  <tbody>
                    {feeStructureItems.map((fs:any)=>(
                      <tr key={fs.id}><td><b>{fs.name}</b></td><td><code style={{fontSize:11}}>{fs.code}</code></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* Add fee type modal */}
      {ftModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFtModal(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add fee type</h2><button className="icon-button" onClick={()=>setFtModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Fee name *</span><input value={ftForm.name} onChange={e=>setFtForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Tuition Fee"/></label>
              <label className="human-field"><span>Frequency</span>
                <select value={ftForm.frequency} onChange={e=>setFtForm(p=>({...p,frequency:e.target.value}))}>
                  {FREQ_OPTIONS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Description</span><input value={ftForm.description} onChange={e=>setFtForm(p=>({...p,description:e.target.value}))} placeholder="Optional"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setFtModal(false)}>Cancel</button>
              <button className="primary" onClick={saveFeeType} disabled={createFeeType.isPending}>{createFeeType.isPending?"Saving…":"Save fee type"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add fee structure modal */}
      {fsModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFsModal(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add fee structure</h2><button className="icon-button" onClick={()=>setFsModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Grade level *</span>
                <select value={fsForm.gradeLevelId} onChange={e=>setFsForm(p=>({...p,gradeLevelId:e.target.value}))}>
                  <option value="">— Select grade —</option>
                  {gradeItems.map((g:any)=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Fee type *</span>
                <select value={fsForm.feeTypeId} onChange={e=>setFsForm(p=>({...p,feeTypeId:e.target.value}))}>
                  <option value="">— Select fee type —</option>
                  {feeTypeItems.map((ft:any)=><option key={ft.id} value={ft.id}>{ft.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={fsForm.amount} onChange={e=>setFsForm(p=>({...p,amount:e.target.value}))}/></label>
              <label className="human-field"><span>Frequency</span>
                <select value={fsForm.frequency} onChange={e=>setFsForm(p=>({...p,frequency:e.target.value}))}>
                  {FREQ_OPTIONS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setFsModal(false)}>Cancel</button>
              <button className="primary" onClick={saveFeeStructure} disabled={createFeeStructure.isPending}>{createFeeStructure.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
