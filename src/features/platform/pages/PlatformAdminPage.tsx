import { useState } from "react";
import { Shield, Database, Cpu, Settings, Users, Activity, RefreshCw, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useTenants, useModelConfigs, useExecLogs, useAuditLogs } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { RowActions } from "../../../components/ui/RowActions";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };

export function PlatformAdminPage() {
  const { user } = useAuth();
  const [viewItem, setViewItem] = useState<any|null>(null);
  const [tab, setTab] = useState<"overview"|"tenants"|"ai"|"logs">("overview");

  const { data: tenantsData } = useTenants();
  const { data: modelsData  } = useModelConfigs();
  const { data: logsData    } = useExecLogs();
  const { data: auditData   } = useAuditLogs();

  const tenants  = (tenantsData as any)?.items ?? (tenantsData as any) ?? [];
  const models   = (modelsData as any)?.items  ?? (modelsData as any) ?? [];
  const execLogs = (logsData as any)?.items    ?? (logsData as any) ?? [];
  const auditLogs= (auditData as any)?.items   ?? (auditData as any) ?? [];

  const active = tenants.filter((t:any) => parseMeta(t.metadataJson).status === "ACTIVE").length;
  const trial  = tenants.filter((t:any) => parseMeta(t.metadataJson).status === "TRIAL").length;

  const PLATFORM_MODULES = [
    { name:"Identity & Auth",    status:"Healthy", version:"v2.1.0", icon:"🔐" },
    { name:"Tenancy",            status:"Healthy", version:"v1.8.0", icon:"🏢" },
    { name:"AI Core",            status:"Healthy", version:"v3.0.0", icon:"🧠" },
    { name:"Communication",      status:"Healthy", version:"v1.5.0", icon:"💬" },
    { name:"Documents",          status:"Healthy", version:"v1.2.0", icon:"📄" },
    { name:"Workflow",           status:"Healthy", version:"v2.0.0", icon:"⚡" },
    { name:"Finance",            status:"Healthy", version:"v2.3.0", icon:"💰" },
    { name:"Kafka Messaging",    status:"Healthy", version:"v3.7.0", icon:"📨" },
    { name:"Hangfire Jobs",      status:"Healthy", version:"v1.8.0", icon:"⏰" },
    { name:"PostgreSQL",         status:"Healthy", version:"v16.0",  icon:"🗄️" },
    { name:"Redis Cache",        status:"Healthy", version:"v7.2.0", icon:"⚡" },
    { name:"Qdrant Vector DB",   status:"Healthy", version:"v1.7.0", icon:"🔍" },
  ];

  return (
    <>
      <PageHeader title="Platform Administration" subtitle="System health, tenant management, AI models and audit"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Active tenants"   value={String(active)}        note=""         color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Trial tenants"    value={String(trial)}         note=""         color="#D97706" bg="#FFFBEB"><Users size={20}/></StatCard>
        <StatCard label="AI models active" value={String(models.filter((m:any)=>parseMeta(m.metadataJson).active).length||3)} note="" color="#8B5CF6" bg="#F5F3FF"><Cpu size={20}/></StatCard>
        <StatCard label="System status"    value="All healthy"           note="12 modules" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>🟢 System health</button>
        <button className={tab==="tenants"?"active":""} onClick={()=>setTab("tenants")}>🏢 Tenants ({tenants.length})</button>
        <button className={tab==="ai"?"active":""} onClick={()=>setTab("ai")}>🧠 AI models ({models.length||3})</button>
        <button className={tab==="logs"?"active":""} onClick={()=>setTab("logs")}>📋 Exec logs</button>
      </div>

      {tab==="overview" && (
        <div className="surface">
          <div className="surface-head"><h3>Module health status</h3><p>All backend modules and infrastructure</p></div>
          <div style={{padding:"0 20px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
            {PLATFORM_MODULES.map(m => (
              <div key={m.name} style={{padding:"12px 16px",border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:20}}>{m.icon}</span>
                <div style={{flex:1}}>
                  <b style={{fontSize:12}}>{m.name}</b>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{m.version}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"#059669"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:"#10B981"}}/>
                  {m.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="tenants" && (
        <div className="surface">
          <div className="surface-head"><h3>Tenant registry</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>School</th><th>Domain</th><th>Plan</th><th>Students</th><th>Status</th><th>Since</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th></tr></thead>
              <tbody>
                {tenants.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No tenants.</td></tr>
                : tenants.map((t:any)=>{ const m=parseMeta(t.metadataJson); return (
                  <tr key={t.id}>
                    <td><b style={{fontSize:12}}>{t.name}</b></td>
                    <td style={{fontSize:11}}><code>{m.domain??t.code}</code></td>
                    <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{m.subscriptionPlan??"Starter"}</span></td>
                    <td>{m.studentCount??0}</td>
                    <td><span className={`status-pill ${m.status==="ACTIVE"?"success":m.status==="TRIAL"?"warning":"gray"}`}>{m.status??"ACTIVE"}</span></td>
                    <td style={{fontSize:10,color:"var(--muted)"}}>{m.createdAt?new Date(m.createdAt).toLocaleDateString():"—"}</td>
<td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <RowActions
                                onView={() => setViewItem(t)}
                                deleteLabel="tenant"
                              />
                            </td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="ai" && (
        <div className="surface">
          <div className="surface-head"><h3>AI model configurations</h3></div>
          <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
            {(models.length ? models : [
              { id:"m1", name:"AI Assistant (RAG)", metadataJson:JSON.stringify({ provider:"Ollama", model:"llama3:8b", temp:0.3, maxTokens:2048, active:true, usage:"General Q&A and RAG retrieval" }) },
              { id:"m2", name:"AI Tutor",           metadataJson:JSON.stringify({ provider:"Ollama", model:"mistral:7b", temp:0.7, maxTokens:1024, active:true, usage:"Student tutoring sessions" }) },
              { id:"m3", name:"Prediction Engine",  metadataJson:JSON.stringify({ provider:"Custom ML", model:"sklearn-ensemble", temp:null, maxTokens:null, active:true, usage:"Dropout and grade prediction" }) },
            ]).map((m:any)=>{ const meta=parseMeta(m.metadataJson); return (
              <div key={m.id} style={{padding:"16px",border:"1.5px solid var(--line)",borderRadius:12,display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:40,height:40,borderRadius:10,background:meta.active?"#EEF2FF":"var(--surface-2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Cpu size={20} style={{color:meta.active?"#6366F1":"var(--muted)"}}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <b style={{fontSize:13}}>{m.name}</b>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:meta.active?"#ECFDF5":"var(--surface-2)",color:meta.active?"#059669":"var(--muted)"}}>
                      {meta.active?"Active":"Inactive"}
                    </span>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:6}}>
                    <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"var(--surface-2)"}}>{meta.provider}</code>
                    <code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#EEF2FF",color:"#6366F1"}}>{meta.model}</code>
                    {meta.temp!=null&&<code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#FFFBEB",color:"#D97706"}}>temp={meta.temp}</code>}
                    {meta.maxTokens&&<code style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#F5F3FF",color:"#8B5CF6"}}>max={meta.maxTokens} tokens</code>}
                  </div>
                  {meta.usage&&<div style={{fontSize:11,color:"var(--muted)"}}>{meta.usage}</div>}
                </div>
              </div>
            );})}
          </div>
        </div>
      )}

      {tab==="logs" && (
        <div className="surface">
          <div className="surface-head"><h3>Execution logs</h3><p>AI operation history and system events</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Operation</th><th>Actor</th><th>Provider</th><th>Tokens</th><th>Latency</th><th>Status</th><th>Time</th>
                    <th style={{ textAlign: "right", width: 1 }}>Actions</th></tr></thead>
              <tbody>
                {execLogs.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No execution logs yet.</td></tr>
                : execLogs.map((l:any)=>{ const m=parseMeta(l.metadataJson); return (
                  <tr key={l.id}>
                    <td><code style={{fontSize:11}}>{m.op??l.name}</code></td>
                    <td style={{fontSize:11}}>{m.actor??"—"}</td>
                    <td style={{fontSize:11}}>{m.provider??"—"}</td>
                    <td>{m.tokens??0}</td>
                    <td style={{fontSize:11}}>{m.ms??0}ms</td>
                    <td><span className={`status-pill ${m.status==="Success"?"success":"danger"}`}>{m.status??"—"}</span></td>
                    <td style={{fontSize:10,color:"var(--muted)"}}>{m.at?new Date(m.at).toLocaleString():"—"}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewItem && (
        <ViewDrawer
          title="Tenant"
          item={viewItem}
          onClose={() => setViewItem(null)}
          fields={[
            { key: "name", label: "School name", wide: true },
            { key: "domain", label: "Domain" },
            { key: "plan", label: "Plan" },
            { key: "studentCount", label: "Students" },
            { key: "status", label: "Status" },
            { key: "createdAt", label: "Created", wide: true },
          ]}
        />
      )}
    </>
  );
}
