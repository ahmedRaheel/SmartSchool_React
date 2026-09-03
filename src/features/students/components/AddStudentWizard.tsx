import React from "react";
import { ChangeEvent, FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Upload, X } from "lucide-react";
import { CreateStudentRequest, studentsApi } from "../api/studentsApi";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { documentApi } from "../../documents/api/documentApi";

interface AddStudentWizardProps {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}

interface StudentFormState extends CreateStudentRequest {
  academicYearId: string;
  classSectionId: string;
  guardianName: string;
  guardianCnic: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  city: string;
  province: string;
  country: string;
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}

interface ReviewCardProps {
  title: string;
  lines: Array<string | undefined>;
}

const wizardSteps = [
  "Student information",
  "Academic placement",
  "Guardian & contact",
  "Documents",
  "Review",
] as const;

const genderOptions = ["", "Male", "Female", "Other"] as const;
const statusOptions = ["ACTIVE", "APPLICANT", "INACTIVE", "ALUMNI"] as const;

function createInitialForm(tenantId: string): StudentFormState {
  return {
    tenantId,
    schoolId: "",
    branchId: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    status: "PENDING_APPROVAL",
    academicYearId: "",
    classSectionId: "",
    guardianName: "",
    guardianCnic: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "", city: "", province: "", country: "Pakistan",
  };
}

export function AddStudentWizard({
  tenantId,
  onClose,
  onCreated,
}: AddStudentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<StudentFormState>(() =>
    createInitialForm(tenantId),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [guardianCnicFile, setGuardianCnicFile] = useState<File | null>(null);

  const isReviewStep = currentStep === wizardSteps.length - 1;

  function updateField(field: keyof StudentFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function canContinue() {
    if (currentStep === 0) return Boolean(form.firstName.trim());
    if (currentStep === 1) return Boolean(form.schoolId && form.branchId && form.academicYearId && form.classSectionId);
    if (currentStep === 2) return Boolean(form.guardianName.trim() && form.guardianCnic.trim() && form.guardianPhone.trim());
    if (currentStep === 3) return Boolean(photoFile && birthCertificateFile && identityFile && guardianCnicFile);
    return true;
  }

  function goBack() {
    if (currentStep === 0) {
      onClose();
      return;
    }

    setCurrentStep((step) => step - 1);
  }

  function goForward() {
    if (!canContinue()) {
      return;
    }

    setCurrentStep((step) => step + 1);
  }

  async function handlePhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setPhotoFile(selectedFile);
    setForm((current) => ({ ...current, photoFileName: selectedFile.name, photoContentType: selectedFile.type }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isReviewStep) {
      goForward();
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const student = await studentsApi.create(buildStudentRequest(form));
      const guardian = await studentsApi.createGuardian({ tenantId, fullName: form.guardianName.trim(), cnicNumber: form.guardianCnic.trim(), email: form.guardianEmail || null, phone: form.guardianPhone || null });
      await studentsApi.linkGuardian({ tenantId, studentId: student.id, guardianId: guardian.id, relationship: "GUARDIAN" });

      if (photoFile) {
        await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: "STUDENT", entityId: student.id, purpose: "PROFILE_PHOTO", category: "STUDENT", documentType: "PHOTO", title: "Student photograph", isPrimary: true, file: photoFile });
      }

      if (birthCertificateFile) await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: "STUDENT", entityId: student.id, purpose: "ADMISSION", category: "STUDENT", documentType: "BIRTH_CERTIFICATE", title: "Birth certificate", file: birthCertificateFile });
      if (identityFile) await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: "STUDENT", entityId: student.id, purpose: "ADMISSION", category: "STUDENT", documentType: "CNIC_BFORM", title: "CNIC / B-Form", file: identityFile });
      if (guardianCnicFile) await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: "GUARDIAN", entityId: guardian.id, purpose: "IDENTITY", category: "GUARDIAN", documentType: "CNIC", title: "Guardian CNIC", file: guardianCnicFile });

      // Enrollment is intentionally NOT created here. Backend creates it atomically when admission is approved.
      onCreated();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="workflow-overlay">
      <section className="workflow-dialog" role="dialog" aria-modal="true">
        <WizardHeader onClose={onClose} />
        <WizardProgress currentStep={currentStep} />

        <form onSubmit={handleSubmit}>
          <div className="workflow-body">
            {currentStep === 0 && (
              <StudentInformationStep form={form} onChange={updateField} />
            )}

            {currentStep === 1 && (
              <AcademicPlacementStep tenantId={tenantId} form={form} onChange={updateField} />
            )}

            {currentStep === 2 && (
              <GuardianStep form={form} onChange={updateField} />
            )}

            {currentStep === 3 && (
              <DocumentsStep
                fileName={form.photoFileName}
                onPhotoSelected={handlePhotoSelected}
                onBirthCertificateSelected={(e) => setBirthCertificateFile(e.target.files?.[0] ?? null)}
                onIdentitySelected={(e) => setIdentityFile(e.target.files?.[0] ?? null)}
                onGuardianCnicSelected={(e) => setGuardianCnicFile(e.target.files?.[0] ?? null)}
                birthCertificateName={birthCertificateFile?.name}
                identityName={identityFile?.name}
                guardianCnicName={guardianCnicFile?.name}
              />
            )}

            {currentStep === 4 && <ReviewStep form={form} />}

            {errorMessage && (
              <div className="form-error" role="alert">
                {errorMessage}
              </div>
            )}
          </div>

          <WizardFooter
            currentStep={currentStep}
            isSaving={isSaving}
            canContinue={canContinue()}
            onBack={goBack}
          />
        </form>
      </section>
    </div>
  );
}

function WizardHeader({ onClose }: { onClose: () => void }) {
  return (
    <header className="workflow-header">
      <div>
        <small>SMARTSCHOOL · ADMISSIONS</small>
        <h2>Add student</h2>
        <p>Create the student profile and academic placement in one guided workflow.</p>
      </div>

      <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
        <X />
      </button>
    </header>
  );
}

function WizardProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="wizard-steps">
      {wizardSteps.map((label, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        const className = [
          "wizard-step",
          isActive ? "active" : "",
          isComplete ? "done" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div className={className} key={label}>
            <span>{isComplete ? <Check size={14} /> : index + 1}</span>
            <b>{label}</b>
          </div>
        );
      })}
    </div>
  );
}

function StudentInformationStep({
  form,
  onChange,
}: {
  form: StudentFormState;
  onChange: (field: keyof StudentFormState, value: string) => void;
}) {
  return (
    <div className="form-grid">
      <TextField
        label="First name"
        required
        value={form.firstName}
        onChange={(value) => onChange("firstName", value)}
      />
      <TextField
        label="Last name"
        value={form.lastName ?? ""}
        onChange={(value) => onChange("lastName", value)}
      />
      <TextField
        label="Date of birth"
        type="date"
        value={form.dateOfBirth ?? ""}
        onChange={(value) => onChange("dateOfBirth", value)}
      />
      <SelectField
        label="Gender"
        value={form.gender ?? ""}
        options={genderOptions}
        onChange={(value) => onChange("gender", value)}
      />
      <TextField
        label="Admission date"
        type="date"
        value={form.admissionDate ?? ""}
        onChange={(value) => onChange("admissionDate", value)}
      />
      <SelectField
        label="Status"
        value={form.status}
        options={statusOptions}
        onChange={(value) => onChange("status", value)}
      />
    </div>
  );
}

function AcademicPlacementStep({
  tenantId,
  form,
  onChange,
}: {
  tenantId: string;
  form: StudentFormState;
  onChange: (field: keyof StudentFormState, value: string) => void;
}) {
  return (
    <div>
      <div className="callout">
        <b>Academic placement</b>
        <span>Select the academic year and class section for this enrollment.</span>
      </div>

      <div className="form-grid">
        <SchoolBranchSelector tenantId={tenantId} schoolId={form.schoolId} branchId={form.branchId} onSchoolChange={(value) => onChange("schoolId", value)} onBranchChange={(value) => onChange("branchId", value)} />
        <TextField
          label="Academic year"
          value={form.academicYearId}
          placeholder="Select academic year"
          onChange={(value) => onChange("academicYearId", value)}
        />
        <TextField
          label="Class / section"
          value={form.classSectionId}
          placeholder="Select class section"
          onChange={(value) => onChange("classSectionId", value)}
        />
      </div>
    </div>
  );
}

function GuardianStep({
  form,
  onChange,
}: {
  form: StudentFormState;
  onChange: (field: keyof StudentFormState, value: string) => void;
}) {
  return (
    <div className="form-grid">
      <TextField
        label="Guardian name"
        value={form.guardianName}
        onChange={(value) => onChange("guardianName", value)}
      />
      <TextField
        label="Guardian CNIC / national ID"
        value={form.guardianCnic}
        onChange={(value) => onChange("guardianCnic", value)}
        required
      />
      <TextField
        label="Guardian phone"
        value={form.guardianPhone}
        onChange={(value) => onChange("guardianPhone", value)}
      />
      <TextField
        label="Guardian email"
        type="email"
        value={form.guardianEmail}
        onChange={(value) => onChange("guardianEmail", value)}
      />
      <TextField
        label="Street address"
        value={form.address}
        onChange={(value) => onChange("address", value)}
      />
    </div>
  );
}

function DocumentsStep({ fileName, onPhotoSelected, onBirthCertificateSelected, onIdentitySelected, onGuardianCnicSelected, birthCertificateName, identityName, guardianCnicName }: {
  fileName?: string | null; onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  onBirthCertificateSelected: (event: ChangeEvent<HTMLInputElement>) => void; onIdentitySelected: (event: ChangeEvent<HTMLInputElement>) => void; onGuardianCnicSelected: (event: ChangeEvent<HTMLInputElement>) => void;
  birthCertificateName?: string; identityName?: string; guardianCnicName?: string;
}) {
  return (
    <div className="document-requirements-grid">
      <label className="upload-zone"><Upload /><b>Student photograph *</b><span>{fileName ?? "PNG or JPEG"}</span><input type="file" accept="image/png,image/jpeg" onChange={onPhotoSelected} /></label>
      <label className="upload-zone"><Upload /><b>Birth certificate *</b><span>{birthCertificateName ?? "PDF or image"}</span><input type="file" accept="image/*,.pdf" onChange={onBirthCertificateSelected} /></label>
      <label className="upload-zone"><Upload /><b>CNIC / B-Form *</b><span>{identityName ?? "PDF or image"}</span><input type="file" accept="image/*,.pdf" onChange={onIdentitySelected} /></label>
      <label className="upload-zone"><Upload /><b>Guardian CNIC *</b><span>{guardianCnicName ?? "PDF or image"}</span><input type="file" accept="image/*,.pdf" onChange={onGuardianCnicSelected} /></label>
    </div>
  );
}

function ReviewStep({ form }: { form: StudentFormState }) {
  const studentName = `${form.firstName} ${form.lastName ?? ""}`.trim();

  return (
    <div className="review-grid">
      <ReviewCard
        title="Student"
        lines={[
          studentName,
          "Student number will be assigned after admission approval",
          form.dateOfBirth || "Date of birth not supplied",
          form.gender || "Gender not supplied",
        ]}
      />
      <ReviewCard
        title="Placement"
        lines={[
          form.academicYearId || "Academic year not selected",
          form.classSectionId || "Class section not selected",
          form.admissionDate ?? "",
        ]}
      />
      <ReviewCard
        title="Guardian"
        lines={[
          form.guardianName || "Guardian not supplied",
          form.guardianPhone,
          form.guardianEmail,
        ]}
      />
    </div>
  );
}

function WizardFooter({
  currentStep,
  isSaving,
  canContinue,
  onBack,
}: {
  currentStep: number;
  isSaving: boolean;
  canContinue: boolean;
  onBack: () => void;
}) {
  const isReviewStep = currentStep === wizardSteps.length - 1;

  return (
    <footer className="workflow-footer">
      <button type="button" className="button secondary" onClick={onBack}>
        <ArrowLeft size={16} />
        {currentStep === 0 ? "Cancel" : "Back"}
      </button>

      <button className="button primary" disabled={isSaving || !canContinue}>
        {isSaving ? "Creating…" : isReviewStep ? "Create student" : "Continue"}
        {!isSaving && <ArrowRight size={16} />}
      </button>
    </footer>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: TextFieldProps) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || "Select"}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReviewCard({ title, lines }: ReviewCardProps) {
  return (
    <article className="review-card">
      <b>{title}</b>
      {lines.filter(Boolean).map((line, index) => (
        <span key={`${title}-${index}`}>{line}</span>
      ))}
    </article>
  );
}

function buildStudentRequest(form: StudentFormState): CreateStudentRequest {
  return {
    tenantId: form.tenantId,
    schoolId: form.schoolId,
    branchId: form.branchId,
    academicYearId: form.academicYearId,
    classSectionId: form.classSectionId,
    userId: form.userId,
    firstName: form.firstName.trim(),
    lastName: form.lastName?.trim() || null,
    dateOfBirth: form.dateOfBirth || null,
    gender: form.gender || null,
    photo: form.photo,
    photoContentType: form.photoContentType,
    photoFileName: form.photoFileName,
    admissionDate: form.admissionDate || null,
    status: form.status,
  };
}

async function convertFileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Student could not be created. Please try again.";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
