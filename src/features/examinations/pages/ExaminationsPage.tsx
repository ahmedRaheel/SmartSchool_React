/**
 * ExaminationsPage — Full exam management for admins + result entry for examiners
 * Tabs: Exams · Grade Scales · Results · Reports
 */
import { useState, useMemo } from "react";
import { ClipboardCheck, Plus, Search, X, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useExams, useCreateExam, useGradeScales, useCreateGradeScale, useExamResults, useCampuses, useSubjects } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const EXAM_TYPES = ["UNIT_TEST","MID_TERM","FINAL","ANNUAL","MOCK","OLEVEL","ALEVEL","ASSESSMENT"];
const STATUS_PILL: Record<string,string> = { DRAFT:"gray", SCHEDULED:"info", IN_PROGRESS:"warning", RESULT_ENTRY:"warning", PUBLISHED:"success", CANCELLED:"danger" };
const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };

export function ExaminationsPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"exams"|"grades"|"results">("exams");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [gsOpen, setGsOpen] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ name:"", examType:"MID_TERM", campusId:"", startDate:"", endDate:"", totalMarks:"500", description:"" });
  const [gsForm, setGsForm] = useState({ name:"", minPercent:"", maxPercent:"", gradePoint:"" });

  const { data, isLoading }      = useExams();
  const { data: scalesData }     = useGradeScales();
  const { data: resultsData }    = useExamResults();
  const { data: campusesData }   = useCampuses();
  const createExam      = useCreateExam();
  const createGradeScale= useCreateGradeScale();

  const items   = (data as any)?.items        ?? (data as any)        ?? [];
  const scales  = (scalesData as any)?.items  ?? (scalesData as any)  ?? [];
  const results = (resultsData as any)?.items ?? (resultsData as any) ?? [];
  const campuses= (campusesData as any)?.items?? (campusesData as any)?? [];

  const sf  = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:e.target.value}));
  const gsf = (k:string) => (e:React.ChangeEvent<HTMLInputElement>) => setGsForm(p=>({...p,[k]:e.target.value}));

  const filtered = useMemo(() => items.filter((e:any) =>
    `${e.name} ${parseMeta(e.metadataJson).type}`.toLowerCase().includes(search.toLowerCase())
  ), [items, search]);

  async function saveExam() {
    if (!form.name || !form.startDate) { setError("Name and start date required"); return; }
    try {
      await createExam.mutateAsync({ tenantId:tid, name:form.name, metadataJson:JSON.stringify({
        type:form.examType, campusId:form.campusId||undefined, start:form.startDate, end:form.endDate||form.startDate,
        marks:Number(form.totalMarks), description:form.description, status:"SCHEDULED"
      })});
      setOpen(false); setForm({ name:"", examType:"MID_TERM", campusId:"", startDate:"", endDate:"", totalMarks:"500", description:"" }); setError("");
    } catch(e:any) { setError(e?.message ?? "Failed"); }
  }

  async function saveGradeScale() {
    if (!gsForm.name || !gsForm.minPercent || !gsForm.maxPercent) { setError("All grade scale fields required"); return; }
    try {
      await createGradeScale.mutateAsync({ tenantId:tid, name:gsForm.name, metadataJson:JSON.stringify({ minPercent:Number(gsForm.minPercent), maxPercent:Number(gsForm.maxPercent), gradePoint:gsForm.gradePoint }) });
      setGsOpen(false); setGsForm({ name:"", minPercent:"", maxPercent:"", gradePoint:"" }); setError("");
    } catch(e:any) { setError(e?.message ?? "Failed"); }
  }

  const upcoming  = items.filter((e:any) => parseMeta(e.metadataJson).status === "SCHEDULED").length;
  const active    = items.filter((e:any) => ["IN_PROGRESS","RESULT_ENTRY"].includes(parseMeta(e.metadataJson).status ?? "")).length;
  const published = items.filter((e:any) => parseMeta(e.metadataJson).status === "PUBLISHED").length;

  return (
    <>
      <PageHeader title="Examinations" subtitle="Exam management, grade scales and student results"
        action={<div className="page-actions">
          {tab==="exams"  && <button className="primary" onClick={()=>{setOpen(true);setError("");}}><Plus size={14}/> Create exam</button>}
          {tab==="grades" && <button className="primary" onClick={()=>{setGsOpen(true);setError("");}}><Plus size={14}/> Add grade</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total exams"  value={String(items.length)} note="" color="#2563EB" bg="#EFF6FF"><ClipboardCheck size={20}/></StatCard>
        <StatCard label="Scheduled"    value={String(upcoming)}      note="" color="#D97706" bg="#FFFBEB"><BookOpen size={20}/></StatCard>
        <StatCard label="Active now"   value={String(active)}        note="" color="#EF4444" bg="#FFF0F1"><AlertCircle size={20}/></StatCard>
        <StatCard label="Results published" value={String(published)} note="" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="exams"?"active":""} onClick={()=>setTab("exams")}>📝 Exams ({items.length})</button>
        <button className={tab==="grades"?"active":""} onClick={()=>setTab("grades")}>🎯 Grade Scales ({scales.length})</button>
        <button className={tab==="results"?"active":""} onClick={()=>setTab("results")}>📊 Results ({results.length})</button>
      </div>

      {tab==="exams" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search exams…"/>
            </label>
          </div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Exam name</th><th>Type</th><th>Campus</th><th>Start date</th><th>End date</th><th>Total marks</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No exams yet.</td></tr>
                  : filtered.map((e:any) => {
                    const meta = parseMeta(e.metadataJson);
                    const campus = campuses.find((c:any) => c.id===meta.campusId);
                    return (
                      <tr key={e.id}>
                        <td><b>{e.name}</b>{meta.description&&<div style={{fontSize:10,color:"var(--muted)"}}>{meta.description}</div>}</td>
                        <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{meta.type??e.metadataJson??"—"}</span></td>
                        <td style={{fontSize:11}}>{campus?.name ?? meta.campusId ?? "All campuses"}</td>
                        <td style={{fontSize:11}}>{meta.start ?? "—"}</td>
                        <td style={{fontSize:11}}>{meta.end ?? "—"}</td>
                        <td><b>{meta.marks ?? "—"}</b></td>
                        <td><span className={`status-pill ${STATUS_PILL[meta.status??"SCHEDULED"]??"info"}`}>{meta.status??"SCHEDULED"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="table-footer"><span>{filtered.length} exams</span></div>
        </div>
      )}

      {tab==="grades" && (
        <div className="surface">
          <div className="surface-head"><h3>Grade scale</h3><p>Grading boundaries used for result calculation</p></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Grade</th><th>Min %</th><th>Max %</th><th>Grade point</th></tr></thead>
              <tbody>
                {scales.length===0 ? <tr><td colSpan={4} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No grade scale configured.</td></tr>
                : scales.map((s:any) => {
                  const meta = parseMeta(s.metadataJson);
                  return <tr key={s.id}><td><b>{s.name}</b></td><td>{meta.minPercent??"-"}%</td><td>{meta.maxPercent??"-"}%</td><td>{meta.gradePoint??"-"}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==="results" && (
        <div className="surface">
          <div className="surface-head"><h3>Student exam results</h3></div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Student</th><th>Exam subject</th><th>Marks obtained</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
              <tbody>
                {results.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No results entered yet.</td></tr>
                : results.map((r:any) => {
                  const meta = parseMeta(r.metadataJson);
                  const pct  = meta.percentage ?? (r.name || "—");
                  const pctNum = parseFloat(String(pct));
                  return (
                    <tr key={r.id}>
                      <td>{meta.studentId ?? r.name ?? "—"}</td>
                      <td>{meta.subject ?? "—"}</td>
                      <td><b>{meta.marksObtained ?? "—"}</b></td>
                      <td><b style={{color:pctNum>=50?"#10B981":"#EF4444"}}>{pctNum?`${pctNum}%`:"—"}</b></td>
                      <td>{meta.grade ?? "—"}</td>
                      <td><span className={`status-pill ${meta.status==="PASSED"?"success":meta.status==="FAILED"?"danger":"info"}`}>{meta.status??"PENDING"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create exam modal */}
      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Create exam</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Exam name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Mid-Term 2026"/></label>
              <label className="human-field"><span>Type</span>
                <select value={form.examType} onChange={sf("examType")}>{EXAM_TYPES.map(t=><option key={t}>{t}</option>)}</select>
              </label>
              <label className="human-field"><span>Campus</span>
                <select value={form.campusId} onChange={sf("campusId")}>
                  <option value="">All campuses</option>
                  {campuses.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Start date *</span><input type="date" value={form.startDate} onChange={sf("startDate")}/></label>
              <label className="human-field"><span>End date</span><input type="date" value={form.endDate} onChange={sf("endDate")}/></label>
              <label className="human-field"><span>Total marks</span><input type="number" value={form.totalMarks} onChange={sf("totalMarks")}/></label>
              <label className="human-field field-wide"><span>Description</span><input value={form.description} onChange={sf("description")} placeholder="Optional notes"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveExam} disabled={createExam.isPending}>{createExam.isPending?"Saving…":"Create exam"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Grade scale modal */}
      {gsOpen && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setGsOpen(false)}}>
          <div className="modal-card" style={{width:"min(420px,96vw)"}}>
            <div className="modal-head"><h2>Add grade scale entry</h2><button className="icon-button" onClick={()=>setGsOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Grade label *</span><input value={gsForm.name} onChange={gsf("name")} placeholder="e.g. A+ or Distinction"/></label>
              <label className="human-field"><span>Min % *</span><input type="number" value={gsForm.minPercent} onChange={gsf("minPercent")} placeholder="80"/></label>
              <label className="human-field"><span>Max % *</span><input type="number" value={gsForm.maxPercent} onChange={gsf("maxPercent")} placeholder="100"/></label>
              <label className="human-field"><span>Grade point</span><input value={gsForm.gradePoint} onChange={gsf("gradePoint")} placeholder="4.0"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setGsOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveGradeScale} disabled={createGradeScale.isPending}>{createGradeScale.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
