import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  useAcademicYears, useCreateAcademicYear, useDeleteAcademicYear,
  useGradeLevels, useCreateGradeLevel,
  useClassSections, useCreateClassSection,
  useSubjects, useCreateSubject,
  useCampuses,
} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

type SubTab = "years"|"grades"|"sections"|"subjects";

export function AcademicStructureTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const [sub, setSub] = useState<SubTab>("years");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string,any>>({});
  const [error, setError] = useState("");

  const { data: campuses }  = useCampuses();
  const { data: years, isLoading: yLoad }    = useAcademicYears();
  const { data: grades, isLoading: gLoad }   = useGradeLevels();
  const { data: sections, isLoading: sLoad } = useClassSections();
  const { data: subjects, isLoading: subLoad }= useSubjects();
  const campusItems = (campuses as any)?.items ?? (campuses as any) ?? [];

  const createYear    = useCreateAcademicYear();
  const deleteYear    = useDeleteAcademicYear();
  const createGrade   = useCreateGradeLevel();
  const createSection = useCreateClassSection();
  const createSubject = useCreateSubject();

  const items = sub==="years" ? (years as any)?.items ?? [] : sub==="grades" ? (grades as any)?.items ?? [] : sub==="sections" ? (sections as any)?.items ?? [] : (subjects as any)?.items ?? [];
  const loading = sub==="years"?yLoad:sub==="grades"?gLoad:sub==="sections"?sLoad:subLoad;

  async function save() {
    try {
      if (sub==="years") {
        if (!form.campusId||!form.name||!form.startDate||!form.endDate) { setError("All fields required"); return; }
        await createYear.mutateAsync({ tenantId:tid, campusId:form.campusId, name:form.name, startDate:form.startDate, endDate:form.endDate, isCurrent:form.isCurrent==="true" });
      } else if (sub==="grades") {
        if (!form.name) { setError("Name required"); return; }
        await createGrade.mutateAsync({ tenantId:tid, name:form.name });
      } else if (sub==="sections") {
        if (!form.name) { setError("Name required"); return; }
        await createSection.mutateAsync({ tenantId:tid, name:form.name });
      } else {
        if (!form.name||!form.branchId) { setError("Campus and name required"); return; }
        await createSubject.mutateAsync({ tenantId:tid, branchId:form.branchId, name:form.name });
      }
      setModal(false); setForm({}); setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  const TAB_LABELS: Record<SubTab,string> = { years:"📅 Academic Years", grades:"📚 Grade Levels", sections:"🏷️ Class Sections", subjects:"📖 Subjects" };

  return (
    <>
      <div className="section-tabs" style={{ marginBottom:14 }}>
        {(["years","grades","sections","subjects"] as SubTab[]).map(t => (
          <button key={t} className={sub===t?"active":""} onClick={()=>setSub(t)}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      <div className="surface">
        <div className="surface-head">
          <div>
            <h3>{TAB_LABELS[sub]}</h3>
            <p>{sub==="years"?"Academic years per campus":sub==="grades"?"Grade levels (Grade 7, 8, ...)":sub==="sections"?"Class sections (9-A, 10-B, ...)":"Subjects offered"}</p>
          </div>
          <button className="primary" onClick={() => { setModal(true); setForm({}); setError(""); }}><Plus size={14}/> Add</button>
        </div>

        {loading ? <div style={{ padding:30, color:"var(--muted)", textAlign:"center" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th>{sub==="years"&&<th>Details</th>}<th/></tr></thead>
              <tbody>
                {items.length===0
                  ? <tr><td colSpan={4} style={{ textAlign:"center", padding:24, color:"var(--muted)" }}>None yet. Click "Add" to create one.</td></tr>
                  : items.map((item: any) => {
                    let meta: any = {};
                    try { meta = JSON.parse(item.metadataJson ?? "{}"); } catch {}
                    return (
                      <tr key={item.id}>
                        <td><b>{item.name}</b></td>
                        <td><code style={{fontSize:11}}>{item.code}</code></td>
                        {sub==="years" && <td style={{fontSize:11, color:"var(--muted)"}}>
                          {meta.startDate} → {meta.endDate} {meta.isCurrent && <span className="status-pill success" style={{fontSize:9}}>Current</span>}
                        </td>}
                        <td>
                          {sub==="years" && <button className="table-action danger-button" style={{fontSize:10}} onClick={() => deleteYear.mutate(item.id)}><Trash2 size={11}/></button>}
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setModal(false); }}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add {sub.slice(0,-1)}</h2><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              {sub==="years" && <>
                <label className="human-field field-wide"><span>Campus *</span>
                  <select value={form.campusId??""} onChange={e => setForm(p=>({...p,campusId:e.target.value}))}>
                    <option value="">— Select campus —</option>
                    {campusItems.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="human-field field-wide"><span>Name *</span><input value={form.name??""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Academic Year 2026–27"/></label>
                <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate??""} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}/></label>
                <label className="human-field"><span>End date *</span><input type="date" value={form.endDate??""} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}/></label>
                <label className="human-field field-wide"><span>Set as current year?</span>
                  <select value={form.isCurrent??"false"} onChange={e=>setForm(p=>({...p,isCurrent:e.target.value}))}>
                    <option value="false">No</option><option value="true">Yes — mark as current</option>
                  </select>
                </label>
              </>}
              {sub==="subjects" && (
                <label className="human-field field-wide"><span>Campus *</span>
                  <select value={form.branchId??""} onChange={e=>setForm(p=>({...p,branchId:e.target.value}))}>
                    <option value="">— Select campus —</option>
                    {campusItems.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              )}
              <label className="human-field field-wide"><span>Name *</span><input value={form.name??""} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder={sub==="grades"?"e.g. Grade 9":sub==="sections"?"e.g. Grade 9-A":"e.g. Mathematics"}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
