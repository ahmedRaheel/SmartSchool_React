import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";

interface Application {
  id: string; appNo: string; name: string; grade: string; guardian: string;
  phone: string; source: string; date: string; score: string; status: string;
}

const MOCK: Application[] = [
  { id:"1", appNo:"APP-2026-001", name:"Hassan Ali",   grade:"Grade 6",  guardian:"Mr. Ali",   phone:"0300-1234567", source:"Walk-In",  date:"Aug 20", score:"—",   status:"Review"   },
  { id:"2", appNo:"APP-2026-002", name:"Mariam Shah",  grade:"Grade 9",  guardian:"Dr. Shah",  phone:"0301-2345678", source:"Website",  date:"Aug 18", score:"88%", status:"Approved" },
  { id:"3", appNo:"APP-2026-003", name:"Usman Butt",   grade:"Grade 7",  guardian:"Mrs. Butt", phone:"0302-3456789", source:"Referral", date:"Aug 15", score:"72%", status:"Approved" },
  { id:"4", appNo:"APP-2026-004", name:"Safia Noor",   grade:"Grade 11", guardian:"Mr. Noor",  phone:"0303-4567890", source:"Walk-In",  date:"Aug 12", score:"61%", status:"Rejected" },
  { id:"5", appNo:"APP-2026-005", name:"Ali Cheema",   grade:"Grade 8",  guardian:"Mrs. Cheema",phone:"0304-5678901",source:"Website", date:"Aug 10", score:"—",   status:"Test Scheduled"},
];

const GRADES   = ["Grade 6","Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SOURCES  = ["Walk-In","Website","Referral","AI Chatbot","Social Media"];
const STATUSES = ["Review","Test Scheduled","Approved","Rejected","Enrolled"];
const EMPTY = { name:"",grade:"Grade 9",guardian:"",phone:"",source:"Walk-In",score:"",status:"Review",date:"" };

export function AdmissionsPage() {
  const [rows, setRows]       = useState<Application[]>(MOCK);
  const [q, setQ]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Application|null>(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const filtered = rows.filter(r =>
    (statusFilter === "All" || r.status === statusFilter) &&
    (r.name.toLowerCase().includes(q.toLowerCase()) || r.appNo.includes(q))
  );

  function openAdd()           { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(r: Application){ setEditing(r); setForm(r); setOpen(true); }
  function remove(r: Application)  { if(confirm(`Delete application from "${r.name}"?`)) setRows(p=>p.filter(x=>x.id!==r.id)); }
  const f = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p=>({...p,[k]:e.target.value}));

  async function save() {
    if(!form.name||!form.grade||!form.guardian) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,500));
    if(editing) {
      setRows(p=>p.map(x=>x.id===editing.id?{...x,...form}:x));
    } else {
      const appNo = `APP-${new Date().getFullYear()}-${String(rows.length+1).padStart(3,"0")}`;
      setRows(p=>[...p,{...form,id:Date.now().toString(),appNo,date:new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}]);
    }
    setSaving(false); setOpen(false);
  }

  const statusColors: Record<string,string> = {
    "Review":"warning","Test Scheduled":"info","Approved":"success","Rejected":"danger","Enrolled":"purple"
  };

  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Inquiry → application → test → decision → enrolment"
        action={<div className="page-actions"><button className="primary" onClick={openAdd}><Plus size={15}/> New Application</button></div>}
      />

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total Applications" value={String(rows.length)} note="This cycle" color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📋</span></StatCard>
        <StatCard label="Approved"  value={String(rows.filter(r=>r.status==="Approved").length)}  note="" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="Pending"   value={String(rows.filter(r=>["Review","Test Scheduled"].includes(r.status)).length)} note="" color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>⏳</span></StatCard>
        <StatCard label="Rejected"  value={String(rows.filter(r=>r.status==="Rejected").length)} note="" color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>❌</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
            <label className="search-box" style={{maxWidth:260}}>
              <Search size={14}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search applicant…"/>
            </label>
            <select style={{height:36,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12}}
              value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="primary" onClick={openAdd}><Plus size={14}/> New Application</button>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>App No.</th><th>Applicant</th><th>Grade</th><th>Guardian</th><th>Source</th><th>Date</th><th>Test Score</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td><code style={{fontSize:11}}>{r.appNo}</code></td>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{background:"#EFF6FF",color:"#2563EB"}}>{r.name.split(" ").map((w:string)=>w[0]).join("")}</span>
                      <b>{r.name}</b>
                    </div>
                  </td>
                  <td>{r.grade}</td>
                  <td>{r.guardian}<small>{r.phone}</small></td>
                  <td>{r.source}</td>
                  <td>{r.date}</td>
                  <td><b>{r.score||"—"}</b></td>
                  <td><span className={`status-pill ${statusColors[r.status]||"gray"}`}>{r.status}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action" onClick={()=>openEdit(r)}>Edit</button>
                      {r.status==="Approved" && <button className="table-action" style={{color:"var(--success)"}}>Enroll</button>}
                      <button className="table-action" style={{color:"var(--danger)"}} onClick={()=>remove(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {filtered.length} of {rows.length}</span></div>
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(680px,96vw)"}}>
            <div className="modal-head">
              <h2>{editing?"Edit Application":"New Admission Application"}</h2>
              <button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button>
            </div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field"><span>Applicant Name *</span><input value={form.name} onChange={f("name")} placeholder="Child full name"/></label>
                <label className="human-field"><span>Grade Applying For *</span>
                  <select value={form.grade} onChange={f("grade")}>{GRADES.map(g=><option key={g}>{g}</option>)}</select>
                </label>
                <label className="human-field"><span>Guardian Name *</span><input value={form.guardian} onChange={f("guardian")}/></label>
                <label className="human-field"><span>Guardian Phone</span><input value={form.phone} onChange={f("phone")} placeholder="+92 300 0000000"/></label>
                <label className="human-field"><span>Inquiry Source</span>
                  <select value={form.source} onChange={f("source")}>{SOURCES.map(s=><option key={s}>{s}</option>)}</select>
                </label>
                <label className="human-field"><span>Status</span>
                  <select value={form.status} onChange={f("status")}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
                </label>
                <label className="human-field"><span>Test Score (%)</span><input value={form.score} onChange={f("score")} placeholder="Leave blank if not taken"/></label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={saving||!form.name||!form.guardian}>{saving?"Saving…":"Save Application"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
