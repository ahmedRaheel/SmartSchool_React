import { RowActions } from "../../../components/ui/RowActions";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { useState, useMemo } from "react";
import { DollarSign, Plus, Search, X, CheckCircle2, FileText, Briefcase } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useEmployees, usePayrollRuns, useCreatePayrollRun, useSalaryStructures, usePayslips } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => n !== undefined ? `PKR ${Number(n).toLocaleString()}` : "—";
const SALARY_MAP: Record<string,number> = {
  TEACHER:29000, PRINCIPAL:85000, ADMIN_OFFICER:45000, ACCOUNTANT:55000,
  DRIVER:22000, HR:40000, LIBRARIAN:30000, TRANSPORT:25000, OTHER:20000,
};

export function PayrollPage() {
  const { user } = useAuth();
  const [viewRun, setViewRun] = useState<any|null>(null); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"register"|"runs"|"payslips">("register");
  const [search, setSearch] = useState("");
  const [runModal, setRunModal] = useState(false);
  const [runForm, setRunForm] = useState({ period:"", notes:"" });
  const [error, setError] = useState("");
  const [runSuccess, setRunSuccess] = useState(false);

  const { data: empData } = useEmployees();
  const { data: runsData } = usePayrollRuns();
  const { data: slipsData } = usePayslips();
  const createRun = useCreatePayrollRun();

  const employees = (empData as any)?.items ?? (empData as any) ?? [];
  const runs      = (runsData as any)?.items ?? (runsData as any) ?? [];
  const slips     = (slipsData as any)?.items ?? (slipsData as any) ?? [];

  const activeEmployees = employees.filter((e:any) => e.status === "ACTIVE");

  const filtered = useMemo(() =>
    activeEmployees.filter((e:any) =>
      `${e.firstName} ${e.lastName} ${e.staffType} ${e.employeeNumber}`.toLowerCase().includes(search.toLowerCase())
    ), [activeEmployees, search]);

  const totalPayroll = filtered.reduce((acc:number, e:any) => acc + (SALARY_MAP[e.staffType] ?? 20000), 0);
  const teacherTotal = filtered.filter((e:any)=>e.staffType==="TEACHER").reduce((acc:number,e:any)=>acc+(SALARY_MAP[e.staffType]??20000),0);

  async function runPayroll() {
    if (!runForm.period) { setError("Period required (e.g. August 2026)"); return; }
    try {
      await createRun.mutateAsync({ tenantId:tid, name:`Payroll Run — ${runForm.period}`, metadataJson:JSON.stringify({ period:runForm.period, notes:runForm.notes, totalAmount:totalPayroll, employeeCount:activeEmployees.length, status:"COMPLETED", runAt:new Date().toISOString() }) });
      setRunSuccess(true);
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Payroll" subtitle="Monthly payroll management, salary structures and payslips"
        action={<div className="page-actions">
          {tab==="register" && <button className="primary" onClick={()=>{setRunModal(true);setError("");setRunSuccess(false);}}>
            <DollarSign size={14}/> Run payroll
          </button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Active staff"    value={String(activeEmployees.length)} note="" color="#0F2241" bg="#EEF2FF"><Briefcase size={20}/></StatCard>
        <StatCard label="Est. payroll"    value={pkr(totalPayroll)}              note="This month"    color="#10B981" bg="#ECFDF5"><DollarSign size={20}/></StatCard>
        <StatCard label="Teaching staff"  value={String(filtered.filter((e:any)=>e.staffType==="TEACHER").length)} note={pkr(teacherTotal)} color="#2563EB" bg="#EFF6FF"><DollarSign size={20}/></StatCard>
        <StatCard label="Payroll runs"    value={String(runs.length)} note="Total" color="#8B5CF6" bg="#F5F3FF"><CheckCircle2 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="register"?"active":""} onClick={()=>setTab("register")}>👥 Payroll register ({activeEmployees.length})</button>
        <button className={tab==="runs"?"active":""} onClick={()=>setTab("runs")}>⚙️ Payroll runs ({runs.length})</button>
        <button className={tab==="payslips"?"active":""} onClick={()=>setTab("payslips")}>📄 Payslips</button>
      </div>

      {tab==="register" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search staff…"/>
            </label>
            <div style={{fontSize:12,color:"var(--muted)"}}>Est. total: <b style={{color:"#10B981"}}>{pkr(totalPayroll)}</b></div>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Employee</th><th>Number</th><th>Role</th><th>Type</th><th>Est. salary (PKR)</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"var(--muted)"}}>No active staff. Add employees in the HR module.</td></tr>
                  : filtered.map((e:any) => (
                    <tr key={e.id}>
                      <td>
                        <div className="person-cell">
                          <span className="row-avatar" style={{background:"#EEF2FF",color:"#6366F1"}}>{e.firstName[0]}{e.lastName?.[0]??""}</span>
                          <div><b>{e.firstName} {e.lastName??""}</b><div style={{fontSize:10,color:"var(--muted)"}}>{e.jobTitle??e.staffType}</div></div>
                        </div>
                      </td>
                      <td><code style={{fontSize:11}}>{e.employeeNumber??"—"}</code></td>
                      <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{e.staffType}</span></td>
                      <td style={{fontSize:11}}>{e.employmentTypeCode}</td>
                      <td><b>{pkr(SALARY_MAP[e.staffType]??20000)}</b></td>
                      <td><span className={`status-pill ${e.status==="ACTIVE"?"success":"gray"}`}>{e.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>{filtered.length} employees · Est. total: <b>{pkr(totalPayroll)}</b>/month</span>
          </div>
        </div>
      )}

      {tab==="runs" && (
        <div className="surface">
          <div className="surface-head"><h3>Payroll run history</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Run</th><th>Period</th><th>Employees</th><th>Total (PKR)</th><th>Status</th><th>Run at</th></tr></thead>
              <tbody>
                {runs.length===0
                  ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No payroll runs yet. Click "Run payroll" to begin.</td></tr>
                  : runs.map((r:any)=>{ const m=parseMeta(r.metadataJson); return (
                    <tr key={r.id}>
                      <td><b style={{fontSize:12}}>{r.name}</b></td>
                      <td>{m.period??"—"}</td>
                      <td>{m.employeeCount??"—"}</td>
                      <td><b>{pkr(m.totalAmount)}</b></td>
                      <td><span className={`status-pill ${m.status==="COMPLETED"?"success":"warning"}`}>{m.status??"PENDING"}</span></td>
                      <td style={{fontSize:11,color:"var(--muted)"}}>{m.runAt?new Date(m.runAt).toLocaleString():"—"}</td>
                    </tr>
                  );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="payslips" && (
        <div className="surface">
          <div className="surface-head"><h3>Payslips</h3><p>Generated payslips per employee per period</p></div>
          {slips.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
              <FileText size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
              <b>No payslips generated yet</b>
              <p style={{fontSize:12,margin:"8px 0 0"}}>Run a payroll to generate payslips for all active staff.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Employee</th><th>Period</th><th>Amount (PKR)</th></tr></thead>
                <tbody>{slips.map((s:any)=>{ const m=parseMeta(s.metadataJson); return <tr key={s.id}><td><b>{s.name}</b></td><td>{m.period??"—"}</td><td><b>{pkr(m.amount)}</b></td></tr>;})}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {runModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget){setRunModal(false);setRunSuccess(false);}}}>
          <div className="modal-card" style={{width:"min(460px,96vw)"}}>
            <div className="modal-head"><h2>Run payroll</h2><button className="icon-button" onClick={()=>{setRunModal(false);setRunSuccess(false);}}><X size={18}/></button></div>
            {runSuccess ? (
              <div style={{padding:32,textAlign:"center"}}>
                <CheckCircle2 size={48} style={{color:"#059669",margin:"0 auto 12px",display:"block"}}/>
                <b style={{fontSize:16,color:"#059669"}}>Payroll processed!</b>
                <p style={{fontSize:12,color:"var(--muted)",margin:"8px 0 16px"}}>{activeEmployees.length} payslips generated for {runForm.period}.</p>
                <div style={{padding:"12px 16px",background:"#ECFDF5",borderRadius:10,fontSize:13,fontWeight:700,color:"#059669"}}>Total: {pkr(totalPayroll)}</div>
                <button className="primary" style={{marginTop:16,width:"100%"}} onClick={()=>{setRunModal(false);setRunSuccess(false);setTab("runs");}}>View payroll runs →</button>
              </div>
            ) : (
              <>
                <div className="human-form">
                  <div style={{padding:"12px 14px",background:"var(--surface-2)",borderRadius:10,marginBottom:14,fontSize:12}}>
                    <b>{activeEmployees.length} active employees</b> · Est. total: <b style={{color:"#10B981"}}>{pkr(totalPayroll)}</b>
                  </div>
                  <div className="human-form-grid">
                    <label className="human-field field-wide"><span>Payroll period *</span>
                      <input value={runForm.period} onChange={e=>setRunForm(p=>({...p,period:e.target.value}))} placeholder="e.g. August 2026"/>
                    </label>
                    <label className="human-field field-wide"><span>Notes</span>
                      <input value={runForm.notes} onChange={e=>setRunForm(p=>({...p,notes:e.target.value}))} placeholder="Optional notes"/>
                    </label>
                  </div>
                  {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
                </div>
                <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
                  <button className="secondary" onClick={()=>setRunModal(false)}>Cancel</button>
                  <button className="primary" onClick={runPayroll} disabled={createRun.isPending}>{createRun.isPending?"Processing…":"✓ Process payroll"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>

      {viewRun && (
        <ViewDrawer title="Payroll run" item={viewRun} onClose={() => setViewRun(null)}
          fields={[
            { key: "name",      label: "Run name", wide: true },
            { key: "month",     label: "Month" },
            { key: "year",      label: "Year" },
            { key: "totalGross",label: "Gross total" },
            { key: "totalNet",  label: "Net total" },
            { key: "status",    label: "Status" },
          ]} />
      )}
  );
}
