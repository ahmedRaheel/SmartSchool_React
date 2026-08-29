import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { books }      from "../../../mocks/data";

export function LibraryPage() {
  return (
    <>
      <PageHeader title="Library" subtitle="Book catalog, issue and return management" action={<div className="page-actions"><button className="secondary">Add Book</button><button className="primary"><Plus size={15}/> Issue Book</button></div>} />
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Books"  value="8,420" note=""                color="#0F2241" bg="#EEF2FF"><span>📚</span></StatCard>
        <StatCard label="Issued"       value="312"   note=""                color="#D97706" bg="#FFFBEB"><span>📖</span></StatCard>
        <StatCard label="Available"    value="8,108" note=""                color="#10B981" bg="#ECFDF5"><span>✅</span></StatCard>
        <StatCard label="Overdue"      value="24"    note="Action needed"   color="#EF4444" bg="#FFF0F1"><span>⏰</span></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>Book Catalog</h3><p>Search and manage library collection</p></div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Total</th><th>Available</th><th>Status</th></tr></thead>
            <tbody>
              {books.map(b => (
                <tr key={b.id}>
                  <td><b>{b.title}</b></td>
                  <td>{b.author}</td>
                  <td>{b.category}</td>
                  <td>{b.total}</td>
                  <td>{b.available}</td>
                  <td><span className={`status-pill ${b.status==="Available"?"success":b.status==="All Issued"?"warning":"info"}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
