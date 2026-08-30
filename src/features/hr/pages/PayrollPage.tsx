import { useState } from "react";
import { Download, Wallet } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";

const PAYROLL = [
  { name:"Ms. Aisha Siddiqui", role:"Teacher",      dept:"Mathematics", basic:85000, allowances:12000, deductions:8500,  net:88500,  status:"Processed" },
  { name:"Mr. Tariq Jameel",   role:"Teacher",      dept:"Physics",     basic:90000, allowances:15000, deductions:9000,  net:96000,  status:"Processed" },
  { name:"Ms. Farah Khan",     role:"Admin Officer",dept:"Admin",       basic:65000, allowances:8000,  deductions:6500,  net:66500,  status:"On Leave"  },
  { name:"Dr. Noman Arif",     role:"Teacher",      dept:"CS",          basic:100000,allowances:18000, deductions:10000, net:108000, status:"Processed" },
  { name:"Mrs. Rehana Pervez", role:"HOD",          dept:"Languages",   basic:95000, allowances:16000, deductions:9500,  net:101500, status:"Pending"   },
  { name:"Arif Khan",          role:"Driver",       dept:"Transport",   basic:40000, allowances:5000,  deductions:4000,  net:41000,  status:"Processed" },
];

const MONTH = "August 2026";

export function PayrollPage() {
  const [processing, setProcessing] = useState(false);
  const [done, setDone]             = useState(false);

  const total     = PAYROLL.reduce((a,e) => a+e.net, 0);
  const processed = PAYROLL.filter(e => e.status==="Processed").length;

  async function process() {
    setProcessing(true);
    await new Promise(r => setTimeout(r,1200));
    setProcessing(false);
    setDone(true);
  }

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle={`${MONTH} payroll — ${PAYROLL.length} employees`}
        action={
          <div className="page-actions">
            <button className="secondary"><Download size={14}/> Export Payslips</button>
            <button className="primary" onClick={() => void process()} disabled={processing||done}>
              {processing?"Processing…":done?"Processed ✓":"Run Payroll"}
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Gross payroll"   value={`PKR ${(total/1000).toFixed(0)}K`} note={MONTH}   color="#0F2241" bg="#EEF2FF"><Wallet size={20}/></StatCard>
        <StatCard label="Employees"       value={String(PAYROLL.length)} note="On payroll"          color="#2563EB" bg="#EFF6FF"><Wallet size={20}/></StatCard>
        <StatCard label="Processed"       value={String(processed)}      note={`of ${PAYROLL.length}`} color="#10B981" bg="#ECFDF5"><Wallet size={20}/></StatCard>
        <StatCard label="Pending"         value={String(PAYROLL.length-processed)} note="Needs action" color="#D97706" bg="#FFFBEB"><Wallet size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Payroll register — {MONTH}</h3></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Department</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {PAYROLL.map((e,i) => (
                <tr key={i}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{ background:"#EEF2FF",color:"#6366F1" }}>
                        {e.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                      </span>
                      <b>{e.name}</b>
                    </div>
                  </td>
                  <td>{e.role}</td>
                  <td>{e.dept}</td>
                  <td>PKR {e.basic.toLocaleString()}</td>
                  <td style={{ color:"#10B981" }}>+{e.allowances.toLocaleString()}</td>
                  <td style={{ color:"#EF4444" }}>-{e.deductions.toLocaleString()}</td>
                  <td><b style={{ fontSize:13 }}>PKR {e.net.toLocaleString()}</b></td>
                  <td><span className={`status-pill ${e.status==="Processed"?"success":e.status==="Pending"?"warning":"info"}`}>{e.status}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action" style={{ fontSize:10 }}>Payslip</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:"var(--surface-2)" }}>
                <td colSpan={6} style={{ padding:"12px 16px", fontWeight:700, fontSize:12 }}>Total net payroll</td>
                <td style={{ padding:"12px 16px", fontWeight:800, fontSize:14 }}>PKR {total.toLocaleString()}</td>
                <td colSpan={2}/>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}
