import { usePermissions } from "../../../core/rbac/usePermissions";
/**
 * StudentsPage — canonical example of the standard page pattern.
 *
 * Pattern used by ALL data pages:
 *   1. useCrud()       — view/edit state + getById
 *   2. useSearch()     — search + pagination
 *   3. DataTable       — table rendering
 *   4. ViewDrawer      — view record
 *   5. EditModal       — edit record
 *   6. RowActions      — actions per row
 *   7. Pagination      — page controls
 */
import { useState, useEffect } from "react";
import { Plus, GraduationCap, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader, StatCard, SearchBar, DataTable, RowActions,
         ViewDrawer, EditModal, Pagination, StatusBadge, DocumentUploader } from "../../../components/ui";
import { useCrud, useSearch, useFormState } from "../../../core/hooks";
import { toItems } from "../../../core/utils";
import {
  useStudents, useCreateStudent,
  useUpdateStudent, useDeleteStudent, useStudentById,
  useCampuses, useAcademicYears, useClassSections,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

// ── Field definitions (single source of truth) ────────────────────────────────
const VIEW_FIELDS = [
  { key: "firstName",     label: "First name"                    },
  { key: "lastName",      label: "Last name"                     },
  { key: "studentNumber", label: "Student #"                     },
  { key: "gender",        label: "Gender"                        },
  { key: "dateOfBirth",   label: "Date of birth"                 },
  { key: "phone",         label: "Phone"                         },
  { key: "email",         label: "Email",      wide: true        },
  { key: "address",       label: "Address",    wide: true        },
  { key: "city",          label: "City"                          },
  { key: "province",      label: "Province"                      },
  { key: "country",       label: "Country"                       },
  { key: "status",        label: "Status"                        },
] as const;

const EDIT_FIELDS = [
  { key: "firstName",   label: "First name",   required: true                                                                                    },
  { key: "lastName",    label: "Last name",    required: true                                                                                    },
  { key: "gender",      label: "Gender",       type: "select" as const, options: [{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }, { value: "Other", label: "Other" }] },
  { key: "dateOfBirth", label: "Date of birth",type: "date"   as const                                                                          },
  { key: "phone",       label: "Phone",        type: "pk-phone" as const                                                                        },
  { key: "email",       label: "Email",        type: "pk-email" as const, wide: true                                                            },
  { key: "address",     label: "Address",      wide: true                                                                                        },
  { key: "city",        label: "City",         type: "pk-city" as const                                                                         },
  { key: "province",    label: "Province",     type: "pk-province" as const                                                                     },
  { key: "country",     label: "Country",      type: "pk-country" as const                                                                    },
  { key: "status",      label: "Status",       type: "select" as const, options: [{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }, { value: "ALUMNI", label: "Alumni" }] },
];

const INITIAL_FORM = {
  branchId: "", academicYearId: "", classSectionId: "",
  firstName: "", lastName: "", dateOfBirth: "", gender: "",
  admissionDate: new Date().toISOString().slice(0, 10),
};

// ── Page ──────────────────────────────────────────────────────────────────────
export function StudentsPage() {
  const perms = usePermissions();
  const canCreate = perms.can("students.create");
  const canEdit   = perms.can("students.edit");
  const canDelete = perms.can("students.delete");
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  // Data
  const { data, isLoading }     = useStudents();
  const { data: campusesData }  = useCampuses();
  const { data: yearsData }     = useAcademicYears();
  const { data: sectionsData }  = useClassSections();
  const createStudent           = useCreateStudent();
  const updStudent              = useUpdateStudent();
  const delStudent              = useDeleteStudent();

  const [students, setStudents] = useState<any[]>([]);
  useEffect(() => { setStudents(toItems(data)); }, [data]);

  const campuses = toItems(campusesData);
  const years    = toItems(yearsData);
  const sections = toItems(sectionsData);

  // View/Edit state (via useCrud — single hook replaces 8 lines)
  const crud = useCrud(useStudentById);

  // Search + pagination
  const { search, setSearch, page, setPage, paged, total } =
    useSearch(students, ["firstName", "lastName", "studentNumber"]);

  // Create wizard
  const [mode, setMode]           = useState<"list" | "new">("list");
  const [step, setStep]           = useState<1 | 2 | 3>(1);
  const [newStudentId, setNewId]  = useState("");
  const [docComplete, setDocComp] = useState(false);
  const { form, setField, reset, error, setError } = useFormState(INITIAL_FORM);

  const filteredSections = form.branchId
    ? sections.filter((s: any) => {
        try { return JSON.parse(s.metadataJson ?? "{}").campusId === form.branchId; }
        catch { return true; }
      })
    : sections;

  async function saveStep1() {
    if (!form.firstName || !form.branchId || !form.academicYearId || !form.classSectionId) {
      setError("Name, campus, academic year and class section are required");
      return;
    }
    setError("");
    try {
      const campus: any = campuses.find((c: any) => c.id === form.branchId);
      const res: any = await createStudent.mutateAsync({
        tenantId: tid, schoolId: campus?.schoolId ?? "",
        branchId: form.branchId, academicYearId: form.academicYearId,
        classSectionId: form.classSectionId, firstName: form.firstName,
        lastName: form.lastName || undefined, dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined, admissionDate: form.admissionDate,
      });
      setNewId(res?.id ?? `stu-mock-${Date.now()}`);
      setStep(2);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to save");
    }
  }

  function startNew() { setMode("new"); setStep(1); setNewId(""); setDocComp(false); reset(); }
  function backToList() { setMode("list"); }

  const byStatus = (s: string) => students.filter((x: any) => x.status === s).length;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Student registration with enrollment and document compliance"
        action={
          mode === "list"
            ? <button className="primary" onClick={startNew}><Plus size={14} /> Register student</button>
            : <button className="secondary" onClick={backToList}>← Back to list</button>
        }
      />

      {/* ── List view ─────────────────────────────────────────────────────── */}
      {mode === "list" && (
        <>
          <section className="metric-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Total students" value={String((data as any)?.totalCount ?? students.length)} note="" color="#2563EB" bg="#EFF6FF"><GraduationCap size={20} /></StatCard>
            <StatCard label="Active"         value={String(byStatus("ACTIVE"))}   note="" color="#10B981" bg="#ECFDF5"><CheckCircle2 size={20} /></StatCard>
            <StatCard label="Pending"        value={String(byStatus("PENDING"))}  note="" color="#D97706" bg="#FFFBEB"><AlertCircle  size={20} /></StatCard>
            <StatCard label="Guardians"      value="1,890"                         note="Linked" color="#8B5CF6" bg="#F5F3FF"><Users size={20} /></StatCard>
          </section>

          <div className="surface">
            <div className="surface-head">
              <SearchBar value={search} onChange={setSearch} placeholder="Search students…" />
            </div>

            <DataTable
              loading={isLoading}
              rows={paged}
              rowKey={r => r.id}
              emptyText="No students found."
              columns={[
                { key: "name",          label: "Name"                              },
                { key: "studentNumber", label: "Reg #"                             },
                { key: "gender",        label: "Gender"                            },
                { key: "dateOfBirth",   label: "Date of birth"                     },
                { key: "status",        label: "Status",  align: "center" as const },
              ]}
              renderCell={(col, row) => {
                if (col.key === "name") return (
                  <div className="person-cell">
                    <span className="row-avatar" style={{ background: "#EFF6FF", color: "#2563EB" }}>
                      {row.firstName?.[0]}{row.lastName?.[0] ?? ""}
                    </span>
                    <b>{row.firstName} {row.lastName ?? ""}</b>
                  </div>
                );
                if (col.key === "studentNumber") return <code style={{ fontSize: 11 }}>{row.studentNumber ?? "—"}</code>;
                if (col.key === "status")        return <StatusBadge status={row.status} />;
                return row[col.key] ?? "—";
              }}
              actions={row => (
                <RowActions
                  onView={() => crud.openView(row.id)}
                  onEdit={canEdit ? () => crud.openEdit(row.id) : undefined}
                  onDelete={canDelete ? () => delStudent.mutate(row.id) : undefined}
                  deleteLabel="student"
                />
              )}
            />

            <Pagination page={page} pageSize={25} total={total} onPage={setPage} label="students" />
          </div>
        </>
      )}

      {/* ── Registration wizard ───────────────────────────────────────────── */}
      {mode === "new" && (
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Step bar */}
          <div style={{ display: "flex", marginBottom: 20, border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden" }}>
            {[
              { n: 1, label: "Student & enrollment info" },
              { n: 2, label: "Upload required documents"  },
              { n: 3, label: "Review & complete"          },
            ].map((s, i) => (
              <div key={s.n} style={{
                flex: 1, padding: "12px 16px", textAlign: "center",
                background: step === s.n ? "#EEF2FF" : step > s.n ? "#ECFDF5" : "var(--surface)",
                borderRight: i < 2 ? "1px solid var(--line)" : "none",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: step === s.n ? "#6366F1" : step > s.n ? "#059669" : "var(--muted)" }}>
                  {step > s.n ? "✓" : `Step ${s.n}`}
                </div>
                <div style={{ fontSize: 12, marginTop: 2, color: step >= s.n ? "var(--text)" : "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="surface">
              <div className="surface-head"><h3>Student registration</h3></div>
              <div className="human-form">
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>Campus *</span>
                    <select value={form.branchId} onChange={setField("branchId")}>
                      <option value="">— Select campus —</option>
                      {campuses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Academic year *</span>
                    <select value={form.academicYearId} onChange={setField("academicYearId")}>
                      <option value="">— Select —</option>
                      {years.map((y: any) => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Class section *</span>
                    <select value={form.classSectionId} onChange={setField("classSectionId")}>
                      <option value="">— Select —</option>
                      {filteredSections.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Admission date</span>
                    <input type="date" value={form.admissionDate} onChange={setField("admissionDate")} />
                  </label>
                  <label className="human-field"><span>First name *</span>
                    <input value={form.firstName} onChange={setField("firstName")} />
                  </label>
                  <label className="human-field"><span>Last name</span>
                    <input value={form.lastName} onChange={setField("lastName")} />
                  </label>
                  <label className="human-field"><span>Date of birth</span>
                    <input type="date" value={form.dateOfBirth} onChange={setField("dateOfBirth")} />
                  </label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={setField("gender")}>
                      <option value="">—</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </label>
                </div>
                {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
              </div>
              <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <button className="secondary" onClick={backToList}>Cancel</button>
                <button className="primary" onClick={saveStep1} disabled={createStudent.isPending}>
                  {createStudent.isPending ? "Saving…" : "Next: Documents →"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="surface">
              <div className="surface-head"><h3>Required documents</h3></div>
              <div style={{ padding: "0 20px 20px" }}>
                <DocumentUploader
                  actorType="STUDENT" entityId={newStudentId}
                  tenantId={tid} onComplianceChange={setDocComp}
                  title="Student registration documents"
                />
              </div>
              <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="primary" onClick={() => setStep(3)}>
                  {docComplete ? "Next: Review →" : "Continue without all docs →"}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="surface">
              <div className="surface-head"><h3>Review & complete</h3></div>
              <div style={{ padding: "0 20px 20px" }}>
                {!docComplete && (
                  <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "#FFFBEB", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 14, fontSize: 12 }}>
                    <AlertCircle size={16} style={{ color: "#D97706", flexShrink: 0 }} />
                    <span>Some required documents are missing. The student will be saved as <b>PENDING</b> until all documents are submitted.</span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {[
                    ["Name",          `${form.firstName} ${form.lastName}`],
                    ["Campus",        campuses.find((c: any) => c.id === form.branchId)?.name ?? "—"],
                    ["Class section", filteredSections.find((s: any) => s.id === form.classSectionId)?.name ?? "—"],
                    ["Academic year", years.find((y: any) => y.id === form.academicYearId)?.name ?? "—"],
                    ["Documents",     docComplete ? "✓ Complete" : "⚠ Incomplete"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--surface-2)", fontSize: 12 }}>
                      <span style={{ width: 120, color: "var(--muted)", flexShrink: 0 }}>{l}</span>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="primary" onClick={backToList}>✓ Complete registration</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── View Drawer ───────────────────────────────────────────────────── */}
      {crud.viewId && crud.item && (
        <ViewDrawer
          title="Student"
          item={crud.item}
          fields={VIEW_FIELDS as any}
          onClose={crud.closeView}
          onEdit={crud.viewToEdit}
        />
      )}

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      {crud.editId && crud.item && (
        <EditModal
          title="Student"
          item={crud.item}
          fields={EDIT_FIELDS}
          onClose={crud.closeEdit}
          onSave={async data => {
            await updStudent.mutateAsync({ id: crud.editId!, body: data });
            crud.closeEdit();
          }}
        />
      )}
    </>
  );
}
