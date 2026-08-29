import { useState } from "react";
import { ArrowRight, Bot, RefreshCcw, Send, Sparkles } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../auth/auth";
import { predictions } from "../../../mocks/data";

function getRoleTitle(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("student"))    return "AI Tutor";
  if (r.includes("teacher"))    return "Teacher AI Assistant";
  if (r.includes("parent"))     return "Parent AI";
  if (r.includes("principal"))  return "Principal AI";
  if (r.includes("driver"))     return "Transport AI";
  if (r.includes("superadmin")) return "Platform AI";
  return "SmartSchool AI";
}

const QUICK_QUESTIONS: Record<string, string[]> = {
  "AI Tutor": [
    "Help me study for my Physics quiz",
    "Create a study plan for History",
    "Explain quadratic equations step by step",
  ],
  "Teacher AI Assistant": [
    "Which students need extra help?",
    "Generate Chapter 5 quiz questions",
    "Create a lesson plan for next week",
  ],
  "Parent AI": [
    "How is my child performing?",
    "What subjects need attention?",
    "Tips for supporting learning at home",
  ],
  default: [
    "School performance overview",
    "Which students are at dropout risk?",
    "Fee collection status this month",
  ],
};

export function AiPage() {
  const { user } = useAuth();
  const title = getRoleTitle(user?.role ?? "");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const qs = QUICK_QUESTIONS[title] ?? QUICK_QUESTIONS.default;

  async function ask() {
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    setAnswer(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: `You are SmartSchool AI. The user is a ${title}. Be clear and concise (under 150 words). Use bullet points where helpful. Context: Pakistani school system, multi-tenant SaaS, AY 2025-26.`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      setAnswer(
        data.content?.map((b: { text?: string }) => b.text ?? "").join("") ??
        "I could not complete that. Please try again."
      );
    } catch {
      setAnswer("Connection error. Please check your network and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle="Powered by Claude · SmartSchool Intelligence"
      />

      <div className="ai-workspace">
        {/* Chat panel */}
        <div className="surface ai-chat-card">
          <div className="ai-hero">
            <div className="ai-orb"><Sparkles size={20} /></div>
            <div>
              <span className="eyebrow">SmartSchool Intelligence</span>
              <h2>{title}</h2>
              <p>Ask me anything about your school data, analytics, students or operational queries.</p>
            </div>
          </div>

          {/* Quick questions */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
            {qs.map(q => (
              <button
                key={q}
                className="soft-button"
                style={{ fontSize: 11 }}
                onClick={() => setPrompt(q)}
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
              onKeyDown={e => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void ask();
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button
                className="soft-button"
                style={{ fontSize: 11 }}
                onClick={() => { setPrompt(""); setAnswer(null); }}
              >
                <RefreshCcw size={13} /> Clear
              </button>
              <button className="primary" onClick={() => void ask()} disabled={busy || !prompt.trim()}>
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

        {/* Predictions sidebar */}
        <div className="surface" style={{ padding: 18, alignSelf: "start" }}>
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>AI Predictions</h3>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Student risk analysis</p>
          </div>
          {predictions.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex", gap: 12, alignItems: "center",
                padding: "12px 14px", borderRadius: 12, marginBottom: 8,
                background:
                  p.level === "high"   ? "#FFF0F1" :
                  p.level === "medium" ? "#FFFBEB" : "#ECFDF5",
                border: `1px solid ${
                  p.level === "high"   ? "#fecdd3" :
                  p.level === "medium" ? "#fde68a" : "#a7f3d0"
                }`,
              }}
            >
              <span style={{ fontSize: 20 }}>
                {p.level === "high" ? "🚨" : p.level === "medium" ? "⚠️" : "✅"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: .7,
                  color: p.level === "high" ? "var(--danger)" : p.level === "medium" ? "var(--warning)" : "var(--success)",
                  marginBottom: 2,
                }}>
                  {p.riskType}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{p.student}</div>
                <div style={{ fontSize: 10, color: "var(--muted)" }}>{p.class}</div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <b style={{
                  fontSize: 16, fontWeight: 800, display: "block",
                  color: p.level === "high" ? "var(--danger)" : p.level === "medium" ? "var(--warning)" : "var(--success)",
                }}>
                  {p.score}%
                </b>
                <span style={{ fontSize: 9, color: "var(--muted)" }}>risk</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
