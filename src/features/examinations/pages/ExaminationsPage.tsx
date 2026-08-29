import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { moduleData } from "../../../mocks/data";

export function ExaminationsPage() {
  return (
    <>
      <PageHeader title="Examinations & Results" subtitle="Schedule, mark and publish exam results" action={<div className="page-actions"><button className="primary"><Plus size={15}/> Schedule Exam</button></div>} />
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Upcoming"   value="3"     note=""           color="#2563EB" bg="#EFF6FF"><span>📝</span></StatCard>
        <StatCard label="Completed"  value="8"     note="This term"  color="#10B981" bg="#ECFDF5"><span>✅</span></StatCard>
        <StatCard label="Pass Rate"  value="96.2%" note="↑ 1.4%"    color="#0F2241" bg="#EEF2FF"><span>🏆</span></StatCard>
        <StatCard label="Failing"    value="4.8%"  note=""           color="#EF4444" bg="#FFF0F1"><span>⚠️</span></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Exam Schedule</h3><p>All examinations for current academic year</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Exam Name</th><th>Grades</th><th>Date</th><th>Status</th><th>Pass Rate</th><th>Actions</th></tr></thead>
            <tbody>
              {moduleData.exams.map((ex, i) => (
                <tr key={i}>
                  <td><b>{ex.name}</b></td>
                  <td>{ex.grades}</td>
                  <td>{ex.date}</td>
                  <td><span className={`status-pill ${ex.status==="Completed"?"success":ex.status==="Upcoming"?"warning":"info"}`}>{ex.status}</span></td>
                  <td>{ex.passRate ?? "—"}</td>
                  <td><div className="row-actions"><button className="table-action">View</button><button className="table-action">Edit</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
