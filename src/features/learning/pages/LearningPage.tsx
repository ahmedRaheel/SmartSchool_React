import { useState } from "react";
import { BookOpen, Plus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAssignments, useCreateAssignment, useLessons, useLearningResources, useSubjects, useClassSections } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }
const STATUS_PILL: Record<string,string> = { OPEN:"success", CLOSED:"gray", GRADED:"info" };

export function LearningPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"assignments"|"lessons"|"resources">("assignments");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ branchId:"", name:"", subjectId:"", classSectionId:"", dueAt:"", maxMarks:"50" });

  const { data: asnData, isLoading } = useAssignments();
  const { data: lessonsData } = useLessons();
  const { data: resourcesData } = useLearningResources();
  const { data: subjectsData } = useSubjects();
  const { data: sectionsData } = useClassSections();
  const { data: campusesData } = useSubjects(); // reuse
  const createAssignment = useCreateAssignment();

  const assignments = (asnData      as any)?.items ?? (asnData      as any) ?? [];
  const lessons     = (lessonsData  as any)?.items ?? (lessonsData  as any) ?? [];
  const resources   = (resourcesData as any)?.items ?? (resourcesData as any) ?? [];
  const subjects    = (subjectsData  as any)?.items ?? (subjectsData  as any) ?? [];
  const sections    = (sectionsData  as any)?.items ?? (sectionsData  as any) ?? [];

  function sf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name) { setError("Name required"); return; }
    try {
      await createAssignment.mutateAsync({ tenantId:tid, branchId:form.branchId||"b1", name:form.name, metadataJson:JSON.stringify({ subjectId:form.subjectId, classSectionId:form.classSectionId, dueAt:form.dueAt, maxMarks:Number(form.maxMarks), status:"OPEN" }) });
      setOpen(false); setForm({ branchId:"", name:"", subjectId:"", classSectionId:"", dueAt:"", maxMarks:"50" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Learning & Assignments" subtitle="Assignments, lessons and learning resources"
        action={<div className="page-actions"><button className="primary" onClick={()=>{setOpen(true);setError("");}}><Plus size={14}/> New assignment</button></div>}/>

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Assignments"  value={String(assignments.length)} note="" color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Open"         value={String(assignments.filter((a:any)=>parseMeta(a.metadataJson).status==="OPEN").length)} note="" color="#10B981" bg="#ECFDF5"><BookOpen size={20}/></StatCard>
        <StatCard label="Lessons"      value={String(lessons.length)}     note="" color="#8B5CF6" bg="#F5F3FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Resources"    value={String(resources.length)}   note="" color="#D97706" bg="#FFFBEB"><BookOpen size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="assignments"?"active":""} onClick={()=>setTab("assignments")}>📝 Assignments ({assignments.length})</button>
        <button className={tab==="lessons"?"active":""} onClick={()=>setTab("lessons")}>📖 Lessons ({lessons.length})</button>
        <button className={tab==="resources"?"active":""} onClick={()=>setTab("resources")}>🗂 Resources ({resources.length})</button>
      </div>

      <div className="surface">
        {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
          <div className="table-wrap">
            {tab === "assignments" && (
              <table className="premium-table">
                <thead><tr><th>Assignment</th><th>Subject</th><th>Class</th><th>Due</th><th>Marks</th><th>Status</th></tr></thead>
                <tbody>
                  {assignments.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No assignments yet.</td></tr>
                  : assignments.map((a:any)=>{
                    const meta=parseMeta(a.metadataJson);
                    const sub=subjects.find((s:any)=>s.id===meta.subjectId);
                    const sec=sections.find((s:any)=>s.id===meta.classSectionId);
                    return <tr key={a.id}><td><b>{a.name}</b></td><td>{sub?.name??"-"}</td><td>{sec?.name??"-"}</td><td style={{fontSize:11}}>{meta.dueAt?new Date(meta.dueAt).toLocaleString():"-"}</td><td>{meta.maxMarks??"-"}</td><td><span className={`status-pill ${STATUS_PILL[meta.status??"OPEN"]??"success"}`}>{meta.status??"OPEN"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            )}
            {tab === "lessons" && (
              <table className="premium-table">
                <thead><tr><th>Lesson</th><th>Code</th></tr></thead>
                <tbody>
                  {lessons.length===0 ? <tr><td colSpan={2} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No lessons yet.</td></tr>
                  : lessons.map((l:any)=><tr key={l.id}><td><b>{l.name}</b></td><td><code style={{fontSize:11}}>{l.code}</code></td></tr>)}
                </tbody>
              </table>
            )}
            {tab === "resources" && (
              <table className="premium-table">
                <thead><tr><th>Resource</th><th>Code</th></tr></thead>
                <tbody>
                  {resources.length===0 ? <tr><td colSpan={2} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No resources yet.</td></tr>
                  : resources.map((r:any)=><tr key={r.id}><td><b>{r.name}</b></td><td><code style={{fontSize:11}}>{r.code}</code></td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(500px,96vw)"}}>
            <div className="modal-head"><h2>New assignment</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Assignment title *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. Algebra Practice Set 5"/></label>
              <label className="human-field"><span>Subject</span>
                <select value={form.subjectId} onChange={sf("subjectId")}>
                  <option value="">— Select —</option>
                  {subjects.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Class section</span>
                <select value={form.classSectionId} onChange={sf("classSectionId")}>
                  <option value="">— Select —</option>
                  {sections.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Due date/time</span><input type="datetime-local" value={form.dueAt} onChange={sf("dueAt")}/></label>
              <label className="human-field"><span>Max marks</span><input type="number" value={form.maxMarks} onChange={sf("maxMarks")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createAssignment.isPending}>{createAssignment.isPending?"Saving…":"Create"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
