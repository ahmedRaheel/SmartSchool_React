import { useMemo, useRef, useEffect, useState } from "react";
import { Bot, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type Msg = { id: string; role: "ai" | "user"; text: string; loading?: boolean };

const ROLE_CONFIG: Record<string, { title: string; welcome: string; qs: string[] }> = {
  student:    { title: "AI Tutor", welcome: "Hi! I'm your AI Tutor. Ask me anything about your subjects, assignments or study plans.", qs: ["Help me study for my Physics quiz", "Create a revision plan for History", "Explain quadratic equations", "What assignments are due this week"] },
  teacher:    { title: "Teacher AI Assistant", welcome: "Hello! I'm your Teacher AI Assistant. I can help with lesson plans, grading analysis and student insights.", qs: ["Which students need extra help?", "Generate quiz questions for Chapter 5", "Create a lesson plan for next week", "Show me class performance trends"] },
  parent:     { title: "Parent AI", welcome: "Welcome! I'm your Parent AI. I can share insights about your children's progress and answer school queries.", qs: ["How is my child performing?", "What subjects need attention?", "Tips for learning at home", "When is the next PT meeting?"] },
  principal:  { title: "Principal AI", welcome: "Hello Principal. I can provide academic analysis, staff insights, and school performance summaries.", qs: ["Which departments need attention?", "Show dropout risk overview", "Staff performance summary", "Compare this term vs last term"] },
  admin:      { title: "Admin AI Assistant", welcome: "Hi! I'm your Admin Assistant. Ask about fees, attendance, admissions, or daily operations.", qs: ["How many fee defaulters this month?", "Today's absent students summary", "Pending admission applications", "Transport issues today"] },
  driver:     { title: "Transport AI", welcome: "Hello! I can help with route optimisation, student schedules and traffic updates.", qs: ["Optimise my route for today", "Which students are absent today?", "School dismissal time today", "Traffic alert on my route"] },
  superadmin: { title: "Platform AI", welcome: "Welcome to Platform AI. I can help with tenant analytics, system health, and platform operations.", qs: ["Which tenants are at risk?", "Platform usage this month", "API error patterns", "Revenue trends this quarter"] },
  tenant:     { title: "School AI", welcome: "Hello! I can provide school-level analytics, fee insights and academic summaries.", qs: ["School performance overview", "Fee collection status", "Top performing students", "Departments needing attention"] },
  system:     { title: "System AI", welcome: "System AI ready. Monitor predictions, integrations, and AI model performance.", qs: ["AI model accuracy this week", "Prediction batch status", "Integration health check", "Error log summary"] },
};

function getRoleKey(role: string): string {
  const r = role.toLowerCase();
  if (r.includes("student"))   return "student";
  if (r.includes("teacher"))   return "teacher";
  if (r.includes("parent") || r.includes("guardian")) return "parent";
  if (r.includes("principal")) return "principal";
  if (r.includes("driver"))    return "driver";
  if (r.includes("superadmin")) return "superadmin";
  if (r.includes("system"))   return "system";
  if (r.includes("admin") || r.includes("office")) return "admin";
  return "tenant";
}

function collectionsFor(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes("student"))  return ["learning", "academic", "policy"];
  if (r.includes("teacher"))  return ["learning", "academic", "policy", "operations"];
  if (r.includes("parent"))   return ["academic", "policy"];
  return ["operations", "academic", "policy", "admissions"];
}

export function FloatingAiChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roleKey = useMemo(() => getRoleKey(user?.role ?? ""), [user?.role]);
  const cfg     = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.tenant;

  const [messages, setMessages] = useState<Msg[]>([
    { id: "welcome", role: "ai", text: cfg.welcome },
  ]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  if (!user) return null;

  async function sendMessage(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || busy) return;

    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };
    const loadingMsg: Msg = { id: crypto.randomUUID(), role: "ai", text: "", loading: true };
    setMessages(m => [...m, userMsg, loadingMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: `You are SmartSchool AI embedded in a school management platform. The user is a ${cfg.title}. Be concise (under 100 words), warm and practical. Use bullet points for lists. School context: multi-tenant SaaS, Pakistani school system, academic year 2025-26.`,
          messages: [{ role: "user", content: text }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.map((b: any) => b.text ?? "").join("") || "I couldn't complete that request. Please try again.";
      setMessages(m => [...m.filter(x => !x.loading), { id: crypto.randomUUID(), role: "ai", text: reply }]);
    } catch {
      setMessages(m => [...m.filter(x => !x.loading), { id: crypto.randomUUID(), role: "ai", text: "Connection issue. Please check your network and try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {open && (
        <section className="floating-ai-panel" aria-label={cfg.title}>
          <header className="floating-ai-header">
            <span className="floating-ai-avatar"><Sparkles size={18} /></span>
            <div>
              <b>{cfg.title}</b>
              <small><span className="ai-online-dot" /> Online · Claude Sonnet</small>
            </div>
            <button className="floating-ai-close" onClick={() => setOpen(false)}><X size={16} /></button>
          </header>

          <div className="floating-ai-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`floating-ai-message ${msg.role === "user" ? "user" : ""}`}>
                {msg.role === "ai" && (
                  <span className="mini-ai-avatar"><Sparkles size={12} /></span>
                )}
                <div className="floating-ai-bubble">
                  {msg.loading ? <span style={{ color: "var(--muted)" }}>Thinking…</span> : msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions (shown only when just 1 message) */}
          {messages.length <= 1 && (
            <div style={{ padding: "6px 12px", borderTop: "1px solid var(--line)" }}>
              {cfg.qs.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 7, background: "var(--surface-2)", fontSize: 11, cursor: "pointer", marginBottom: 5, color: "var(--text)" }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="floating-ai-footer">
            <button className="floating-ai-workspace" onClick={() => { setOpen(false); navigate("/ai"); }}>
              <ExternalLink size={12} /> Open full AI workspace
            </button>
            <div className="floating-ai-compose">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={`Ask ${cfg.title}…`}
                rows={1}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
              />
              <button onClick={() => void sendMessage()} disabled={busy || !input.trim()}>
                <Send size={15} />
              </button>
            </div>
            <small className="floating-ai-disclaimer">AI responses are scoped to your role and tenant.</small>
          </div>
        </section>
      )}

      <button
        className={`floating-ai-launcher ${open ? "active" : ""}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Open SmartSchool AI chatbot"
      >
        {open ? <X size={20} /> : <><Bot size={20} /> <span>{cfg.title}</span></>}
      </button>
    </>
  );
}
