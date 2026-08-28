import { useEffect, useState } from "react";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { Modal } from "../../../components/ui/Modal";
import { useUi } from "../../../components/ui/InteractiveUi";
import { PageHeader } from "../../../components/ui/PageHeader";
import { api } from "../../../core/api/ApiClient";
import { useAuth } from "../../auth/auth";
import { Campus, LookupItem, organizationApi, School } from "../../organization/api/organizationApi";

type SetupType = "years" | "classes" | "sections";
const setupRoutes: Record<SetupType, string> = {
  years: "/api/academics/academic-year",
  classes: "/api/academics/grade-level",
  sections: "/api/academics/class-section",
};

function createCode(type: SetupType, name: string): string {
  const prefix = type === "years" ? "AY" : type === "classes" ? "CLS" : "SEC";
  const normalized = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prefix}-${normalized}`.slice(0, 100);
}


interface SetupItem {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  academicSystemId?: string;
}

interface SetupForm {
  name: string;
  parentId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const emptyForm: SetupForm = {
  name: "",
  parentId: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
};

function unpack(payload: unknown): SetupItem[] {
  const data = payload as { value?: SetupItem[] | { items?: SetupItem[] }; items?: SetupItem[] };
  if (Array.isArray(data?.value)) return data.value;
  if (data?.value && !Array.isArray(data.value)) return data.value.items ?? [];
  return data?.items ?? [];
}

export function AcademicSetupPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const { notify, confirm } = useUi();
  const tenantId = user?.roles.includes("SuperAdmin")
    ? sessionStorage.getItem("selected_tenant_id") ?? undefined
    : user?.tenantId;

  const [schoolId, setSchoolId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [setupType, setSetupType] = useState<SetupType>("years");
  const [items, setItems] = useState<SetupItem[]>([]);
  const [classes, setClasses] = useState<SetupItem[]>([]);
  const [academicSystems, setAcademicSystems] = useState<LookupItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [academicSystemId, setAcademicSystemId] = useState("");
  const [selectedItem, setSelectedItem] = useState<SetupItem | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [form, setForm] = useState<SetupForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    void Promise.all([
      organizationApi.getAcademicSystems(tenantId),
      organizationApi.getSchools(tenantId),
      organizationApi.getCampuses(tenantId),
    ]).then(([systems, schoolRows, campusRows]) => {
      setAcademicSystems(systems);
      setSchools(schoolRows);
      setCampuses(campusRows);
    });
  }, [tenantId]);

  async function load(type = setupType, selectedBranchId = branchId): Promise<void> {
    if (!selectedBranchId) {
      setItems([]);
      return;
    }

    const response = await api.get(setupRoutes[type], {
      params: { tenantId, campusId: selectedBranchId, page: 1, pageSize: 200 },
    });
    setItems(unpack(response.data));

    if (type === "sections") {
      const classResponse = await api.get(setupRoutes.classes, {
        params: { tenantId, page: 1, pageSize: 200 },
      });
      setClasses(unpack(classResponse.data));
    }
  }

  async function changeBranch(selectedBranchId: string): Promise<void> {
    setBranchId(selectedBranchId);
    setForm(emptyForm);

    if (!selectedBranchId) {
      setAcademicSystemId("");
      setItems([]);
      return;
    }

    // Academic System belongs to the selected campus. Prefer the campus payload,
    // then use the policy endpoint as a compatibility fallback.
    const selectedCampus = campuses.find(item => item.id === selectedBranchId);
    let systemId = selectedCampus?.academicSystemId ?? "";

    if (!systemId && tenantId) {
      try {
        const policy = await organizationApi.getBranchPolicy(selectedBranchId, tenantId);
        systemId = policy.academicSystemId ?? "";
      } catch {
        // The page can still load academic years when a legacy campus has no policy.
      }
    }

    setAcademicSystemId(systemId);
    await load(setupType, selectedBranchId);
  }

  async function save(): Promise<void> {
    if (!branchId) {
      notify({ kind: "error", title: "Campus required", message: "Select a school and campus first." });
      return;
    }

    if (setupType !== "years" && !academicSystemId) {
      notify({ kind: "error", title: "Academic system required", message: "Select the academic system for this campus before saving." });
      return;
    }

    const request = setupType === "years"
      ? {
          tenantId,
          campusId: branchId,
          academicSystemId,
          code: createCode(setupType, form.name),
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
          isCurrent: form.isCurrent,
        }
      : {
          tenantId,
          campusId: branchId,
          academicSystemId,
          code: createCode(setupType, form.name),
          name: form.name,
          ...(setupType === "sections" ? { classId: form.parentId } : {}),
        };

    if (selectedItem) {
      await api.put(`${setupRoutes[setupType]}/${selectedItem.id}`, { ...request, id: selectedItem.id });
      notify({ kind: "success", title: "Changes saved", message: `${setupType === "years" ? "Academic year" : setupType.slice(0, -1)} updated successfully.` });
    } else {
      await api.post(setupRoutes[setupType], request);
      notify({ kind: "success", title: "Created successfully", message: `${setupType === "years" ? "Academic year" : setupType.slice(0, -1)} created successfully.` });
    }

    setModalOpen(false);
    setSelectedItem(null);
    setForm(emptyForm);
    await load();
  }

  function selectType(type: SetupType): void {
    setSetupType(type);
    setForm(emptyForm);
    void load(type);
  }

  const currentYear = new Date().getFullYear();

  function editItem(item: SetupItem): void {
    setSelectedItem(item);
    setForm({ name: item.name, parentId: item.parentId ?? "", startDate: item.startDate?.slice(0, 10) ?? "", endDate: item.endDate?.slice(0, 10) ?? "", isCurrent: item.isCurrent ?? false });
    setModalOpen(true);
  }

  async function deleteItem(item: SetupItem): Promise<void> {
    const ok = await confirm({ title: `Delete ${item.name}?`, message: "This action cannot be undone.", confirmText: "Delete", danger: true });
    if (!ok) return;
    await api.delete(`${setupRoutes[setupType]}/${item.id}`, { params: { tenantId } });
    notify({ kind: "success", title: "Deleted", message: `${item.name} was deleted successfully.` });
    await load();
  }

  const selectedSchool = schools.find(item => item.id === schoolId);
  const selectedCampus = campuses.find(item => item.id === branchId);
  const selectedAcademicSystem = academicSystems.find(item => item.id === academicSystemId);

  function formatDate(value?: string): string {
    if (!value) return "Not configured";
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <>
      {!embedded && <PageHeader
        title="Academic Setup"
        subtitle="Maintain branch academic years, classes and sections"
        action={(
          <button className="primary" disabled={!branchId} onClick={() => { setSelectedItem(null); setModalOpen(true); }}>
            + Add {setupType === "years" ? "academic year" : setupType.slice(0, -1)}
          </button>
        )}
      />}

      <section className="surface data-surface">
        {embedded && (
          <div className="surface-head academic-setup-head">
            <div>
              <h2>Academic setup</h2>
              <p>Maintain branch academic years, classes and sections in one workspace.</p>
            </div>
            <button className="primary" disabled={!branchId} onClick={() => { setSelectedItem(null); setModalOpen(true); }}>
              + Add {setupType === "years" ? "academic year" : setupType.slice(0, -1)}
            </button>
          </div>
        )}
        <SchoolBranchSelector
          tenantId={tenantId ?? ""}
          schoolId={schoolId}
          branchId={branchId}
          onSchoolChange={value => {
            setSchoolId(value);
            setBranchId("");
            setItems([]);
          }}
          onBranchChange={value => void changeBranch(value)}
        />
        <label className="field academic-system-context">
          <span>Academic system *</span>
          <select value={academicSystemId} onChange={event => setAcademicSystemId(event.target.value)}>
            <option value="">Select academic system</option>
            {academicSystems.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
          </select>
        </label>

        <div className="section-tabs">
          <button className={setupType === "years" ? "active" : ""} onClick={() => selectType("years")}>Academic years</button>
          <button className={setupType === "classes" ? "active" : ""} onClick={() => selectType("classes")}>Classes</button>
          <button className={setupType === "sections" ? "active" : ""} onClick={() => selectType("sections")}>Sections</button>
        </div>

        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead><tr><th>Name</th><th>Code</th>{setupType === "years" && <th>Period</th>}<th>Status</th><th>Actions</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td>{item.code ?? "System generated"}</td>{setupType === "years" && <td>{item.startDate && item.endDate ? `${item.startDate.slice(0,10)} — ${item.endDate.slice(0,10)}` : "Period not configured"}</td>}<td><span className="status-pill">{item.isCurrent ? "Current" : "Active"}</span></td><td><div className="row-actions"><button className="text-button" onClick={() => { setSelectedItem(item); setViewOpen(true); }}>View</button><button className="text-button" onClick={() => editItem(item)}>Edit</button><button className="text-button danger-text" onClick={() => void deleteItem(item)}>Delete</button></div></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title={`${selectedItem ? "Edit" : "Add"} ${setupType === "years" ? "academic year" : setupType.slice(0, -1)}`} onClose={() => { setModalOpen(false); setSelectedItem(null); }}>
        <div className="human-form-grid">
          {setupType === "years" ? (
            <>
              <label className="human-field"><span>Academic year</span><select value={form.name} onChange={event => { const year = Number(event.target.value); setForm(current => ({ ...current, name: event.target.value, startDate: `${year}-08-01`, endDate: `${year + 1}-07-31` })); }}><option value="">Select year</option><option value={String(currentYear)}>{currentYear}/{currentYear + 1} (current)</option><option value={String(currentYear + 1)}>{currentYear + 1}/{currentYear + 2} (next)</option></select></label>
              <label className="human-field"><span>Start date</span><input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></label>
              <label className="human-field"><span>End date</span><input type="date" value={form.endDate} onChange={event => setForm(current => ({ ...current, endDate: event.target.value }))} /></label>
              <label className="human-field academic-current-field"><span>Current year</span><span className="checkbox-control"><input type="checkbox" checked={form.isCurrent} onChange={event => setForm(current => ({ ...current, isCurrent: event.target.checked }))} /><span aria-hidden="true" /></span></label>
            </>
          ) : (
            <>
              <label className="human-field"><span>Name</span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
              
              {setupType === "sections" && <label className="human-field"><span>Class *</span><select value={form.parentId} onChange={event => setForm(current => ({ ...current, parentId: event.target.value }))}><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            </>
          )}
        </div>
        <div className="modal-actions"><button className="secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary" disabled={!form.name || (setupType === "sections" && !form.parentId)} onClick={() => void save()}>Save</button></div>
      </Modal>
      <Modal open={viewOpen} title={setupType === "years" ? "Academic year details" : `${selectedItem?.name ?? "Details"} details`} onClose={() => setViewOpen(false)}>
        {setupType === "years" ? (
          <div className="academic-year-detail">
            <div className="academic-year-hero">
              <div>
                <span className="detail-eyebrow">ACADEMIC YEAR</span>
                <h2>{selectedItem?.name}</h2>
                <p>{selectedItem?.code ?? "System generated code"}</p>
              </div>
              <span className={`status-pill ${selectedItem?.isCurrent ? "current" : ""}`}>{selectedItem?.isCurrent ? "Current" : "Active"}</span>
            </div>
            <div className="academic-year-period">
              <div><span>Start date</span><strong>{formatDate(selectedItem?.startDate)}</strong></div>
              <div className="period-arrow">→</div>
              <div><span>End date</span><strong>{formatDate(selectedItem?.endDate)}</strong></div>
            </div>
            <div className="detail-grid compact">
              <div><span>School</span><b>{selectedSchool ? `${selectedSchool.code} — ${selectedSchool.name}` : "Not available"}</b></div>
              <div><span>Campus</span><b>{selectedCampus ? `${selectedCampus.code} — ${selectedCampus.name}` : "Not available"}</b></div>
              <div><span>Academic system</span><b>{selectedAcademicSystem ? `${selectedAcademicSystem.code} — ${selectedAcademicSystem.name}` : "Not configured"}</b></div>
              <div><span>Current academic year</span><b>{selectedItem?.isCurrent ? "Yes" : "No"}</b></div>
            </div>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setViewOpen(false)}>Close</button>
              <button className="primary" onClick={() => { if (selectedItem) { setViewOpen(false); editItem(selectedItem); } }}>Edit academic year</button>
            </div>
          </div>
        ) : (
          <div className="detail-grid"><div><span>Name</span><b>{selectedItem?.name}</b></div><div><span>Code</span><b>{selectedItem?.code ?? "—"}</b></div></div>
        )}
      </Modal>
    </>
  );
}
