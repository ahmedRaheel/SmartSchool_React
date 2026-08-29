import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { students as MOCK_STUDENTS } from "../../../mocks/data";

type Student = typeof MOCK_STUDENTS[0] & { dob?: string; gender?: string; guardian?: string; phone?: string; address?: string; };

const EMPTY: Partial<Student> = {
  name:"", studentNumber:"", className:"Grade 9", section:"A", status:"Active",
  attendance:"—", avgGrade:"—", feeStatus:"Pending",
  dob:"", gender:"Male", guardian:"", phone:"", address:"",
};

const GRADES = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];
const SECTIONS = ["A","B","C","D"];

export function StudentsPage() {
  const [rows, setRows]       = useState<Student[]>(MOCK_STUDENTS);
  const [q, setQ]             = useState("");
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm]       = useState<Partial<Student>>(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState<"personal"|"academic"|"guardian">("personal");

  const filtered = rows.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.studentNumber.includes(q)
  );

  function openAdd()           { setEditing(null); setForm(EMPTY); setTab("personal"); setOpen(true); }
  function openEdit(s: Student){ setEditing(s); setForm(s); setTab("personal"); setOpen(true); }
  function remove(s: Student)  { if(confirm(`Remove "${s.name}"?`)) setRows(p=>p.filter(x=>x.id!==s.id)); }
  const f = (k: keyof Student) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(p=>({...p,[k]:e.target.value}));

  async function save() {
    if(!form.name) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,500));
    if(editing) {
      setRows(p=>p.map(x=>x.id===editing.id?{...x,...form} as Student:x));
    } else {
      const num = `ADM-${new Date().getFullYear()}-${String(rows.length+1).padStart(3,"0")}`;
      setRows(p=>[...p,{...EMPTY,...form,id:Date.now().toString(),studentNumber:num} as Student]);
    }
    setSaving(false); setOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${rows.length} students enrolled · AY 2025–26`}
        action={
          <div className="page-actions">
            <button className="secondary">Export CSV</button>
            <button className="primary" onClick={openAdd}><Plus size={15}/> Enroll Student</button>
          </div>
        }
      />

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total Students"     value={String(rows.length)} note="Enrolled" color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>🎓</span></StatCard>
        <StatCard label="Active"             value={String(rows.filter(s=>s.status==="Active").length)} note="" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="Fee Defaulters"     value={String(rows.filter(s=>s.feeStatus==="Overdue").length)} note="Overdue" color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>⚠️</span></StatCard>
        <StatCard label="New This Month"     value="34" note="↑ 12%" color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>➕</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{maxWidth:320}}>
            <Search size={14}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name or roll number…"/>
          </label>
          <div style={{display:"flex",gap:8}}>
            <select className="soft-button" style={{border:"1.5px solid var(--line)",borderRadius:8,padding:"0 12px",fontSize:12}}>
              <option>All Grades</option>
              {GRADES.map(g=><option key={g}>{g}</option>)}
            </select>
            <button className="primary" onClick={openAdd}><Plus size={14}/> Enroll Student</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Student</th><th>Grade / Section</th><th>Roll No.</th><th>Attendance</th><th>Grade</th><th>Fee Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{background:"#EFF6FF",color:"#2563EB"}}>
                        {s.name.split(" ").map((w:string)=>w[0]).join("")}
                      </span>
                      <div><b>{s.name}</b><small>{s.status}</small></div>
                    </div>
                  </td>
                  <td>{s.className} — {s.section}</td>
                  <td><code style={{fontSize:11}}>{s.studentNumber}</code></td>
                  <td>{s.attendance}</td>
                  <td><b>{s.avgGrade}</b></td>
                  <td><span className={`status-pill ${s.feeStatus==="Paid"?"success":s.feeStatus==="Overdue"?"danger":"warning"}`}>{s.feeStatus}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action" onClick={()=>openEdit(s)}>Edit</button>
                      <button className="table-action" style={{color:"var(--danger)"}} onClick={()=>remove(s)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filtered.length} of {rows.length} students</span>
        </div>
      </div>

      {/* ── Add / Edit Student Modal ── */}
      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(700px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,zIndex:1,background:"var(--surface)"}}>
              <h2>{editing?"Edit Student":"Enroll New Student"}</h2>
              <button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button>
            </div>

            {/* Tabs */}
            <div className="section-tabs" style={{padding:"12px 20px 0",marginBottom:0,borderBottom:"1px solid var(--line)"}}>
              {(["personal","academic","guardian"] as const).map(t=>(
                <button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)} style={{marginBottom:-1}}>
                  {t==="personal"?"👤 Personal":t==="academic"?"📚 Academic":"👨‍👩‍👧 Guardian"}
                </button>
              ))}
            </div>

            <div className="human-form">
              {tab==="personal" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>First Name *</span><input value={(form.name||"").split(" ")[0]} onChange={e=>setForm(p=>({...p,name:e.target.value+" "+((p.name||"").split(" ").slice(1).join(" "))}))}/></label>
                  <label className="human-field"><span>Last Name</span><input value={(form.name||"").split(" ").slice(1).join(" ")} onChange={e=>setForm(p=>({...p,name:((p.name||"").split(" ")[0])+" "+e.target.value}))}/></label>
                  <label className="human-field"><span>Date of Birth</span><input type="date" value={form.dob||""} onChange={f("dob" as any)}/></label>
                  <label className="human-field">
                    <span>Gender</span>
                    <select value={form.gender||"Male"} onChange={f("gender" as any)}>
                      <option>Male</option><option>Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Phone / Mobile</span><input value={form.phone||""} onChange={f("phone" as any)} placeholder="+92 300 0000000"/></label>
                  <label className="human-field"><span>Status</span>
                    <select value={form.status||"Active"} onChange={f("status" as any)}>
                      <option>Active</option><option>Inactive</option><option>Graduated</option><option>Withdrawn</option>
                    </select>
                  </label>
                  <label className="human-field field-wide">
                    <span>Address</span>
                    <textarea value={form.address||""} onChange={f("address" as any)} style={{minHeight:72}} placeholder="Full home address"/>
                  </label>
                </div>
              )}

              {tab==="academic" && (
                <div className="human-form-grid">
                  <label className="human-field">
                    <span>Grade / Class *</span>
                    <select value={form.className||"Grade 9"} onChange={f("className" as any)}>
                      {GRADES.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="human-field">
                    <span>Section *</span>
                    <select value={form.section||"A"} onChange={f("section" as any)}>
                      {SECTIONS.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Admission Date</span><input type="date" defaultValue={new Date().toISOString().slice(0,10)}/></label>
                  <label className="human-field"><span>Fee Status</span>
                    <select value={form.feeStatus||"Pending"} onChange={f("feeStatus" as any)}>
                      <option>Paid</option><option>Pending</option><option>Overdue</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Roll / Admission No.</span><input value={form.studentNumber||""} onChange={f("studentNumber" as any)} placeholder="Auto-generated if blank"/></label>
                  <label className="human-field"><span>Previous School</span><input placeholder="Last school attended"/></label>
                </div>
              )}

              {tab==="guardian" && (
                <div className="human-form-grid">
                  <label className="human-field"><span>Guardian Name *</span><input value={form.guardian||""} onChange={f("guardian" as any)} placeholder="Father / Mother / Guardian"/></label>
                  <label className="human-field"><span>Relationship</span>
                    <select>
                      <option>Father</option><option>Mother</option><option>Guardian</option><option>Other</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Guardian Phone</span><input placeholder="+92 300 0000000"/></label>
                  <label className="human-field"><span>Guardian Email</span><input type="email" placeholder="guardian@email.com"/></label>
                  <label className="human-field"><span>CNIC</span><input placeholder="XXXXX-XXXXXXX-X"/></label>
                  <label className="human-field"><span>Occupation</span><input placeholder="e.g. Engineer"/></label>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              {tab !== "personal" && <button className="secondary" onClick={()=>setTab(tab==="guardian"?"academic":"personal")}>← Back</button>}
              <div style={{flex:1}}/>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              {tab !== "guardian"
                ? <button className="primary" onClick={()=>setTab(tab==="personal"?"academic":"guardian")}>Next →</button>
                : <button className="primary" onClick={save} disabled={saving||!form.name}>{saving?"Saving…":"Save Student"}</button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
