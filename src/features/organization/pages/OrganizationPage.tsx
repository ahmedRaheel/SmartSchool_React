import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Plus, School as SchoolIcon, Pencil, Trash2 } from "lucide-react";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../auth/auth";
import { Campus, LookupItem, organizationApi, School } from "../api/organizationApi";
import { GeographySelector } from "../../../components/forms/GeographySelector";

const emptySchool = { name: "", registrationNumber: "", email: "", phone: "", fax: "", website: "", address: "", city: "", province: "", country: "", logoUrl: "" };
const emptyCampus = { schoolId: "", name: "", branchType: "REGIONAL_BRANCH" as const, branchGenderTypeId: "", educationLevelIds: [] as string[], address: "", city: "", province: "", country: "", phone: "", fax: "", mobile: "", email: "", logoUrl: "" };

export function OrganizationPage() {
  const { user } = useAuth();
  const { notify } = useUi();
  const tenantId = user?.roles.includes("SuperAdmin")
    ? sessionStorage.getItem("selected_tenant_id") ?? ""
    : user?.tenantId ?? "";
  const [schools, setSchools] = useState<School[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [campusOpen, setCampusOpen] = useState(false);
  const [school, setSchool] = useState(emptySchool);
  const [campus, setCampus] = useState(emptyCampus);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editingCampusId, setEditingCampusId] = useState<string | null>(null);
  const [genderTypes, setGenderTypes] = useState<LookupItem[]>([]);
  const [educationLevels, setEducationLevels] = useState<LookupItem[]>([]);

  async function load(): Promise<void> {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [schoolRows, campusRows, genderRows, levelRows] = await Promise.all([
        organizationApi.getSchools(tenantId),
        organizationApi.getCampuses(tenantId),
        organizationApi.getBranchGenderTypes(),
        organizationApi.getEducationLevels(),
      ]);
      setGenderTypes(genderRows);
      setEducationLevels(levelRows);
      setSchools(schoolRows);
      setCampuses(campusRows);
    } catch (error) {
      notify({ kind: "error", title: "Organization unavailable", message: error instanceof Error ? error.message : "Could not load schools and branches." });
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [tenantId]);
  const schoolNames = useMemo(() => new Map(schools.map(item => [item.id, item.name])), [schools]);

  async function saveSchool(): Promise<void> {
    if (!tenantId || !school.name.trim()) return;
    setBusy(true);
    try {
      if (editingSchoolId) await organizationApi.updateSchool(editingSchoolId, { tenantId, ...school });
      else await organizationApi.createSchool({ tenantId, ...school });
      setSchool(emptySchool); setEditingSchoolId(null); setSchoolOpen(false); await load();
      notify({ kind: "success", title: "School created", message: "The school is ready. You can now add its branches." });
    } catch (error) { notify({ kind: "error", title: "School creation failed", message: error instanceof Error ? error.message : "Request failed." }); }
    finally { setBusy(false); }
  }

  async function saveCampus(): Promise<void> {
    if (!tenantId || !campus.schoolId || !campus.name.trim()) return;
    setBusy(true);
    try {
      if (editingCampusId) await organizationApi.updateCampus(editingCampusId, { tenantId, ...campus });
      else await organizationApi.createCampus({ tenantId, ...campus });
      setCampus(emptyCampus); setEditingCampusId(null); setCampusOpen(false); await load();
      notify({ kind: "success", title: "Branch created", message: "The campus has been linked to its school." });
    } catch (error) { notify({ kind: "error", title: "Branch creation failed", message: error instanceof Error ? error.message : "Request failed." }); }
    finally { setBusy(false); }
  }

  return <>
    <PageHeader title="Schools & Branches" subtitle="Manage the legal school organization and the campuses operating beneath it"
      action={<div className="page-actions"><button className="secondary" onClick={() => setCampusOpen(true)} disabled={!schools.length}><Plus size={16}/> Add branch</button><button className="primary" onClick={() => setSchoolOpen(true)}><Plus size={16}/> Add school</button></div>} />

    <div className="metric-grid platform-metrics">
      <article className="metric-card"><span>Schools</span><strong>{schools.length}</strong><small>Organizations in this tenant</small></article>
      <article className="metric-card"><span>Branches</span><strong>{campuses.length}</strong><small>Operating campuses</small></article>
      <article className="metric-card"><span>Structure</span><strong><SchoolIcon size={24}/></strong><small>School → branch hierarchy</small></article>
    </div>

    <section className="surface data-surface">
      <div className="surface-head"><div><h3>School structure</h3><p>Branches are always attached to a school; academic setup can then reference a campus.</p></div></div>
      {loading ? <div className="page-loader"><span className="spinner"/> Loading school structure…</div> : <div className="organization-grid">
        {schools.map(item => <article className="organization-card" key={item.id}>
          <div className="organization-card-head"><span className="entity-icon"><Building2 size={18}/></span><div><h3>{item.name}</h3><p>{item.code}{item.registrationNumber ? ` · ${item.registrationNumber}` : ""}</p></div><div className="row-actions"><button className="icon-button" title="Edit school" onClick={()=>{setEditingSchoolId(item.id);setSchool({name:item.name,registrationNumber:item.registrationNumber??"",email:item.email??"",phone:item.phone??"",fax:item.fax??"",website:item.website??"",address:item.address??"",city:item.city??"",province:item.province??"",country:item.country??"",logoUrl:item.logoUrl??""});setSchoolOpen(true)}}><Pencil size={15}/></button><button className="icon-button danger" title="Delete school" onClick={()=>void (async()=>{if(window.confirm("Delete this school?")){await organizationApi.deleteSchool(item.id,tenantId);await load()}})()}><Trash2 size={15}/></button></div></div>
          <div className="organization-contact"><span>{item.email || "No email configured"}</span><span>{item.phone || "No telephone configured"}{item.fax ? ` · Fax ${item.fax}` : ""}</span><span>{[item.city, item.province, item.country].filter(Boolean).join(", ") || "Location not configured"}</span></div>
          <div className="branch-list">{campuses.filter(branch => branch.schoolId === item.id).map(branch => <div className="branch-row" key={branch.id}><MapPin size={15}/><div><b>{branch.name}</b><small>{branch.code} · {formatBranchType(branch.branchType)} · {[branch.city, branch.province].filter(Boolean).join(", ") || branch.address || "Location not configured"}</small></div><div className="row-actions"><button className="icon-button" onClick={()=>void (async()=>{const policy=await organizationApi.getBranchPolicy(branch.id,tenantId);setEditingCampusId(branch.id);setCampus({schoolId:branch.schoolId,name:branch.name,branchType:branch.branchType,branchGenderTypeId:policy.branchGenderTypeId,educationLevelIds:policy.educationLevels.map(level=>level.id),address:branch.address??"",city:branch.city??"",province:branch.province??"",country:branch.country??"",phone:branch.phone??"",fax:branch.fax??"",mobile:branch.mobile??"",email:branch.email??"",logoUrl:branch.logoUrl??""});setCampusOpen(true)})()}><Pencil size={14}/></button><button className="icon-button danger" onClick={()=>void (async()=>{if(window.confirm("Delete this branch?")){await organizationApi.deleteCampus(branch.id,tenantId);await load()}})()}><Trash2 size={14}/></button></div></div>)}{!campuses.some(branch => branch.schoolId === item.id) && <div className="empty-inline">No branches yet</div>}</div>
        </article>)}
        {!schools.length && <div className="empty-state">Create the first school before adding branches.</div>}
      </div>}
    </section>

    <Modal open={schoolOpen} title={editingSchoolId ? "Update school" : "Add school"} onClose={() => setSchoolOpen(false)}><div className="human-form"><div className="form-section-title"><b>School identity</b><span>Create the school record. Branches are added separately beneath it.</span></div><div className="human-form-grid">
      <Field label="School name *" value={school.name} onChange={value => setSchool(v => ({...v, name:value}))}/><Field label="Registration number" value={school.registrationNumber} onChange={value => setSchool(v => ({...v, registrationNumber:value}))}/><Field label="Email" type="email" value={school.email} onChange={value => setSchool(v => ({...v, email:value}))}/><Field label="Telephone" value={school.phone} onChange={value => setSchool(v => ({...v, phone:value}))}/><Field label="Fax" value={school.fax} onChange={value => setSchool(v => ({...v, fax:value}))}/><Field label="Website address" value={school.website} onChange={value => setSchool(v => ({...v, website:value}))}/><GeographySelector country={school.country} province={school.province} city={school.city} onChange={geo=>setSchool(v=>({...v,...geo}))}/><Field label="Address" value={school.address} onChange={value => setSchool(v => ({...v, address:value}))}/>
    </div></div><div className="modal-actions"><button className="secondary" onClick={() => setSchoolOpen(false)}>Cancel</button><button className="primary" disabled={busy || !school.name} onClick={() => void saveSchool()}>{busy ? "Saving…" : editingSchoolId ? "Update school" : "Create school"}</button></div></Modal>

    <Modal open={campusOpen} title={editingCampusId ? "Update branch / campus" : "Add branch / campus"} onClose={() => setCampusOpen(false)}><div className="human-form"><div className="form-section-title"><b>Branch details</b><span>Select the parent school and enter the operating campus information.</span></div><div className="human-form-grid"><label className="human-field"><span>School *</span><select value={campus.schoolId} onChange={e => setCampus(v => ({...v, schoolId:e.target.value}))}><option value="">Select school</option>{schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Field label="Branch name *" value={campus.name} onChange={value => setCampus(v => ({...v, name:value}))}/><label className="human-field"><span>Branch type *</span><select value={campus.branchType} onChange={event => setCampus(value => ({ ...value, branchType: event.target.value as Campus["branchType"] }))}><option value="HEAD_OFFICE">Head Office</option><option value="REGIONAL_HEAD_OFFICE">Regional Head Office</option><option value="REGIONAL_BRANCH">Regional Branch</option></select></label><label className="human-field"><span>Student gender policy *</span><select value={campus.branchGenderTypeId} onChange={event => setCampus(value => ({ ...value, branchGenderTypeId: event.target.value }))}><option value="">Select gender policy</option>{genderTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><fieldset className="human-field education-level-field"><span>Education levels *</span><div className="checkbox-stack">{educationLevels.map(level => <label key={level.id}><input type="checkbox" checked={campus.educationLevelIds.includes(level.id)} onChange={event => setCampus(value => ({...value, educationLevelIds: event.target.checked ? [...value.educationLevelIds, level.id] : value.educationLevelIds.filter(id => id !== level.id)}))}/><span>{level.name}</span></label>)}</div></fieldset><Field label="Email" type="email" value={campus.email} onChange={value => setCampus(v => ({...v, email:value}))}/><Field label="Telephone" value={campus.phone} onChange={value => setCampus(v => ({...v, phone:value}))}/><Field label="Fax" value={campus.fax} onChange={value => setCampus(v => ({...v, fax:value}))}/><Field label="Mobile" value={campus.mobile} onChange={value => setCampus(v => ({...v, mobile:value}))}/><GeographySelector country={campus.country} province={campus.province} city={campus.city} onChange={geo=>setCampus(v=>({...v,...geo}))}/><Field label="Address" value={campus.address} onChange={value => setCampus(v => ({...v, address:value}))}/><Field label="Logo URL" value={campus.logoUrl} onChange={value => setCampus(v => ({...v, logoUrl:value}))}/></div></div><div className="modal-actions"><button className="secondary" onClick={() => setCampusOpen(false)}>Cancel</button><button className="primary" disabled={busy || !campus.schoolId || !campus.name || !campus.branchGenderTypeId || campus.educationLevelIds.length === 0} onClick={() => void saveCampus()}>{busy ? "Saving…" : editingCampusId ? "Update branch" : "Create branch"}</button></div></Modal>
  </>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="human-field"><span>{label}</span><input type={type} value={value} onChange={event => onChange(event.target.value)} /></label>;
}

function formatBranchType(value: Campus["branchType"]): string {
  const labels: Record<Campus["branchType"], string> = {
    HEAD_OFFICE: "Head Office",
    REGIONAL_HEAD_OFFICE: "Regional Head Office",
    REGIONAL_BRANCH: "Regional Branch",
  };

  return labels[value];
}
