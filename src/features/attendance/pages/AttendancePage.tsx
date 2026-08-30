import { useState } from "react";
import { Check, Clock, UserCheck, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useStudents, useClassSections } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

type AttStatus = "PRESENT"|"ABSENT"|"LATE";

export function AttendancePage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0,10);
  const { data: sectionsData } = useClassSections();
  const sections = (sectionsData as any)?.items ?? (sectionsData as any) ?? [];
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data } = useStudents(1);
  const students = (data as any)?.items ?? (data as any) ?? [];

  const stats = {
    present: Object.values(attendance).filter(s=>s==="PRESENT").length,
    absent:  Object.values(attendance).filter(s=>s==="ABSENT").length,
    late:    Object.values(attendance).filter(s=>s==="LATE").length,
  };

  function mark(id: string, status: AttStatus) {
    setAttendance(p => ({ ...p, [id]: status }));
    setSaved(false);
  }

  function markAll(status: AttStatus) {
    const newAtt: Record<string,AttStatus> = {};
    students.forEach((s:any) => { newAtt[s.id] = status; });
    setAttendance(newAtt);
    setSaved(false);
  }

  async function submit() {
    setSaving(true);
    // Real backend would POST to /api/students/attendance
    // Using local state only — backend endpoint takes { tenantId, classSectionId, date, attendanceRecords: [{studentId, status}] }
    await new Promise(r => setTimeout(r, 600));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <>
      <PageHeader title="Attendance" subtitle={`Daily attendance register — ${date}`}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Present" value={String(stats.present)} note="" color="#10B981" bg="#ECFDF5"><Check size={20}/></StatCard>
        <StatCard label="Absent"  value={String(stats.absent)}  note="" color="#EF4444" bg="#FFF0F1"><X size={20}/></StatCard>
        <StatCard label="Late"    value={String(stats.late)}    note="" color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
        <StatCard label="Total"   value={String(students.length)} note="" color="#2563EB" bg="#EFF6FF"><UserCheck size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            <select value={sectionId} onChange={e=>setSectionId(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12, minWidth:160 }}>
              <option value="">— All students —</option>
              {sections.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}/>
            <button className="secondary" style={{ fontSize:11 }} onClick={() => markAll("PRESENT")}>✓ Mark all present</button>
            <button className="secondary" style={{ fontSize:11 }} onClick={() => markAll("ABSENT")}>✗ Mark all absent</button>
          </div>
          <button className="primary" style={{ fontSize:12 }} onClick={submit} disabled={saving||saved}>
            {saving?"Saving…":saved?"Saved ✓":"Submit attendance"}
          </button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Student</th><th>Reg #</th><th>Present</th><th>Absent</th><th>Late</th></tr>
            </thead>
            <tbody>
              {students.map((s:any) => {
                const status = attendance[s.id];
                return (
                  <tr key={s.id} style={{ background: status==="ABSENT"?"#FFF0F1":status==="LATE"?"#FFFBEB":"" }}>
                    <td>
                      <div className="person-cell">
                        <span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>
                          {(s.firstName[0]+(s.lastName?.[0]??"")).toUpperCase()}
                        </span>
                        <b>{s.firstName} {s.lastName ?? ""}</b>
                      </div>
                    </td>
                    <td><code style={{ fontSize:11 }}>{s.studentNumber ?? "—"}</code></td>
                    <td>
                      <button onClick={() => mark(s.id,"PRESENT")}
                        style={{ width:32, height:32, border:`2px solid ${status==="PRESENT"?"#10B981":"var(--line)"}`, borderRadius:8, background:status==="PRESENT"?"#10B981":"transparent", color:status==="PRESENT"?"white":"var(--text)", cursor:"pointer", fontWeight:700 }}>P</button>
                    </td>
                    <td>
                      <button onClick={() => mark(s.id,"ABSENT")}
                        style={{ width:32, height:32, border:`2px solid ${status==="ABSENT"?"#EF4444":"var(--line)"}`, borderRadius:8, background:status==="ABSENT"?"#EF4444":"transparent", color:status==="ABSENT"?"white":"var(--text)", cursor:"pointer", fontWeight:700 }}>A</button>
                    </td>
                    <td>
                      <button onClick={() => mark(s.id,"LATE")}
                        style={{ width:32, height:32, border:`2px solid ${status==="LATE"?"#D97706":"var(--line)"}`, borderRadius:8, background:status==="LATE"?"#D97706":"transparent", color:status==="LATE"?"white":"var(--text)", cursor:"pointer", fontWeight:700 }}>L</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>{students.length} students · {stats.present} present · {stats.absent} absent · {stats.late} late</span>
        </div>
      </div>
    </>
  );
}
