import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { employees } from "../../../mocks/data";

export function HrPage() {
  return (
    <>
      <PageHeader
        title="HR Management"
        subtitle="Staff records, positions, leave and payroll"
        action={
          <div className="page-actions">
            <button className="primary"><Plus size={15} /> Add Staff</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Staff"    value="184"   note=""         color="#0F2241" bg="#EEF2FF"><span style={{fontSize:20}}>👥</span></StatCard>
        <StatCard label="On Leave"       value="6"     note=""         color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>🏖️</span></StatCard>
        <StatCard label="New This Month" value="2"     note=""         color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>➕</span></StatCard>
        <StatCard label="Payroll Due"    value="Sep 1" note=""         color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>💳</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Staff Directory</h3><p>All teaching and administrative staff</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Name</th><th>Role</th><th>Department</th><th>Join Date</th><th>Leave Balance</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{ background: "#EEF2FF", color: "#6366F1" }}>
                        {e.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </span>
                      <b>{e.name}</b>
                    </div>
                  </td>
                  <td>{e.role}</td>
                  <td>{e.department}</td>
                  <td>{e.joinDate}</td>
                  <td>{e.leaveBalance}</td>
                  <td>
                    <span className={`status-pill ${e.status === "Active" ? "success" : "warning"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action">View</button>
                      <button className="table-action">Edit</button>
                    </div>
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
