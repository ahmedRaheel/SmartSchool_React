/**
 * AiPage — Full AI Intelligence Centre
 * Tabs: RAG Assistant · AI Tutor (session chat) · Quiz Generator · Predictions · Agent · Config
 * Role-aware: teachers see class insights, students see personal tutor, admins see platform-wide
 */
import { useState, useRef, useEffect } from "react";
import {
  Bot, Brain, Layers, Zap, Settings, Send, RefreshCw, Plus,
  ChevronRight, FileText, AlertTriangle, CheckCircle2, Cpu,
  BookMarked, TrendingUp, Users, Sparkles, MessageSquare, X,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useAskAssistant, useStartTutorSession, useAskTutor, useGenerateQuiz,
  useStudentPrediction, useEarlyWarning, useModelConfigs, useCollections,
  useExecLogs, useCreateCollection, useIndexKnowledge,
  useAskParentAI, useHandleInquiryAI,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import type { ChatMessage } from "../hooks/useAiChat";
import { useAiChat } from "../hooks/useAiChat";

type AiTab = "assistant" | "tutor" | "quiz" | "prediction" | "agent" | "config";

const SUBJECTS = ["Mathematics","Physics","Chemistry","English","Computer Science","Biology","Pakistan Studies","Islamiyat","Urdu","Economics"];
const PRED_KINDS = [
  { value:"dropout-risk",     label:"Dropout Risk",        icon:"⚠️" },
  { value:"grade-prediction", label:"Grade Prediction",    icon:"📊" },
  { value:"attendance-risk",  label:"Attendance Risk",     icon:"📅" },
  { value:"fee-default",      label:"Fee Default Risk",    icon:"💰" },
  { value:"intervention",     label:"Intervention Need",   icon:"🎯" },
];
const RISK_COLOR: Record<string,string> = { Low:"#10B981", Medium:"#D97706", High:"#EF4444", Critical:"#7C2D12" };
const RISK_BG:    Record<string,string> = { Low:"#ECFDF5", Medium:"#FFFBEB", High:"#FFF0F1", Critical:"#FFF0F1" };

// ─── Shared message bubble ────────────────────────────────────────────────────
function MsgBubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  return (
    <div style={{ display:"flex", justifyContent:isUser?"flex-end":"flex-start", marginBottom:8 }}>
      {!isUser && (
        <div style={{ width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", marginRight:8, flexShrink:0, marginTop:4 }}>
          <Bot size={14} color="white"/>
        </div>
      )}
      <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{ padding:"10px 14px", borderRadius:isUser?"18px 18px 4px 18px":"18px 18px 18px 4px", background:isUser?"#6366F1":"var(--surface-2)", color:isUser?"white":"var(--text)", fontSize:13, lineHeight:1.6, boxShadow:"0 1px 3px rgba(0,0,0,0.08)" }}>
          {m.content}
        </div>
        {m.citations && m.citations.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {m.citations.map((c,i) => (
              <div key={i} style={{ fontSize:10, padding:"4px 8px", background:"#F0F9FF", borderRadius:6, border:"1px solid #BAE6FD", color:"#0369A1" }}>
                <FileText size={9} style={{display:"inline",marginRight:3}}/><b>{c.documentTitle}</b> · {Math.round(c.relevanceScore*100)}%
                {c.excerpt && <span style={{color:"#475569",marginLeft:6}}>{c.excerpt.slice(0,80)}…</span>}
              </div>
            ))}
          </div>
        )}
        <span style={{ fontSize:9, color:"var(--muted)", paddingLeft:4 }}>{m.timestamp.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

// ─── Chat input bar ────────────────────────────────────────────────────────────
function ChatInput({ onSend, loading, placeholder }: { onSend:(msg:string)=>void; loading:boolean; placeholder:string }) {
  const [val, setVal] = useState("");
  function send() { if (!val.trim() || loading) return; onSend(val.trim()); setVal(""); }
  return (
    <div style={{ display:"flex", gap:8, padding:"12px 16px", borderTop:"1px solid var(--line)", background:"var(--surface)" }}>
      <input value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={placeholder}
        style={{ flex:1, height:40, padding:"0 14px", border:"1.5px solid var(--line)", borderRadius:20, background:"var(--surface-2)", fontSize:13, outline:"none" }}/>
      <button onClick={send} disabled={loading||!val.trim()}
        style={{ width:40, height:40, borderRadius:"50%", border:"none", background:val.trim()&&!loading?"#6366F1":"var(--surface-2)", color:val.trim()&&!loading?"white":"var(--muted)", cursor:val.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {loading ? <RefreshCw size={16} style={{animation:"spin 1s linear infinite"}}/> : <Send size={16}/>}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── RAG ASSISTANT ────────────────────────────────────────────────────────────
function AssistantTab() {
  const tid = effectiveTenantId(useAuth().user) ?? "";
  const { messages, loading, setLoading, addMessage, clear } = useAiChat([
    { id:"sys", role:"system", content:"Ask me anything about school policy, fee schedule, academic rules, exam schedules, or any school-related topic.", citations:[], timestamp:new Date() }
  ]);
  const ask = useAskAssistant();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({behavior:"smooth"}), [messages]);

  const QUICK = ["What are the fee payment rules?","Explain the attendance policy","When is the next exam?","What subjects are offered in O-Level?"];

  async function send(msg: string) {
    addMessage("user", msg);
    setLoading(true);
    try {
      const res = await ask.mutateAsync(msg) as any;
      addMessage("assistant", res?.answer ?? "I couldn't find relevant information in the knowledge base.", res?.citations ?? []);
    } catch { addMessage("assistant", "Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="surface" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 320px)",minHeight:400}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><BookMarked size={15} style={{color:"#6366F1"}}/>RAG Knowledge Assistant</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Answers sourced exclusively from school documents — no hallucinations</div>
        </div>
        <button className="secondary" style={{fontSize:11}} onClick={clear}>Clear chat</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column"}}>
        {messages.map(m => <MsgBubble key={m.id} m={m}/>)}
        {loading && (
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={14} color="white"/></div>
            <div style={{display:"flex",gap:4}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#6366F1",animation:`bounce 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      {messages.length <= 1 && (
        <div style={{padding:"0 16px 12px",display:"flex",flexWrap:"wrap",gap:6}}>
          {QUICK.map(q=>(
            <button key={q} onClick={()=>send(q)} style={{fontSize:11,padding:"5px 12px",borderRadius:20,border:"1px solid var(--line)",background:"var(--surface-2)",cursor:"pointer",color:"var(--text)"}}>
              {q}
            </button>
          ))}
        </div>
      )}
      <ChatInput onSend={send} loading={loading} placeholder="Ask about school policies, fees, timetables, academic rules…"/>
    </div>
  );
}

// ─── AI TUTOR ─────────────────────────────────────────────────────────────────
function TutorTab() {
  const {user} = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const { messages, loading, setLoading, addMessage, clear } = useAiChat();
  const [session, setSession] = useState<{sessionId:string;conversationId:string}|null>(null);
  const [subject, setSubject] = useState("Mathematics");
  const [topic,   setTopic]   = useState("");
  const startSession = useStartTutorSession();
  const askTutor     = useAskTutor();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({behavior:"smooth"}), [messages]);

  async function start() {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await startSession.mutateAsync({tenantId:tid,studentId:user?.studentId??user?.id??"student",subject,topic}) as any;
      setSession(res);
      addMessage("system", `📚 AI Tutor session started — **${subject}** · Topic: **${topic}**\n\nHi! I'm your AI tutor. I'll help you understand ${topic} in ${subject}. Feel free to ask questions, request examples, or ask me to explain anything step by step!`);
    } catch { addMessage("system","Failed to start session. Please try again."); }
    finally { setLoading(false); }
  }

  async function send(msg: string) {
    if (!session) return;
    addMessage("user", msg);
    setLoading(true);
    try {
      const res = await askTutor.mutateAsync({tenantId:tid,sessionId:session.sessionId,studentId:user?.studentId??user?.id??"student",subject,topic,message:msg}) as any;
      addMessage("assistant", res?.answer ?? "Let me think about that…");
    } catch { addMessage("assistant","Connection error. Please try again."); }
    finally { setLoading(false); }
  }

  function endSess() { setSession(null); clear(); setTopic(""); }

  return (
    <div className="surface" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 320px)",minHeight:400}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><Brain size={15} style={{color:"#8B5CF6"}}/>AI Tutor</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Adaptive learning powered by Ollama LLM · personalised to your level</div>
        </div>
        {session && <button className="secondary" style={{fontSize:11,color:"var(--danger)"}} onClick={endSess}>End session</button>}
      </div>

      {!session ? (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:360,display:"flex",flexDirection:"column",gap:14,padding:24}}>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                <Brain size={28} color="white"/>
              </div>
              <h3 style={{margin:"0 0 4px"}}>Start a tutoring session</h3>
              <p style={{fontSize:12,color:"var(--muted)",margin:0}}>Choose your subject and topic to begin</p>
            </div>
            <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4}}>
              Subject
              <select value={subject} onChange={e=>setSubject(e.target.value)}
                style={{height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}>
                {SUBJECTS.map(s=><option key={s}>{s}</option>)}
              </select>
            </label>
            <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4}}>
              Topic / Chapter
              <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Quadratic Equations, Photosynthesis…"
                style={{height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}/>
            </label>
            <button className="primary" onClick={start} disabled={!topic.trim()||loading}
              style={{height:44,fontSize:14,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {loading?<><RefreshCw size={15} style={{animation:"spin 1s linear infinite"}}/>Starting…</>:<><Sparkles size={15}/>Start tutoring</>}
            </button>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {["Quadratic Equations","Organic Chemistry","Motion & Forces","Grammar Rules"].map(t=>(
                <button key={t} onClick={()=>setTopic(t)} style={{fontSize:11,padding:"4px 10px",borderRadius:20,border:"1px solid var(--line)",background:"var(--surface-2)",cursor:"pointer"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column"}}>
            {messages.map(m => <MsgBubble key={m.id} m={m}/>)}
            {loading && (
              <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center"}}><Bot size={14} color="white"/></div>
                <div style={{display:"flex",gap:4}}>
                  {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#8B5CF6",animation:`bounce 1.2s ${i*0.2}s ease-in-out infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={endRef}/>
          </div>
          <ChatInput onSend={send} loading={loading} placeholder={`Ask about ${topic} in ${subject}…`}/>
        </>
      )}
    </div>
  );
}

// ─── QUIZ GENERATOR ────────────────────────────────────────────────────────────
function QuizTab() {
  const {user} = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic]     = useState("");
  const [count, setCount]     = useState(5);
  const [diff, setDiff]       = useState("medium");
  const [quiz, setQuiz]       = useState<any|null>(null);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft]   = useState<number|null>(null);
  const timerRef = useRef<any>(null);
  const generateQuiz = useGenerateQuiz();

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { setSubmitted(true); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => (t??1)-1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  async function generate() {
    if (!topic.trim()) return;
    const res = await generateQuiz.mutateAsync({tenantId:tid,studentId:user?.studentId??user?.id??"s",subject,topic,questionCount:count,difficulty:diff}) as any;
    setQuiz(res); setAnswers({}); setSubmitted(false);
    setTimeLeft(count * 60); // 1 min per question
  }

  function reset() { setQuiz(null); setAnswers({}); setSubmitted(false); setTimeLeft(null); clearTimeout(timerRef.current); }

  const score = quiz ? Object.entries(answers).filter(([qi,opt])=>opt===(quiz.questions??[])[Number(qi)]?.correctAnswer).length : 0;
  const total  = quiz?.questions?.length ?? 0;
  const pct    = total > 0 ? Math.round((score/total)*100) : 0;

  const fmt = (s:number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="surface" style={{overflow:"auto"}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><Layers size={15} style={{color:"#059669"}}/>AI Quiz Generator</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Adaptive quizzes with explanations · timed for exam practice</div>
        </div>
        {quiz && <button className="secondary" style={{fontSize:11}} onClick={reset}>New quiz</button>}
      </div>
      <div style={{padding:20}}>
        {!quiz ? (
          <div style={{maxWidth:500}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4,gridColumn:"1/-1"}}>
                Subject
                <select value={subject} onChange={e=>setSubject(e.target.value)} style={{height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}>
                  {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                </select>
              </label>
              <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4,gridColumn:"1/-1"}}>
                Topic
                <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Quadratic Equations"
                  style={{height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}/>
              </label>
              <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4}}>
                Questions: <b style={{color:"#6366F1"}}>{count}</b>
                <input type="range" min={3} max={10} value={count} onChange={e=>setCount(Number(e.target.value))} style={{marginTop:4}}/>
              </label>
              <label style={{fontSize:12,fontWeight:600,display:"flex",flexDirection:"column",gap:4}}>
                Difficulty
                <select value={diff} onChange={e=>setDiff(e.target.value)} style={{height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:13}}>
                  {["easy","medium","hard","adaptive"].map(d=><option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <button className="primary" onClick={generate} disabled={!topic.trim()||generateQuiz.isPending}
              style={{height:44,fontSize:14,borderRadius:12,width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              {generateQuiz.isPending?<><RefreshCw size={15} style={{animation:"spin 1s linear infinite"}}/>Generating…</>:<><Sparkles size={15}/>Generate {count}-question quiz</>}
            </button>
          </div>
        ) : (
          <div style={{maxWidth:640}}>
            {/* Timer + header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <b style={{fontSize:14}}>{subject} · {topic}</b>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{total} questions · {diff}</div>
              </div>
              {timeLeft !== null && !submitted && (
                <div style={{padding:"6px 16px",borderRadius:20,background:timeLeft<60?"#FFF0F1":"#EEF2FF",border:`1px solid ${timeLeft<60?"#fecdd3":"#C7D2FE"}`,fontSize:13,fontWeight:700,color:timeLeft<60?"#EF4444":"#6366F1"}}>
                  ⏱ {fmt(timeLeft)}
                </div>
              )}
              {submitted && (
                <div style={{padding:"8px 16px",borderRadius:20,background:pct>=70?"#ECFDF5":"#FFF0F1",border:`1px solid ${pct>=70?"#a7f3d0":"#fecdd3"}`,fontSize:14,fontWeight:800,color:pct>=70?"#059669":"#EF4444"}}>
                  {score}/{total} · {pct}%
                </div>
              )}
            </div>

            {(quiz.questions??[]).map((q:any,qi:number)=>(
              <div key={qi} style={{padding:"16px",border:"1.5px solid var(--line)",borderRadius:12,marginBottom:12,background:"var(--surface)"}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:10,lineHeight:1.5}}>
                  <span style={{fontSize:11,color:"var(--muted)",marginRight:8}}>Q{qi+1}.</span>{q.question}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {(q.options??[]).map((opt:string)=>{
                    const sel = answers[qi]===opt;
                    const correct = submitted && opt===q.correctAnswer;
                    const wrong   = submitted && sel && opt!==q.correctAnswer;
                    return (
                      <button key={opt} onClick={()=>!submitted&&setAnswers(p=>({...p,[qi]:opt}))}
                        style={{textAlign:"left",padding:"10px 14px",border:`1.5px solid ${correct?"#10B981":wrong?"#EF4444":sel?"#6366F1":"var(--line)"}`,borderRadius:8,background:correct?"#ECFDF5":wrong?"#FFF0F1":sel?"#EEF2FF":"var(--surface)",fontSize:12,cursor:submitted?"default":"pointer",transition:"all .12s",fontWeight:sel||correct?600:400}}>
                        {correct?"✓ ":wrong?"✗ ":""}{opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && answers[qi]!==q.correctAnswer && q.explanation && (
                  <div style={{marginTop:10,fontSize:12,color:"#0369A1",padding:"8px 12px",background:"#F0F9FF",borderRadius:8,lineHeight:1.55}}>
                    💡 {q.explanation}
                  </div>
                )}
              </div>
            ))}

            {!submitted && (
              <button className="primary" onClick={()=>{setSubmitted(true);setTimeLeft(null);clearTimeout(timerRef.current);}}
                style={{width:"100%",height:44,fontSize:14,borderRadius:12}}>
                Submit answers
              </button>
            )}
            {submitted && (
              <div style={{padding:"16px",background:pct>=70?"#ECFDF5":"#FFF0F1",borderRadius:12,textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:800,color:pct>=70?"#059669":"#EF4444",marginBottom:4}}>{score}/{total} correct ({pct}%)</div>
                <div style={{fontSize:13,color:"var(--muted)"}}>{pct>=80?"Excellent work!":pct>=60?"Good effort — review the explanations above.":"Keep practising — review the material and try again."}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PREDICTIONS ───────────────────────────────────────────────────────────────
function PredictionTab() {
  const {user} = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [kind, setKind]         = useState("dropout-risk");
  const [studentId, setStudentId] = useState(user?.studentId ?? "");
  const [result, setResult]     = useState<any|null>(null);
  const predict = useStudentPrediction();
  const { data: warnings } = useEarlyWarning(studentId || user?.studentId || "");

  // Class-wide early warnings for teachers/admins
  const earlyWarnings = Array.isArray(warnings) ? warnings : [];

  async function run() {
    const res = await predict.mutateAsync({kind, studentId:studentId||user?.studentId||user?.id||"s"}) as any;
    setResult(res);
  }

  const isAdminRole = ["schooladmin","admin","principal","teacher"].some(r=>user?.role?.toLowerCase().includes(r));

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Early warnings for admin/teacher */}
      {isAdminRole && earlyWarnings.length > 0 && (
        <div className="surface">
          <div className="surface-head"><div><h3 style={{display:"flex",alignItems:"center",gap:8}}><AlertTriangle size={15} style={{color:"#D97706"}}/>Early Warning System</h3><p>AI-flagged students needing attention</p></div></div>
          <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:8}}>
            {earlyWarnings.map((w:any,i:number)=>(
              <div key={i} style={{padding:"12px 14px",border:`1.5px solid ${RISK_COLOR[w.riskLevel]||"#D97706"}30`,borderRadius:12,background:RISK_BG[w.riskLevel]||"#FFFBEB"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <b style={{fontSize:12}}>{w.kind}</b>
                  <span style={{padding:"2px 10px",borderRadius:20,background:RISK_COLOR[w.riskLevel]||"#D97706",color:"white",fontSize:10,fontWeight:700}}>{w.riskLevel} Risk</span>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {(Array.isArray(w.factors)?w.factors:[]).map((f:string,fi:number)=>(
                    <span key={fi} style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(0,0,0,0.08)"}}>{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run prediction */}
      <div className="surface">
        <div className="surface-head"><div><h3 style={{display:"flex",alignItems:"center",gap:8}}><Zap size={15} style={{color:"#6366F1"}}/>Run AI Prediction</h3><p>ML-powered risk analysis · student-level granularity</p></div></div>
        <div style={{padding:"0 20px 20px"}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {PRED_KINDS.map(p=>(
              <button key={p.value} onClick={()=>setKind(p.value)}
                style={{padding:"8px 14px",borderRadius:10,border:`1.5px solid ${kind===p.value?"#6366F1":"var(--line)"}`,background:kind===p.value?"#EEF2FF":"var(--surface)",color:kind===p.value?"#6366F1":"var(--text)",fontSize:12,cursor:"pointer",fontWeight:kind===p.value?700:400}}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
          {isAdminRole && (
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,fontWeight:600,display:"block",marginBottom:4}}>Student ID</label>
              <input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="Enter student UUID or leave blank to use your own"
                style={{width:"100%",height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:12}}/>
            </div>
          )}
          <button className="primary" onClick={run} disabled={predict.isPending}
            style={{height:40,fontSize:13,borderRadius:10,display:"flex",alignItems:"center",gap:8,padding:"0 20px"}}>
            {predict.isPending?<><RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>Analysing…</>:<><Zap size={14}/>Run prediction</>}
          </button>

          {result && (
            <div style={{marginTop:16,padding:"16px 18px",background:RISK_BG[result.riskLevel]??"#FFFBEB",border:`1.5px solid ${RISK_COLOR[result.riskLevel]??"#D97706"}`,borderRadius:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                <b style={{fontSize:14}}>{result.kind}</b>
                <span style={{padding:"5px 14px",borderRadius:20,background:RISK_COLOR[result.riskLevel]??"#D97706",color:"white",fontSize:12,fontWeight:700}}>
                  {result.riskLevel} Risk
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
                {[["Score",`${Math.round((result.score||0)*100)}%`],["Probability",`${Math.round((result.probability||0)*100)}%`],["Confidence",`${Math.round((result.confidence||0)*100)}%`]].map(([l,v])=>(
                  <div key={l} style={{textAlign:"center",padding:"10px",background:"rgba(255,255,255,0.7)",borderRadius:10}}>
                    <div style={{fontSize:10,color:"var(--muted)",marginBottom:2}}>{l}</div>
                    <b style={{fontSize:18}}>{v}</b>
                  </div>
                ))}
              </div>
              <p style={{fontSize:13,fontWeight:600,margin:"0 0 10px"}}>{result.outcome}</p>
              {Array.isArray(result.factors) && result.factors.length > 0 && (
                <div>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:6}}>Contributing factors:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {result.factors.map((f:string,i:number)=>(
                      <span key={i} style={{padding:"3px 10px",borderRadius:20,background:"rgba(0,0,0,0.08)",fontSize:11}}>{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginTop:12,fontSize:10,color:"var(--muted)"}}>Model: {result.modelVersion} · ML: {result.usedMachineLearning?"Yes":"No"}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AI AGENT ──────────────────────────────────────────────────────────────────
const AGENT_TASKS = [
  { id:"t1", label:"Analyse class performance and identify weak students", category:"Academic" },
  { id:"t2", label:"Generate weekly attendance report summary",            category:"Attendance"},
  { id:"t3", label:"Identify students with outstanding fees",              category:"Finance"  },
  { id:"t4", label:"Summarise parent feedback from last month",             category:"Communication"},
  { id:"t5", label:"Predict students at dropout risk this term",           category:"Prediction"},
  { id:"t6", label:"Generate exam schedule recommendations",               category:"Exams"    },
  { id:"t7", label:"Check document compliance for all students",           category:"Documents"},
  { id:"t8", label:"Recommend intervention plans for at-risk students",    category:"Welfare"  },
];

const CAT_COLOR: Record<string,string> = {
  Academic:"#6366F1",Attendance:"#059669",Finance:"#D97706",Communication:"#2563EB",
  Prediction:"#8B5CF6",Exams:"#DC2626",Documents:"#0891B2",Welfare:"#7C3AED",
};

function AgentTab() {
  const {user} = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const { messages, loading, setLoading, addMessage, clear } = useAiChat([
    { id:"sys", role:"system", content:"👋 I'm your AI Agent. I can run complex school management tasks, analyse data across modules, and generate actionable insights. Tell me what you need or select a task below.", citations:[], timestamp:new Date() }
  ]);
  const ask = useAskAssistant();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({behavior:"smooth"}), [messages]);

  async function runTask(task: string) {
    addMessage("user", `Run task: ${task}`);
    setLoading(true);
    try {
      const res = await ask.mutateAsync(`Agent task: ${task}. Analyse the school data and provide a detailed, actionable report with specific numbers and recommendations.`) as any;
      addMessage("assistant", res?.answer ?? "Task completed. Please review the analysis above.", res?.citations??[]);
    } catch { addMessage("assistant","Task failed. Please check connectivity and try again."); }
    finally { setLoading(false); }
  }

  async function send(msg: string) {
    addMessage("user", msg);
    setLoading(true);
    try {
      const res = await ask.mutateAsync(msg) as any;
      addMessage("assistant", res?.answer ?? "Processing…", res?.citations??[]);
    } catch { addMessage("assistant","Connection error."); }
    finally { setLoading(false); }
  }

  return (
    <div className="surface" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 320px)",minHeight:400}}>
      <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8}}><Cpu size={15} style={{color:"#059669"}}/>AI Agent</div>
          <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Autonomous school management tasks · multi-module analysis</div>
        </div>
        <button className="secondary" style={{fontSize:11}} onClick={clear}>Clear</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column"}}>
        {messages.map(m=><MsgBubble key={m.id} m={m}/>)}
        {loading && (
          <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#059669,#10B981)",display:"flex",alignItems:"center",justifyContent:"center"}}><Cpu size={14} color="white"/></div>
            <div style={{fontSize:12,color:"var(--muted)"}}>Agent is processing…</div>
          </div>
        )}
        <div ref={endRef}/>
      </div>
      {messages.length <= 1 && (
        <div style={{padding:"0 16px 12px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"var(--muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:.8}}>Quick tasks</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {AGENT_TASKS.map(t=>(
              <button key={t.id} onClick={()=>runTask(t.label)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"1px solid var(--line)",borderRadius:8,background:"var(--surface-2)",cursor:"pointer",textAlign:"left"}}>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:`${CAT_COLOR[t.category]||"#6366F1"}15`,color:CAT_COLOR[t.category]||"#6366F1",fontWeight:700,flexShrink:0}}>
                  {t.category}
                </span>
                <span style={{fontSize:12,flex:1}}>{t.label}</span>
                <ChevronRight size={12} style={{color:"var(--muted)",flexShrink:0}}/>
              </button>
            ))}
          </div>
        </div>
      )}
      <ChatInput onSend={send} loading={loading} placeholder="Describe a task for the AI agent…"/>
    </div>
  );
}

// ─── AI CONFIG ─────────────────────────────────────────────────────────────────
function ConfigTab() {
  const {user} = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const { data: modelsData } = useModelConfigs();
  const { data: collectionsData } = useCollections();
  const { data: logsData }   = useExecLogs();
  const createCol  = useCreateCollection();
  const indexDoc   = useIndexKnowledge();
  const [colName, setColName] = useState("");
  const [colTab, setColTab]   = useState<"models"|"collections"|"logs">("models");

  const models      = (modelsData as any)?.items      ?? (modelsData as any)      ?? [];
  const collections = (collectionsData as any)?.items ?? (collectionsData as any) ?? [];
  const logs        = (logsData as any)?.items         ?? (logsData as any)         ?? [];

  async function addCollection() {
    if (!colName.trim()) return;
    await createCol.mutateAsync({tenantId:tid,name:colName.trim(),metadataJson:JSON.stringify({slug:colName.trim().toLowerCase().replace(/\s+/g,"-"),docs:0,chunks:0,active:true})});
    setColName("");
  }

  function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="surface">
        <div className="surface-head"><h3 style={{display:"flex",alignItems:"center",gap:8}}><Settings size={15}/>AI Platform Configuration</h3></div>
        <div style={{padding:"0 0 0"}}>
          <div className="section-tabs" style={{padding:"0 20px",marginBottom:0}}>
            <button className={colTab==="models"?"active":""} onClick={()=>setColTab("models")}>🤖 Models ({models.length})</button>
            <button className={colTab==="collections"?"active":""} onClick={()=>setColTab("collections")}>📚 Knowledge ({collections.length})</button>
            <button className={colTab==="logs"?"active":""} onClick={()=>setColTab("logs")}>📋 Exec logs</button>
          </div>

          {colTab==="models" && (
            <div style={{padding:20}}>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {models.map((m:any)=>{
                  const meta = parseMeta(m.metadataJson);
                  return (
                    <div key={m.id} style={{padding:"12px 16px",border:"1.5px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:36,height:36,borderRadius:10,background:meta.active?"#EEF2FF":"var(--surface-2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <Brain size={18} style={{color:meta.active?"#6366F1":"var(--muted)"}}/>
                      </div>
                      <div style={{flex:1}}>
                        <b style={{fontSize:13,display:"block"}}>{m.name}</b>
                        <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{meta.provider} · {meta.model} · temp={meta.temp}</div>
                      </div>
                      <span style={{padding:"3px 12px",borderRadius:20,fontSize:10,fontWeight:700,background:meta.active?"#ECFDF5":"var(--surface-2)",color:meta.active?"#059669":"var(--muted)"}}>
                        {meta.active?"Active":"Inactive"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {colTab==="collections" && (
            <div style={{padding:20}}>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <input value={colName} onChange={e=>setColName(e.target.value)} placeholder="New knowledge collection name"
                  style={{flex:1,height:38,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:10,background:"var(--surface)",fontSize:12}}/>
                <button className="primary" style={{height:38,fontSize:12,padding:"0 16px"}} onClick={addCollection} disabled={!colName.trim()||createCol.isPending}>
                  <Plus size={14}/>
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {collections.map((c:any)=>{
                  const meta = parseMeta(c.metadataJson);
                  return (
                    <div key={c.id} style={{padding:"12px 16px",border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
                      <BookMarked size={16} style={{color:"#6366F1",flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <b style={{fontSize:12}}>{c.name}</b>
                        <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{meta.docs||0} docs · {meta.chunks||0} chunks</div>
                      </div>
                      <button className="secondary" style={{fontSize:10,height:28}} onClick={()=>indexDoc.mutateAsync({tenantId:tid,collectionId:c.id})}>
                        {indexDoc.isPending?"Indexing…":"Re-index"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {colTab==="logs" && (
            <div style={{padding:"0 20px 20px"}}>
              <div className="table-wrap">
                <table className="premium-table">
                  <thead><tr><th>Operation</th><th>Actor</th><th>Provider</th><th>Tokens</th><th>Latency</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    {logs.length===0?<tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No execution logs yet.</td></tr>
                    :logs.map((l:any)=>{
                      const meta = parseMeta(l.metadataJson);
                      return (
                        <tr key={l.id}>
                          <td><code style={{fontSize:11}}>{meta.op||l.name}</code></td>
                          <td style={{fontSize:11}}>{meta.actor||"—"}</td>
                          <td style={{fontSize:11}}>{meta.provider||"—"}</td>
                          <td>{meta.tokens||0}</td>
                          <td style={{fontSize:11}}>{meta.ms||0}ms</td>
                          <td><span className={`status-pill ${meta.status==="Success"?"success":"danger"}`}>{meta.status||"—"}</span></td>
                          <td style={{fontSize:10,color:"var(--muted)"}}>{meta.at?new Date(meta.at).toLocaleString():"—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────
export function AiPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? "";
  const [tab, setTab] = useState<AiTab>(role.includes("student") ? "tutor" : "assistant");

  const TABS: {id:AiTab; label:string; icon:React.ReactNode; roles?:string[]}[] = [
    { id:"assistant",  label:"RAG Assistant", icon:<BookMarked size={13}/> },
    { id:"tutor",      label:"AI Tutor",       icon:<Brain size={13}/> },
    { id:"quiz",       label:"Quiz",           icon:<Layers size={13}/> },
    { id:"prediction", label:"Predictions",   icon:<TrendingUp size={13}/> },
    { id:"agent",      label:"AI Agent",       icon:<Cpu size={13}/>,    roles:["admin","schooladmin","principal","teacher","superadmin"] },
    { id:"config",     label:"Config",         icon:<Settings size={13}/>,roles:["admin","schooladmin","principal","superadmin"] },
  ];

  const visibleTabs = TABS.filter(t => !t.roles || t.roles.some(r => role.includes(r)));

  return (
    <>
      <PageHeader title="AI Intelligence Centre" subtitle="RAG · Tutor · Predictions · Agent · Knowledge management"/>
      <div className="section-tabs" style={{marginBottom:16}}>
        {visibleTabs.map(t=>(
          <button key={t.id} className={tab===t.id?"active":""} onClick={()=>setTab(t.id)}
            style={{display:"flex",alignItems:"center",gap:6}}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      {tab==="assistant"  && <AssistantTab/>}
      {tab==="tutor"      && <TutorTab/>}
      {tab==="quiz"       && <QuizTab/>}
      {tab==="prediction" && <PredictionTab/>}
      {tab==="agent"      && <AgentTab/>}
      {tab==="config"     && <ConfigTab/>}
    </>
  );
}
