import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { invoices } from "../../../mocks/data";

export function FinancePage() {
  return (
    <>
      <PageHeader
        title="Fees & Finance"
        subtitle="Collection, invoicing and payment management"
        action={
          <div className="page-actions">
            <button className="secondary">Bulk Invoice</button>
            <button className="primary"><Plus size={15} /> Record Payment</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Collected"       value="$847K" note="↑ 4% vs last month" color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>💰</span></StatCard>
        <StatCard label="Pending"         value="$153K" note="47 students"         color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>⏳</span></StatCard>
        <StatCard label="Overdue"         value="$42K"  note="12 critical"         color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>🚨</span></StatCard>
        <StatCard label="Collection Rate" value="91%"   note="↑ 4%"               color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>📊</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div><h3>Recent Invoices</h3><p>All invoices for current billing period</p></div>
          <button className="primary"><Plus size={14} /> New Invoice</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr><th>Invoice</th><th>Student</th><th>Grade</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td><code style={{ fontSize: 11 }}>{inv.id}</code></td>
                  <td>
                    <div className="person-cell">
                      <span className="row-avatar" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                        {inv.student.split(" ").map((w: string) => w[0]).join("")}
                      </span>
                      <b>{inv.student}</b>
                    </div>
                  </td>
                  <td>{inv.grade}</td>
                  <td><b>${inv.amount}</b></td>
                  <td>{inv.due}</td>
                  <td>
                    <span className={`status-pill ${inv.status === "Paid" ? "success" : inv.status === "Overdue" ? "danger" : "warning"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      {inv.status === "Paid"    && <button className="table-action">Receipt</button>}
                      {inv.status === "Pending" && <button className="table-action" style={{ color: "var(--success)" }}>Collect</button>}
                      {inv.status === "Overdue" && <button className="table-action" style={{ color: "var(--danger)" }}>Follow Up</button>}
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
