import { useState } from "react";
import { ClipboardCheck, Plus, Search } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useExams } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

export function ExaminationsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [q, setQ]     = useState("");
  const [tab, setTab] = useState<"exams"|"results">("exams");
  const { data, isLoading } = useExams();

  const items = (data as any)?.items ?? (data as any)?.value?.items ?? [];
  const filtered = items.filter((e: any) => JSON.stringify(e).toLowerCase().includes(q.toLowerCase()));

  const STATUS_PILL: Record<string,string> = {
    DRAFT:"gray", SCHEDULED:"info", IN_PROGRESS:"warning",
    RESULT_ENTRY:"warning", PUBLISHED:"success", CANCELLED:"danger",
  };

  return (
    <>
      <PageHeader
        title="Examinations"
        subtitle="Exam scheduling, marking and result publication"
        action={
          <div className="page-actions">
            <button className="primary"><Plus size={15}/> Schedule exam</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total exams"    value={isLoading ? "…" : String(items.length)} note="" color="#2563EB" bg="#EFF6FF"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Scheduled"      value={isLoading ? "…" : String(items.filter((e: any) => e.status === "SCHEDULED").length)} note="" color="#D97706" bg="#FFFBEB"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Result entry"   value={isLoading ? "…" : String(items.filter((e: any) => e.status === "RESULT_ENTRY").length)} note="" color="#EF4444" bg="#FFF0F1"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Published"      value={isLoading ? "…" : String(items.filter((e: any) => e.status === "PUBLISHED").length)} note="" color="#10B981" bg="#ECFDF5"><ClipboardCheck size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        <button className={tab === "exams"   ? "active" : ""} onClick={() => setTab("exams")}>📝 Exams</button>
        <button className={tab === "results" ? "active" : ""} onClick={() => setTab("results")}>📊 Results</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:280 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search exams…"/>
          </label>
          <button className="primary"><Plus size={14}/> Schedule exam</button>
        </div>

        {isLoading ? (
          <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading exams…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Exam</th><th>Exam No.</th><th>Type</th><th>Start date</th><th>End date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No exams found.</td></tr>
                  : filtered.map((e: any) => (
                      <tr key={e.examId ?? e.id}>
                        <td><b>{e.name ?? e.title ?? "—"}</b></td>
                        <td><code style={{ fontSize:11 }}>{e.examNumber ?? "—"}</code></td>
                        <td>{e.examType ?? e.type ?? "—"}</td>
                        <td>{e.startDate ? new Date(e.startDate).toLocaleDateString() : "—"}</td>
                        <td>{e.endDate   ? new Date(e.endDate).toLocaleDateString()   : "—"}</td>
                        <td><span className={`status-pill ${STATUS_PILL[e.status] ?? "gray"}`}>{e.status}</span></td>
                        <td>
                          <div className="row-actions">
                            <button className="table-action">View</button>
                            {e.status === "RESULT_ENTRY" && <button className="table-action">Enter marks</button>}
                          </div>
                        </td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} exams</span></div>
      </div>
    </>
  );
}
