/**
 * FloatingAiChatbot — role-aware AI assistant panel (bottom-right).
 * Features: typing indicator, message timestamps, quick questions,
 * character counter, auto-resize textarea, session clear, smooth animations.
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Send, Sparkles, X, Trash2, ChevronDown, Minimize2 } from "lucide-react";
import { useAuth } from "../../auth/auth";
import { aiApi } from "../../../core/api/smartschoolApi";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

// ── Types ────────────────────────────────────────────────────────────────────
type BotType = "student" | "teacher" | "parent" | "admissions" | "admin";

interface Msg {
  role: "user" | "ai";
  text: string;
  ts:   number;
  error?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 500;

const BOT_META: Record<BotType, { color: string; bg: string; label: string; icon: string }> = {
  student:    { color: "#2563EB", bg: "#EFF6FF", label: "Student AI",    icon: "🎓" },
  teacher:    { color: "#7C3AED", bg: "#F5F3FF", label: "Teacher AI",    icon: "📚" },
  parent:     { color: "#059669", bg: "#ECFDF5", label: "Parent AI",     icon: "👨‍👩‍👧" },
  admissions: { color: "#D97706", bg: "#FFFBEB", label: "Admissions AI", icon: "🏫" },
  admin:      { color: "#0F172A", bg: "#F8FAFC", label: "Admin AI",      icon: "⚙️" },
};

const QUICK: Record<BotType, string[]> = {
  student:    ["Help me understand this topic", "What's on my timetable?", "Check my fee status", "When is the next exam?"],
  teacher:    ["Show class performance", "Which students need attention?", "Generate a quiz", "Attendance summary"],
  parent:     ["How is my child doing?", "Check fee balance", "Transport status", "Upcoming exams"],
  admissions: ["How do I apply?", "Required documents", "Fee structure", "Admission deadlines"],
  admin:      ["Today's attendance", "Fee collection status", "Pending approvals", "Staff summary"],
};

function getBot(role: string): BotType {
  const r = role.toLowerCase();
  if (r.includes("student"))   return "student";
  if (r.includes("teacher"))   return "teacher";
  if (r.includes("parent"))    return "parent";
  if (r.includes("admission")) return "admissions";
  return "admin";
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 14px", alignItems: "center", height: 36 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--muted-2)",
          display: "inline-block",
          animation: `typing-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
        }}/>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function FloatingAiChatbot() {
  const { user }   = useAuth();
  const bot        = getBot(user?.role ?? "");
  const meta       = BOT_META[bot];
  const tenantId   = effectiveTenantId(user);
  const firstName  = user?.name?.split(" ")[0] ?? "there";

  const [open,      setOpen]      = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages,  setMessages]  = useState<Msg[]>([
    { role: "ai", text: `Hi ${firstName} ${meta.icon}\n\nI'm your ${meta.label}. Ask me anything about school — timetables, fees, attendance, or academic support.`, ts: Date.now() },
  ]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const endRef    = useRef<HTMLDivElement>(null);
  const bodyRef   = useRef<HTMLDivElement>(null);
  const textaRef  = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(scrollToBottom, 50);
      setTimeout(() => textaRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  useEffect(() => {
    if (!minimized) scrollToBottom();
  }, [messages]);

  // Show "scroll to bottom" button when scrolled up
  function handleScroll() {
    const el = bodyRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScroll(distFromBottom > 120);
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = textaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [input]);

  async function send(question?: string) {
    const text = (question ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", text, ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await aiApi.chatbot(bot, { Question: text, TenantId: tenantId });
      setMessages(m => [...m, { role: "ai", text: res.data.answer, ts: Date.now() }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "I'm having trouble connecting right now. Please try again in a moment.", ts: Date.now(), error: true }]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([{ role: "ai", text: `Hi ${firstName} ${meta.icon}\n\nSession cleared. How can I help you?`, ts: Date.now() }]);
  }

  const charsLeft  = MAX_CHARS - input.length;
  const overLimit  = charsLeft < 0;
  const canSend    = input.trim().length > 0 && !loading && !overLimit;
  const showQuick  = messages.length === 1 && !loading;

  return (
    <>
      <style>{`
        @keyframes typing-dot {
          0%, 80%, 100% { transform: scale(.7); opacity: .4; }
          40%            { transform: scale(1);  opacity: 1; }
        }
        @keyframes chat-enter {
          from { opacity: 0; transform: scale(.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)   translateY(0); }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ai-launcher { animation: none; }
        .ai-launcher:hover .ai-launcher-ring { transform: scale(1.15); }
        .ai-msg { animation: msg-in .18s ease; }
      `}</style>

      {/* ── Launcher button ─────────────────────────────────────────────── */}
      <button
        className="ai-launcher"
        onClick={() => { setOpen(o => !o); setMinimized(false); }}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        style={{
          position: "fixed", bottom: 24, right: 24,
          width: 54, height: 54, borderRadius: "50%",
          border: "none", cursor: "pointer",
          display: "grid", placeItems: "center",
          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`,
          color: "#fff",
          boxShadow: `0 4px 20px ${meta.color}55, 0 1px 4px rgba(0,0,0,.2)`,
          zIndex: 1200,
          transition: "all .2s cubic-bezier(.16,1,.3,1)",
          transform: open ? "scale(1.05)" : "scale(1)",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = open ? "scale(1.05)" : "scale(1)"}
      >
        {open ? <X size={20}/> : <Bot size={22}/>}
        {/* Pulse ring */}
        {!open && (
          <span style={{
            position: "absolute", inset: -4,
            borderRadius: "50%", border: `2px solid ${meta.color}44`,
            animation: "typing-dot 2s ease-in-out infinite",
            pointerEvents: "none",
          }}/>
        )}
      </button>

      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90, right: 24,
            width: "min(400px, calc(100vw - 32px))",
            height: minimized ? 56 : "min(560px, calc(100vh - 120px))",
            background: "var(--surface)",
            border: "1.5px solid var(--line)",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,.18), 0 4px 16px rgba(0,0,0,.08)",
            display: "flex", flexDirection: "column",
            zIndex: 1100,
            overflow: "hidden",
            transition: "height .25s cubic-bezier(.16,1,.3,1)",
            animation: "chat-enter .22s cubic-bezier(.16,1,.3,1)",
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div style={{
            padding: "12px 14px",
            background: `linear-gradient(135deg, ${meta.color}, ${meta.color}DD)`,
            display: "flex", alignItems: "center", gap: 10,
            flexShrink: 0,
          }}>
            {/* Avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: "rgba(255,255,255,.18)",
              display: "grid", placeItems: "center",
              flexShrink: 0, fontSize: 18,
            }}>
              {meta.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ fontSize: 13, color: "#fff", display: "block" }}>{meta.label}</b>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.75)", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block", boxShadow: "0 0 6px #4ADE80" }}/>
                Online · School knowledge base
              </span>
            </div>

            <div style={{ display: "flex", gap: 4 }}>
              <button
                onClick={clearChat}
                title="Clear chat"
                style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)", cursor: "pointer", display: "grid", placeItems: "center", transition: "background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
              >
                <Trash2 size={13}/>
              </button>
              <button
                onClick={() => setMinimized(m => !m)}
                title={minimized ? "Expand" : "Minimize"}
                style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)", cursor: "pointer", display: "grid", placeItems: "center", transition: "background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
              >
                <Minimize2 size={13}/>
              </button>
              <button
                onClick={() => setOpen(false)}
                title="Close"
                style={{ width: 28, height: 28, border: 0, borderRadius: 8, background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.8)", cursor: "pointer", display: "grid", placeItems: "center", transition: "background .12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.22)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.12)"}
              >
                <X size={14}/>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* ── Messages ────────────────────────────────────────── */}
              <div
                ref={bodyRef}
                onScroll={handleScroll}
                style={{
                  flex: 1, overflowY: "auto",
                  padding: "14px 12px",
                  display: "flex", flexDirection: "column", gap: 10,
                  background: "var(--surface-2)",
                }}
              >
                {messages.map((m, i) => (
                  <div key={i} className="ai-msg" style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 7,
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    {/* AI avatar */}
                    {m.role === "ai" && (
                      <div style={{
                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                        background: meta.bg, color: meta.color,
                        display: "grid", placeItems: "center", fontSize: 13,
                        border: `1px solid ${meta.color}33`,
                      }}>
                        <Sparkles size={12}/>
                      </div>
                    )}

                    {/* Bubble */}
                    <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 3, alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                      <div style={{
                        padding: "9px 13px",
                        borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                        background: m.role === "user"
                          ? `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`
                          : m.error ? "var(--danger-bg)" : "var(--surface)",
                        color: m.role === "user" ? "#fff" : m.error ? "var(--danger)" : "var(--text)",
                        fontSize: 12.5, lineHeight: 1.6,
                        boxShadow: m.role === "user"
                          ? `0 2px 12px ${meta.color}33`
                          : "var(--shadow-xs)",
                        border: m.role === "user" ? "none" : "1px solid var(--line)",
                        whiteSpace: "pre-wrap",
                      }}>
                        {m.text}
                      </div>
                      <span style={{ fontSize: 9.5, color: "var(--muted-2)" }}>
                        {fmtTime(m.ts)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="ai-msg" style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                      background: meta.bg, color: meta.color,
                      display: "grid", placeItems: "center", fontSize: 13,
                      border: `1px solid ${meta.color}33`,
                    }}>
                      <Sparkles size={12}/>
                    </div>
                    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px 16px 16px 16px", boxShadow: "var(--shadow-xs)" }}>
                      <TypingDots/>
                    </div>
                  </div>
                )}

                {/* Quick questions (only on first message) */}
                {showQuick && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                    <p style={{ fontSize: 10.5, color: "var(--muted)", margin: 0, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>
                      Suggested questions
                    </p>
                    {QUICK[bot].map(q => (
                      <button
                        key={q}
                        onClick={() => void send(q)}
                        style={{
                          padding: "8px 12px", textAlign: "left",
                          border: "1.5px solid var(--line)", borderRadius: 10,
                          background: "var(--surface)", fontSize: 11.5,
                          color: "var(--text)", cursor: "pointer",
                          transition: "all .12s", fontWeight: 500,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; e.currentTarget.style.background = meta.bg; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--surface)"; }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={endRef}/>
              </div>

              {/* Scroll to bottom button */}
              {showScroll && (
                <button
                  onClick={scrollToBottom}
                  style={{
                    position: "absolute", bottom: 76, right: 12,
                    width: 30, height: 30, borderRadius: "50%",
                    border: "1.5px solid var(--line)",
                    background: "var(--surface)", cursor: "pointer",
                    display: "grid", placeItems: "center",
                    boxShadow: "var(--shadow-md)", color: "var(--muted)",
                    zIndex: 2,
                  }}
                >
                  <ChevronDown size={15}/>
                </button>
              )}

              {/* ── Compose area ─────────────────────────────────── */}
              <div style={{
                padding: "10px 12px",
                borderTop: "1px solid var(--line)",
                background: "var(--surface)",
                flexShrink: 0, display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                  <textarea
                    ref={textaRef}
                    value={input}
                    onChange={e => { if (e.target.value.length <= MAX_CHARS + 10) setInput(e.target.value); }}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
                    placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                    rows={1}
                    style={{
                      flex: 1, resize: "none", minHeight: 38, maxHeight: 120,
                      padding: "9px 11px",
                      border: `1.5px solid ${overLimit ? "var(--danger)" : input.length > 0 ? meta.color : "var(--line)"}`,
                      borderRadius: 11,
                      background: "var(--surface-2)", color: "var(--text)",
                      fontSize: 12.5, lineHeight: 1.5,
                      transition: "border-color .15s, box-shadow .15s",
                      outline: "none",
                      boxShadow: input.length > 0 && !overLimit ? `0 0 0 3px ${meta.color}18` : "none",
                    }}
                    onFocus={e => { e.currentTarget.style.boxShadow = `0 0 0 3px ${meta.color}20`; }}
                    onBlur={e => { e.currentTarget.style.boxShadow = "none"; }}
                  />
                  <button
                    onClick={() => void send()}
                    disabled={!canSend}
                    title="Send (Enter)"
                    style={{
                      width: 38, height: 38,
                      border: "none", borderRadius: 11,
                      background: canSend ? `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` : "var(--surface-3)",
                      color: canSend ? "#fff" : "var(--muted-2)",
                      cursor: canSend ? "pointer" : "not-allowed",
                      display: "grid", placeItems: "center", flexShrink: 0,
                      transition: "all .15s",
                      boxShadow: canSend ? `0 2px 10px ${meta.color}44` : "none",
                    }}
                  >
                    <Send size={15}/>
                  </button>
                </div>

                {/* Character counter */}
                {input.length > MAX_CHARS * 0.7 && (
                  <div style={{ textAlign: "right", fontSize: 10.5, color: overLimit ? "var(--danger)" : "var(--muted-2)", fontWeight: overLimit ? 700 : 400 }}>
                    {overLimit ? `${Math.abs(charsLeft)} characters over limit` : `${charsLeft} characters remaining`}
                  </div>
                )}

                {/* Powered by */}
                <div style={{ textAlign: "center", fontSize: 9.5, color: "var(--muted-2)" }}>
                  Powered by SmartSchool AI · responses may vary
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
