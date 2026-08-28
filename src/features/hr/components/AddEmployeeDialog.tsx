import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { lookupApi, LookupOption } from "../../../core/api/lookupApi";
import { CreateEmployeeRequest, hrApi } from "../api/hrApi";
import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { documentApi } from "../../documents/api/documentApi";

interface AddEmployeeDialogProps {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}

interface EmployeeFormState {
  schoolId: string;
  branchId: string;
  departmentId: string;
  firstName: string;
  lastName: string;
  cnicNumber: string;
  email: string;
  phone: string;
  hireDate: string;
  employmentTypeCode: string;
  staffType: string;
  alternatePhone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photo?: string;
  photoContentType?: string;
  photoFileName?: string;
}

const initialState: EmployeeFormState = {
  schoolId: "",
  branchId: "",
  departmentId: "",
  firstName: "",
  lastName: "",
  cnicNumber: "",
  email: "",
  phone: "",
  hireDate: new Date().toISOString().slice(0, 10),
  employmentTypeCode: "FULL_TIME",
  staffType: "TEACHER",
  alternatePhone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export function AddEmployeeDialog({
  tenantId,
  onClose,
  onCreated,
}: AddEmployeeDialogProps) {
  const [form, setForm] = useState<EmployeeFormState>(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState<LookupOption[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const loadEmploymentTypes = async () => {
      try {
        const values = await lookupApi.getValues("EMPLOYMENT_TYPE");
        setEmploymentTypes(values);

        if (values.length > 0 && !values.some((item) => item.code === form.employmentTypeCode)) {
          setForm((current) => ({ ...current, employmentTypeCode: values[0].code }));
        }
      } catch {
        // The API validator remains the source of truth. Keep the form usable if reference data is unavailable.
      }
    };

    void loadEmploymentTypes();
  }, []);

  useEffect(() => {
    if (!form.branchId) { setDepartments([]); return; }
    void import("../../../core/api/ApiClient").then(({ api }) => api.get<any>("/api/organization/department", { params: { tenantId, branchId: form.branchId, page: 1, pageSize: 250 } }).then(r => setDepartments(r.data?.items ?? r.data?.value?.items ?? r.data ?? [])).catch(() => setDepartments([])));
  }, [tenantId, form.branchId]);

  const updateField = (field: keyof EmployeeFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setPhotoFile(selectedFile);

    setForm((current) => ({
      ...current,
      photoContentType: selectedFile.type,
      photoFileName: selectedFile.name,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSaving(true);

    try {
      const request: CreateEmployeeRequest = {
        tenantId,
        schoolId: form.schoolId,
        branchId: form.branchId,
        departmentId: form.departmentId || undefined,
        firstName: form.firstName.trim(),
        lastName: optional(form.lastName),
        cnicNumber: optional(form.cnicNumber),
        email: optional(form.email),
        phone: optional(form.phone),
        hireDate: form.hireDate,
        employmentTypeCode: form.employmentTypeCode,
        staffType: form.staffType,
        alternatePhone: optional(form.alternatePhone),
        address: optional(form.address),
        emergencyContactName: optional(form.emergencyContactName),
        emergencyContactPhone: optional(form.emergencyContactPhone),
        photo: form.photo,
        photoContentType: form.photoContentType,
        photoFileName: form.photoFileName,
      };

      const employee = await hrApi.createEmployee(request);
      if (photoFile) {
        await documentApi.upload({ tenantId, schoolId: form.schoolId, branchId: form.branchId, entityType: "EMPLOYEE", entityId: employee.id, purpose: "PROFILE_PHOTO", category: "HR", documentType: "PHOTO", title: "Employee photograph", isPrimary: true, file: photoFile });
      }
      onCreated();
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="workflow-overlay">
      <section className="workflow-dialog" role="dialog" aria-modal="true">
        <header className="workflow-header">
          <div>
            <small>SMARTSCHOOL · PEOPLE & HR</small>
            <h2>Add employee</h2>
            <p>Create the employee's personal and employment profile.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="workflow-body">
            <div className="form-section">
              <div className="form-section-heading">
                <h3>Employment details</h3>
                <p>Information used to identify the employee in the school.</p>
              </div>

              <div className="form-grid">
                <SchoolBranchSelector tenantId={tenantId} schoolId={form.schoolId} branchId={form.branchId} onSchoolChange={(value) => updateField("schoolId", value)} onBranchChange={(value) => updateField("branchId", value)} />
                <SelectField label="Department" value={form.departmentId} onChange={(value) => updateField("departmentId", value)} options={departments.map((item:any) => [String(item.id ?? item.departmentId), String(item.name ?? item.code)])} placeholder="Select department" />
                <SelectField
                  label="Employment type"
                  value={form.employmentTypeCode}
                  onChange={(value) => updateField("employmentTypeCode", value)}
                  options={employmentTypes.map((item) => [item.code, item.name])}
                  placeholder="Select employment type"
                />
                <TextField
                  label="Hire date"
                  type="date"
                  value={form.hireDate}
                  onChange={(value) => updateField("hireDate", value)}
                  required
                />
                <SelectField label="Staff category" value={form.staffType} onChange={(value) => updateField("staffType", value)} options={[["TEACHER","Teacher"],["DRIVER","Driver"],["PRINCIPAL","Principal"],["ADMIN_OFFICER","Admin officer"],["ACCOUNTANT","Accountant"],["HR","HR staff"],["LIBRARIAN","Librarian"],["TRANSPORT","Transport staff"],["OTHER","Other non-teaching staff"]]} placeholder="Select staff category" />

              </div>
            </div>

            <div className="form-section">
              <div className="form-section-heading">
                <h3>Personal information</h3>
                <p>Basic identity and contact information.</p>
              </div>

              <div className="form-grid">
                <TextField
                  label="First name"
                  value={form.firstName}
                  onChange={(value) => updateField("firstName", value)}
                  required
                />
                <TextField
                  label="Last name"
                  value={form.lastName}
                  onChange={(value) => updateField("lastName", value)}
                />
                <TextField
                  label="CNIC / national ID"
                  value={form.cnicNumber}
                  onChange={(value) => updateField("cnicNumber", value)}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />
                <TextField
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(value) => updateField("phone", value)}
                />
              </div>
            </div>

            <div className="form-section-title"><b>Contact & emergency information</b></div><div className="human-form-grid"><TextField label="Alternate phone" value={form.alternatePhone} onChange={(value) => updateField("alternatePhone", value)} /><TextField label="Address" value={form.address} onChange={(value) => updateField("address", value)} /><TextField label="Emergency contact" value={form.emergencyContactName} onChange={(value) => updateField("emergencyContactName", value)} /><TextField label="Emergency phone" value={form.emergencyContactPhone} onChange={(value) => updateField("emergencyContactPhone", value)} /></div><label className="upload-zone">
              <Upload size={22} />
              <b>Employee photograph</b>
              <span>{form.photoFileName ?? "Upload a PNG or JPEG photograph."}</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handlePhotoChange}
              />
            </label>

            {errorMessage && <div className="form-error">{errorMessage}</div>}
          </div>

          <footer className="workflow-footer">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary" disabled={isSaving}>
              {isSaving ? "Creating employee…" : "Create employee"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: TextFieldProps) {
  return (
    <label className="field">
      <span>
        {label}
        {required && <em>*</em>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
  placeholder?: string;
}

function SelectField({ label, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function optional(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Employee could not be created. Please review the form and try again.";
}
