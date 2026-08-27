import { useEffect, useState } from "react";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { Modal } from "../../../components/ui/Modal";
import { PageHeader } from "../../../components/ui/PageHeader";
import { api } from "../../../core/api/ApiClient";
import { useAuth } from "../../auth/auth";
import { LookupItem, organizationApi } from "../../organization/api/organizationApi";

type SetupType = "years" | "classes" | "sections";

interface SetupItem {
  id: string;
  name: string;
  code?: string;
  parentId?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  educationLevelId?: string;
  educationLevelName?: string;
}

interface SetupForm {
  name: string;
  parentId: string;
  educationLevelId: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const emptyForm: SetupForm = {
  name: "",
  parentId: "",
  educationLevelId: "",
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

export function AcademicSetupPage() {
  const { user } = useAuth();
  const tenantId = user?.roles.includes("SuperAdmin")
    ? sessionStorage.getItem("selected_tenant_id") ?? undefined
    : user?.tenantId;

  const [schoolId, setSchoolId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [setupType, setSetupType] = useState<SetupType>("years");
  const [items, setItems] = useState<SetupItem[]>([]);
  const [classes, setClasses] = useState<SetupItem[]>([]);
  const [educationLevels, setEducationLevels] = useState<LookupItem[]>([]);
  const [branchLevelIds, setBranchLevelIds] = useState<string[]>([]);
  const [form, setForm] = useState<SetupForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void organizationApi.getEducationLevels().then(setEducationLevels);
  }, []);

  async function load(type = setupType, selectedBranchId = branchId): Promise<void> {
    if (!selectedBranchId) {
      setItems([]);
      return;
    }

    const response = await api.get(`/api/academics/setup/${type}`, {
      params: { tenantId, branchId: selectedBranchId },
    });
    setItems(unpack(response.data));

    if (type === "sections") {
      const classResponse = await api.get("/api/academics/setup/classes", {
        params: { tenantId, branchId: selectedBranchId },
      });
      setClasses(unpack(classResponse.data));
    }
  }

  async function changeBranch(selectedBranchId: string): Promise<void> {
    setBranchId(selectedBranchId);
    setForm(emptyForm);

    if (!selectedBranchId) {
      setItems([]);
      setBranchLevelIds([]);
      return;
    }

    const policy = await organizationApi.getBranchPolicy(selectedBranchId, tenantId ?? "");
    setBranchLevelIds(policy.educationLevels.map(level => level.id));
    await load(setupType, selectedBranchId);
  }

  async function save(): Promise<void> {
    await api.post("/api/academics/setup", {
      tenantId,
      schoolId,
      branchId,
      kind: setupType,
      ...form,
    });

    setModalOpen(false);
    setForm(emptyForm);
    await load();
  }

  function selectType(type: SetupType): void {
    setSetupType(type);
    setForm(emptyForm);
    void load(type);
  }

  const currentYear = new Date().getFullYear();
  const availableLevels = educationLevels.filter(level => branchLevelIds.includes(level.id));

  return (
    <>
      <PageHeader
        title="Academic Setup"
        subtitle="Maintain branch academic years, classes and sections"
        action={(
          <button className="primary" disabled={!branchId} onClick={() => setModalOpen(true)}>
            + Add {setupType === "years" ? "academic year" : setupType.slice(0, -1)}
          </button>
        )}
      />

      <section className="surface data-surface">
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

        <div className="section-tabs">
          <button className={setupType === "years" ? "active" : ""} onClick={() => selectType("years")}>Academic years</button>
          <button className={setupType === "classes" ? "active" : ""} onClick={() => selectType("classes")}>Classes</button>
          <button className={setupType === "sections" ? "active" : ""} onClick={() => selectType("sections")}>Sections</button>
        </div>

        <div className="premium-table-wrap">
          <table className="premium-table">
            <thead><tr><th>Name</th><th>Code</th>{setupType === "classes" && <th>Education level</th>}{setupType === "years" && <th>Period</th>}<th>Status</th></tr></thead>
            <tbody>{items.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td>{item.code ?? "System generated"}</td>{setupType === "classes" && <td>{item.educationLevelName ?? "Not assigned"}</td>}{setupType === "years" && <td>{item.startDate} — {item.endDate}</td>}<td><span className="status-pill">{item.isCurrent ? "Current" : "Active"}</span></td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title={`Add ${setupType === "years" ? "academic year" : setupType.slice(0, -1)}`} onClose={() => setModalOpen(false)}>
        <div className="human-form-grid">
          {setupType === "years" ? (
            <>
              <label className="human-field"><span>Academic year</span><select value={form.name} onChange={event => { const year = Number(event.target.value); setForm(current => ({ ...current, name: event.target.value, startDate: `${year}-08-01`, endDate: `${year + 1}-07-31` })); }}><option value="">Select year</option><option value={String(currentYear)}>{currentYear}/{currentYear + 1} (current)</option><option value={String(currentYear + 1)}>{currentYear + 1}/{currentYear + 2} (next)</option></select></label>
              <label className="human-field"><span>Start date</span><input type="date" value={form.startDate} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></label>
              <label className="human-field"><span>End date</span><input type="date" value={form.endDate} onChange={event => setForm(current => ({ ...current, endDate: event.target.value }))} /></label>
              <label className="human-field"><span>Current year</span><input type="checkbox" checked={form.isCurrent} onChange={event => setForm(current => ({ ...current, isCurrent: event.target.checked }))} /></label>
            </>
          ) : (
            <>
              <label className="human-field"><span>Name</span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></label>
              {setupType === "classes" && <label className="human-field"><span>Education level *</span><select value={form.educationLevelId} onChange={event => setForm(current => ({ ...current, educationLevelId: event.target.value }))}><option value="">Select education level</option>{availableLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}</select></label>}
              {setupType === "sections" && <label className="human-field"><span>Class *</span><select value={form.parentId} onChange={event => setForm(current => ({ ...current, parentId: event.target.value }))}><option value="">Select class</option>{classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
            </>
          )}
        </div>
        <div className="modal-actions"><button className="secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="primary" disabled={!form.name || (setupType === "classes" && !form.educationLevelId) || (setupType === "sections" && !form.parentId)} onClick={() => void save()}>Save</button></div>
      </Modal>
    </>
  );
}
