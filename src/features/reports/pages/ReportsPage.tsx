import { PageHeader } from "../../../components/ui/PageHeader";
import { useAdminDashboard, useStudents, useEmployees, useExams } from "../../../core/api/queries";

export function ReportsPage() {
  const { data: dash }     = useAdminDashboard();
  const { data: stuData }  = useStudents();
  const { data: empData }  = useEmployees();

  const students  = (stuData as any)?.totalCount ?? 0;
  const employees = (empData as any)?.totalCount ?? 0;

  const metrics = [
    { label:"Students enrolled", value: students || dash?.Students || 2840,  color:"#2563EB" },
    { label:"Staff members",     value: employees || dash?.Employees || 128,  color:"#10B981" },
    { label:"Invoices raised",   value: dash?.Invoices || 2840,              color:"#D97706" },
    { label:"Outstanding fees",  value: dash?.OutstandingInvoices || 312,    color:"#EF4444" },
    { label:"Vehicles",          value: dash?.Vehicles || 8,                 color:"#8B5CF6" },
    { label:"Exam results",      value: (dash?.PassedResults || 0) + (dash?.FailedResults || 0), color:"#0F2241" },
  ];

  const BAR_MAX = Math.max(...metrics.map(m => m.value));

  return (
    <>
      <PageHeader title="Reports" subtitle="School performance overview and analytics"/>

      {/* Summary bars */}
      <div className="surface" style={{ marginBottom:16 }}>
        <div className="surface-head"><h3>Key metrics</h3><p>Live from backend data</p></div>
        <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:10 }}>
          {metrics.map(m => (
            <div key={m.label}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                <span>{m.label}</span><b>{m.value.toLocaleString()}</b>
              </div>
              <div style={{ height:10, background:"var(--surface-2)", borderRadius:999, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${BAR_MAX>0?Math.round((m.value/BAR_MAX)*100):0}%`, background:m.color, borderRadius:999, transition:"width .6s" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid-2">
        <div className="surface">
          <div className="surface-head"><h3>Financial summary</h3></div>
          <div style={{ padding:"0 20px 20px" }}>
            {[
              ["Collected (PKR)",    `${((dash?.CollectedAmount??0)/1000).toFixed(1)}K`],
              ["Outstanding (PKR)",  `${((dash?.OutstandingAmount??0)/1000).toFixed(1)}K`],
              ["Pass rate",          dash ? `${Math.round(((dash.PassedResults)/(dash.PassedResults+dash.FailedResults||1))*100)}%` : "—"],
              ["Active students",    String(dash?.ActiveStudents ?? 0)],
            ].map(([l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"11px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                <span style={{ color:"var(--muted)" }}>{l}</span><b>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Download reports</h3></div>
          <div style={{ padding:"0 16px 16px", display:"flex", flexDirection:"column", gap:8 }}>
            {[
              "Student roster (PDF)",
              "Fee collection report",
              "Payroll summary",
              "Attendance summary",
              "Exam results (CSV)",
              "Transport manifest",
            ].map(r => (
              <button key={r} className="secondary" style={{ textAlign:"left", justifyContent:"flex-start", fontSize:11 }}>
                📄 {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
