import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
type Lookup = { id: string; name: string };
type Setup = { sections: Lookup[]; subjects: Lookup[]; teachers: Lookup[]; allocations: { id: string; classSection: string; subject: string; teacher: string; periodsPerWeek: number }[] };
export function TeachingAllocationsPanel({ tenantId, campusId }: { tenantId: string; campusId: string }) {
  const [form, setForm] = useState({ classSectionId: "", subjectId: "", employeeId: "", periodsPerWeek: "5" });
  const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const setup = useQuery({ queryKey: ["teaching-allocations", tenantId, campusId], queryFn: async () => (await api.get<Setup>("/api/academics/teaching-allocations", { params: { tenantId, campusId } })).data });
  async function save() { setSaving(true); setError(""); try {
    await api.post("/api/academics/teaching-allocations", { ...form, tenantId, campusId, periodsPerWeek: Number(form.periodsPerWeek) });
    await setup.refetch(); setForm({ classSectionId: "", subjectId: "", employeeId: "", periodsPerWeek: "5" });
  } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); } }
  return <section className="surface" style={{ marginTop: 20 }}>
    <div className="surface-head"><h3>Teaching allocations</h3><p>Assign a subject and approved teacher to a class. These allocations are used by teacher workspaces, assignments and exams.</p></div>
    <div style={{ padding: 20 }}>
      {(error || setup.error) && <p className="form-error" role="alert">{error || getErrorMessage(setup.error)}</p>}
      <div className="human-form-grid">{([['classSectionId', 'Class section', setup.data?.sections], ['subjectId', 'Subject', setup.data?.subjects], ['employeeId', 'Teacher', setup.data?.teachers]] as const).map(([field, label, rows]) => <label className="human-field" key={field}><span>{label}</span><select value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}><option value="">Select {label.toLowerCase()}</option>{rows?.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>)}
        <label className="human-field"><span>Periods per week</span><input type="number" min="1" max="50" value={form.periodsPerWeek} onChange={e => setForm({ ...form, periodsPerWeek: e.target.value })}/></label>
      </div>
      <button className="primary" disabled={saving || !form.classSectionId || !form.subjectId || !form.employeeId} onClick={() => void save()}>{saving ? "Saving…" : "Add allocation"}</button>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Class</th><th>Subject</th><th>Teacher</th><th>Periods / week</th></tr></thead><tbody>{setup.data?.allocations.map(row => <tr key={row.id}><td>{row.classSection}</td><td>{row.subject}</td><td>{row.teacher}</td><td>{row.periodsPerWeek}</td></tr>)}</tbody></table></div>
      {setup.data?.allocations.length === 0 && <p>No teaching allocations yet. Create campus departments and subjects, and approve teachers before assigning them here.</p>}
    </div>
  </section>;
}
