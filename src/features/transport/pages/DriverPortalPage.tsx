import { useState } from "react";
import { AlertTriangle, Bus, CheckCircle2, MapPin, Phone, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";
import { useDriverDashboard } from "../../../core/api/queries";

const MY_ROUTE = {
  name: "Route A — North City",
  number: "RT-A01",
  vehicle: { reg:"LSQ-441", model:"Hino 2022", capacity:45 },
  stops: [
    { name:"Gulshan Chowk",      time:"07:10", students:8  },
    { name:"Johar Town Stop",    time:"07:22", students:12 },
    { name:"DHA Phase 5",        time:"07:35", students:9  },
    { name:"Canal Road",         time:"07:48", students:7  },
    { name:"Al-Noor Academy",    time:"08:00", students:0, isSchool:true },
  ],
  dismissal: { time:"14:30", note:"Normal dismissal — no changes" },
};

const MY_STUDENTS = [
  { name:"Ahmed Hassan",  grade:"9-A", stop:"Gulshan Chowk",    guardian:"Ali Hassan",   phone:"0300-1234567" },
  { name:"Sara Malik",    grade:"10-B",stop:"Johar Town Stop",   guardian:"Sana Malik",   phone:"0300-2345678" },
  { name:"Omar Raza",     grade:"8-C", stop:"DHA Phase 5",       guardian:"Raza Ahmed",   phone:"0300-3456789" },
  { name:"Fatima Khan",   grade:"11-A",stop:"Canal Road",         guardian:"Asif Khan",    phone:"0300-4567890" },
  { name:"Zain Ali",      grade:"7-B", stop:"Gulshan Chowk",    guardian:"Amjad Ali",    phone:"0300-5678901" },
  { name:"Noor Siddiqui", grade:"12-A",stop:"Johar Town Stop",   guardian:"Siddiq Noor",  phone:"0300-6789012" },
  { name:"Hamza Sheikh",  grade:"9-A", stop:"DHA Phase 5",       guardian:"Zafar Sheikh", phone:"0300-7890123" },
];

type Tab = "route"|"students"|"timings";

export function DriverPortalPage() {
  const { user } = useAuth();
  const { data: dash, isLoading } = useDriverDashboard();
  const [tab, setTab]             = useState<Tab>("route");
  const [alertSent, setAlertSent] = useState(false);
  const [boarded, setBoarded]     = useState<Set<string>>(new Set());

  function toggleBoard(name: string) {
    setBoarded(b => {
      const n = new Set(b);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  }

  async function sendAlert() {
    await new Promise(r => setTimeout(r, 800));
    setAlertSent(true);
  }

  return (
    <>
      <PageHeader
        title="Transport Portal"
        subtitle={dash ? `${dash.FullName} · ${MY_ROUTE.name}` : "Driver workspace"}
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="My students"    value={String(MY_STUDENTS.length)} note="On route today" color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="Boarded"        value={String(boarded.size)}       note={`${MY_STUDENTS.length - boarded.size} remaining`} color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
        <StatCard label="Vehicle"        value={MY_ROUTE.vehicle.reg}       note={MY_ROUTE.vehicle.model} color="#0F2241" bg="#EEF2FF"><Bus size={20}/></StatCard>
        <StatCard label="Dismissal"      value={MY_ROUTE.dismissal.time}    note={MY_ROUTE.dismissal.note} color="#D97706" bg="#FFFBEB"><MapPin size={20}/></StatCard>
      </section>

      {/* AI route optimisation banner */}
      <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px 18px", borderRadius:12, background:"#F5F3FF", border:"1px solid #e0d9ff", marginBottom:16 }}>
        <span style={{ fontSize:20 }}>🤖</span>
        <div>
          <b style={{ fontSize:13 }}>AI Route Update</b>
          <p style={{ fontSize:12, color:"var(--muted)", margin:"2px 0 0" }}>
            Heavy traffic detected on Northern Bypass. AI recommends departing 8 minutes earlier via Ring Road — saves 11 minutes.
          </p>
        </div>
        <button className="soft-button" style={{ fontSize:11, flexShrink:0 }}>Acknowledge</button>
      </div>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {(["route","students","timings"] as Tab[]).map(t => (
          <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
            {t==="route"?"🗺️ My Route":t==="students"?"👦 Student Roster":"🕐 School Timings"}
          </button>
        ))}
      </div>

      {/* ── Route ── */}
      {tab === "route" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>{MY_ROUTE.name}</h3><p>Route {MY_ROUTE.number} · {MY_ROUTE.vehicle.reg}</p></div>
            <button className={alertSent?"soft-button":"danger-button"} style={{ fontSize:11 }} onClick={() => void sendAlert()} disabled={alertSent}>
              <AlertTriangle size={13}/> {alertSent?"Alert sent ✓":"Send delay alert"}
            </button>
          </div>
          <div style={{ padding:"0 20px 20px" }}>
            {MY_ROUTE.stops.map((stop, i) => (
              <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start", padding:"12px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
                  <div style={{ width:12, height:12, borderRadius:"50%", background: stop.isSchool ? "#10B981" : "#2563EB", border:"2px solid white", boxShadow:"0 0 0 2px "+(stop.isSchool?"#10B981":"#2563EB") }}/>
                  {i < MY_ROUTE.stops.length - 1 && <div style={{ width:2, height:28, background:"var(--line)" }}/>}
                </div>
                <div style={{ flex:1 }}>
                  <b style={{ fontSize:13, color: stop.isSchool ? "#10B981" : "var(--text)" }}>{stop.name}</b>
                  <div style={{ display:"flex", gap:12, marginTop:3 }}>
                    <span style={{ fontSize:11, color:"var(--muted)" }}>🕐 {stop.time}</span>
                    {stop.students > 0 && <span style={{ fontSize:11, color:"var(--muted)" }}>👦 {stop.students} students</span>}
                    {stop.isSchool && <span style={{ fontSize:11, color:"#10B981", fontWeight:600 }}>School — drop point</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Students ── */}
      {tab === "students" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Student roster</h3><p>Tap to mark boarded</p></div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>{boarded.size}/{MY_STUDENTS.length} boarded</div>
          </div>
          <div style={{ padding:"0 20px 20px" }}>
            {MY_STUDENTS.map(s => {
              const isOnboard = boarded.has(s.name);
              return (
                <div key={s.name} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid var(--surface-2)" }}>
                  <button onClick={() => toggleBoard(s.name)}
                    style={{ width:28, height:28, borderRadius:"50%", border:`2px solid ${isOnboard?"#10B981":"var(--line)"}`, background:isOnboard?"#10B981":"var(--surface-2)", color:"#fff", display:"grid", placeItems:"center", cursor:"pointer" }}>
                    {isOnboard && <CheckCircle2 size={14}/>}
                  </button>
                  <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                    {s.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                  </span>
                  <div style={{ flex:1 }}>
                    <b style={{ fontSize:13 }}>{s.name}</b>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{s.grade} · {s.stop}</div>
                  </div>
                  <a href={`tel:${s.phone}`} style={{ color:"var(--muted)" }}><Phone size={15}/></a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Timings ── */}
      {tab === "timings" && (
        <div className="surface">
          <div className="surface-head"><h3>School timings</h3><p>Today's schedule and important times</p></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              { label:"Morning pickup start",   time:"07:00",  note:"Depart depot"                  },
              { label:"First stop",             time:"07:10",  note:"Gulshan Chowk"                 },
              { label:"School arrival",         time:"08:00",  note:"Drop students at main gate"    },
              { label:"School starts",          time:"08:15",  note:"Bell time"                     },
              { label:"Lunch break",            time:"12:30",  note:"1 hour — driver rest"          },
              { label:"Afternoon dismissal",    time:"14:30",  note:"Normal dismissal today"        },
              { label:"First drop stop",        time:"14:45",  note:"Canal Road"                   },
              { label:"Route completion",       time:"15:30",  note:"Return to depot"               },
            ].map((t,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                <div>
                  <b>{t.label}</b>
                  <span style={{ color:"var(--muted)", marginLeft:8 }}>{t.note}</span>
                </div>
                <b style={{ fontFamily:"var(--font-mono)", color:"var(--navy)" }}>{t.time}</b>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
