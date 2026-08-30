import { useState } from "react";
import { Plus, Search, ShieldCheck, X, Eye } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useAuth } from "../../auth/auth";

interface Tenant {
  id: string; name: string; code: string; plan: string; students: number;
  storage: string; status: string; mrr: string; adminEmail: string; adminName: string;
  school: string; city: string; joined: string;
}

const MOCK: Tenant[] = [
  { id:"1", name:"Al-Noor Academy",    code:"ALNOOR",  plan:"Enterprise", students:2840, storage:"68%", status:"Active",  mrr:"$2,400", adminEmail:"owner@alnoor.edu.pk",   adminName:"Mr. Tariq Akhtar",  school:"Al-Noor Academy",   city:"Karachi",    joined:"Jan 2024" },
  { id:"2", name:"Bright Future",      code:"BRIGHT",  plan:"Pro",        students:1120, storage:"41%", status:"Active",  mrr:"$960",   adminEmail:"admin@brightfuture.edu", adminName:"Mrs. Sana Malik",   school:"Bright Future",     city:"Lahore",     joined:"Mar 2024" },
  { id:"3", name:"City Grammar",       code:"CITYG",   plan:"Pro",        students:890,  storage:"55%", status:"Trial",   mrr:"$0",     adminEmail:"ceo@citygrammar.pk",     adminName:"Dr. Ali Hassan",    school:"City Grammar",      city:"Islamabad",  joined:"Jul 2026" },
  { id:"4", name:"Green Valley School",code:"GVS",     plan:"Starter",    students:420,  storage:"89%", status:"Warning", mrr:"$240",   adminEmail:"gvs@greenvalley.edu.pk", adminName:"Ms. Farah Ahmed",   school:"Green Valley",      city:"Peshawar",   joined:"Sep 2024" },
  { id:"5", name:"Horizon Public",     code:"HORIZON", plan:"Enterprise", students:3200, storage:"52%", status:"Active",  mrr:"$3,200", adminEmail:"admin@horizon.edu",      adminName:"Mr. Usman Butt",    school:"Horizon Public",    city:"Karachi",    joined:"Nov 2023" },
];

const PLAN_COLORS: Record<string,string> = { Enterprise:"purple", Pro:"info", Starter:"gray", Trial:"warning" };
const STATUS_COLORS: Record<string,string> = { Active:"success", Trial:"warning", Warning:"danger", Suspended:"danger" };

export function TenantManagementPage() {
  const { impersonate } = useAuth();
  const [rows, setRows]         = useState<Tenant[]>(MOCK);
  const [q, setQ]               = useState("");
  const [addOpen, setAddOpen]   = useState(false);
  const [selected, setSelected] = useState<Tenant|null>(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name:"",code:"",plan:"Pro",adminName:"",adminEmail:"",city:"",school:"" });

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.code.toLowerCase().includes(q.toLowerCase())
  );

  async function handleImpersonate(t: Tenant) {
    if (!confirm(`Impersonate ${t.adminName} at ${t.name}?\n\nAll actions will be logged with your Super Admin identity.`)) return;
    await impersonate(t.id, `Support session for ${t.name}`);
  }

  async function save() {
    if (!form.name || !form.adminEmail) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setRows(p => [...p, {
      id: Date.now().toString(), ...form,
      students: 0, storage: "0%", status: "Trial", mrr: "$0", joined: "Now",
    }]);
    setSaving(false); setAddOpen(false);
    setForm({ name:"",code:"",plan:"Pro",adminName:"",adminEmail:"",city:"",school:"" });
  }

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Tenant Management"
        subtitle="All school subscriptions · SmartSchool SaaS platform"
        action={
          <div className="page-actions">
            <button className="secondary">Export</button>
            <button className="primary" onClick={() => setAddOpen(true)}><Plus size={15}/> Onboard School</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Schools"  value={String(rows.length)} note="↑ 8 this quarter" color="#8B5CF6" bg="#F5F3FF"><span style={{fontSize:20}}>🏫</span></StatCard>
        <StatCard label="Active"         value={String(rows.filter(r=>r.status==="Active").length)} note="" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="Total Students" value={rows.reduce((a,r)=>a+r.students,0).toLocaleString()} note="Platform-wide" color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>🎓</span></StatCard>
        <StatCard label="Platform MRR"   value={`$${(rows.filter(r=>r.status!=="Trial").reduce((a,r)=>a+Number(r.mrr.replace(/\D/g,"")),0)/1000).toFixed(0)}K`} note="↑ 14% YoY" color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>💰</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth: 320 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tenant…"/>
          </label>
          <button className="primary" onClick={() => setAddOpen(true)}><Plus size={14}/> Onboard School</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>School</th><th>Plan</th><th>Students</th><th>Storage</th><th>Status</th><th>MRR</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{ background:"#EEF2FF",color:"#6366F1" }}>
                        {t.code.slice(0,2)}
                      </span>
                      <div>
                        <b>{t.name}</b>
                        <small>{t.city} · {t.adminEmail}</small>
                      </div>
                    </div>
                  </td>
                  <td><span className={`status-pill ${PLAN_COLORS[t.plan]||"gray"}`}>{t.plan}</span></td>
                  <td>{t.students.toLocaleString()}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div className="prog-track" style={{ width:60 }}>
                        <div className="prog-fill" style={{ width:t.storage, background: parseInt(t.storage)>80?"var(--danger)":"var(--success)" }}/>
                      </div>
                      <span style={{ fontSize:11 }}>{t.storage}</span>
                    </div>
                  </td>
                  <td><span className={`status-pill ${STATUS_COLORS[t.status]||"gray"}`}>{t.status}</span></td>
                  <td><b>{t.mrr}</b></td>
                  <td style={{ fontSize:11, color:"var(--muted)" }}>{t.joined}</td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action" onClick={() => setSelected(t)}><Eye size={13}/> View</button>
                      <button
                        className="table-action"
                        style={{ color:"#D97706", borderColor:"#fde68a", background:"#FFFBEB" }}
                        onClick={() => handleImpersonate(t)}
                      >
                        <ShieldCheck size={13}/> Impersonate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} tenants</span></div>
      </div>

      {/* Tenant Detail */}
      {selected && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setSelected(null); }}>
          <div className="modal-card" style={{ width:"min(600px,96vw)" }}>
            <div className="modal-head">
              <h2>{selected.name}</h2>
              <button className="icon-button" onClick={() => setSelected(null)}><X size={18}/></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  ["School code", selected.code],["Plan", selected.plan],
                  ["Admin", selected.adminName],["Email", selected.adminEmail],
                  ["City", selected.city],["Status", selected.status],
                  ["Students", selected.students.toLocaleString()],["Storage used", selected.storage],
                  ["MRR", selected.mrr],["Joined", selected.joined],
                ].map(([l,v]) => (
                  <div key={l as string} style={{ padding:"12px 14px",border:"0.5px solid var(--border)",borderRadius:10,background:"var(--surface-2)" }}>
                    <div style={{ fontSize:11,color:"var(--muted)",marginBottom:3 }}>{l}</div>
                    <div style={{ fontSize:13,fontWeight:500 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button className="secondary" onClick={() => setSelected(null)}>Close</button>
                <button
                  className="primary"
                  style={{ background:"#D97706" }}
                  onClick={() => { setSelected(null); handleImpersonate(selected); }}
                >
                  <ShieldCheck size={14}/> Impersonate Tenant Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant */}
      {addOpen && (
        <div className="modal-backdrop" onClick={e => { if(e.target===e.currentTarget) setAddOpen(false); }}>
          <div className="modal-card" style={{ width:"min(620px,96vw)" }}>
            <div className="modal-head">
              <h2>Onboard new school</h2>
              <button className="icon-button" onClick={() => setAddOpen(false)}><X size={18}/></button>
            </div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>School name *</span><input value={form.name} onChange={f("name")} placeholder="e.g. Beacon House"/></label>
                <label className="human-field"><span>Short code *</span><input value={form.code} onChange={e => setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. BEACON"/></label>
                <label className="human-field"><span>Plan</span>
                  <select value={form.plan} onChange={f("plan")}>
                    <option>Starter</option><option>Pro</option><option>Enterprise</option>
                  </select>
                </label>
                <label className="human-field"><span>Tenant admin name *</span><input value={form.adminName} onChange={f("adminName")}/></label>
                <label className="human-field"><span>Tenant admin email *</span><input type="email" value={form.adminEmail} onChange={f("adminEmail")}/></label>
                <label className="human-field"><span>City</span><input value={form.city} onChange={f("city")}/></label>
              </div>
              <div style={{ padding:"10px 0 0", fontSize:11, color:"var(--muted)", borderTop:"0.5px solid var(--border)", marginTop:4 }}>
                The tenant admin will receive an email with login credentials. They then configure their own schools, campuses, academic years, fee structure, and AI settings independently.
              </div>
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={saving||!form.name||!form.adminEmail}>
                {saving ? "Creating account…" : "Create tenant account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
