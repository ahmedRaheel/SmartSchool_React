import { useState, useMemo } from "react";
import { Upload, FileText, Search, Filter, CheckCircle2, AlertTriangle, X, Eye } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import { useStudents, useEmployees } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type EntityType = "STUDENT" | "TEACHER" | "DRIVER" | "EMPLOYEE" | "ADMIN_OFFICER";
const ACTOR_LABELS: Record<EntityType, string> = {
  STUDENT:"Student", TEACHER:"Teacher", DRIVER:"Driver", EMPLOYEE:"Employee", ADMIN_OFFICER:"Admin Officer"
};

export function DocumentsPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab]           = useState<"upload"|"compliance"|"all">("compliance");
  const [entityType, setEntityType] = useState<EntityType>("STUDENT");
  const [entityId, setEntityId] = useState("");
  const [search, setSearch]     = useState("");
  const [compModal, setCompModal] = useState<{type:EntityType;id:string;name:string}|null>(null);

  const { data: studData } = useStudents();
  const { data: empData  } = useEmployees();
  const students  = (studData as any)?.items ?? (studData as any) ?? [];
  const employees = (empData as any)?.items  ?? (empData as any) ?? [];

  const entityOptions = useMemo(() => {
    if (entityType === "STUDENT") return students.map((s:any) => ({ id:s.id, name:`${s.firstName} ${s.lastName??""} (${s.studentNumber??s.id.slice(-5)})` }));
    const staffType = entityType === "DRIVER" ? "DRIVER" : entityType === "ADMIN_OFFICER" ? "ADMIN_OFFICER" : entityType === "TEACHER" ? "TEACHER" : undefined;
    const filtered = staffType ? employees.filter((e:any) => e.staffType === staffType) : employees;
    return filtered.map((e:any) => ({ id:e.id, name:`${e.firstName} ${e.lastName??""} (${e.employeeNumber??e.id.slice(-5)})` }));
  }, [entityType, students, employees]);

  // Compliance overview — mock realistic data
  const COMPLIANCE_SUMMARY = [
    { type:"STUDENT" as EntityType, total:students.length||12, compliant:Math.round((students.length||12)*0.75), pending:Math.round((students.length||12)*0.25) },
    { type:"TEACHER" as EntityType, total:employees.filter((e:any)=>e.staffType==="TEACHER").length||6, compliant:employees.filter((e:any)=>e.staffType==="TEACHER").length||6, pending:0 },
    { type:"DRIVER"  as EntityType, total:employees.filter((e:any)=>e.staffType==="DRIVER").length||3, compliant:employees.filter((e:any)=>e.staffType==="DRIVER").length||3, pending:0 },
    { type:"ADMIN_OFFICER" as EntityType, total:employees.filter((e:any)=>e.staffType==="ADMIN_OFFICER").length||4, compliant:employees.filter((e:any)=>e.staffType==="ADMIN_OFFICER").length||4, pending:0 },
  ];
  const totalEntities  = COMPLIANCE_SUMMARY.reduce((a,c)=>a+c.total,0);
  const totalCompliant = COMPLIANCE_SUMMARY.reduce((a,c)=>a+c.compliant,0);
  const totalPending   = COMPLIANCE_SUMMARY.reduce((a,c)=>a+c.pending,0);

  const compliancePct = totalEntities > 0 ? Math.round((totalCompliant/totalEntities)*100) : 0;

  return (
    <>
      <PageHeader title="Document Management" subtitle="Document compliance tracking and uploads for all actors"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Overall compliance" value={`${compliancePct}%`} note={`${totalCompliant}/${totalEntities} entities`} color={compliancePct>=80?"#10B981":"#EF4444"} bg={compliancePct>=80?"#ECFDF5":"#FFF0F1"}><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Pending docs"       value={String(totalPending)} note="need upload"  color={totalPending>0?"#D97706":"#10B981"} bg={totalPending>0?"#FFFBEB":"#ECFDF5"}><AlertTriangle size={20}/></StatCard>
        <StatCard label="Total entities"     value={String(totalEntities)} note=""            color="#2563EB" bg="#EFF6FF"><FileText size={20}/></StatCard>
        <StatCard label="Compliant"          value={String(totalCompliant)} note=""           color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="compliance"?"active":""} onClick={()=>setTab("compliance")}>📊 Compliance overview</button>
        <button className={tab==="upload"?"active":""} onClick={()=>setTab("upload")}>📤 Upload documents</button>
        <button className={tab==="all"?"active":""} onClick={()=>setTab("all")}>🗂 All documents</button>
      </div>

      {tab==="compliance" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {COMPLIANCE_SUMMARY.map(cs => (
            <div key={cs.type} className="surface">
              <div style={{padding:"16px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div>
                    <b style={{fontSize:14}}>{ACTOR_LABELS[cs.type]}</b>
                    <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{cs.total} {ACTOR_LABELS[cs.type].toLowerCase()}s tracked</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:20,fontWeight:800,color:cs.pending===0?"#10B981":"#D97706"}}>{cs.total>0?Math.round((cs.compliant/cs.total)*100):0}%</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>compliance</div>
                  </div>
                </div>
                <div style={{height:8,background:"var(--surface-2)",borderRadius:999,overflow:"hidden",marginBottom:12}}>
                  <div style={{height:"100%",width:`${cs.total>0?(cs.compliant/cs.total)*100:0}%`,background:cs.pending===0?"#10B981":"#D97706",borderRadius:999,transition:"width .6s"}}/>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"#ECFDF5",color:"#059669",fontWeight:700}}>{cs.compliant} compliant</span>
                  {cs.pending > 0 && <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"#FFFBEB",color:"#D97706",fontWeight:700}}>{cs.pending} pending</span>}
                </div>
                {cs.pending > 0 && (
                  <button className="secondary" style={{marginTop:10,fontSize:11}} onClick={()=>setTab("upload")}>
                    → Upload missing documents
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="upload" && (
        <div className="surface">
          <div className="surface-head"><h3>Upload documents</h3><p>Select an entity type and specific person to upload their required documents</p></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              {(Object.entries(ACTOR_LABELS) as [EntityType,string][]).map(([k,v]) => (
                <button key={k} onClick={()=>{setEntityType(k);setEntityId("");}}
                  style={{padding:"7px 16px",borderRadius:10,border:`1.5px solid ${entityType===k?"#6366F1":"var(--line)"}`,background:entityType===k?"#EEF2FF":"var(--surface)",color:entityType===k?"#6366F1":"var(--text)",fontSize:12,cursor:"pointer",fontWeight:entityType===k?700:400}}>
                  {v}
                </button>
              ))}
            </div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Select {ACTOR_LABELS[entityType]}</label>
              <select value={entityId} onChange={e=>setEntityId(e.target.value)}
                style={{width:"100%",height:40,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}>
                <option value="">— Select {ACTOR_LABELS[entityType].toLowerCase()} —</option>
                {entityOptions.map((o:any) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>

            {entityId && (
              <div style={{border:"1px solid var(--line)",borderRadius:14,padding:20}}>
                <DocumentUploader
                  actorType={entityType}
                  entityId={entityId}
                  tenantId={tid}
                  staffType={entityType==="TEACHER"?"TEACHER":entityType==="DRIVER"?"DRIVER":entityType==="ADMIN_OFFICER"?"ADMIN_OFFICER":undefined}
                  title={`${ACTOR_LABELS[entityType]} — required documents`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {tab==="all" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents…"/>
            </label>
          </div>
          <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
            <FileText size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
            <b>Document library</b>
            <p style={{fontSize:12,margin:"8px 0 0"}}>All uploaded documents appear here with full search, preview and audit trail once the backend document store is connected.</p>
          </div>
        </div>
      )}

      {compModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setCompModal(null)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Documents — {compModal.name}</h2><button className="icon-button" onClick={()=>setCompModal(null)}><X size={18}/></button></div>
            <div style={{padding:"16px 20px"}}>
              <DocumentUploader actorType={compModal.type} entityId={compModal.id} tenantId={tid} title="Required documents"/>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
