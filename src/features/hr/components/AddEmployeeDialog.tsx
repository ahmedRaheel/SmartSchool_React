import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, FileText, Plus, Trash2, Upload, X } from "lucide-react";
import { api } from "../../../core/api/ApiClient";
import { lookupApi, LookupOption } from "../../../core/api/lookupApi";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { documentApi, RequiredDocument } from "../../documents/api/documentApi";
import { CreateEmployeeRequest, hrApi } from "../api/hrApi";

interface AddEmployeeDialogProps {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}

type StaffType = "TEACHER" | "DRIVER" | "PRINCIPAL" | "ADMIN_OFFICER" | "ACCOUNTANT" | "HR" | "LIBRARIAN" | "TRANSPORT" | "OTHER";

type Education = { qualification: string; institute: string; fieldOfStudy: string; startDate: string; endDate: string; grade: string };
type Experience = { employer: string; jobTitle: string; startDate: string; endDate: string; responsibilities: string };

type EmployeeForm = {
  schoolId: string; branchId: string; departmentId: string; firstName: string; lastName: string;
  cnicNumber: string; email: string; phone: string; hireDate: string; employmentTypeCode: string;
  staffType: StaffType; alternatePhone: string; address: string; emergencyContactName: string; emergencyContactPhone: string;
};

const staffOptions: Array<[StaffType, string]> = [
  ["TEACHER", "Teacher"], ["ADMIN_OFFICER", "Admin officer"], ["DRIVER", "Driver"], ["PRINCIPAL", "Principal"],
  ["ACCOUNTANT", "Accountant"], ["HR", "HR staff"], ["LIBRARIAN", "Librarian"], ["TRANSPORT", "Transport staff"], ["OTHER", "Other staff"],
];

const emptyEducation: Education = { qualification: "", institute: "", fieldOfStudy: "", startDate: "", endDate: "", grade: "" };
const emptyExperience: Experience = { employer: "", jobTitle: "", startDate: "", endDate: "", responsibilities: "" };

export function AddEmployeeDialog({ tenantId, onClose, onCreated }: AddEmployeeDialogProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState<LookupOption[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<RequiredDocument[]>([]);
  const [documents, setDocuments] = useState<Record<string, File>>({});
  const [education, setEducation] = useState<Education[]>([{ ...emptyEducation }]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [form, setForm] = useState<EmployeeForm>({
    schoolId: "", branchId: "", departmentId: "", firstName: "", lastName: "", cnicNumber: "", email: "", phone: "",
    hireDate: new Date().toISOString().slice(0, 10), employmentTypeCode: "FULL_TIME", staffType: "TEACHER", alternatePhone: "",
    address: "", emergencyContactName: "", emergencyContactPhone: "",
  });

  const actorType = form.staffType === "TEACHER" ? "TEACHER" : form.staffType === "DRIVER" ? "DRIVER" : form.staffType === "ADMIN_OFFICER" ? "ADMIN_OFFICER" : "EMPLOYEE";
  const steps = useMemo(() => ["Role & placement", "Personal", "Contact", "Qualifications", "Documents", "Review"], []);

  useEffect(() => {
    void lookupApi.getValues("EMPLOYMENT_TYPE").then(setEmploymentTypes).catch(() => setEmploymentTypes([]));
  }, []);

  useEffect(() => {
    if (!form.branchId) { setDepartments([]); return; }
    void api.get<any>("/api/organization/department", { params: { tenantId, branchId: form.branchId, page: 1, pageSize: 250 } })
      .then((r) => setDepartments(r.data?.items ?? r.data?.value?.items ?? r.data ?? []))
      .catch(() => setDepartments([]));
  }, [tenantId, form.branchId]);

  useEffect(() => {
    void documentApi.requirements(tenantId, actorType, form.staffType).then(setRequirements).catch(() => setRequirements([]));
  }, [tenantId, actorType, form.staffType]);

  const set = (name: keyof EmployeeForm, value: string) => setForm((current) => ({ ...current, [name]: value }));
  const requiredDocuments = requirements.filter((item) => item.isRequired && (!item.conditionCode || item.conditionCode !== "EXPERIENCE_PRESENT" || experience.length > 0));

  function validateCurrentStep(): string | null {
    if (step === 0 && (!form.schoolId || !form.branchId || !form.staffType || !form.employmentTypeCode || !form.hireDate)) return "School, branch, staff category, employment type and hire date are required.";
    if (step === 1 && (!form.firstName.trim() || !form.cnicNumber.trim())) return "First name and CNIC / national ID are required.";
    if (step === 2 && (!form.phone.trim() || !form.address.trim() || !form.emergencyContactName.trim() || !form.emergencyContactPhone.trim())) return "Primary phone, address and emergency contact are required.";
    if (step === 3 && form.staffType === "TEACHER" && !education.some((x) => x.qualification.trim())) return "At least one education / qualification record is required for a teacher.";
    if (step === 4) {
      const missing = requiredDocuments.filter((r) => !documents[r.documentType]);
      if (missing.length) return `Upload required documents: ${missing.map((x) => x.displayName).join(", ")}.`;
    }
    return null;
  }

  function next() {
    const message = validateCurrentStep();
    if (message) { setError(message); return; }
    setError("");
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = validateCurrentStep();
    if (message) { setError(message); return; }
    setSaving(true);
    setError("");
    try {
      const request: CreateEmployeeRequest = {
        tenantId, schoolId: form.schoolId, branchId: form.branchId, departmentId: form.departmentId || undefined,
        firstName: form.firstName.trim(), lastName: form.lastName.trim() || undefined, cnicNumber: form.cnicNumber.trim(),
        email: form.email.trim() || undefined, phone: form.phone.trim(), alternatePhone: form.alternatePhone.trim() || undefined,
        address: form.address.trim(), emergencyContactName: form.emergencyContactName.trim(), emergencyContactPhone: form.emergencyContactPhone.trim(),
        hireDate: form.hireDate, employmentTypeCode: form.employmentTypeCode, staffType: form.staffType, status: "SUBMITTED",
      };
      const employee = await hrApi.createEmployee(request);
      for (const row of education.filter((x) => x.qualification.trim())) await hrApi.addEducation(employee.id, tenantId, row);
      for (const row of experience.filter((x) => x.employer.trim() && x.jobTitle.trim() && x.startDate)) await hrApi.addExperience(employee.id, tenantId, row);
      for (const requirement of requirements) {
        const file = documents[requirement.documentType];
        if (!file) continue;
        await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: actorType, entityId: employee.id, purpose: "ONBOARDING", category: "HR", documentType: requirement.documentType, title: requirement.displayName, file });
      }
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.error?.message ?? e?.response?.data?.message ?? e?.message ?? "Employee could not be created.");
    } finally { setSaving(false); }
  }

  return <div className="workflow-overlay"><section className="workflow-dialog actor-wizard" role="dialog" aria-modal="true">
    <header className="workflow-header"><div><small>SMARTSCHOOL · ACTOR ONBOARDING</small><h2>Add {staffOptions.find((x) => x[0] === form.staffType)?.[1]}</h2><p>Complete identity, placement, qualifications and required documents before submission.</p></div><button className="icon-button" onClick={onClose}><X size={20}/></button></header>
    <div className="wizard-progress">{steps.map((label, index) => <div className={`wizard-step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`} key={label}><span>{index < step ? <Check size={14}/> : index + 1}</span><b>{label}</b></div>)}</div>
    <form onSubmit={submit}><div className="workflow-body">
      {step === 0 && <Section title="Role & school placement" text="Choose exactly which actor is being created and where they work."><div className="form-grid"><Select label="Actor / staff category *" value={form.staffType} onChange={(v) => set("staffType", v)} options={staffOptions}/><SchoolBranchSelector tenantId={tenantId} schoolId={form.schoolId} branchId={form.branchId} onSchoolChange={(v) => set("schoolId", v)} onBranchChange={(v) => set("branchId", v)}/><Select label="Department" value={form.departmentId} onChange={(v) => set("departmentId", v)} options={departments.map((x) => [String(x.id ?? x.departmentId), String(x.name ?? x.code)])}/><Select label="Employment type *" value={form.employmentTypeCode} onChange={(v) => set("employmentTypeCode", v)} options={employmentTypes.map((x) => [x.code, x.name])}/><Field label="Hire date *" type="date" value={form.hireDate} onChange={(v) => set("hireDate", v)}/></div></Section>}
      {step === 1 && <Section title="Personal information" text="Identity information used for HR verification and account provisioning."><div className="form-grid"><Field label="First name *" value={form.firstName} onChange={(v) => set("firstName", v)}/><Field label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)}/><Field label="CNIC / national ID *" value={form.cnicNumber} onChange={(v) => set("cnicNumber", v)}/><Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)}/></div></Section>}
      {step === 2 && <Section title="Contact & emergency information" text="A complete contact profile is required before the actor can be approved."><div className="form-grid"><Field label="Primary phone *" value={form.phone} onChange={(v) => set("phone", v)}/><Field label="Alternate phone" value={form.alternatePhone} onChange={(v) => set("alternatePhone", v)}/><Field label="Address *" value={form.address} onChange={(v) => set("address", v)}/><Field label="Emergency contact *" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)}/><Field label="Emergency phone *" value={form.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)}/></div></Section>}
      {step === 3 && <><RepeatSection title="Education / qualifications" rows={education} setRows={setEducation} empty={emptyEducation} fields={["qualification","institute","fieldOfStudy","grade"]}/><RepeatSection title="Experience" rows={experience} setRows={setExperience} empty={emptyExperience} fields={["employer","jobTitle","startDate","endDate"]} dateFields={["startDate","endDate"]}/></>}
      {step === 4 && <Section title="Required documents" text="Requirements come from document.required_document; the wizard does not hard-code approval policy."><div className="document-requirement-grid">{requirements.map((r) => <label className={`document-requirement ${documents[r.documentType] ? "uploaded" : ""}`} key={r.id}><FileText size={20}/><div><b>{r.displayName}{r.isRequired ? " *" : ""}</b><span>{documents[r.documentType]?.name ?? "Choose file"}</span></div><Upload size={18}/><input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(file)setDocuments((d)=>({...d,[r.documentType]:file})); }}/></label>)}</div></Section>}
      {step === 5 && <Section title="Review & submit" text="The actor remains SUBMITTED until backend approval gates verify documents and business rules."><div className="review-grid"><Review label="Actor" value={staffOptions.find((x)=>x[0]===form.staffType)?.[1]}/><Review label="Name" value={`${form.firstName} ${form.lastName}`.trim()}/><Review label="CNIC" value={form.cnicNumber}/><Review label="Phone" value={form.phone}/><Review label="Education" value={`${education.filter(x=>x.qualification).length} record(s)`}/><Review label="Experience" value={`${experience.filter(x=>x.employer).length} record(s)`}/><Review label="Documents" value={`${Object.keys(documents).length} uploaded`}/></div></Section>}
      {error && <div className="form-error wizard-error">{error}</div>}
    </div><footer className="workflow-footer"><button type="button" className="button secondary" onClick={step === 0 ? onClose : () => {setError("");setStep(step-1);}}>{step === 0 ? "Cancel" : <><ChevronLeft size={16}/> Back</>}</button>{step < steps.length-1 ? <button type="button" className="button primary" onClick={next}>Continue <ChevronRight size={16}/></button> : <button type="submit" className="button primary" disabled={saving}>{saving ? "Creating…" : "Submit actor"}</button>}</footer></form>
  </section></div>;
}

function Section({title,text,children}:{title:string;text:string;children:any}) { return <div className="form-section"><div className="form-section-heading"><h3>{title}</h3><p>{text}</p></div>{children}</div>; }
function Field({label,value,onChange,type="text"}:{label:string;value:string;onChange:(v:string)=>void;type?:string}) { return <label className="human-field"><span>{label}</span><input type={type} value={value} onChange={(e)=>onChange(e.target.value)}/></label>; }
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:Array<[string,string]>}) { return <label className="human-field"><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}><option value="">Select</option>{options.map(([v,n])=><option value={v} key={v}>{n}</option>)}</select></label>; }
function Review({label,value}:{label:string;value:any}) { return <div className="review-item"><span>{label}</span><b>{value || "—"}</b></div>; }
function RepeatSection<T extends Record<string,string>>({title,rows,setRows,empty,fields,dateFields=[]}:{title:string;rows:T[];setRows:(v:T[])=>void;empty:T;fields:Array<keyof T>;dateFields?:Array<keyof T>}) { return <Section title={title} text={`Add zero or more ${title.toLowerCase()} records. Teacher education is mandatory.`}><button type="button" className="button secondary compact" onClick={()=>setRows([...rows,{...empty}])}><Plus size={14}/> Add</button>{rows.map((row,index)=><div className="repeat-row" key={index}>{fields.map((field)=><Field key={String(field)} label={String(field).replace(/([A-Z])/g," $1")} type={dateFields.includes(field)?"date":"text"} value={row[field]} onChange={(v)=>setRows(rows.map((x,i)=>i===index?{...x,[field]:v}:x))}/>) }<button type="button" className="icon-button danger" onClick={()=>setRows(rows.filter((_,i)=>i!==index))}><Trash2 size={16}/></button></div>)}</Section>; }
