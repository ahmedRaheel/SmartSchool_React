import { useState } from "react";
import { Bot, Database, Send, Sparkles, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useUi } from "../../../components/ui/InteractiveUi";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";

type Citation = { id: string; documentName?: string; name?: string; collection?: string; score: number };
type Answer = { answer: string; citations?: Citation[]; model?: string; contextSource?: "cag" | "rag" | string; contextVersion?: string };

/** SmartSchool governed AI workspace backed by CAG, RAG and Ollama. */
export function AiPage() {
  const { user } = useAuth(); const { notify } = useUi();
  const [question, setQuestion] = useState(""); const [result, setResult] = useState<Answer | null>(null); const [busy, setBusy] = useState(false);

  async function ask(): Promise<void> {
    const prompt = question.trim(); if (!prompt || !user) return;
    setBusy(true);
    try {
      const { data } = await api.post<Answer>("/api/aicore/execute", {
        tenantId: effectiveTenantId(user), assistant: user.role || "SmartSchool Assistant", prompt,
        collections: collectionsFor(user.role), schoolId: user.schoolId, actorId: user.id,
      }, { timeout: 180_000 });
      setResult(data); notify({ kind: "success", title: "AI response ready", message: data.contextSource === "cag" ? "Answered from the authorized context cache." : "Knowledge was retrieved and grounded before answering." });
    } catch (error) { setResult(null); notify({ kind: "error", title: "AI request failed", message: getErrorMessage(error) }); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="SmartSchool AI" subtitle="Role-aware assistant using cached authorized context with pgvector retrieval fallback" />
    <div className="ai-workspace">
      <section className="surface ai-chat-card"><div className="ai-hero"><span className="ai-orb"><Bot size={22}/></span><div><span className="eyebrow">CAG-first intelligence</span><h2>How can I help, {user?.name?.split(" ")[0]}?</h2><p>Your tenant, role and school scope are applied before context reaches the model.</p></div></div>
        <div className="ai-prompt-box"><textarea value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void ask(); } }} placeholder="Ask about learning, policy, operations, fees, attendance, results or school knowledge…"/><button className="primary" disabled={busy || !question.trim()} onClick={() => void ask()}><Send size={16}/>{busy ? "Thinking…" : "Ask SmartSchool"}</button></div>
        {result && <div className="ai-answer"><div className="ai-answer-head"><span><Sparkles size={16}/> Answer</span><span className={`context-badge ${result.contextSource ?? "rag"}`}><Zap size={13}/>{(result.contextSource ?? "RAG").toUpperCase()}</span></div><p>{result.answer}</p>{result.citations?.length ? <div className="citation-list"><b><Database size={14}/> Grounded sources</b>{result.citations.map((item,index) => <div key={item.id}><span>{index + 1}</span><div><b>{item.documentName ?? item.name ?? "Knowledge source"}</b><small>{item.collection ? `${item.collection} • ` : ""}{Math.round(item.score * 100)}% relevance</small></div></div>)}</div> : null}</div>}
      </section>
      <aside className="surface ai-trust-card"><span className="eyebrow">Governance</span><h3>Context protection</h3><div><b>Tenant isolated</b><span>Knowledge is scoped to your active tenant.</span></div><div><b>Actor aware</b><span>Student, parent, teacher and administrator boundaries are preserved.</span></div><div><b>Cache optimized</b><span>Redis CAG is used first; pgvector RAG refreshes missing or stale context.</span></div><div><b>Auditable</b><span>AI execution and context source are recorded by the backend.</span></div></aside>
    </div>
  </>;
}

function collectionsFor(role: string): string[] {
  const value = role.toLowerCase();
  if (value.includes("student")) return ["learning", "academic", "policy"];
  if (value.includes("teacher")) return ["learning", "academic", "policy", "operations"];
  if (value.includes("parent")) return ["academic", "policy"];
  if (value.includes("admin")) return ["operations", "academic", "policy", "admissions"];
  return ["learning", "academic", "policy"];
}
