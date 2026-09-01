/**
 * AttendancePage — Mark attendance per class + view reports
 * Teachers: mark today's attendance | Admins: view all class attendance
 */
import { useState, useMemo } from "react";
import { Check, X as XIcon, Clock, CalendarCheck, BarChart3, ChevronDown } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useStudents, useClassSections, useCampuses } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type AttStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

const STATUS_META: Record<AttStatus, {label:string;color:string;bg:string;icon:React.ReactNode}> = {
  PRESENT: { label:"Present", color:"#059669", bg:"#ECFDF5", icon:<Check size={14}/> },
  ABSENT:  { label:"Absent",  color:"#EF4444", bg:"#FFF0F1", icon:<XIcon size={14}/> },
  LATE:    { label:"Late",    color:"#D97706", bg:"#FFFBEB", icon:<Clock size={14}/> },
  EXCUSED: { label:"Excused", color:"#6366F1", bg:"#EEF2FF", icon:<CalendarCheck size={14}/> },
};

// Attendance history mock
const HISTORY = [
  { date:"2026-08-30", present:35, absent:2, late:1, excused:0, section:"Grade 9-A (Boys)" },
  { date:"2026-08-29", present:33, absent:3, late:2, excused:0, section:"Grade 9-A (Boys)" },
  { date:"2026-08-28", present:36, absent:1, late:1, excused:0, section:"Grade 9-A (Boys)" },
  { date:"2026-08-27", present:34, absent:4, late:0, excused:0, section:"Grade 9-A (Boys)" },
  { date:"2026-08-26", present:37, absent:1, late:0, excused:0, section:"Grade 9-A (Boys)" },
];

export function AttendancePage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const today = new Date().toISOString().slice(0,10);
  const isTeacher = user?.role?.toLowerCase().includes("teacher");

  const [tab, setTab]             = useState<"mark"|"history">("mark");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate]           = useState(today);
  const [attendance, setAtt]      = useState<Record<string, AttStatus>>({});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [search, setSearch]       = useState("");

  const { data: sectionsData } = useClassSections();
  const { data: studentData }  = useStudents(1);

  const sections = (sectionsData as any)?.items ?? (sectionsData as any) ?? [];
  const allStudents = (studentData as any)?.items ?? (studentData as any) ?? [];

  // Filter students to selected section
  const students = useMemo(() => {
    let list = allStudents;
    if (sectionId) {
      // In real API this would be filtered server-side
      list = list.filter((_:any, i:number) => i < 8); // demo: show first 8 as "this class"
    }
    if (search) list = list.filter((s:any) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [allStudents, sectionId, search]);

  // Auto-initialise attendance as PRESENT
  useMemo(() => {
    const init: Record<string, AttStatus> = {};
    students.forEach((s:any) => { if (!attendance[s.id]) init[s.id] = "PRESENT"; });
    if (Object.keys(init).length > 0) setAtt(p => ({...p, ...init}));
  }, [students.map((s:any)=>s.id).join(",")]);

  const stats = {
    present: Object.values(attendance).filter(s=>s==="PRESENT").length,
    absent:  Object.values(attendance).filter(s=>s==="ABSENT").length,
    late:    Object.values(attendance).filter(s=>s==="LATE").length,
    excused: Object.values(attendance).filter(s=>s==="EXCUSED").length,
    total:   students.length,
  };
  const pct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  function cycle(studentId: string) {
    const order: AttStatus[] = ["PRESENT","ABSENT","LATE","EXCUSED"];
    const cur = attendance[studentId] ?? "PRESENT";
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setAtt(p => ({...p, [studentId]: next}));
  }

  function markAll(status: AttStatus) {
    const update: Record<string, AttStatus> = {};
    students.forEach((s:any) => { update[s.id] = status; });
    setAtt(p => ({...p, ...update}));
  }

  async function submit() {
    if (!sectionId) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API call
    setSaved(true); setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle={`${date} — ${sections.find((s:any)=>s.id===sectionId)?.name ?? "Select a class"}`}/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Present" value={String(stats.present)} note={`${pct}%`} color="#059669" bg="#ECFDF5"><Check size={20}/></StatCard>
        <StatCard label="Absent"  value={String(stats.absent)}  note=""          color="#EF4444" bg="#FFF0F1"><XIcon size={20}/></StatCard>
        <StatCard label="Late"    value={String(stats.late)}    note=""          color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
        <StatCard label="Rate"    value={`${pct}%`}              note={stats.total > 0 ? `${stats.total} students` : "Select class"} color={pct>=75?"#059669":pct>=60?"#D97706":"#EF4444"} bg={pct>=75?"#ECFDF5":pct>=60?"#FFFBEB":"#FFF0F1"}><BarChart3 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="mark"?"active":""} onClick={()=>setTab("mark")}>✅ Mark attendance</button>
        <button className={tab==="history"?"active":""} onClick={()=>setTab("history")}>📊 History & reports</button>
      </div>

      {tab==="mark" && (
        <div className="surface">
          {/* Controls row */}
          <div style={{padding:"16px 20px",borderBottom:"1px solid var(--line)",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <select value={sectionId} onChange={e=>setSectionId(e.target.value)}
              style={{height:36,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12,minWidth:200}}>
              <option value="">— Select class section —</option>
              {sections.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{height:36,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search student…"
              style={{height:36,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12,flex:1,minWidth:150}}/>
            <div style={{marginLeft:"auto",display:"flex",gap:6}}>
              {(["PRESENT","ABSENT","LATE"] as AttStatus[]).map(s=>(
                <button key={s} onClick={()=>markAll(s)}
                  style={{height:32,padding:"0 12px",borderRadius:8,border:`1px solid ${STATUS_META[s].color}30`,background:STATUS_META[s].bg,color:STATUS_META[s].color,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  All {s.charAt(0)+s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {!sectionId ? (
            <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
              <CalendarCheck size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
              <b>Select a class section to mark attendance</b>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Reg #</th>
                    <th style={{textAlign:"center"}}>Status</th>
                    <th>Quick toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s:any, idx:number) => {
                    const st: AttStatus = attendance[s.id] ?? "PRESENT";
                    const meta = STATUS_META[st];
                    return (
                      <tr key={s.id} style={{cursor:"pointer"}} onClick={()=>cycle(s.id)}>
                        <td style={{color:"var(--muted)",fontSize:11}}>{idx+1}</td>
                        <td>
                          <div className="person-cell">
                            <span className="row-avatar" style={{background:meta.bg,color:meta.color}}>
                              {s.firstName?.[0]}{s.lastName?.[0]??""}
                            </span>
                            <div>
                              <b>{s.firstName} {s.lastName ?? ""}</b>
                              <div style={{fontSize:10,color:"var(--muted)"}}>{s.gender ?? ""}</div>
                            </div>
                          </div>
                        </td>
                        <td><code style={{fontSize:11}}>{s.studentNumber ?? "—"}</code></td>
                        <td style={{textAlign:"center"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 12px",borderRadius:20,background:meta.bg,color:meta.color,fontSize:11,fontWeight:700}}>
                            {meta.icon}{meta.label}
                          </span>
                        </td>
                        <td>
                          <div style={{display:"flex",gap:4}}>
                            {(["PRESENT","ABSENT","LATE","EXCUSED"] as AttStatus[]).map(status=>(
                              <button key={status} onClick={e=>{e.stopPropagation();setAtt(p=>({...p,[s.id]:status}));}}
                                style={{width:28,height:28,borderRadius:6,border:`1.5px solid ${st===status?STATUS_META[status].color:"var(--line)"}`,background:st===status?STATUS_META[status].bg:"var(--surface)",cursor:"pointer",fontSize:9,fontWeight:700,color:st===status?STATUS_META[status].color:"var(--muted)"}}>
                                {status[0]}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {sectionId && (
            <div style={{padding:"14px 20px",borderTop:"1px solid var(--line)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:12,color:"var(--muted)"}}>
                {stats.present} present · {stats.absent} absent · {stats.late} late · {stats.excused} excused — <b>{pct}% attendance rate</b>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {saved && <span style={{fontSize:12,color:"#059669",fontWeight:700}}>✓ Saved successfully</span>}
                <button className="primary" onClick={submit} disabled={saving||!sectionId}
                  style={{height:38,fontSize:12,padding:"0 20px"}}>
                  {saving?"Saving…":"Submit attendance"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="history" && (
        <div className="surface">
          <div className="surface-head"><h3>Attendance history</h3><p>Last 5 days — class-wise summary</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Date</th><th>Class</th><th>Present</th><th>Absent</th><th>Late</th><th>Rate</th></tr></thead>
              <tbody>
                {HISTORY.map((h,i) => {
                  const rate = Math.round((h.present/(h.present+h.absent+h.late+h.excused))*100);
                  return (
                    <tr key={i}>
                      <td><b style={{fontSize:12}}>{h.date}</b></td>
                      <td style={{fontSize:11}}>{h.section}</td>
                      <td><span style={{color:"#059669",fontWeight:700}}>{h.present}</span></td>
                      <td><span style={{color:"#EF4444",fontWeight:700}}>{h.absent}</span></td>
                      <td><span style={{color:"#D97706",fontWeight:700}}>{h.late}</span></td>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:60,height:6,borderRadius:999,background:"var(--surface-2)",overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${rate}%`,borderRadius:999,background:rate>=75?"#059669":"#EF4444"}}/>
                          </div>
                          <b style={{fontSize:12,color:rate>=75?"#059669":"#EF4444"}}>{rate}%</b>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
