import { useState } from "react";
import { CheckCircle2, Clock, GitMerge, Plus, XCircle } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useWorkflowDefs, useApprovals, useProcessApproval } from "../../../core/api/queries";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

const STATUS_PILL: Record<string,string> = { PENDING:"warning", APPROVED:"success", REJECTED:"danger", CANCELLED:"gray" };

export function WorkflowCenterPage() {
  const [tab, setTab] = useState<"approvals"|"definitions">("approvals");
  const { data: defsData }    = useWorkflowDefs();
  const { data: approvalsData, isLoading } = useApprovals();
  const processApproval = useProcessApproval();

  const defs      = (defsData     as any)?.items ?? (defsData     as any) ?? [];
  const approvals = (approvalsData as any)?.items ?? (approvalsData as any) ?? [];

  const pending  = approvals.filter((a:any) => parseMeta(a.metadataJson).status === "PENDING");
  const approved = approvals.filter((a:any) => parseMeta(a.metadataJson).status === "APPROVED");

  async function approve(id: string, item: any) {
    const meta = parseMeta(item.metadataJson);
    await processApproval.mutateAsync({ id, body: { tenantId:item.tenantId, name:item.name, metadataJson:JSON.stringify({...meta,status:"APPROVED"}) } });
  }
  async function reject(id: string, item: any) {
    const meta = parseMeta(item.metadataJson);
    await processApproval.mutateAsync({ id, body: { tenantId:item.tenantId, name:item.name, metadataJson:JSON.stringify({...meta,status:"REJECTED"}) } });
  }

  return (
    <>
      <PageHeader title="Workflow Centre" subtitle="Approvals, definitions and process management"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Pending approvals" value={String(pending.length)}  note="Action needed"  color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
        <StatCard label="Approved"          value={String(approved.length)} note=""               color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Workflow types"    value={String(defs.length)}     note="Configured"     color="#2563EB" bg="#EFF6FF"><GitMerge size={20}/></StatCard>
        <StatCard label="Total requests"    value={String(approvals.length)}note=""               color="#8B5CF6" bg="#F5F3FF"><GitMerge size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="approvals"?"active":""} onClick={()=>setTab("approvals")}>⏳ Pending approvals ({pending.length})</button>
        <button className={tab==="definitions"?"active":""} onClick={()=>setTab("definitions")}>⚙️ Workflow definitions ({defs.length})</button>
      </div>

      {tab === "approvals" && (
        <div className="surface">
          <div className="surface-head"><h3>All approval requests</h3><p>Review and process pending workflows</p></div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Request</th><th>Workflow</th><th>Requester</th><th>Current step</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {approvals.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No approval requests.</td></tr>
                  : approvals.map((a:any)=>{
                    const meta = parseMeta(a.metadataJson);
                    const status = meta.status ?? "PENDING";
                    return (
                      <tr key={a.id}>
                        <td><b style={{fontSize:12}}>{a.name}</b></td>
                        <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1"}}>{meta.workflowCode??"-"}</span></td>
                        <td>{meta.requester??"-"}</td>
                        <td style={{fontSize:11,color:"var(--muted)"}}>{meta.step??"-"}</td>
                        <td style={{fontSize:11}}>{meta.createdAt??"-"}</td>
                        <td><span className={`status-pill ${STATUS_PILL[status]??"gray"}`}>{status}</span></td>
                        <td>
                          {status==="PENDING" && (
                            <div className="row-actions">
                              <button className="table-action" style={{fontSize:10,color:"#10B981"}} onClick={()=>approve(a.id,a)}>✓ Approve</button>
                              <button className="table-action" style={{fontSize:10,color:"var(--danger)"}} onClick={()=>reject(a.id,a)}>✗ Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "definitions" && (
        <div className="surface">
          <div className="surface-head"><h3>Workflow definitions</h3><p>Configured approval chains</p></div>
          <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
            {defs.length===0 ? <div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>No workflows configured.</div>
            : defs.map((d:any)=>{
              const meta = parseMeta(d.metadataJson);
              const steps: string[] = meta.steps ?? [];
              return (
                <div key={d.id} style={{padding:"14px 16px",borderRadius:12,border:"1px solid var(--line)",background:"var(--surface)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <b style={{fontSize:13}}>{d.name}</b>
                      <code style={{marginLeft:10,fontSize:10,padding:"1px 8px",borderRadius:4,background:"var(--surface-2)"}}>{d.code}</code>
                    </div>
                    <span className={`status-pill ${meta.status==="ACTIVE"?"success":"gray"}`}>{meta.status??"ACTIVE"}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:0}}>
                    {steps.map((step:string,i:number)=>(
                      <div key={i} style={{display:"flex",alignItems:"center"}}>
                        <div style={{padding:"4px 12px",borderRadius:6,background:"var(--surface-2)",fontSize:11,fontWeight:600}}>{step}</div>
                        {i<steps.length-1 && <span style={{color:"var(--muted)",fontSize:16,margin:"0 4px"}}>→</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
