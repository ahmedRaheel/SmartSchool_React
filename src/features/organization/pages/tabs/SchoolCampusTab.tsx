import { useState } from "react";
import { Building2, Plus, Trash2, X } from "lucide-react";
import {
  useSchools, useCreateSchool, useCampuses, useCreateCampus,
  useDepartments, useCreateDepartment, useDeleteDepartment,
  useBranchGenderTypes, useEducationLevels,
} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import type { CreateSchoolRequest, CreateCampusRequest, CreateDepartmentRequest } from "../../../../core/api/backendContracts";

export function SchoolCampusTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);

  const { data: schools, isLoading: sLoad } = useSchools();
  const { data: campuses, isLoading: cLoad } = useCampuses();
  const { data: departments, isLoading: dLoad } = useDepartments();
  const { data: genderTypes } = useBranchGenderTypes();
  const { data: eduLevels } = useEducationLevels();

  const createSchool  = useCreateSchool();
  const createCampus  = useCreateCampus();
  const createDept    = useCreateDepartment();
  const deleteDept    = useDeleteDepartment();

  // Modal state
  const [modal, setModal] = useState<"school"|"campus"|"dept"|null>(null);
  const [error, setError] = useState("");

  // Forms
  const [schoolForm, setSchoolForm] = useState<Partial<CreateSchoolRequest>>({});
  const [campusForm, setCampusForm] = useState<Partial<CreateCampusRequest>>({ branchType:"MIXED", educationLevelIds:[] });
  const [deptForm,   setDeptForm]   = useState<Partial<CreateDepartmentRequest>>({});

  const schoolItems  = (schools as any)?.items  ?? (schools as any) ?? [];
  const campusItems  = (campuses as any)?.items ?? (campuses as any) ?? [];
  const deptItems    = (departments as any)?.items ?? (departments as any) ?? [];
  const gTypes = genderTypes ?? [];
  const eLevels = eduLevels ?? [];

  async function saveSchool() {
    if (!schoolForm.name) { setError("School name required"); return; }
    try { await createSchool.mutateAsync({ tenantId: tid, ...schoolForm }); setModal(null); setSchoolForm({}); setError(""); }
    catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  async function saveCampus() {
    if (!campusForm.name || !campusForm.schoolId || !campusForm.branchGenderTypeId || !campusForm.educationLevelIds?.length) {
      setError("School, campus name, gender type and at least one education level required"); return;
    }
    try { await createCampus.mutateAsync({ tenantId: tid, ...campusForm } as any); setModal(null); setCampusForm({ branchType:"MIXED", educationLevelIds:[] }); setError(""); }
    catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  async function saveDept() {
    if (!deptForm.name || !deptForm.campusId) { setError("Campus and department name required"); return; }
    try { await createDept.mutateAsync({ tenantId: tid, ...deptForm } as any); setModal(null); setDeptForm({}); setError(""); }
    catch (e: any) { setError(e?.message ?? "Failed"); }
  }

  function sf(k: keyof CreateSchoolRequest) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setSchoolForm(p => ({ ...p, [k]: e.target.value })); }
  function cf(k: keyof CreateCampusRequest) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setCampusForm(p => ({ ...p, [k]: e.target.value })); }
  function df(k: keyof CreateDepartmentRequest) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setDeptForm(p => ({ ...p, [k]: e.target.value })); }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Schools */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Schools</h3><p>Registered school entities under your tenant</p></div>
          <button className="primary" onClick={() => { setModal("school"); setError(""); setSchoolForm({}); }}><Plus size={14}/> Add school</button>
        </div>
        {sLoad ? <div style={{ padding:20, color:"var(--muted)", fontSize:12 }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th><th>City</th><th>Email</th><th>Phone</th></tr></thead>
              <tbody>
                {schoolItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign:"center", padding:20, color:"var(--muted)" }}>No schools yet. Add your first school above.</td></tr>
                : schoolItems.map((s: any) => (
                  <tr key={s.id}><td><b>{s.name}</b></td><td><code style={{fontSize:11}}>{s.code}</code></td><td>{s.city ?? "—"}</td><td>{s.email ?? "—"}</td><td>{s.phone ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campuses */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Campuses / Branches</h3><p>Physical locations under your schools</p></div>
          <button className="primary" onClick={() => { setModal("campus"); setError(""); setCampusForm({ branchType:"MIXED", educationLevelIds:[] }); }}><Plus size={14}/> Add campus</button>
        </div>
        {cLoad ? <div style={{ padding:20, color:"var(--muted)", fontSize:12 }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Campus</th><th>Code</th><th>Type</th><th>City</th><th>Email</th></tr></thead>
              <tbody>
                {campusItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign:"center", padding:20, color:"var(--muted)" }}>No campuses yet.</td></tr>
                : campusItems.map((c: any) => (
                  <tr key={c.id}><td><b>{c.name}</b></td><td><code style={{fontSize:11}}>{c.code}</code></td><td>{c.branchType}</td><td>{c.city ?? "—"}</td><td>{c.email ?? "—"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Departments */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Departments</h3><p>Academic and administrative departments per campus</p></div>
          <button className="primary" onClick={() => { setModal("dept"); setError(""); setDeptForm({}); }}><Plus size={14}/> Add department</button>
        </div>
        {dLoad ? <div style={{ padding:20, color:"var(--muted)", fontSize:12 }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Department</th><th>Code</th><th>Email</th><th>Phone</th><th/></tr></thead>
              <tbody>
                {deptItems.length === 0 ? <tr><td colSpan={5} style={{ textAlign:"center", padding:20, color:"var(--muted)" }}>No departments yet.</td></tr>
                : deptItems.map((d: any) => (
                  <tr key={d.id}>
                    <td><b>{d.name}</b></td><td><code style={{fontSize:11}}>{d.code}</code></td>
                    <td>{JSON.parse(d.metadataJson ?? "{}").email ?? "—"}</td>
                    <td>{JSON.parse(d.metadataJson ?? "{}").telephone ?? "—"}</td>
                    <td><button className="table-action danger-button" style={{fontSize:10}} onClick={() => deleteDept.mutate(d.id)}><Trash2 size={11}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add School Modal */}
      {modal === "school" && (
        <div className="modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div className="modal-card" style={{ width:"min(640px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head"><h2>Add school</h2><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>School name *</span><input value={schoolForm.name ?? ""} onChange={sf("name")} placeholder="e.g. Al-Noor Academy"/></label>
              <label className="human-field"><span>Registration no.</span><input value={schoolForm.registrationNumber ?? ""} onChange={sf("registrationNumber")}/></label>
              <label className="human-field"><span>Email</span><input type="email" value={schoolForm.email ?? ""} onChange={sf("email")}/></label>
              <label className="human-field"><span>Phone</span><input value={schoolForm.phone ?? ""} onChange={sf("phone")}/></label>
              <label className="human-field"><span>Website</span><input value={schoolForm.website ?? ""} onChange={sf("website")}/></label>
              <label className="human-field"><span>City</span><input value={schoolForm.city ?? ""} onChange={sf("city")}/></label>
              <label className="human-field"><span>Province</span><input value={schoolForm.province ?? ""} onChange={sf("province")}/></label>
              <label className="human-field"><span>Country</span><input value={schoolForm.country ?? ""} onChange={sf("country")}/></label>
              <label className="human-field field-wide"><span>Address</span><input value={schoolForm.address ?? ""} onChange={sf("address")}/></label>
            </div>
            {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={saveSchool} disabled={createSchool.isPending}>{createSchool.isPending?"Saving…":"Save school"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Campus Modal */}
      {modal === "campus" && (
        <div className="modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div className="modal-card" style={{ width:"min(680px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
            <div className="modal-head"><h2>Add campus / branch</h2><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>School *</span>
                <select value={campusForm.schoolId ?? ""} onChange={cf("schoolId" as any)}>
                  <option value="">— Select school —</option>
                  {schoolItems.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Campus name *</span><input value={campusForm.name ?? ""} onChange={cf("name")} placeholder="e.g. Main Campus"/></label>
              <label className="human-field"><span>Branch type *</span>
                <select value={campusForm.branchType} onChange={cf("branchType")}>
                  <option value="MIXED">Mixed (Boys & Girls)</option>
                  <option value="MALE">Boys Only</option>
                  <option value="FEMALE">Girls Only</option>
                </select>
              </label>
              <label className="human-field"><span>Gender type *</span>
                <select value={campusForm.branchGenderTypeId ?? ""} onChange={cf("branchGenderTypeId" as any)}>
                  <option value="">— Select —</option>
                  {gTypes.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Education levels * (hold Ctrl to multi-select)</span>
                <select multiple size={4} value={campusForm.educationLevelIds}
                  onChange={e => setCampusForm(p => ({ ...p, educationLevelIds: Array.from(e.target.selectedOptions, o => o.value) }))}>
                  {eLevels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>City</span><input value={campusForm.city ?? ""} onChange={cf("city")}/></label>
              <label className="human-field"><span>Province</span><input value={campusForm.province ?? ""} onChange={cf("province")}/></label>
              <label className="human-field"><span>Phone</span><input value={campusForm.phone ?? ""} onChange={cf("phone")}/></label>
              <label className="human-field"><span>Email</span><input type="email" value={campusForm.email ?? ""} onChange={cf("email")}/></label>
            </div>
            {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={saveCampus} disabled={createCampus.isPending}>{createCampus.isPending?"Saving…":"Save campus"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {modal === "dept" && (
        <div className="modal-backdrop" onClick={e => { if (e.target===e.currentTarget) setModal(null); }}>
          <div className="modal-card" style={{ width:"min(500px,96vw)" }}>
            <div className="modal-head"><h2>Add department</h2><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Campus *</span>
                <select value={deptForm.campusId ?? ""} onChange={df("campusId" as any)}>
                  <option value="">— Select campus —</option>
                  {campusItems.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide"><span>Department name *</span><input value={deptForm.name ?? ""} onChange={df("name")} placeholder="e.g. Mathematics"/></label>
              <label className="human-field"><span>Email</span><input type="email" value={(deptForm as any).email ?? ""} onChange={df("email" as any)}/></label>
              <label className="human-field"><span>Telephone</span><input value={(deptForm as any).telephone ?? ""} onChange={df("telephone" as any)}/></label>
            </div>
            {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="primary" onClick={saveDept} disabled={createDept.isPending}>{createDept.isPending?"Saving…":"Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
