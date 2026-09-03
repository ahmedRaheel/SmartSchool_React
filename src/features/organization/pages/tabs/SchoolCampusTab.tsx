import { RowActions } from "../../../../components/ui/RowActions";
import { ViewDrawer } from "../../../../components/ui/ViewDrawer";
import { EditModal  } from "../../../../components/ui/EditModal";
import { Pagination } from "../../../../components/ui/Pagination";
import { useState } from "react";
import { PkPhoneInput, PkEmailInput, PkWebsiteInput, PkAddressBlock } from "../../../../components/ui/PakistanFields";
import { Building2, GitBranch, Plus, Trash2, X } from "lucide-react";
import {
  useSchools, useCreateSchool, useUpdateSchool,
  useCampuses, useCreateCampus, useUpdateCampus,
  useDepartments, useCreateDepartment, useDeleteDepartment,
  useBranchGenderTypes, useEducationLevels, useAcademicSystems,
} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";

const BRANCH_TYPES = [
  { value:"MIXED",  label:"Co-Educational",   icon:"⚥", color:"#6366F1" },
  { value:"MALE",   label:"Boys Only",          icon:"♂", color:"#2563EB" },
  { value:"FEMALE", label:"Girls Only",          icon:"♀", color:"#DB2777" },
];

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

export function SchoolCampusTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  const { data: schoolsData } = useSchools();
  const { data: campusesData } = useCampuses();
  const { data: deptsData } = useDepartments();
  const { data: genderTypes } = useBranchGenderTypes();
  const { data: educLevels } = useEducationLevels();
  const { data: acSystems } = useAcademicSystems();
  const createSchool   = useCreateSchool();
  const createCampus   = useCreateCampus();
  const createDept     = useCreateDepartment();
  const deleteDept     = useDeleteDepartment();

  const schools   = (schoolsData   as any)?.items ?? (schoolsData   as any) ?? [];
  const campuses  = (campusesData  as any)?.items ?? (campusesData  as any) ?? [];
  const depts     = (deptsData     as any)?.items ?? (deptsData     as any) ?? [];
  const gTypes    = Array.isArray(genderTypes)  ? genderTypes  : [];
  const eLevels   = Array.isArray(educLevels)   ? educLevels   : [];
  const acSys     = (acSystems as any)?.items ?? (acSystems as any) ?? [];

  const [view, setView] = useState<"schools"|"campuses"|"departments">("schools");
  const [schoolModal,  setSchoolModal]  = useState(false);
  const [campusModal,  setCampusModal]  = useState(false);
  const [deptModal,    setDeptModal]    = useState(false);
  const [error, setError] = useState("");

  const [viewSchool, setViewSchool] = useState<any|null>(null);
  const [editSchool, setEditSchool] = useState<any|null>(null);
  const [viewCampus, setViewCampus] = useState<any|null>(null);
  const [editCampus, setEditCampus] = useState<any|null>(null);
  const [viewDept,   setViewDept]   = useState<any|null>(null);
  const [editDept,   setEditDept]   = useState<any|null>(null);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(10);
  const [sForm, setSForm] = useState({ name:"", registrationNumber:"", email:"", phone:"", website:"", address:"", city:"", province:"", country:"Pakistan" });
  const [cForm, setCForm] = useState({ schoolId:"", name:"", branchType:"MIXED", branchGenderTypeId:"", academicSystemId:"", educationLevelIds:[] as string[], address:"", city:"", province:"", country:"Pakistan", phone:"", email:"" });
  const [dForm, setDForm] = useState({ campusId:"", name:"", telephone:"", email:"" });

  function ssf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setSForm(p=>({...p,[k]:e.target.value})); }
  function csf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setCForm(p=>({...p,[k]:e.target.value})); }
  function dsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setDForm(p=>({...p,[k]:e.target.value})); }

  function toggleEdLevel(id:string) {
    setCForm(p => ({
      ...p,
      educationLevelIds: p.educationLevelIds.includes(id)
        ? p.educationLevelIds.filter(x=>x!==id)
        : [...p.educationLevelIds, id]
    }));
  }

  async function saveSchool() {
    if (!sForm.name) { setError("School name required"); return; }
    try {
      await createSchool.mutateAsync({ tenantId:tid, ...sForm, registrationNumber:sForm.registrationNumber||undefined, email:sForm.email||undefined, phone:sForm.phone||undefined });
      setSchoolModal(false); setSForm({ name:"", registrationNumber:"", email:"", phone:"", website:"", address:"", city:"", province:"", country:"Pakistan" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveCampus() {
    if (!cForm.name || !cForm.schoolId || !cForm.branchGenderTypeId) { setError("Name, school and gender type required"); return; }
    try {
      await createCampus.mutateAsync({
        tenantId:tid, schoolId:cForm.schoolId, name:cForm.name,
        branchType:cForm.branchType, branchGenderTypeId:cForm.branchGenderTypeId,
        academicSystemId:cForm.academicSystemId||undefined,
        educationLevelIds:cForm.educationLevelIds.length>0?cForm.educationLevelIds:undefined,
        address:cForm.address||undefined, city:cForm.city||undefined,
        province:cForm.province||undefined, country:cForm.country||undefined,
        phone:cForm.phone||undefined, email:cForm.email||undefined,
      });
      setCampusModal(false); setCForm({ schoolId:"", name:"", branchType:"MIXED", branchGenderTypeId:"", academicSystemId:"", educationLevelIds:[], address:"", city:"", province:"", country:"Pakistan", phone:"", email:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveDept() {
    if (!dForm.name || !dForm.campusId) { setError("Name and campus required"); return; }
    try {
      await createDept.mutateAsync({ tenantId:tid, campusId:dForm.campusId, name:dForm.name, telephone:dForm.telephone||undefined, email:dForm.email||undefined });
      setDeptModal(false); setDForm({ campusId:"", name:"", telephone:"", email:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  const BT_BADGE: Record<string,{bg:string;color:string;label:string}> = {
    MIXED:  { bg:"#EEF2FF", color:"#6366F1", label:"Co-Ed"      },
    MALE:   { bg:"#EFF6FF", color:"#2563EB", label:"Boys Only"   },
    FEMALE: { bg:"#FDF2F8", color:"#DB2777", label:"Girls Only"  },
  };

  return (
    <>
      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={view==="schools"?"active":""} onClick={()=>setView("schools")}>🏫 Schools ({schools.length})</button>
        <button className={view==="campuses"?"active":""} onClick={()=>setView("campuses")}>🏛️ Campuses / Branches ({campuses.length})</button>
        <button className={view==="departments"?"active":""} onClick={()=>setView("departments")}>👥 Departments ({depts.length})</button>
      </div>

      {view === "schools" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Schools</h3><p>Top-level school entities — each can have multiple branches</p></div>
            <button className="primary" onClick={()=>{setSchoolModal(true);setError("");}}><Plus size={14}/> Add school</button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th><th>Reg #</th><th>City</th><th>Email</th><th>Phone</th></tr></thead>
              <tbody>
                {schools.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No schools yet.</td></tr>
                : schools.map((s:any)=>(
                  <tr key={s.id}><td><b>{s.name}</b></td><td><code style={{fontSize:11}}>{s.code}</code></td><td>{s.registrationNumber??"-"}</td><td>{s.city??"-"}</td><td>{s.email??"-"}</td><td>{s.phone??"-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "campuses" && (
        <div className="surface">
          <div className="surface-head">
            <div>
              <h3>Campuses / Branches</h3>
              <p>Each branch can be Boys Only, Girls Only or Co-Educational; assigned to an academic system</p>
            </div>
            <button className="primary" onClick={()=>{setCampusModal(true);setError("");}}><Plus size={14}/> Add campus</button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Branch name</th><th>Code</th><th>Gender policy</th><th>Academic system</th><th>City</th><th>Email</th></tr></thead>
              <tbody>
                {campuses.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No campuses yet.</td></tr>
                : campuses.map((c:any)=>{
                  const bt = BT_BADGE[c.branchType] ?? BT_BADGE["MIXED"];
                  const acName = acSys.find((a:any)=>a.id===c.academicSystemId)?.name ?? c.academicSystemId ?? "—";
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <Building2 size={14} style={{color:bt.color,flexShrink:0}}/>
                          <b>{c.name}</b>
                        </div>
                      </td>
                      <td><code style={{fontSize:11}}>{c.code}</code></td>
                      <td>
                        <span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700,background:bt.bg,color:bt.color}}>
                          {bt.label}
                        </span>
                      </td>
                      <td style={{fontSize:11}}>{acName}</td>
                      <td>{c.city??"-"}</td>
                      <td>{c.email??"-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Info cards showing branch types */}
          <div style={{padding:"0 20px 20px",display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
            {BRANCH_TYPES.map(bt=>(
              <div key={bt.value} style={{padding:"10px 16px",borderRadius:10,border:`1.5px solid ${bt.color}30`,background:`${bt.color}10`,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:20}}>{bt.icon}</span>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:bt.color}}>{bt.label}</div>
                  <div style={{fontSize:10,color:"var(--muted)"}}>
                    {campuses.filter((c:any)=>c.branchType===bt.value).length} branch(es)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "departments" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Departments</h3><p>Academic and administrative departments per campus</p></div>
            <button className="primary" onClick={()=>{setDeptModal(true);setError("");}}><Plus size={14}/> Add department</button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Department</th><th>Code</th><th>Campus</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {depts.length===0 ? <tr><td colSpan={6} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No departments yet.</td></tr>
                : depts.map((d:any)=>{
                  const campus = campuses.find((c:any)=>c.id===d.campusId);
                  return (
                    <tr key={d.id}>
                      <td><b>{d.name}</b></td>
                      <td><code style={{fontSize:11}}>{d.code}</code></td>
                      <td style={{fontSize:11}}>{campus?.name??d.campusId??"-"}</td>
                      <td>{d.email??"-"}</td>
                      <td>{d.telephone??"-"}</td>
                      <td style={{textAlign:"right"}}>
                    <RowActions
                      onView={() => setViewDept(d)}
                      onEdit={() => setEditDept(d)}
                      onDelete={() => deleteDept.mutate(d.id)}
                      deleteLabel="department"
                    />
                  </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add School Modal */}
      {schoolModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setSchoolModal(false)}}>
          <div className="modal-card" style={{width:"min(580px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head"><h2>Add school</h2><button className="icon-button" onClick={()=>setSchoolModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>School name *</span><input value={sForm.name} onChange={ssf("name")} placeholder="e.g. Al-Noor Academy"/></label>
              <label className="human-field"><span>Registration #</span><input value={sForm.registrationNumber} onChange={ssf("registrationNumber")}/></label>
              <label className="human-field"><span>Email</span><input type="email" value={sForm.email} onChange={ssf("email")} placeholder="info@school.edu.pk"/></label>
              <label className="human-field"><span>Phone</span><input value={sForm.phone} onChange={ssf("phone")} placeholder="021-12345678"/></label>
              <label className="human-field"><span>Website</span><input value={sForm.website} onChange={ssf("website")} placeholder="https://www.school.edu.pk"/></label>
              <label className="human-field"><span>City</span><input value={sForm.city} onChange={ssf("city")}/></label>
              <label className="human-field"><span>Province</span><input value={sForm.province} onChange={ssf("province")}/></label>
              <label className="human-field"><span>Country</span><input value={sForm.country} onChange={ssf("country")}/></label>
              <label className="human-field field-wide"><span>Address</span><input value={sForm.address} onChange={ssf("address")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setSchoolModal(false)}>Cancel</button>
              <button className="primary" onClick={saveSchool} disabled={createSchool.isPending}>{createSchool.isPending?"Saving…":"Save school"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Campus Modal */}
      {campusModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setCampusModal(false)}}>
          <div className="modal-card" style={{width:"min(640px,96vw)",maxHeight:"90vh",overflowY:"auto"}}>
            <div className="modal-head" style={{position:"sticky",top:0,background:"var(--surface)",zIndex:1}}>
              <h2>Add campus / branch</h2>
              <button className="icon-button" onClick={()=>setCampusModal(false)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>School *</span>
                <select value={cForm.schoolId} onChange={csf("schoolId")}>
                  <option value="">— Select school —</option>
                  {schools.map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Branch name *</span><input value={cForm.name} onChange={csf("name")} placeholder="e.g. Main Campus (Boys)"/></label>

              {/* Branch type selector */}
              <div style={{gridColumn:"1/-1"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Gender policy *</div>
                <div style={{display:"flex",gap:8}}>
                  {BRANCH_TYPES.map(bt=>(
                    <button key={bt.value} type="button" onClick={()=>setCForm(p=>({...p,branchType:bt.value}))}
                      style={{flex:1,padding:"12px 8px",border:`2px solid ${cForm.branchType===bt.value?bt.color:"var(--line)"}`,borderRadius:10,background:cForm.branchType===bt.value?`${bt.color}15`:"var(--surface)",cursor:"pointer",transition:"all .15s"}}>
                      <div style={{fontSize:24,marginBottom:4}}>{bt.icon}</div>
                      <div style={{fontSize:11,fontWeight:700,color:cForm.branchType===bt.value?bt.color:"var(--text)"}}>{bt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="human-field"><span>Gender type *</span>
                <select value={cForm.branchGenderTypeId} onChange={csf("branchGenderTypeId")}>
                  <option value="">— Select —</option>
                  {gTypes.map((g:any)=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>

              <label className="human-field"><span>Academic system</span>
                <select value={cForm.academicSystemId} onChange={csf("academicSystemId")}>
                  <option value="">— Select —</option>
                  {acSys.map((a:any)=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </label>

              {/* Education levels multi-select */}
              <div style={{gridColumn:"1/-1"}}>
                <div style={{fontSize:12,fontWeight:600,color:"#374151",marginBottom:8}}>Education levels offered</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {eLevels.map((el:any)=>{
                    const active = cForm.educationLevelIds.includes(el.id);
                    return (
                      <button key={el.id} type="button" onClick={()=>toggleEdLevel(el.id)}
                        style={{padding:"6px 12px",borderRadius:20,border:`1.5px solid ${active?"#6366F1":"var(--line)"}`,background:active?"#EEF2FF":"var(--surface)",color:active?"#6366F1":"var(--text)",fontSize:11,fontWeight:active?700:400,cursor:"pointer"}}>
                        {el.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="human-field"><span>Email</span><input type="email" value={cForm.email} onChange={csf("email")} placeholder="campus@school.edu.pk"/></label>
              <label className="human-field"><span>Phone</span><input value={cForm.phone} onChange={csf("phone")} placeholder="042-12345678"/></label>
              <label className="human-field"><span>City</span><input value={cForm.city} onChange={csf("city")}/></label>
              <label className="human-field"><span>Province</span><input value={cForm.province} onChange={csf("province")}/></label>
              <label className="human-field field-wide"><span>Address</span><input value={cForm.address} onChange={csf("address")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setCampusModal(false)}>Cancel</button>
              <button className="primary" onClick={saveCampus} disabled={createCampus.isPending}>{createCampus.isPending?"Saving…":"Save campus"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {deptModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDeptModal(false)}}>
          <div className="modal-card" style={{width:"min(480px,96vw)"}}>
            <div className="modal-head"><h2>Add department</h2><button className="icon-button" onClick={()=>setDeptModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Campus *</span>
                <select value={dForm.campusId} onChange={dsf("campusId")}>
                  <option value="">— Select campus —</option>
                  {campuses.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Department name *</span><input value={dForm.name} onChange={dsf("name")} placeholder="e.g. Mathematics"/></label>
              <label className="human-field"><span>Email</span><input type="email" value={dForm.email} onChange={dsf("email")} placeholder="dept@school.edu.pk"/></label>
              <label className="human-field"><span>Phone</span><input value={dForm.telephone} onChange={dsf("telephone")} placeholder="042-12345678"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setDeptModal(false)}>Cancel</button>
              <button className="primary" onClick={saveDept} disabled={createDept.isPending}>{createDept.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}

      {viewSchool && (
        <ViewDrawer title="School" item={viewSchool} onClose={() => setViewSchool(null)}
          onEdit={() => { setEditSchool(viewSchool); setViewSchool(null); }}
          fields={[
            {key:"name",               label:"School name",    wide:true},
            {key:"registrationNumber", label:"Reg #"},
            {key:"city",               label:"City"},
            {key:"province",           label:"Province"},
            {key:"country",            label:"Country"},
            {key:"phone",              label:"Phone"},
            {key:"email",              label:"Email",          wide:true},
          ]} />
      )}
      {editSchool && (
        <EditModal title="School" item={editSchool} onClose={() => setEditSchool(null)}
          onSave={async data => { setEditSchool(null); }}
          fields={[
            {key:"name",     label:"School name",required:true, wide:true},
            {key:"city",     label:"City",        type:"pk-city"},
            {key:"province", label:"Province",    type:"pk-province"},
            {key:"phone",    label:"Phone",       type:"pk-phone"},
            {key:"email",    label:"Email",       type:"pk-email", wide:true},
          ]} />
      )}
      {viewCampus && (
        <ViewDrawer title="Campus" item={viewCampus} onClose={() => setViewCampus(null)}
          onEdit={() => { setEditCampus(viewCampus); setViewCampus(null); }}
          fields={[
            {key:"name",        label:"Campus name", wide:true},
            {key:"branchType",  label:"Type"},
            {key:"city",        label:"City"},
            {key:"phone",       label:"Phone"},
            {key:"status",      label:"Status"},
          ]} />
      )}
      {editCampus && (
        <EditModal title="Campus" item={editCampus} onClose={() => setEditCampus(null)}
          onSave={async data => { setEditCampus(null); }}
          fields={[
            {key:"name",  label:"Campus name", required:true, wide:true},
            {key:"city",  label:"City",         type:"pk-city"},
            {key:"phone", label:"Phone",        type:"pk-phone"},
            {key:"email", label:"Email",        type:"pk-email"},
          ]} />
      )}
      {viewDept && (
        <ViewDrawer title="Department" item={viewDept} onClose={() => setViewDept(null)}
          onEdit={() => { setEditDept(viewDept); setViewDept(null); }}
          fields={[
            {key:"name",      label:"Name",  wide:true},
            {key:"code",      label:"Code"},
            {key:"email",     label:"Email"},
            {key:"telephone", label:"Phone"},
          ]} />
      )}
      {editDept && (
        <EditModal title="Department" item={editDept} onClose={() => setEditDept(null)}
          onSave={async data => { setEditDept(null); }}
          fields={[
            {key:"name",      label:"Name",  required:true, wide:true},
            {key:"email",     label:"Email", type:"pk-email"},
            {key:"telephone", label:"Phone", type:"pk-phone"},
          ]} />
      )}
    </>
  );
}
