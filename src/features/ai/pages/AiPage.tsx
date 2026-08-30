import { useState } from "react";
import { Bot, Brain, Layers, Zap } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAskAssistant, useStartTutorSession, useAskTutor, useGenerateQuiz, useStudentPrediction } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type AiTab = "assistant"|"tutor"|"quiz"|"prediction";

export function AiPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<AiTab>("assistant");

  // Assistant
  const [question, setQuestion] = useState("");
  const [answer, setAnswer]     = useState<string|null>(null);
  const [citations, setCitations] = useState<any[]>([]);
  const askAssistant = useAskAssistant();

  // Tutor
  const [subject, setSubject]       = useState("Mathematics");
  const [topic, setTopic]           = useState("Algebra");
  const [session, setSession]       = useState<{sessionId:string;conversationId:string}|null>(null);
  const [tutorMessages, setTutorMsg]= useState<{role:string;content:string}[]>([]);
  const [tutorInput, setTutorInput] = useState("");
  const startSession = useStartTutorSession();
  const askTutor     = useAskTutor();

  // Quiz
  const [qSubject, setQSubject] = useState("Mathematics");
  const [qTopic,   setQTopic]   = useState("Algebra");
  const [quiz,     setQuiz]     = useState<any|null>(null);
  const [selected, setSelected] = useState<Record<number,string>>({});
  const [submitted, setSubmitted] = useState(false);
  const generateQuiz = useGenerateQuiz();

  // Prediction
  const [predKind, setPredKind] = useState("dropout-risk");
  const [predResult, setPredResult] = useState<any|null>(null);
  const predict = useStudentPrediction();

  async function doAsk() {
    if (!question.trim()) return;
    const res = await askAssistant.mutateAsync(question) as any;
    setAnswer(res?.answer ?? "No response");
    setCitations(res?.citations ?? []);
    setQuestion("");
  }

  async function startTutor() {
    const res = await startSession.mutateAsync({ tenantId:tid, studentId: user?.studentId ?? user?.id ?? "student", subject, topic }) as any;
    setSession(res); setTutorMsg([]);
  }

  async function sendTutorMsg() {
    if (!tutorInput.trim() || !session) return;
    setTutorMsg(p => [...p, { role:"user", content:tutorInput }]);
    const res = await askTutor.mutateAsync({ tenantId:tid, sessionId:session.sessionId, studentId:user?.studentId??user?.id??"student", subject, topic, message:tutorInput }) as any;
    setTutorMsg(p => [...p, { role:"assistant", content:res?.answer ?? "…" }]);
    setTutorInput("");
  }

  async function doGenerateQuiz() {
    const res = await generateQuiz.mutateAsync({ tenantId:tid, studentId:user?.studentId??user?.id??"student", subject:qSubject, topic:qTopic, questionCount:3, difficulty:"adaptive" }) as any;
    setQuiz(res); setSelected({}); setSubmitted(false);
  }

  async function doPredict() {
    const res = await predict.mutateAsync({ kind:predKind, studentId:user?.studentId??user?.id??"student" }) as any;
    setPredResult(res);
  }

  const RISK_COLOR: Record<string,string> = { Low:"#10B981", Medium:"#D97706", High:"#EF4444", Critical:"#7C2D12" };
  const RISK_BG: Record<string,string>    = { Low:"#ECFDF5", Medium:"#FFFBEB", High:"#FFF0F1", Critical:"#FFF0F1" };

  return (
    <>
      <PageHeader title="AI Intelligence" subtitle="RAG assistant, AI Tutor, quiz generation and predictive analytics"/>
      <div className="section-tabs" style={{ marginBottom:16 }}>
        <button className={tab==="assistant"?"active":""} onClick={()=>setTab("assistant")}><Bot size={13}/> AI Assistant</button>
        <button className={tab==="tutor"?"active":""}     onClick={()=>setTab("tutor")}><Brain size={13}/> AI Tutor</button>
        <button className={tab==="quiz"?"active":""}      onClick={()=>setTab("quiz")}><Layers size={13}/> Quiz Generator</button>
        <button className={tab==="prediction"?"active":""}onClick={()=>setTab("prediction")}><Zap size={13}/> Predictions</button>
      </div>

      {tab === "assistant" && (
        <div className="surface">
          <div className="surface-head"><div><h3>AI Assistant</h3><p>Ask anything — sourced from school knowledge base only</p></div></div>
          <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:8 }}>
              <input value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAsk()} placeholder="Ask about school policy, academic rules, fee schedule, timetable…"
                style={{ flex:1, height:44, padding:"0 14px", border:"1.5px solid var(--line)", borderRadius:10, background:"var(--surface)", fontSize:13 }}/>
              <button className="primary" style={{ height:44, padding:"0 20px" }} onClick={doAsk} disabled={askAssistant.isPending}>
                {askAssistant.isPending ? "Thinking…" : "Ask →"}
              </button>
            </div>
            {answer && (
              <div style={{ padding:"14px 16px", background:"#F0F9FF", border:"1px solid #BAE6FD", borderRadius:12 }}>
                <div style={{ fontSize:12, fontWeight:600, marginBottom:8, color:"#0369A1" }}>AI Response</div>
                <p style={{ fontSize:13, lineHeight:1.65, margin:0 }}>{answer}</p>
                {citations.length > 0 && (
                  <div style={{ marginTop:12, borderTop:"1px solid #BAE6FD", paddingTop:10 }}>
                    <div style={{ fontSize:11, color:"#0369A1", fontWeight:600, marginBottom:6 }}>Sources ({citations.length})</div>
                    {citations.map((c:any,i:number) => (
                      <div key={i} style={{ fontSize:11, padding:"6px 10px", background:"white", borderRadius:6, marginBottom:4, border:"1px solid #E0F2FE" }}>
                        <b>{c.documentTitle}</b> <span style={{ color:"var(--muted)" }}>· relevance: {Math.round(c.relevanceScore*100)}%</span>
                        {c.excerpt && <div style={{ marginTop:3, color:"#475569" }}>{c.excerpt}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "tutor" && (
        <div className="surface">
          <div className="surface-head"><div><h3>AI Tutor</h3><p>Interactive tutoring powered by Ollama LLM</p></div></div>
          <div style={{ padding:"0 20px 20px" }}>
            {!session ? (
              <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:400 }}>
                <label style={{ fontSize:12 }}>Subject
                  <select value={subject} onChange={e=>setSubject(e.target.value)} style={{ display:"block", width:"100%", marginTop:4, height:36, padding:"0 10px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)" }}>
                    {["Mathematics","Physics","Chemistry","English","Computer Science","Biology","History","Islamiyat"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </label>
                <label style={{ fontSize:12 }}>Topic
                  <input value={topic} onChange={e=>setTopic(e.target.value)} style={{ display:"block", width:"100%", marginTop:4, height:36, padding:"0 10px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)" }}/>
                </label>
                <button className="primary" onClick={startTutor} disabled={startSession.isPending}>{startSession.isPending?"Starting…":"Start tutoring session"}</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", height:400 }}>
                <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:8, paddingBottom:8 }}>
                  <div style={{ padding:"8px 12px", background:"#EEF2FF", borderRadius:8, fontSize:11, color:"#6366F1" }}>
                    📚 AI Tutor session started — Subject: <b>{subject}</b> · Topic: <b>{topic}</b>
                  </div>
                  {tutorMessages.map((m,i) => (
                    <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                      <div style={{ maxWidth:"80%", padding:"8px 12px", borderRadius:10, fontSize:12, background:m.role==="user"?"var(--navy)":"var(--surface-2)", color:m.role==="user"?"white":"var(--text)", lineHeight:1.55 }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {askTutor.isPending && <div style={{ fontSize:12, color:"var(--muted)", padding:"4px 12px" }}>Tutor is thinking…</div>}
                </div>
                <div style={{ display:"flex", gap:8, paddingTop:8, borderTop:"1px solid var(--line)" }}>
                  <input value={tutorInput} onChange={e=>setTutorInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendTutorMsg()} placeholder="Ask your tutor…"
                    style={{ flex:1, height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}/>
                  <button className="primary" onClick={sendTutorMsg} disabled={askTutor.isPending}>Send</button>
                  <button className="secondary" onClick={() => setSession(null)}>End</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "quiz" && (
        <div className="surface">
          <div className="surface-head"><div><h3>Quiz Generator</h3><p>AI-generated quizzes with explanations</p></div></div>
          <div style={{ padding:"0 20px 20px" }}>
            {!quiz ? (
              <div style={{ display:"flex", gap:8, alignItems:"flex-end", flexWrap:"wrap" }}>
                <label style={{ fontSize:12 }}>Subject
                  <select value={qSubject} onChange={e=>setQSubject(e.target.value)} style={{ display:"block", marginTop:4, height:36, padding:"0 10px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}>
                    {["Mathematics","Physics","Chemistry","English","Computer Science","Biology"].map(s=><option key={s}>{s}</option>)}
                  </select>
                </label>
                <label style={{ fontSize:12, flex:1 }}>Topic
                  <input value={qTopic} onChange={e=>setQTopic(e.target.value)} style={{ display:"block", width:"100%", marginTop:4, height:36, padding:"0 10px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}/>
                </label>
                <button className="primary" onClick={doGenerateQuiz} disabled={generateQuiz.isPending}>{generateQuiz.isPending?"Generating…":"Generate quiz"}</button>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <b style={{ fontSize:13 }}>Quiz: {qSubject} — {qTopic}</b>
                  <button className="secondary" style={{ fontSize:11 }} onClick={() => { setQuiz(null); setSelected({}); setSubmitted(false); }}>Try another</button>
                </div>
                {(quiz.questions ?? []).map((q:any, qi:number) => (
                  <div key={qi} style={{ padding:"12px 14px", background:"var(--surface-2)", borderRadius:10 }}>
                    <b style={{ fontSize:12, display:"block", marginBottom:8 }}>Q{qi+1}. {q.question}</b>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {(q.options ?? []).map((opt:string) => {
                        const isSelected = selected[qi] === opt;
                        const isCorrect  = submitted && opt === q.correctAnswer;
                        const isWrong    = submitted && isSelected && opt !== q.correctAnswer;
                        return (
                          <button key={opt} onClick={() => !submitted && setSelected(p=>({...p,[qi]:opt}))}
                            style={{ textAlign:"left", padding:"8px 12px", border:`1.5px solid ${isCorrect?"#10B981":isWrong?"#EF4444":isSelected?"var(--navy)":"var(--line)"}`, borderRadius:8, background:isCorrect?"#ECFDF5":isWrong?"#FFF0F1":isSelected?"#EEF2FF":"var(--surface)", fontSize:11, cursor:submitted?"default":"pointer" }}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {submitted && selected[qi] !== q.correctAnswer && q.explanation && (
                      <div style={{ marginTop:8, fontSize:11, color:"#0369A1", padding:"6px 10px", background:"#F0F9FF", borderRadius:6 }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
                {!submitted && (
                  <button className="primary" onClick={() => setSubmitted(true)}>Submit answers</button>
                )}
                {submitted && (
                  <div style={{ padding:"12px 16px", background:"#EEF2FF", borderRadius:10, fontSize:12 }}>
                    Score: <b>{Object.entries(selected).filter(([qi,opt]) => opt === (quiz.questions??[])[Number(qi)]?.correctAnswer).length}/{(quiz.questions??[]).length}</b>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "prediction" && (
        <div className="surface">
          <div className="surface-head"><div><h3>AI Predictions</h3><p>ML-powered student risk and performance analysis</p></div></div>
          <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:12 }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <select value={predKind} onChange={e=>setPredKind(e.target.value)}
                style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}>
                <option value="dropout-risk">Dropout Risk</option>
                <option value="grade-prediction">Grade Prediction</option>
                <option value="attendance-risk">Attendance Risk</option>
                <option value="intervention-need">Intervention Need</option>
              </select>
              <button className="primary" onClick={doPredict} disabled={predict.isPending}>{predict.isPending?"Analysing…":"Run prediction"}</button>
            </div>
            {predResult && (
              <div style={{ padding:"16px 18px", background:RISK_BG[predResult.riskLevel]??"#F0F9FF", border:`1.5px solid ${RISK_COLOR[predResult.riskLevel]??"#2563EB"}`, borderRadius:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <b style={{ fontSize:13 }}>{predResult.kind}</b>
                  <span style={{ padding:"4px 12px", borderRadius:20, background:RISK_COLOR[predResult.riskLevel]??"#2563EB", color:"white", fontSize:11, fontWeight:700 }}>
                    {predResult.riskLevel} Risk
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                  {[["Score",`${Math.round(predResult.score*100)}%`],["Probability",`${Math.round(predResult.probability*100)}%`],["Confidence",`${Math.round(predResult.confidence*100)}%`]].map(([l,v]) => (
                    <div key={l} style={{ textAlign:"center", padding:"8px", background:"white", borderRadius:8, fontSize:11 }}>
                      <div style={{ color:"var(--muted)" }}>{l}</div>
                      <b style={{ fontSize:16 }}>{v}</b>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize:12, margin:"0 0 10px", fontWeight:600 }}>{predResult.outcome}</p>
                {Array.isArray(predResult.factors) && predResult.factors.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginBottom:6 }}>Contributing factors:</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {predResult.factors.map((f:string,i:number) => (
                        <span key={i} style={{ padding:"3px 10px", borderRadius:20, background:"rgba(0,0,0,0.06)", fontSize:11 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginTop:10, fontSize:10, color:"var(--muted)" }}>Model: {predResult.modelVersion} · ML: {predResult.usedMachineLearning?"Yes":"No"}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
