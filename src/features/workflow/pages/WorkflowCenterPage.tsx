import { useState } from "react";
import { Plus, X, Zap, ChevronRight, Check, Clock, AlertTriangle, GitBranch } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useWorkflowDefinitions, useCreateWorkflowDefinition, useApprovals, useWorkflowInstances } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { RowActions } from "../../../components/ui/RowActions";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };

const TRIGGER_TYPES  = ["ADMISSION_SUBMITTED","LEAVE_REQUESTED","PAYMENT_OVERDUE","FEE_WAIVER_REQUEST","DOCUMENT_UPLOADED","ASSIGNMENT_SUBMITTED","COMPLAINT_RAISED","CUSTOM"];
const ENTITY_TYPES   = ["Student","Employee","Invoice","Admission","Assignment","Leave","Document","Custom"];
const STATUS_PILL: Record<string,string> = { ACTIVE:"success", INACTIVE:"gray", PENDING:"warning", APPROVED:"success", REJECTED:"danger", IN_PROGRESS:"info" };

// Built-in automation rules shown in the system
const BUILTIN_RULES = [
  { id:"b1", name:"Auto-accept admission (marks ≥ 80% + docs)",   trigger:"ADMISSION_SUBMITTED", action:"SET_STATUS:ADMISSION_ACCEPTED",  entity:"Admission", active:true,  condition:"marks >= 80 && documents.compliant" },
  { id:"b2", name:"Auto-reject admission (marks < minimum)",       trigger:"ADMISSION_SUBMITTED", action:"SET_STATUS:ADMISSION_REJECTED",  entity:"Admission", active:true,  condition:"marks < criteria.minimumMarks" },
  { id:"b3", name:"Auto-waitlist if class is full",                trigger:"ADMISSION_SUBMITTED", action:"SET_STATUS:WAITING_LIST",        entity:"Admission", active:true,  condition:"section.enrolled >= section.seats" },
  { id:"b4", name:"Gender policy enforcement",                     trigger:"ADMISSION_SUBMITTED", action:"SET_STATUS:ADMISSION_REJECTED",  entity:"Admission", active:true,  condition:"!campus.allowsGender(gender)" },
  { id:"b5", name:"Create student + parent accounts on acceptance",trigger:"ADMISSION_ACCEPTED",  action:"PROVISION_ACCOUNTS",             entity:"Admission", active:true,  condition:"always" },
  { id:"b6", name:"Send acceptance notification to guardian",      trigger:"ADMISSION_ACCEPTED",  action:"SEND_NOTIFICATION",              entity:"Admission", active:true,  condition:"guardian.email != null" },
  { id:"b7", name:"Late fee alert after due date",                 trigger:"PAYMENT_OVERDUE",     action:"SEND_NOTIFICATION",              entity:"Invoice",   active:true,  condition:"daysOverdue >= 1" },
  { id:"b8", name:"Grade assignment automatically on submission",  trigger:"ASSIGNMENT_SUBMITTED",action:"NOTIFY_TEACHER",                 entity:"Assignment",active:true,  condition:"always" },
];

export function WorkflowCenterPage() {
  const { user } = useAuth();
  const [viewWf, setViewWf] = useState<any|null>(null); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"rules"|"approvals"|"instances">("rules");
  const [defModal, setDefModal] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", triggerType:"ADMISSION_SUBMITTED", entityType:"Student", description:"", status:"ACTIVE" });

  const { data: defsData } = useWorkflowDefinitions();
  const { data: approvalsData } = useApprovals();
  const { data: instancesData } = useWorkflowInstances();
  const createDef = useCreateWorkflowDefinition();

  const defs      = (defsData as any)?.items      ?? (defsData as any)      ?? [];
  const approvals = (approvalsData as any)?.items  ?? (approvalsData as any)  ?? [];
  const instances = (instancesData as any)?.items  ?? (instancesData as any)  ?? [];

  const ff = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:e.target.value}));

  const allRules    = [...BUILTIN_RULES, ...defs.map((d:any)=>({ ...parseMeta(d.metadataJson), id:d.id, name:d.name, builtin:false }))];
  const activeRules = allRules.filter(r => r.active).length;
  const pendingApprovals = approvals.filter((a:any) => parseMeta(a.metadataJson).status === "PENDING").length;

  async function saveDef() {
    if (!form.name) { setError("Name required"); return; }
    try {
      await createDef.mutateAsync({ tenantId:tid, name:form.name, metadataJson:JSON.stringify({ trigger:form.triggerType, entity:form.entityType, description:form.description, active:form.status==="ACTIVE", steps:[], builtIn:false }) });
      setDefModal(false); setForm({ name:"", triggerType:"ADMISSION_SUBMITTED", entityType:"Student", description:"", status:"ACTIVE" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Workflow Centre" subtitle="Automation rules, approval chains and process management"
        action={<div className="page-actions">
          {tab==="rules" && <button className="primary" onClick={()=>{setDefModal(true);setError("");}}><Plus size={14}/> New rule</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Active rules"       value={String(activeRules)}       note="automation" color="#10B981" bg="#ECFDF5"><Zap size={20}/></StatCard>
        <StatCard label="Pending approvals"  value={String(pendingApprovals)}  note="need action" color={pendingApprovals>0?"#D97706":"#10B981"} bg={pendingApprovals>0?"#FFFBEB":"#ECFDF5"}><Clock size={20}/></StatCard>
        <StatCard label="Total rules"        value={String(allRules.length)}   note=""            color="#6366F1" bg="#EEF2FF"><GitBranch size={20}/></StatCard>
        <StatCard label="Custom rules"       value={String(defs.length)}       note="user-defined" color="#8B5CF6" bg="#F5F3FF"><Plus size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="rules"?"active":""} onClick={()=>setTab("rules")}>⚡ Automation rules ({allRules.length})</button>
        <button className={tab==="approvals"?"active":""} onClick={()=>setTab("approvals")}>✅ Approvals ({approvals.length})</button>
        <button className={tab==="instances"?"active":""} onClick={()=>setTab("instances")}>🔄 Running instances ({instances.length})</button>
      </div>

      {tab==="rules" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{padding:"12px 16px",background:"linear-gradient(135deg,#EEF2FF,#F5F3FF)",border:"1px solid #C7D2FE",borderRadius:12,display:"flex",gap:12,alignItems:"flex-start"}}>
            <Zap size={20} style={{color:"#6366F1",flexShrink:0,marginTop:2}}/>
            <div>
              <b style={{fontSize:13,color:"#6366F1",display:"block",marginBottom:4}}>AI-powered automation</b>
              <p style={{fontSize:12,color:"#475569",margin:0,lineHeight:1.6}}>
                Rules run automatically on every matching event. Built-in rules handle admissions, fees and accounts provisioning. Add custom rules for your school's specific processes.
              </p>
            </div>
          </div>

          <div className="surface">
            <div className="surface-head"><h3>All automation rules</h3><p>Evaluated in order — first matching rule wins</p></div>
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:8}}>
              {allRules.map((r,i)=>(
                <div key={r.id} style={{padding:"13px 16px",borderRadius:12,border:`1.5px solid ${r.active?"var(--line)":"var(--line)"}`,background:r.active?"var(--surface)":"var(--surface-2)",display:"flex",gap:14,alignItems:"flex-start",opacity:r.active?1:0.6}}>
                  <div style={{width:28,height:28,borderRadius:8,background:r.active?"#EEF2FF":"var(--surface-2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:800,color:r.active?"#6366F1":"var(--muted)"}}>{i+1}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:6}}>{r.name}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#FFFBEB",color:"#D97706"}}>Trigger: {r.trigger}</code>
                      <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#EEF2FF",color:"#6366F1"}}>→ {r.action}</code>
                      {r.condition && <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"var(--surface-2)",color:"var(--muted)"}}>if {r.condition}</code>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    {(r as any).builtin===false && <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#F5F3FF",color:"#7C3AED",fontWeight:700}}>CUSTOM</span>}
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:r.active?"#ECFDF5":"var(--surface-2)",color:r.active?"#059669":"var(--muted)"}}>
                      {r.active?"Active":"Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="approvals" && (
        <div className="surface">
          <div className="surface-head"><h3>Pending approvals</h3><p>Items awaiting your decision</p></div>
          {approvals.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
              <Check size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
              <b>No pending approvals</b>
              <p style={{fontSize:12,margin:"8px 0 0"}}>All items have been processed.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Item</th><th>Requester</th><th>Type</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {approvals.map((a:any)=>{ const m=parseMeta(a.metadataJson); return (
                    <tr key={a.id}>
                      <td><b style={{fontSize:12}}>{a.name}</b></td>
                      <td style={{fontSize:11}}>{m.requestedBy??"—"}</td>
                      <td style={{fontSize:11}}>{m.type??"—"}</td>
                      <td style={{fontSize:10,color:"var(--muted)"}}>{m.submittedAt?new Date(m.submittedAt).toLocaleString():"—"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[m.status??"PENDING"]??"warning"}`}>{m.status??"PENDING"}</span></td>
                      <td>
                        {m.status==="PENDING" && (
                          <div className="row-actions">
                            <button className="table-action" style={{color:"#059669",fontSize:10}}>✓ Approve</button>
                            <button className="table-action" style={{color:"#EF4444",fontSize:10}}>✗ Reject</button>
                          </div>
                        )}
                      </td>
<td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <RowActions
                                onView={() => a.id}
                                onEdit={() => setViewWf(a)}
                                                                deleteLabel="record"
                                workflow item
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

      {tab==="instances" && (
        <div className="surface">
          <div className="surface-head"><h3>Running workflow instances</h3></div>
          {instances.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
              <GitBranch size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
              <b>No active workflow instances</b>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Workflow</th><th>Entity</th><th>Step</th><th>Started</th><th>Status</th></tr></thead>
                <tbody>
                  {instances.map((inst:any)=>{ const m=parseMeta(inst.metadataJson); return (
                    <tr key={inst.id}>
                      <td><b style={{fontSize:12}}>{m.workflowName??inst.name}</b></td>
                      <td style={{fontSize:11}}>{m.entityType??"—"} · <code>{m.entityId?.slice(-8)??"—"}</code></td>
                      <td style={{fontSize:11}}>{m.currentStep??"—"}</td>
                      <td style={{fontSize:10,color:"var(--muted)"}}>{m.startedAt?new Date(m.startedAt).toLocaleString():"—"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[m.status??"IN_PROGRESS"]??"info"}`}>{m.status??"IN_PROGRESS"}</span></td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {defModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDefModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head"><h2>New automation rule</h2><button className="icon-button" onClick={()=>setDefModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Rule name *</span><input value={form.name} onChange={ff("name")} placeholder="e.g. Notify HOD on late fee"/></label>
              <label className="human-field"><span>Trigger event</span><select value={form.triggerType} onChange={ff("triggerType")}>{TRIGGER_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Entity type</span><select value={form.entityType} onChange={ff("entityType")}>{ENTITY_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Status</span><select value={form.status} onChange={ff("status")}><option>ACTIVE</option><option>INACTIVE</option></select></label>
              <label className="human-field field-wide"><span>Description</span><input value={form.description} onChange={ff("description")} placeholder="What does this rule do?"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setDefModal(false)}>Cancel</button>
              <button className="primary" onClick={saveDef} disabled={createDef.isPending}>{createDef.isPending?"Saving…":"Create rule"}</button>
            </div>
          </div>
        </div>
      )}

      {viewWf && (
        <ViewDrawer
          title="Workflow Item"
          item={viewWf}
          onClose={() => setViewWf(null)}
          fields={[
            { key: "name", label: "Item", wide: true },
            { key: "requestedBy", label: "Requester" },
            { key: "type", label: "Type" },
            { key: "submittedAt", label: "Submitted" },
            { key: "status", label: "Status" },
            { key: "notes", label: "Notes", wide: true },
          ]}
        />
      )}
    </>
  );
}
