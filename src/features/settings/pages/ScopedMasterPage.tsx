import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { PageHeader } from "../../../components/ui/PageHeader";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { useAuth } from "../../auth/auth";

type Kind = "department" | "fee-type";
type Item = { id: string; code?: string; name: string; telephone?: string; email?: string; metadataJson?: string };
type Lookup = { id: string; code?: string; name: string };

function unpack(data: any): Item[] { const value=data?.value??data; return value?.items??(Array.isArray(value)?value:[]); }
function codeFor(kind: Kind, name: string): string { const p=kind==="department"?"DEP":"FEE"; return `${p}-${name.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"")}`.slice(0,100); }

export function ScopedMasterPage({ kind }: { kind: Kind }) {
  const { user } = useAuth(); const { notify, confirm } = useUi();
  const tenantId=user?.roles.includes("SuperAdmin")?sessionStorage.getItem("selected_tenant_id")??"":user?.tenantId??"";
  const isDepartment=kind==="department"; const base=isDepartment?"/api/organization/department":"/api/finance/fee-type";
  const title=isDepartment?"Departments":"Fee Types";
  const [schoolId,setSchoolId]=useState(""); const [campusId,setCampusId]=useState(""); const [academicSystemId,setAcademicSystemId]=useState("");
  const [systems,setSystems]=useState<Lookup[]>([]); const [rows,setRows]=useState<Item[]>([]); const [query,setQuery]=useState("");
  const [editing,setEditing]=useState<Item|null|undefined>(undefined); const [view,setView]=useState<Item|null>(null);
  const [form,setForm]=useState({name:"",telephone:"",email:""});
  useEffect(()=>{ api.get("/api/academics/academic-system",{params:{tenantId,page:1,pageSize:100}}).then(r=>setSystems(unpack(r.data))).catch(()=>setSystems([])); },[tenantId]);
  async function load(){ if(!campusId){setRows([]);return;} try{const r=await api.get(base,{params:{tenantId,campusId,academicSystemId:academicSystemId||undefined,page:1,pageSize:200}});setRows(unpack(r.data));}catch(e){notify({kind:"error",title:`Unable to load ${title}`,message:getErrorMessage(e)});} }
  useEffect(()=>{void load();},[campusId,academicSystemId]);
  const filtered=useMemo(()=>rows.filter(x=>JSON.stringify(x).toLowerCase().includes(query.toLowerCase())),[rows,query]);
  function openAdd(){setForm({name:"",telephone:"",email:""});setEditing(null);}
  function openEdit(x:Item){setForm({name:x.name,telephone:x.telephone??"",email:x.email??""});setEditing(x);}
  async function save(){ if(!form.name.trim()||!campusId||!academicSystemId){notify({kind:"error",title:"Required information missing",message:"Select School, Campus, Academic System and enter a name."});return;} const body={tenantId,campusId,academicSystemId,code:codeFor(kind,form.name),name:form.name.trim(),...(isDepartment?{telephone:form.telephone.trim()||null,email:form.email.trim()||null}:{})}; try{if(editing?.id)await api.put(`${base}/${editing.id}`,{...body,id:editing.id});else await api.post(base,body);notify({kind:"success",title:editing?.id?"Changes saved":"Created successfully",message:`${isDepartment?"Department":"Fee type"} saved successfully.`});setEditing(undefined);await load();}catch(e){notify({kind:"error",title:"Save failed",message:getErrorMessage(e)});} }
  async function remove(x:Item){if(!await confirm({title:`Delete ${x.name}?`,message:"This action cannot be undone.",confirmText:"Delete",danger:true}))return;try{await api.delete(`${base}/${x.id}`,{params:{tenantId}});notify({kind:"success",title:"Deleted",message:`${x.name} was deleted successfully.`});await load();}catch(e){notify({kind:"error",title:"Delete failed",message:getErrorMessage(e)});} }
  return <>
    <PageHeader title={title} subtitle={isDepartment?"Campus academic and administrative departments":"Reusable fee categories for campus billing"} action={<button className="primary" disabled={!campusId||!academicSystemId} onClick={openAdd}>+ Add {isDepartment?"Department":"Fee Type"}</button>}/>
    <section className="surface data-surface scoped-master"><SchoolBranchSelector tenantId={tenantId} schoolId={schoolId} branchId={campusId} onSchoolChange={v=>{setSchoolId(v);setCampusId("");}} onBranchChange={setCampusId}/>
      <label className="field"><span>Academic system *</span><select value={academicSystemId} onChange={e=>setAcademicSystemId(e.target.value)}><option value="">Select academic system</option>{systems.map(x=><option key={x.id} value={x.id}>{x.code?`${x.code} — `:""}{x.name}</option>)}</select></label>
      <div className="table-toolbar"><input placeholder={`Search ${title.toLowerCase()}…`} value={query} onChange={e=>setQuery(e.target.value)}/></div>
      <div className="premium-table-wrap"><table className="premium-table"><thead><tr><th>Name</th><th>Code</th>{isDepartment&&<><th>Telephone</th><th>Email</th></>}<th>Actions</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><b>{x.name}</b></td><td>{x.code??"—"}</td>{isDepartment&&<><td>{x.telephone??"—"}</td><td>{x.email??"—"}</td></>}<td><div className="row-actions"><button title="View" onClick={()=>setView(x)}><Eye size={16}/></button><button title="Edit" onClick={()=>openEdit(x)}><Pencil size={16}/></button><button title="Delete" onClick={()=>void remove(x)}><Trash2 size={16}/></button></div></td></tr>)}{!filtered.length&&<tr><td colSpan={isDepartment?5:3} className="empty-cell">No records found.</td></tr>}</tbody></table></div>
    </section>
    <Modal open={editing!==undefined} title={`${editing?.id?"Edit":"Add"} ${isDepartment?"Department":"Fee Type"}`} onClose={()=>setEditing(undefined)}><div className="human-form-grid"><label className="human-field"><span>Name *</span><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></label>{isDepartment&&<><label className="human-field"><span>Telephone</span><input value={form.telephone} onChange={e=>setForm(f=>({...f,telephone:e.target.value}))}/></label><label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></label></>}</div><div className="modal-actions"><button className="secondary" onClick={()=>setEditing(undefined)}>Cancel</button><button className="primary" onClick={()=>void save()}>{editing?.id?"Save changes":`Create ${isDepartment?"department":"fee type"}`}</button></div></Modal>
    <Modal open={!!view} title={view?.name??"Details"} onClose={()=>setView(null)}><div className="detail-grid"><div><span>Name</span><b>{view?.name}</b></div><div><span>Code</span><b>{view?.code??"—"}</b></div>{isDepartment&&<><div><span>Telephone</span><b>{view?.telephone??"—"}</b></div><div><span>Email</span><b>{view?.email??"—"}</b></div></>}</div></Modal>
  </>;
}
