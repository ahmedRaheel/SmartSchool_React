import { useState } from "react";
import { EditModal } from "../../../components/ui/EditModal";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { RowActions } from "../../../components/ui/RowActions";
import { Pagination } from "../../../components/ui/Pagination";
import { Plus, X, Star, Trophy, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useActivities, useCreateActivity, useAwards, useCreateAward, useStudents , useUpdateActivity, useDeleteActivity, useActivityById} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const ACT_TYPES = ["SPORTS","CULTURAL","ACADEMIC","SCIENCE_FAIR","DEBATE","ART","COMMUNITY","FIELD_TRIP","CEREMONY"];
const AWD_TYPES = ["ACADEMIC","SPORTS","CULTURAL","ATTENDANCE","LEADERSHIP","COMMUNITY","SPECIAL"];
const STATUS_PILL: Record<string,string> = { UPCOMING:"info", ONGOING:"warning", COMPLETED:"success", CANCELLED:"danger" };

export function ActivitiesPage() {
  const { user } = useAuth();
  const viewActivityIdOrEdit = viewActivityId ?? editActivityId;
  const { data: viewActivityData, isLoading: viewActivityLoading } = useActivityById(viewActivityIdOrEdit ?? undefined);
  const viewActivityItem: any = viewActivityData ?? null;
  const updActivity = useUpdateActivity();
  const delActivity = useDeleteActivity();
  const [localActivities, setLocalActivities] = useState<any[]>([]);
  const [viewActivityId, setViewActivityId] = useState<string|null>(null);
  const [editActivityId, setEditActivityId] = useState<string|null>(null); const tid = effectiveTenantId(user) ?? "";
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab]  = useState<"activities"|"awards">("activities");
  const [aModal, setAModal] = useState(false);
  const [wModal, setWModal] = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useActivities();
  const { data: awardsData } = useAwards();
  const { data: studData }   = useStudents();
  const createActivity = useCreateActivity();
  const createAward    = useCreateAward();

  const activities = (data as any)?.items       ?? (data as any) ?? [];
  const awards     = (awardsData as any)?.items  ?? (awardsData as any) ?? [];
  const students   = (studData as any)?.items    ?? (studData as any) ?? [];

  const [aForm, setAForm] = useState({ name:"", activityType:"SPORTS", activityDate:"", venue:"", description:"", maxParticipants:"", status:"UPCOMING" });
  const [wForm, setWForm] = useState({ studentId:"", title:"", awardType:"ACADEMIC", awardDate:"", description:"" });
  const af = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setAForm(p=>({...p,[k]:e.target.value}));
  const wf = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setWForm(p=>({...p,[k]:e.target.value}));

  async function saveActivity() {
    if (!aForm.name || !aForm.activityDate) { setError("Name and date required"); return; }
    try {
      await createActivity.mutateAsync({ tenantId:tid, name:aForm.name, metadataJson:JSON.stringify({ type:aForm.activityType, date:aForm.activityDate, venue:aForm.venue, description:aForm.description, maxParticipants:Number(aForm.maxParticipants)||undefined, status:aForm.status }) });
      setAModal(false); setAForm({ name:"", activityType:"SPORTS", activityDate:"", venue:"", description:"", maxParticipants:"", status:"UPCOMING" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveAward() {
    if (!wForm.studentId || !wForm.title || !wForm.awardDate) { setError("Student, title and date required"); return; }
    const stu = students.find((s:any) => s.id === wForm.studentId);
    try {
      await createAward.mutateAsync({ tenantId:tid, name:wForm.title, metadataJson:JSON.stringify({ studentId:wForm.studentId, studentName:`${stu?.firstName??""} ${stu?.lastName??""}`.trim(), type:wForm.awardType, date:wForm.awardDate, description:wForm.description }) });
      setWModal(false); setWForm({ studentId:"", title:"", awardType:"ACADEMIC", awardDate:"", description:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  const upcoming   = activities.filter((a:any) => parseMeta(a.metadataJson).status === "UPCOMING").length;
  const completed  = activities.filter((a:any) => parseMeta(a.metadataJson).status === "COMPLETED").length;

  return (
    <>
      <PageHeader title="Activities & Awards" subtitle="Co-curricular activities, events and student recognition"
        action={<div className="page-actions">
          {tab==="activities" && <button className="primary" onClick={()=>{setAModal(true);setError("");}}><Plus size={14}/> Add activity</button>}
          {tab==="awards"     && <button className="primary" onClick={()=>{setWModal(true);setError("");}}><Star size={14}/> Give award</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total activities" value={String(activities.length)} note=""           color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="Upcoming"         value={String(upcoming)}          note=""           color="#D97706" bg="#FFFBEB"><Users size={20}/></StatCard>
        <StatCard label="Completed"        value={String(completed)}         note="this term"  color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Awards given"     value={String(awards.length)}     note=""           color="#8B5CF6" bg="#F5F3FF"><Trophy size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="activities"?"active":""} onClick={()=>setTab("activities")}>🏅 Activities ({activities.length})</button>
        <button className={tab==="awards"?"active":""} onClick={()=>setTab("awards")}>🏆 Awards ({awards.length})</button>
      </div>

      {tab==="activities" && (
        <div className="surface">
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Activity</th><th>Type</th><th>Date</th><th>Venue</th><th>Capacity</th><th>Status</th><th style={{ textAlign:"right" }}>Actions</th>
                  </tr></thead>
                <tbody>
                  {activities.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No activities yet.</td></tr>
                  : activities.map((a:any) => { const m=parseMeta(a.metadataJson); return (
                    <tr key={a.id}>
                      <td><b style={{fontSize:12}}>{a.name}</b>{m.description&&<div style={{fontSize:10,color:"var(--muted)"}}>{m.description}</div>}</td>
                      <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{m.type??"—"}</span></td>
                      <td style={{fontSize:11}}>{m.date??"—"}</td>
                      <td style={{fontSize:11}}>{m.venue??"—"}</td>
                      <td style={{fontSize:11}}>{m.maxParticipants??"Open"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[m.status??"UPCOMING"]??"info"}`}>{m.status??"UPCOMING"}</span></td>
                            <td style={{ textAlign: "right" }}>
                              <RowActions
                                onView={() => setViewActivityId(a.id)}
                                onEdit={() => setEditActivityId(a.id)}
                                onDelete={() => delActivity.mutate(a.id)}
                                deleteLabel="activity"
                              />
                            </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==="awards" && (
        <div className="surface">
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Award</th><th>Student</th><th>Type</th><th>Date</th><th>Description</th></tr></thead>
              <tbody>
                {awards.length===0 ? <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No awards given yet.</td></tr>
                : awards.map((w:any)=>{ const m=parseMeta(w.metadataJson); return (
                  <tr key={w.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><Trophy size={14} style={{color:"#F59E0B",flexShrink:0}}/><b style={{fontSize:12}}>{w.name}</b></div></td>
                    <td style={{fontSize:11}}>{m.studentName??"—"}</td>
                    <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#FFFBEB",color:"#D97706",fontWeight:700}}>{m.type??"—"}</span></td>
                    <td style={{fontSize:11}}>{m.date??"—"}</td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>{m.description??"—"}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {aModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setAModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head"><h2>Add activity</h2><button className="icon-button" onClick={()=>setAModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={aForm.name} onChange={af("name")} placeholder="e.g. Annual Sports Day"/></label>
              <label className="human-field"><span>Type</span><select value={aForm.activityType} onChange={af("activityType")}>{ACT_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Status</span><select value={aForm.status} onChange={af("status")}>{["UPCOMING","ONGOING","COMPLETED","CANCELLED"].map(s=><option key={s}>{s}</option>)}</select></label>
              <label className="human-field"><span>Date *</span><input type="date" value={aForm.activityDate} onChange={af("activityDate")}/></label>
              <label className="human-field"><span>Venue</span><input value={aForm.venue} onChange={af("venue")} placeholder="e.g. Main Ground"/></label>
              <label className="human-field"><span>Max participants</span><input type="number" value={aForm.maxParticipants} onChange={af("maxParticipants")}/></label>
              <label className="human-field field-wide"><span>Description</span><input value={aForm.description} onChange={af("description")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setAModal(false)}>Cancel</button>
              <button className="primary" onClick={saveActivity} disabled={createActivity.isPending}>{createActivity.isPending?"Saving…":"Add activity"}</button>
            </div>
          </div>
        </div>
      )}

      {wModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setWModal(false)}}>
          <div className="modal-card" style={{width:"min(480px,96vw)"}}>
            <div className="modal-head"><h2>Give award</h2><button className="icon-button" onClick={()=>setWModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Student *</span>
                <select value={wForm.studentId} onChange={wf("studentId")}>
                  <option value="">— Select student —</option>
                  {students.map((s:any)=><option key={s.id} value={s.id}>{s.firstName} {s.lastName??""}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Award title *</span><input value={wForm.title} onChange={wf("title")} placeholder="e.g. Best in Mathematics"/></label>
              <label className="human-field"><span>Type</span><select value={wForm.awardType} onChange={wf("awardType")}>{AWD_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Date *</span><input type="date" value={wForm.awardDate} onChange={wf("awardDate")}/></label>
              <label className="human-field field-wide"><span>Description</span><input value={wForm.description} onChange={wf("description")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setWModal(false)}>Cancel</button>
              <button className="primary" onClick={saveAward} disabled={createAward.isPending}>{createAward.isPending?"Saving…":"Give award"}</button>
            </div>
          </div>
        </div>
      )}

      {viewActivityId && viewActivityItem && (
        <ViewDrawer
          title="Activity"
          item={viewActivityItem}
          onClose={() => setViewActivityId(null)}
          fields={[
            { key: "name", label: "Activity", wide: true },
            { key: "activityType", label: "Type" },
            { key: "venue", label: "Venue" },
            { key: "startDate", label: "Start" },
            { key: "endDate", label: "End" },
          ]}
        
          onEdit={() => { setEditActivityId(viewActivityId!); setViewActivityId(null); }}/>
      )}

      {editActivityId && viewActivityItem && (
        <EditModal
          title="Activity"
          item={viewActivityItem}
          onClose={() => setEditActivityId(null)}
          onSave={async data => {
            await updActivity.mutateAsync({id: editActivityId!, body: data});
            setEditActivity(null);
          }}
          fields={[
            { key:"name",         label:"Activity name", required:true, wide:true },
            { key:"activityType", label:"Type", type:"select", options:[{value:"SPORTS",label:"Sports"},{value:"CULTURAL",label:"Cultural"},{value:"ACADEMIC",label:"Academic"},{value:"TRIP",label:"Trip"}] },
            { key:"venue",        label:"Venue" },
            { key:"startDate",    label:"Start date", type:"date" },
            { key:"endDate",      label:"End date",   type:"date" },
          ]}
        />
      )}
    </>
  );
}
