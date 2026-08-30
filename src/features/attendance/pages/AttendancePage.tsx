import { useState } from "react";
import { CheckCircle2, Save, XCircle, MinusCircle, Calendar, TrendingUp } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";

type Status = "P" | "A" | "L";
type View = "mark" | "overview";

const CLASSES = ["Grade 9-A", "Grade 9-B", "Grade 10-A", "Grade 10-B", "Grade 11-A"];
const ROSTER: Record<string, string[]> = {
  "Grade 9-A":  ["Ahmed Hassan","Sara Malik","Omar Raza","Fatima Khan","Zain Ali","Noor Siddiqui","Hamza Sheikh","Ayesha Tariq","Bilal Khan","Hina Raza"],
  "Grade 9-B":  ["Ali Cheema","Mariam Shah","Usman Butt","Safia Noor","Hassan Ali","Rabia Qureshi","Kamran Malik","Sidra Khan","Tariq Ahmed","Zara Hussain"],
  "Grade 10-A": ["Imran Khan","Sana Akhtar","Fahad Ali","Asma Baig","Waqas Ahmed","Amna Sheikh","Junaid Raza","Hira Noor","Danyal Mir","Laiba Hassan"],
  "Grade 10-B": ["Shahid Mehmood","Nadia Ali","Asad Khan","Zunaira Shah","Faisal Ahmed","Raheela Malik","Aqib Hassan","Maryam Tariq","Zubair Iqbal","Samina Bibi"],
  "Grade 11-A": ["Rehan Ali","Sadia Khan","Mansoor Ahmed","Nisha Akhtar","Taimoor Shah","Fariha Malik","Waseem Raza","Kiran Noor","Saad Hussain","Anam Sheikh"],
};

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  P: { label: "Present", color: "#10B981", bg: "#ECFDF5", icon: CheckCircle2 },
  A: { label: "Absent",  color: "#EF4444", bg: "#FFF0F1", icon: XCircle },
  L: { label: "Leave",   color: "#F59E0B", bg: "#FFFBEB", icon: MinusCircle },
};

const WEEKLY_DATA = [
  { day: "Mon", pct: 91 }, { day: "Tue", pct: 94 }, { day: "Wed", pct: 88 },
  { day: "Thu", pct: 90 }, { day: "Fri", pct: 85 },
];

export function AttendancePage() {
  const { user } = useAuth();
  const isTeacher = user?.role?.toLowerCase().includes("teacher");
  const [view, setView]       = useState<View>(isTeacher ? "mark" : "overview");
  const [cls, setCls]         = useState("Grade 9-A");
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [saved, setSaved]     = useState(false);
  const [saving, setSaving]   = useState(false);

  const roster = ROSTER[cls] ?? [];
  const [statuses, setStatuses] = useState<Record<number, Status>>(
    Object.fromEntries(roster.map((_, i) => [i, "P" as Status]))
  );

  const counts = { P: 0, A: 0, L: 0 };
  Object.values(statuses).forEach(s => counts[s]++);
  const rate = roster.length ? Math.round((counts.P / roster.length) * 100) : 0;

  function toggle(i: number, s: Status) {
    setSaved(false);
    setStatuses(p => ({ ...p, [i]: p[i] === s ? "P" : s }));
  }

  function markAll(s: Status) {
    setSaved(false);
    setStatuses(Object.fromEntries(roster.map((_, i) => [i, s])));
  }

  async function submit() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={isTeacher ? "Mark daily class attendance" : "School-wide attendance overview"}
        action={
          <div className="page-actions">
            <button className={view === "mark"     ? "primary" : "secondary"} onClick={() => setView("mark")}>📝 Mark Attendance</button>
            <button className={view === "overview" ? "primary" : "secondary"} onClick={() => setView("overview")}>📊 Overview</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Present today"  value={String(counts.P)} note={`${rate}% rate`}   color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Absent"         value={String(counts.A)} note="As marked"         color="#EF4444" bg="#FFF0F1"><XCircle size={20}/></StatCard>
        <StatCard label="On leave"       value={String(counts.L)} note=""                  color="#F59E0B" bg="#FFFBEB"><MinusCircle size={20}/></StatCard>
        <StatCard label="Attendance rate" value={`${rate}%`}      note="↑ 2% vs last week" color="#2563EB" bg="#EFF6FF"><TrendingUp size={20}/></StatCard>
      </section>

      {/* Mark attendance panel */}
      {view === "mark" && (
        <div className="surface">
          <div className="surface-head">
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              <select value={cls} onChange={e => { setCls(e.target.value); setSaved(false); setStatuses(Object.fromEntries((ROSTER[e.target.value] ?? []).map((_,i) => [i,"P" as Status]))); }}
                style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12, fontWeight:600 }}>
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="soft-button" style={{ fontSize:11 }} onClick={() => markAll("P")}>✅ All Present</button>
              <button className="soft-button" style={{ fontSize:11 }} onClick={() => markAll("A")}>❌ All Absent</button>
              <button className="primary" onClick={submit} disabled={saving || saved}>
                {saving ? "Saving…" : saved ? "Saved ✓" : <><Save size={14}/> Submit</>}
              </button>
            </div>
          </div>

          <div style={{ padding:"0 20px 20px" }}>
            <div style={{ display:"grid", gap:6 }}>
              {roster.map((name, i) => {
                const st = statuses[i] ?? "P";
                const cfg = STATUS_CONFIG[st];
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:"1.5px solid var(--line)", background:"var(--surface)" }}>
                    <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1", flexShrink:0 }}>
                      {name.split(" ").map(w => w[0]).join("").slice(0,2)}
                    </span>
                    <span style={{ flex:1, fontSize:13, fontWeight:500 }}>{name}</span>
                    <div style={{ display:"flex", gap:6 }}>
                      {(["P","A","L"] as Status[]).map(s => {
                        const c = STATUS_CONFIG[s];
                        const active = st === s;
                        return (
                          <button key={s} onClick={() => toggle(i, s)}
                            style={{
                              width:60, height:32, borderRadius:8, fontSize:11, fontWeight:600,
                              border: `1.5px solid ${active ? c.color : "var(--line)"}`,
                              background: active ? c.bg : "var(--surface-2)",
                              color: active ? c.color : "var(--muted)", cursor:"pointer",
                            }}
                          >
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Overview panel */}
      {view === "overview" && (
        <div className="grid-2">
          <div className="surface">
            <div className="surface-head"><h3>Weekly trend</h3><p>Attendance % this week</p></div>
            <div style={{ padding:"0 20px 20px" }}>
              {WEEKLY_DATA.map(d => (
                <div key={d.day} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
                  <span style={{ width:32, fontSize:12, color:"var(--muted)", fontWeight:600 }}>{d.day}</span>
                  <div style={{ flex:1, height:10, borderRadius:6, background:"var(--surface-2)", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${d.pct}%`, background: d.pct >= 90 ? "#10B981" : d.pct >= 80 ? "#F59E0B" : "#EF4444", borderRadius:6, transition:"width .4s" }}/>
                  </div>
                  <span style={{ width:36, fontSize:12, fontWeight:700, textAlign:"right" }}>{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="surface">
            <div className="surface-head"><h3>By class</h3><p>Today's snapshot</p></div>
            <div style={{ padding:"0 20px 20px" }}>
              {CLASSES.map(c => {
                const pct = 80 + Math.floor(Math.random() * 18);
                return (
                  <div key={c} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                    <span style={{ fontWeight:500 }}>{c}</span>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:80, height:6, borderRadius:4, background:"var(--surface-2)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${pct}%`, background: pct >= 90 ? "#10B981" : "#F59E0B", borderRadius:4 }}/>
                      </div>
                      <b style={{ width:32, textAlign:"right" }}>{pct}%</b>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
