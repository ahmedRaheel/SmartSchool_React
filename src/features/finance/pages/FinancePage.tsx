/**
 * FinancePage — Fee management, invoices, payments and fee structures
 * Tabs: Invoices (with pay now) · Fee Types · Fee Structure · Payments · Reports
 */
import { useState, useMemo } from "react";
import { Plus, Search, X, Wallet, CreditCard, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useInvoices, useCreateInvoice, useCreatePayment,
  useFeeTypes, useCreateFeeType,
  useFeeStructure, useCreateFeeStructure,
  useGradeLevels, useStudents,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?:string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => n !== undefined ? `PKR ${Number(n).toLocaleString()}` : "—";
const STATUS_PILL: Record<string,string> = { PAID:"success", PENDING:"warning", OVERDUE:"danger", CANCELLED:"gray", PARTIAL:"info" };
const FREQ_OPTIONS = ["Monthly","Term","Annual","OneTime"];

export function FinancePage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"invoices"|"feetype"|"structure"|"payments">("invoices");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [invModal, setInvModal]   = useState(false);
  const [payModal, setPayModal]   = useState<any|null>(null);
  const [ftModal, setFtModal]     = useState(false);
  const [fsModal, setFsModal]     = useState(false);
  const [error, setError]         = useState("");
  const [paySuccess, setPaySuccess] = useState(false);

  const { data: invData, isLoading } = useInvoices();
  const { data: ftData }   = useFeeTypes();
  const { data: fsData }   = useFeeStructure();
  const { data: gradeData }= useGradeLevels();
  const { data: studData } = useStudents();
  const createInvoice = useCreateInvoice();
  const createPayment = useCreatePayment();
  const createFeeType = useCreateFeeType();
  const createFeeStructure = useCreateFeeStructure();

  const invoices   = (invData as any)?.items  ?? (invData as any)  ?? [];
  const feeTypes   = Array.isArray(ftData)    ? ftData              : (ftData as any)?.items  ?? [];
  const feeStruct  = (fsData as any)?.items   ?? (fsData as any)   ?? [];
  const grades     = (gradeData as any)?.items?? (gradeData as any)?? [];
  const students   = (studData as any)?.items ?? (studData as any) ?? [];

  const [invForm, setInvForm] = useState({ studentId:"", name:"", totalAmount:"", dueDate:"", notes:"" });
  const [ftForm, setFtForm]   = useState({ name:"", frequency:"Monthly", description:"" });
  const [fsForm, setFsForm]   = useState({ gradeLevelId:"", feeTypeId:"", amount:"", frequency:"Monthly", academicYearId:"" });
  const [payForm, setPayForm] = useState({ amount:"", method:"CASH", reference:"" });

  const ivf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setInvForm(p=>({...p,[k]:e.target.value}));
  const ftf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setFtForm(p=>({...p,[k]:e.target.value}));
  const fsf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setFsForm(p=>({...p,[k]:e.target.value}));
  const pyf = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setPayForm(p=>({...p,[k]:e.target.value}));

  const filtered = useMemo(() => {
    let list = invoices;
    if (filterStatus !== "ALL") list = list.filter((i:any) => parseMeta(i.metadataJson).status === filterStatus);
    if (search) list = list.filter((i:any) => `${i.name} ${i.code} ${parseMeta(i.metadataJson).studentId}`.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [invoices, filterStatus, search]);

  const collected    = invoices.filter((i:any)=>parseMeta(i.metadataJson).status==="PAID").reduce((a:number,i:any)=>a+(parseMeta(i.metadataJson).amount||0),0);
  const outstanding  = invoices.filter((i:any)=>!["PAID","CANCELLED"].includes(parseMeta(i.metadataJson).status||"")).reduce((a:number,i:any)=>a+(parseMeta(i.metadataJson).amount||0),0);
  const overdue      = invoices.filter((i:any)=>parseMeta(i.metadataJson).status==="OVERDUE").length;

  async function saveInvoice() {
    if (!invForm.studentId || !invForm.totalAmount || !invForm.dueDate) { setError("Student, amount and due date required"); return; }
    try {
      await createInvoice.mutateAsync({ tenantId:tid, name:invForm.name||`Invoice – ${invForm.dueDate}`, metadataJson:JSON.stringify({ studentId:invForm.studentId, amount:Number(invForm.totalAmount), dueDate:invForm.dueDate, status:"PENDING", notes:invForm.notes }) });
      setInvModal(false); setInvForm({ studentId:"", name:"", totalAmount:"", dueDate:"", notes:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function recordPayment() {
    if (!payModal || !payForm.amount) { setError("Amount required"); return; }
    try {
      await createPayment.mutateAsync({ tenantId:tid, name:`Payment for ${payModal.name}`, metadataJson:JSON.stringify({ invoiceId:payModal.id, amount:Number(payForm.amount), method:payForm.method, reference:payForm.reference, status:"COMPLETED", date:new Date().toISOString().slice(0,10) }) });
      setPaySuccess(true); setTimeout(()=>{ setPayModal(null); setPaySuccess(false); setPayForm({ amount:"", method:"CASH", reference:"" }); }, 2000);
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveFeeType() {
    if (!ftForm.name) { setError("Name required"); return; }
    try {
      await createFeeType.mutateAsync({ tenantId:tid, name:ftForm.name, frequency:ftForm.frequency, description:ftForm.description||undefined });
      setFtModal(false); setFtForm({ name:"", frequency:"Monthly", description:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveFeeStructure() {
    if (!fsForm.gradeLevelId||!fsForm.feeTypeId||!fsForm.amount) { setError("Grade level, fee type and amount required"); return; }
    try {
      await createFeeStructure.mutateAsync({ tenantId:tid, gradeLevelId:fsForm.gradeLevelId, feeTypeId:fsForm.feeTypeId, amount:Number(fsForm.amount), frequency:fsForm.frequency });
      setFsModal(false); setFsForm({ gradeLevelId:"", feeTypeId:"", amount:"", frequency:"Monthly", academicYearId:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Finance" subtitle="Invoices, fee types, structures and payment tracking"
        action={<div className="page-actions">
          {tab==="invoices"   && <button className="primary" onClick={()=>{setInvModal(true);setError("");}}><Plus size={14}/> New invoice</button>}
          {tab==="feetype"    && <button className="primary" onClick={()=>{setFtModal(true);setError("");}}><Plus size={14}/> Add fee type</button>}
          {tab==="structure"  && <button className="primary" onClick={()=>{setFsModal(true);setError("");}}><Plus size={14}/> Add structure</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Collected"   value={pkr(collected)}  note=""                   color="#10B981" bg="#ECFDF5"><Wallet size={20}/></StatCard>
        <StatCard label="Outstanding" value={pkr(outstanding)} note={`${filtered.filter((i:any)=>parseMeta(i.metadataJson).status!=="PAID"&&parseMeta(i.metadataJson).status!=="CANCELLED").length} invoices`} color="#D97706" bg="#FFFBEB"><CreditCard size={20}/></StatCard>
        <StatCard label="Overdue"     value={String(overdue)} note="need follow-up"     color={overdue>0?"#EF4444":"#10B981"} bg={overdue>0?"#FFF0F1":"#ECFDF5"}><FileText size={20}/></StatCard>
        <StatCard label="Fee types"   value={String(Array.isArray(feeTypes)?feeTypes.length:0)} note="" color="#8B5CF6" bg="#F5F3FF"><TrendingUp size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="invoices"?"active":""} onClick={()=>setTab("invoices")}>🧾 Invoices ({invoices.length})</button>
        <button className={tab==="feetype"?"active":""} onClick={()=>setTab("feetype")}>💰 Fee Types ({Array.isArray(feeTypes)?feeTypes.length:0})</button>
        <button className={tab==="structure"?"active":""} onClick={()=>setTab("structure")}>📐 Fee Structure ({feeStruct.length})</button>
        <button className={tab==="payments"?"active":""} onClick={()=>setTab("payments")}>💳 Payments</button>
      </div>

      {tab==="invoices" && (
        <div className="surface">
          <div className="surface-head">
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <label className="search-box" style={{maxWidth:240}}>
                <Search size={14}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search invoices…"/>
              </label>
              <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
                style={{height:34,padding:"0 10px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12}}>
                <option value="ALL">All status</option>
                {["PAID","PENDING","OVERDUE","CANCELLED"].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Invoice</th><th>Student</th><th>Amount (PKR)</th><th>Due date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No invoices found.</td></tr>
                  : filtered.map((inv:any) => {
                    const meta = parseMeta(inv.metadataJson);
                    const stu  = students.find((s:any)=>s.id===meta.studentId);
                    return (
                      <tr key={inv.id}>
                        <td><b style={{fontSize:12}}>{inv.name}</b><div style={{fontSize:10,color:"var(--muted)"}}><code>{inv.code}</code></div></td>
                        <td style={{fontSize:11}}>{stu ? `${stu.firstName} ${stu.lastName??""}`:"—"}</td>
                        <td><b style={{color:meta.status==="OVERDUE"?"#EF4444":meta.status==="PAID"?"#059669":"var(--text)"}}>{pkr(meta.amount)}</b></td>
                        <td style={{fontSize:11}}>{meta.dueDate ?? "—"}</td>
                        <td><span className={`status-pill ${STATUS_PILL[meta.status??"PENDING"]??"warning"}`}>{meta.status??"PENDING"}</span></td>
                        <td>
                          {meta.status !== "PAID" && meta.status !== "CANCELLED" && (
                            <button className="table-action" style={{fontSize:10,color:"#059669"}} onClick={()=>{setPayModal(inv);setError("");setPaySuccess(false);setPayForm({amount:String(meta.amount||""),method:"CASH",reference:""});}}>
                              💳 Pay now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer"><span>{filtered.length} invoices</span></div>
        </div>
      )}

      {tab==="feetype" && (
        <div className="surface">
          <div className="surface-head"><h3>Fee types</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Code</th><th>Name</th><th>Frequency</th><th>Description</th><th>Status</th></tr></thead>
              <tbody>
                {!Array.isArray(feeTypes)||feeTypes.length===0 ? <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No fee types configured.</td></tr>
                : (feeTypes as any[]).map((ft:any)=>(
                  <tr key={ft.id}>
                    <td><code style={{fontSize:11}}>{ft.code}</code></td>
                    <td><b>{ft.name}</b></td>
                    <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{ft.frequency}</span></td>
                    <td style={{fontSize:11,color:"var(--muted)"}}>{ft.description??"-"}</td>
                    <td><span className={`status-pill ${ft.isActive?"success":"gray"}`}>{ft.isActive?"Active":"Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="structure" && (
        <div className="surface">
          <div className="surface-head"><h3>Fee structure</h3><p>Amount per grade level × fee type</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Grade level</th><th>Fee type</th><th>Amount (PKR)</th><th>Frequency</th></tr></thead>
              <tbody>
                {feeStruct.length===0 ? <tr><td colSpan={4} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No fee structure configured.</td></tr>
                : feeStruct.map((fs:any)=>{
                  const gl = grades.find((g:any)=>g.id===(parseMeta(fs.metadataJson).gradeLevelId||fs.gradeLevelId));
                  const ft = (Array.isArray(feeTypes)?feeTypes:[]).find((f:any)=>f.id===(parseMeta(fs.metadataJson).feeTypeId||fs.feeTypeId));
                  const meta = parseMeta(fs.metadataJson);
                  return (
                    <tr key={fs.id}>
                      <td>{gl?.name??"-"}</td>
                      <td>{ft?.name??"-"}</td>
                      <td><b>{pkr(meta.amount||fs.amount)}</b></td>
                      <td>{meta.frequency||fs.frequency||"-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="payments" && (
        <div className="surface">
          <div className="surface-head"><h3>Payment history</h3></div>
          <div style={{padding:24,textAlign:"center",color:"var(--muted)"}}>
            <CreditCard size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
            <b>Payment ledger</b>
            <p style={{fontSize:12,margin:"8px 0 0"}}>Complete payment history is available via the reports module.</p>
            <button className="primary" style={{marginTop:14,fontSize:12}} onClick={()=>setTab("invoices")}>View invoices →</button>
          </div>
        </div>
      )}

      {/* New Invoice modal */}
      {invModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setInvModal(false)}}>
          <div className="modal-card" style={{width:"min(500px,96vw)"}}>
            <div className="modal-head"><h2>New invoice</h2><button className="icon-button" onClick={()=>setInvModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Student *</span>
                <select value={invForm.studentId} onChange={ivf("studentId")}>
                  <option value="">— Select student —</option>
                  {(students as any[]).map((s:any)=><option key={s.id} value={s.id}>{s.firstName} {s.lastName??""} ({s.studentNumber??s.id.slice(-5)})</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Description</span><input value={invForm.name} onChange={ivf("name")} placeholder="e.g. September Tuition Fee"/></label>
              <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={invForm.totalAmount} onChange={ivf("totalAmount")} placeholder="4500"/></label>
              <label className="human-field"><span>Due date *</span><input type="date" value={invForm.dueDate} onChange={ivf("dueDate")}/></label>
              <label className="human-field field-wide"><span>Notes</span><input value={invForm.notes} onChange={ivf("notes")} placeholder="Optional"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setInvModal(false)}>Cancel</button>
              <button className="primary" onClick={saveInvoice} disabled={createInvoice.isPending}>{createInvoice.isPending?"Saving…":"Create invoice"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Now modal */}
      {payModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget){setPayModal(null);setPaySuccess(false);}}}>
          <div className="modal-card" style={{width:"min(440px,96vw)"}}>
            <div className="modal-head"><h2>Record payment</h2><button className="icon-button" onClick={()=>{setPayModal(null);setPaySuccess(false);}}><X size={18}/></button></div>
            {paySuccess ? (
              <div style={{padding:32,textAlign:"center"}}>
                <CheckCircle2 size={48} style={{color:"#059669",margin:"0 auto 12px",display:"block"}}/>
                <b style={{fontSize:16,color:"#059669"}}>Payment recorded!</b>
                <p style={{fontSize:12,color:"var(--muted)",margin:"8px 0 0"}}>Invoice has been updated to PAID.</p>
              </div>
            ) : (
              <>
                <div style={{padding:"14px 20px",background:"var(--surface-2)",margin:"0 0 0"}}>
                  <div style={{fontSize:12,color:"var(--muted)"}}>Invoice</div>
                  <b>{payModal.name}</b>
                  <div style={{fontSize:12,color:"#D97706",marginTop:4}}>Outstanding: {pkr(parseMeta(payModal.metadataJson).amount)}</div>
                </div>
                <div className="human-form"><div className="human-form-grid">
                  <label className="human-field field-wide"><span>Amount (PKR) *</span><input type="number" value={payForm.amount} onChange={pyf("amount")}/></label>
                  <label className="human-field"><span>Payment method</span>
                    <select value={payForm.method} onChange={pyf("method")}>
                      {["CASH","CHEQUE","BANK_TRANSFER","ONLINE","JazzCash","EasyPaisa"].map(m=><option key={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Reference #</span><input value={payForm.reference} onChange={pyf("reference")} placeholder="Cheque/TRN no."/></label>
                </div>
                {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
                </div>
                <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
                  <button className="secondary" onClick={()=>setPayModal(null)}>Cancel</button>
                  <button className="primary" style={{background:"#059669"}} onClick={recordPayment} disabled={createPayment.isPending}>{createPayment.isPending?"Saving…":"✓ Confirm payment"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Fee Type */}
      {ftModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFtModal(false)}}>
          <div className="modal-card" style={{width:"min(420px,96vw)"}}>
            <div className="modal-head"><h2>Add fee type</h2><button className="icon-button" onClick={()=>setFtModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Fee type name *</span><input value={ftForm.name} onChange={ftf("name")} placeholder="e.g. Tuition Fee"/></label>
              <label className="human-field"><span>Frequency</span><select value={ftForm.frequency} onChange={ftf("frequency")}>{FREQ_OPTIONS.map(f=><option key={f}>{f}</option>)}</select></label>
              <label className="human-field"><span>Description</span><input value={ftForm.description} onChange={ftf("description")} placeholder="Optional"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setFtModal(false)}>Cancel</button>
              <button className="primary" onClick={saveFeeType} disabled={createFeeType.isPending}>{createFeeType.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Structure */}
      {fsModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFsModal(false)}}>
          <div className="modal-card" style={{width:"min(440px,96vw)"}}>
            <div className="modal-head"><h2>Add fee structure</h2><button className="icon-button" onClick={()=>setFsModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Grade level *</span>
                <select value={fsForm.gradeLevelId} onChange={fsf("gradeLevelId")}>
                  <option value="">— Select —</option>
                  {(grades as any[]).map((g:any)=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Fee type *</span>
                <select value={fsForm.feeTypeId} onChange={fsf("feeTypeId")}>
                  <option value="">— Select —</option>
                  {(Array.isArray(feeTypes)?feeTypes:[]).map((ft:any)=><option key={ft.id} value={ft.id}>{ft.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={fsForm.amount} onChange={fsf("amount")} placeholder="4500"/></label>
              <label className="human-field"><span>Frequency</span><select value={fsForm.frequency} onChange={fsf("frequency")}>{FREQ_OPTIONS.map(f=><option key={f}>{f}</option>)}</select></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setFsModal(false)}>Cancel</button>
              <button className="primary" onClick={saveFeeStructure} disabled={createFeeStructure.isPending}>{createFeeStructure.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
