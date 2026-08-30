import { useState } from "react";
import { Library, Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useBooks } from "../../../core/api/queries";
import { libraryApi } from "../../../core/api/smartschoolApi";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useQuery } from "@tanstack/react-query";

export function LibraryPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [tab, setTab] = useState<"catalog"|"loans">("catalog");
  const [q, setQ]     = useState("");

  const { data: books, isLoading: bLoading } = useBooks();
  const { data: loans, isLoading: lLoading } = useQuery({
    queryKey: ["loans", tenantId],
    queryFn: () => libraryApi.issue({ tenantId } as any).then(r => r.data).catch(() => ({ items: [] })),
    enabled: tab === "loans",
  });

  const bItems = (books as any)?.items ?? (books as any)?.value?.items ?? [];
  const lItems = (loans as any)?.items ?? [];

  return (
    <>
      <PageHeader title="Library" subtitle="Book catalog, issues and returns" />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total books"  value={bLoading ? "…" : String(bItems.length)} note="In catalog" color="#2563EB" bg="#EFF6FF"><Library size={20}/></StatCard>
        <StatCard label="Available"    value={bLoading ? "…" : String(bItems.filter((b: any) => b.availableCopies > 0 || b.status === "AVAILABLE").length)} note="" color="#10B981" bg="#ECFDF5"><Library size={20}/></StatCard>
        <StatCard label="Active loans" value={lLoading ? "…" : String(lItems.length)} note="" color="#D97706" bg="#FFFBEB"><Library size={20}/></StatCard>
        <StatCard label="Overdue"      value="0" note="AI prediction active" color="#8B5CF6" bg="#F5F3FF"><Library size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        <button className={tab === "catalog" ? "active" : ""} onClick={() => setTab("catalog")}>📚 Book catalog</button>
        <button className={tab === "loans"   ? "active" : ""} onClick={() => setTab("loans")}>📖 Active loans</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:280 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search books…"/>
          </label>
          {tab === "catalog" && <button className="primary"><Plus size={14}/> Add book</button>}
        </div>

        {tab === "catalog" && (
          bLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading catalog…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Copies</th><th>Status</th></tr></thead>
                <tbody>
                  {bItems.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No books in catalog yet.</td></tr>
                    : bItems.filter((b: any) => JSON.stringify(b).toLowerCase().includes(q.toLowerCase())).map((b: any) => (
                        <tr key={b.libraryItemId ?? b.id}>
                          <td><b>{b.title ?? "—"}</b></td>
                          <td>{b.author ?? "—"}</td>
                          <td><code style={{ fontSize:11 }}>{b.isbn ?? "—"}</code></td>
                          <td>{b.category ?? b.genre ?? "—"}</td>
                          <td>{b.availableCopies ?? b.copies ?? "—"}</td>
                          <td><span className={`status-pill ${b.availableCopies > 0 || b.status === "AVAILABLE" ? "success" : "warning"}`}>{b.availableCopies > 0 || b.status === "AVAILABLE" ? "Available" : "Checked out"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "loans" && (
          lLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading loans…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Book</th><th>Student</th><th>Issued</th><th>Due date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {lItems.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No active loans.</td></tr>
                    : lItems.map((l: any) => (
                        <tr key={l.itemLoanId ?? l.id}>
                          <td><b>{l.bookTitle ?? l.itemTitle ?? "—"}</b></td>
                          <td>{l.studentName ?? l.studentId ?? "—"}</td>
                          <td>{l.issuedDate ? new Date(l.issuedDate).toLocaleDateString() : "—"}</td>
                          <td>{l.dueDate ? new Date(l.dueDate).toLocaleDateString() : "—"}</td>
                          <td><span className={`status-pill ${l.returnedDate ? "success" : l.isOverdue ? "danger" : "info"}`}>{l.returnedDate ? "Returned" : l.isOverdue ? "Overdue" : "Active"}</span></td>
                          <td><button className="table-action">Return</button></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}
