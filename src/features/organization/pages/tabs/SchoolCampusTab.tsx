/**
 * SchoolCampusTab — Schools · Campuses · Departments
 * Full CRUD with ViewDrawer, EditModal, RowActions, Pagination.
 * All mutations go through apiAdapter → real API when VITE_USE_MOCKS=false.
 */
import { useState } from "react";
import { parseMeta, toItems } from "../../../../core/utils/dataHelpers";
import { Building2, Plus, X } from "lucide-react";
import {
  useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool, useSchoolById,
  useCampuses, useCreateCampus, useUpdateCampus, useDeleteCampus, useCampusById,
  useDepartments, useCreateDepartment, useDeleteDepartment, useUpdateDepartment,
  useBranchGenderTypes, useAcademicSystems, useEducationLevels,
} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { RowActions } from "../../../../components/ui/RowActions";
import { ViewDrawer } from "../../../../components/ui/ViewDrawer";
import { EditModal  } from "../../../../components/ui/EditModal";
import { Pagination } from "../../../../components/ui/Pagination";
import { PkPhoneInput, PkEmailInput, PkCitySelect, PkProvinceSelect } from "../../../../components/ui/PakistanFields";

// ── Helpers ───────────────────────────────────────────────────────────────────
const items     = (d: unknown) => toItems(d);

const BRANCH_LABELS: Record<number, string> = {
  1: "Head Office", 2: "Regional Head Office", 3: "Regional Branch",
};
const BRANCH_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg:"#EEF2FF", color:"#6366F1" },
  2: { bg:"#EFF6FF", color:"#2563EB" },
  3: { bg:"#F0FDF4", color:"#059669" },
};

/** Reusable modal wrapper */
function Modal({ open, title, onClose, children }: {
  open: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width:"min(600px,96vw)", maxHeight:"90vh", overflowY:"auto" }}>
        <div className="modal-head" style={{ position:"sticky", top:0, background:"var(--surface)", zIndex:1 }}>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
type TabView = "schools" | "campuses" | "departments";

export function SchoolCampusTab() {
  const { user } = useAuth();
  const tid      = effectiveTenantId(user) ?? "";

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: schoolsData   } = useSchools();
  const { data: campusesData  } = useCampuses();
  const { data: deptsData     } = useDepartments();
  const { data: genderTypes   } = useBranchGenderTypes();
  const { data: acSystemsData } = useAcademicSystems();
  const { data: educLevels    } = useEducationLevels();

  const schools  = items(schoolsData);
  const campuses = items(campusesData);
  const depts    = items(deptsData);
  const gTypes   = Array.isArray(genderTypes) ? genderTypes : [];
  const acSys    = items(acSystemsData);
  const eLevels  = Array.isArray(educLevels)  ? educLevels  : [];

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createSchool  = useCreateSchool();
  const updSchool     = useUpdateSchool();
  const delSchool     = useDeleteSchool();

  const createCampus  = useCreateCampus();
  const updCampus     = useUpdateCampus();
  const delCampus     = useDeleteCampus();

  const createDept    = useCreateDepartment();
  const updDept       = useUpdateDepartment();
  const delDept       = useDeleteDepartment();

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [tab,      setTab]  = useState<TabView>("schools");
  const [error,    setError]= useState("");
  const [page,     setPage] = useState(1);
  const PAGE_SIZE = 10;

  // View/Edit IDs → fetched fresh via getById
  const [viewSchoolId, setViewSchoolId] = useState<string|null>(null);
  const [editSchoolId, setEditSchoolId] = useState<string|null>(null);
  const { data: schoolDetail } = useSchoolById(viewSchoolId ?? editSchoolId ?? undefined);
  const schoolItem: any = schoolDetail ?? null;

  const [viewCampusId, setViewCampusId] = useState<string|null>(null);
  const [editCampusId, setEditCampusId] = useState<string|null>(null);
  const { data: campusDetail } = useCampusById(viewCampusId ?? editCampusId ?? undefined);
  const campusItem: any = campusDetail ?? null;

  const [viewDept, setViewDept] = useState<any|null>(null);
  const [editDept, setEditDept] = useState<any|null>(null);

  // Create form state
  const [showSchoolForm,  setShowSchoolForm]  = useState(false);
  const [showCampusForm,  setShowCampusForm]  = useState(false);
  const [showDeptForm,    setShowDeptForm]    = useState(false);

  const [sForm, setSForm] = useState({
    name:"", registrationNumber:"", email:"", phone:"", website:"",
    address:"", city:"", province:"", country:"Pakistan",
  });
  const [cForm, setCForm] = useState({
    schoolId:"", name:"", branchType:1, branchGenderTypeId:"",
    academicSystemId:"", educationLevelIds:[] as string[],
    address:"", city:"", province:"", country:"Pakistan", phone:"", email:"",
  });
  const [dForm, setDForm] = useState({ campusId:"", name:"", telephone:"", email:"" });

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const sf = (k: string) => (v: string) => setSForm(p => ({ ...p, [k]: v }));
  const cf = (k: string) => (v: string) => setCForm(p => ({ ...p, [k]: v }));
  const df = (k: string) => (v: string) => setDForm(p => ({ ...p, [k]: v }));
  const sel = (k: string, setter: (fn: any) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => setter((p: any) => ({ ...p, [k]: e.target.value }));

  function resetAndClose(modal: "school" | "campus" | "dept") {
    setError("");
    if (modal === "school") { setShowSchoolForm(false); setSForm({ name:"", registrationNumber:"", email:"", phone:"", website:"", address:"", city:"", province:"", country:"Pakistan" }); }
    if (modal === "campus") { setShowCampusForm(false); setCForm({ schoolId:"", name:"", branchType:1, branchGenderTypeId:"", academicSystemId:"", educationLevelIds:[], address:"", city:"", province:"", country:"Pakistan", phone:"", email:"" }); }
    if (modal === "dept")   { setShowDeptForm(false);   setDForm({ campusId:"", name:"", telephone:"", email:"" }); }
  }

  function toggleEdLevel(id: string) {
    setCForm(p => ({
      ...p,
      educationLevelIds: p.educationLevelIds.includes(id)
        ? p.educationLevelIds.filter(x => x !== id)
        : [...p.educationLevelIds, id],
    }));
  }

  // ── Save handlers ─────────────────────────────────────────────────────────────
  async function saveSchool() {
    if (!sForm.name) { setError("School name is required"); return; }
    try {
      await createSchool.mutateAsync({ tenantId:tid, ...sForm });
      resetAndClose("school");
    } catch (e: any) { setError(e?.message ?? "Failed to save"); }
  }

  async function saveCampus() {
    if (!cForm.name || !cForm.schoolId || !cForm.branchGenderTypeId) {
      setError("Name, school and gender policy are required"); return;
    }
    try {
      await createCampus.mutateAsync({
        tenantId:tid, schoolId:cForm.schoolId, name:cForm.name,
        branchType:cForm.branchType, branchGenderTypeId:cForm.branchGenderTypeId,
        academicSystemId:cForm.academicSystemId || undefined,
        educationLevelIds:cForm.educationLevelIds.length ? cForm.educationLevelIds : undefined,
        address:cForm.address||undefined, city:cForm.city||undefined,
        province:cForm.province||undefined, country:cForm.country||undefined,
        phone:cForm.phone||undefined, email:cForm.email||undefined,
      });
      resetAndClose("campus");
    } catch (e: any) { setError(e?.message ?? "Failed to save"); }
  }

  async function saveDept() {
    if (!dForm.name || !dForm.campusId) { setError("Name and campus are required"); return; }
    try {
      await createDept.mutateAsync({ tenantId:tid, campusId:dForm.campusId, name:dForm.name, telephone:dForm.telephone||undefined, email:dForm.email||undefined });
      resetAndClose("dept");
    } catch (e: any) { setError(e?.message ?? "Failed to save"); }
  }

  // ── Paged data ─────────────────────────────────────────────────────────────────
  const pagedList = (list: any[]) => list.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // ── Render ─────────────────────────────────────────────────────────────────────
  const TAB_COUNT: Record<TabView, number> = { schools: schools.length, campuses: campuses.length, departments: depts.length };
  const TAB_LABELS: Record<TabView, string> = { schools:"🏫 Schools", campuses:"🏛️ Campuses", departments:"👥 Departments" };

  return (
    <>
      {/* Tab bar */}
      <div className="section-tabs" style={{ marginBottom:14, flexWrap:"wrap" }}>
        {(["schools","campuses","departments"] as TabView[]).map(t => (
          <button key={t} className={tab===t?"active":""} onClick={() => { setTab(t); setPage(1); }}>
            {TAB_LABELS[t]} ({TAB_COUNT[t]})
          </button>
        ))}
      </div>

      {/* ── Schools ─────────────────────────────────────────────────────────── */}
      {tab === "schools" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Schools</h3><p>Top-level school entities — each can have multiple campuses</p></div>
            <button className="primary" onClick={() => { setShowSchoolForm(true); setError(""); }}>
              <Plus size={14}/> Add school
            </button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Name</th><th>Code</th><th>Reg #</th>
                  <th>City</th><th>Email</th><th>Phone</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No schools yet. Add one above.</td></tr>
                ) : pagedList(schools).map((s: any) => (
                  <tr key={s.id}>
                    <td><b>{s.name}</b></td>
                    <td><code style={{ fontSize:11 }}>{s.code ?? "—"}</code></td>
                    <td style={{ fontSize:12 }}>{s.registrationNumber ?? "—"}</td>
                    <td style={{ fontSize:12 }}>{s.city ?? "—"}</td>
                    <td style={{ fontSize:12 }}>{s.email ?? "—"}</td>
                    <td style={{ fontSize:12 }}>{s.phone ?? "—"}</td>
                    <td style={{ textAlign:"right" }}>
                      <RowActions
                        onView={() => setViewSchoolId(s.id)}
                        onEdit={() => setEditSchoolId(s.id)}
                        onDelete={() => delSchool.mutate(s.id)}
                        deleteLabel="school"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={schools.length}
            onPage={setPage} label="schools" />
        </div>
      )}

      {/* ── Campuses ────────────────────────────────────────────────────────── */}
      {tab === "campuses" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Campuses / Branches</h3><p>Branch assignments, gender policy, academic systems</p></div>
            <button className="primary" onClick={() => { setShowCampusForm(true); setError(""); }}>
              <Plus size={14}/> Add campus
            </button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Campus name</th><th>Code</th><th>Type</th>
                  <th>Gender</th><th>Academic system</th>
                  <th>City</th><th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campuses.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No campuses yet.</td></tr>
                ) : pagedList(campuses).map((c: any) => {
                  const bt   = BRANCH_COLORS[Number(c.branchType)] ?? BRANCH_COLORS[3];
                  const gType = gTypes.find((g:any) => g.id === c.branchGenderTypeId);
                  const acName = acSys.find((a:any) => a.id === c.academicSystemId)?.name ?? "—";
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <Building2 size={13} style={{ color:bt.color, flexShrink:0 }}/>
                          <b>{c.name}</b>
                        </div>
                      </td>
                      <td><code style={{ fontSize:11 }}>{c.code ?? "—"}</code></td>
                      <td>
                        <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:700, background:bt.bg, color:bt.color }}>
                          {BRANCH_LABELS[Number(c.branchType)] ?? "Branch"}
                        </span>
                      </td>
                      <td style={{ fontSize:11 }}>{gType?.name ?? "—"}</td>
                      <td style={{ fontSize:11 }}>{acName}</td>
                      <td style={{ fontSize:12 }}>{c.city ?? "—"}</td>
                      <td style={{ textAlign:"right" }}>
                        <RowActions
                          onView={() => setViewCampusId(c.id)}
                          onEdit={() => setEditCampusId(c.id)}
                          onDelete={() => delCampus.mutate(c.id)}
                          deleteLabel="campus"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={campuses.length}
            onPage={setPage} label="campuses" />
        </div>
      )}

      {/* ── Departments ──────────────────────────────────────────────────────── */}
      {tab === "departments" && (
        <div className="surface">
          <div className="surface-head">
            <div><h3>Departments</h3><p>Academic and administrative departments per campus</p></div>
            <button className="primary" onClick={() => { setShowDeptForm(true); setError(""); }}>
              <Plus size={14}/> Add department
            </button>
          </div>
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Department</th><th>Code</th><th>Campus</th>
                  <th>Email</th><th>Phone</th><th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {depts.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No departments yet.</td></tr>
                ) : pagedList(depts).map((d: any) => {
                  const campus = campuses.find((c:any) => c.id === d.campusId);
                  return (
                    <tr key={d.id}>
                      <td><b>{d.name}</b></td>
                      <td><code style={{ fontSize:11 }}>{d.code ?? "—"}</code></td>
                      <td style={{ fontSize:12 }}>{campus?.name ?? "—"}</td>
                      <td style={{ fontSize:12 }}>{d.email ?? "—"}</td>
                      <td style={{ fontSize:12 }}>{d.telephone ?? "—"}</td>
                      <td style={{ textAlign:"right" }}>
                        <RowActions
                          onView={() => setViewDept(d)}
                          onEdit={() => setEditDept(d)}
                          onDelete={() => delDept.mutate(d.id)}
                          deleteLabel="department"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={depts.length}
            onPage={setPage} label="departments" />
        </div>
      )}

      {/* ═══ Create Modals ════════════════════════════════════════════════════ */}

      {/* Add School */}
      <Modal open={showSchoolForm} title="Add school" onClose={() => resetAndClose("school")}>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field field-wide"><span>School name *</span>
            <input value={sForm.name} onChange={e => sf("name")(e.target.value)} placeholder="e.g. Al-Noor Academy"/>
          </label>
          <label className="human-field"><span>Registration #</span>
            <input value={sForm.registrationNumber} onChange={e => sf("registrationNumber")(e.target.value)}/>
          </label>
          <label className="human-field"><span>Website</span>
            <input value={sForm.website} onChange={e => sf("website")(e.target.value)} placeholder="https://school.edu.pk"/>
          </label>
          <PkEmailInput label="Email" value={sForm.email} onChange={sf("email")} placeholder="info@school.edu.pk"/>
          <PkPhoneInput label="Phone" value={sForm.phone} onChange={sf("phone")} placeholder="021-12345678"/>
          <PkCitySelect label="City" value={sForm.city} onChange={sf("city")}/>
          <PkProvinceSelect label="Province" value={sForm.province} onChange={sf("province")}/>
          <label className="human-field field-wide"><span>Street address</span>
            <input value={sForm.address} onChange={e => sf("address")(e.target.value)} placeholder="Building, street, area…"/>
          </label>
        </div>
        {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
        </div>
        <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
          <button className="secondary" onClick={() => resetAndClose("school")}>Cancel</button>
          <button className="primary" onClick={saveSchool} disabled={createSchool.isPending}>
            {createSchool.isPending ? "Saving…" : "Save school"}
          </button>
        </div>
      </Modal>

      {/* Add Campus */}
      <Modal open={showCampusForm} title="Add campus / branch" onClose={() => resetAndClose("campus")}>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field field-wide"><span>School *</span>
            <select value={cForm.schoolId} onChange={sel("schoolId", setCForm)}>
              <option value="">— Select school —</option>
              {schools.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="human-field field-wide"><span>Campus name *</span>
            <input value={cForm.name} onChange={e => cf("name")(e.target.value)} placeholder="e.g. Main Campus (Boys)"/>
          </label>
          <label className="human-field"><span>Branch type</span>
            <select value={cForm.branchType} onChange={e => setCForm(p => ({ ...p, branchType:Number(e.target.value) }))}>
              {Object.entries(BRANCH_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="human-field"><span>Gender policy *</span>
            <select value={cForm.branchGenderTypeId} onChange={sel("branchGenderTypeId", setCForm)}>
              <option value="">— Select —</option>
              {gTypes.map((g:any) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </label>
          <label className="human-field field-wide"><span>Academic system</span>
            <select value={cForm.academicSystemId} onChange={sel("academicSystemId", setCForm)}>
              <option value="">— Select —</option>
              {acSys.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>
          {eLevels.length > 0 && (
            <div style={{ gridColumn:"1/-1" }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--text-2)", marginBottom:8 }}>Education levels offered</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {eLevels.map((el:any) => {
                  const active = cForm.educationLevelIds.includes(el.id);
                  return (
                    <button key={el.id} type="button" onClick={() => toggleEdLevel(el.id)}
                      style={{ padding:"5px 12px", borderRadius:20, border:`1.5px solid ${active?"var(--indigo)":"var(--line)"}`, background:active?"var(--indigo-soft)":"var(--surface)", color:active?"var(--indigo)":"var(--text)", fontSize:11, fontWeight:active?700:400, cursor:"pointer" }}>
                      {el.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <PkEmailInput label="Email" value={cForm.email} onChange={cf("email")} placeholder="campus@school.edu.pk"/>
          <PkPhoneInput label="Phone" value={cForm.phone} onChange={cf("phone")} placeholder="042-12345678"/>
          <PkCitySelect label="City" value={cForm.city} onChange={cf("city")}/>
          <PkProvinceSelect label="Province" value={cForm.province} onChange={cf("province")}/>
          <label className="human-field field-wide"><span>Street address</span>
            <input value={cForm.address} onChange={e => cf("address")(e.target.value)} placeholder="Building, street, area…"/>
          </label>
        </div>
        {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
        </div>
        <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
          <button className="secondary" onClick={() => resetAndClose("campus")}>Cancel</button>
          <button className="primary" onClick={saveCampus} disabled={createCampus.isPending}>
            {createCampus.isPending ? "Saving…" : "Save campus"}
          </button>
        </div>
      </Modal>

      {/* Add Department */}
      <Modal open={showDeptForm} title="Add department" onClose={() => resetAndClose("dept")}>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field field-wide"><span>Campus *</span>
            <select value={dForm.campusId} onChange={e => df("campusId")(e.target.value)}>
              <option value="">— Select campus —</option>
              {campuses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="human-field field-wide"><span>Department name *</span>
            <input value={dForm.name} onChange={e => df("name")(e.target.value)} placeholder="e.g. Mathematics, Science"/>
          </label>
          <PkEmailInput label="Email" value={dForm.email} onChange={df("email")} placeholder="dept@school.edu.pk"/>
          <PkPhoneInput label="Phone" value={dForm.telephone} onChange={df("telephone")} placeholder="042-12345678"/>
        </div>
        {error && <div style={{ color:"var(--danger)", fontSize:12, marginTop:4 }}>{error}</div>}
        </div>
        <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
          <button className="secondary" onClick={() => resetAndClose("dept")}>Cancel</button>
          <button className="primary" onClick={saveDept} disabled={createDept.isPending}>
            {createDept.isPending ? "Saving…" : "Save department"}
          </button>
        </div>
      </Modal>

      {/* ═══ View Drawers ════════════════════════════════════════════════════ */}

      {viewSchoolId && schoolItem && (
        <ViewDrawer title="School" item={schoolItem}
          onClose={() => setViewSchoolId(null)}
          onEdit={() => { setEditSchoolId(viewSchoolId!); setViewSchoolId(null); }}
          fields={[
            { key:"name",               label:"School name",    wide:true },
            { key:"registrationNumber", label:"Reg #"                    },
            { key:"city",               label:"City"                     },
            { key:"province",           label:"Province"                 },
            { key:"country",            label:"Country"                  },
            { key:"phone",              label:"Phone"                    },
            { key:"email",              label:"Email",          wide:true },
          ]}
        />
      )}

      {viewCampusId && campusItem && (
        <ViewDrawer title="Campus" item={campusItem}
          onClose={() => setViewCampusId(null)}
          onEdit={() => { setEditCampusId(viewCampusId!); setViewCampusId(null); }}
          fields={[
            { key:"name",      label:"Campus name", wide:true },
            { key:"branchType",label:"Type"                   },
            { key:"city",      label:"City"                   },
            { key:"province",  label:"Province"               },
            { key:"phone",     label:"Phone"                  },
            { key:"email",     label:"Email",       wide:true },
          ]}
        />
      )}

      {viewDept && (
        <ViewDrawer title="Department" item={viewDept}
          onClose={() => setViewDept(null)}
          onEdit={() => { setEditDept(viewDept); setViewDept(null); }}
          fields={[
            { key:"name",      label:"Name",  wide:true },
            { key:"code",      label:"Code"             },
            { key:"email",     label:"Email"            },
            { key:"telephone", label:"Phone"            },
          ]}
        />
      )}

      {/* ═══ Edit Modals ═════════════════════════════════════════════════════ */}

      {editSchoolId && schoolItem && (
        <EditModal title="School" item={schoolItem}
          onClose={() => setEditSchoolId(null)}
          onSave={async data => {
            await updSchool.mutateAsync({ id: editSchoolId!, body: data });
            setEditSchoolId(null);
          }}
          fields={[
            { key:"name",               label:"School name",  required:true, wide:true },
            { key:"registrationNumber", label:"Reg #"                                  },
            { key:"city",               label:"City",         type:"pk-city"           },
            { key:"province",           label:"Province",     type:"pk-province"       },
            { key:"phone",              label:"Phone",        type:"pk-phone"          },
            { key:"email",              label:"Email",        type:"pk-email", wide:true},
          ]}
        />
      )}

      {editCampusId && campusItem && (
        <EditModal title="Campus" item={campusItem}
          onClose={() => setEditCampusId(null)}
          onSave={async data => {
            await updCampus.mutateAsync({ id: editCampusId!, body: data });
            setEditCampusId(null);
          }}
          fields={[
            { key:"name",    label:"Campus name", required:true, wide:true },
            { key:"city",    label:"City",        type:"pk-city"           },
            { key:"province",label:"Province",    type:"pk-province"       },
            { key:"phone",   label:"Phone",       type:"pk-phone"          },
            { key:"email",   label:"Email",       type:"pk-email"          },
          ]}
        />
      )}

      {editDept && (
        <EditModal title="Department" item={editDept}
          onClose={() => setEditDept(null)}
          onSave={async data => {
            await updDept.mutateAsync({ id: editDept.id, body: data });
            setEditDept(null);
          }}
          fields={[
            { key:"name",      label:"Name",  required:true, wide:true },
            { key:"email",     label:"Email", type:"pk-email"          },
            { key:"telephone", label:"Phone", type:"pk-phone"          },
          ]}
        />
      )}
    </>
  );
}
