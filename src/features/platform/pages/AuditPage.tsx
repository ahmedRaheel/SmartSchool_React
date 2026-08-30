import { useState } from "react";
import { RefreshCcw, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";

const AUDIT_LOG = [
  { id:"1", time:"14:32:18", actor:"superadmin@smartschool.local", role:"SuperAdmin",  action:"IMPERSONATION_START", entity:"User",    details:"Started impersonating admin@alnoor.edu.pk",          tenant:"Al-Noor Academy",  level:"warn"  },
  { id:"2", time:"14:30:05", actor:"admin@alnoor.edu.pk",          role:"Admin",       action:"STUDENT_CREATED",    entity:"Student", details:"Enrolled Ahmed Hassan — Grade 9-A",                  tenant:"Al-Noor Academy",  level:"info"  },
  { id:"3", time:"14:28:41", actor:"admin@alnoor.edu.pk",          role:"Admin",       action:"PAYMENT_RECORDED",   entity:"Invoice", details:"PKR 4,500 recorded for INV-2026-0892",              tenant:"Al-Noor Academy",  level:"info"  },
  { id:"4", time:"14:15:00", actor:"teacher@alnoor.edu.pk",        role:"Teacher",     action:"ATTENDANCE_SUBMITTED",entity:"Class",  details:"Attendance marked — Grade 9-A, 28 Aug 2026",        tenant:"Al-Noor Academy",  level:"info"  },
  { id:"5", time:"13:58:20", actor:"superadmin@smartschool.local", role:"SuperAdmin",  action:"TENANT_CREATED",     entity:"Tenant",  details:"New school onboarded: City Grammar School",          tenant:"Platform",         level:"info"  },
  { id:"6", time:"13:44:11", actor:"system@smartschool.local",     role:"System",      action:"PREDICTION_RUN",     entity:"AI",      details:"Dropout risk batch completed — 18 tenants, 2,840 students", tenant:"Platform",    level:"info"  },
  { id:"7", time:"12:30:00", actor:"owner@brightfuture.edu",       role:"SchoolAdmin", action:"AI_CONFIG_UPDATED",  entity:"AICore",  details:"Chatbot persona updated for Teacher role",           tenant:"Bright Future",    level:"info"  },
  { id:"8", time:"12:00:00", actor:"driver@alnoor.edu.pk",         role:"Driver",      action:"ROUTE_ALERT_SENT",   entity:"Transport",details:"Delay alert sent — Route A, 12 minutes",            tenant:"Al-Noor Academy",  level:"warn"  },
];

const LEVEL_PILL: Record<string,string> = { info:"info", warn:"warning", error:"danger", critical:"danger" };

export function AuditPage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");

  const filtered = AUDIT_LOG.filter(l =>
    (level === "all" || l.level === level) &&
    (JSON.stringify(l).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Audit & Logs"
        subtitle="Immutable record of all system and user actions across all tenants"
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Events today"     value="14,821" note="All tenants"     color="#2563EB" bg="#EFF6FF"><ShieldCheck size={20}/></StatCard>
        <StatCard label="Impersonations"   value="3"      note="This week"       color="#D97706" bg="#FFFBEB"><ShieldCheck size={20}/></StatCard>
        <StatCard label="Warnings"         value="8"      note="Require review"  color="#F59E0B" bg="#FFFBEB"><ShieldCheck size={20}/></StatCard>
        <StatCard label="Errors"           value="1"      note="Last 24 hours"   color="#EF4444" bg="#FFF0F1"><ShieldCheck size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <label className="search-box" style={{ maxWidth:280 }}>
              <Search size={14}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search logs…"/>
            </label>
            <select value={level} onChange={e=>setLevel(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}>
              <option value="all">All levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <button className="secondary"><RefreshCcw size={13}/> Refresh</button>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th><th>Tenant</th><th>Level</th></tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td><code style={{ fontSize:11 }}>{l.time}</code></td>
                  <td>
                    <div style={{ fontSize:11 }}>
                      <b style={{ display:"block" }}>{l.actor.split("@")[0]}</b>
                      <span className={`status-pill ${l.role==="SuperAdmin"?"purple":l.role==="System"?"info":"gray"}`} style={{ fontSize:9 }}>{l.role}</span>
                    </div>
                  </td>
                  <td><code style={{ fontSize:10 }}>{l.action}</code></td>
                  <td><code style={{ fontSize:10 }}>{l.entity}</code></td>
                  <td style={{ maxWidth:240, fontSize:11, color:"var(--text-secondary)" }}>{l.details}</td>
                  <td style={{ fontSize:11 }}>{l.tenant}</td>
                  <td><span className={`status-pill ${LEVEL_PILL[l.level]}`}>{l.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} events shown</span></div>
      </div>
    </>
  );
}
