import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { documentApi } from "../api/documentApi";
export function DocumentSetupPanel({ tenantId }: { tenantId: string }) {
  const setup = useQuery({ queryKey: ["document-setup-admin", tenantId], queryFn: () => documentApi.setup(tenantId) });
  const [name, setName] = useState(""); const [type, setType] = useState("StudentDocument");
  const [requiredName, setRequiredName] = useState(""); const [role, setRole] = useState("STUDENT"); const [requiredId, setRequiredId] = useState("");
  const [mandatory, setMandatory] = useState(true); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  async function save(path: string, body: object) { setSaving(true); setError(""); try { await api.post(`/api/documents/${path}`, { ...body, tenantId }); await setup.refetch(); setName(""); setRequiredName(""); } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); } }
  return <section className="surface" style={{ padding: 20 }}><h3>Document setup</h3><p>File types classify uploads. Required document types define checklist items; assign these to a role to enforce its checklist.</p>
    {(error || setup.error) && <p className="form-error" role="alert">{error || getErrorMessage(setup.error)}</p>}
    <div className="human-form-grid"><label className="human-field"><span>File type name</span><input value={name} onChange={e => setName(e.target.value)}/></label><label className="human-field"><span>Owner</span><select value={type} onChange={e => setType(e.target.value)}>{["StudentDocument","AdmissionDocument","TeacherDocument","DriverDocument","EmployeeDocument","ParentDocument","CampusDocument","ExaminerDocument"].map(t => <option key={t}>{t}</option>)}</select></label></div>
    <button className="secondary" disabled={saving || !name.trim()} onClick={() => void save("document-types", { name, ownerType: type })}>Add file type</button>
    <p>{setup.data?.documentTypes.map(t => `${t.name} (${t.ownerType?.replace("Document", "")})`).join(" · ") || "No file types configured."}</p>
    <label className="human-field"><span>Required document type name</span><input value={requiredName} onChange={e => setRequiredName(e.target.value)}/></label>
    <button className="secondary" disabled={saving || !requiredName.trim()} onClick={() => void save("required-document-types", { name: requiredName })}>Add checklist item</button>
    <div className="human-form-grid"><label className="human-field"><span>Role</span><select value={role} onChange={e => setRole(e.target.value)}>{["STUDENT","TEACHER","DRIVER","EMPLOYEE","ADMIN_OFFICER","PARENT","EXAMINER"].map(r => <option key={r}>{r}</option>)}</select></label><label className="human-field"><span>Checklist item</span><select value={requiredId} onChange={e => setRequiredId(e.target.value)}><option value="">Select item</option>{setup.data?.requiredDocumentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label><label><input type="checkbox" checked={mandatory} onChange={e => setMandatory(e.target.checked)}/> Mandatory</label></div>
    <button className="primary" disabled={saving || !requiredId} onClick={() => void save("required-documents", { userRole: role, requiredDocumentTypeId: requiredId, isMandatory: mandatory })}>Assign checklist item</button>
    <table className="data-table"><thead><tr><th>Role</th><th>Required document</th><th>Mandatory</th></tr></thead><tbody>{setup.data?.requiredDocuments.map(r => <tr key={r.id}><td>{r.userRole}</td><td>{r.requiredDocumentTypeName}</td><td>{r.isMandatory ? "Yes" : "No"}</td></tr>)}</tbody></table>
  </section>;
}
