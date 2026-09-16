import { useMemo, useState } from "react";
import { CheckCircle2, GitBranch, Play, Plus, Trash2, XCircle } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { toItems } from "../../../core/utils/dataHelpers";
import {
  useApprovals,
  useCreateWorkflowDefinition,
  useCreateWorkflowInstance,
  useDeleteWorkflowDefinition,
  useProcessApproval,
  useUpdateWorkflowDefinition,
  useWorkflowDefinitions,
  useWorkflowInstances,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type StepForm = { name:string; stepType:"APPROVAL"|"ACTION"; approverRole:string; actionCode:string; isRequired:boolean };
type DefinitionForm = { name:string; description:string; triggerType:string; entityType:string; status:"ACTIVE"|"INACTIVE"; steps:StepForm[] };

const emptyStep = ():StepForm => ({ name:"Approval", stepType:"APPROVAL", approverRole:"Admin", actionCode:"", isRequired:true });
const emptyDefinition = ():DefinitionForm => ({ name:"", description:"", triggerType:"MANUAL", entityType:"GENERIC", status:"ACTIVE", steps:[emptyStep()] });
const roles = ["Admin","AdminOfficer","Principal","HRManager","HR","Accountant","FinanceOfficer","Teacher","Examiner","Librarian","Tenant","TenantAdmin","Owner"];

export function WorkflowCenterPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const [tab,setTab] = useState<"definitions"|"approvals"|"instances">("definitions");
  const [showDefinition,setShowDefinition] = useState(false);
  const [showStart,setShowStart] = useState(false);
  const [editingId,setEditingId] = useState<string|undefined>();
  const [definition,setDefinition] = useState<DefinitionForm>(emptyDefinition());
  const [startForm,setStartForm] = useState({ workflowDefinitionId:"", name:"", entityId:"", contextJson:"" });
  const [decisionComments,setDecisionComments] = useState<Record<string,string>>({});
  const [error,setError] = useState("");

  const defsQuery = useWorkflowDefinitions();
  const approvalsQuery = useApprovals();
  const instancesQuery = useWorkflowInstances();
  const createDef = useCreateWorkflowDefinition();
  const updateDef = useUpdateWorkflowDefinition();
  const deleteDef = useDeleteWorkflowDefinition();
  const createInstance = useCreateWorkflowInstance();
  const processApproval = useProcessApproval();

  const definitions = toItems(defsQuery.data);
  const approvals = toItems(approvalsQuery.data);
  const instances = toItems(instancesQuery.data);
  const pending = approvals.filter((x:any)=>x.status === "PENDING");
  const running = instances.filter((x:any)=>x.status === "IN_PROGRESS");
  const activeDefs = useMemo(()=>definitions.filter((x:any)=>x.status === "ACTIVE"),[definitions]);

  const openCreate = () => { setEditingId(undefined); setDefinition(emptyDefinition()); setError(""); setShowDefinition(true); };
  const openEdit = (item:any) => {
    setEditingId(item.id);
    setDefinition({
      name:item.name ?? "", description:item.description ?? "", triggerType:item.triggerType ?? "MANUAL",
      entityType:item.entityType ?? "GENERIC", status:item.status ?? "ACTIVE",
      steps:(item.steps ?? []).map((s:any)=>({name:s.name,stepType:s.stepType,approverRole:s.approverRole ?? "",actionCode:s.actionCode ?? "",isRequired:s.isRequired !== false})) || [emptyStep()],
    });
    setError(""); setShowDefinition(true);
  };
  const saveDefinition = async () => {
    setError("");
    if (!definition.name.trim() || definition.steps.length === 0) { setError("Name and at least one step are required."); return; }
    if (definition.steps.some(s=>!s.name.trim() || (s.stepType === "APPROVAL" && !s.approverRole))) { setError("Every step needs a name and approval steps need an approver role."); return; }
    const body={tenantId,name:definition.name,description:definition.description||null,triggerType:definition.triggerType,entityType:definition.entityType,status:definition.status,steps:definition.steps.map(s=>({...s,actionCode:s.actionCode||null,approverRole:s.stepType==="APPROVAL"?s.approverRole:null}))};
    try { if(editingId) await updateDef.mutateAsync({id:editingId,body}); else await createDef.mutateAsync(body); setShowDefinition(false); }
    catch(e:any){ setError(e?.response?.data?.detail ?? e?.message ?? "Unable to save workflow."); }
  };
  const startWorkflow = async () => {
    setError(""); if(!startForm.workflowDefinitionId || !startForm.name.trim()){setError("Choose a workflow and provide an instance name.");return;}
    try { await createInstance.mutateAsync({tenantId,workflowDefinitionId:startForm.workflowDefinitionId,name:startForm.name,entityId:startForm.entityId||null,contextJson:startForm.contextJson||null}); setShowStart(false); setStartForm({workflowDefinitionId:"",name:"",entityId:"",contextJson:""}); }
    catch(e:any){setError(e?.response?.data?.detail ?? e?.message ?? "Unable to start workflow.");}
  };
  const decide = async (id:string,decision:"APPROVED"|"REJECTED") => { try { await processApproval.mutateAsync({id,body:{tenantId,decision,comments:decisionComments[id]||null}}); } catch(e:any){setError(e?.response?.data?.detail ?? e?.message ?? "Unable to process approval.");} };

  return <div>
    <PageHeader title="Workflow Centre" subtitle="Versioned business workflows, approvals and execution history" action={<div style={{display:"flex",gap:8}}><button className="button secondary" onClick={()=>setShowStart(true)} disabled={!activeDefs.length}><Play size={16}/> Start workflow</button><button className="button primary" onClick={openCreate}><Plus size={16}/> New definition</button></div>} />
    {error && <div className="alert error" style={{marginBottom:12}}>{error}</div>}
    <div className="stats-grid">
      <StatCard label="Definitions" value={String(definitions.length)} note={`${activeDefs.length} active`}><GitBranch size={20}/></StatCard>
      <StatCard label="Pending approvals" value={String(pending.length)} note="assigned to your role"><CheckCircle2 size={20}/></StatCard>
      <StatCard label="Running" value={String(running.length)} note="workflow instances"><Play size={20}/></StatCard>
    </div>
    <div className="tabs" style={{margin:"18px 0"}}>
      <button className={tab==="definitions"?"active":""} onClick={()=>setTab("definitions")}>Definitions</button>
      <button className={tab==="approvals"?"active":""} onClick={()=>setTab("approvals")}>Approvals ({pending.length})</button>
      <button className={tab==="instances"?"active":""} onClick={()=>setTab("instances")}>Instances</button>
    </div>

    {tab==="definitions" && <section className="surface"><div className="surface-head"><h3>Workflow definitions</h3><p>Steps execute in order. Approval steps pause until the assigned role decides.</p></div><div className="table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Trigger</th><th>Entity</th><th>Version</th><th>Steps</th><th>Status</th><th/></tr></thead><tbody>{definitions.map((d:any)=><tr key={d.id}><td>{d.code}</td><td><b>{d.name}</b><small style={{display:"block"}}>{d.description}</small></td><td>{d.triggerType}</td><td>{d.entityType}</td><td>v{d.version}</td><td>{d.steps?.length ?? 0}</td><td><span className={`pill ${d.status==="ACTIVE"?"success":"gray"}`}>{d.status}</span></td><td><div style={{display:"flex",gap:6}}><button className="button secondary small" onClick={()=>openEdit(d)}>Edit</button><button className="icon-button" title="Delete" onClick={()=>deleteDef.mutate(d.id)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div>{!definitions.length && <div className="empty-state">No workflow definitions yet.</div>}</section>}

    {tab==="approvals" && <section className="surface"><div className="surface-head"><h3>Approval queue</h3><p>Only approvals assigned to your role are actionable.</p></div><div className="table-wrap"><table><thead><tr><th>Workflow</th><th>Step</th><th>Role</th><th>Requested</th><th>Status</th><th>Comments / action</th></tr></thead><tbody>{approvals.map((a:any)=><tr key={a.id}><td><b>{a.instanceName}</b><small style={{display:"block"}}>{a.code}</small></td><td>{a.stepName}</td><td>{a.assignedRole}</td><td>{a.requestedAt?new Date(a.requestedAt).toLocaleString():"—"}</td><td><span className={`pill ${a.status==="APPROVED"?"success":a.status==="REJECTED"?"danger":"warning"}`}>{a.status}</span></td><td>{a.status==="PENDING"?<div style={{display:"flex",gap:6,alignItems:"center",minWidth:320}}><input placeholder="Decision comments" value={decisionComments[a.id]??""} onChange={e=>setDecisionComments(v=>({...v,[a.id]:e.target.value}))}/><button className="button primary small" onClick={()=>decide(a.id,"APPROVED")}><CheckCircle2 size={14}/> Approve</button><button className="button danger small" onClick={()=>decide(a.id,"REJECTED")}><XCircle size={14}/> Reject</button></div>:a.comments??"—"}</td></tr>)}</tbody></table></div>{!approvals.length&&<div className="empty-state">No approvals assigned to you.</div>}</section>}

    {tab==="instances" && <section className="surface"><div className="surface-head"><h3>Workflow execution history</h3></div><div className="table-wrap"><table><thead><tr><th>Code</th><th>Name</th><th>Definition</th><th>Entity</th><th>Current step</th><th>Started</th><th>Status</th></tr></thead><tbody>{instances.map((i:any)=><tr key={i.id}><td>{i.code}</td><td><b>{i.name}</b></td><td>{i.definitionName}</td><td>{i.entityType}{i.entityId?` · ${i.entityId}`:""}</td><td>{i.currentStepOrder || "—"}</td><td>{i.startedAt?new Date(i.startedAt).toLocaleString():"—"}</td><td><span className={`pill ${i.status==="COMPLETED"?"success":i.status==="REJECTED"?"danger":"info"}`}>{i.status}</span></td></tr>)}</tbody></table></div>{!instances.length&&<div className="empty-state">No workflow instances have been started.</div>}</section>}

    {showDefinition && <div className="modal-backdrop"><div className="modal" style={{maxWidth:760}}><div className="modal-head"><h3>{editingId?"Edit workflow definition":"New workflow definition"}</h3><button className="icon-button" onClick={()=>setShowDefinition(false)}>×</button></div><div className="modal-body">
      <div className="form-grid"><label>Name<input value={definition.name} onChange={e=>setDefinition(v=>({...v,name:e.target.value}))}/></label><label>Trigger<select value={definition.triggerType} onChange={e=>setDefinition(v=>({...v,triggerType:e.target.value}))}><option>MANUAL</option><option>ADMISSION_SUBMITTED</option><option>LEAVE_REQUESTED</option><option>FEE_WAIVER_REQUEST</option><option>DOCUMENT_UPLOADED</option><option>ASSIGNMENT_SUBMITTED</option><option>CUSTOM</option></select></label><label>Entity type<input value={definition.entityType} onChange={e=>setDefinition(v=>({...v,entityType:e.target.value.toUpperCase()}))}/></label><label>Status<select value={definition.status} onChange={e=>setDefinition(v=>({...v,status:e.target.value as any}))}><option>ACTIVE</option><option>INACTIVE</option></select></label><label style={{gridColumn:"1/-1"}}>Description<textarea rows={2} value={definition.description} onChange={e=>setDefinition(v=>({...v,description:e.target.value}))}/></label></div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"14px 0 8px"}}><b>Ordered steps</b><button className="button secondary small" onClick={()=>setDefinition(v=>({...v,steps:[...v.steps,emptyStep()]}))}><Plus size={14}/> Add step</button></div>
      {definition.steps.map((s,index)=><div key={index} className="surface" style={{padding:10,marginBottom:8}}><div className="form-grid"><label>#{index+1} Name<input value={s.name} onChange={e=>setDefinition(v=>({...v,steps:v.steps.map((x,i)=>i===index?{...x,name:e.target.value}:x)}))}/></label><label>Type<select value={s.stepType} onChange={e=>setDefinition(v=>({...v,steps:v.steps.map((x,i)=>i===index?{...x,stepType:e.target.value as any}:x)}))}><option>APPROVAL</option><option>ACTION</option></select></label>{s.stepType==="APPROVAL"?<label>Approver role<select value={s.approverRole} onChange={e=>setDefinition(v=>({...v,steps:v.steps.map((x,i)=>i===index?{...x,approverRole:e.target.value}:x)}))}>{roles.map(r=><option key={r}>{r}</option>)}</select></label>:<label>Action code<input value={s.actionCode} onChange={e=>setDefinition(v=>({...v,steps:v.steps.map((x,i)=>i===index?{...x,actionCode:e.target.value.toUpperCase()}:x)}))}/></label>}<label style={{alignSelf:"end"}}><span><input type="checkbox" checked={s.isRequired} onChange={e=>setDefinition(v=>({...v,steps:v.steps.map((x,i)=>i===index?{...x,isRequired:e.target.checked}:x)}))}/> Required</span></label><button className="icon-button" title="Remove step" onClick={()=>setDefinition(v=>({...v,steps:v.steps.filter((_,i)=>i!==index)}))}><Trash2 size={15}/></button></div></div>)}
    </div><div className="modal-foot"><button className="button secondary" onClick={()=>setShowDefinition(false)}>Cancel</button><button className="button primary" onClick={saveDefinition} disabled={createDef.isPending||updateDef.isPending}>Save workflow</button></div></div></div>}

    {showStart && <div className="modal-backdrop"><div className="modal"><div className="modal-head"><h3>Start workflow</h3><button className="icon-button" onClick={()=>setShowStart(false)}>×</button></div><div className="modal-body"><div className="form-grid"><label>Definition<select value={startForm.workflowDefinitionId} onChange={e=>setStartForm(v=>({...v,workflowDefinitionId:e.target.value}))}><option value="">Select workflow</option>{activeDefs.map((d:any)=><option value={d.id} key={d.id}>{d.name}</option>)}</select></label><label>Instance name<input value={startForm.name} onChange={e=>setStartForm(v=>({...v,name:e.target.value}))}/></label><label>Entity ID (optional)<input value={startForm.entityId} onChange={e=>setStartForm(v=>({...v,entityId:e.target.value}))}/></label><label style={{gridColumn:"1/-1"}}>Context JSON (optional)<textarea rows={3} value={startForm.contextJson} onChange={e=>setStartForm(v=>({...v,contextJson:e.target.value}))}/></label></div></div><div className="modal-foot"><button className="button secondary" onClick={()=>setShowStart(false)}>Cancel</button><button className="button primary" onClick={startWorkflow} disabled={createInstance.isPending}>Start</button></div></div></div>}
  </div>;
}
