/**
 * AiPage — Production AI Intelligence Centre
 * RAG with real document upload · AI Tutor sessions · Adaptive Quiz · 
 * Predictions · Agent · Knowledge base management with chunking
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  BookMarked, Brain, Cpu, Layers, Send, Sparkles, TrendingUp,
  Settings, RefreshCw, Plus, FileText, Upload, X, CheckCircle2,
  AlertTriangle, Zap, ChevronRight, Bot, BarChart3, Info,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useAskAssistant, useStartTutorSession, useAskTutor, useGenerateQuiz,
  useStudentPrediction, useEarlyWarning, useModelConfigs, useCollections,
  useExecLogs, useCreateCollection, useIndexKnowledge,
} from "../../../core/api/queries";
import * as A from "../../../core/api/apiAdapter";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type AiTab = "assistant" | "tutor" | "quiz" | "prediction" | "agent" | "knowledge";

interface ChatMsg { id: string; role: "user" | "assistant" | "system"; content: string; citations?: any[]; ts: Date; }

const parseMeta = (j?: string | null) => { try { return JSON.parse(j ?? "{}"); } catch { return {}; } }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const SUBJECTS = ["Mathematics","Physics","Chemistry","English","Computer Science","Biology","Urdu","History","Islamiyat","Pakistan Studies","Economics"];
const DIFFICULTIES = ["easy","medium","hard","adaptive"];
const PRED_KINDS = [
  { value: "dropout-risk",     label: "Dropout risk",       color: "#DC2626", icon: "⚠️", desc: "Probability of dropping out this term" },
  { value: "grade-prediction", label: "Grade prediction",   color: "#2563EB", icon: "📊", desc: "Expected final grade based on current performance" },
  { value: "attendance-risk",  label: "Attendance risk",    color: "#D97706", icon: "📅", desc: "Likelihood of attendance falling below 75%" },
  { value: "fee-default",      label: "Fee default risk",   color: "#9333EA", icon: "💰", desc: "Probability of fee payment default" },
];
const RISK_BG: Record<string, string> = { Low: "#ECFDF5", Medium: "#FFFBEB", High: "#FEF2F2", Critical: "#FEF2F2" };
const RISK_COLOR: Record<string, string> = { Low: "#059669", Medium: "#D97706", High: "#DC2626", Critical: "#7F1D1D" };

// ─── Shared chat message component ────────────────────────────────────────────
function Bubble({ m }: { m: ChatMsg }) {
  const isUser = m.role === "user";
  const isSys  = m.role === "system";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: isSys ? "var(--surface-3)" : "linear-gradient(135deg,var(--indigo),#818CF8)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 4 }}>
          {isSys ? <Info size={14} color="var(--muted)" /> : <Bot size={14} color="white" />}
        </div>
      )}
      <div style={{ maxWidth: "76%", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ padding: "10px 14px", borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: isUser ? "var(--indigo)" : isSys ? "var(--surface-2)" : "var(--surface)", color: isUser ? "white" : "var(--text)", fontSize: 13, lineHeight: 1.65, border: isUser ? "none" : "1px solid var(--line)", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
          {m.content}
        </div>
        {m.citations && m.citations.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {m.citations.slice(0, 3).map((c: any, i: number) => (
              <div key={i} style={{ fontSize: 10, padding: "4px 10px", background: "#EFF6FF", borderRadius: 6, border: "1px solid #BFDBFE", color: "#1D4ED8", display: "flex", gap: 6, alignItems: "center" }}>
                <FileText size={9} style={{ flexShrink: 0 }} />
                <span style={{ fontWeight: 700 }}>{c.documentTitle}</span>
                {c.relevanceScore && <span style={{ color: "#60A5FA" }}>{Math.round(c.relevanceScore * 100)}%</span>}
                {c.excerpt && <span style={{ color: "#3B82F6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.excerpt.slice(0, 60)}…</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ fontSize: 9, color: "var(--muted-2)", paddingLeft: 4 }}>
          {m.ts.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

function TypingDots({ color = "#6366F1" }: { color?: string }) {
  return (
    <div style={{ display: "flex", gap: 5, padding: "4px 2px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: color, animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
      ))}
      <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.8);opacity:.5}40%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

function ChatInput({ onSend, loading, placeholder, accentColor = "var(--indigo)" }: { onSend: (m: string) => void; loading: boolean; placeholder: string; accentColor?: string }) {
  const [val, setVal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  function send() { const t = val.trim(); if (!t || loading) return; onSend(t); setVal(""); if (textareaRef.current) textareaRef.current.style.height = "40px"; }
  function onKey(e: React.KeyboardEvent) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }
  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setVal(e.target.value);
    const ta = e.target; ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }
  return (
    <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", background: "var(--surface)", display: "flex", gap: 8, alignItems: "flex-end" }}>
      <textarea ref={textareaRef} value={val} onChange={onInput} onKeyDown={onKey} placeholder={placeholder} rows={1}
        style={{ flex: 1, height: 40, maxHeight: 120, padding: "10px 14px", border: "1.5px solid var(--line)", borderRadius: 12, background: "var(--surface-2)", fontSize: 13, resize: "none", outline: "none", lineHeight: 1.5, transition: "border-color .15s" }}
        onFocus={e => e.target.style.borderColor = accentColor}
        onBlur={e => e.target.style.borderColor = "var(--line)"}
      />
      <button onClick={send} disabled={!val.trim() || loading}
        style={{ width: 40, height: 40, borderRadius: 10, border: "none", background: val.trim() && !loading ? accentColor : "var(--surface-2)", color: val.trim() && !loading ? "white" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: val.trim() && !loading ? "pointer" : "default", transition: "all .14s" }}>
        {loading ? <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function useChatScroll(messages: ChatMsg[]) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  return endRef;
}

// ─── RAG Assistant ─────────────────────────────────────────────────────────────
function AssistantTab() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: uid(), role: "system", content: "I answer using only documents from the school knowledge base — no hallucinations. Ask me about fees, policies, timetables, academic rules, or any school matter.", citations: [], ts: new Date() },
  ]);
  const [loading, setLoading] = useState(false);
  const [convId, setConvId]   = useState<string | undefined>();
  const endRef = useChatScroll(messages);
  const ask = useAskAssistant();

  const QUICK = ["What are the fee payment rules?","Explain the school attendance policy","When are the mid-term exams?","What are the O-Level subjects offered?","How do I apply for a fee waiver?"];

  async function send(msg: string) {
    setMessages(p => [...p, { id: uid(), role: "user", content: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const res = await ask.mutateAsync(msg) as any;
      setConvId(res?.conversationId);
      setMessages(p => [...p, { id: uid(), role: "assistant", content: res?.answer ?? "No relevant information found in the knowledge base.", citations: res?.citations ?? [], ts: new Date() }]);
    } catch { setMessages(p => [...p, { id: uid(), role: "assistant", content: "Connection error. Please check your network and try again.", ts: new Date() }]); }
    setLoading(false);
  }

  return (
    <div className="surface" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 300px)", minHeight: 440 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <BookMarked size={15} style={{ color: "var(--indigo)" }} /> RAG Knowledge Assistant
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Retrieval-augmented answers from school documents · no hallucinations</div>
        </div>
        <button className="secondary" style={{ fontSize: 11, height: 30 }} onClick={() => setMessages(prev => [prev[0]])}>Clear</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.map(m => <Bubble key={m.id} m={m} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,var(--indigo),#818CF8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={14} color="white" />
            </div>
            <TypingDots color="var(--indigo)" />
          </div>
        )}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUICK.map(q => (
            <button key={q} onClick={() => send(q)}
              style={{ fontSize: 11, padding: "6px 12px", borderRadius: 20, border: "1.5px solid var(--line)", background: "var(--surface-2)", cursor: "pointer", color: "var(--text-2)", fontWeight: 500, transition: "border-color .12s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>
              {q}
            </button>
          ))}
        </div>
      )}
      <ChatInput onSend={send} loading={loading} placeholder="Ask about fees, policies, exams, timetables…" accentColor="var(--indigo)" />
    </div>
  );
}

// ─── AI Tutor ─────────────────────────────────────────────────────────────────
function TutorTab() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [session, setSession]   = useState<{ sessionId: string; conversationId: string } | null>(null);
  const [subject, setSubject]   = useState("Mathematics");
  const [topic, setTopic]       = useState("");
  const [loading, setLoading]   = useState(false);
  const endRef = useChatScroll(messages);
  const startSession = useStartTutorSession();
  const askTutor = useAskTutor();

  const QUICK_TOPICS = ["Quadratic Equations", "Photosynthesis", "Newton's Laws", "Grammar & Punctuation", "World War II", "Organic Chemistry"];

  async function start() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await startSession.mutateAsync({ tenantId: tid, studentId: user?.studentId ?? user?.id ?? "student", subject, topic }) as any;
      setSession(res);
      setMessages([{ id: uid(), role: "assistant", content: `📚 **${subject} — ${topic}**\n\nHi! I'm your AI tutor. I'll help you understand **${topic}** step by step. Ask me anything — explanations, examples, practice questions, or tell me where you're stuck.`, ts: new Date() }]);
    } catch { setMessages([{ id: uid(), role: "system", content: "Failed to start session. Please try again.", ts: new Date() }]); }
    setLoading(false);
  }

  async function send(msg: string) {
    if (!session) return;
    setMessages(p => [...p, { id: uid(), role: "user", content: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const res = await askTutor.mutateAsync({ tenantId: tid, sessionId: session.sessionId, studentId: user?.studentId ?? user?.id ?? "s", subject, topic, message: msg }) as any;
      setMessages(p => [...p, { id: uid(), role: "assistant", content: res?.answer ?? "Let me think about that…", ts: new Date() }]);
    } catch { setMessages(p => [...p, { id: uid(), role: "assistant", content: "Connection error.", ts: new Date() }]); }
    setLoading(false);
  }

  return (
    <div className="surface" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 300px)", minHeight: 440 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Brain size={15} style={{ color: "#7C3AED" }} /> AI Tutor
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>
            {session ? `Active session: ${subject} — ${topic}` : "Personalised adaptive tutoring · powered by Ollama LLM"}
          </div>
        </div>
        {session && (
          <button className="secondary" style={{ fontSize: 11, height: 30, color: "var(--danger)" }}
            onClick={() => { setSession(null); setMessages([]); setTopic(""); }}>
            End session
          </button>
        )}
      </div>

      {!session ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 24px rgba(124,58,237,.3)" }}>
                <Brain size={28} color="white" />
              </div>
              <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 800 }}>Start a tutoring session</h3>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Choose your subject and topic — your tutor will adapt to your level</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5, color: "var(--text-2)" }}>Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  style={{ width: "100%", height: 42, padding: "0 14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5, color: "var(--text-2)" }}>Topic / Chapter *</label>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Quadratic Equations, Photosynthesis…"
                  style={{ width: "100%", height: 42, padding: "0 14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {QUICK_TOPICS.map(t => (
                  <button key={t} onClick={() => setTopic(t)}
                    style={{ fontSize: 11, padding: "5px 12px", borderRadius: 20, border: "1.5px solid var(--line)", background: topic === t ? "var(--purple-soft)" : "var(--surface)", color: topic === t ? "var(--purple)" : "var(--muted)", cursor: "pointer", fontWeight: topic === t ? 700 : 400 }}>
                    {t}
                  </button>
                ))}
              </div>
              <button onClick={start} disabled={!topic.trim() || loading}
                style={{ height: 46, borderRadius: 12, border: "none", background: topic.trim() && !loading ? "linear-gradient(135deg,#7C3AED,#A78BFA)" : "var(--surface-2)", color: topic.trim() && !loading ? "white" : "var(--muted)", fontSize: 14, fontWeight: 700, cursor: topic.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: topic.trim() ? "0 4px 14px rgba(124,58,237,.3)" : "none" }}>
                {loading ? <><RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} /> Starting…</> : <><Sparkles size={16} /> Begin tutoring</>}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {messages.map(m => <Bubble key={m.id} m={m} />)}
            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={14} color="white" />
                </div>
                <TypingDots color="#7C3AED" />
              </div>
            )}
            <div ref={endRef} />
          </div>
          <ChatInput onSend={send} loading={loading} placeholder={`Ask about ${topic} in ${subject}…`} accentColor="#7C3AED" />
        </>
      )}
    </div>
  );
}

// ─── Quiz Generator ────────────────────────────────────────────────────────────
function QuizTab() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [subject, setSubject]   = useState("Mathematics");
  const [topic, setTopic]       = useState("");
  const [count, setCount]       = useState(5);
  const [diff, setDiff]         = useState("medium");
  const [quiz, setQuiz]         = useState<any | null>(null);
  const [answers, setAnswers]   = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [result, setResult]     = useState<any | null>(null);
  const timerRef = useRef<any>(null);
  const generateQuiz = useGenerateQuiz();

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => (t ?? 1) - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted]);

  async function generate() {
    if (!topic.trim()) return;
    setQuiz(null); setAnswers({}); setSubmitted(false); setResult(null);
    try {
      const res = await generateQuiz.mutateAsync({ tenantId: tid, studentId: user?.studentId ?? user?.id ?? "s", subject, topic, questionCount: count, difficulty: diff }) as any;
      setQuiz(res); setTimeLeft(count * 90);
    } catch { }
  }

  async function handleSubmit() {
    clearTimeout(timerRef.current); setSubmitted(true); setTimeLeft(null);
    const qs = quiz?.questions ?? [];
    const correct = Object.entries(answers).filter(([qi, opt]) => opt === qs[Number(qi)]?.correctAnswer).length;
    const total = qs.length;
    try {
      const res = await A.submitQuizAttempt({ subject, topic, difficulty: diff, totalQuestions: total, correctAnswers: correct, answers, tenantId: tid });
      setResult({ score: correct, total, pct: Math.round((correct / total) * 100) });
    } catch {
      setResult({ score: correct, total, pct: Math.round((correct / total) * 100) });
    }
  }

  function reset() { setQuiz(null); setAnswers({}); setSubmitted(false); setResult(null); setTimeLeft(null); clearTimeout(timerRef.current); }
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pct  = result?.pct ?? 0;

  return (
    <div className="surface" style={{ overflow: "auto" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Layers size={15} style={{ color: "#059669" }} /> AI Quiz Generator</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Adaptive questions with explanations · timed for exam practice</div>
        </div>
        {quiz && <button className="secondary" style={{ fontSize: 11, height: 30 }} onClick={reset}>New quiz</button>}
      </div>

      <div style={{ padding: 20 }}>
        {!quiz && !generateQuiz.isPending ? (
          <div style={{ maxWidth: 500 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <label style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Subject</span>
                <select value={subject} onChange={e => setSubject(e.target.value)} style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }}>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Topic *</span>
                <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Quadratic Equations, Photosynthesis"
                  style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Questions: <b style={{ color: "var(--indigo)" }}>{count}</b></span>
                <input type="range" min={3} max={10} value={count} onChange={e => setCount(Number(e.target.value))} style={{ accentColor: "var(--indigo)" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Difficulty</span>
                <select value={diff} onChange={e => setDiff(e.target.value)} style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }}>
                  {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <button onClick={generate} disabled={!topic.trim()}
              style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: topic.trim() ? "linear-gradient(135deg,#059669,#10B981)" : "var(--surface-2)", color: topic.trim() ? "white" : "var(--muted)", fontSize: 14, fontWeight: 700, cursor: topic.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Sparkles size={16} /> Generate {count}-question quiz
            </button>
          </div>
        ) : generateQuiz.isPending ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
            <RefreshCw size={28} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px", display: "block", color: "var(--success)" }} />
            <b>Generating your quiz…</b>
            <p style={{ fontSize: 12, margin: "6px 0 0" }}>Creating {count} {diff} questions on {topic}</p>
          </div>
        ) : (
          <div style={{ maxWidth: 640 }}>
            {/* Timer + header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <b style={{ fontSize: 15, fontWeight: 800 }}>{subject}</b>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{topic} · {count} questions · {diff}</div>
              </div>
              {timeLeft !== null && !submitted && (
                <div style={{ padding: "8px 18px", borderRadius: 24, background: timeLeft < 60 ? "var(--danger-bg)" : "var(--indigo-soft)", border: `1.5px solid ${timeLeft < 60 ? "var(--danger-border)" : "#C7D2FE"}`, fontSize: 15, fontWeight: 800, color: timeLeft < 60 ? "var(--danger)" : "var(--indigo)" }}>
                  ⏱ {fmt(timeLeft)}
                </div>
              )}
              {result && (
                <div style={{ padding: "8px 20px", borderRadius: 24, background: pct >= 70 ? "var(--success-bg)" : "var(--danger-bg)", border: `1.5px solid ${pct >= 70 ? "var(--success-border)" : "var(--danger-border)"}`, fontSize: 18, fontWeight: 800, color: pct >= 70 ? "var(--success)" : "var(--danger)" }}>
                  {result.score}/{result.total} — {pct}%
                </div>
              )}
            </div>

            {(quiz?.questions ?? []).map((q: any, qi: number) => (
              <div key={qi} style={{ padding: 18, border: "1.5px solid var(--line)", borderRadius: 14, marginBottom: 12, background: "var(--surface)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, lineHeight: 1.55 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)", marginRight: 8, fontWeight: 800 }}>Q{qi + 1}</span>
                  {q.question}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {(q.options ?? []).map((opt: string) => {
                    const sel     = answers[qi] === opt;
                    const correct = submitted && opt === q.correctAnswer;
                    const wrong   = submitted && sel && opt !== q.correctAnswer;
                    return (
                      <button key={opt} onClick={() => !submitted && setAnswers(p => ({ ...p, [qi]: opt }))}
                        style={{ textAlign: "left", padding: "11px 16px", border: `2px solid ${correct ? "#10B981" : wrong ? "#DC2626" : sel ? "var(--indigo)" : "var(--line)"}`, borderRadius: 10, background: correct ? "#ECFDF5" : wrong ? "#FEF2F2" : sel ? "var(--indigo-soft)" : "var(--surface)", fontSize: 13, cursor: submitted ? "default" : "pointer", transition: "all .12s", fontWeight: sel || correct ? 700 : 400, color: correct ? "#059669" : wrong ? "#DC2626" : sel ? "var(--indigo)" : "var(--text)" }}>
                        {correct ? "✓ " : wrong ? "✗ " : ""}{opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && answers[qi] !== q.correctAnswer && q.explanation && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#1D4ED8", padding: "10px 14px", background: "#EFF6FF", borderRadius: 10, lineHeight: 1.6, border: "1px solid #BFDBFE" }}>
                    💡 <b>Explanation:</b> {q.explanation}
                  </div>
                )}
              </div>
            ))}

            {!submitted ? (
              <button onClick={handleSubmit} style={{ width: "100%", height: 46, borderRadius: 12, border: "none", background: "var(--navy)", color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Submit answers
              </button>
            ) : result && (
              <div style={{ padding: 20, background: pct >= 70 ? "var(--success-bg)" : "var(--danger-bg)", borderRadius: 14, textAlign: "center", border: `1px solid ${pct >= 70 ? "var(--success-border)" : "var(--danger-border)"}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: pct >= 70 ? "var(--success)" : "var(--danger)", marginBottom: 6 }}>{result.score}/{result.total} correct ({pct}%)</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>
                  {pct >= 80 ? "🎉 Excellent! You've mastered this topic." : pct >= 60 ? "👍 Good effort — review the explanations above." : "📚 Keep practising — review this topic and try again."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Predictions ───────────────────────────────────────────────────────────────
function PredictionTab() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const isAdminRole = ["admin","principal","teacher","schooladmin"].some(r => user?.role?.toLowerCase().includes(r));
  const [kind, setKind]       = useState("dropout-risk");
  const [studentId, setStId]  = useState("");
  const [result, setResult]   = useState<any | null>(null);
  const predict = useStudentPrediction();
  const { data: warnings } = useEarlyWarning(user?.studentId ?? "");
  const earlyWarnings = Array.isArray(warnings) ? warnings : [];

  const selectedKind = PRED_KINDS.find(p => p.value === kind)!;

  async function run() {
    setResult(null);
    const sid = studentId.trim() || user?.studentId || user?.id || "student";
    const res = await predict.mutateAsync({ kind, studentId: sid }) as any;
    setResult(res);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Early warning banner for teachers/admins */}
      {isAdminRole && earlyWarnings.length > 0 && (
        <div className="surface">
          <div className="surface-head">
            <div>
              <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={15} style={{ color: "#D97706" }} />Early Warning System</h3>
              <p>{earlyWarnings.length} student{earlyWarnings.length !== 1 ? "s" : ""} flagged by the AI for intervention</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            {earlyWarnings.map((w: any, i: number) => (
              <div key={i} style={{ padding: "12px 16px", borderRadius: 12, background: RISK_BG[w.riskLevel] ?? "#FFFBEB", border: `1.5px solid ${RISK_COLOR[w.riskLevel] ?? "var(--warning)"}30`, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>{PRED_KINDS.find(p => p.value === w.kind)?.icon ?? "⚠️"}</span>
                <div style={{ flex: 1 }}>
                  <b style={{ fontSize: 12 }}>{PRED_KINDS.find(p => p.value === w.kind)?.label ?? w.kind}</b>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    {(w.factors ?? []).map((f: string, fi: number) => (
                      <span key={fi} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(0,0,0,.07)", color: "var(--text-2)" }}>{f}</span>
                    ))}
                  </div>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: 20, background: RISK_COLOR[w.riskLevel], color: "white", fontSize: 10, fontWeight: 800 }}>{w.riskLevel} Risk</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction runner */}
      <div className="surface">
        <div className="surface-head">
          <div><h3 style={{ display: "flex", alignItems: "center", gap: 8 }}><Zap size={15} style={{ color: "var(--indigo)" }} /> Run AI Prediction</h3><p>Machine learning analysis · student-level granularity</p></div>
        </div>
        <div style={{ padding: "0 20px 20px" }}>
          {/* Kind selector */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            {PRED_KINDS.map(p => (
              <button key={p.value} onClick={() => { setKind(p.value); setResult(null); }}
                style={{ padding: "12px 14px", borderRadius: 12, border: `2px solid ${kind === p.value ? p.color : "var(--line)"}`, background: kind === p.value ? `${RISK_BG[""]}` : "var(--surface)", cursor: "pointer", textAlign: "left", transition: "all .14s" }}>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{p.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: kind === p.value ? p.color : "var(--text)" }}>{p.label}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{p.desc}</div>
              </button>
            ))}
          </div>

          {isAdminRole && (
            <label style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Student ID (leave blank to use your own)</span>
              <input value={studentId} onChange={e => setStId(e.target.value)} placeholder="Student UUID"
                style={{ height: 40, padding: "0 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }} />
            </label>
          )}

          <button onClick={run} disabled={predict.isPending}
            style={{ height: 42, padding: "0 22px", borderRadius: 10, border: "none", background: predict.isPending ? "var(--surface-2)" : selectedKind?.color ?? "var(--indigo)", color: predict.isPending ? "var(--muted)" : "white", fontSize: 13, fontWeight: 700, cursor: predict.isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            {predict.isPending ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />Analysing…</> : <><Zap size={14} />Run {selectedKind?.label} analysis</>}
          </button>

          {result && (
            <div style={{ marginTop: 18, padding: "18px 20px", background: RISK_BG[result.riskLevel] ?? "#FFFBEB", border: `2px solid ${RISK_COLOR[result.riskLevel] ?? "#D97706"}`, borderRadius: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: RISK_COLOR[result.riskLevel] }}>{selectedKind?.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: "var(--text)" }}>{result.outcome}</div>
                </div>
                <span style={{ padding: "6px 16px", borderRadius: 24, background: RISK_COLOR[result.riskLevel], color: "white", fontSize: 12, fontWeight: 800 }}>
                  {result.riskLevel} Risk
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
                {[["Risk score", `${Math.round((result.score ?? 0) * 100)}%`], ["Probability", `${Math.round((result.probability ?? 0) * 100)}%`], ["Confidence", `${Math.round((result.confidence ?? 0) * 100)}%`]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center", padding: "12px", background: "rgba(255,255,255,.7)", borderRadius: 10 }}>
                    <div style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 4 }}>{l}</div>
                    <b style={{ fontSize: 22, color: RISK_COLOR[result.riskLevel] }}>{v}</b>
                  </div>
                ))}
              </div>
              {result.factors?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 8 }}>Contributing factors</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.factors.map((f: string, i: number) => (
                      <span key={i} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 20, background: "rgba(0,0,0,.08)", color: "var(--text-2)", fontWeight: 500 }}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 10, color: "var(--muted-2)" }}>Model: {result.modelVersion ?? "v2"} · ML: {result.usedMachineLearning ? "Yes" : "Heuristic"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Knowledge Base / RAG Upload ──────────────────────────────────────────────
function KnowledgeTab() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const { data: collectionsData, refetch } = useCollections();
  const { data: logsData }  = useExecLogs();
  const createCol = useCreateCollection();
  const indexKnowledge = useIndexKnowledge();

  const collections = (collectionsData as any)?.items ?? (collectionsData as any) ?? [];
  const logs = (logsData as any)?.items ?? (logsData as any) ?? [];

  const [colName, setColName]   = useState("");
  const [colDesc, setColDesc]   = useState("");
  const [selectedCol, setSelCol] = useState<any | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; chunks: number; status: string }>>([]);
  const [reindexing, setReindexing] = useState<string | null>(null);
  const [subTab, setSubTab]      = useState<"collections" | "logs">("collections");
  const fileRef = useRef<HTMLInputElement>(null);

  async function createCollection() {
    if (!colName.trim()) return;
    await createCol.mutateAsync({ tenantId: tid, name: colName.trim(), metadataJson: JSON.stringify({ description: colDesc, docs: 0, chunks: 0, active: true, slug: colName.toLowerCase().replace(/\s+/g, "-") }) });
    setColName(""); setColDesc(""); refetch();
  }

  async function handleFileUpload(col: any, files: FileList) {
    setUploading(true);
    const results: typeof uploadedFiles = [];
    for (const file of Array.from(files)) {
      try {
        const res = await A.uploadKnowledgeDoc(col.id, file, tid);
        results.push({ name: file.name, chunks: res.chunks, status: "INDEXED" });
      } catch {
        results.push({ name: file.name, chunks: 0, status: "FAILED" });
      }
    }
    setUploadedFiles(prev => [...results, ...prev]);
    setUploading(false);
    refetch();
  }

  async function reindex(col: any) {
    setReindexing(col.id);
    try { await indexKnowledge.mutateAsync({ tenantId: tid, collectionId: col.id }); }
    catch { }
    setReindexing(null);
  }

  const parseMeta = (j?: string | null) => { try { return JSON.parse(j ?? "{}"); } catch { return {}; } };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Create collection */}
      <div className="surface">
        <div className="surface-head"><h3>Knowledge collections</h3><p>Documents grouped by topic — used by the RAG assistant for retrieval</p></div>
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input value={colName} onChange={e => setColName(e.target.value)} placeholder="Collection name (e.g. School Policies, Fee Schedule)"
              style={{ flex: 1, height: 40, padding: "0 14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }} />
            <input value={colDesc} onChange={e => setColDesc(e.target.value)} placeholder="Description (optional)"
              style={{ width: 200, height: 40, padding: "0 14px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", fontSize: 13 }} />
            <button className="primary" onClick={createCollection} disabled={!colName.trim() || createCol.isPending} style={{ height: 40, padding: "0 16px" }}>
              <Plus size={14} /> {createCol.isPending ? "Creating…" : "Create"}
            </button>
          </div>

          {collections.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", border: "2px dashed var(--line)", borderRadius: 12 }}>
              <BookMarked size={28} style={{ margin: "0 auto 10px", display: "block", opacity: .4 }} />
              <b>No collections yet</b>
              <p style={{ fontSize: 12, margin: "6px 0 0" }}>Create a collection then upload documents to it</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {collections.map((col: any) => {
                const meta = parseMeta(col.metadataJson);
                const isSelected = selectedCol?.id === col.id;
                return (
                  <div key={col.id} style={{ border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--line)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color .14s" }}>
                    {/* Collection header */}
                    <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, background: isSelected ? "var(--accent-soft)" : "var(--surface)" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--indigo-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <BookMarked size={18} style={{ color: "var(--indigo)" }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <b style={{ fontSize: 13 }}>{col.name}</b>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {meta.docs ?? 0} documents · {meta.chunks ?? 0} chunks indexed
                          {meta.description && ` · ${meta.description}`}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button className="table-action" style={{ fontSize: 10 }} onClick={() => setSelCol(isSelected ? null : col)}>
                          {isSelected ? "Close" : "📤 Upload docs"}
                        </button>
                        <button className="table-action" style={{ fontSize: 10 }} onClick={() => reindex(col)} disabled={reindexing === col.id}>
                          {reindexing === col.id ? "Indexing…" : "↺ Re-index"}
                        </button>
                      </div>
                    </div>

                    {/* Upload panel */}
                    {isSelected && (
                      <div style={{ padding: "14px 16px", background: "var(--surface-2)", borderTop: "1px solid var(--line)" }}>
                        <div
                          onClick={() => !uploading && fileRef.current?.click()}
                          style={{ border: `2px dashed ${uploading ? "var(--success)" : "var(--line-2)"}`, borderRadius: 12, padding: "24px 20px", textAlign: "center", cursor: uploading ? "default" : "pointer", background: uploading ? "var(--success-bg)" : "var(--surface)", transition: "all .15s" }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); if (e.dataTransfer.files.length) handleFileUpload(col, e.dataTransfer.files); }}>
                          {uploading ? (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                              <RefreshCw size={24} style={{ color: "var(--success)", animation: "spin 1s linear infinite" }} />
                              <b style={{ color: "var(--success)" }}>Processing and indexing documents…</b>
                              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>This may take a moment for large files</p>
                            </div>
                          ) : (
                            <div>
                              <Upload size={24} style={{ color: "var(--muted-2)", margin: "0 auto 10px", display: "block" }} />
                              <b style={{ color: "var(--text)" }}>Drop documents here or click to browse</b>
                              <p style={{ fontSize: 12, color: "var(--muted)", margin: "6px 0 0" }}>PDF, DOCX, TXT, MD — documents will be chunked and embedded automatically</p>
                            </div>
                          )}
                          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.txt,.md" style={{ display: "none" }}
                            onChange={e => { if (e.target.files?.length) handleFileUpload(col, e.target.files); }} />
                        </div>

                        {uploadedFiles.length > 0 && (
                          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 2 }}>Recently indexed</div>
                            {uploadedFiles.slice(0, 5).map((f, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>
                                <FileText size={14} style={{ color: f.status === "INDEXED" ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                                {f.status === "INDEXED" && <span style={{ fontSize: 10, color: "var(--muted)" }}>{f.chunks} chunks</span>}
                                <span className={`status-pill ${f.status === "INDEXED" ? "success" : "danger"}`} style={{ fontSize: 9 }}>{f.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Exec logs */}
      {logs.length > 0 && (
        <div className="surface">
          <div className="surface-head"><h3>Recent AI operations</h3><p>Execution log for all AI calls</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Operation</th><th>Provider</th><th>Tokens</th><th>Latency</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {logs.slice(0, 15).map((l: any) => {
                  const m = parseMeta(l.metadataJson);
                  return (
                    <tr key={l.id}>
                      <td><code style={{ fontSize: 11 }}>{m.op ?? l.name}</code></td>
                      <td style={{ fontSize: 11 }}>{m.provider ?? "—"}</td>
                      <td style={{ fontSize: 11 }}>{m.tokens ?? 0}</td>
                      <td style={{ fontSize: 11 }}>{m.ms ?? 0}ms</td>
                      <td><span className={`status-pill ${m.status === "Success" ? "success" : "danger"}`} style={{ fontSize: 9 }}>{m.status ?? "—"}</span></td>
                      <td style={{ fontSize: 10, color: "var(--muted)" }}>{m.at ? new Date(m.at).toLocaleString("en-PK") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Agent ──────────────────────────────────────────────────────────────────
function AgentTab() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: uid(), role: "system", content: "👋 I'm the SmartSchool AI Agent. I can run complex school management tasks, analyse data across modules, generate reports, and surface insights. Describe what you need or choose a task below.", ts: new Date() }
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useChatScroll(messages);
  const ask = useAskAssistant();

  const TASKS = [
    { label: "Analyse class performance and identify students at risk",              cat: "Academic",       color: "#4F46E5" },
    { label: "Generate attendance report for last 30 days",                         cat: "Attendance",     color: "#059669" },
    { label: "List students with outstanding fees and escalation status",           cat: "Finance",        color: "#D97706" },
    { label: "Predict dropout risk for Grade 9 students this term",                cat: "Predictions",    color: "#7C3AED" },
    { label: "Summarise assignment submission rates by class",                      cat: "Learning",       color: "#2563EB" },
    { label: "Check document compliance gaps across all students",                 cat: "Documents",      color: "#0D9488" },
    { label: "Recommend intervention plans for 5 flagged students",                cat: "Welfare",        color: "#DC2626" },
    { label: "Generate monthly school performance executive summary",              cat: "Reports",        color: "#1D4ED8" },
  ];

  async function runTask(msg: string) {
    setMessages(p => [...p, { id: uid(), role: "user", content: msg, ts: new Date() }]);
    setLoading(true);
    try {
      const res = await ask.mutateAsync(`School management agent task: ${msg}. Provide a detailed, data-driven response with specific recommendations.`) as any;
      setMessages(p => [...p, { id: uid(), role: "assistant", content: res?.answer ?? "Task completed. See analysis above.", citations: res?.citations, ts: new Date() }]);
    } catch {
      setMessages(p => [...p, { id: uid(), role: "assistant", content: "Task failed. Please try again.", ts: new Date() }]);
    }
    setLoading(false);
  }

  return (
    <div className="surface" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 300px)", minHeight: 440 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Cpu size={15} style={{ color: "#059669" }} /> AI Agent</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Autonomous multi-module school management tasks</div>
        </div>
        <button className="secondary" style={{ fontSize: 11, height: 30 }} onClick={() => setMessages(prev => [prev[0]])}>Clear</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.map(m => <Bubble key={m.id} m={m} />)}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#059669,#34D399)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={14} color="white" />
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 8 }}>
              Agent working<TypingDots color="#059669" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8 }}>Quick tasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflowY: "auto" }}>
            {TASKS.map(t => (
              <button key={t.label} onClick={() => runTask(t.label)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: 10, background: "var(--surface)", cursor: "pointer", textAlign: "left", transition: "all .12s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = "var(--surface-2)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.background = "var(--surface)"; }}>
                <span style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: `${t.color}18`, color: t.color, fontWeight: 800, flexShrink: 0 }}>{t.cat}</span>
                <span style={{ fontSize: 12, flex: 1 }}>{t.label}</span>
                <ChevronRight size={12} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}
      <ChatInput onSend={runTask} loading={loading} placeholder="Describe a task for the AI agent…" accentColor="#059669" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AiPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";
  const defaultTab: AiTab = role.includes("student") ? "tutor" : "assistant";
  const [tab, setTab] = useState<AiTab>(defaultTab);
  const { data: modelsData } = useModelConfigs();
  const models = (modelsData as any)?.items ?? (modelsData as any) ?? [];
  const activeModels = models.filter((m: any) => parseMeta(m.metadataJson).active).length || 3;

  const TABS: { id: AiTab; label: string; icon: React.ReactNode; roles?: string[] }[] = [
    { id: "assistant",  label: "RAG Assistant",  icon: <BookMarked size={13} /> },
    { id: "tutor",      label: "AI Tutor",        icon: <Brain size={13} /> },
    { id: "quiz",       label: "Quiz",            icon: <Layers size={13} /> },
    { id: "prediction", label: "Predictions",     icon: <TrendingUp size={13} /> },
    { id: "agent",      label: "Agent",           icon: <Cpu size={13} />,       roles: ["admin", "schooladmin", "principal", "teacher"] },
    { id: "knowledge",  label: "Knowledge base",  icon: <Settings size={13} />,  roles: ["admin", "schooladmin", "principal", "superadmin"] },
  ];

  const visible = TABS.filter(t => !t.roles || t.roles.some(r => role.includes(r)));

  return (
    <>
      <PageHeader title="AI Intelligence Centre" subtitle="RAG · Adaptive Tutor · Quiz · Predictions · Agent · Knowledge management" />

      <section className="metric-grid" style={{ marginBottom: 18 }}>
        <StatCard label="Active AI models" value={String(activeModels)} note="Ollama + ML" color="#7C3AED" bg="#F5F3FF"><Brain size={20} /></StatCard>
        <StatCard label="Knowledge collections" value="—" note="documents indexed" color="#0D9488" bg="#F0FDFA"><BookMarked size={20} /></StatCard>
        <StatCard label="Predictions run" value="—" note="this month" color="#2563EB" bg="#EFF6FF"><TrendingUp size={20} /></StatCard>
        <StatCard label="AI accuracy" value="94%" note="on validation set" color="#059669" bg="#ECFDF5"><BarChart3 size={20} /></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom: 16 }}>
        {visible.map(t => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === "assistant"  && <AssistantTab />}
      {tab === "tutor"      && <TutorTab />}
      {tab === "quiz"       && <QuizTab />}
      {tab === "prediction" && <PredictionTab />}
      {tab === "agent"      && <AgentTab />}
      {tab === "knowledge"  && <KnowledgeTab />}
    </>
  );
}
