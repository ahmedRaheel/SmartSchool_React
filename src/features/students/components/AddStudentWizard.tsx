import { ChangeEvent, FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Upload, X } from "lucide-react";
import { CreateStudentRequest, studentsApi } from "../api/studentsApi";

interface AddStudentWizardProps {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}

interface StudentFormState extends CreateStudentRequest {
  academicYearId: string;
  classSectionId: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
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
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    admissionDate: new Date().toISOString().slice(0, 10),
    status: "PENDING_APPROVAL",
    academicYearId: "",
    classSectionId: "",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    address: "",
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

  const isReviewStep = currentStep === wizardSteps.length - 1;

  function updateField(field: keyof StudentFormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function canContinue() {
    if (currentStep !== 0) {
      return true;
    }

    return Boolean(form.firstName.trim());
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

    const photo = await convertFileToBase64(selectedFile);

    setForm((current) => ({
      ...current,
      photo,
      photoFileName: selectedFile.name,
      photoContentType: selectedFile.type,
    }));
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

      if (form.academicYearId && form.classSectionId) {
        await studentsApi.enroll({
          tenantId,
          studentId: student.id,
          academicYearId: form.academicYearId,
          classSectionId: form.classSectionId,
          enrollmentDate: form.admissionDate ?? today(),
          status: "PENDING_APPROVAL",
        });
      }

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
              <AcademicPlacementStep form={form} onChange={updateField} />
            )}

            {currentStep === 2 && (
              <GuardianStep form={form} onChange={updateField} />
            )}

            {currentStep === 3 && (
              <DocumentsStep
                fileName={form.photoFileName}
                onPhotoSelected={handlePhotoSelected}
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
  form,
  onChange,
}: {
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
        label="Residential address"
        value={form.address}
        onChange={(value) => onChange("address", value)}
      />
    </div>
  );
}

function DocumentsStep({
  fileName,
  onPhotoSelected,
}: {
  fileName?: string | null;
  onPhotoSelected: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="upload-zone">
      <Upload />
      <b>Student photograph</b>
      <span>{fileName ?? "Choose a PNG or JPEG photograph."}</span>
      <input type="file" accept="image/png,image/jpeg" onChange={onPhotoSelected} />
    </label>
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
