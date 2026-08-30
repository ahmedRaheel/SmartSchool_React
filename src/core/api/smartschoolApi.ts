/**
 * SmartSchool API — typed client layer, synced to backend endpoint contracts.
 *
 * Every function maps 1-to-1 to a backend endpoint, using the exact route,
 * HTTP method, query params and body shape the backend expects.
 */
import { api } from "./ApiClient";

// ─── Shared ──────────────────────────────────────────────────────────────────
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AskResponse {
  answer: string;
  contextStrategy: string;
  citations: Citation[];
  sessionId?: string;
}

export interface Citation {
  chunkId: string;
  documentTitle: string;
  relevanceScore: number;
  excerpt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface AdminDashboard {
  Students: number; Guardians: number; Employees: number;
  Exams: number; Invoices: number; OutstandingInvoices: number;
  UnreadNotifications: number; Vehicles: number; Drivers: number;
}
export interface StudentDashboard {
  StudentId: string; StudentNumber: string; FirstName: string; LastName?: string;
  Status: string; Enrollments: number; Results: number; OutstandingInvoices: number;
}
export interface TeacherDashboard {
  EmployeeId: string; EmployeeNumber: string; FirstName: string; LastName?: string;
  Status: string; CourseAssignments: number; PendingLeaves: number;
}
export interface ParentDashboard {
  GuardianId: string; FullName: string; Email?: string;
  Phone?: string; Children: number; OutstandingInvoices: number;
}
export interface DriverDashboard {
  DriverId: string; DriverNumber: string; FullName: string;
  Phone?: string; Status: string; LicenseExpiresOn?: string;
  ActiveVehicleAssignments: number;
}
export interface ExaminerDashboard {
  UpcomingExams: number; ActiveExams: number; ResultsPendingVerification: number;
}

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

// ─── AI Assistant + RAG Chatbot ───────────────────────────────────────────────
export const aiApi = {
  /** General assistant — POST /api/ai/assistant/ask */
  ask: (body: {
    tenantId?: string; question: string; schoolId?: string;
    assistant?: string; collections?: string[];
  }) => api.post<AskResponse>("/api/ai/assistant/ask", body),

  /** Role-scoped chatbot — POST /api/chatbots/{bot}/ask */
  chatbot: (bot: "student" | "teacher" | "parent" | "admissions" | "admin", body: {
    tenantId?: string; question: string; schoolId?: string;
  }) => api.post<AskResponse>(`/api/chatbots/${bot}/ask`, body),
};

// ─── AI Tutor ────────────────────────────────────────────────────────────────
export interface TutorSession { sessionId: string; conversationId: string; }
export interface TutorAnswer { messageId: string; answer: string; model: string; }
export interface QuizQuestion {
  question: string; options: string[]; correctAnswer: string; explanation: string;
}
export interface GeneratedQuiz { quizId: string; questions: QuizQuestion[]; }
export interface LearningRecommendation { recommendationId: string; recommendation: string; }

export const aiTutorApi = {
  /** Start tutor session — POST /api/aitutor/operations/sessions */
  start: (body: { tenantId?: string; studentId: string; subject: string; topic?: string }) =>
    api.post<TutorSession>("/api/aitutor/operations/sessions", body),

  /** Ask tutor — POST /api/aitutor/operations/ask */
  ask: (body: {
    tenantId?: string; sessionId: string; studentId: string;
    subject: string; topic: string; message: string;
  }) => api.post<TutorAnswer>("/api/aitutor/operations/ask", body),

  /** Generate quiz — POST /api/aitutor/operations/quizzes/generate */
  generateQuiz: (body: {
    tenantId?: string; studentId: string; subject: string;
    topic: string; questionCount?: number; difficulty?: string;
  }) => api.post<GeneratedQuiz>("/api/aitutor/operations/quizzes/generate", body),

  /** Generate recommendation — POST /api/aitutor/operations/recommendations/generate */
  recommend: (body: {
    tenantId?: string; studentId: string; subject: string;
    topic: string; masteryScore: number;
  }) => api.post<LearningRecommendation>("/api/aitutor/operations/recommendations/generate", body),
};

// ─── AI Predictions ───────────────────────────────────────────────────────────
export type PredictionKind =
  | "DropoutRisk" | "GradeDecline" | "AttendanceAnomaly"
  | "FeeDefault" | "BehaviorRisk" | "SubjectPerformance";

export interface PredictionResult {
  kind: string; score: number; probability: number; riskLevel: string;
  outcome: string; confidence: number; modelVersion: string;
  usedMachineLearning: boolean; factors: Record<string, number>;
}

export const predictionApi = {
  /** Predict student risk — POST /api/aiprediction/student/{kind} */
  student: (kind: PredictionKind, body: {
    tenantId: string; studentId: string; subjectId?: string;
    attendanceRate?: number; avgGrade?: number; missedAssignments?: number;
    feeOutstanding?: boolean;
  }) => api.post<PredictionResult>(`/api/aiprediction/student/${kind}`, body),

  /** Early warning — POST /api/aiprediction/early-warning */
  earlyWarning: (body: { tenantId: string; studentId: string }) =>
    api.post<PredictionResult[]>("/api/aiprediction/early-warning", body),

  /** Transport delay — POST /api/aiprediction/transport/delay */
  transport: (body: { tenantId: string; routeId: string }) =>
    api.post<PredictionResult>("/api/aiprediction/transport/delay", body),

  /** Fee default — POST /api/aiprediction/forecast/{kind} */
  forecast: (kind: string, body: { tenantId: string }) =>
    api.post<PredictionResult>(`/api/aiprediction/forecast/${kind}`, body),
};

// ─── Communication / Chat ─────────────────────────────────────────────────────
export interface Conversation {
  tenantId: string; chatConversationId: string; title: string;
  conversationType: string; createdByUserId: string; isClosed: boolean;
}
export interface ChatMessage {
  tenantId: string; chatMessageId: string; conversationId: string;
  senderUserId: string; message: string; sentAt: string; editedAt?: string;
}

export const chatApi = {
  /** GET /api/communication/chat/conversations */
  conversations: () => api.get<Conversation[]>("/api/communication/chat/conversations"),

  /** GET /api/communication/chat/conversations/{id}/messages */
  messages: (conversationId: string) =>
    api.get<ChatMessage[]>(`/api/communication/chat/conversations/${conversationId}/messages`),

  /** POST /api/communication/chat/conversations */
  create: (body: {
    tenantId?: string; title: string; type: string;
    participants: { userId: string; role: string }[];
  }) => api.post<{ chatConversationId: string; title: string }>("/api/communication/chat/conversations", body),

  /** POST /api/communication/chat/conversations/{id}/messages */
  send: (conversationId: string, message: string) =>
    api.post<ChatMessage>(`/api/communication/chat/conversations/${conversationId}/messages`, { message }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export interface NotificationItem {
  tenantId: string; id: string; recipientUserId: string; type: string | number;
  title: string; message: string; relatedEntityId?: string | null;
  relatedEntityType?: string | null; actionUrl?: string | null;
  priority: string; isRead: boolean; readAt?: string | null; occurredAt: string;
}

export const notificationApi = {
  list: (tenantId: string, recipientUserId: string) =>
    api.get<Page<NotificationItem>>("/api/communication/notification", {
      params: { tenantId, recipientUserId, page: 1, pageSize: 30 },
    }),
  unreadCount: (tenantId: string, recipientUserId: string) =>
    api.get<{ unreadCount: number }>("/api/communication/notification/unread-count", {
      params: { tenantId, recipientUserId },
    }),
  markRead: (tenantId: string, recipientUserId: string, id: string) =>
    api.patch(`/api/communication/notification/${id}/read`, null, {
      params: { tenantId, recipientUserId },
    }),
  markAllRead: (tenantId: string, recipientUserId: string) =>
    api.patch("/api/communication/notification/read-all", null, {
      params: { tenantId, recipientUserId },
    }),
};

// ─── Organization ─────────────────────────────────────────────────────────────
export interface School {
  id: string; tenantId: string; name: string; code: string;
  registrationNumber?: string; email?: string; phone?: string;
  city?: string; province?: string; country?: string; logoUrl?: string;
}
export interface Campus {
  id: string; schoolId: string; tenantId: string; name: string;
  code: string; branchType: string; city?: string;
  phone?: string; email?: string; isActive: boolean; academicSystemId?: string;
}
export interface LookupItem { id: string; code: string; name: string; }

export const organizationApi = {
  schools: (tenantId: string) =>
    api.get<Page<School>>("/api/organization/school", { params: { tenantId } }),
  createSchool: (body: Partial<School>) =>
    api.post("/api/organization/school", body),
  updateSchool: (id: string, body: Partial<School>) =>
    api.put(`/api/organization/school/${id}`, body),
  campuses: (tenantId: string, schoolId?: string) =>
    api.get<Page<Campus>>("/api/organization/branch", { params: { tenantId, schoolId } }),
  createCampus: (body: Partial<Campus>) =>
    api.post("/api/organization/branch", body),
  branchPolicy: (branchId: string, tenantId: string) =>
    api.get(`/api/organization/branches/${branchId}/policy`, { params: { tenantId } }),
  branchGenderTypes: (tenantId: string) =>
    api.get<LookupItem[]>("/api/organization/lookups/branch-gender-types", { params: { tenantId } }),
  educationLevels: (tenantId: string) =>
    api.get<LookupItem[]>("/api/organization/lookups/education-levels", { params: { tenantId } }),
};

// ─── Academics ────────────────────────────────────────────────────────────────
export const academicsApi = {
  academicYears: (tenantId: string, campusId?: string) =>
    api.get("/api/academics/academic-year", { params: { tenantId, campusId, page:1, pageSize:200 } }),
  createYear: (body: object) => api.post("/api/academics/academic-year", body),
  updateYear: (id: string, body: object) => api.put(`/api/academics/academic-year/${id}`, body),
  deleteYear: (id: string, tenantId: string) =>
    api.delete(`/api/academics/academic-year/${id}`, { params: { tenantId } }),

  grades: (tenantId: string, campusId?: string) =>
    api.get("/api/academics/grade-level", { params: { tenantId, campusId, page:1, pageSize:200 } }),
  createGrade: (body: object) => api.post("/api/academics/grade-level", body),

  sections: (tenantId: string, campusId?: string) =>
    api.get("/api/academics/class-section", { params: { tenantId, campusId, page:1, pageSize:200 } }),
  createSection: (body: object) => api.post("/api/academics/class-section", body),

  departments: (tenantId: string) =>
    api.get("/api/academics/department", { params: { tenantId, page:1, pageSize:200 } }),
  subjectTeachers: (departmentId: string, tenantId: string) =>
    api.get(`/api/academics/department/${departmentId}/subject-teachers`, { params: { tenantId } }),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export interface Student {
  studentId: string; studentNumber: string; firstName: string; lastName?: string;
  dateOfBirth?: string; gender?: string; admissionDate?: string; status: string;
  tenantId: string; userId?: string;
}
export const studentsApi = {
  page: (tenantId: string, params?: Record<string, unknown>) =>
    api.get<Page<Student>>("/api/students/student", { params: { tenantId, page:1, pageSize:50, ...params } }),
  byId: (id: string, tenantId: string) =>
    api.get<Student>(`/api/students/student/${id}`, { params: { tenantId } }),
  create: (body: object) => api.post("/api/students/student", body),
  update: (id: string, body: object) => api.put(`/api/students/student/${id}`, body),
  approve: (id: string, body: object) => api.post(`/api/students/student/${id}/approve`, body),
  linkGuardian: (body: object) => api.post("/api/students/student-guardian/link", body),
};

// ─── HR / Employees ───────────────────────────────────────────────────────────
export interface Employee {
  employeeId: string; employeeNumber: string; firstName: string; lastName?: string;
  email?: string; phone?: string; status: string; tenantId: string;
  employmentTypeCode?: string; hireDate?: string;
}
export const hrApi = {
  page: (tenantId: string, params?: Record<string, unknown>) =>
    api.get<Page<Employee>>("/api/hr/employee", { params: { tenantId, page:1, pageSize:50, ...params } }),
  byId: (id: string, tenantId: string) =>
    api.get<Employee>(`/api/hr/employee/${id}`, { params: { tenantId } }),
  create: (body: object) => api.post("/api/hr/employee", body),
  update: (id: string, body: object) => api.put(`/api/hr/employee/${id}`, body),
  terminate: (id: string, body: object) => api.post(`/api/hr/employee/${id}/terminate`, body),
  education: (id: string, tenantId: string) =>
    api.get(`/api/hr/employee/${id}/education`, { params: { tenantId } }),
  addEducation: (id: string, body: object) =>
    api.post(`/api/hr/employee/${id}/education`, body),
};

// ─── Finance ─────────────────────────────────────────────────────────────────
export interface Invoice {
  studentInvoiceId: string; invoiceNumber: string; studentId: string;
  tenantId: string; totalAmount: number; paidAmount: number; status: string;
  dueDate?: string; issueDate: string;
}
export interface Payment {
  paymentId: string; invoiceId: string; amount: number;
  paymentMethod: string; paymentDate: string; referenceNumber?: string;
}
export const financeApi = {
  invoices: (tenantId: string, params?: Record<string, unknown>) =>
    api.get<Page<Invoice>>("/api/finance/student-invoice", { params: { tenantId, page:1, pageSize:50, ...params } }),
  createInvoice: (body: object) => api.post("/api/finance/student-invoice", body),
  recordPayment: (body: object) => api.post("/api/finance/payment", body),
  feeStructure: (tenantId: string) =>
    api.get("/api/finance/fee-structure", { params: { tenantId, page:1, pageSize:100 } }),
  feeTypes: (tenantId: string) =>
    api.get("/api/finance/fee-type", { params: { tenantId, page:1, pageSize:100 } }),
  createFeeType: (body: object) => api.post("/api/finance/fee-type", body),
};

// ─── Admissions ───────────────────────────────────────────────────────────────
export interface Admission {
  admissionInquiryId: string; applicantFirstName: string; applicantLastName?: string;
  guardianName?: string; guardianPhone?: string; gradeApplied?: string;
  status: string; tenantId: string; inquiryDate: string; source?: string;
}
export const admissionsApi = {
  page: (tenantId: string, params?: Record<string, unknown>) =>
    api.get<Page<Admission>>("/api/admissions/admission-inquiry", { params: { tenantId, page:1, pageSize:50, ...params } }),
  create: (body: object) => api.post("/api/admissions/admission-inquiry", body),
  update: (id: string, body: object) => api.put(`/api/admissions/admission-inquiry/${id}`, body),
};

// ─── Reference / Lookups ──────────────────────────────────────────────────────
export interface LookupValue {
  lookupValueId?: string; id?: string; typeCode: string; code: string;
  name: string; sortOrder?: number; isActive: boolean;
}
export const referenceApi = {
  types: (tenantId?: string) =>
    api.get<string[]>("/api/lookups/types", { params: { tenantId } }),
  byType: (typeCode: string, tenantId?: string) =>
    api.get<LookupValue[]>(`/api/lookups/${typeCode}`, { params: { tenantId } }),
  create: (body: object) => api.post("/api/lookups", body),
  update: (id: string, body: object) => api.put(`/api/lookups/${id}`, body),
  delete: (id: string, tenantId?: string) =>
    api.delete(`/api/lookups/${id}`, { params: { tenantId } }),
};

// ─── Transport ────────────────────────────────────────────────────────────────
export const transportApi = {
  vehicles: (tenantId: string) =>
    api.get("/api/transport/vehicle", { params: { tenantId, page:1, pageSize:100 } }),
  drivers: (tenantId: string) =>
    api.get("/api/transport/driver", { params: { tenantId, page:1, pageSize:100 } }),
  routes: (tenantId: string) =>
    api.get("/api/transport/route", { params: { tenantId, page:1, pageSize:100 } }),
};

// ─── Library ──────────────────────────────────────────────────────────────────
export const libraryApi = {
  books: (tenantId: string, params?: Record<string, unknown>) =>
    api.get("/api/library/library-item", { params: { tenantId, page:1, pageSize:50, ...params } }),
  issue: (body: object) => api.post("/api/library/item-loan", body),
  return: (id: string, body: object) => api.put(`/api/library/item-loan/${id}/return`, body),
};

// ─── Examinations ─────────────────────────────────────────────────────────────
export const examsApi = {
  exams: (tenantId: string) =>
    api.get("/api/examinations/exam", { params: { tenantId, page:1, pageSize:50 } }),
  create: (body: object) => api.post("/api/examinations/exam", body),
  results: (tenantId: string, examId: string) =>
    api.get("/api/examinations/student-exam-result", { params: { tenantId, examId } }),
};

// ─── Teachers ─────────────────────────────────────────────────────────────────
export const teachersApi = {
  me: () => api.get("/api/teachers/me"),
  byId: (employeeId: string) => api.get(`/api/teachers/${employeeId}`),
  assignments: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/assignments`, { params: { tenantId } }),
  timetable: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/timetable`, { params: { tenantId } }),
  workload: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/workload`, { params: { tenantId } }),
  students: (employeeId: string, tenantId: string) =>
    api.get(`/api/teachers/${employeeId}/students`, { params: { tenantId } }),
  createAssignment: (employeeId: string, body: object) =>
    api.post(`/api/teachers/${employeeId}/assignments`, body),
};

// ─── Tenancy (Super Admin) ────────────────────────────────────────────────────
export const tenancyApi = {
  list: () => api.get("/api/tenancy/tenant"),
  create: (body: object) => api.post("/api/tenancy/tenant", body),
  getById: (tenantId: string) => api.get(`/api/tenancy/tenant/${tenantId}`),
  setStatus: (tenantId: string, body: { status: string; reason?: string }) =>
    api.post(`/api/identity/users/tenant/${tenantId}/status`, body),
};

// ─── Identity / Impersonation ─────────────────────────────────────────────────
export const identityApi = {
  users: (tenantId?: string) =>
    api.get("/api/identity/users", { params: { tenantId, page:1, pageSize:50 } }),
  startImpersonation: (body: { targetUserId: string; tenantId?: string; reason?: string }) =>
    api.post<{ token: string; refreshToken: string }>(
      "/api/identity/users/impersonation/start", body
    ),
  setRoles: (userId: string, body: { roles: string[] }) =>
    api.put(`/api/identity/users/${userId}/roles`, body),
  resetPassword: (userId: string, body: { newPassword: string }) =>
    api.post(`/api/identity/users/${userId}/reset-password`, body),
};

// ─── Workflow catalog ─────────────────────────────────────────────────────────
export const workflowApi = {
  catalog: () => api.get<{ code: string; name: string; initiators: string[]; approvers: string[]; steps: string[] }[]>(
    "/api/workflows/catalog"
  ),
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

// ─── AICore (system/admin) ────────────────────────────────────────────────────
export const aiCoreApi = {
  modelConfigs: (tenantId: string) =>
    api.get("/api/aicore/model-configuration", { params: { tenantId, page:1, pageSize:50 } }),
  createModelConfig: (body: object) => api.post("/api/aicore/model-configuration", body),
  collections: (tenantId: string) =>
    api.get("/api/aicore/knowledge-collection", { params: { tenantId, page:1, pageSize:50 } }),
  createCollection: (body: object) => api.post("/api/aicore/knowledge-collection", body),
  documents: (tenantId: string, collectionId?: string) =>
    api.get("/api/aicore/knowledge-document", { params: { tenantId, collectionId, page:1, pageSize:50 } }),
  uploadDocument: (body: object) => api.post("/api/aicore/knowledge-document", body),
  indexKnowledge: (body: object) => api.post("/api/aicore/knowledge/index", body),
  promptTemplates: (tenantId: string) =>
    api.get("/api/aicore/prompt-template", { params: { tenantId, page:1, pageSize:50 } }),
  executionLogs: (tenantId: string) =>
    api.get("/api/aicore/ai-execution-log", { params: { tenantId, page:1, pageSize:50 } }),
  agentExecute: (body: { tool: string; parameters: Record<string, unknown> }) =>
    api.post("/api/aicore/agent/execute", body),
};
