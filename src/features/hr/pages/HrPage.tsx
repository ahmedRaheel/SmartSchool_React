import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { employees as MOCK } from "../../../mocks/data";

type Employee = typeof MOCK[0] & { cnic?:string; phone?:string; address?:string; dob?:string; gender?:string; qualification?:string; };

const EMPTY: Partial<Employee> = {
  name:"", employeeNumber:"", role:"Teacher", department:"Mathematics",
  joinDate:"", leaveBalance:"15 days", status:"Active",
  cnic:"", phone:"", address:"", dob:"", gender:"Male", qualification:"",
};

const DEPTS   = ["Mathematics","Sciences","Languages","Social Studies","CS","Admin","Finance","HR"];
const ROLES   = ["Teacher","Head of Department","Admin Officer","Accountant","Librarian","Driver","Support Staff"];

export function HrPage() {
  const [rows, setRows]       = useState<Employee[]>(MOCK);
  const [q, setQ]             = useState("");
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Employee|null>(null);
  const [form, setForm]       = useState<Partial<Employee>>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState<"personal"|"employment">("personal");

  const filtered = rows.filter(e =>
    e.name.toLowerCase().includes(q.toLowerCase()) ||
    e.employeeNumber.toLowerCase().includes(q.toLowerCase())
  );

  function openAdd()            { setEditing(null); setForm(EMPTY); setTab("personal"); setOpen(true); }
  function openEdit(e: Employee){ setEditing(e); setForm(e); setTab("personal"); setOpen(true); }
  function remove(e: Employee)  { if(confirm(`Remove "${e.name}"?`)) setRows(p=>p.filter(x=>x.id!==e.id)); }
  const f = (k: keyof Employee) => (ev: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:ev.target.value}));

  async function save() {
    if(!form.name) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,500));
    if(editing) {
      setRows(p=>p.map(x=>x.id===editing.id?{...x,...form} as Employee:x));
    } else {
      const num = `EMP-${String(rows.length+1).padStart(3,"0")}`;
      setRows(p=>[...p,{...EMPTY,...form,id:Date.now().toString(),employeeNumber:num} as Employee]);
    }
    setSaving(false); setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="HR Management"
        subtitle="Staff records, positions, leave and payroll"
        action={
          <div className="page-actions">
            <button className="secondary">Export</button>
            <button className="primary" onClick={openAdd}><Plus size={15}/> Add Staff</button>
          </div>
        }
      />

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total Staff"    value={String(rows.length)} note="" color="#0F2241" bg="#EEF2FF"><span style={{fontSize:20}}>👥</span></StatCard>
        <StatCard label="Active"         value={String(rows.filter(e=>e.status==="Active").length)} note="" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="On Leave"       value={String(rows.filter(e=>e.status==="On Leave").length)} note="" color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>🏖️</span></StatCard>
        <StatCard label="Payroll Due"    value="Sep 1" note="" color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>💳</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{maxWidth:320}}>
            <Search size={14}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search staff…"/>
          </label>
          <button className="primary" onClick={openAdd}><Plus size={14}/> Add Staff</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Name</th><th>Employee No.</th><th>Role</th><th>Department</th><th>Join Date</th><th>Leave Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(e=>(
                <tr key={e.id}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{background:"#EEF2FF",color:"#6366F1"}}>
                        {e.name.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                      </span>
                      <b>{e.name}</b>
                    </div>
                  </td>
                  <td><code style={{fontSize:11}}>{e.employeeNumber}</code></td>
                  <td>{e.role}</td>
                  <td>{e.department}</td>
                  <td>{e.joinDate}</td>
                  <td>{e.leaveBalance}</td>
                  <td><span className={`status-pill ${e.status==="Active"?"success":"warning"}`}>{e.status}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action" onClick={()=>openEdit(e)}>Edit</button>
                      <button className="table-action" style={{color:"var(--danger)"}} onClick={()=>remove(e)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Employee Modal ── */}
      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(700px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,zIndex:1,background:"var(--surface)"}}>
              <h2>{editing?"Edit Staff Member":"Add Staff Member"}</h2>
              <button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button>
            </div>

            <div className="section-tabs" style={{padding:"12px 20px 0",marginBottom:0,borderBottom:"1px solid var(--line)"}}>
              {(["personal","employment"] as const).map(t=>(
                <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>
                  {t==="personal"?"👤 Personal Info":"💼 Employment"}
                </button>
              ))}
            </div>

            <div className="human-form">
              {tab==="personal" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Full Name *</span><input value={form.name||""} onChange={f("name" as any)}/></label>
                  <label className="human-field"><span>CNIC</span><input value={form.cnic||""} onChange={f("cnic" as any)} placeholder="XXXXX-XXXXXXX-X"/></label>
                  <label className="human-field"><span>Date of Birth</span><input type="date" value={form.dob||""} onChange={f("dob" as any)}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender||"Male"} onChange={f("gender" as any)}>
                      <option>Male</option><option>Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Phone</span><input value={form.phone||""} onChange={f("phone" as any)} placeholder="+92 300 0000000"/></label>
                  <label className="human-field"><span>Qualification</span><input value={form.qualification||""} onChange={f("qualification" as any)} placeholder="e.g. MSc Mathematics"/></label>
                  <label className="human-field field-wide"><span>Address</span><textarea value={form.address||""} onChange={f("address" as any)} style={{minHeight:72}}/></label>
                </div>
              )}
              {tab==="employment" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Role / Position *</span>
                    <select value={form.role||"Teacher"} onChange={f("role" as any)}>
                      {ROLES.map(r=><option key={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Department</span>
                    <select value={form.department||"Mathematics"} onChange={f("department" as any)}>
                      {DEPTS.map(d=><option key={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Join Date</span><input type="date" value={form.joinDate||""} onChange={f("joinDate" as any)}/></label>
                  <label className="human-field"><span>Employment Type</span>
                    <select>
                      <option>Permanent</option><option>Contract</option><option>Part-time</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Basic Salary (PKR)</span><input type="number" placeholder="50000"/></label>
                  <label className="human-field"><span>Status</span>
                    <select value={form.status||"Active"} onChange={f("status" as any)}>
                      <option>Active</option><option>On Leave</option><option>Resigned</option><option>Terminated</option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              {tab==="employment" && <button className="secondary" onClick={()=>setTab("personal")}>← Back</button>}
              <div style={{flex:1}}/>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              {tab==="personal"
                ? <button className="primary" onClick={()=>setTab("employment")}>Next →</button>
                : <button className="primary" onClick={save} disabled={saving||!form.name}>{saving?"Saving…":"Save Staff"}</button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
