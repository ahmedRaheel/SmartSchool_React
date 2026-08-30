import { useState } from "react";
import { ClipboardCheck, Plus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useExams, useCreateExam } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const EXAM_TYPES = ["UNIT_TEST","MID_TERM","FINAL","ANNUAL","MOCK","ASSESSMENT"];
const STATUS_PILL: Record<string,string> = { DRAFT:"gray", SCHEDULED:"info", IN_PROGRESS:"warning", RESULT_ENTRY:"warning", PUBLISHED:"success", CANCELLED:"danger" };

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function ExaminationsPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", examType:"MID_TERM", startDate:"", endDate:"", totalMarks:"100" });

  const { data, isLoading } = useExams();
  const createExam = useCreateExam();

  const items = (data as any)?.items ?? (data as any) ?? [];
  const total = (data as any)?.totalCount ?? items.length;

  function sf(k:string) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name || !form.startDate) { setError("Name and start date required"); return; }
    try {
      await createExam.mutateAsync({ tenantId:tid, name:form.name, metadataJson: JSON.stringify({ examType:form.examType, startDate:form.startDate, endDate:form.endDate, status:"SCHEDULED", totalMarks:Number(form.totalMarks) }) });
      setOpen(false); setForm({ name:"", examType:"MID_TERM", startDate:"", endDate:"", totalMarks:"100" }); setError("");
    } catch(e:any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <PageHeader title="Examinations" subtitle={`${total} exams on record`}
        action={<div className="page-actions"><button className="primary" onClick={() => { setOpen(true); setError(""); }}><Plus size={14}/> Create exam</button></div>}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total exams"   value={String(total)} note="" color="#2563EB" bg="#EFF6FF"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Scheduled"     value={String(items.filter((e:any)=>parseMeta(e.metadataJson).status==="SCHEDULED").length)} note="" color="#0F2241" bg="#EEF2FF"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="In progress"   value={String(items.filter((e:any)=>parseMeta(e.metadataJson).status==="IN_PROGRESS").length)} note="" color="#D97706" bg="#FFFBEB"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Published"     value={String(items.filter((e:any)=>parseMeta(e.metadataJson).status==="PUBLISHED").length)} note="" color="#10B981" bg="#ECFDF5"><ClipboardCheck size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head"><h3>All examinations</h3></div>
        {isLoading ? <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Exam</th><th>Code</th><th>Type</th><th>Start date</th><th>End date</th><th>Total marks</th><th>Status</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No exams yet.</td></tr>
                : items.map((ex:any) => {
                  const meta = parseMeta(ex.metadataJson);
                  return (
                    <tr key={ex.id}>
                      <td><b>{ex.name}</b></td>
                      <td><code style={{ fontSize:11 }}>{ex.code}</code></td>
                      <td>{meta.examType ?? "—"}</td>
                      <td>{meta.startDate ?? "—"}</td>
                      <td>{meta.endDate ?? "—"}</td>
                      <td>{meta.totalMarks ?? 0}</td>
                      <td><span className={`status-pill ${STATUS_PILL[meta.status ?? "DRAFT"] ?? "gray"}`}>{meta.status ?? "DRAFT"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{ width:"min(500px,96vw)" }}>
            <div className="modal-head"><h2>Create examination</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Exam name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Mid-Term Examination 2026"/></label>
              <label className="human-field"><span>Type</span><select value={form.examType} onChange={sf("examType")}>{EXAM_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
              <label className="human-field"><span>Total marks</span><input type="number" value={form.totalMarks} onChange={sf("totalMarks")}/></label>
              <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate} onChange={sf("startDate")}/></label>
              <label className="human-field"><span>End date</span><input type="date" value={form.endDate} onChange={sf("endDate")}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createExam.isPending}>{createExam.isPending?"Creating…":"Create exam"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
