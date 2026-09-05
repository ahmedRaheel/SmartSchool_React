import { useEffect, useState } from "react";

import { SchoolBranchSelector } from "../../../components/forms/SchoolBranchSelector";
import { Modal } from "../../../components/ui/Modal";
import { PageHeader } from "../../../components/ui/PageHeader";
import { api } from "../../../core/api/ApiClient";
import { useAuth } from "../../auth/auth";
import { admissionsApi } from "../api/admissionsApi";

interface LookupItem {
    id: string;
    name: string;
}

interface AdmissionCriteria {
    id: string;
    minimumMarks: number;
    entranceTestMinimum?: number;
    interviewRequired: boolean;
    requiredDocuments?: string;
    status: string;
}

interface AdmissionCriteriaForm {
    schoolId: string;
    branchId: string;
    academicYearId: string;
    classId: string;
    minimumMarks: string;
    entranceTestMinimum: string;
    interviewRequired: boolean;
    requiredDocuments: string;
}

const initialForm: AdmissionCriteriaForm = {
    schoolId: "",
    branchId: "",
    academicYearId: "",
    classId: "",
    minimumMarks: "",
    entranceTestMinimum: "",
    interviewRequired: false,
    requiredDocuments: ""
};

function extractRows<T>(response: unknown): T[] {
    const result = response as {
        value?: T[] | { items?: T[] };
        items?: T[];
    };

    const value = result?.value ?? result;

    if (Array.isArray(value)) {
        return value;
    }

    return value?.items ?? [];
}

export function AdmissionCriteriaPage() {
    const { user } = useAuth();

    const tenantId = user?.roles.includes("SuperAdmin")
        ? sessionStorage.getItem("selected_tenant_id") ?? undefined
        : user?.tenantId;

    const [criteria, setCriteria] = useState<AdmissionCriteria[]>([]);
    const [academicYears, setAcademicYears] = useState<LookupItem[]>([]);
    const [classes, setClasses] = useState<LookupItem[]>([]);
    const [form, setForm] = useState<AdmissionCriteriaForm>(initialForm);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        void loadCriteria();
    }, [tenantId]);

    async function loadCriteria() {
        if (!tenantId) {
            setCriteria([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(undefined);

            const result = await admissionsApi.criteria(tenantId);

            setCriteria(extractRows<AdmissionCriteria>(result));
        } catch {
            setError("Unable to load the admission criteria.");
        } finally {
            setIsLoading(false);
        }
    }

    async function handleBranchChange(branchId: string) {
        setForm((currentForm) => ({
            ...currentForm,
            branchId,
            academicYearId: "",
            classId: ""
        }));

        setAcademicYears([]);
        setClasses([]);

        if (!branchId || !tenantId) {
            return;
        }

        try {
            setError(undefined);

            const commonParameters = {
                tenantId,
                branchId,
                page: 1,
                pageSize: 200
            };

            const [academicYearResponse, classResponse] = await Promise.all([
                api.get("/api/academics/academic-year", {
                    params: commonParameters
                }),
                api.get("/api/academics/grade-level", {
                    params: commonParameters
                })
            ]);

            setAcademicYears(
                extractRows<LookupItem>(academicYearResponse.data)
            );

            setClasses(
                extractRows<LookupItem>(classResponse.data)
            );
        } catch {
            setError(
                "Unable to load academic years and classes for this branch."
            );
        }
    }

    function handleSchoolChange(schoolId: string) {
        setForm((currentForm) => ({
            ...currentForm,
            schoolId,
            branchId: "",
            academicYearId: "",
            classId: ""
        }));

        setAcademicYears([]);
        setClasses([]);
    }

    function openCreateModal() {
        setForm(initialForm);
        setError(undefined);
        setIsModalOpen(true);
    }

    function closeModal() {
        if (isSaving) {
            return;
        }

        setIsModalOpen(false);
        setError(undefined);
    }

    async function saveCriteria() {
        if (!tenantId || !isFormValid) {
            return;
        }

        try {
            setIsSaving(true);
            setError(undefined);

            await admissionsApi.createCriteria({
                tenantId,
                schoolId: form.schoolId,
                branchId: form.branchId,
                academicYearId: form.academicYearId,
                classId: form.classId,
                minimumMarks: Number(form.minimumMarks),
                entranceTestMinimum: form.entranceTestMinimum
                    ? Number(form.entranceTestMinimum)
                    : undefined,
                interviewRequired: form.interviewRequired,
                requiredDocuments:
                    form.requiredDocuments.trim() || undefined
            });

            setIsModalOpen(false);
            setForm(initialForm);

            await loadCriteria();
        } catch {
            setError("Unable to save the admission criteria.");
        } finally {
            setIsSaving(false);
        }
    }

    const minimumMarks = Number(form.minimumMarks);
    const entranceTestMinimum = form.entranceTestMinimum
        ? Number(form.entranceTestMinimum)
        : undefined;

    const isFormValid =
        Boolean(form.schoolId) &&
        Boolean(form.branchId) &&
        Boolean(form.academicYearId) &&
        Boolean(form.classId) &&
        minimumMarks >= 0 &&
        minimumMarks <= 100 &&
        (entranceTestMinimum === undefined ||
            (entranceTestMinimum >= 0 && entranceTestMinimum <= 100));

    return (
        <>
            <PageHeader
                title="Admission Criteria"
                subtitle={
                    "Define eligibility by school, branch, academic year and class"
                }
                action={
                    <button
                        className="primary"
                        type="button"
                        disabled={!tenantId}
                        onClick={openCreateModal}
                    >
                        + Add criteria
                    </button>
                }
            />

            {error && !isModalOpen && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            <section className="surface data-surface">
                {isLoading ? (
                    <div className="empty-state">
                        Loading admission criteria...
                    </div>
                ) : criteria.length === 0 ? (
                    <div className="empty-state">
                        No admission criteria have been configured yet.
                    </div>
                ) : (
                    <div className="premium-table-wrap">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Minimum marks</th>
                                    <th>Entrance test</th>
                                    <th>Interview</th>
                                    <th>Required documents</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {criteria.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.minimumMarks}%</td>

                                        <td>
                                            {item.entranceTestMinimum != null
                                                ? `${item.entranceTestMinimum}%`
                                                : "Not required"}
                                        </td>

                                        <td>
                                            {item.interviewRequired
                                                ? "Required"
                                                : "Not required"}
                                        </td>

                                        <td>
                                            {item.requiredDocuments ||
                                                "No documents specified"}
                                        </td>

                                        <td>
                                            <span className="status-pill">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <Modal
                open={isModalOpen}
                title="Add admission criteria"
                onClose={closeModal}
            >
                <div className="human-form">
                    <SchoolBranchSelector
                        tenantId={tenantId ?? ""}
                        schoolId={form.schoolId}
                        branchId={form.branchId}
                        onSchoolChange={handleSchoolChange}
                        onBranchChange={(branchId) =>
                            void handleBranchChange(branchId)
                        }
                    />

                    <div className="human-form-grid">
                        <label className="human-field">
                            <span>Academic year</span>

                            <select
                                value={form.academicYearId}
                                disabled={!form.branchId}
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        academicYearId: event.target.value
                                    }))
                                }
                            >
                                <option value="">Select academic year</option>

                                {academicYears.map((year) => (
                                    <option key={year.id} value={year.id}>
                                        {year.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="human-field">
                            <span>Class</span>

                            <select
                                value={form.classId}
                                disabled={!form.branchId}
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        classId: event.target.value
                                    }))
                                }
                            >
                                <option value="">Select class</option>

                                {classes.map((schoolClass) => (
                                    <option
                                        key={schoolClass.id}
                                        value={schoolClass.id}
                                    >
                                        {schoolClass.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="human-field">
                            <span>Minimum previous marks (%)</span>

                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.minimumMarks}
                                placeholder="For example, 60"
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        minimumMarks: event.target.value
                                    }))
                                }
                            />
                        </label>

                        <label className="human-field">
                            <span>Entrance test marks (%)</span>

                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.entranceTestMinimum}
                                placeholder="Leave empty if not required"
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        entranceTestMinimum:
                                            event.target.value
                                    }))
                                }
                            />
                        </label>

                        <label className="human-field">
                            <span>Is an interview required?</span>

                            <select
                                value={String(form.interviewRequired)}
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        interviewRequired:
                                            event.target.value === "true"
                                    }))
                                }
                            >
                                <option value="false">No interview</option>
                                <option value="true">
                                    Interview required
                                </option>
                            </select>
                        </label>

                        <label className="human-field">
                            <span>Required documents</span>

                            <input
                                value={form.requiredDocuments}
                                placeholder="For example, result card and B-Form"
                                onChange={(event) =>
                                    setForm((currentForm) => ({
                                        ...currentForm,
                                        requiredDocuments: event.target.value
                                    }))
                                }
                            />
                        </label>
                    </div>
                </div>

                {error && (
                    <div className="error-message" role="alert">
                        {error}
                    </div>
                )}

                <div className="modal-actions">
                    <button
                        className="secondary"
                        type="button"
                        disabled={isSaving}
                        onClick={closeModal}
                    >
                        Cancel
                    </button>

                    <button
                        className="primary"
                        type="button"
                        disabled={!isFormValid || isSaving}
                        onClick={() => void saveCriteria()}
                    >
                        {isSaving ? "Saving..." : "Save criteria"}
                    </button>
                </div>
            </Modal>
        </>
    );
}