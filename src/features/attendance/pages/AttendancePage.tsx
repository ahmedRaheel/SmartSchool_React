import { useState } from "react";
import { Save } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";

const ROSTER = [
  "Ahmed Hassan","Sara Malik","Omar Raza","Fatima Khan",
  "Zain Ali","Noor Siddiqui","Hamza Sheikh","Ayesha Tariq",
  "Bilal Khan","Hina Raza","Usman Ali","Mariam Shah",
];

type Status = "P" | "A" | "L";

export function AttendancePage() {
  const [status, setStatus] = useState<Record<number, Status>>(
    Object.fromEntries(ROSTER.map((_,i) => [i, "P" as Status]))
  );

  const counts = { P: 0, A: 0, L: 0 };
  Object.values(status).forEach(s => { counts[s]++; });

  const colors: Record<Status, string> = { P: "var(--success)", A: "var(--danger)", L: "var(--warning)" };

  return (
    <>
      <PageHeader
        title="Mark Attendance"
        subtitle="Grade 9-A · Mathematics · Today"
        action={<div className="page-actions"><button className="secondary">Reset</button><button className="primary"><Save size={15} /> Save</button></div>}
      />
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Present" value={String(counts.P)} note={`of ${ROSTER.length}`} color="#10B981" bg="#ECFDF5"><span>✅</span></StatCard>
        <StatCard label="Absent"  value={String(counts.A)} note=""                       color="#EF4444" bg="#FFF0F1"><span>❌</span></StatCard>
        <StatCard label="Late"    value={String(counts.L)} note=""                       color="#F59E0B" bg="#FFFBEB"><span>🕐</span></StatCard>
        <StatCard label="Rate"    value={`${Math.round(counts.P/ROSTER.length*100)}%`} note="" color="#2563EB" bg="#EFF6FF"><span>📊</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Student Attendance</h3><p>Click P / A / L to mark each student</p></div>
        <div style={{ padding: "0 20px 20px" }}>
          {ROSTER.map((name, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--surface-2)" }}>
              <span style={{ width: 24, fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>{i+1}</span>
              <span className="row-avatar" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                {name.split(" ").map(w => w[0]).join("")}
              </span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{name}</span>
              <div style={{ display: "flex", gap: 7 }}>
                {(["P","A","L"] as Status[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(prev => ({ ...prev, [i]: s }))}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: `2px solid ${status[i]===s ? colors[s] : "var(--line)"}`,
                      background: status[i]===s ? colors[s]+"18" : "var(--surface)",
                      color: colors[s], fontWeight: 800, fontSize: 12,
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
