import { useState } from "react";
import { BookOpen, Clock, DollarSign, TrendingUp, Zap, Send, Bot, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useStudentDashboard, useAssignments, useInvoices, useAskChatbot } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => `PKR ${Number(n||0).toLocaleString()}`;
const GRADE_COLOR: Record<string,string> = { "A+":"#10B981","A":"#10B981","B+":"#2563EB","B":"#2563EB","C+":"#D97706","C":"#D97706","D":"#EF4444","F":"#EF4444" };

const MY_COURSES = [
  { subject:"Mathematics",   teacher:"Ms. Aisha Siddiqui", grade:"B+", pct:82, credits:4 },
  { subject:"Physics",       teacher:"Mr. Tariq Jameel",   grade:"A",  pct:91, credits:4 },
  { subject:"English",       teacher:"Mrs. Rehana Pervez", grade:"B",  pct:78, credits:3 },
  { subject:"Computer Sci.", teacher:"Dr. Noman Arif",     grade:"A+", pct:97, credits:4 },
  { subject:"History",       teacher:"Mr. Fahad Ali",      grade:"C+", pct:68, credits:3 },
  { subject:"Chemistry",     teacher:"Ms. Zara Khan",      grade:"B+", pct:84, credits:4 },
];

const TIMETABLE: Record<string,{subject:string;time:string;room:string}[]> = {
  Mon:[{subject:"Mathematics",time:"8:00–9:00",room:"101"},{subject:"English",time:"9:00–10:00",room:"204"},{subject:"Physics",time:"11:00–12:00",room:"Lab 1"}],
  Tue:[{subject:"Computer Sci.",time:"8:00–9:00",room:"Lab 2"},{subject:"Chemistry",time:"10:00–11:00",room:"Lab 2"},{subject:"History",time:"13:00–14:00",room:"306"}],
  Wed:[{subject:"Mathematics",time:"8:00–9:00",room:"101"},{subject:"Physics",time:"11:00–12:00",room:"Lab 1"},{subject:"English",time:"14:00–15:00",room:"204"}],
  Thu:[{subject:"History",time:"8:00–9:00",room:"306"},{subject:"Chemistry",time:"10:00–11:00",room:"Lab 2"},{subject:"Comp. Sci.",time:"13:00–14:00",room:"Lab 2"}],
  Fri:[{subject:"Mathematics",time:"8:00–9:00",room:"101"},{subject:"English",time:"9:00–10:00",room:"204"}],
};

const DAYS = ["Mon","Tue","Wed","Thu","Fri"];

type Tab = "courses" | "timetable" | "assignments" | "fees" | "ai";

export function StudentPortalPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("courses");
  const [today] = useState(DAYS[new Date().getDay()-1] ?? "Mon");
  const [aiMsg, setAiMsg] = useState("");
  const [aiHistory, setAiHistory] = useState<{role:string;text:string}[]>([
    { role:"assistant", text:"Hi! I'm your personal AI tutor assistant. Ask me about your subjects, homework help, or anything academic! 📚" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: dash } = useStudentDashboard();
  const { data: assignData } = useAssignments();
  const { data: invData }    = useInvoices();
  const chatbot = useAskChatbot("student");

  const assignments = (assignData as any)?.items ?? (assignData as any) ?? [];
  const invoices    = (invData as any)?.items     ?? (invData as any) ?? [];

  const pending  = assignments.filter((a:any) => { const m=parseMeta(a.metadataJson); return m.status==="PENDING"||m.status==="ACTIVE"; }).length;
  const due      = assignments.filter((a:any) => { const m=parseMeta(a.metadataJson); return m.dueDate && new Date(m.dueDate)<new Date(); }).length;
  const dueInvoices = invoices.filter((i:any) => !["PAID","CANCELLED"].includes(parseMeta(i.metadataJson).status||""));
  const avgPct   = MY_COURSES.reduce((a,c)=>a+c.pct,0)/MY_COURSES.length;

  async function sendAi() {
    if (!aiMsg.trim() || aiLoading) return;
    const q = aiMsg.trim(); setAiMsg("");
    setAiHistory(p => [...p, { role:"user", text:q }]);
    setAiLoading(true);
    try {
      const res = await chatbot.mutateAsync(q) as any;
      setAiHistory(p => [...p, { role:"assistant", text:res?.answer ?? "Let me think about that…" }]);
    } catch { setAiHistory(p => [...p, { role:"assistant", text:"Connection error. Please try again." }]); }
    finally { setAiLoading(false); }
  }

  return (
    <>
      <PageHeader title="My Portal" subtitle={`Welcome, ${user?.name?.split(" ")[0] ?? "Student"} — Class ${(dash as any)?.ClassName ?? "9-A"}`}/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Avg grade"    value={`${Math.round(avgPct)}%`}       note=""          color={avgPct>=75?"#10B981":"#D97706"} bg={avgPct>=75?"#ECFDF5":"#FFFBEB"}><TrendingUp size={20}/></StatCard>
        <StatCard label="Pending work" value={String(pending)}                 note="assignments" color="#6366F1" bg="#EEF2FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Overdue"      value={String(due)}                     note=""          color={due>0?"#EF4444":"#10B981"} bg={due>0?"#FFF0F1":"#ECFDF5"}><Clock size={20}/></StatCard>
        <StatCard label="Fee status"   value={dueInvoices.length===0?"Paid":"Outstanding"} note={dueInvoices.length>0?`${dueInvoices.length} invoice(s)`:"All clear"} color={dueInvoices.length===0?"#10B981":"#EF4444"} bg={dueInvoices.length===0?"#ECFDF5":"#FFF0F1"}><DollarSign size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="courses"?"active":""} onClick={()=>setTab("courses")}>📊 My grades</button>
        <button className={tab==="timetable"?"active":""} onClick={()=>setTab("timetable")}>🗓 Timetable</button>
        <button className={tab==="assignments"?"active":""} onClick={()=>setTab("assignments")}>📝 Assignments {pending>0&&<span style={{background:"#EF4444",color:"white",borderRadius:20,fontSize:9,padding:"1px 5px",marginLeft:4,fontWeight:700}}>{pending}</span>}</button>
        <button className={tab==="fees"?"active":""} onClick={()=>setTab("fees")}>💰 Fees</button>
        <button className={tab==="ai"?"active":""} onClick={()=>setTab("ai")}>🤖 AI Tutor</button>
      </div>

      {tab==="courses" && (
        <div className="surface">
          <div className="surface-head"><h3>My subjects & grades</h3><p>Current term performance</p></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
              {MY_COURSES.map(c => (
                <div key={c.subject} style={{padding:"14px 16px",border:"1px solid var(--line)",borderRadius:12,background:"var(--surface)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <b style={{fontSize:13}}>{c.subject}</b>
                      <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{c.teacher}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:22,fontWeight:800,color:GRADE_COLOR[c.grade]??"#0F2241"}}>{c.grade}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>{c.credits} credits</div>
                    </div>
                  </div>
                  <div style={{height:6,background:"var(--surface-2)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${c.pct}%`,background:GRADE_COLOR[c.grade]??"#6366F1",borderRadius:999,transition:"width .6s"}}/>
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:4,textAlign:"right"}}>{c.pct}%</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:16,padding:"12px 16px",background:"var(--surface-2)",borderRadius:12,display:"flex",gap:16,fontSize:12}}>
              <span>Overall average: <b style={{color:avgPct>=75?"#10B981":"#D97706"}}>{Math.round(avgPct)}%</b></span>
              <span>Total credits: <b>{MY_COURSES.reduce((a,c)=>a+c.credits,0)}</b></span>
              <span>Subjects: <b>{MY_COURSES.length}</b></span>
            </div>
          </div>
        </div>
      )}

      {tab==="timetable" && (
        <div className="surface">
          <div className="surface-head"><h3>Weekly timetable</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
              {DAYS.map(day => (
                <div key={day} style={{border:`1.5px solid ${day===today?"#6366F1":"var(--line)"}`,borderRadius:12,overflow:"hidden"}}>
                  <div style={{padding:"8px 12px",background:day===today?"#EEF2FF":"var(--surface-2)",textAlign:"center",fontWeight:700,fontSize:12,color:day===today?"#6366F1":"var(--muted)"}}>
                    {day}{day===today&&<div style={{fontSize:9,fontWeight:400}}>Today</div>}
                  </div>
                  <div style={{padding:"8px"}}>
                    {(TIMETABLE[day]??[]).map((p,i) => (
                      <div key={i} style={{padding:"8px 10px",background:"var(--surface)",border:"1px solid var(--line)",borderRadius:8,marginBottom:6,fontSize:11}}>
                        <b style={{fontSize:11,display:"block"}}>{p.subject}</b>
                        <div style={{color:"var(--muted)",marginTop:2}}>{p.time}</div>
                        <div style={{color:"var(--muted)"}}>{p.room}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="assignments" && (
        <div className="surface">
          <div className="surface-head"><h3>Assignments</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Assignment</th><th>Subject</th><th>Due date</th><th>Marks</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {assignments.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No assignments found.</td></tr>
                : assignments.map((a:any) => {
                  const m = parseMeta(a.metadataJson);
                  const isOverdue = m.dueDate && new Date(m.dueDate) < new Date() && m.status !== "SUBMITTED";
                  return (
                    <tr key={a.id}>
                      <td><b style={{fontSize:12}}>{a.name}</b></td>
                      <td style={{fontSize:11}}>{m.subject??"—"}</td>
                      <td style={{fontSize:11,color:isOverdue?"#EF4444":"var(--text)",fontWeight:isOverdue?700:400}}>{m.dueDate??"—"}{isOverdue?" ⚠️":""}</td>
                      <td>{m.totalMarks??100}</td>
                      <td><span className={`status-pill ${isOverdue?"danger":m.status==="SUBMITTED"?"info":m.status==="GRADED"?"success":"warning"}`}>{isOverdue?"OVERDUE":m.status??"PENDING"}</span></td>
                      <td>{m.status!=="SUBMITTED"&&m.status!=="GRADED"&&<button className="table-action" style={{fontSize:10}}>Submit</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="fees" && (
        <div className="surface">
          <div className="surface-head"><h3>My fee invoices</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Description</th><th>Amount (PKR)</th><th>Due date</th><th>Status</th></tr></thead>
              <tbody>
                {invoices.length===0 ? <tr><td colSpan={4} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No invoices found.</td></tr>
                : invoices.map((inv:any) => { const m=parseMeta(inv.metadataJson); return (
                  <tr key={inv.id}>
                    <td><b style={{fontSize:12}}>{inv.name}</b></td>
                    <td><b>{pkr(m.amount)}</b></td>
                    <td style={{fontSize:11}}>{m.dueDate??"—"}</td>
                    <td><span className={`status-pill ${m.status==="PAID"?"success":m.status==="OVERDUE"?"danger":"warning"}`}>{m.status??"PENDING"}</span></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="ai" && (
        <div className="surface" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 360px)",minHeight:400}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)"}}>
            <b style={{fontSize:14,display:"flex",alignItems:"center",gap:8}}><Bot size={15} style={{color:"#8B5CF6"}}/>AI Tutor Assistant</b>
            <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Powered by RAG — answers from school knowledge base</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
            {aiHistory.map((m,i) => (
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"78%",padding:"9px 13px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"#6366F1":"var(--surface-2)",color:m.role==="user"?"white":"var(--text)",fontSize:13,lineHeight:1.6}}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading&&<div style={{fontSize:12,color:"var(--muted)",padding:"4px 12px"}}>Thinking…</div>}
          </div>
          <div style={{padding:"10px 14px",borderTop:"1px solid var(--line)",display:"flex",gap:8}}>
            <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAi();}} placeholder="Ask about homework, subjects, exams…"
              style={{flex:1,height:38,padding:"0 14px",border:"1.5px solid var(--line)",borderRadius:20,background:"var(--surface-2)",fontSize:13,outline:"none"}}/>
            <button onClick={sendAi} disabled={!aiMsg.trim()||aiLoading}
              style={{width:38,height:38,borderRadius:"50%",border:"none",background:aiMsg.trim()?"#8B5CF6":"var(--line)",color:"white",cursor:aiMsg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {aiLoading?<RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>:<Send size={14}/>}
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </>
  );
}
