import { useState } from "react";
import { Bus, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";
import { useParentDashboard, useAskChatbot } from "../../../core/api/queries";

const CHILDREN = [
  {
    id:"1", name:"Ahmed Hassan", grade:"Grade 9-A", roll:"2024-0921",
    attendance:"92%", avgGrade:"B+", feeStatus:"Paid",
    courses:[
      { subject:"Mathematics", grade:"B+", pct:82 },
      { subject:"Physics",     grade:"A",  pct:91 },
      { subject:"English",     grade:"B",  pct:78 },
      { subject:"Comp. Sci.",  grade:"A+", pct:97 },
    ],
  },
  {
    id:"2", name:"Hina Hassan", grade:"Grade 7-B", roll:"2024-1455",
    attendance:"96%", avgGrade:"A", feeStatus:"Pending",
    courses:[
      { subject:"Mathematics", grade:"A",  pct:90 },
      { subject:"English",     grade:"A+", pct:95 },
      { subject:"Science",     grade:"B+", pct:83 },
    ],
  },
];

type Tab = "progress"|"attendance"|"fees"|"messages";
const GRADE_COLOR: Record<string,string> = {"A+":"#10B981","A":"#10B981","B+":"#2563EB","B":"#2563EB","C+":"#D97706"};

export function ParentPortalPage() {
  const { user }  = useAuth();
  const { data: dash } = useParentDashboard();
  const [child, setChild] = useState(CHILDREN[0]);
  const [tab, setTab]     = useState<Tab>("progress");
  const [aiQ, setAiQ]     = useState("");
  const [aiA, setAiA]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const askAi = useAskChatbot("parent");

  async function sendAiQ() {
    if (!aiQ.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const res = await askAi.mutateAsync(aiQ.trim());
      setAiA(res.answer);
    } catch {
      setAiA("I could not process your question. Please try again.");
    } finally { setAiLoading(false); setAiQ(""); }
  }

  return (
    <>
      <PageHeader title="Parent Portal" subtitle="Monitor your children's academic progress and school activities"/>

      {/* Child switcher */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {CHILDREN.map(c => (
          <button key={c.id} onClick={() => setChild(c)}
            style={{
              padding:"10px 16px", borderRadius:10, fontSize:12, fontWeight:600,
              border:`1.5px solid ${child.id===c.id?"var(--navy)":"var(--line)"}`,
              background: child.id===c.id ? "var(--navy)" : "var(--surface)",
              color: child.id===c.id ? "#fff" : "var(--text)", cursor:"pointer",
            }}>
            {c.name} · {c.grade}
          </button>
        ))}
      </div>

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Attendance"      value={child.attendance} note="This term" color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Overall grade"   value={child.avgGrade}   note=""          color="#2563EB" bg="#EFF6FF"><TrendingUp size={20}/></StatCard>
        <StatCard label="Fee status"      value={child.feeStatus}  note=""          color={child.feeStatus==="Paid"?"#10B981":"#D97706"} bg={child.feeStatus==="Paid"?"#ECFDF5":"#FFFBEB"}><Wallet size={20}/></StatCard>
        <StatCard label="Messages"        value="2"                note="Unread"    color="#8B5CF6" bg="#F5F3FF"><MessageCircle size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {(["progress","attendance","fees","messages"] as Tab[]).map(t => (
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
            {t==="progress"?"📊 Progress":t==="attendance"?"✅ Attendance":t==="fees"?"💳 Fees":"💬 Messages"}
          </button>
        ))}
      </div>

      {/* ── Progress ── */}
      {tab === "progress" && (
        <div className="grid-2">
          <div className="surface">
            <div className="surface-head"><h3>Course performance</h3><p>{child.name}</p></div>
            <div style={{ padding:"0 20px 20px" }}>
              {child.courses.map(c => (
                <div key={c.subject} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0", borderBottom:"1px solid var(--surface-2)" }}>
                  <span style={{ flex:1, fontSize:12, fontWeight:500 }}>{c.subject}</span>
                  <div style={{ width:100, height:6, borderRadius:4, background:"var(--surface-2)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${c.pct}%`, background: c.pct>=90?"#10B981":c.pct>=75?"#2563EB":"#F59E0B", borderRadius:4 }}/>
                  </div>
                  <b style={{ fontSize:13, color: GRADE_COLOR[c.grade]??"var(--text)", width:24, textAlign:"right" }}>{c.grade}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="surface">
            <div className="surface-head"><h3>Ask Parent AI</h3><p>Powered by school knowledge base</p></div>
            <div style={{ padding:16 }}>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {["How is my child doing?","Check fee balance","Attendance this month"].map(q => (
                  <button key={q} onClick={() => setAiQ(q)}
                    style={{ padding:"5px 10px", border:"1px solid var(--line)", borderRadius:"var(--radius)", background:"var(--surface-2)", fontSize:10, cursor:"pointer", color:"var(--text)" }}>
                    {q}
                  </button>
                ))}
              </div>
              {aiA && (
                <div style={{ padding:"12px 14px", background:"var(--surface-2)", borderRadius:10, fontSize:12, color:"var(--text-secondary)", marginBottom:10, lineHeight:1.65 }}>{aiA}</div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <input value={aiQ} onChange={e => setAiQ(e.target.value)} placeholder="Ask about your child…"
                  onKeyDown={e => { if (e.key==="Enter") void sendAiQ(); }}
                  style={{ flex:1, height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:"var(--radius)", background:"var(--surface)", fontSize:12 }}/>
                <button className="primary" onClick={() => void sendAiQ()} disabled={aiLoading || !aiQ.trim()}>
                  {aiLoading?"…":"Ask"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "attendance" && (
        <div className="surface">
          <div className="surface-head"><h3>Attendance record — {child.name}</h3></div>
          <div style={{ padding:"0 20px 20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:16 }}>
              {Array.from({length:30},(_,i)=>{
                const r = Math.random();
                const s = r>0.08?"P":r>0.04?"L":"A";
                return (
                  <div key={i} title={`Day ${i+1}: ${s==="P"?"Present":s==="L"?"Leave":"Absent"}`}
                    style={{ height:32, borderRadius:6, display:"grid", placeItems:"center", fontSize:9, fontWeight:700,
                      background:s==="P"?"#ECFDF5":s==="L"?"#FFFBEB":"#FFF0F1",
                      color:s==="P"?"#10B981":s==="L"?"#D97706":"#EF4444",
                      border:`1px solid ${s==="P"?"#a7f3d0":s==="L"?"#fde68a":"#fecdd3"}`,
                    }}>
                    {s}
                  </div>
                );
              })}
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {[["Present","P","#10B981"],["Absent","A","#EF4444"],["Leave","L","#F59E0B"]].map(([l,s,c])=>(
                <div key={s} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c as string }}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Fees ── */}
      {tab === "fees" && (
        <div className="surface">
          <div className="surface-head"><h3>Fee invoices — {child.name}</h3></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { month:"September 2026", amt:4500, status:"Pending", due:"Sep 20" },
              { month:"August 2026",    amt:4500, status:"Paid",    date:"Aug 5"  },
              { month:"July 2026",      amt:4500, status:"Paid",    date:"Jul 3"  },
            ].map((f,i)=>(
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div>
                  <b style={{ fontSize:13 }}>{f.month}</b>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{f.status==="Pending"?`Due: ${f.due}`:`Paid: ${f.date}`}</div>
                </div>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <b style={{ fontSize:16 }}>PKR {f.amt.toLocaleString()}</b>
                  <span className={`status-pill ${f.status==="Paid"?"success":"warning"}`}>{f.status}</span>
                  {f.status==="Pending" && <button className="primary" style={{ fontSize:11 }}>Pay online</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      {tab === "messages" && (
        <div className="surface">
          <div className="surface-head"><h3>Messages from school</h3></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { from:"Ms. Aisha Siddiqui (Maths)", msg:"Ahmed has improved significantly this month. Keep up the practice!", time:"2 hours ago", read:false },
              { from:"Admin Office",               msg:"Fee reminder: September dues are due by Sep 20.",                  time:"Yesterday",  read:false },
              { from:"Mr. Tariq Jameel (Physics)", msg:"Please remind Ahmed to bring lab coat for tomorrow's experiment.",  time:"2 days ago", read:true  },
            ].map((m,i)=>(
              <div key={i} style={{ display:"flex", gap:12, padding:"14px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1", flexShrink:0 }}>
                  {m.from.charAt(0)}
                </span>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <b style={{ fontSize:12 }}>{m.from}</b>
                    <span style={{ fontSize:10, color:"var(--muted)" }}>{m.time}</span>
                  </div>
                  <p style={{ fontSize:12, color:"var(--text-secondary)", margin:"4px 0 0", lineHeight:1.55 }}>{m.msg}</p>
                </div>
                {!m.read && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--navy)", flexShrink:0, marginTop:4 }}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
