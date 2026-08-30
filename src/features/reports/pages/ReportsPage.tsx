import { useState } from "react";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";

type ReportType = "academic"|"attendance"|"finance"|"hr"|"ai";

const GRADE_DATA = [
  { grade:"Grade 7",  avg:74, pass:92 }, { grade:"Grade 8",  avg:78, pass:94 },
  { grade:"Grade 9",  avg:71, pass:89 }, { grade:"Grade 10", avg:76, pass:91 },
  { grade:"Grade 11", avg:80, pass:95 }, { grade:"Grade 12", avg:83, pass:96 },
];

const FEE_DATA = [
  { month:"Apr", collected:1820000, pending:280000 },
  { month:"May", collected:1950000, pending:150000 },
  { month:"Jun", collected:1780000, pending:320000 },
  { month:"Jul", collected:2100000, pending:100000 },
  { month:"Aug", collected:1990000, pending:210000 },
];

const AI_RISKS = [
  { category:"Dropout risk",      count:47, level:"high"   },
  { category:"Grade decline",     count:83, level:"medium" },
  { category:"Attendance anomaly",count:31, level:"medium" },
  { category:"Fee default risk",  count:29, level:"high"   },
  { category:"On track",          count:2650,level:"low"   },
];

export function ReportsPage() {
  const [tab, setTab] = useState<ReportType>("academic");

  const maxFee = Math.max(...FEE_DATA.map(f => f.collected));

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="School-wide performance, financial and AI-powered insights"
        action={
          <div className="page-actions">
            <button className="secondary"><Download size={14}/> Export PDF</button>
            <button className="primary"><Download size={14}/> Export Excel</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Avg grade"         value="76.8%" note="↑ 3.2% vs last term" color="#2563EB" bg="#EFF6FF"><TrendingUp size={20}/></StatCard>
        <StatCard label="Attendance rate"   value="91.3%" note="↑ 1.8% this week"   color="#10B981" bg="#ECFDF5"><BarChart3 size={20}/></StatCard>
        <StatCard label="Fee collection"    value="91%"   note="↑ 4% vs last month" color="#D97706" bg="#FFFBEB"><BarChart3 size={20}/></StatCard>
        <StatCard label="AI risk flags"     value="160"   note="47 high priority"   color="#EF4444" bg="#FFF0F1"><BarChart3 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {([
          { key:"academic",   label:"📊 Academic"   },
          { key:"attendance", label:"✅ Attendance" },
          { key:"finance",    label:"💰 Finance"    },
          { key:"hr",         label:"👥 HR"         },
          { key:"ai",         label:"🤖 AI Insights"},
        ] as {key:ReportType;label:string}[]).map(t => (
          <button key={t.key} className={tab===t.key?"active":""} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* ── Academic ── */}
      {tab === "academic" && (
        <div className="surface">
          <div className="surface-head"><h3>Grade-wise performance</h3><p>Average score and pass rate per grade level</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Grade</th><th>Average score</th><th>Pass rate</th><th>Performance bar</th></tr></thead>
              <tbody>
                {GRADE_DATA.map(g => (
                  <tr key={g.grade}>
                    <td><b>{g.grade}</b></td>
                    <td><b style={{ fontSize:15, color: g.avg>=80?"#10B981":g.avg>=70?"#2563EB":"#F59E0B" }}>{g.avg}%</b></td>
                    <td><span className={`status-pill ${g.pass>=95?"success":g.pass>=90?"info":"warning"}`}>{g.pass}%</span></td>
                    <td style={{ minWidth:180 }}>
                      <div style={{ height:8, borderRadius:5, background:"var(--surface-2)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${g.avg}%`, background: g.avg>=80?"#10B981":g.avg>=70?"#2563EB":"#F59E0B", borderRadius:5 }}/>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Attendance ── */}
      {tab === "attendance" && (
        <div className="surface">
          <div className="surface-head"><h3>Attendance trend</h3><p>Monthly attendance rates school-wide</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { month:"April",   pct:89 }, { month:"May",     pct:91 },
              { month:"June",    pct:87 }, { month:"July",     pct:90 },
              { month:"August",  pct:91 },
            ].map(m => (
              <div key={m.month} style={{ display:"flex", alignItems:"center", gap:16, marginBottom:14 }}>
                <span style={{ width:64, fontSize:12, color:"var(--muted)", fontWeight:600 }}>{m.month}</span>
                <div style={{ flex:1, height:14, borderRadius:7, background:"var(--surface-2)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${m.pct}%`, background: m.pct>=90?"#10B981":"#F59E0B", borderRadius:7, transition:"width .5s" }}/>
                </div>
                <b style={{ width:40, textAlign:"right", fontSize:13 }}>{m.pct}%</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Finance ── */}
      {tab === "finance" && (
        <div className="surface">
          <div className="surface-head"><h3>Fee collection overview</h3><p>Monthly collected vs pending</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {FEE_DATA.map(f => (
              <div key={f.month} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"var(--muted)", marginBottom:4 }}>
                  <b style={{ color:"var(--text)" }}>{f.month}</b>
                  <span>PKR {(f.collected/1000000).toFixed(2)}M collected · {(f.pending/1000).toFixed(0)}K pending</span>
                </div>
                <div style={{ height:12, borderRadius:6, background:"var(--surface-2)", overflow:"hidden", display:"flex" }}>
                  <div style={{ height:"100%", width:`${(f.collected/maxFee)*85}%`, background:"#10B981" }}/>
                  <div style={{ height:"100%", width:`${(f.pending/maxFee)*85}%`, background:"#F59E0B", marginLeft:2 }}/>
                </div>
              </div>
            ))}
            <div style={{ display:"flex", gap:16, marginTop:8 }}>
              {[["Collected","#10B981"],["Pending","#F59E0B"]].map(([l,c])=>(
                <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:c as string }}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── HR ── */}
      {tab === "hr" && (
        <div className="surface">
          <div className="surface-head"><h3>Staff overview</h3><p>Headcount and leave statistics</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { dept:"Mathematics",  staff:14, onLeave:1, avgLoad:"22 hrs/wk" },
              { dept:"Sciences",     staff:18, onLeave:0, avgLoad:"20 hrs/wk" },
              { dept:"Languages",    staff:12, onLeave:2, avgLoad:"24 hrs/wk" },
              { dept:"Social Studies",staff:10,onLeave:0, avgLoad:"18 hrs/wk" },
              { dept:"Computer Sci.",staff:8,  onLeave:1, avgLoad:"26 hrs/wk" },
              { dept:"Admin / Support",staff:22,onLeave:3,avgLoad:"40 hrs/wk" },
            ].map((d,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                <b style={{ width:160 }}>{d.dept}</b>
                <span>{d.staff} staff</span>
                <span style={{ color: d.onLeave>0?"var(--warning)":"var(--muted)" }}>{d.onLeave} on leave</span>
                <span style={{ color:"var(--muted)" }}>{d.avgLoad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Insights ── */}
      {tab === "ai" && (
        <div className="surface">
          <div className="surface-head"><h3>AI prediction summary</h3><p>Student risk distribution across all grades</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {AI_RISKS.map(r => {
              const max = 2650;
              const pct = Math.round((r.count / max) * 100);
              return (
                <div key={r.category} style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                    <b style={{ fontSize:12 }}>{r.category}</b>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <b style={{ fontSize:13 }}>{r.count} students</b>
                      <span className={`status-pill ${r.level==="high"?"danger":r.level==="medium"?"warning":"success"}`}>{r.level}</span>
                    </div>
                  </div>
                  <div style={{ height:10, borderRadius:5, background:"var(--surface-2)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, borderRadius:5,
                      background: r.level==="high"?"#EF4444":r.level==="medium"?"#F59E0B":"#10B981" }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
