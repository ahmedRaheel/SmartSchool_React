/**
 * SmartSchool Real API Client
 * Every function maps exactly to a backend endpoint.
 * MetadataJson modules serialize domain fields in/out transparently.
 */
import { api } from "./ApiClient";
import {
  toMetaJson, fromMetaJson,
  type PagedResult, type MetaEntity,
  type AdminDashboard, type StudentDashboard, type TeacherDashboard,
  type ParentDashboard, type DriverDashboard, type ExaminerDashboard,
  type StudentListItem, type CreateStudentRequest, type CreateEnrollmentRequest,
  type EmployeeListItem, type CreateEmployeeRequest,
  type CreateSchoolRequest, type SchoolListItem,
  type CreateCampusRequest, type CampusListItem,
  type CreateDepartmentRequest, type DepartmentListItem,
  type CreateAcademicYearRequest, type CreateGradeLevelRequest,
  type CreateClassSectionRequest, type CreateSubjectRequest,
  type CreateTenantRequest, type TenantListItem,
  type InvoiceMeta, type PaymentMeta, type FeeTypeMeta, type FeeStructureMeta,
  type InquiryMeta, type BookMeta, type LoanMeta, type ExamMeta,
  type VehicleMeta, type RouteMeta, type PayrollRunMeta, type PayslipMeta,
  type ModelConfigMeta, type KnowledgeCollectionMeta,
  type NotificationItem, type ChatConversation, type ChatMessage,
  type LookupValue, type AskResponse, type TutorSession, type TutorAnswer,
  type GeneratedQuiz, type PredictionResult} from "./backendContract";

// ─── Dashboard ─────────────────────────────────────────────────────────────
export const dashboardApi = {
  admin: (tenantId?: string) =>
    api.get<AdminDashboard>("/api/dashboard/admin", { params: { tenantId } }),
  student: (studentId: string, tenantId: string) =>
    api.get<StudentDashboard>(`/api/dashboard/student/${studentId}`, { params: { tenantId } }),
  teacher: (employeeId: string, tenantId: string) =>
    api.get<TeacherDashboard>(`/api/dashboard/teacher/${employeeId}`, { params: { tenantId } }),
  parent: (guardianId: string, tenantId: string) =>
    api.get<ParentDashboard>(`/api/dashboard/parent/${guardianId}`, { params: { tenantId } }),
  driver: (driverId: string, tenantId: string) =>
    api.get<DriverDashboard>(`/api/dashboard/driver/${driverId}`, { params: { tenantId } }),
  examiner: (tenantId: string) =>
    api.get<ExaminerDashboard>("/api/dashboard/examiner", { params: { tenantId } }),
};

// ─── Students ────────────────────────────────────────────────────────────────
export const studentsApi = {
  page: (tenantId: string, page = 1, pageSize = 25) =>
    api.get<PagedResult<StudentListItem>>("/api/students/student", {
      params: { tenantId, page, pageSize },
    }),
  byId: (id: string, tenantId: string) =>
    api.get<StudentListItem>(`/api/students/student/${id}`, { params: { tenantId } }),
  create: (req: CreateStudentRequest) =>
    api.post<StudentListItem>("/api/students/student", req),
  update: (id: string, req: Partial<CreateStudentRequest>) =>
    api.put(`/api/students/student/${id}`, req),
  enroll: (req: CreateEnrollmentRequest) =>
    api.post("/api/students/enrollment", req),
  linkGuardian: (body: { TenantId: string; StudentId: string; GuardianId: string }) =>
    api.post("/api/students/student-guardian/link", body),
};

// ─── HR / Employees ──────────────────────────────────────────────────────────
export const hrApi = {
  page: (tenantId: string, page = 1, pageSize = 25) =>
    api.get<PagedResult<EmployeeListItem>>("/api/hr/employee", {
      params: { tenantId, page, pageSize },
    }),
  byId: (id: string, tenantId: string) =>
    api.get<EmployeeListItem>(`/api/hr/employee/${id}`, { params: { tenantId } }),
  create: (req: CreateEmployeeRequest) =>
    api.post<EmployeeListItem>("/api/hr/employee", req),
  update: (id: string, req: Partial<CreateEmployeeRequest>) =>
    api.put(`/api/hr/employee/${id}`, req),
  terminate: (id: string, body: { TenantId: string; Reason?: string }) =>
    api.post(`/api/hr/employee/${id}/terminate`, body),
};

// ─── Organization ─────────────────────────────────────────────────────────────
export const organizationApi = {
  schools: (tenantId: string) =>
    api.get<PagedResult<SchoolListItem>>("/api/organization/school", {
      params: { tenantId, page: 1, pageSize: 200 },
    }),
  createSchool: (req: CreateSchoolRequest) =>
    api.post<SchoolListItem>("/api/organization/school", req),
  updateSchool: (id: string, req: Partial<CreateSchoolRequest>) =>
    api.put(`/api/organization/school/${id}`, req),

  campuses: (tenantId: string, schoolId?: string) =>
    api.get<PagedResult<CampusListItem>>("/api/organization/branch", {
      params: { tenantId, schoolId, page: 1, pageSize: 200 },
    }),
  createCampus: (req: CreateCampusRequest) =>
    api.post<CampusListItem>("/api/organization/branch", req),

  departments: (tenantId: string, campusId?: string) =>
    api.get<PagedResult<DepartmentListItem>>("/api/organization/department", {
      params: { tenantId, campusId, page: 1, pageSize: 200 },
    }),
  createDepartment: (req: CreateDepartmentRequest) =>
    api.post<DepartmentListItem>("/api/organization/department", req),
  deleteDepartment: (id: string, tenantId: string) =>
    api.delete(`/api/organization/department/${id}`, { params: { tenantId } }),

  // Lookup data for campus creation
  branchGenderTypes: (tenantId: string) =>
    api.get<LookupValue[]>("/api/lookups/BRANCH_GENDER_TYPE", { params: { tenantId } }),
  educationLevels: (tenantId: string) =>
    api.get<LookupValue[]>("/api/lookups/EDUCATION_LEVEL", { params: { tenantId } }),
};

// ─── Academics ────────────────────────────────────────────────────────────────
export const academicsApi = {
  academicYears: (tenantId: string, campusId?: string) =>
    api.get<PagedResult<MetaEntity>>("/api/academics/academic-year", {
      params: { tenantId, campusId, page: 1, pageSize: 200 },
    }),
  createAcademicYear: (req: CreateAcademicYearRequest) =>
    api.post<MetaEntity>("/api/academics/academic-year", req),
  deleteAcademicYear: (id: string, tenantId: string) =>
    api.delete(`/api/academics/academic-year/${id}`, { params: { tenantId } }),

  gradeLevels: (tenantId: string, campusId?: string) =>
    api.get<PagedResult<MetaEntity>>("/api/academics/grade-level", {
      params: { tenantId, campusId, page: 1, pageSize: 200 },
    }),
  createGradeLevel: (req: CreateGradeLevelRequest) =>
    api.post<MetaEntity>("/api/academics/grade-level", req),
  deleteGradeLevel: (id: string, tenantId: string) =>
    api.delete(`/api/academics/grade-level/${id}`, { params: { tenantId } }),

  classSections: (tenantId: string, campusId?: string) =>
    api.get<PagedResult<MetaEntity>>("/api/academics/class-section", {
      params: { tenantId, campusId, page: 1, pageSize: 200 },
    }),
  createClassSection: (req: CreateClassSectionRequest) =>
    api.post<MetaEntity>("/api/academics/class-section", req),
  deleteClassSection: (id: string, tenantId: string) =>
    api.delete(`/api/academics/class-section/${id}`, { params: { tenantId } }),

  subjects: (tenantId: string, branchId?: string) =>
    api.get<PagedResult<MetaEntity>>("/api/academics/subject", {
      params: { tenantId, branchId, page: 1, pageSize: 200 },
    }),
  createSubject: (req: CreateSubjectRequest) =>
    api.post<MetaEntity>("/api/academics/subject", req),
  deleteSubject: (id: string, tenantId: string) =>
    api.delete(`/api/academics/subject/${id}`, { params: { tenantId } }),
};

// ─── Finance (MetadataJson) ───────────────────────────────────────────────────
// Domain fields go into MetadataJson. Helper builds the request body.
export const financeApi = {
  invoices: (tenantId: string, page = 1, pageSize = 25) =>
    api.get<PagedResult<MetaEntity>>("/api/finance/student-invoice", {
      params: { tenantId, page, pageSize },
    }),
  createInvoice: (tenantId: string, meta: InvoiceMeta) =>
    api.post<MetaEntity>("/api/finance/student-invoice", {
      TenantId: tenantId,
      Name: `Invoice — ${meta.studentName ?? meta.studentId}`,
      MetadataJson: toMetaJson(meta),
    }),
  updateInvoice: (id: string, tenantId: string, meta: Partial<InvoiceMeta>) =>
    api.put(`/api/finance/student-invoice/${id}`, {
      TenantId: tenantId,
      Name: `Invoice`,
      MetadataJson: toMetaJson(meta),
    }),

  payments: (tenantId: string, page = 1) =>
    api.get<PagedResult<MetaEntity>>("/api/finance/payment", {
      params: { tenantId, page, pageSize: 50 },
    }),
  recordPayment: (tenantId: string, meta: PaymentMeta) =>
    api.post<MetaEntity>("/api/finance/payment", {
      TenantId: tenantId,
      Name: `Payment — ${meta.amount} via ${meta.paymentMethod}`,
      MetadataJson: toMetaJson(meta),
    }),

  feeTypes: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/finance/fee-type", {
      params: { tenantId, page: 1, pageSize: 200 },
    }),
  createFeeType: (tenantId: string, name: string, meta: FeeTypeMeta) =>
    api.post<MetaEntity>("/api/finance/fee-type", {
      TenantId: tenantId,
      Name: name,
      MetadataJson: toMetaJson(meta),
    }),
  deleteFeeType: (id: string, tenantId: string) =>
    api.delete(`/api/finance/fee-type/${id}`, { params: { tenantId } }),

  feeStructures: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/finance/fee-structure", {
      params: { tenantId, page: 1, pageSize: 200 },
    }),
  createFeeStructure: (tenantId: string, name: string, meta: FeeStructureMeta) =>
    api.post<MetaEntity>("/api/finance/fee-structure", {
      TenantId: tenantId,
      Name: name,
      MetadataJson: toMetaJson(meta),
    }),
};

// ─── Admissions (MetadataJson) ────────────────────────────────────────────────
export const admissionsApi = {
  inquiries: (tenantId: string, page = 1, pageSize = 25) =>
    api.get<PagedResult<MetaEntity>>("/api/admissions/admission-inquiry", {
      params: { tenantId, page, pageSize },
    }),
  createInquiry: (tenantId: string, meta: InquiryMeta) =>
    api.post<MetaEntity>("/api/admissions/admission-inquiry", {
      TenantId: tenantId,
      Name: `${meta.applicantFirstName} ${meta.applicantLastName ?? ""}`.trim(),
      MetadataJson: toMetaJson(meta),
    }),
  updateInquiry: (id: string, tenantId: string, meta: Partial<InquiryMeta>) =>
    api.put(`/api/admissions/admission-inquiry/${id}`, {
      TenantId: tenantId,
      Name: `${meta.applicantFirstName ?? ""} ${meta.applicantLastName ?? ""}`.trim(),
      MetadataJson: toMetaJson(meta),
    }),
};

// ─── Library (MetadataJson) ───────────────────────────────────────────────────
export const libraryApi = {
  books: (tenantId: string, page = 1, pageSize = 50) =>
    api.get<PagedResult<MetaEntity>>("/api/library/library-item", {
      params: { tenantId, page, pageSize },
    }),
  createBook: (tenantId: string, meta: BookMeta) =>
    api.post<MetaEntity>("/api/library/library-item", {
      TenantId: tenantId,
      Name: meta.title,
      MetadataJson: toMetaJson(meta),
    }),

  loans: (tenantId: string, page = 1) =>
    api.get<PagedResult<MetaEntity>>("/api/library/item-loan", {
      params: { tenantId, page, pageSize: 50 },
    }),
  createLoan: (tenantId: string, meta: LoanMeta) =>
    api.post<MetaEntity>("/api/library/item-loan", {
      TenantId: tenantId,
      Name: `Loan — ${meta.bookTitle ?? meta.bookCopyId}`,
      MetadataJson: toMetaJson(meta),
    }),
  returnLoan: (id: string, tenantId: string) =>
    api.put(`/api/library/item-loan/${id}/return`, { TenantId: tenantId }),
};

// ─── Examinations (MetadataJson) ──────────────────────────────────────────────
export const examsApi = {
  exams: (tenantId: string, page = 1) =>
    api.get<PagedResult<MetaEntity>>("/api/examinations/exam", {
      params: { tenantId, page, pageSize: 50 },
    }),
  createExam: (tenantId: string, name: string, meta: ExamMeta) =>
    api.post<MetaEntity>("/api/examinations/exam", {
      TenantId: tenantId,
      Name: name,
      MetadataJson: toMetaJson(meta),
    }),
  results: (tenantId: string, examId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/examinations/student-exam-result", {
      params: { tenantId, examId },
    }),
};

// ─── Transport (MetadataJson) ─────────────────────────────────────────────────
export const transportApi = {
  vehicles: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/transport/vehicle", {
      params: { tenantId, page: 1, pageSize: 100 },
    }),
  createVehicle: (tenantId: string, meta: VehicleMeta) =>
    api.post<MetaEntity>("/api/transport/vehicle", {
      TenantId: tenantId,
      Name: `${meta.registrationNumber ?? "Vehicle"} — ${meta.make ?? ""} ${meta.model ?? ""}`.trim(),
      MetadataJson: toMetaJson(meta),
    }),

  routes: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/transport/route", {
      params: { tenantId, page: 1, pageSize: 100 },
    }),
  createRoute: (tenantId: string, name: string, meta: RouteMeta) =>
    api.post<MetaEntity>("/api/transport/route", {
      TenantId: tenantId,
      Name: name,
      MetadataJson: toMetaJson(meta),
    }),

  drivers: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/transport/driver", {
      params: { tenantId, page: 1, pageSize: 100 },
    }),
};

// ─── Payroll (MetadataJson) ───────────────────────────────────────────────────
export const payrollApi = {
  runs: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/payroll/payroll-run", {
      params: { tenantId, page: 1, pageSize: 50 },
    }),
  createRun: (tenantId: string, name: string, meta: PayrollRunMeta) =>
    api.post<MetaEntity>("/api/payroll/payroll-run", {
      TenantId: tenantId, Name: name, MetadataJson: toMetaJson(meta),
    }),

  payslips: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/payroll/payslip", {
      params: { tenantId, page: 1, pageSize: 100 },
    }),
};

// ─── AI Core (MetadataJson) ───────────────────────────────────────────────────
export const aiCoreApi = {
  modelConfigs: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/aicore/model-configuration", {
      params: { tenantId, page: 1, pageSize: 50 },
    }),
  createModelConfig: (tenantId: string, name: string, meta: ModelConfigMeta) =>
    api.post<MetaEntity>("/api/aicore/model-configuration", {
      TenantId: tenantId, Name: name, MetadataJson: toMetaJson(meta),
    }),

  collections: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/aicore/knowledge-collection", {
      params: { tenantId, page: 1, pageSize: 50 },
    }),
  createCollection: (tenantId: string, name: string, meta: KnowledgeCollectionMeta) =>
    api.post<MetaEntity>("/api/aicore/knowledge-collection", {
      TenantId: tenantId, Name: name, MetadataJson: toMetaJson(meta),
    }),

  documents: (tenantId: string, collectionId?: string) =>
    api.get<PagedResult<MetaEntity>>("/api/aicore/knowledge-document", {
      params: { tenantId, collectionId, page: 1, pageSize: 50 },
    }),
  uploadDocument: (tenantId: string, collectionId: string, name: string, meta: object) =>
    api.post<MetaEntity>("/api/aicore/knowledge-document", {
      TenantId: tenantId, Name: name, MetadataJson: toMetaJson({ collectionId, ...meta }),
    }),
  indexKnowledge: (tenantId: string, collectionId: string) =>
    api.post("/api/aicore/knowledge/index", { TenantId: tenantId, CollectionId: collectionId }),

  promptTemplates: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/aicore/prompt-template", {
      params: { tenantId, page: 1, pageSize: 50 },
    }),
  executionLogs: (tenantId: string) =>
    api.get<PagedResult<MetaEntity>>("/api/aicore/ai-execution-log", {
      params: { tenantId, page: 1, pageSize: 50 },
    }),
};

// ─── AI Assistant / RAG / Tutor / Prediction ──────────────────────────────────
export const aiApi = {
  ask: (body: { TenantId?: string; Question: string; SchoolId?: string; Assistant?: string; Collections?: string[] }) =>
    api.post<AskResponse>("/api/ai/assistant/ask", body),

  chatbot: (bot: "student" | "teacher" | "parent" | "admissions" | "admin", body: {
    TenantId?: string; Question: string; SchoolId?: string;
  }) => api.post<AskResponse>(`/api/chatbots/${bot}/ask`, body),
};

export const aiTutorApi = {
  start: (body: { TenantId?: string; StudentId: string; Subject: string; Topic?: string }) =>
    api.post<TutorSession>("/api/aitutor/operations/sessions", body),
  ask: (body: { TenantId?: string; SessionId: string; StudentId: string; Subject: string; Topic: string; Message: string }) =>
    api.post<TutorAnswer>("/api/aitutor/operations/ask", body),
  generateQuiz: (body: { TenantId?: string; StudentId: string; Subject: string; Topic: string; QuestionCount?: number; Difficulty?: string }) =>
    api.post<GeneratedQuiz>("/api/aitutor/operations/quizzes/generate", body),
  recommend: (body: { TenantId?: string; StudentId: string; Subject: string; Topic: string; MasteryScore: number }) =>
    api.post("/api/aitutor/operations/recommendations/generate", body),
};

export const predictionApi = {
  student: (kind: string, body: { TenantId: string; StudentId: string; [k: string]: unknown }) =>
    api.post<PredictionResult>(`/api/aiprediction/student/${kind}`, body),
  earlyWarning: (body: { TenantId: string; StudentId: string }) =>
    api.post<PredictionResult[]>("/api/aiprediction/early-warning", body),
  forecast: (kind: string, body: { TenantId: string }) =>
    api.post<PredictionResult>(`/api/aiprediction/forecast/${kind}`, body),
};

// ─── Communication ────────────────────────────────────────────────────────────
export const communicationApi = {
  conversations: () =>
    api.get<ChatConversation[]>("/api/communication/chat/conversations"),
  messages: (conversationId: string) =>
    api.get<ChatMessage[]>(`/api/communication/chat/conversations/${conversationId}/messages`),
  createConversation: (body: { TenantId?: string; Title: string; Type: string }) =>
    api.post<{ chatConversationId: string; title: string }>("/api/communication/chat/conversations", body),
  sendMessage: (conversationId: string, message: string) =>
    api.post<ChatMessage>(`/api/communication/chat/conversations/${conversationId}/messages`, { message }),

  notifications: (tenantId: string, recipientUserId: string) =>
    api.get<PagedResult<NotificationItem>>("/api/communication/notification", {
      params: { tenantId, recipientUserId, page: 1, pageSize: 30 },
    }),
  unreadCount: (tenantId: string, recipientUserId: string) =>
    api.get<{ unreadCount: number }>("/api/communication/notification/unread-count", {
      params: { tenantId, recipientUserId },
    }),
  markRead: (id: string, tenantId: string, recipientUserId: string) =>
    api.patch(`/api/communication/notification/${id}/read`, null, {
      params: { tenantId, recipientUserId },
    }),
  markAllRead: (tenantId: string, recipientUserId: string) =>
    api.patch("/api/communication/notification/read-all", null, {
      params: { tenantId, recipientUserId },
    }),
};

// ─── Reference / Lookups ──────────────────────────────────────────────────────
export const referenceApi = {
  types: (tenantId?: string) =>
    api.get<string[]>("/api/lookups/types", { params: { tenantId } }),
  byType: (typeCode: string, tenantId?: string) =>
    api.get<LookupValue[]>(`/api/lookups/${typeCode}`, { params: { tenantId } }),
  create: (body: { TenantId?: string; TypeCode: string; Code: string; Name: string; SortOrder?: number }) =>
    api.post<LookupValue>("/api/lookups", body),
  update: (id: string, body: { Name: string; SortOrder?: number }) =>
    api.put(`/api/lookups/${id}`, body),
  delete: (id: string, tenantId?: string) =>
    api.delete(`/api/lookups/${id}`, { params: { tenantId } }),
};

// ─── Tenancy ──────────────────────────────────────────────────────────────────
export const tenancyApi = {
  page: (page = 1, pageSize = 50) =>
    api.get<PagedResult<TenantListItem>>("/api/tenancy/tenant", { params: { page, pageSize } }),
  create: (req: CreateTenantRequest) =>
    api.post("/api/tenancy/tenant", req),
  getById: (tenantId: string) =>
    api.get(`/api/tenancy/tenant/${tenantId}`),
};

// ─── Identity / Impersonation ─────────────────────────────────────────────────
export const identityApi = {
  users: (tenantId?: string) =>
    api.get("/api/identity/users", { params: { tenantId, page: 1, pageSize: 50 } }),
  startImpersonation: (body: { TargetUserId: string; TenantId?: string; Reason?: string }) =>
    api.post<{ token: string; refreshToken: string }>("/api/identity/users/impersonation/start", body),
  setRoles: (userId: string, body: { Roles: string[] }) =>
    api.put(`/api/identity/users/${userId}/roles`, body),
  resetPassword: (userId: string, body: { NewPassword: string }) =>
    api.post(`/api/identity/users/${userId}/reset-password`, body),
};

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const profilesApi = {
  student: (id: string, tenantId: string) =>
    api.get(`/api/profiles/students/${id}`, { params: { tenantId } }),
  parent: (id: string, tenantId: string) =>
    api.get(`/api/profiles/parents/${id}`, { params: { tenantId } }),
  teacher: (id: string, tenantId: string) =>
    api.get(`/api/profiles/teachers/${id}`, { params: { tenantId } }),
  driver: (id: string, tenantId: string) =>
    api.get(`/api/profiles/drivers/${id}`, { params: { tenantId } }),
};

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachersApi = {
  me: (tenantId: string) =>
    api.get("/api/teachers/me", { params: { tenantId } }),
  students: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/students`, { params: { tenantId } }),
  timetable: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/timetable`, { params: { tenantId } }),
  workload: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/workload`, { params: { tenantId } }),
  assignments: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/assignments`, { params: { tenantId } }),
  createAssignment: (employeeId: string, body: object) =>
    api.post(`/api/teachers/${employeeId}/assignments`, body),
};

// ─── Workflow ─────────────────────────────────────────────────────────────────
export const workflowApi = {
  catalog: () =>
    api.get<{ code: string; name: string; initiators: string[]; approvers: string[]; steps: string[] }[]>(
      "/api/workflows/catalog"
    ),
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthApi = {
  check: () => api.get("/health"),
};

// Re-export fromMetaJson for use in UI components
export { fromMetaJson, toMetaJson };
