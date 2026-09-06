/**
 * AiConfigTab — School AI & RAG configuration
 * Tabs: Knowledge Base · Model Config · Chatbot Personas · Settings
 * All calls go through apiAdapter → real API when useMocks=false
 */
import { useState, useRef } from "react";
import { parseMeta, toItems } from "../../../../core/utils/dataHelpers";
import {
  Brain, Plus, X, Upload, Trash2, RefreshCw,
  FileText, Database, Settings, Bot, CheckCircle, Clock, AlertCircle,
} from "lucide-react";
  useKnowledgeCollections, useCreateKnowledgeCollection,
  useKnowledgeDocuments, useUploadKnowledgeDocument,
  useDeleteKnowledgeDocument, useTriggerReindex,
  useModelConfigs, useUpdateModelConfig, useCreateModelConfig,
  useAiSettings, useUpdateAiSettings,
} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { RowActions } from "../../../../components/ui/RowActions";
import { Pagination } from "../../../../components/ui/Pagination";

type AiTab = "knowledge" | "models" | "personas" | "settings";

const STATUS_ICON: Record<string, React.ReactNode> = {
  READY:      <CheckCircle size={12} style={{ color:"var(--success)" }}/>,
  PROCESSING: <Clock       size={12} style={{ color:"var(--warning)" }}/>,
  INDEXING:   <RefreshCw   size={12} style={{ color:"var(--indigo)",  animation:"spin 1s linear infinite" }}/>,
  ERROR:      <AlertCircle size={12} style={{ color:"var(--danger)"  }}/>,
};

const CHATBOT_PERSONAS = [
  { role:"student",    label:"Student AI",     desc:"Study assistant — answers from academic and policy knowledge only." },
  { role:"teacher",    label:"Teacher AI",     desc:"Lesson planning, class management and approved school policy." },
  { role:"parent",     label:"Parent AI",      desc:"School info for parents — no access to other students' data." },
  { role:"admissions", label:"Admissions AI",  desc:"Admissions questions from approved school knowledge." },
  { role:"admin",      label:"Admin AI",       desc:"Operational and policy knowledge for administrators." },
];

const PROVIDERS = ["OpenAI","Azure OpenAI","Anthropic","Google Gemini","Custom / Self-hosted"];
const PURPOSES  = ["CHAT","EMBEDDING","COMPLETION","VISION"];

// ── Knowledge Base sub-tab ─────────────────────────────────────────────────────
function KnowledgeTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const { data: collData, isLoading } = useKnowledgeCollections();
  const createColl  = useCreateKnowledgeCollection();
  const uploadDoc   = useUploadKnowledgeDocument();
  const deleteDoc   = useDeleteKnowledgeDocument();
  const reindex     = useTriggerReindex();

  const collections: any[] = toItems(collData);

  const [selected, setSelected] = useState<any|null>(null);
  const [collModal, setCollModal] = useState(false);
  const [form, setForm]  = useState({ name:"", slug:"", description:"" });
  const [error, setError] = useState("");
  const [page, setPage]   = useState(1);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: docsData } = useKnowledgeDocuments(selected?.id);
  const docs: any[] = toItems(docsData);

  async function saveCollection() {
    if (!form.name) { setError("Name required"); return; }
    await createColl.mutateAsync({
      tenantId: tid, name: form.name,
      metadataJson: JSON.stringify({
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g,"-"),
        description: form.description, documentCount:0, chunkCount:0, isActive:true,
      }),
    });
    setCollModal(false); setForm({ name:"", slug:"", description:"" }); setError("");
  }

  async function handleUpload(file: File) {
    if (!selected) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tenantId", tid);
    fd.append("collectionId", selected.id);
    fd.append("fileName", file.name);
    try { await uploadDoc.mutateAsync({ collectionId: selected.id, formData: fd }); }
    finally { setUploading(false); }
  }

  return (
    <div style={{ display:"flex", gap:16, height:"calc(100vh - 260px)", minHeight:400 }}>
      {/* Left: collection list */}
      <div className="surface" style={{ width:280, flexShrink:0, display:"flex", flexDirection:"column" }}>
        <div className="surface-head">
          <div><h3 style={{ fontSize:13 }}>Collections</h3><p>RAG knowledge bases</p></div>
          <button className="primary" style={{ padding:"0 10px", height:30, fontSize:11 }}
            onClick={() => setCollModal(true)}>
            <Plus size={12}/> New
          </button>
        </div>
        <div style={{ flex:1, overflowY:"auto" }}>
          {isLoading ? <div style={{ padding:16, color:"var(--muted)", fontSize:12 }}>Loading…</div>
          : collections.length === 0 ? <div style={{ padding:16, color:"var(--muted)", fontSize:12 }}>No collections yet.</div>
          : collections.map((c:any) => {
            const meta = parseMeta(c.metadataJson);
            return (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{
                  padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid var(--line)",
                  background: selected?.id===c.id ? "var(--indigo-soft)" : "",
                  borderLeft: selected?.id===c.id ? "3px solid var(--indigo)" : "3px solid transparent",
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <Database size={12} style={{ color:"var(--indigo)" }}/>
                  <b style={{ fontSize:12 }}>{c.name}</b>
                </div>
                <div style={{ fontSize:10, color:"var(--muted)" }}>
                  {meta.documentCount ?? 0} docs · {meta.chunkCount ?? 0} chunks
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: documents in selected collection */}
      <div className="surface" style={{ flex:1, display:"flex", flexDirection:"column" }}>
        {!selected ? (
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", flexDirection:"column", gap:12 }}>
            <Database size={36} style={{ opacity:.2 }}/>
            <p>Select a collection to view and upload documents</p>
          </div>
        ) : (
          <>
            <div className="surface-head">
              <div>
                <h3 style={{ fontSize:13 }}>{selected.name}</h3>
                <p>{parseMeta(selected.metadataJson).description || "Knowledge collection"}</p>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="secondary" style={{ fontSize:11, height:30, padding:"0 12px", display:"flex", alignItems:"center", gap:5 }}
                  onClick={() => reindex.mutate(selected.id)} disabled={reindex.isPending}>
                  <RefreshCw size={12} style={{ animation: reindex.isPending ? "spin 1s linear infinite":undefined }}/> Re-index
                </button>
                <button className="primary" style={{ fontSize:11, height:30, padding:"0 12px", display:"flex", alignItems:"center", gap:5 }}
                  onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload size={12}/> {uploading ? "Uploading…" : "Upload document"}
                </button>
                <input ref={fileRef} type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.pptx"
                  style={{ display:"none" }}
                  onChange={e => { const f=e.target.files?.[0]; if(f) handleUpload(f); e.target.value=""; }}
                />
              </div>
            </div>

            <div style={{ padding:"8px 16px", background:"var(--surface-2)", fontSize:11, color:"var(--muted)", borderBottom:"1px solid var(--line)" }}>
              Supported: PDF, Word (.docx), Text, Markdown, CSV, Excel, PowerPoint
            </div>

            <div className="table-wrap" style={{ flex:1 }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Chunks</th>
                    <th>Status</th>
                    <th style={{ textAlign:"right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                        <FileText size={32} style={{ opacity:.2 }}/>
                        <b>No documents yet</b>
                        <p style={{ fontSize:12 }}>Upload PDF, Word, or text files to build this knowledge base</p>
                      </div>
                    </td></tr>
                  ) : docs.map((doc:any) => {
                    const meta = parseMeta(doc.metadataJson);
                    const status = meta.status ?? "READY";
                    return (
                      <tr key={doc.id}>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <FileText size={14} style={{ color:"var(--muted)", flexShrink:0 }}/>
                            <div>
                              <b style={{ fontSize:12 }}>{doc.name ?? meta.fileName}</b>
                              {meta.uploadedAt && <div style={{ fontSize:10, color:"var(--muted)" }}>{new Date(meta.uploadedAt).toLocaleDateString()}</div>}
                            </div>
                          </div>
                        </td>
                        <td><code style={{ fontSize:10 }}>{meta.fileType ?? "—"}</code></td>
                        <td style={{ fontSize:12 }}>{meta.fileSizeKb ? `${meta.fileSizeKb} KB` : "—"}</td>
                        <td style={{ textAlign:"center" }}>{meta.chunkCount ?? "—"}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                            {STATUS_ICON[status] ?? STATUS_ICON.READY}
                            {status}
                          </div>
                        </td>
                        <td style={{ textAlign:"right" }}>
                          <RowActions
                            onDelete={() => deleteDoc.mutate(doc.id)}
                            deleteLabel="document"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={20} total={docs.length} onPage={setPage} label="documents"/>
          </>
        )}
      </div>

      {/* Create collection modal */}
      {collModal && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setCollModal(false); }}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head">
              <h2>New knowledge collection</h2>
              <button className="icon-button" onClick={() => setCollModal(false)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Collection name *</span>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. School Handbook 2026"/>
              </label>
              <label className="human-field field-wide"><span>Slug (auto if blank)</span>
                <input value={form.slug} onChange={e => setForm(p=>({...p,slug:e.target.value}))} placeholder="school-handbook-2026"/>
              </label>
              <label className="human-field field-wide"><span>Description</span>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  style={{ minHeight:64 }} placeholder="What knowledge does this collection contain?"/>
              </label>
            </div>
            {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setCollModal(false)}>Cancel</button>
              <button className="primary" onClick={saveCollection} disabled={createColl.isPending}>
                {createColl.isPending ? "Creating…" : "Create collection"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Model Config sub-tab ───────────────────────────────────────────────────────
function ModelsTab() {
  const { data: modelsData, isLoading } = useModelConfigs();
  const updateModel = useUpdateModelConfig();
  const createModel = useCreateModelConfig();
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  const models: any[] = toItems(modelsData);
  const [editItem, setEditItem] = useState<any|null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", provider:"OpenAI", modelId:"", apiKey:"", endpoint:"", purpose:"CHAT", isDefault:false });
  const [saving, setSaving] = useState(false);

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({...p,[k]:e.target.value}));

  async function save() {
    setSaving(true);
    try {
      const body = { ...form, tenantId: tid };
      if (editItem) await updateModel.mutateAsync({ id: editItem.id, body });
      else          await createModel.mutateAsync(body);
      setModal(false); setEditItem(null);
    } finally { setSaving(false); }
  }

  return (
    <div className="surface">
      <div className="surface-head">
        <div><h3>AI Model configuration</h3><p>Connect LLM providers for chat, embeddings, and completions</p></div>
        <button className="primary" onClick={() => { setEditItem(null); setForm({ name:"", provider:"OpenAI", modelId:"", apiKey:"", endpoint:"", purpose:"CHAT", isDefault:false }); setModal(true); }}>
          <Plus size={14}/> Add model
        </button>
      </div>
      {isLoading ? <div style={{ padding:20, color:"var(--muted)" }}>Loading…</div> : (
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Name</th><th>Provider</th><th>Model ID</th><th>Purpose</th><th>Default</th><th style={{ textAlign:"right" }}>Actions</th></tr>
            </thead>
            <tbody>
              {models.length===0 ? (
                <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>
                  No models configured. Add an OpenAI or Azure connection.
                </td></tr>
              ) : models.map((m:any) => {
                const meta = parseMeta(m.metadataJson);
                return (
                  <tr key={m.id}>
                    <td><b style={{ fontSize:13 }}>{m.name}</b></td>
                    <td><span className="status-pill info" style={{ fontSize:10 }}>{meta.provider ?? m.provider ?? "—"}</span></td>
                    <td><code style={{ fontSize:11 }}>{meta.modelId ?? m.modelId ?? "—"}</code></td>
                    <td><span className="status-pill gray" style={{ fontSize:10 }}>{meta.purpose ?? m.purpose ?? "CHAT"}</span></td>
                    <td style={{ textAlign:"center" }}>
                      {(meta.isDefault ?? m.isDefault) ? <span className="status-pill success" style={{ fontSize:9 }}>DEFAULT</span> : "—"}
                    </td>
                    <td style={{ textAlign:"right" }}>
                      <RowActions
                        onEdit={() => { setEditItem(m); setForm({ name:m.name, provider:meta.provider??"OpenAI", modelId:meta.modelId??"", apiKey:"", endpoint:meta.endpoint??"", purpose:meta.purpose??"CHAT", isDefault:meta.isDefault??false }); setModal(true); }}
                        deleteLabel="model config"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget){setModal(false);setEditItem(null);} }}>
          <div className="modal-card" style={{ width:"min(560px,96vw)" }}>
            <div className="modal-head">
              <h2>{editItem ? "Edit model" : "Add AI model"}</h2>
              <button className="icon-button" onClick={() => { setModal(false); setEditItem(null); }}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span>
                <input value={form.name} onChange={sf("name")} placeholder="e.g. GPT-4o Production"/>
              </label>
              <label className="human-field"><span>Provider</span>
                <select value={form.provider} onChange={sf("provider")}>
                  {PROVIDERS.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Purpose</span>
                <select value={form.purpose} onChange={sf("purpose")}>
                  {PURPOSES.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Model ID / deployment name</span>
                <input value={form.modelId} onChange={sf("modelId")} placeholder="e.g. gpt-4o, claude-3-5-sonnet-20241022"/>
              </label>
              <label className="human-field field-wide"><span>API Key {editItem && "(leave blank to keep existing)"}</span>
                <input type="password" value={form.apiKey} onChange={sf("apiKey")} placeholder="sk-…"/>
              </label>
              {(form.provider.includes("Azure") || form.provider.includes("Custom")) && (
                <label className="human-field field-wide"><span>Endpoint URL</span>
                  <input value={form.endpoint} onChange={sf("endpoint")} placeholder="https://your-resource.openai.azure.com"/>
                </label>
              )}
              <label className="human-field" style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p=>({...p,isDefault:e.target.checked}))} style={{ width:15, height:15 }}/>
                <span>Set as default for this purpose</span>
              </label>
            </div></div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => { setModal(false); setEditItem(null); }}>Cancel</button>
              <button className="primary" onClick={save} disabled={saving || !form.name || !form.modelId}>
                {saving ? "Saving…" : editItem ? "Save changes" : "Add model"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Personas sub-tab ───────────────────────────────────────────────────────────
function PersonasTab() {
  const [editItem, setEditItem] = useState<any|null>(null);
  const [form, setForm] = useState({ label:"", system:"", collections:"" });

  return (
    <div className="surface">
      <div className="surface-head">
        <div><h3>Chatbot personas</h3><p>System prompts and knowledge scope per actor role</p></div>
      </div>
      {CHATBOT_PERSONAS.map(p => (
        <div key={p.role} style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20, padding:"16px 20px", borderBottom:"1px solid var(--surface-3)" }}>
          <div style={{ display:"flex", gap:12, flex:1, minWidth:0 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--indigo-soft)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Bot size={16} style={{ color:"var(--indigo)" }}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                <b style={{ fontSize:13 }}>{p.label}</b>
                <code style={{ fontSize:10, padding:"2px 6px", background:"var(--surface-2)", borderRadius:4 }}>{p.role}</code>
              </div>
              <p style={{ fontSize:12, color:"var(--muted)", margin:0, lineHeight:1.6 }}>{p.desc}</p>
            </div>
          </div>
          <button className="table-action" style={{ fontSize:10, flexShrink:0 }}
            onClick={() => { setEditItem(p); setForm({ label:p.label, system:p.desc, collections:"" }); }}>
            Edit persona
          </button>
        </div>
      ))}

      {editItem && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setEditItem(null); }}>
          <div className="modal-card" style={{ width:"min(560px,96vw)" }}>
            <div className="modal-head">
              <h2>Edit persona — {editItem.label}</h2>
              <button className="icon-button" onClick={() => setEditItem(null)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Display label</span>
                <input value={form.label} onChange={e => setForm(p=>({...p,label:e.target.value}))}/>
              </label>
              <label className="human-field field-wide"><span>System prompt</span>
                <textarea value={form.system} onChange={e => setForm(p=>({...p,system:e.target.value}))} style={{ minHeight:120 }} placeholder="Describe the AI's role and constraints…"/>
              </label>
              <label className="human-field field-wide"><span>Knowledge collections (comma-separated slugs)</span>
                <input value={form.collections} onChange={e => setForm(p=>({...p,collections:e.target.value}))} placeholder="academic, policy, fees"/>
              </label>
            </div></div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setEditItem(null)}>Cancel</button>
              <button className="primary" onClick={() => setEditItem(null)}>Save persona</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AI Settings sub-tab ────────────────────────────────────────────────────────
function AiSettingsTab() {
  const { data: settingsData } = useAiSettings();
  const updateSettings = useUpdateAiSettings();
  const settings: any = settingsData ?? {};
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<Record<string,boolean>>({});

  const TOGGLES = [
    { key:"ragEnabled",           label:"RAG Knowledge Assistant",   desc:"Enable the document-backed AI chatbot for all actor roles" },
    { key:"tutorEnabled",         label:"AI Tutor",                  desc:"Student-facing AI tutor with subject-specific guidance" },
    { key:"quizEnabled",          label:"AI Quiz Generator",         desc:"Auto-generate practice quizzes from topics" },
    { key:"predictionsEnabled",   label:"Predictive Analytics",      desc:"ML risk predictions (dropout, attendance, fee default)" },
    { key:"parentChatbotEnabled", label:"Parent Chatbot",            desc:"Parents can ask AI about their child's attendance, fees and results" },
  ];

  function get(k: string) { return local[k] ?? settings[k] ?? true; }
  function toggle(k: string) { setLocal(p => ({...p,[k]:!get(k)})); }

  async function save() {
    setSaving(true);
    try { await updateSettings.mutateAsync({ ...settings, ...local }); }
    finally { setSaving(false); }
  }

  return (
    <div className="surface">
      <div className="surface-head">
        <div><h3>AI feature settings</h3><p>Enable or disable AI capabilities school-wide</p></div>
        <button className="primary" onClick={save} disabled={saving} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Settings size={13}/> {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
      {TOGGLES.map(t => (
        <div key={t.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, padding:"14px 20px", borderBottom:"1px solid var(--surface-3)" }}>
          <div>
            <b style={{ fontSize:13 }}>{t.label}</b>
            <p style={{ margin:"3px 0 0", fontSize:12, color:"var(--muted)" }}>{t.desc}</p>
          </div>
          <button onClick={() => toggle(t.key)} style={{
            width:44, height:24, borderRadius:12, border:"none", cursor:"pointer", flexShrink:0,
            background: get(t.key) ? "var(--success)" : "var(--line-2)", position:"relative", transition:"background .2s",
          }}>
            <div style={{
              width:18, height:18, borderRadius:"50%", background:"#fff", position:"absolute",
              top:3, left: get(t.key) ? 23 : 3, transition:"left .2s", boxShadow:"0 1px 3px rgba(0,0,0,.2)",
            }}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Main AiConfigTab ───────────────────────────────────────────────────────────
export function AiConfigTab() {
  const [tab, setTab] = useState<AiTab>("knowledge");

  const TABS = [
    { key:"knowledge" as AiTab, label:"📚 Knowledge base",    desc:"Upload and manage RAG documents" },
    { key:"models"    as AiTab, label:"🤖 Model config",      desc:"LLM provider connections" },
    { key:"personas"  as AiTab, label:"💬 Chatbot personas",  desc:"Role-specific system prompts" },
    { key:"settings"  as AiTab, label:"⚙️ AI settings",       desc:"Enable/disable features" },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div className="section-tabs" style={{ marginBottom:4, flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t.key} className={tab===t.key?"active":""} onClick={() => setTab(t.key)}
            title={t.desc}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="knowledge" && <KnowledgeTab/>}
      {tab==="models"    && <ModelsTab/>}
      {tab==="personas"  && <PersonasTab/>}
      {tab==="settings"  && <AiSettingsTab/>}
    </div>
  );
}
