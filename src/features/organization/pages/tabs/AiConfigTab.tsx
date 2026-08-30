import { useState } from "react";
import { Brain, Plus, X } from "lucide-react";
import { useKnowledgeCollections, useCreateKnowledgeCollection } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

const CHATBOT_ROLES = [
  { role:"student",    label:"Student AI",     system:"You are a helpful study assistant for students. Use only verified school knowledge.", collections:["academic","policy","learning"] },
  { role:"teacher",    label:"Teacher AI",     system:"You assist teachers with lesson planning, class management and approved school policy.", collections:["academic","teacher","policy"] },
  { role:"parent",     label:"Parent AI",      system:"You assist parents with school information without exposing other students' data.", collections:["parent","policy","fees","academic"] },
  { role:"admissions", label:"Admissions AI",  system:"You answer admissions questions only from approved school knowledge.", collections:["admissions","fees","policy"] },
  { role:"admin",      label:"Admin AI",       system:"You assist administrators using operational and policy knowledge.", collections:["operations","policy","academic","fees","hr"] },
];

export function AiConfigTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data: collections, isLoading } = useKnowledgeCollections();
  const createCollection = useCreateKnowledgeCollection();

  const [collModal, setCollModal] = useState(false);
  const [form, setForm] = useState({ name:"", description:"", slug:"" });
  const [error, setError] = useState("");

  const items = (collections as any)?.items ?? (collections as any) ?? [];

  async function saveCollection() {
    if (!form.name) { setError("Name required"); return; }
    try {
      await createCollection.mutateAsync({
        tenantId: tid,
        name: form.name,
        metadataJson: JSON.stringify({ slug: form.slug || form.name.toLowerCase().replace(/\s+/g,"-"), description: form.description, documentCount:0, chunkCount:0, isActive:true }),
      });
      setCollModal(false); setForm({ name:"", description:"", slug:"" }); setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Chatbot personas */}
      <div className="surface">
        <div className="surface-head"><div><h3>Chatbot personas</h3><p>System prompts and knowledge collections per actor role</p></div></div>
        <div style={{ padding:"0 20px 20px" }}>
          {CHATBOT_ROLES.map(r => (
            <div key={r.role} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", padding:"14px 0", borderBottom:"1px solid var(--surface-2)", gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:6 }}>
                  <Brain size={14} style={{ color:"var(--navy)" }}/>
                  <b style={{ fontSize:13 }}>{r.label}</b>
                  <code style={{ fontSize:10, padding:"2px 6px", background:"var(--surface-2)", borderRadius:4 }}>{r.role}</code>
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6, lineHeight:1.55 }}>{r.system}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {r.collections.map(c => (
                    <span key={c} style={{ padding:"2px 8px", borderRadius:5, background:"#EEF2FF", color:"#3730a3", fontSize:10, fontWeight:500 }}>{c}</span>
                  ))}
                </div>
              </div>
              <button className="table-action" style={{ fontSize:10, flexShrink:0 }}>Edit persona</button>
            </div>
          ))}
        </div>
      </div>

      {/* Knowledge Collections */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Knowledge collections</h3><p>RAG knowledge base — documents indexed for school AI context</p></div>
          <button className="primary" onClick={() => { setCollModal(true); setError(""); setForm({ name:"", description:"", slug:"" }); }}><Plus size={14}/> New collection</button>
        </div>
        {isLoading ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Collection</th><th>Slug</th><th>Documents</th><th>Chunks</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {items.length===0
                  ? <tr><td colSpan={6} style={{ textAlign:"center", padding:24, color:"var(--muted)" }}>No collections yet. Create your first knowledge base.</td></tr>
                  : items.map((c: any) => {
                    let meta: any = {};
                    try { meta = JSON.parse(c.metadataJson ?? "{}"); } catch {}
                    return (
                      <tr key={c.id}>
                        <td><b>{c.name}</b><div style={{fontSize:10,color:"var(--muted)"}}>{meta.description?.slice(0,50)}</div></td>
                        <td><code style={{fontSize:11}}>{meta.slug ?? c.code}</code></td>
                        <td>{meta.documentCount ?? 0}</td>
                        <td>{meta.chunkCount ?? 0}</td>
                        <td><span className={`status-pill ${meta.isActive!==false?"success":"gray"}`}>{meta.isActive!==false?"Active":"Inactive"}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="table-action" style={{fontSize:10}}>Upload doc</button>
                            <button className="table-action" style={{fontSize:10}}>Index</button>
                          </div>
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

      {collModal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setCollModal(false); }}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>New knowledge collection</h2><button className="icon-button" onClick={()=>setCollModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. School Handbook 2026"/></label>
              <label className="human-field field-wide"><span>Slug (auto-generated if blank)</span><input value={form.slug} onChange={e=>setForm(p=>({...p,slug:e.target.value}))} placeholder="e.g. handbook-2026"/></label>
              <label className="human-field field-wide"><span>Description</span><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{minHeight:64}} placeholder="What knowledge does this collection contain?"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setCollModal(false)}>Cancel</button>
              <button className="primary" onClick={saveCollection} disabled={createCollection.isPending}>{createCollection.isPending?"Creating…":"Create collection"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
