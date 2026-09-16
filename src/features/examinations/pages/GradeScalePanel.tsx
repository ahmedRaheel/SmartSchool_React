import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../core/api/ApiClient";
import { organizationApi } from "../../organization/api/organizationApi";
import { getErrorMessage } from "../../../core/api/errorMessage";
type Grade = { id: string; campusId: string; name: string; minimumPercentage: number; maximumPercentage: number; gradePoint?: number };
export function GradeScalePanel({ tenantId }: { tenantId: string }) {
 const [form, setForm] = useState({ campusId: "", name: "", minimumPercentage: "", maximumPercentage: "", gradePoint: "" }); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
 const campuses = useQuery({ queryKey: ["exam-grade-campuses", tenantId], queryFn: () => organizationApi.getCampuses(tenantId) });
 const grades = useQuery({ queryKey: ["exam-grade-scale", tenantId], queryFn: async () => (await api.get<{ items: Grade[] }>("/api/examinations/grade-scale", { params: { tenantId, page: 1, pageSize: 200 } })).data.items });
 async function save() { setSaving(true); setError(""); try { await api.post("/api/examinations/grade-scale", { ...form, tenantId, minimumPercentage: Number(form.minimumPercentage), maximumPercentage: Number(form.maximumPercentage), gradePoint: form.gradePoint === "" ? null : Number(form.gradePoint) }); await grades.refetch(); setForm({ ...form, name: "", minimumPercentage: "", maximumPercentage: "", gradePoint: "" }); } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); } }
 return <details className="surface" style={{ marginTop: 20, padding: 20 }}><summary>Grade scale configuration</summary><p>Configure non-overlapping percentage ranges for each campus. Results use these saved ranges when marks are entered.</p>
 {(error || grades.error || campuses.error) && <p role="alert">{error || getErrorMessage(grades.error || campuses.error)}</p>}
 <div className="human-form-grid"><label className="human-field"><span>Campus</span><select value={form.campusId} onChange={e => setForm({ ...form, campusId: e.target.value })}><option value="">Select campus</option>{campuses.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 {([['name','Grade'],['minimumPercentage','Minimum %'],['maximumPercentage','Maximum %'],['gradePoint','Grade point (optional)']] as const).map(([k,l]) => <label className="human-field" key={k}><span>{l}</span><input type={k === "name" ? "text" : "number"} min="0" max={k.includes("Percentage") ? 100 : undefined} step="0.01" value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}/></label>)}</div>
 <button className="primary" disabled={saving || !form.campusId || !form.name || form.minimumPercentage === "" || form.maximumPercentage === ""} onClick={() => void save()}>Add grade range</button>
 <table className="data-table"><thead><tr><th>Campus</th><th>Grade</th><th>Minimum %</th><th>Maximum %</th></tr></thead><tbody>{grades.data?.map(g => <tr key={g.id}><td>{campuses.data?.find(c => c.id === g.campusId)?.name ?? "All"}</td><td>{g.name}</td><td>{g.minimumPercentage}</td><td>{g.maximumPercentage}</td></tr>)}</tbody></table></details>;
}
