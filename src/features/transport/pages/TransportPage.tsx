import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { vehicles }   from "../../../mocks/data";

export function TransportPage() {
  return (
    <>
      <PageHeader title="Transport Management" subtitle="Routes, vehicles, drivers and live tracking" action={<div className="page-actions"><button className="primary"><Plus size={15}/> Add Vehicle</button></div>} />
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Vehicles"     value="24"  note="" color="#0F2241" bg="#EEF2FF"><span>🚌</span></StatCard>
        <StatCard label="Active Routes" value="18" note="" color="#2563EB" bg="#EFF6FF"><span>🗺️</span></StatCard>
        <StatCard label="Students"     value="892" note="" color="#10B981" bg="#ECFDF5"><span>👥</span></StatCard>
        <StatCard label="On Time"      value="96%" note="↑ 2%" color="#D97706" bg="#FFFBEB"><span>✅</span></StatCard>
      </section>
      <div className="ai-brief surface" style={{ marginBottom: 14 }}>
        <div className="ai-orb">⚠️</div>
        <div>
          <span className="eyebrow">Transport AI Alert</span>
          <h3>Bus 04 breakdown on Route E</h3>
          <p>40 students affected. Alternative dispatched. Parents notified automatically via SMS. ETA 18 min.</p>
        </div>
      </div>
      <div className="surface">
        <div className="surface-head"><h3>Vehicle Status</h3><p>Live fleet tracking</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Vehicle</th><th>Registration</th><th>Route</th><th>Driver</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td><b>{v.name}</b></td>
                  <td><code style={{ fontSize: 11 }}>{v.reg}</code></td>
                  <td>{v.route}</td>
                  <td>{v.driver}</td>
                  <td>{v.students}</td>
                  <td>
                    <span className={`status-pill ${v.status==="On Route"?"success":v.status.includes("Delay")?"warning":"danger"}`}>{v.status}</span>
                  </td>
                  <td><div className="row-actions"><button className="table-action">Track</button><button className="table-action">Edit</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
