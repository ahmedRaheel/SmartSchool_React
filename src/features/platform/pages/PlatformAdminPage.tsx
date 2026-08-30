import { useState } from "react";
import { Brain, Database, Plus, X, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useModelConfigs, useCreateModelConfig, useKnowledgeCollections, useCreateKnowledgeCollection, useExecutionLogs } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function PlatformAdminPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"models"|"rag"|"logs">("models");
  const [modelModal, setModelModal] = useState(false);
  const [collModal,  setCollModal]  = useState(false);
  const [modelForm,  setModelForm]  = useState({ name:"", provider:"Ollama", modelIdentifier:"llama3.2", temperature:"0.2", maxTokens:"4096" });
  const [collForm,   setCollForm]   = useState({ name:"", slug:"", description:"" });
  const [error, setError] = useState("");

  const { data: modelData, isLoading: mLoad } = useModelConfigs();
  const { data: collData,  isLoading: cLoad } = useKnowledgeCollections();
  const { data: logData,   isLoading: lLoad } = useExecutionLogs();
  const createModel = useCreateModelConfig();
  const createColl  = useCreateKnowledgeCollection();

  const models = (modelData as any)?.items ?? (modelData as any) ?? [];
  const colls  = (collData  as any)?.items ?? (collData  as any) ?? [];
  const logs   = (logData   as any)?.items ?? (logData   as any) ?? [];

  async function saveModel() {
    if (!modelForm.name || !modelForm.modelIdentifier) { setError("Name and model ID required"); return; }
    try {
      await createModel.mutateAsync({ tenantId:tid, name:modelForm.name, metadataJson:JSON.stringify({ provider:modelForm.provider, modelIdentifier:modelForm.modelIdentifier, temperature:Number(modelForm.temperature), maxTokens:Number(modelForm.maxTokens), isActive:true }) });
      setModelModal(false); setModelForm({ name:"", provider:"Ollama", modelIdentifier:"llama3.2", temperature:"0.2", maxTokens:"4096" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveColl() {
    if (!collForm.name) { setError("Name required"); return; }
    try {
      await createColl.mutateAsync({ tenantId:tid, name:collForm.name, metadataJson:JSON.stringify({ slug:collForm.slug||collForm.name.toLowerCase().replace(/\s+/g,"-"), description:collForm.description, documentCount:0, chunkCount:0, isActive:true }) });
      setCollModal(false); setCollForm({ name:"", slug:"", description:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="AI Platform Admin" subtitle="Model configurations, knowledge base and AI execution logs"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Model configs"  value={String(models.length)} note="" color="#8B5CF6" bg="#F5F3FF"><Brain size={20}/></StatCard>
        <StatCard label="RAG collections"value={String(colls.length)}  note="" color="#2563EB" bg="#EFF6FF"><Database size={20}/></StatCard>
        <StatCard label="AI log entries" value={String(logs.length)}   note="Recent"          color="#10B981" bg="#ECFDF5"><Zap size={20}/></StatCard>
        <StatCard label="AI errors"      value={String(logs.filter((l:any)=>parseMeta(l.metadataJson).status==="Failure").length)} note="" color="#EF4444" bg="#FFF0F1"><Zap size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="models"?"active":""} onClick={()=>setTab("models")}>🤖 Model configs</button>
        <button className={tab==="rag"?"active":""}    onClick={()=>setTab("rag")}>📚 Knowledge base</button>
        <button className={tab==="logs"?"active":""}   onClick={()=>setTab("logs")}>⚡ Exec logs</button>
      </div>

      {tab === "models" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>AI model configurations</h3><p>Connected LLM providers and models</p></div>
            <button className="primary" onClick={()=>{setModelModal(true);setError("");}}><Plus size={14}/> Add model</button>
          </div>
          {mLoad ? <div style={{ padding:30, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Name</th><th>Code</th><th>Provider</th><th>Model ID</th><th>Temp.</th><th>Max tokens</th><th>Status</th></tr></thead>
                <tbody>
                  {models.length===0?<tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>No model configs yet.</td></tr>
                  :models.map((m:any)=>{
                    const meta=parseMeta(m.metadataJson);
                    return <tr key={m.id}><td><b>{m.name}</b></td><td><code style={{fontSize:11}}>{m.code}</code></td><td>{meta.provider??"-"}</td><td><code style={{fontSize:11}}>{meta.modelIdentifier??"-"}</code></td><td>{meta.temperature??"-"}</td><td>{meta.maxTokens??"-"}</td><td><span className={`status-pill ${meta.isActive?"success":"gray"}`}>{meta.isActive?"Active":"Inactive"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "rag" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Knowledge collections</h3><p>RAG knowledge base for AI chatbots and tutoring</p></div>
            <button className="primary" onClick={()=>{setCollModal(true);setError("");}}><Plus size={14}/> New collection</button>
          </div>
          {cLoad ? <div style={{ padding:30, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Collection</th><th>Slug</th><th>Docs</th><th>Chunks</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {colls.length===0?<tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>No collections yet.</td></tr>
                  :colls.map((c:any)=>{
                    const meta=parseMeta(c.metadataJson);
                    return <tr key={c.id}><td><b>{c.name}</b><div style={{fontSize:10,color:"var(--muted)"}}>{meta.description?.slice(0,40)}</div></td><td><code style={{fontSize:11}}>{meta.slug??c.code}</code></td><td>{meta.documentCount??0}</td><td>{meta.chunkCount??0}</td><td><span className={`status-pill ${meta.isActive!==false?"success":"gray"}`}>{meta.isActive!==false?"Active":"Inactive"}</span></td><td><div className="row-actions"><button className="table-action" style={{fontSize:10}}>Upload</button><button className="table-action" style={{fontSize:10}}>Index</button></div></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "logs" && (
        <div className="surface">
          <div className="surface-head"><h3>AI execution logs</h3><p>Real-time AI activity log (auto-refreshes)</p></div>
          {lLoad ? <div style={{ padding:30, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Operation</th><th>Actor</th><th>Provider</th><th>Tokens</th><th>Duration</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {logs.length===0?<tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--muted)" }}>No logs yet.</td></tr>
                  :logs.map((l:any)=>{
                    const meta=parseMeta(l.metadataJson);
                    return <tr key={l.id}><td><b style={{fontSize:11}}>{meta.operation??l.name}</b></td><td>{meta.actor??"-"}</td><td>{meta.provider??"-"}</td><td>{meta.tokenCount??0}</td><td>{meta.durationMs??0}ms</td><td style={{fontSize:10,color:"var(--muted)"}}>{meta.createdAt?new Date(meta.createdAt).toLocaleString():"-"}</td><td><span className={`status-pill ${meta.status==="Success"?"success":"danger"}`} style={{fontSize:9}}>{meta.status??"-"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add model modal */}
      {modelModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModelModal(false)}}>
          <div className="modal-card" style={{ width:"min(520px,96vw)" }}>
            <div className="modal-head"><h2>Add AI model config</h2><button className="icon-button" onClick={()=>setModelModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Config name *</span><input value={modelForm.name} onChange={e=>setModelForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Llama 3.2 (Ollama)"/></label>
              <label className="human-field"><span>Provider</span>
                <select value={modelForm.provider} onChange={e=>setModelForm(p=>({...p,provider:e.target.value}))}>
                  <option value="Ollama">Ollama</option><option value="OpenAI">OpenAI</option><option value="Anthropic">Anthropic</option><option value="Gemini">Gemini</option>
                </select>
              </label>
              <label className="human-field"><span>Model identifier *</span><input value={modelForm.modelIdentifier} onChange={e=>setModelForm(p=>({...p,modelIdentifier:e.target.value}))} placeholder="e.g. llama3.2"/></label>
              <label className="human-field"><span>Temperature</span><input type="number" step="0.1" min="0" max="2" value={modelForm.temperature} onChange={e=>setModelForm(p=>({...p,temperature:e.target.value}))}/></label>
              <label className="human-field"><span>Max tokens</span><input type="number" value={modelForm.maxTokens} onChange={e=>setModelForm(p=>({...p,maxTokens:e.target.value}))}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setModelModal(false)}>Cancel</button>
              <button className="primary" onClick={saveModel} disabled={createModel.isPending}>{createModel.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add collection modal */}
      {collModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setCollModal(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>New knowledge collection</h2><button className="icon-button" onClick={()=>setCollModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={collForm.name} onChange={e=>setCollForm(p=>({...p,name:e.target.value}))} placeholder="e.g. School Handbook 2026"/></label>
              <label className="human-field field-wide"><span>Slug</span><input value={collForm.slug} onChange={e=>setCollForm(p=>({...p,slug:e.target.value}))} placeholder="e.g. handbook-2026 (auto-generated if blank)"/></label>
              <label className="human-field field-wide"><span>Description</span><input value={collForm.description} onChange={e=>setCollForm(p=>({...p,description:e.target.value}))}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setCollModal(false)}>Cancel</button>
              <button className="primary" onClick={saveColl} disabled={createColl.isPending}>{createColl.isPending?"Creating…":"Create"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
