import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";

const APPLICATIONS = [
  { id: "APP-001", name: "Hassan Ali",  grade: "Grade 6",  guardian: "Mr. Ali",   date: "Aug 20", score: "—",   status: "Review"   },
  { id: "APP-002", name: "Mariam Shah", grade: "Grade 9",  guardian: "Dr. Shah",  date: "Aug 18", score: "88%", status: "Approved" },
  { id: "APP-003", name: "Usman Butt",  grade: "Grade 7",  guardian: "Mrs. Butt", date: "Aug 15", score: "72%", status: "Approved" },
  { id: "APP-004", name: "Safia Noor",  grade: "Grade 11", guardian: "Mr. Noor",  date: "Aug 12", score: "61%", status: "Rejected" },
];

export function AdmissionsPage() {
  return (
    <>
      <PageHeader
        title="Admissions"
        subtitle="Inquiry → application → decision → enrolment"
        action={
          <div className="page-actions">
            <button className="primary"><Plus size={15} /> New Application</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Applications" value="58" note="This cycle"      color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📋</span></StatCard>
        <StatCard label="Approved"     value="34" note="↑ 12 this month" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>✅</span></StatCard>
        <StatCard label="Pending"      value="21" note=""                color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>⏳</span></StatCard>
        <StatCard label="Rejected"     value="3"  note=""                color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>❌</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Applications</h3><p>All admission applications this cycle</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Applicant</th><th>Grade Applied</th><th>Guardian</th><th>Applied On</th><th>Test Score</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {APPLICATIONS.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                        {a.name.split(" ").map(w => w[0]).join("")}
                      </span>
                      <b>{a.name}</b>
                    </div>
                  </td>
                  <td>{a.grade}</td>
                  <td>{a.guardian}</td>
                  <td>{a.date}</td>
                  <td>{a.score}</td>
                  <td>
                    <span className={`status-pill ${
                      a.status === "Approved" ? "success" :
                      a.status === "Rejected" ? "danger"  : "warning"
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button className="table-action">
                      {a.status === "Review" ? "Review" : a.status === "Approved" ? "Enroll" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
