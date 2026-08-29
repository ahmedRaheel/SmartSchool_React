import { PageHeader } from "../../../components/ui/PageHeader";
const REPORTS = [
  ["📊","Academic Progress","School-wide outcome trends and grade distribution"],
  ["💰","Fee Collection","Monthly and annual collection analysis"],
  ["✅","Attendance Analysis","Daily, weekly and monthly attendance trends"],
  ["👩‍🏫","Staff Performance","Teacher ratings, workload and outcomes"],
  ["📝","Exam Results","Grade-wise pass/fail and performance breakdown"],
  ["🤖","AI Predictions","Dropout risk, fee default and grade predictions"],
];
export function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Generate comprehensive school management reports" />
      <div className="grid-3">
        {REPORTS.map(([ic,title,desc]) => (
          <div key={title as string} className="surface" style={{ padding: 20, cursor:"pointer" }}>
            <div style={{ fontSize:28,marginBottom:10 }}>{ic}</div>
            <div style={{ fontWeight:700,fontSize:13,marginBottom:4 }}>{title}</div>
            <div style={{ fontSize:11,color:"var(--muted)",marginBottom:14,lineHeight:1.5 }}>{desc}</div>
            <button className="primary" style={{ fontSize:11 }}>Generate Report</button>
          </div>
        ))}
      </div>
    </>
  );
}
