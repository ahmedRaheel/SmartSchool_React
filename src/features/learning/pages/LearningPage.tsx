import { useState, useMemo } from "react";
import { BookOpen, Plus, Search, X, Clock, CheckCircle2, FileText, Upload } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAssignments, useCreateAssignment, useLessons, useCreateLesson, useClassSections, useSubjects } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const TYPES = ["HOMEWORK","PROJECT","ESSAY","LAB_REPORT","QUIZ","PRESENTATION","RESEARCH"];
const STATUS_PILL: Record<string,string> = { PENDING:"warning", SUBMITTED:"info", GRADED:"success", OVERDUE:"danger", DRAFT:"gray" };

export function LearningPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const isTeacher = user?.role?.toLowerCase().includes("teacher");
  const isStudent = user?.role?.toLowerCase().includes("student");
  const [tab, setTab] = useState<"assignments"|"lessons"|"resources">("assignments");
  const [search, setSearch] = useState("");
  const [aModal, setAModal] = useState(false);
  const [lModal, setLModal] = useState(false);
  const [submitModal, setSubmitModal] = useState<any|null>(null);
  const [error, setError] = useState("");

  const { data, isLoading } = useAssignments();
  const { data: lessonsData } = useLessons();
  const { data: sectionsData } = useClassSections();
  const { data: subjectsData } = useSubjects();
  const createAssignment = useCreateAssignment();
  const createLesson     = useCreateLesson();

  const assignments = (data as any)?.items       ?? (data as any) ?? [];
  const lessons     = (lessonsData as any)?.items ?? (lessonsData as any) ?? [];
  const sections    = (sectionsData as any)?.items?? (sectionsData as any) ?? [];
  const subjects    = (subjectsData as any)?.items?? (subjectsData as any) ?? [];

  const [aForm, setAForm] = useState({ title:"", assignmentType:"HOMEWORK", sectionId:"", subjectId:"", dueDate:"", dueTime:"23:59", totalMarks:"100", description:"", allowLate:"true" });
  const [lForm, setLForm] = useState({ title:"", sectionId:"", description:"", sortOrder:"1" });
  const af = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setAForm(p=>({...p,[k]:e.target.value}));
  const lf = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setLForm(p=>({...p,[k]:e.target.value}));

  const filtered = useMemo(() => assignments.filter((a:any) => {
    const m = parseMeta(a.metadataJson);
    return `${a.name} ${a.title??""} ${m.subject??""} ${m.type??""}`.toLowerCase().includes(search.toLowerCase());
  }), [assignments, search]);

  const pending   = assignments.filter((a:any) => parseMeta(a.metadataJson).status === "PENDING").length;
  const submitted = assignments.filter((a:any) => parseMeta(a.metadataJson).status === "SUBMITTED").length;
  const overdue   = assignments.filter((a:any) => {
    const m = parseMeta(a.metadataJson);
    return m.status === "PENDING" && m.dueDate && new Date(m.dueDate) < new Date();
  }).length;

  async function saveAssignment() {
    if (!aForm.title || !aForm.dueDate) { setError("Title and due date required"); return; }
    const section = sections.find((s:any) => s.id === aForm.sectionId);
    const subject = subjects.find((s:any) => s.id === aForm.subjectId);
    try {
      await createAssignment.mutateAsync({ tenantId:tid, name:aForm.title, metadataJson:JSON.stringify({
        type:aForm.assignmentType, sectionId:aForm.sectionId, sectionName:section?.name,
        subjectId:aForm.subjectId, subject:subject?.name,
        dueDate:aForm.dueDate, dueTime:aForm.dueTime,
        totalMarks:Number(aForm.totalMarks), description:aForm.description,
        allowLate:aForm.allowLate==="true", status:"ACTIVE",
        createdAt:new Date().toISOString()
      })});
      setAModal(false); setAForm({ title:"", assignmentType:"HOMEWORK", sectionId:"", subjectId:"", dueDate:"", dueTime:"23:59", totalMarks:"100", description:"", allowLate:"true" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveLesson() {
    if (!lForm.title) { setError("Title required"); return; }
    try {
      await createLesson.mutateAsync({ tenantId:tid, name:lForm.title, metadataJson:JSON.stringify({
        sectionId:lForm.sectionId, description:lForm.description, sortOrder:Number(lForm.sortOrder), resourceCount:0
      })});
      setLModal(false); setLForm({ title:"", sectionId:"", description:"", sortOrder:"1" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Learning" subtitle="Assignments, lessons, submissions and resources"
        action={<div className="page-actions">
          {tab==="assignments" && isTeacher && <button className="primary" onClick={()=>{setAModal(true);setError("");}}><Plus size={14}/> New assignment</button>}
          {tab==="lessons"     && isTeacher && <button className="primary" onClick={()=>{setLModal(true);setError("");}}><Plus size={14}/> New lesson</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Assignments"  value={String(assignments.length)} note=""              color="#6366F1" bg="#EEF2FF"><FileText size={20}/></StatCard>
        <StatCard label="Pending"      value={String(pending)}            note="student view"  color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
        <StatCard label="Submitted"    value={String(submitted)}          note=""              color="#2563EB" bg="#EFF6FF"><Upload size={20}/></StatCard>
        <StatCard label="Overdue"      value={String(overdue)}            note=""              color={overdue>0?"#EF4444":"#10B981"} bg={overdue>0?"#FFF0F1":"#ECFDF5"}><Clock size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="assignments"?"active":""} onClick={()=>setTab("assignments")}>📝 Assignments ({assignments.length})</button>
        <button className={tab==="lessons"?"active":""} onClick={()=>setTab("lessons")}>📖 Lessons ({lessons.length})</button>
        <button className={tab==="resources"?"active":""} onClick={()=>setTab("resources")}>📁 Resources</button>
      </div>

      {tab==="assignments" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}>
              <Search size={14}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search assignments…"/>
            </label>
          </div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Title</th><th>Type</th><th>Subject</th><th>Class</th><th>Due date</th><th>Marks</th><th>Status</th>{isStudent&&<th>Action</th>}</tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={8} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No assignments yet.</td></tr>
                  : filtered.map((a:any) => {
                    const m = parseMeta(a.metadataJson);
                    const due = m.dueDate ? new Date(m.dueDate) : null;
                    const isOverdue = due && due < new Date() && m.status !== "SUBMITTED" && m.status !== "GRADED";
                    const pill = isOverdue ? "danger" : STATUS_PILL[m.status??"ACTIVE"] ?? "info";
                    const statusLabel = isOverdue ? "OVERDUE" : (m.status ?? "ACTIVE");
                    return (
                      <tr key={a.id}>
                        <td><b style={{fontSize:12}}>{a.name}</b>{m.description&&<div style={{fontSize:10,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",maxWidth:200,whiteSpace:"nowrap"}}>{m.description}</div>}</td>
                        <td><span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#EEF2FF",color:"#6366F1",fontWeight:700}}>{m.type??a.name}</span></td>
                        <td style={{fontSize:11}}>{m.subject??"—"}</td>
                        <td style={{fontSize:11}}>{m.sectionName??"—"}</td>
                        <td style={{fontSize:11,color:isOverdue?"#EF4444":"var(--text)",fontWeight:isOverdue?700:400}}>
                          {m.dueDate??"—"}{m.dueTime?` ${m.dueTime}`:""}
                        </td>
                        <td><b>{m.totalMarks??100}</b></td>
                        <td><span className={`status-pill ${pill}`}>{statusLabel}</span></td>
                        {isStudent && <td>
                          {m.status!=="SUBMITTED"&&m.status!=="GRADED" && (
                            <button className="table-action" style={{fontSize:10}} onClick={()=>setSubmitModal(a)}>Submit</button>
                          )}
                        </td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab==="lessons" && (
        <div className="surface">
          <div className="surface-head"><h3>Lessons & course content</h3></div>
          {lessons.length===0 ? (
            <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
              <BookOpen size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
              <b>No lessons yet</b>
              {isTeacher && <p style={{fontSize:12,margin:"8px 0 0"}}>Create lessons to organise your course content.</p>}
            </div>
          ) : (
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:10}}>
              {lessons.map((l:any)=>{ const m=parseMeta(l.metadataJson); return (
                <div key={l.id} style={{padding:"14px 16px",border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:36,height:36,borderRadius:10,background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{fontSize:13,fontWeight:800,color:"#6366F1"}}>{m.sortOrder??1}</span>
                  </div>
                  <div style={{flex:1}}>
                    <b style={{fontSize:13}}>{l.name}</b>
                    {m.description&&<div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.description}</div>}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{m.resourceCount??0} resources</div>
                </div>
              );})}
            </div>
          )}
        </div>
      )}

      {tab==="resources" && (
        <div className="surface">
          <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
            <FileText size={36} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
            <b>Resource library</b>
            <p style={{fontSize:12,margin:"8px 0 0"}}>Course materials, notes, videos and study resources appear here once uploaded.</p>
          </div>
        </div>
      )}

      {/* Create assignment modal */}
      {aModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setAModal(false)}}>
          <div className="modal-card" style={{width:"min(600px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,background:"var(--surface)",zIndex:1}}>
              <h2>New assignment</h2><button className="icon-button" onClick={()=>setAModal(false)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={aForm.title} onChange={af("title")} placeholder="Assignment title"/></label>
              <label className="human-field"><span>Type</span>
                <select value={aForm.assignmentType} onChange={af("assignmentType")}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
              </label>
              <label className="human-field"><span>Class section</span>
                <select value={aForm.sectionId} onChange={af("sectionId")}>
                  <option value="">All classes</option>
                  {sections.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Subject</span>
                <select value={aForm.subjectId} onChange={af("subjectId")}>
                  <option value="">— Select —</option>
                  {subjects.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Due date *</span><input type="date" value={aForm.dueDate} onChange={af("dueDate")}/></label>
              <label className="human-field"><span>Due time</span><input type="time" value={aForm.dueTime} onChange={af("dueTime")}/></label>
              <label className="human-field"><span>Total marks</span><input type="number" value={aForm.totalMarks} onChange={af("totalMarks")}/></label>
              <label className="human-field"><span>Late submissions</span>
                <select value={aForm.allowLate} onChange={af("allowLate")}>
                  <option value="true">Allowed</option><option value="false">Not allowed</option>
                </select>
              </label>
              <label className="human-field field-wide"><span>Description / instructions</span>
                <input value={aForm.description} onChange={af("description")} placeholder="Brief description for students"/>
              </label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setAModal(false)}>Cancel</button>
              <button className="primary" onClick={saveAssignment} disabled={createAssignment.isPending}>{createAssignment.isPending?"Saving…":"Create assignment"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Submit assignment modal (student view) */}
      {submitModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setSubmitModal(null)}}>
          <div className="modal-card" style={{width:"min(460px,96vw)"}}>
            <div className="modal-head"><h2>Submit assignment</h2><button className="icon-button" onClick={()=>setSubmitModal(null)}><X size={18}/></button></div>
            <div style={{padding:"14px 20px 0"}}>
              <b style={{fontSize:13}}>{submitModal.name}</b>
              <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>Due: {parseMeta(submitModal.metadataJson).dueDate??""} · Total marks: {parseMeta(submitModal.metadataJson).totalMarks??100}</div>
            </div>
            <div className="human-form">
              <label className="human-field field-wide">
                <span>Comments (optional)</span>
                <input placeholder="Any notes for your teacher…"/>
              </label>
              <label style={{display:"flex",flexDirection:"column",gap:6,padding:"0 20px",fontSize:12,fontWeight:600}}>
                Upload file
                <label style={{display:"flex",alignItems:"center",gap:8,padding:"14px",border:"2px dashed var(--line)",borderRadius:10,cursor:"pointer",background:"var(--surface-2)"}}>
                  <Upload size={18} style={{color:"var(--muted)"}}/>
                  <span style={{color:"var(--muted)"}}>Click to attach your work (PDF, DOCX, JPG)</span>
                  <input type="file" style={{display:"none"}} accept=".pdf,.docx,.jpg,.jpeg,.png"/>
                </label>
              </label>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setSubmitModal(null)}>Cancel</button>
              <button className="primary" onClick={()=>setSubmitModal(null)}>✓ Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Create lesson modal */}
      {lModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setLModal(false)}}>
          <div className="modal-card" style={{width:"min(440px,96vw)"}}>
            <div className="modal-head"><h2>New lesson</h2><button className="icon-button" onClick={()=>setLModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Lesson title *</span><input value={lForm.title} onChange={lf("title")} placeholder="e.g. Chapter 3 — Forces and Motion"/></label>
              <label className="human-field"><span>Class section</span>
                <select value={lForm.sectionId} onChange={lf("sectionId")}>
                  <option value="">All</option>
                  {sections.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Order</span><input type="number" min="1" value={lForm.sortOrder} onChange={lf("sortOrder")}/></label>
              <label className="human-field field-wide"><span>Description</span><input value={lForm.description} onChange={lf("description")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setLModal(false)}>Cancel</button>
              <button className="primary" onClick={saveLesson} disabled={createLesson.isPending}>{createLesson.isPending?"Saving…":"Create lesson"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
