import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "../../auth/auth";
import { aiApi } from "../../../core/api/smartschoolApi";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type BotType = "student"|"teacher"|"parent"|"admissions"|"admin";

function getBotForRole(role: string): BotType {
  const r = role.toLowerCase();
  if (r.includes("student"))   return "student";
  if (r.includes("teacher"))   return "teacher";
  if (r.includes("parent"))    return "parent";
  if (r.includes("admission")) return "admissions";
  return "admin";
}

const QUICK_QUESTIONS: Record<BotType, string[]> = {
  student:    ["Help me understand this topic","What's on my timetable?","Check my fee status"],
  teacher:    ["Show class performance","Which students need help?","Generate a quiz"],
  parent:     ["How is my child doing?","Check fee balance","Transport status"],
  admissions: ["How do I apply?","What documents are needed?","Fee structure"],
  admin:      ["Today's attendance","Fee collection status","Pending approvals"],
};

interface Msg { role: "user"|"ai"; text: string; }

export function FloatingAiChatbot() {
  const { user } = useAuth();
  const bot = getBotForRole(user?.role ?? "");
  const tenantId = effectiveTenantId(user);

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role:"ai", text:`Hi ${user?.name?.split(" ")[0] ?? "there"} 👋 I'm your SmartSchool AI assistant. How can I help?` },
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, open]);

  async function send(question?: string) {
    const text = (question ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setMessages(m => [...m, { role:"user", text }]);
    setLoading(true);
    try {
      const res = await aiApi.chatbot(bot, { Question: text, TenantId:  tenantId });
      setMessages(m => [...m, { role:"ai", text: res.data.answer }]);
    } catch {
      setMessages(m => [...m, { role:"ai", text:"I'm having trouble connecting. Please try again." }]);
    } finally { setLoading(false); }
  }

  const quickQs = QUICK_QUESTIONS[bot];

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:"fixed", bottom:24, right:24, width:52, height:52,
          borderRadius:"50%", background:"var(--fill-primary)", color:"#fff",
          border:"none", cursor:"pointer", display:"grid", placeItems:"center",
          boxShadow:"0 4px 16px rgba(0,0,0,.18)", zIndex:1000,
          transition:"transform .15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.transform="scale(1.07)")}
        onMouseLeave={e => (e.currentTarget.style.transform="scale(1)")}
        aria-label="Open AI assistant"
      >
        {open ? <X size={20}/> : <Bot size={20}/>}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="floating-ai-panel"
          style={{
            position:"fixed", bottom:90, right:24, width:"min(380px,calc(100vw - 32px))",
            background:"var(--surface-2)", border:"0.5px solid var(--border)",
            borderRadius:16, boxShadow:"0 8px 32px rgba(0,0,0,.16)",
            display:"flex", flexDirection:"column", height:480, zIndex:1000,
            overflow:"hidden",
          }}
        >
          {/* Header */}
          <div style={{ padding:"12px 16px", borderBottom:"0.5px solid var(--border)", display:"flex", alignItems:"center", gap:10, background:"var(--surface-1)" }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"var(--bg-accent)", color:"var(--text-accent)", display:"grid", placeItems:"center" }}>
              <Sparkles size={16}/>
            </div>
            <div style={{ flex:1 }}>
              <b style={{ fontSize:13 }}>SmartSchool AI</b>
              <div style={{ fontSize:10, color:"var(--text-success)", display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"currentColor", display:"inline-block" }}/>
                Online · School knowledge base
              </div>
            </div>
            <button className="icon-button" onClick={() => setOpen(false)} style={{ width:28, height:28 }}><X size={15}/></button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:8 }}>
            {messages.map((m, i) => (
              <div key={i} className={`floating-ai-message ${m.role === "user" ? "user" : ""}`}>
                {m.role === "ai" && (
                  <span className="mini-ai-avatar" style={{ background:"var(--bg-accent)", color:"var(--text-accent)" }}>
                    <Sparkles size={11}/>
                  </span>
                )}
                <div className="floating-ai-bubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="floating-ai-message">
                <span className="mini-ai-avatar" style={{ background:"var(--bg-accent)", color:"var(--text-accent)" }}><Sparkles size={11}/></span>
                <div className="floating-ai-bubble" style={{ color:"var(--text-muted)" }}>Thinking…</div>
              </div>
            )}
            {messages.length === 1 && (
              <div style={{ display:"flex", flexDirection:"column", gap:5, marginTop:4 }}>
                {quickQs.map(q => (
                  <button key={q} onClick={() => void send(q)} style={{ padding:"6px 10px", border:"0.5px solid var(--border)", borderRadius:"var(--radius)", background:"var(--surface-1)", fontSize:11, textAlign:"left", cursor:"pointer", color:"var(--text-primary)" }}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {/* Compose */}
          <div className="floating-ai-compose" style={{ padding:10, borderTop:"0.5px solid var(--border)", background:"var(--surface-1)" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything…"
              rows={1}
              style={{ flex:1, resize:"none", border:"0.5px solid var(--border)", borderRadius:"var(--radius)", padding:"8px 10px", fontSize:12, background:"var(--surface-2)", color:"var(--text-primary)", fontFamily:"var(--font-sans)" }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
            />
            <button
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              className="primary"
              style={{ width:36, height:36, padding:0, display:"grid", placeItems:"center", flexShrink:0 }}
            >
              <Send size={14}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
