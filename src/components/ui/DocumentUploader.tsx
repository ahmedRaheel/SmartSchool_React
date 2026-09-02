/**
 * DocumentUploader — reusable document upload widget.
 * Fetches required documents for an actor type, checks compliance,
 * then uploads via POST /api/documents/files (multipart form).
 *
 * actorType: STUDENT | TEACHER | EMPLOYEE | DRIVER | GUARDIAN | ADMIN_OFFICER
 * entityId:  the entity's UUID (student_id, employee_id, driver_id etc.)
 * staffType: for employees — TEACHER | DRIVER | PRINCIPAL | etc.
 */
import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Upload, XCircle, FileText, AlertTriangle, Loader } from "lucide-react";
import { env } from "../../config/env";

interface RequiredDoc {
  Id: string;
  ActorType: string;
  StaffType?: string;
  DocumentType: string;
  DisplayName: string;
  IsRequired: boolean;
  MinCount: number;
  SortOrder: number;
  ConditionCode?: string;
}

interface ComplianceItem {
  DocumentType: string;
  DisplayName: string;
  RequiredCount: number;
  UploadedCount: number;
  Satisfied: boolean;
}

interface ComplianceResult {
  compliant: boolean;
  requirements: ComplianceItem[];
}

interface UploadedFile {
  documentType: string;
  fileName: string;
  documentNumber: string;
  uploading?: boolean;
  error?: string;
}

interface Props {
  actorType: string;
  entityId: string;
  tenantId: string;
  staffType?: string;
  onComplianceChange?: (compliant: boolean) => void;
  readOnly?: boolean;
  title?: string;
}

// Mock required documents when in mock mode
const MOCK_REQUIRED_DOCS: Record<string, RequiredDoc[]> = {
  STUDENT: [
    { Id:"rd1", ActorType:"STUDENT", DocumentType:"BIRTH_CERTIFICATE",  DisplayName:"Birth Certificate",        IsRequired:true, MinCount:1, SortOrder:1 },
    { Id:"rd2", ActorType:"STUDENT", DocumentType:"PASSPORT_PHOTO",      DisplayName:"Passport-size Photo (×2)", IsRequired:true, MinCount:2, SortOrder:2 },
    { Id:"rd3", ActorType:"STUDENT", DocumentType:"PREVIOUS_RESULT",     DisplayName:"Previous School Result Card",IsRequired:true, MinCount:1, SortOrder:3 },
    { Id:"rd4", ActorType:"STUDENT", DocumentType:"GUARDIAN_CNIC",       DisplayName:"Guardian CNIC Copy",       IsRequired:true, MinCount:1, SortOrder:4 },
    { Id:"rd5", ActorType:"STUDENT", DocumentType:"TRANSFER_CERTIFICATE",DisplayName:"Transfer Certificate",     IsRequired:false,MinCount:1, SortOrder:5 },
  ],
  TEACHER: [
    { Id:"rd6", ActorType:"TEACHER", DocumentType:"CNIC",                DisplayName:"CNIC Copy",                IsRequired:true, MinCount:1, SortOrder:1 },
    { Id:"rd7", ActorType:"TEACHER", DocumentType:"DEGREE",              DisplayName:"Highest Degree Certificate",IsRequired:true, MinCount:1, SortOrder:2 },
    { Id:"rd8", ActorType:"TEACHER", DocumentType:"PASSPORT_PHOTO",      DisplayName:"Passport-size Photo",      IsRequired:true, MinCount:1, SortOrder:3 },
    { Id:"rd9", ActorType:"TEACHER", DocumentType:"EXPERIENCE_LETTER",   DisplayName:"Experience Letter",        IsRequired:false,MinCount:1, SortOrder:4 },
    { Id:"rd10",ActorType:"TEACHER", DocumentType:"POLICE_CLEARANCE",    DisplayName:"Police Clearance Certificate",IsRequired:true,MinCount:1,SortOrder:5},
  ],
  DRIVER: [
    { Id:"rd11",ActorType:"DRIVER",  DocumentType:"CNIC",                DisplayName:"CNIC Copy",                IsRequired:true, MinCount:1, SortOrder:1 },
    { Id:"rd12",ActorType:"DRIVER",  DocumentType:"DRIVING_LICENSE",     DisplayName:"Valid Driving Licence",    IsRequired:true, MinCount:1, SortOrder:2 },
    { Id:"rd13",ActorType:"DRIVER",  DocumentType:"PASSPORT_PHOTO",      DisplayName:"Passport-size Photo",      IsRequired:true, MinCount:1, SortOrder:3 },
    { Id:"rd14",ActorType:"DRIVER",  DocumentType:"POLICE_CLEARANCE",    DisplayName:"Police Clearance Certificate",IsRequired:true,MinCount:1,SortOrder:4},
    { Id:"rd15",ActorType:"DRIVER",  DocumentType:"MEDICAL_CERTIFICATE", DisplayName:"Medical Fitness Certificate",IsRequired:true,MinCount:1,SortOrder:5},
  ],
  EMPLOYEE: [
    { Id:"rd16",ActorType:"EMPLOYEE",DocumentType:"CNIC",                DisplayName:"CNIC Copy",                IsRequired:true, MinCount:1, SortOrder:1 },
    { Id:"rd17",ActorType:"EMPLOYEE",DocumentType:"DEGREE",              DisplayName:"Highest Qualification",    IsRequired:true, MinCount:1, SortOrder:2 },
    { Id:"rd18",ActorType:"EMPLOYEE",DocumentType:"PASSPORT_PHOTO",      DisplayName:"Passport-size Photo",      IsRequired:true, MinCount:1, SortOrder:3 },
  ],
};

export function DocumentUploader({
  actorType, entityId, tenantId, staffType,
  onComplianceChange, readOnly = false, title = "Required Documents"
}: Props) {
  const [requirements, setRequirements] = useState<RequiredDoc[]>([]);
  const [uploaded, setUploaded] = useState<Record<string, UploadedFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isMock = env.useMocks;

  async function fetchRequirements() {
    if (isMock) {
      const docs = MOCK_REQUIRED_DOCS[actorType.toUpperCase()] ?? MOCK_REQUIRED_DOCS.STUDENT;
      setRequirements(docs);
      // Simulate empty compliance (nothing uploaded yet)
      const comp: ComplianceResult = {
        compliant: false,
        requirements: docs.filter(d=>d.IsRequired).map(d=>({ DocumentType:d.DocumentType, DisplayName:d.DisplayName, RequiredCount:d.MinCount, UploadedCount:0, Satisfied:false })),
      };
      setCompliance(comp);
      onComplianceChange?.(false);
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string,string> = { "Content-Type":"application/json" };
      if (token && !token.startsWith("mock_")) headers.Authorization = `Bearer ${token}`;
      else {
        const s = JSON.parse(localStorage.getItem("smartschool.session")??"{}");
        headers["X-Mock-Role"] = s.role ?? "SchoolAdmin";
        headers["X-Mock-TenantId"] = tenantId;
      }
      const reqRes = await fetch(`${env.apiBaseUrl}/api/documents/files/requirements/${actorType}?tenantId=${tenantId}${staffType?`&staffType=${staffType}`:""}`, { headers });
      const docs = await reqRes.json();
      setRequirements(Array.isArray(docs) ? docs : []);

      if (entityId) {
        const compRes = await fetch(`${env.apiBaseUrl}/api/documents/files/compliance/${actorType}/${entityId}?tenantId=${tenantId}${staffType?`&staffType=${staffType}`:""}`, { headers });
        const comp = await compRes.json();
        setCompliance(comp);
        onComplianceChange?.(comp.compliant);
      }
    } catch(e) { console.error("Doc fetch failed", e); } finally { setLoading(false); }
  }

  useEffect(() => { fetchRequirements(); }, [actorType, entityId, tenantId]);

  async function handleFileSelect(docType: string, displayName: string, file: File) {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { alert("File exceeds 25 MB limit"); return; }

    setUploaded(p => ({
      ...p,
      [docType]: [...(p[docType]??[]), { documentType:docType, fileName:file.name, documentNumber:"", uploading:true }]
    }));

    if (isMock || !entityId) {
      // Simulate upload in mock mode
      await new Promise(r => setTimeout(r, 800));
      const fakeNum = `DOC-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      setUploaded(p => ({
        ...p,
        [docType]: (p[docType]??[]).map((f,i) =>
          i === (p[docType]??[]).length-1 ? { documentType:docType, fileName:file.name, documentNumber:fakeNum } : f
        )
      }));
      // Update compliance mock
      setCompliance(prev => {
        if (!prev) return prev;
        const updated = prev.requirements.map(r =>
          r.DocumentType === docType
            ? { ...r, UploadedCount: r.UploadedCount+1, Satisfied: r.UploadedCount+1 >= r.RequiredCount }
            : r
        );
        const allGood = updated.every(r => r.Satisfied);
        onComplianceChange?.(allGood);
        return { compliant: allGood, requirements: updated };
      });
      return;
    }

    // Real upload
    try {
      const session = JSON.parse(localStorage.getItem("smartschool.session")??"{}");
      const form = new FormData();
      form.append("file", file);
      form.append("entityId", entityId);
      form.append("entityType", actorType);
      form.append("documentType", docType);
      form.append("category", "REGISTRATION");
      form.append("purpose", "REGISTRATION");
      form.append("title", displayName);
      if (tenantId) form.append("tenantId", tenantId);

      const headers: Record<string,string> = {};
      const token = localStorage.getItem("access_token");
      if (token && !token.startsWith("mock_")) headers.Authorization = `Bearer ${token}`;
      else { headers["X-Mock-Role"]=session.role??"SchoolAdmin"; headers["X-Mock-TenantId"]=tenantId; }

      const res = await fetch(`${env.apiBaseUrl}/api/documents/files`, { method:"POST", body:form, headers });
      const data = await res.json();
      setUploaded(p => ({
        ...p,
        [docType]: (p[docType]??[]).map((f,i) =>
          i === (p[docType]??[]).length-1 ? { documentType:docType, fileName:file.name, documentNumber:data.documentNumber ?? "Uploaded" } : f
        )
      }));
      // Refresh compliance
      const compRes = await fetch(`${env.apiBaseUrl}/api/documents/files/compliance/${actorType}/${entityId}?tenantId=${tenantId}`, { headers });
      const comp = await compRes.json();
      setCompliance(comp);
      onComplianceChange?.(comp.compliant);
    } catch(e) {
      console.error("Upload failed", e);
      setUploaded(p => ({
        ...p,
        [docType]: (p[docType]??[]).map((f,i) => i === (p[docType]??[]).length-1 ? { ...f, uploading:false, error:"Upload failed" } : f)
      }));
    }
  }

  if (loading) return (
    <div style={{ padding:24, textAlign:"center", color:"var(--muted)", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      <Loader size={16} style={{ animation:"spin 1s linear infinite" }}/> Loading required documents…
    </div>
  );

  const requiredOnly = requirements.filter(r => r.IsRequired);
  const optionalOnly = requirements.filter(r => !r.IsRequired);
  const satisfiedCount = (compliance?.requirements ?? []).filter(r => r.Satisfied).length;
  const totalRequired  = requiredOnly.length;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14 }}>{title}</div>
          <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>
            {satisfiedCount} / {totalRequired} required documents uploaded
          </div>
        </div>
        {compliance && (
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20,
                         background: compliance.compliant ? "#ECFDF5" : "#FFF0F1",
                         border: `1px solid ${compliance.compliant ? "#a7f3d0" : "#fecdd3"}`,
                         fontSize:12, fontWeight:700,
                         color: compliance.compliant ? "#065f46" : "#B91C1C" }}>
            {compliance.compliant ? <CheckCircle2 size={14}/> : <AlertTriangle size={14}/>}
            {compliance.compliant ? "All required docs uploaded" : "Documents incomplete"}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ height:6, borderRadius:999, background:"var(--surface-2)", overflow:"hidden", marginBottom:16 }}>
        <div style={{ height:"100%", borderRadius:999, transition:"width .4s",
                       width: `${totalRequired>0?(satisfiedCount/totalRequired)*100:0}%`,
                       background: compliance?.compliant ? "#10B981" : "#6366F1" }}/>
      </div>

      {/* Required documents */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[...requiredOnly, ...optionalOnly].map(doc => {
          const files = uploaded[doc.DocumentType] ?? [];
          const compItem = compliance?.requirements?.find(r => r.DocumentType === doc.DocumentType);
          const satisfied = compItem?.Satisfied ?? (files.filter(f=>!f.error&&!f.uploading).length >= doc.MinCount);
          const uploading = files.some(f => f.uploading);

          return (
            <div key={doc.Id} style={{
              padding:"12px 16px", borderRadius:12,
              border: `1.5px solid ${satisfied ? "#a7f3d0" : doc.IsRequired ? "#E2E8F0" : "#E2E8F0"}`,
              background: satisfied ? "#F0FDF4" : "var(--surface)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: files.length > 0 ? 8 : 0 }}>
                {/* Status icon */}
                {satisfied
                  ? <CheckCircle2 size={18} style={{ color:"#10B981", flexShrink:0 }}/>
                  : uploading
                  ? <Loader size={18} style={{ color:"#6366F1", flexShrink:0, animation:"spin 1s linear infinite" }}/>
                  : <div style={{ width:18, height:18, borderRadius:"50%", border:"2px solid var(--line)", flexShrink:0 }}/>
                }

                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>
                    {doc.DisplayName}
                    {!doc.IsRequired && <span style={{ marginLeft:6, fontSize:10, color:"var(--muted)", fontWeight:400 }}>(optional)</span>}
                    {doc.MinCount > 1 && <span style={{ marginLeft:6, fontSize:10, color:"#6366F1" }}>×{doc.MinCount}</span>}
                  </div>
                  {doc.IsRequired && !satisfied && (
                    <div style={{ fontSize:10, color:"#D97706", marginTop:1 }}>Required for registration</div>
                  )}
                </div>

                {!readOnly && !satisfied && (
                  <label style={{
                    display:"flex", alignItems:"center", gap:5, padding:"5px 12px",
                    borderRadius:8, border:"1.5px solid #6366F1", background:"#EEF2FF",
                    color:"#6366F1", fontSize:11, fontWeight:700, cursor:"pointer",
                    whiteSpace:"nowrap",
                  }}>
                    <Upload size={13}/>
                    {uploading ? "Uploading…" : "Upload"}
                    <input
                      ref={el => { fileRefs.current[doc.DocumentType] = el; }}
                      type="file"
                      style={{ display:"none" }}
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={e => { const f = e.target.files?.[0]; if(f) handleFileSelect(doc.DocumentType, doc.DisplayName, f); }}
                    />
                  </label>
                )}
              </div>

              {/* Uploaded files list */}
              {files.length > 0 && (
                <div style={{ paddingLeft:28, display:"flex", flexDirection:"column", gap:4 }}>
                  {files.map((f, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)" }}>
                      {f.uploading ? <Loader size={11} style={{ animation:"spin 1s linear infinite" }}/> :
                       f.error    ? <XCircle size={11} style={{ color:"#EF4444" }}/> :
                                    <FileText size={11} style={{ color:"#10B981" }}/>}
                      <span style={{ flex:1 }}>{f.fileName}</span>
                      {f.documentNumber && <code style={{ fontSize:9 }}>{f.documentNumber}</code>}
                      {f.error && <span style={{ color:"#EF4444" }}>{f.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
