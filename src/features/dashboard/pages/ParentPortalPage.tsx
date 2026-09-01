import { useState } from "react";
import { TrendingUp, Bus, DollarSign, MessageCircle, Send, RefreshCw, Bell, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useParentDashboard, useAskChatbot, useNotifications, useMarkAllRead } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";

const GRADE_COLOR: Record<string,string> = { "A+":"#10B981","A":"#10B981","B+":"#2563EB","B":"#2563EB","C+":"#D97706","C":"#D97706","D":"#EF4444" };
const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => `PKR ${Number(n||0).toLocaleString()}`;

const CHILDREN = [
  {
    id:"c1", name:"Ahmed Hassan",   grade:"Grade 9-A", roll:"2024-0921", gender:"Male",
    attendance:"92%", avgGrade:"B+", avgPct:82, feeStatus:"Paid", outstandingFee:0,
    bus:"Route 3 — Bus LSQ-441 · Departs 7:30 AM",
    courses:[
      { subject:"Mathematics", grade:"B+", pct:82 }, { subject:"Physics",     grade:"A",  pct:91 },
      { subject:"English",     grade:"B",  pct:78 }, { subject:"Comp. Sci.",  grade:"A+", pct:97 },
      { subject:"History",     grade:"C+", pct:68 }, { subject:"Chemistry",   grade:"B+", pct:84 },
    ],
    recentAttendance:[ { date:"Sep 1", status:"Present" }, { date:"Aug 31", status:"Present" }, { date:"Aug 30", status:"Absent" }, { date:"Aug 29", status:"Present" }, { date:"Aug 28", status:"Late" } ],
  },
  {
    id:"c2", name:"Hina Hassan",    grade:"Grade 7-B", roll:"2024-1455", gender:"Female",
    attendance:"96%", avgGrade:"A", avgPct:90, feeStatus:"Outstanding", outstandingFee:4500,
    bus:"Route 3 — Bus LSQ-441 · Departs 7:30 AM",
    courses:[
      { subject:"Mathematics", grade:"A",  pct:90 }, { subject:"English",     grade:"A+", pct:95 },
      { subject:"Science",     grade:"B+", pct:83 }, { subject:"Urdu",        grade:"A",  pct:88 },
    ],
    recentAttendance:[ { date:"Sep 1", status:"Present" }, { date:"Aug 31", status:"Present" }, { date:"Aug 30", status:"Present" }, { date:"Aug 29", status:"Present" }, { date:"Aug 28", status:"Present" } ],
  },
];

type Tab = "progress" | "attendance" | "fees" | "transport" | "messages";

export function ParentPortalPage() {
  const { user } = useAuth();
  const [child, setChild] = useState(CHILDREN[0]);
  const [tab, setTab]     = useState<Tab>("progress");
  const [aiMsg, setAiMsg] = useState("");
  const [aiHistory, setAiHistory] = useState<{role:string;text:string}[]>([
    { role:"assistant", text:"Hello! I'm your school AI assistant. I can help you with your children's progress, fees, transport, or any school-related questions. How can I help you today?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: dash }   = useParentDashboard();
  const { data: notifData } = useNotifications();
  const markAll  = useMarkAllRead();
  const chatbot  = useAskChatbot("parent");

  const notifs   = (notifData as any)?.items ?? (notifData as any) ?? [];
  const unread   = notifs.filter((n:any) => !n.isRead).length;
  const totalOutstanding = CHILDREN.reduce((a,c) => a+c.outstandingFee, 0);

  async function sendAi() {
    if (!aiMsg.trim() || aiLoading) return;
    const q = aiMsg.trim(); setAiMsg("");
    setAiHistory(p => [...p, { role:"user", text:q }]);
    setAiLoading(true);
    try {
      const res = await chatbot.mutateAsync(q) as any;
      setAiHistory(p => [...p, { role:"assistant", text:res?.answer ?? "I'm looking into that for you…" }]);
    } catch { setAiHistory(p => [...p, { role:"assistant", text:"Connection error. Please try again." }]); }
    finally { setAiLoading(false); }
  }

  return (
    <>
      <PageHeader title="Parent Portal" subtitle={`Welcome, ${user?.name?.split(" ")[0] ?? "Guardian"} — ${CHILDREN.length} child${CHILDREN.length>1?"ren":""} enrolled`}/>

      {/* Child selector */}
      {CHILDREN.length > 1 && (
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {CHILDREN.map(c => (
            <button key={c.id} onClick={()=>setChild(c)}
              style={{padding:"8px 16px",borderRadius:10,border:`1.5px solid ${child.id===c.id?"#6366F1":"var(--line)"}`,background:child.id===c.id?"#EEF2FF":"var(--surface)",color:child.id===c.id?"#6366F1":"var(--text)",fontSize:12,cursor:"pointer",fontWeight:child.id===c.id?700:400}}>
              {c.name} · {c.grade}
            </button>
          ))}
        </div>
      )}

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Avg grade"   value={child.avgGrade}          note={`${child.avgPct}%`}  color={GRADE_COLOR[child.avgGrade]??"#2563EB"} bg="#EFF6FF"><TrendingUp size={20}/></StatCard>
        <StatCard label="Attendance"  value={child.attendance}        note="this term"            color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Fee status"  value={child.feeStatus}         note={child.outstandingFee>0?pkr(child.outstandingFee):"All clear"} color={child.feeStatus==="Paid"?"#10B981":"#EF4444"} bg={child.feeStatus==="Paid"?"#ECFDF5":"#FFF0F1"}><DollarSign size={20}/></StatCard>
        <StatCard label="Notifications" value={String(unread)}        note="unread"              color={unread>0?"#D97706":"#10B981"} bg={unread>0?"#FFFBEB":"#ECFDF5"}><Bell size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="progress"?"active":""} onClick={()=>setTab("progress")}>📊 Progress</button>
        <button className={tab==="attendance"?"active":""} onClick={()=>setTab("attendance")}>✅ Attendance</button>
        <button className={tab==="fees"?"active":""} onClick={()=>setTab("fees")}>💰 Fees</button>
        <button className={tab==="transport"?"active":""} onClick={()=>setTab("transport")}>🚌 Transport</button>
        <button className={tab==="messages"?"active":""} onClick={()=>setTab("messages")}>
          🤖 AI Assistant {unread>0&&<span style={{background:"#EF4444",color:"white",borderRadius:20,fontSize:9,padding:"1px 5px",marginLeft:4,fontWeight:700}}>{unread}</span>}
        </button>
      </div>

      {tab==="progress" && (
        <div className="surface">
          <div className="surface-head"><h3>{child.name} — Subject performance</h3><p>{child.grade} · Roll #{child.roll}</p></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
              {child.courses.map(c => (
                <div key={c.subject} style={{padding:"14px 16px",border:"1px solid var(--line)",borderRadius:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <b style={{fontSize:12}}>{c.subject}</b>
                    <span style={{fontSize:20,fontWeight:800,color:GRADE_COLOR[c.grade]??"#0F2241"}}>{c.grade}</span>
                  </div>
                  <div style={{height:6,background:"var(--surface-2)",borderRadius:999,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${c.pct}%`,background:GRADE_COLOR[c.grade]??"#6366F1",borderRadius:999}}/>
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",marginTop:4,textAlign:"right"}}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="attendance" && (
        <div className="surface">
          <div className="surface-head"><h3>{child.name} — Attendance record</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px",background:"var(--surface-2)",borderRadius:12,marginBottom:16}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:32,fontWeight:800,color:parseFloat(child.attendance)>=80?"#10B981":"#EF4444"}}>{child.attendance}</div>
                <div style={{fontSize:11,color:"var(--muted)"}}>Overall attendance</div>
              </div>
              <div style={{flex:1,height:12,background:"var(--line)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:child.attendance,background:parseFloat(child.attendance)>=80?"#10B981":"#EF4444",borderRadius:999}}/>
              </div>
            </div>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"var(--muted)",textTransform:"uppercase",letterSpacing:.6}}>Recent days</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {child.recentAttendance.map((r,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",border:"1px solid var(--line)",borderRadius:10}}>
                  <span style={{fontSize:12,fontWeight:600,minWidth:60,color:"var(--muted)"}}>{r.date}</span>
                  <span style={{padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:r.status==="Present"?"#ECFDF5":r.status==="Absent"?"#FFF0F1":"#FFFBEB",color:r.status==="Present"?"#059669":r.status==="Absent"?"#EF4444":"#D97706"}}>
                    {r.status==="Present"?"✓ Present":r.status==="Absent"?"✗ Absent":"⏰ Late"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="fees" && (
        <div className="surface">
          <div className="surface-head"><h3>{child.name} — Fee account</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            {child.outstandingFee === 0 ? (
              <div style={{padding:"20px",background:"#ECFDF5",border:"1px solid #a7f3d0",borderRadius:12,display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <CheckCircle2 size={24} style={{color:"#059669",flexShrink:0}}/>
                <div>
                  <b style={{fontSize:14,color:"#059669"}}>All fees paid</b>
                  <div style={{fontSize:12,color:"#065f46",marginTop:2}}>No outstanding balance for {child.name}.</div>
                </div>
              </div>
            ) : (
              <div style={{padding:"20px",background:"#FFF0F1",border:"1.5px solid #fecdd3",borderRadius:12,marginBottom:16}}>
                <b style={{fontSize:14,color:"#B91C1C",display:"block",marginBottom:4}}>Outstanding balance: {pkr(child.outstandingFee)}</b>
                <p style={{fontSize:12,color:"#7F1D1D",margin:"0 0 12px"}}>Please clear this balance to avoid late fees.</p>
                <button className="primary" style={{background:"#EF4444",fontSize:12}}>💳 Pay now online</button>
              </div>
            )}
            <div style={{fontSize:12,color:"var(--muted)"}}>For detailed invoice history, contact the school accounts office or visit the fee payment counter.</div>
          </div>
        </div>
      )}

      {tab==="transport" && (
        <div className="surface">
          <div className="surface-head"><h3>{child.name} — Transport details</h3></div>
          <div style={{padding:"0 20px 20px"}}>
            <div style={{padding:"16px",background:"var(--surface-2)",borderRadius:12,display:"flex",gap:14,alignItems:"flex-start",marginBottom:14}}>
              <Bus size={24} style={{color:"#6366F1",flexShrink:0}}/>
              <div>
                <b style={{fontSize:14,display:"block",marginBottom:4}}>Bus assigned</b>
                <div style={{fontSize:13}}>{child.bus}</div>
                <div style={{fontSize:11,color:"var(--muted)",marginTop:6}}>Please ensure your child is at the bus stop 5 minutes before departure.</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {[["Morning pick-up","7:30 AM from Gulberg stop"],["Afternoon drop-off","2:45 PM at Gulberg stop"],["Driver","Rafiq Ahmed · +92 321 0000000"],["Supervisor","Nadia Bibi · +92 300 1111111"]].map(([l,v])=>(
                <div key={l} style={{padding:"12px 14px",border:"1px solid var(--line)",borderRadius:10}}>
                  <div style={{fontSize:11,color:"var(--muted)",marginBottom:2}}>{l}</div>
                  <b style={{fontSize:12}}>{v}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==="messages" && (
        <div className="surface" style={{display:"flex",flexDirection:"column",height:"calc(100vh - 380px)",minHeight:380}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <b style={{fontSize:14,display:"flex",alignItems:"center",gap:8}}><MessageCircle size={15} style={{color:"#6366F1"}}/>AI School Assistant</b>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>Ask about your children's progress, fees, transport, or school policies</div>
            </div>
            {unread>0&&<button className="secondary" style={{fontSize:11}} onClick={()=>markAll.mutate()}>Mark all read</button>}
          </div>
          <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:8}}>
            {aiHistory.map((m,i) => (
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"78%",padding:"9px 13px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?"#6366F1":"var(--surface-2)",color:m.role==="user"?"white":"var(--text)",fontSize:13,lineHeight:1.6}}>
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoading&&<div style={{fontSize:12,color:"var(--muted)"}}>Thinking…</div>}
          </div>
          <div style={{padding:"10px 14px",borderTop:"1px solid var(--line)",display:"flex",gap:8}}>
            <input value={aiMsg} onChange={e=>setAiMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendAi();}} placeholder="Ask about fees, progress, school policies…"
              style={{flex:1,height:38,padding:"0 14px",border:"1.5px solid var(--line)",borderRadius:20,background:"var(--surface-2)",fontSize:13,outline:"none"}}/>
            <button onClick={sendAi} disabled={!aiMsg.trim()||aiLoading}
              style={{width:38,height:38,borderRadius:"50%",border:"none",background:aiMsg.trim()?"#6366F1":"var(--line)",color:"white",cursor:aiMsg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {aiLoading?<RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>:<Send size={14}/>}
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
    </>
  );
}
