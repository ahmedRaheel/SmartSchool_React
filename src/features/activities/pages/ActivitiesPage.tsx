import { useState } from "react";
import { Calendar, Plus, Star, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useActivities, useCreateActivity, useAwards } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }
const ACTIVITY_TYPES = ["Sports","Academic","Co-curricular","Cultural","Trip","Competition","Seminar","Other"];
const STATUS_PILL: Record<string,string> = { UPCOMING:"info", COMPLETED:"success", CANCELLED:"danger", ONGOING:"warning" };

export function ActivitiesPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"activities"|"awards">("activities");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", type:"Sports", date:"", venue:"", description:"" });

  const { data: actData, isLoading } = useActivities();
  const { data: awardsData } = useAwards();
  const createActivity = useCreateActivity();

  const activities = (actData     as any)?.items ?? (actData     as any) ?? [];
  const awards     = (awardsData  as any)?.items ?? (awardsData  as any) ?? [];

  function sf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name || !form.date) { setError("Name and date required"); return; }
    try {
      await createActivity.mutateAsync({ tenantId:tid, name:form.name, metadataJson:JSON.stringify({ type:form.type, date:form.date, venue:form.venue, description:form.description, status:"UPCOMING" }) });
      setOpen(false); setForm({ name:"", type:"Sports", date:"", venue:"", description:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  const byType = (t:string) => activities.filter((a:any)=>parseMeta(a.metadataJson).type===t).length;

  return (
    <>
      <PageHeader title="Activities & Events" subtitle={`${activities.length} activities scheduled`}
        action={<div className="page-actions"><button className="primary" onClick={()=>{setOpen(true);setError("");}}><Plus size={14}/> Add activity</button></div>}/>

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total activities" value={String(activities.length)}                                                         note=""           color="#2563EB" bg="#EFF6FF"><Calendar size={20}/></StatCard>
        <StatCard label="Upcoming"         value={String(activities.filter((a:any)=>parseMeta(a.metadataJson).status==="UPCOMING").length)} note=""   color="#0F2241" bg="#EEF2FF"><Calendar size={20}/></StatCard>
        <StatCard label="Completed"        value={String(activities.filter((a:any)=>parseMeta(a.metadataJson).status==="COMPLETED").length)}note=""  color="#10B981" bg="#ECFDF5"><Calendar size={20}/></StatCard>
        <StatCard label="Awards given"     value={String(awards.length)}                                                             note=""           color="#D97706" bg="#FFFBEB"><Star size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="activities"?"active":""} onClick={()=>setTab("activities")}>📅 Activities ({activities.length})</button>
        <button className={tab==="awards"?"active":""} onClick={()=>setTab("awards")}>🏆 Awards ({awards.length})</button>
      </div>

      {tab === "activities" && (
        <div className="surface">
          <div className="surface-head"><h3>All activities</h3></div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Activity</th><th>Type</th><th>Date</th><th>Venue</th><th>Status</th></tr></thead>
                <tbody>
                  {activities.length===0 ? <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No activities yet.</td></tr>
                  : activities.map((a:any)=>{
                    const meta=parseMeta(a.metadataJson);
                    return <tr key={a.id}><td><b>{a.name}</b></td><td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1"}}>{meta.type??"-"}</span></td><td>{meta.date??"-"}</td><td>{meta.venue??"-"}</td><td><span className={`status-pill ${STATUS_PILL[meta.status??"UPCOMING"]??"info"}`}>{meta.status??"UPCOMING"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "awards" && (
        <div className="surface">
          <div className="surface-head"><h3>Awards & Recognition</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            {awards.length===0 ? <div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>No awards yet.</div>
            : awards.map((a:any)=>(
              <div key={a.id} style={{padding:"12px 14px",borderRadius:10,border:"1px solid var(--line)",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:24}}>🏆</span>
                <div><b style={{fontSize:12}}>{a.name}</b><div style={{fontSize:11,color:"var(--muted)"}}>{a.code}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(500px,96vw)"}}>
            <div className="modal-head"><h2>Add activity</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Activity name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Annual Sports Day 2026"/></label>
              <label className="human-field"><span>Type</span><select value={form.type} onChange={sf("type")}>{ACTIVITY_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Date *</span><input type="date" value={form.date} onChange={sf("date")}/></label>
              <label className="human-field field-wide"><span>Venue</span><input value={form.venue} onChange={sf("venue")} placeholder="e.g. School Ground"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createActivity.isPending}>{createActivity.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
