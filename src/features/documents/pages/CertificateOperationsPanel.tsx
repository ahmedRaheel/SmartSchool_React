import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FileBadge2, Plus, Search, ShieldCheck, UserRound, X } from "lucide-react";
import { operationalApi } from "../../../core/api/operationalApi";
import { useCampuses, useEmployees, useStudents } from "../../../core/api/queries";
import { toItems } from "../../../core/utils/dataHelpers";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const DOCUMENT_TYPES = ["SCHOOL_LEAVING", "MIGRATION", "APPRECIATION", "STUDENT_OF_MONTH", "EXTRACURRICULAR", "EMPLOYMENT", "CUSTOM"];

export function CertificateOperationsPanel() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"templates" | "issued" | "verify">("templates");
  const [search, setSearch] = useState("");
  const [templateModal, setTemplateModal] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [campusId, setCampusId] = useState(user?.branchId ?? "");
  const [ownerType, setOwnerType] = useState<"STUDENT" | "EMPLOYEE">("STUDENT");
  const [templateForm, setTemplateForm] = useState({ documentTypeCode: "SCHOOL_LEAVING", code: "", name: "", subjectTemplate: "", headerHtml: "", bodyHtml: "Dear {{OwnerName}},\n\nThis certifies that...", footerHtml: "", languageCode: "en", requiresApproval: true });
  const [issueForm, setIssueForm] = useState({ templateId: "", ownerId: "", purpose: "", remarks: "" });

  const dashboard = useQuery({ queryKey: ["certificate-operations", tenantId], queryFn: () => operationalApi.certificates.dashboard(tenantId), enabled: Boolean(tenantId) });
  const { data: campusData } = useCampuses();
  const { data: studentData } = useStudents(1, issueModal && ownerType === "STUDENT");
  const { data: employeeData } = useEmployees(1, issueModal && ownerType === "EMPLOYEE");
  const campuses = toItems(campusData);
  const students = toItems(studentData);
  const employees = toItems(employeeData);

  const createTemplate = useMutation({
    mutationFn: () => operationalApi.certificates.createTemplate({
      tenantId,
      campusId: campusId || null,
      academicSystemId: null,
      documentTypeCode: templateForm.documentTypeCode,
      code: templateForm.code.trim().toUpperCase(),
      name: templateForm.name.trim(),
      subjectTemplate: templateForm.subjectTemplate.trim() || null,
      headerHtml: templateForm.headerHtml || null,
      bodyHtml: templateForm.bodyHtml,
      footerHtml: templateForm.footerHtml || null,
      languageCode: templateForm.languageCode,
      requiresApproval: templateForm.requiresApproval,
    }),
    onSuccess: async () => {
      setTemplateModal(false);
      await queryClient.invalidateQueries({ queryKey: ["certificate-operations", tenantId] });
    },
  });

  const issueCertificate = useMutation({
    mutationFn: () => operationalApi.certificates.issue({
      tenantId,
      templateId: issueForm.templateId,
      studentId: ownerType === "STUDENT" ? issueForm.ownerId : null,
      employeeId: ownerType === "EMPLOYEE" ? issueForm.ownerId : null,
      fields: { Purpose: issueForm.purpose || null, Remarks: issueForm.remarks || null },
    }),
    onSuccess: async () => {
      setIssueModal(false);
      setIssueForm({ templateId: "", ownerId: "", purpose: "", remarks: "" });
      setTab("issued");
      await queryClient.invalidateQueries({ queryKey: ["certificate-operations", tenantId] });
    },
  });

  const approve = useMutation({
    mutationFn: (documentId: string) => operationalApi.certificates.approve(tenantId, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["certificate-operations", tenantId] }),
  });

  const verify = useMutation({ mutationFn: (code: string) => operationalApi.certificates.verify(code) });

  const templates = dashboard.data?.templates ?? [];
  const issued = dashboard.data?.issuedDocuments ?? [];
  const pending = issued.filter(item => item.status.toUpperCase() === "PENDING_APPROVAL").length;
  const term = search.trim().toLowerCase();
  const filteredTemplates = templates.filter(item => `${item.name} ${item.code} ${item.documentTypeCode}`.toLowerCase().includes(term));
  const filteredIssued = issued.filter(item => `${item.documentNumber} ${item.ownerName} ${item.templateName} ${item.status}`.toLowerCase().includes(term));
  const owners = ownerType === "STUDENT"
    ? students.map((item: any) => ({ id: item.id, name: `${item.firstName} ${item.lastName ?? ""}`.trim(), number: item.studentNumber }))
    : employees.map((item: any) => ({ id: item.id, name: `${item.firstName} ${item.lastName ?? ""}`.trim(), number: item.employeeNumber }));

  return (
    <div className="page-stack">
      <div className="metric-grid cols-3">
        <div className="metric-card"><span className="metric-icon" style={{ color: "var(--info)", background: "var(--info-bg)" }}><FileBadge2 size={18} /></span><div><small>Templates</small><strong>{templates.length}</strong><p>versioned document designs</p></div></div>
        <div className="metric-card"><span className="metric-icon" style={{ color: "var(--success)", background: "var(--success-bg)" }}><BadgeCheck size={18} /></span><div><small>Issued</small><strong>{issued.filter(item => item.status.toUpperCase() === "ISSUED").length}</strong><p>verified documents</p></div></div>
        <div className="metric-card"><span className="metric-icon" style={{ color: pending ? "var(--warning)" : "var(--success)", background: pending ? "var(--warning-bg)" : "var(--success-bg)" }}><ShieldCheck size={18} /></span><div><small>Pending approval</small><strong>{pending}</strong><p>{pending ? "requires review" : "all clear"}</p></div></div>
      </div>

      <div className="section-tabs">
        <button className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>📄 Templates</button>
        <button className={tab === "issued" ? "active" : ""} onClick={() => setTab("issued")}>🏅 Issued documents</button>
        <button className={tab === "verify" ? "active" : ""} onClick={() => setTab("verify")}>🔎 Verify</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left"><h3>{tab === "templates" ? "Certificate & letter templates" : tab === "issued" ? "Issued certificate register" : "Verification lookup"}</h3><p>{tab === "templates" ? "Templates are versioned and rendered into immutable issued snapshots." : tab === "issued" ? "Approval and verification status for generated documents." : "Validate a document using its verification code."}</p></div>
          {tab !== "verify" && <div className="surface-head-actions"><label className="search-box" style={{ maxWidth: 280 }}><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search templates or issued docs…" /></label>{tab === "templates" ? <button className="secondary" onClick={() => setTemplateModal(true)}><Plus size={13} /> Template</button> : <button className="primary" disabled={templates.length === 0} onClick={() => setIssueModal(true)}><FileBadge2 size={13} /> Issue document</button>}</div>}
        </div>

        {dashboard.isLoading ? <div className="empty-state"><b>Loading certificates…</b></div> : tab === "templates" ? (
          filteredTemplates.length === 0 ? <div className="empty-state"><FileBadge2 size={34} /><b>No certificate templates</b><p>Create a reusable school letter or certificate template.</p></div> : (
            <div className="table-wrap"><table className="premium-table"><thead><tr><th>Template</th><th>Code</th><th>Type</th><th>Language</th><th>Version</th><th>Approval</th></tr></thead><tbody>{filteredTemplates.map(item => <tr key={item.templateId}><td><b>{item.name}</b></td><td><code style={{ fontSize: 11 }}>{item.code}</code></td><td>{item.documentTypeCode.replaceAll("_", " ")}</td><td>{item.languageCode.toUpperCase()}</td><td>v{item.version}</td><td><span className={`status-pill ${item.requiresApproval ? "warning" : "success"}`}>{item.requiresApproval ? "Required" : "Auto issue"}</span></td></tr>)}</tbody></table></div>
          )
        ) : tab === "issued" ? (
          filteredIssued.length === 0 ? <div className="empty-state"><BadgeCheck size={34} /><b>No generated documents</b><p>Issue a certificate or letter from a saved template.</p></div> : (
            <div className="table-wrap"><table className="premium-table"><thead><tr><th>Document</th><th>Template</th><th>Owner</th><th>Type</th><th>Status</th><th>Issued</th><th style={{ textAlign: "right" }}>Action</th></tr></thead><tbody>{filteredIssued.map(item => <tr key={item.generatedDocumentId}><td><b>{item.documentNumber}</b><small>{item.verificationCode ? `Verify: ${item.verificationCode}` : ""}</small></td><td>{item.templateName}</td><td>{item.ownerName}</td><td>{item.documentTypeCode.replaceAll("_", " ")}</td><td><span className={`status-pill ${item.status.toUpperCase() === "ISSUED" ? "success" : "warning"}`}>{item.status.replaceAll("_", " ")}</span></td><td>{item.issuedAt ? new Date(item.issuedAt).toLocaleString("en-PK") : "—"}</td><td style={{ textAlign: "right" }}>{item.status.toUpperCase() === "PENDING_APPROVAL" && <button className="soft-button" disabled={approve.isPending} onClick={() => approve.mutate(item.generatedDocumentId)}><BadgeCheck size={13} /> Approve</button>}</td></tr>)}</tbody></table></div>
          )
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ maxWidth: 620, margin: "0 auto" }}>
              <label className="human-field"><span>Verification code</span><div style={{ display: "flex", gap: 8 }}><input style={{ flex: 1 }} value={verifyCode} onChange={event => setVerifyCode(event.target.value)} placeholder="Enter code printed on the issued document" /><button className="primary" disabled={!verifyCode.trim() || verify.isPending} onClick={() => verify.mutate(verifyCode.trim())}><Search size={13} /> Verify</button></div></label>
              {verify.data && <div style={{ marginTop: 18, padding: 18, border: `1px solid ${verify.data.isValid ? "var(--success-border)" : "var(--danger-border)"}`, background: verify.data.isValid ? "var(--success-bg)" : "var(--danger-bg)", borderRadius: 14 }}><div style={{ display: "flex", gap: 10, alignItems: "center" }}><ShieldCheck size={22} style={{ color: verify.data.isValid ? "var(--success)" : "var(--danger)" }} /><div><b>{verify.data.isValid ? "Valid SmartSchool document" : "Verification failed"}</b>{verify.data.isValid && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{verify.data.documentNumber} · {verify.data.ownerName} · {verify.data.status}</div>}</div></div></div>}
            </div>
          </div>
        )}
      </div>

      {templateModal && <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setTemplateModal(false)}><div className="modal-card" style={{ width: "min(760px,96vw)" }}>
        <div className="modal-head"><div><h2>Create certificate template</h2><p>{"Use placeholders such as {{OwnerName}}, {{OwnerNumber}}, {{CampusName}}, {{DocumentNumber}} and {{IssueDate}}."}</p></div><button className="icon-button" onClick={() => setTemplateModal(false)}><X size={18} /></button></div>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field"><span>Document type *</span><select value={templateForm.documentTypeCode} onChange={event => setTemplateForm(current => ({ ...current, documentTypeCode: event.target.value }))}>{DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label>
          <label className="human-field"><span>Template code *</span><input value={templateForm.code} onChange={event => setTemplateForm(current => ({ ...current, code: event.target.value }))} placeholder="SLC-STD" /></label>
          <label className="human-field field-wide"><span>Template name *</span><input value={templateForm.name} onChange={event => setTemplateForm(current => ({ ...current, name: event.target.value }))} /></label>
          {!user?.branchId && <label className="human-field field-wide"><span>Campus</span><select value={campusId} onChange={event => setCampusId(event.target.value)}><option value="">All campuses</option>{campuses.map((campus: any) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label>}
          <label className="human-field"><span>Language</span><select value={templateForm.languageCode} onChange={event => setTemplateForm(current => ({ ...current, languageCode: event.target.value }))}><option value="en">English</option><option value="ur">Urdu</option><option value="ar">Arabic</option></select></label>
          <label className="human-field checkbox-field"><input type="checkbox" checked={templateForm.requiresApproval} onChange={event => setTemplateForm(current => ({ ...current, requiresApproval: event.target.checked }))} /><span>Requires approval before issue</span></label>
          <label className="human-field field-wide"><span>Body template *</span><textarea style={{ minHeight: 180 }} value={templateForm.bodyHtml} onChange={event => setTemplateForm(current => ({ ...current, bodyHtml: event.target.value }))} /></label>
        </div></div>
        <div className="modal-actions"><button className="secondary" onClick={() => setTemplateModal(false)}>Cancel</button><button className="primary" disabled={!templateForm.code.trim() || !templateForm.name.trim() || !templateForm.bodyHtml.trim() || createTemplate.isPending} onClick={() => createTemplate.mutate()}>{createTemplate.isPending ? "Saving…" : "Create template"}</button></div>
      </div></div>}

      {issueModal && <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setIssueModal(false)}><div className="modal-card" style={{ width: "min(680px,96vw)" }}>
        <div className="modal-head"><div><h2>Issue certificate / letter</h2><p>The rendered content is stored as an immutable snapshot.</p></div><button className="icon-button" onClick={() => setIssueModal(false)}><X size={18} /></button></div>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field field-wide"><span>Template *</span><select value={issueForm.templateId} onChange={event => setIssueForm(current => ({ ...current, templateId: event.target.value }))}><option value="">Select template</option>{templates.map(item => <option key={item.templateId} value={item.templateId}>{item.name} · v{item.version}</option>)}</select></label>
          <label className="human-field"><span>Owner type</span><select value={ownerType} onChange={event => { setOwnerType(event.target.value as "STUDENT" | "EMPLOYEE"); setIssueForm(current => ({ ...current, ownerId: "" })); }}><option value="STUDENT">Student</option><option value="EMPLOYEE">Employee</option></select></label>
          <label className="human-field"><span>Owner *</span><select value={issueForm.ownerId} onChange={event => setIssueForm(current => ({ ...current, ownerId: event.target.value }))}><option value="">Select owner</option>{owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name}{owner.number ? ` (${owner.number})` : ""}</option>)}</select></label>
          <label className="human-field field-wide"><span>Purpose</span><input value={issueForm.purpose} onChange={event => setIssueForm(current => ({ ...current, purpose: event.target.value }))} /></label>
          <label className="human-field field-wide"><span>Remarks</span><textarea value={issueForm.remarks} onChange={event => setIssueForm(current => ({ ...current, remarks: event.target.value }))} /></label>
        </div></div>
        <div className="modal-actions"><button className="secondary" onClick={() => setIssueModal(false)}>Cancel</button><button className="primary" disabled={!issueForm.templateId || !issueForm.ownerId || issueCertificate.isPending} onClick={() => issueCertificate.mutate()}>{issueCertificate.isPending ? "Generating…" : "Generate document"}</button></div>
      </div></div>}
    </div>
  );
}
