import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Plus, School as SchoolIcon } from "lucide-react";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../auth/auth";
import { Campus, organizationApi, School } from "../api/organizationApi";

const emptySchool = { name: "", registrationNumber: "", email: "", phone: "", fax: "", website: "", address: "", city: "", province: "", country: "", logoUrl: "" };
const emptyCampus = { schoolId: "", name: "", branchType: "REGIONAL_BRANCH" as const, address: "", city: "", province: "", phone: "", fax: "", mobile: "", email: "", logoUrl: "" };

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

  async function load(): Promise<void> {
    if (!tenantId) return;
    try {
      const [schoolRows, campusRows] = await Promise.all([
        organizationApi.getSchools(tenantId),
        organizationApi.getCampuses(tenantId),
      ]);
      setSchools(schoolRows);
      setCampuses(campusRows);
    } catch (error) {
      notify({ kind: "error", title: "Organization unavailable", message: error instanceof Error ? error.message : "Could not load schools and branches." });
    }
  }

  useEffect(() => { void load(); }, [tenantId]);
  const schoolNames = useMemo(() => new Map(schools.map(item => [item.id, item.name])), [schools]);

  async function saveSchool(): Promise<void> {
    if (!tenantId || !school.name.trim()) return;
    setBusy(true);
    try {
      await organizationApi.createSchool({ tenantId, ...school });
      setSchool(emptySchool); setSchoolOpen(false); await load();
      notify({ kind: "success", title: "School created", message: "The school is ready. You can now add its branches." });
    } catch (error) { notify({ kind: "error", title: "School creation failed", message: error instanceof Error ? error.message : "Request failed." }); }
    finally { setBusy(false); }
  }

  async function saveCampus(): Promise<void> {
    if (!tenantId || !campus.schoolId || !campus.name.trim()) return;
    setBusy(true);
    try {
      await organizationApi.createCampus({ tenantId, ...campus });
      setCampus(emptyCampus); setCampusOpen(false); await load();
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
      <div className="organization-grid">
        {schools.map(item => <article className="organization-card" key={item.id}>
          <div className="organization-card-head"><span className="entity-icon"><Building2 size={18}/></span><div><h3>{item.name}</h3><p>{item.code}{item.registrationNumber ? ` · ${item.registrationNumber}` : ""}</p></div></div>
          <div className="organization-contact"><span>{item.email || "No email configured"}</span><span>{item.phone || "No telephone configured"}{item.fax ? ` · Fax ${item.fax}` : ""}</span><span>{[item.city, item.province, item.country].filter(Boolean).join(", ") || "Location not configured"}</span></div>
          <div className="branch-list">{campuses.filter(branch => branch.schoolId === item.id).map(branch => <div className="branch-row" key={branch.id}><MapPin size={15}/><div><b>{branch.name}</b><small>{branch.code} · {formatBranchType(branch.branchType)} · {[branch.city, branch.province].filter(Boolean).join(", ") || branch.address || "Location not configured"}</small></div></div>)}{!campuses.some(branch => branch.schoolId === item.id) && <div className="empty-inline">No branches yet</div>}</div>
        </article>)}
        {!schools.length && <div className="empty-state">Create the first school before adding branches.</div>}
      </div>
    </section>

    <Modal open={schoolOpen} title="Add school" onClose={() => setSchoolOpen(false)}><div className="human-form"><div className="form-section-title"><b>School identity</b><span>Create the school record. Branches are added separately beneath it.</span></div><div className="human-form-grid">
      <Field label="School name *" value={school.name} onChange={value => setSchool(v => ({...v, name:value}))}/><Field label="Registration number" value={school.registrationNumber} onChange={value => setSchool(v => ({...v, registrationNumber:value}))}/><Field label="Email" type="email" value={school.email} onChange={value => setSchool(v => ({...v, email:value}))}/><Field label="Telephone" value={school.phone} onChange={value => setSchool(v => ({...v, phone:value}))}/><Field label="Fax" value={school.fax} onChange={value => setSchool(v => ({...v, fax:value}))}/><Field label="Website address" value={school.website} onChange={value => setSchool(v => ({...v, website:value}))}/><Field label="City" value={school.city} onChange={value => setSchool(v => ({...v, city:value}))}/><Field label="Province" value={school.province} onChange={value => setSchool(v => ({...v, province:value}))}/><Field label="Country" value={school.country} onChange={value => setSchool(v => ({...v, country:value}))}/><Field label="Address" value={school.address} onChange={value => setSchool(v => ({...v, address:value}))}/>
    </div></div><div className="modal-actions"><button className="secondary" onClick={() => setSchoolOpen(false)}>Cancel</button><button className="primary" disabled={busy || !school.name} onClick={() => void saveSchool()}>{busy ? "Creating…" : "Create school"}</button></div></Modal>

    <Modal open={campusOpen} title="Add branch / campus" onClose={() => setCampusOpen(false)}><div className="human-form"><div className="form-section-title"><b>Branch details</b><span>Select the parent school and enter the operating campus information.</span></div><div className="human-form-grid"><label className="human-field"><span>School *</span><select value={campus.schoolId} onChange={e => setCampus(v => ({...v, schoolId:e.target.value}))}><option value="">Select school</option>{schools.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><Field label="Branch name *" value={campus.name} onChange={value => setCampus(v => ({...v, name:value}))}/><label className="human-field"><span>Branch type *</span><select value={campus.branchType} onChange={event => setCampus(value => ({ ...value, branchType: event.target.value as Campus["branchType"] }))}><option value="HEAD_OFFICE">Head Office</option><option value="REGIONAL_HEAD_OFFICE">Regional Head Office</option><option value="REGIONAL_BRANCH">Regional Branch</option></select></label><Field label="Email" type="email" value={campus.email} onChange={value => setCampus(v => ({...v, email:value}))}/><Field label="Telephone" value={campus.phone} onChange={value => setCampus(v => ({...v, phone:value}))}/><Field label="Fax" value={campus.fax} onChange={value => setCampus(v => ({...v, fax:value}))}/><Field label="Mobile" value={campus.mobile} onChange={value => setCampus(v => ({...v, mobile:value}))}/><Field label="City" value={campus.city} onChange={value => setCampus(v => ({...v, city:value}))}/><Field label="Province" value={campus.province} onChange={value => setCampus(v => ({...v, province:value}))}/><Field label="Address" value={campus.address} onChange={value => setCampus(v => ({...v, address:value}))}/><Field label="Logo URL" value={campus.logoUrl} onChange={value => setCampus(v => ({...v, logoUrl:value}))}/></div></div><div className="modal-actions"><button className="secondary" onClick={() => setCampusOpen(false)}>Cancel</button><button className="primary" disabled={busy || !campus.schoolId || !campus.name} onClick={() => void saveCampus()}>{busy ? "Creating…" : "Create branch"}</button></div></Modal>
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
