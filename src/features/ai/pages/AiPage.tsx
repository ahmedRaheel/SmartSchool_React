import { useRef, useEffect, useState } from "react";
import { ArrowRight, Bot, RefreshCcw, Send, Sparkles, X, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth }    from "../../auth/auth";
import {
  useAskChatbot, useAskAssistant, useStartTutorSession, useAskTutor,
  useGenerateQuiz, useStudentPrediction, useEarlyWarning,
} from "../../../core/api/queries";
import type { AskResponse, QuizQuestion, TutorAnswer } from "../../../core/api/smartschoolApi";

type BotType = "student" | "teacher" | "parent" | "admissions" | "admin";

interface ChatMsg { role: "user" | "ai"; text: string; citations?: { documentTitle: string; excerpt: string }[]; }

function getBotForRole(role: string): BotType {
  const r = role.toLowerCase();
  if (r.includes("student"))  return "student";
  if (r.includes("teacher"))  return "teacher";
  if (r.includes("parent"))   return "parent";
  if (r.includes("admission"))return "admissions";
  return "admin";
}

const QUICK_QS: Record<string, string[]> = {
  student:    ["Help me study for my Physics quiz","Create a study plan for History","Explain quadratic equations step by step","What is on my timetable this week?"],
  teacher:    ["Which students need extra help?","Generate quiz questions for Chapter 5","Create a lesson plan for next week","Show me class performance trends"],
  parent:     ["How is my child performing?","What subjects need attention?","Tips for supporting learning at home","When is the next parent-teacher meeting?"],
  admissions: ["What is the admission process?","What documents are required?","What are the fee structures?","What programs do you offer?"],
  admin:      ["School performance overview","Which students are at dropout risk?","Fee collection status this month","Staff leave requests pending"],
};

// ─── RAG Chatbot ─────────────────────────────────────────────────────────────
function RagChatPanel({ bot }: { bot: BotType }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", text: `Hi! I'm the SmartSchool ${bot} assistant, powered by your school's knowledge base. Ask me anything.` }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const ask = useAskChatbot(bot);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send(question?: string) {
    const text = (question ?? input).trim();
    if (!text || ask.isPending) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    try {
      const res = await ask.mutateAsync(text);
      setMessages(m => [...m, { role: "ai", text: res.answer, citations: res.citations }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "I encountered an issue. Please try again." }]);
    }
  }

  return (
    <div className="surface" style={{ display: "flex", flexDirection: "column", height: 560, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: "0.5px solid var(--border)", background: "var(--surface-1)", display: "flex", alignItems: "center", gap: 10 }}>
        <div className="floating-ai-avatar"><Sparkles size={18} /></div>
        <div>
          <b style={{ fontSize: 14 }}>SmartSchool {bot.charAt(0).toUpperCase() + bot.slice(1)} AI</b>
          <div style={{ fontSize: 11, color: "var(--text-success)", display: "flex", alignItems: "center", gap: 4 }}>
            <span className="ai-online-dot" /> Online · RAG-powered school knowledge
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10, background: "var(--surface-1)" }}>
        {messages.map((m, i) => (
          <div key={i} className={`floating-ai-message ${m.role === "user" ? "user" : ""}`}>
            {m.role === "ai" && <span className="mini-ai-avatar"><Sparkles size={12} /></span>}
            <div className="floating-ai-bubble" style={{ maxWidth: "85%" }}>
              {m.text}
              {m.citations && m.citations.length > 0 && (
                <div style={{ marginTop: 8, borderTop: "0.5px solid var(--border)", paddingTop: 6 }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Sources:</div>
                  {m.citations.slice(0, 3).map((c, ci) => (
                    <div key={ci} style={{ fontSize: 10, color: "var(--text-secondary)", padding: "3px 0", borderBottom: "0.5px solid var(--border)" }}>
                      <b>{c.documentTitle}</b> — {c.excerpt?.slice(0, 80)}…
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {ask.isPending && (
          <div className="floating-ai-message">
            <span className="mini-ai-avatar"><Sparkles size={12} /></span>
            <div className="floating-ai-bubble" style={{ color: "var(--text-muted)" }}>Searching knowledge base…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ padding: "6px 12px", borderTop: "0.5px solid var(--border)", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(QUICK_QS[bot] ?? QUICK_QS.admin).map(q => (
            <button key={q} onClick={() => void send(q)} style={{ padding: "5px 10px", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", background: "var(--surface-2)", fontSize: 11, cursor: "pointer", color: "var(--text-primary)" }}>
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="floating-ai-compose" style={{ padding: 10, borderTop: "0.5px solid var(--border)", background: "var(--surface-2)" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask the ${bot} assistant…`}
          rows={1}
          style={{ flex: 1, resize: "none", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 10px", fontSize: 12, background: "var(--surface-2)", color: "var(--text-primary)" }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
        />
        <button onClick={() => void send()} disabled={ask.isPending || !input.trim()} className="primary" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center" }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── AI Tutor Panel (student-facing) ─────────────────────────────────────────
function AiTutorPanel() {
  const { user } = useAuth();
  const [session, setSession] = useState<{ sessionId: string; conversationId: string } | null>(null);
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("Quadratic Equations");
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResults, setQuizResults] = useState<Record<number, boolean>>({});
  const endRef = useRef<HTMLDivElement>(null);

  const startSession = useStartTutorSession();
  const askTutor     = useAskTutor();
  const generateQuiz = useGenerateQuiz();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function start() {
    const res = await startSession.mutateAsync({
      studentId: user?.studentId ?? user?.id ?? "",
      subject, topic,
    });
    setSession(res);
    setMessages([{ role: "ai", text: `Session started for ${subject}: ${topic}. I'm your AI Tutor — ask me anything about this topic!` }]);
  }

  async function send() {
    if (!session || !input.trim() || askTutor.isPending) return;
    const text = input.trim();
    setInput("");
    setMessages(m => [...m, { role: "user", text }]);
    const res = await askTutor.mutateAsync({
      sessionId: session.sessionId,
      studentId: user?.studentId ?? user?.id ?? "",
      subject, topic, message: text,
    });
    setMessages(m => [...m, { role: "ai", text: res.answer }]);
  }

  async function doGenerateQuiz() {
    const res = await generateQuiz.mutateAsync({
      studentId: user?.studentId ?? user?.id ?? "",
      subject, topic, questionCount: 5, difficulty: "adaptive",
    });
    setQuiz(res.questions);
    setQuizAnswers({});
    setQuizResults({});
  }

  if (!session) {
    return (
      <div className="surface" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 500 }}>Start an AI Tutor session</h3>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)" }}>Get personalised tutoring powered by your school curriculum.</p>
        </div>
        <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label className="human-field"><span>Subject</span>
            <select value={subject} onChange={e => setSubject(e.target.value)}>
              {["Mathematics","Physics","Chemistry","English","History","Computer Science","Biology"].map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="human-field"><span>Topic</span>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Quadratic Equations"/>
          </label>
        </div>
        <button className="primary" onClick={() => void start()} disabled={startSession.isPending}>
          {startSession.isPending ? "Starting session…" : <><Bot size={15}/> Start AI Tutor Session</>}
        </button>
      </div>
    );
  }

  return (
    <div className="surface" style={{ display: "flex", flexDirection: "column", height: 500 }}>
      <div style={{ padding: "10px 14px", borderBottom: "0.5px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <b style={{ fontSize: 13 }}>AI Tutor — {subject}: {topic}</b>
          <div style={{ fontSize: 10, color: "var(--text-success)" }}>Session active</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="soft-button" style={{ fontSize: 11 }} onClick={() => void doGenerateQuiz()} disabled={generateQuiz.isPending}>
            <Zap size={13}/> {generateQuiz.isPending ? "Generating…" : "Generate quiz"}
          </button>
          <button className="soft-button" style={{ fontSize: 11 }} onClick={() => setSession(null)}>
            <X size={13}/> End session
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} className={`floating-ai-message ${m.role === "user" ? "user" : ""}`}>
            {m.role === "ai" && <span className="mini-ai-avatar"><Bot size={12}/></span>}
            <div className="floating-ai-bubble">{m.text}</div>
          </div>
        ))}
        {askTutor.isPending && (
          <div className="floating-ai-message">
            <span className="mini-ai-avatar"><Bot size={12}/></span>
            <div className="floating-ai-bubble" style={{ color: "var(--text-muted)" }}>Thinking…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: 10, borderTop: "0.5px solid var(--border)", display: "flex", gap: 8 }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask the AI tutor…" rows={1}
          style={{ flex: 1, resize: "none", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 10px", fontSize: 12 }}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}/>
        <button className="primary" style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center" }} onClick={() => void send()} disabled={askTutor.isPending}><Send size={15}/></button>
      </div>

      {quiz && quiz.length > 0 && (
        <div style={{ padding: 14, borderTop: "0.5px solid var(--border)", maxHeight: 300, overflowY: "auto" }}>
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10 }}>Quiz — {quiz.length} questions</div>
          {quiz.map((q, qi) => (
            <div key={qi} style={{ marginBottom: 12, padding: 10, border: "0.5px solid var(--border)", borderRadius: 12, background: "var(--surface-1)" }}>
              <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>{qi + 1}. {q.question}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {q.options.map((opt, oi) => {
                  const selected = quizAnswers[qi] === opt;
                  const correct  = quizResults[qi] !== undefined ? opt === q.correctAnswer : undefined;
                  return (
                    <button key={oi}
                      onClick={() => {
                        setQuizAnswers(a => ({ ...a, [qi]: opt }));
                        setQuizResults(r => ({ ...r, [qi]: opt === q.correctAnswer }));
                      }}
                      style={{
                        padding: "6px 10px", borderRadius: "var(--radius)", fontSize: 11, textAlign: "left", cursor: "pointer",
                        border: `1.5px solid ${selected ? (quizResults[qi] ? "var(--border-success)" : "var(--border-danger)") : "var(--border)"}`,
                        background: selected ? (quizResults[qi] ? "var(--bg-success)" : "var(--bg-danger)") : "var(--surface-2)",
                        color: "var(--text-primary)",
                      }}
                    >{opt}</button>
                  );
                })}
                {quizResults[qi] !== undefined && (
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    {quizResults[qi] ? "✓ Correct!" : `✗ Answer: ${q.correctAnswer}`} — {q.explanation}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Prediction Panel ─────────────────────────────────────────────────────────
function PredictionPanel() {
  const { user } = useAuth();
  const { data: warnings, isLoading } = useEarlyWarning(user?.studentId ?? user?.businessEntityId ?? "");
  const predict = useStudentPrediction();
  const [result, setResult] = useState<{ kind: string; score: number; riskLevel: string; factors: Record<string, number> } | null>(null);

  const KINDS = [
    { key: "DropoutRisk",       label: "Dropout Risk" },
    { key: "GradeDecline",      label: "Grade Decline" },
    { key: "FeeDefault",        label: "Fee Default" },
    { key: "AttendanceAnomaly", label: "Attendance" },
  ] as const;

  return (
    <div className="surface" style={{ padding: 18, alignSelf: "start" }}>
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>AI Predictions</h3>
        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0 }}>ML-powered student risk analysis</p>
      </div>

      {/* Early warnings */}
      {isLoading && <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Loading predictions…</div>}
      {warnings?.map((w, i) => (
        <div key={i} style={{
          display: "flex", gap: 10, alignItems: "center", padding: "10px 12px",
          borderRadius: 12, marginBottom: 8,
          background: w.riskLevel === "High" ? "var(--bg-danger)" : w.riskLevel === "Medium" ? "var(--bg-warning)" : "var(--bg-success)",
          border: `0.5px solid ${w.riskLevel === "High" ? "var(--border-danger)" : w.riskLevel === "Medium" ? "var(--border-warning)" : "var(--border-success)"}`,
        }}>
          <span style={{ fontSize: 18 }}>{w.riskLevel === "High" ? "🚨" : w.riskLevel === "Medium" ? "⚠️" : "✅"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: .7, color: w.riskLevel === "High" ? "var(--text-danger)" : w.riskLevel === "Medium" ? "var(--text-warning)" : "var(--text-success)" }}>
              {w.kind}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>{w.outcome}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <b style={{ fontSize: 16, display: "block", color: w.riskLevel === "High" ? "var(--text-danger)" : w.riskLevel === "Medium" ? "var(--text-warning)" : "var(--text-success)" }}>
              {Math.round(w.probability * 100)}%
            </b>
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>risk</span>
          </div>
        </div>
      ))}

      {/* Run on-demand prediction */}
      {user?.studentId && (
        <div style={{ marginTop: 12, borderTop: "0.5px solid var(--border)", paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>Run prediction</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {KINDS.map(k => (
              <button key={k.key}
                className="soft-button"
                style={{ fontSize: 10, padding: "4px 10px" }}
                disabled={predict.isPending}
                onClick={async () => {
                  const r = await predict.mutateAsync({ kind: k.key, studentId: user.studentId! });
                  setResult(r);
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
          {result && (
            <div style={{ padding: "10px 12px", borderRadius: 10, border: "0.5px solid var(--border)", background: "var(--surface-1)", fontSize: 11 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{result.kind} — {result.riskLevel} risk</div>
              <div style={{ color: "var(--text-secondary)" }}>Score: {Math.round(result.score * 100)}%</div>
              {Object.entries(result.factors ?? {}).slice(0, 3).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span>{k}</span><b>{typeof v === "number" ? v.toFixed(2) : String(v)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function AiPage() {
  const { user } = useAuth();
  const role = (user?.role ?? "").toLowerCase();
  const bot  = getBotForRole(role);
  const isStudent = role.includes("student");

  const TABS = isStudent
    ? [{ key: "rag", label: "Knowledge AI" }, { key: "tutor", label: "AI Tutor" }]
    : [{ key: "rag", label: "AI Assistant" }];
  const [tab, setTab] = useState(TABS[0].key);

  const TITLE_MAP: Record<string, string> = {
    student:    "AI Tutor",
    teacher:    "Teacher AI Assistant",
    parent:     "Parent AI",
    admin:      "Admin AI",
    admissions: "Admissions AI",
  };

  return (
    <>
      <PageHeader
        title={TITLE_MAP[bot] ?? "SmartSchool AI"}
        subtitle="Powered by school knowledge base · RAG + Claude AI"
      />

      {TABS.length > 1 && (
        <div className="section-tabs" style={{ marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="ai-workspace">
        {tab === "rag"   && <RagChatPanel bot={bot} />}
        {tab === "tutor" && <AiTutorPanel />}
        <PredictionPanel />
      </div>
    </>
  );
}
