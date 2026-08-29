import { PageHeader } from "../../../components/ui/PageHeader";

const REPORTS = [
  { icon: "📊", title: "Academic Progress",   desc: "School-wide outcome trends and grade distribution" },
  { icon: "💰", title: "Fee Collection",      desc: "Monthly and annual collection analysis" },
  { icon: "✅", title: "Attendance Analysis",  desc: "Daily, weekly and monthly attendance trends" },
  { icon: "👩‍🏫", title: "Staff Performance",   desc: "Teacher ratings, workload and outcomes" },
  { icon: "📝", title: "Exam Results",         desc: "Grade-wise pass/fail and performance breakdown" },
  { icon: "🤖", title: "AI Predictions",       desc: "Dropout risk, fee default and grade forecasts" },
];

export function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate comprehensive school management reports"
      />
      <div className="grid-3">
        {REPORTS.map(r => (
          <div key={r.title} className="surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{r.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{r.title}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 14, lineHeight: 1.55 }}>{r.desc}</div>
            <button className="primary" style={{ fontSize: 11 }}>Generate Report</button>
          </div>
        ))}
      </div>
    </>
  );
}
