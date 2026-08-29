import { useState } from "react";
import { ArrowRight, Bot, RefreshCcw, Send, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth }    from "../../auth/auth";
import { predictions } from "../../../mocks/data";

function getRoleTitle(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("student"))   return "AI Tutor";
  if (r.includes("teacher"))   return "Teacher AI Assistant";
  if (r.includes("parent"))    return "Parent AI";
  if (r.includes("principal")) return "Principal AI";
  if (r.includes("driver"))    return "Transport AI";
  if (r.includes("superadmin")) return "Platform AI";
  return "SmartSchool AI";
}

export function AiPage() {
  const { user } = useAuth();
  const title  = getRoleTitle(user?.role ?? "");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy]     = useState(false);

  async function ask() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: `You are SmartSchool AI. The user is a ${title}. Be clear, concise (under 150 words), and use bullet points where helpful. School context: Pakistani school system, multi-tenant SaaS, AY 2025-26.`,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      setAnswer(data.content?.map((b: any) => b.text ?? "").join("") ?? "I couldn't complete that. Please try again.");
    } catch {
      setAnswer("Connection error. Please check your network and try again.");
    } finally {
      setBusy(false);
    }
  }

  const quickQs: Record<string, string[]> = {
    "AI Tutor": ["Help me study for my Physics quiz","Create a study plan for History","Explain quadratic equations"],
    "Teacher AI Assistant": ["Which students need attention?","Generate Chapter 5 quiz questions","Lesson plan for next week"],
    "Parent AI": ["How is my child doing?","What subjects need attention?","Tips for learning at home"],
    default: ["School performance overview","Dropout risk students","Fee collection status","AI model accuracy"],
  };
  const qs = quickQs[title] ?? quickQs.default;

  return (
    <>
      <PageHeader title={title} subtitle="Powered by Claude · SmartSchool Intelligence" />

      <div className="ai-workspace">
        <div className="surface ai-chat-card">
          <div className="ai-hero">
            <div className="ai-orb"><Sparkles size={20} /></div>
            <div>
              <span className="eyebrow">SmartSchool Intelligence</span>
              <h2>{title}</h2>
              <p>Ask me anything about your school data, analytics, students, or operational queries.</p>
            </div>
          </div>

          {/* Quick questions */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
            {qs.map(q => (
              <button
                key={q}
                className="soft-button"
                style={{ fontSize: 11 }}
                onClick={() => { setPrompt(q); }}
              >
                {q} <ArrowRight size={11} />
              </button>
            ))}
          </div>

          <div className="ai-prompt-box">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={`Ask ${title} anything…`}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) ask(); }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button className="soft-button" style={{ fontSize: 11 }} onClick={() => { setPrompt(""); setAnswer(null); }}>
                <RefreshCcw size={13} /> Clear
              </button>
              <button className="primary" onClick={ask} disabled={busy || !prompt.trim()}>
                {busy ? "Thinking…" : <><Send size={14} /> Ask AI</>}
              </button>
            </div>
          </div>

          {answer && (
            <div className="ai-answer" style={{ marginTop: 16 }}>
              <div className="ai-answer-head">
                <span><Bot size={16} /> <b>AI Response</b></span>
                <span className="context-badge"><Sparkles size={11} /> Claude Sonnet</span>
              </div>
              <p style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.75 }}>{answer}</p>
            </div>
          )}
        </div>

        {/* Prediction panel */}
        <div className="surface" style={{ padding: 18, alignSelf: "start" }}>
          <div className="surface-head" style={{ padding: 0, marginBottom: 14 }}>
            <h3>AI Predictions</h3>
            <p>Student risk analysis</p>
          </div>
          {predictions.map((p, i) => (
            <div
              key={i}
              className="pred-card"
              style={{
                background: p.level==="high"?"#FFF0F1":p.level==="medium"?"#FFFBEB":"#ECFDF5",
                border: `1px solid ${p.level==="high"?"#fecdd3":p.level==="medium"?"#fde68a":"#a7f3d0"}`,
              }}
            >
              <div className="pred-icon" style={{ background: p.level==="high"?"#FFF0F1":p.level==="medium"?"#FFFBEB":"#ECFDF5" }}>
                <span style={{ fontSize: 18 }}>{p.level==="high"?"🚨":p.level==="medium"?"⚠️":"✅"}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="pred-label" style={{ color: p.level==="high"?"var(--danger)":p.level==="medium"?"var(--warning)":"var(--success)" }}>
                  {p.riskType}
                </span>
                <div className="pred-name" style={{ fontSize: 12 }}>{p.student}</div>
                <div className="pred-detail">{p.class}</div>
              </div>
              <div className="pred-score">
                <b style={{ color: p.level==="high"?"var(--danger)":p.level==="medium"?"var(--warning)":"var(--success)", fontSize: 16 }}>{p.score}%</b>
                <span>risk</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
