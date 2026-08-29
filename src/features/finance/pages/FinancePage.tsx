import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { invoices as MOCK } from "../../../mocks/data";

type Invoice = typeof MOCK[0] & { id: string; invoiceNo?: string; };
interface Payment { invoiceId: string; amount: string; method: string; ref: string; date: string; }

const METHODS = ["Cash","Bank Transfer","Online","Cheque","Wallet"];

export function FinancePage() {
  const [rows, setRows]       = useState<Invoice[]>(MOCK.map((r,i)=>({...r,id:String(i+1),invoiceNo:`INV-2026-0${890+i}`})));
  const [q, setQ]             = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice|null>(null);
  const [saving, setSaving]   = useState(false);

  const [newInv, setNewInv] = useState({ student:"",grade:"Grade 9",amount:"",due:"",type:"Tuition Fee" });
  const [pay, setPay]       = useState<Payment>({ invoiceId:"",amount:"",method:"Cash",ref:"",date:"" });

  const filtered = rows.filter(r =>
    r.student.toLowerCase().includes(q.toLowerCase()) ||
    (r.invoiceNo||"").includes(q)
  );

  function openPay(r: Invoice) { setPayTarget(r); setPay({invoiceId:r.id,amount:String(r.amount),method:"Cash",ref:"",date:new Date().toISOString().slice(0,10)}); setPayOpen(true); }

  async function saveInvoice() {
    if(!newInv.student||!newInv.amount) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    const no = `INV-2026-0${rows.length+890}`;
    setRows(p=>[...p,{id:Date.now().toString(),invoiceNo:no,student:newInv.student,grade:newInv.grade,amount:Number(newInv.amount),due:newInv.due,status:"Pending"}]);
    setSaving(false); setAddOpen(false); setNewInv({student:"",grade:"Grade 9",amount:"",due:"",type:"Tuition Fee"});
  }

  async function savePayment() {
    if(!pay.amount) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    setRows(p=>p.map(r=>r.id===payTarget?.id?{...r,status:"Paid"}:r));
    setSaving(false); setPayOpen(false);
  }

  return (
    <>
      <PageHeader
        title="Fees & Finance"
        subtitle="Collection, invoices, payments and scholarships"
        action={<div className="page-actions"><button className="secondary">Export</button><button className="primary" onClick={()=>setAddOpen(true)}><Plus size={15}/> New Invoice</button></div>}
      />

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Collected"       value="$847K" note="↑ 4% vs last month" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>💰</span></StatCard>
        <StatCard label="Pending"         value="$153K" note={`${rows.filter(r=>r.status==="Pending").length} invoices`} color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>⏳</span></StatCard>
        <StatCard label="Overdue"         value="$42K"  note={`${rows.filter(r=>r.status==="Overdue").length} critical`} color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>🚨</span></StatCard>
        <StatCard label="Collection Rate" value="91%"   note="↑ 4%"  color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📊</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{maxWidth:300}}>
            <Search size={14}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search invoice or student…"/>
          </label>
          <button className="primary" onClick={()=>setAddOpen(true)}><Plus size={14}/> New Invoice</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Invoice No.</th><th>Student</th><th>Grade</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td><code style={{fontSize:11}}>{r.invoiceNo}</code></td>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{background:"#EFF6FF",color:"#2563EB"}}>{r.student.split(" ").map((w:string)=>w[0]).join("")}</span>
                      <b>{r.student}</b>
                    </div>
                  </td>
                  <td>{r.grade}</td>
                  <td><b>${r.amount}</b></td>
                  <td>{r.due}</td>
                  <td><span className={`status-pill ${r.status==="Paid"?"success":r.status==="Overdue"?"danger":"warning"}`}>{r.status}</span></td>
                  <td>
                    <div className="row-actions">
                      {r.status!=="Paid" && <button className="table-action" style={{color:"var(--success)"}} onClick={()=>openPay(r)}>Collect</button>}
                      {r.status==="Paid" && <button className="table-action">Receipt</button>}
                      <button className="table-action">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{filtered.length} invoices</span></div>
      </div>

      {/* New Invoice Modal */}
      {addOpen && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setAddOpen(false)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Create Invoice</h2><button className="icon-button" onClick={()=>setAddOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Student Name *</span><input value={newInv.student} onChange={e=>setNewInv(p=>({...p,student:e.target.value}))}/></label>
                <label className="human-field"><span>Grade</span>
                  <select value={newInv.grade} onChange={e=>setNewInv(p=>({...p,grade:e.target.value}))}>
                    {["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"].map(g=><option key={g}>{g}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Fee Type</span>
                  <select value={newInv.type} onChange={e=>setNewInv(p=>({...p,type:e.target.value}))}>
                    {["Tuition Fee","Transport Fee","Library Fee","Lab Fee","Admission Fee"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Amount ($) *</span><input type="number" value={newInv.amount} onChange={e=>setNewInv(p=>({...p,amount:e.target.value}))}/></label>
                <label className="human-field"><span>Due Date</span><input type="date" value={newInv.due} onChange={e=>setNewInv(p=>({...p,due:e.target.value}))}/></label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setAddOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveInvoice} disabled={saving||!newInv.student||!newInv.amount}>{saving?"Saving…":"Create Invoice"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payOpen && payTarget && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setPayOpen(false)}}>
          <div className="modal-card" style={{width:"min(500px,96vw)"}}>
            <div className="modal-head"><h2>Record Payment</h2><button className="icon-button" onClick={()=>setPayOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div style={{padding:"0 0 14px",borderBottom:"1px solid var(--line)",marginBottom:14}}>
                <div style={{fontSize:12,color:"var(--muted)"}}>Invoice</div>
                <div style={{fontSize:14,fontWeight:700}}>{payTarget.invoiceNo} — {payTarget.student}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>Outstanding: <b style={{color:"var(--danger)"}}>$ {payTarget.amount}</b></div>
              </div>
              <div className="human-form-grid">
                <label className="human-field"><span>Amount Received *</span><input type="number" value={pay.amount} onChange={e=>setPay(p=>({...p,amount:e.target.value}))}/></label>
                <label className="human-field"><span>Payment Method</span>
                  <select value={pay.method} onChange={e=>setPay(p=>({...p,method:e.target.value}))}>
                    {METHODS.map(m=><option key={m}>{m}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Payment Date</span><input type="date" value={pay.date} onChange={e=>setPay(p=>({...p,date:e.target.value}))}/></label>
                <label className="human-field"><span>Reference / Transaction No.</span><input value={pay.ref} onChange={e=>setPay(p=>({...p,ref:e.target.value}))} placeholder="Bank reference if any"/></label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setPayOpen(false)}>Cancel</button>
              <button className="primary" onClick={savePayment} disabled={saving||!pay.amount}>{saving?"Saving…":"Record Payment"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
