import { useCallback, useEffect, useState, useRef } from "react";
import { CheckCircle2, Upload, FileText } from "lucide-react";
import { documentApi, documentOwnerType } from "../../features/documents/api/documentApi";
import type { DocumentItem, DocumentSetup } from "../../features/documents/api/documentApi";
import { getErrorMessage } from "../../core/api/errorMessage";

interface Props {
  actorType: string;
  entityId: string;
  tenantId: string;
  staffType?: string;
  onComplianceChange?: (compliant: boolean) => void;
  readOnly?: boolean;
  title?: string;
}

export function DocumentUploader({ actorType, entityId, tenantId, staffType, onComplianceChange, readOnly = false, title = "Required documents" }: Props) {
  const [setup, setSetup] = useState<DocumentSetup | null>(null);
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const ownerType = documentOwnerType(actorType);
  const role = (actorType === "ADMISSION" ? "STUDENT" : staffType ?? actorType).toUpperCase();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [configuration, documents] = await Promise.all([
        documentApi.setup(tenantId), documentApi.allForOwner(tenantId, ownerType, entityId),
      ]);
      setSetup(configuration);
      setFiles(documents);
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setLoading(false);
    }
  }, [tenantId, ownerType, entityId]);

  useEffect(() => { void load(); }, [load]);
  const requirements = setup?.requiredDocuments.filter(item => item.userRole.toUpperCase() === role) ?? [];
  const mandatory = requirements.filter(item => item.isMandatory);
  const satisfied = mandatory.filter(item => files.some(file => file.requiredDocumentTypeId === item.requiredDocumentTypeId)).length;
  const compliant = !loading && !error && setup !== null && satisfied === mandatory.length;
  const complianceCallback = useRef(onComplianceChange);
  useEffect(() => { complianceCallback.current = onComplianceChange; }, [onComplianceChange]);
  useEffect(() => { complianceCallback.current?.(compliant); }, [compliant, entityId]);

  async function upload(file: File, requiredDocumentTypeId?: string) {
    const key = requiredDocumentTypeId ?? "optional";
    const documentTypeId = selectedTypes[key];
    if (!documentTypeId) {
      setError("Select a document type before uploading.");
      return;
    }
    setUploading(key);
    setError("");
    try {
      await documentApi.upload({ tenantId, entityType: actorType, entityId, documentTypeId, requiredDocumentTypeId, file });
      await load();
    } catch (failure) {
      setError(getErrorMessage(failure));
    } finally {
      setUploading(null);
    }
  }

  if (loading) return <p role="status">Loading documents…</p>;
  const choices = setup?.documentTypes.filter(item => !item.ownerType || item.ownerType.toLowerCase() === ownerType.toLowerCase() || actorType === "ADMISSION" && item.ownerType === "StudentDocument") ?? [];

  return <section>
    <h3>{title}</h3>
    {error && <p role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
    <p>{satisfied} of {mandatory.length} required documents uploaded.</p>
    {compliant && <p style={{ color: "var(--success)" }}><CheckCircle2 size={16} /> Requirements satisfied</p>}
    {!requirements.length && <p>No document requirements are configured for this role.</p>}
    {[...requirements.map(item => ({ key: item.requiredDocumentTypeId, name: item.requiredDocumentTypeName, required: item.isMandatory })), { key: "optional", name: "Additional document", required: false }].map(requirement => <div key={requirement.key} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
      <b>{requirement.name}{requirement.required ? " *" : ""}</b>
      {files.filter(file => file.requiredDocumentTypeId === requirement.key).map(file => <p key={file.documentId}><FileText size={14} /> {file.fileName}</p>)}
      {!readOnly && <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
        <select aria-label={`Document type for ${requirement.name}`} value={selectedTypes[requirement.key] ?? ""} onChange={event => setSelectedTypes(types => ({ ...types, [requirement.key]: event.target.value }))}>
          <option value="">Select document type</option>
          {choices.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
        </select>
        <label className="secondary"><Upload size={14} /> {uploading === requirement.key ? "Uploading…" : "Choose file"}
          <input type="file" disabled={uploading !== null || !selectedTypes[requirement.key]} style={{ display: "none" }} onChange={event => {
            const file = event.target.files?.[0];
            if (file) void upload(file, requirement.key === "optional" ? undefined : requirement.key);
            event.target.value = "";
          }} />
        </label>
      </div>}
    </div>)}
    {files.length > 0 && <div style={{ marginTop: 16 }}><h4>Uploaded files</h4>{files.map(file => <p key={file.documentId}>
      <button type="button" className="soft-button" onClick={() => documentApi.download(file, tenantId).catch(failure => setError(getErrorMessage(failure)))}>{file.fileName}</button>
    </p>)}</div>}
  </section>;
}
