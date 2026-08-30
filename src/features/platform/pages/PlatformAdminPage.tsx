import { useState } from "react";
import { Plus, RefreshCcw, Upload, X } from "lucide-react";
import { PageHeader }  from "../../../components/ui/PageHeader";
import { StatCard }    from "../../../components/ui/StatCard";
import {
  useModelConfigs, useKnowledgeCollections, useExecutionLogs,
} from "../../../core/api/queries";
import { aiCoreApi } from "../../../core/api/smartschoolApi";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Tab = "overview"|"models"|"rag"|"tutor"|"logs";

const TABS: { key: Tab; label: string }[] = [
  { key:"overview", label:"AI overview"       },
  { key:"models",   label:"Model config"      },
  { key:"rag",      label:"Knowledge / RAG"   },
  { key:"tutor",    label:"AI Tutor analytics"},
  { key:"logs",     label:"Request logs"      },
];

export function PlatformAdminPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const qc = useQueryClient();
  const [tab, setTab]       = useState<Tab>("overview");
  const [collOpen, setCollOpen] = useState(false);
  const [collName, setCollName] = useState("");
  const [collDesc, setCollDesc] = useState("");
  const [saving, setSaving]     = useState(false);
  const [indexing, setIndexing] = useState(false);

  const { data: modelData,  isLoading: mLoading } = useModelConfigs();
  const { data: collData,   isLoading: cLoading } = useKnowledgeCollections();
  const { data: logData,    isLoading: lLoading } = useExecutionLogs();

  const models  = (modelData as any)?.items  ?? (modelData as any)?.value?.items  ?? [];
  const colls   = (collData  as any)?.items  ?? (collData  as any)?.value?.items  ?? [];
  const logs    = (logData   as any)?.items  ?? (logData   as any)?.value?.items  ?? [];

  async function createCollection() {
    if (!collName.trim()) return;
    setSaving(true);
    try {
      await aiCoreApi.createCollection({ tenantId, name: collName.trim(), description: collDesc.trim() });
      setCollOpen(false); setCollName(""); setCollDesc("");
      void qc.invalidateQueries({ queryKey: ["rag-collections", tenantId] });
    } finally { setSaving(false); }
  }

  async function triggerIndex(collectionId: string) {
    setIndexing(true);
    try {
      await aiCoreApi.indexKnowledge({ tenantId, collectionId });
      alert("Indexing job queued successfully.");
    } catch {
      alert("Indexing failed. Check logs.");
    } finally { setIndexing(false); }
  }

  const LOG_STATUS: Record<string,string> = { Success:"success", Failure:"danger", Error:"danger", Pending:"warning" };

  return (
    <>
      <PageHeader
        title="AI Platform Management"
        subtitle="ai_core · ai · ai_tutor — schema monitoring, models and knowledge base"
      />

      <section className="metric-grid" style={{ marginBottom:16 }}>
        <StatCard label="AI requests today"    value="14,821" note="↑ 23% vs yesterday" color="#8B5CF6" bg="#F5F3FF"><span style={{fontSize:20}}>🤖</span></StatCard>
        <StatCard label="Avg latency"          value="1.8 s"  note="Within SLA"         color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>⚡</span></StatCard>
        <StatCard label="Active tutor sessions"value="47"     note="Live now"           color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📚</span></StatCard>
        <StatCard label="Prediction accuracy"  value="91.4%"  note="Dropout model"      color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>🎯</span></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "overview" && (
        <div className="grid-2">
          <div className="surface">
            <div className="surface-head"><h3>Schema status</h3><p>All three AI schemas</p></div>
            <div style={{ padding:"0 20px 20px" }}>
              {[
                { schema:"ai_core",  tables:9, desc:"RAG, chatbots, inquiry AI, parent AI, execution logs" },
                { schema:"ai",       tables:8, desc:"Predictions, interventions, learning recommendations" },
                { schema:"ai_tutor", tables:7, desc:"Tutor sessions, mastery tracking, quizzes" },
              ].map(s => (
                <div key={s.schema} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:"0.5px solid var(--border)" }}>
                  <div>
                    <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:500, color:"var(--text-accent)" }}>{s.schema}</div>
                    <div style={{ fontSize:11, color:"var(--text-secondary)", marginTop:2 }}>{s.desc}</div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span className="status-pill success">Healthy</span>
                    <div style={{ fontSize:10, color:"var(--text-muted)", marginTop:3 }}>{s.tables} tables</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="surface">
            <div className="surface-head"><h3>Latest AI requests</h3></div>
            <div style={{ padding:"0 18px 16px" }}>
              {lLoading ? <div style={{ color:"var(--text-muted)", fontSize:12 }}>Loading…</div> :
                logs.slice(0, 6).map((l: any, i: number) => (
                  <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"0.5px solid var(--border)", fontSize:11 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:500 }}>{l.actor ?? l.actorType ?? "Unknown"} · {l.operation ?? l.requestType ?? "—"}</div>
                      <div style={{ color:"var(--text-muted)", marginTop:2 }}>{l.tokenCount ?? "—"} tokens · {l.durationMs ?? "—"}ms</div>
                    </div>
                    <span className={`status-pill ${LOG_STATUS[l.status ?? "Success"] ?? "gray"}`}>{l.status ?? "OK"}</span>
                  </div>
                ))
              }
              {!lLoading && logs.length === 0 && <div style={{ color:"var(--text-muted)", fontSize:12 }}>No logs yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Model Config ── */}
      {tab === "models" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Model configuration</h3><p>ai_core.model_configuration — provider, model and parameters per tenant</p></div>
            <button className="primary"><Plus size={14}/> Add config</button>
          </div>
          {mLoading ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading model configs…</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Name</th><th>Provider</th><th>Model</th><th>Temperature</th><th>Max tokens</th><th>Status</th></tr></thead>
                <tbody>
                  {models.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No model configurations found.</td></tr>
                    : models.map((m: any) => (
                        <tr key={m.modelConfigurationId ?? m.id}>
                          <td><b>{m.name ?? "—"}</b></td>
                          <td><code style={{ fontSize:11 }}>{m.provider ?? "—"}</code></td>
                          <td><code style={{ fontSize:11 }}>{m.modelIdentifier ?? m.model ?? "—"}</code></td>
                          <td>{m.temperature ?? "—"}</td>
                          <td>{m.maxTokens ?? "—"}</td>
                          <td><span className={`status-pill ${m.isActive !== false ? "success" : "gray"}`}>{m.isActive !== false ? "Active" : "Inactive"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RAG Collections ── */}
      {tab === "rag" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Knowledge collections</h3><p>ai_core.knowledge_collection + ai_core.knowledge_document — school RAG knowledge base</p></div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="secondary" onClick={() => void qc.invalidateQueries({ queryKey: ["rag-collections", tenantId] })}>
                <RefreshCcw size={13}/> Refresh
              </button>
              <button className="primary" onClick={() => setCollOpen(true)}><Plus size={14}/> New collection</button>
            </div>
          </div>
          {cLoading ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading collections…</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Collection</th><th>Slug</th><th>Documents</th><th>Chunks</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {colls.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No knowledge collections yet. Create one to enable AI context.</td></tr>
                    : colls.map((c: any) => (
                        <tr key={c.knowledgeCollectionId ?? c.id}>
                          <td><b>{c.name ?? "—"}</b><small style={{ display:"block", color:"var(--text-muted)", fontSize:10 }}>{c.description?.slice(0,60)}</small></td>
                          <td><code style={{ fontSize:11 }}>{c.slug ?? c.collectionSlug ?? "—"}</code></td>
                          <td>{c.documentCount ?? "—"}</td>
                          <td>{c.chunkCount ?? "—"}</td>
                          <td><span className={`status-pill ${c.isActive !== false ? "success" : "gray"}`}>{c.isActive !== false ? "Active" : "Inactive"}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="table-action"><Upload size={12}/> Upload doc</button>
                              <button className="table-action" disabled={indexing} onClick={() => void triggerIndex(c.knowledgeCollectionId ?? c.id)}>Index</button>
                            </div>
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── AI Tutor Analytics ── */}
      {tab === "tutor" && (
        <div className="surface">
          <div className="surface-head"><div><h3>AI Tutor analytics</h3><p>ai_tutor.tutor_session + mastery_tracker across all tenants</p></div></div>
          <div style={{ padding:20 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
              {[
                { label:"Total sessions",  value:"4,821" },
                { label:"Avg session time",value:"28 min" },
                { label:"Avg mastery gain",value:"12.4%"  },
                { label:"Quizzes generated",value:"14,291"},
              ].map(s => (
                <div key={s.label} style={{ padding:"14px 16px", border:"0.5px solid var(--border)", borderRadius:12, background:"var(--surface-1)" }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:22, fontWeight:500 }}>{s.value}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize:12, color:"var(--text-secondary)" }}>
              ai_tutor.session_analytics are persisted per session. Mastery tracker records subject × topic competency per student.
              Generated quizzes are stored in ai_tutor.generated_quiz with attempt history in ai_tutor.quiz_attempt.
              Learning recommendations flow from ai_tutor.learning_recommendation → student dashboard.
            </p>
          </div>
        </div>
      )}

      {/* ── Request Logs ── */}
      {tab === "logs" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>AI execution logs</h3><p>ai_core.ai_execution_log — all AI API calls across platform</p></div>
            <button className="secondary" onClick={() => void qc.invalidateQueries({ queryKey: ["exec-logs", tenantId] })}>
              <RefreshCcw size={13}/> Refresh
            </button>
          </div>
          {lLoading ? (
            <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading logs…</div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Time</th><th>Actor type</th><th>Operation</th><th>Provider</th><th>Tokens</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {logs.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No execution logs found.</td></tr>
                    : logs.map((l: any, i: number) => (
                        <tr key={l.aiExecutionLogId ?? i}>
                          <td><code style={{ fontSize:11 }}>{l.createdAt ? new Date(l.createdAt).toLocaleTimeString() : "—"}</code></td>
                          <td>{l.actor ?? l.actorType ?? "—"}</td>
                          <td><code style={{ fontSize:11 }}>{l.operation ?? l.requestType ?? "—"}</code></td>
                          <td>{l.provider ?? "—"}</td>
                          <td>{l.tokenCount ?? "—"}</td>
                          <td>{l.durationMs ? `${l.durationMs}ms` : "—"}</td>
                          <td><span className={`status-pill ${LOG_STATUS[l.status ?? "Success"] ?? "gray"}`}>{l.status ?? "OK"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New Collection Modal */}
      {collOpen && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setCollOpen(false); }}>
          <div className="modal-card" style={{ width:"min(500px,96vw)" }}>
            <div className="modal-head">
              <h2>New knowledge collection</h2>
              <button className="icon-button" onClick={() => setCollOpen(false)}><X size={18}/></button>
            </div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Collection name *</span><input value={collName} onChange={e => setCollName(e.target.value)} placeholder="e.g. School Handbook 2026"/></label>
                <label className="human-field field-wide"><span>Description</span><textarea value={collDesc} onChange={e => setCollDesc(e.target.value)} style={{ minHeight:72 }} placeholder="What knowledge is in this collection…"/></label>
              </div>
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setCollOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => void createCollection()} disabled={saving || !collName.trim()}>{saving ? "Creating…" : "Create collection"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
