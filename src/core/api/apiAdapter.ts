/**
 * SmartSchool API Adapter v2 — 100% synced with latest backend.
 *
 * Single env toggle: VITE_USE_MOCKS=true (mock) | false (real API)
 * All mock paths return EXACTLY the same shape as the real backend.
 *
 * Changes from latest backend:
 * - FeeType: explicit fields (no MetadataJson), frequency enum: Monthly|Term|Annual|OneTime
 * - CreateEmployee: new dateOfBirth, gender, jobTitle fields
 * - AdminDashboard: new ActiveStudents, CollectedAmount, OutstandingAmount, PassedResults, FailedResults
 * - PredictionResult.factors: string[] (was Record<string,number>)
 * - Campus.academicSystemId: new optional field
 */
import { env } from "../../config/env";
import { api } from "./ApiClient";
import type { PagedResult } from "./backendContracts";
import {
  MOCK_ADMIN_DASHBOARD, MOCK_STUDENT_DASHBOARD, MOCK_TEACHER_DASHBOARD,
  MOCK_PARENT_DASHBOARD, MOCK_DRIVER_DASHBOARD,
  MOCK_STUDENTS, MOCK_STUDENTS_PAGE, MOCK_EMPLOYEES, MOCK_EMPLOYEES_PAGE,
  MOCK_SCHOOLS, MOCK_CAMPUSES, MOCK_DEPARTMENTS,
  MOCK_FEE_TYPES, MOCK_INVOICES,
  MOCK_ACADEMIC_YEARS, MOCK_GRADE_LEVELS, MOCK_CLASS_SECTIONS, MOCK_SUBJECTS,
  MOCK_TENANTS, MOCK_VEHICLES, MOCK_ROUTES,
  MOCK_BOOKS, MOCK_EXAMS,
  MOCK_NOTIFICATIONS, MOCK_CONVERSATIONS, MOCK_MESSAGES,
  MOCK_MODEL_CONFIGS, MOCK_COLLECTIONS, MOCK_EXEC_LOGS,
  MOCK_LOOKUP_TYPES, MOCK_LOOKUP_VALUES,
  MOCK_AI_RESPONSE, MOCK_PREDICTION, MOCK_EARLY_WARNINGS,
  MOCK_BRANCH_GENDER_TYPES, MOCK_EDUCATION_LEVELS,
  MOCK_INQUIRIES,
  page,
} from "./mockData";

const M = env.useMocks;
const delay = <T>(v: T, ms = 120): Promise<T> => new Promise(r => setTimeout(() => r(v), ms));
const mockPage = <T>(items: T[], p = 1, ps = 50): PagedResult<T> => {
  const start = (p - 1) * ps;
  return { items: items.slice(start, start + ps), page: p, pageSize: ps, totalCount: items.length };
};

// ─── Dashboard ──────────────────────────────────────────────────────────────
export const adminDashboard = (tenantId?: string) =>
  M ? delay(MOCK_ADMIN_DASHBOARD) : api.get("/api/dashboard/admin", { params: { tenantId } }).then(r => r.data);

export const studentDashboard = (studentId: string, tenantId: string) =>
  M ? delay(MOCK_STUDENT_DASHBOARD) : api.get(`/api/dashboard/student/${studentId}`, { params: { tenantId } }).then(r => r.data);

export const teacherDashboard = (employeeId: string, tenantId: string) =>
  M ? delay(MOCK_TEACHER_DASHBOARD) : api.get(`/api/dashboard/teacher/${employeeId}`, { params: { tenantId } }).then(r => r.data);

export const parentDashboard = (guardianId: string, tenantId: string) =>
  M ? delay(MOCK_PARENT_DASHBOARD) : api.get(`/api/dashboard/parent/${guardianId}`, { params: { tenantId } }).then(r => r.data);

export const driverDashboard = (driverId: string, tenantId: string) =>
  M ? delay(MOCK_DRIVER_DASHBOARD) : api.get(`/api/dashboard/driver/${driverId}`, { params: { tenantId } }).then(r => r.data);

// ─── Students: /api/students/* ──────────────────────────────────────────────
export const getStudentsPage = (tenantId: string, p = 1, ps = 50) =>
  M ? delay(mockPage(MOCK_STUDENTS, p, ps)) : api.get("/api/students/student", { params: { tenantId, page: p, pageSize: ps } }).then(r => r.data);

export const createStudent = (body: object) =>
  M ? delay({ ...MOCK_STUDENTS[0], id: crypto.randomUUID(), studentNumber: `STU-${Date.now()}` })
    : api.post("/api/students/student", body).then(r => r.data);

export const getStudent = (id: string, tenantId: string) =>
  M ? delay(MOCK_STUDENTS.find(s => s.id === id) ?? MOCK_STUDENTS[0])
    : api.get(`/api/students/student/${id}`, { params: { tenantId } }).then(r => r.data);

export const approveStudent = (id: string, body: object) =>
  M ? delay({}) : api.post(`/api/students/student/${id}/approve`, body).then(r => r.data);

export const createGuardian = (body: object) =>
  M ? delay({ tenantId: "t1", id: crypto.randomUUID(), guardianNumber: `GDN-${Date.now()}` })
    : api.post("/api/students/guardian", body).then(r => r.data);

export const linkGuardian = (body: object) =>
  M ? delay({}) : api.post("/api/students/student-guardian", body).then(r => r.data);

// ─── HR: /api/hr/* ──────────────────────────────────────────────────────────
export const getEmployeesPage = (tenantId: string, p = 1, ps = 50) =>
  M ? delay(mockPage(MOCK_EMPLOYEES, p, ps)) : api.get("/api/hr/employee", { params: { tenantId, page: p, pageSize: ps } }).then(r => r.data);

export const createEmployee = (body: object) =>
  M ? delay({ ...MOCK_EMPLOYEES[0], id: crypto.randomUUID(), employeeNumber: `EMP-${Date.now()}` })
    : api.post("/api/hr/employee", body).then(r => r.data);

export const getEmployee = (id: string, tenantId: string) =>
  M ? delay(MOCK_EMPLOYEES.find(e => e.id === id) ?? MOCK_EMPLOYEES[0])
    : api.get(`/api/hr/employee/${id}`, { params: { tenantId } }).then(r => r.data);

// ─── Finance: /api/finance/* ────────────────────────────────────────────────
export const getInvoicesPage = (tenantId: string, p = 1, ps = 50) =>
  M ? delay(mockPage(MOCK_INVOICES, p, ps)) : api.get("/api/finance/invoice", { params: { tenantId, page: p, pageSize: ps } }).then(r => r.data);

export const createInvoice = (body: object) =>
  M ? delay({ ...MOCK_INVOICES[0], id: crypto.randomUUID(), code: `INV-${Date.now()}` })
    : api.post("/api/finance/invoice", body).then(r => r.data);

export const createPayment = (body: object) =>
  M ? delay({ tenantId: "t1", id: crypto.randomUUID(), code: `PAY-${Date.now()}`, name: "Payment", metadataJson: null })
    : api.post("/api/finance/payment", body).then(r => r.data);

/** getFeeTypes — returns FeeTypeItem[] with explicit fields (no MetadataJson) */
export const getFeeTypes = (tenantId: string) =>
  M ? delay(MOCK_FEE_TYPES) : api.get("/api/finance/fee-type", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

/** createFeeType — NEW fields: name, frequency (Monthly|Term|Annual|OneTime), description */
export const createFeeType = (body: object) =>
  M ? delay({ tenantId: "t1", id: crypto.randomUUID(), code: `FT-${Date.now()}`, name: (body as any).name ?? "Fee", frequency: (body as any).frequency ?? "Monthly", isActive: true, description: (body as any).description ?? null })
    : api.post("/api/finance/fee-type", body).then(r => r.data);

/** createFeeStructure — links GradeLevel + FeeType with amount */
export const createFeeStructure = (body: object) =>
  M ? delay({ tenantId: "t1", id: crypto.randomUUID(), code: `FS-${Date.now()}`, name: "Fee Structure", metadataJson: null })
    : api.post("/api/finance/fee-structure", body).then(r => r.data);

export const getFeeStructure = (tenantId: string) =>
  M ? delay([]) : api.get("/api/finance/fee-structure", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

// ─── Admissions: /api/admissions/* ─────────────────────────────────────────
export const getInquiriesPage = (tenantId: string, p = 1, ps = 50) =>
  M ? delay(mockPage(MOCK_INQUIRIES, p, ps)) : api.get("/api/admissions/inquiry", { params: { tenantId, page: p, pageSize: ps } }).then(r => r.data);

export const createInquiry = (body: object) =>
  M ? delay({ ...MOCK_INQUIRIES[0], id: crypto.randomUUID(), code: `INQ-${Date.now()}` })
    : api.post("/api/admissions/inquiry", body).then(r => r.data);

export const updateInquiry = (id: string, body: object) =>
  M ? delay({}) : api.put(`/api/admissions/inquiry/${id}`, body).then(r => r.data);

// ─── Organization: /api/organization/* ─────────────────────────────────────
export const getSchools = (tenantId?: string) =>
  M ? delay(mockPage(MOCK_SCHOOLS)) : api.get("/api/organization/school", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

export const createSchool = (body: object) =>
  M ? delay({ ...MOCK_SCHOOLS[0], id: crypto.randomUUID(), code: `SCH-${Date.now()}` })
    : api.post("/api/organization/school", body).then(r => r.data);

export const getCampuses = (tenantId?: string) =>
  M ? delay(mockPage(MOCK_CAMPUSES)) : api.get("/api/organization/campus", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

export const createCampus = (body: object) =>
  M ? delay({ ...MOCK_CAMPUSES[0], id: crypto.randomUUID(), code: `BR-${Date.now()}` })
    : api.post("/api/organization/campus", body).then(r => r.data);

export const getDepartments = (tenantId: string) =>
  M ? delay(mockPage(MOCK_DEPARTMENTS)) : api.get("/api/organization/department", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createDepartment = (body: object) =>
  M ? delay({ ...MOCK_DEPARTMENTS[0], id: crypto.randomUUID() })
    : api.post("/api/organization/department", body).then(r => r.data);

export const deleteDepartment = (id: string, tenantId: string) =>
  M ? delay({}) : api.delete(`/api/organization/department/${id}`, { params: { tenantId } }).then(r => r.data);

export const getBranchGenderTypes = () =>
  M ? delay(MOCK_BRANCH_GENDER_TYPES) : api.get("/api/organization/lookups/branch-gender-types").then(r => r.data);

export const getEducationLevels = () =>
  M ? delay(MOCK_EDUCATION_LEVELS) : api.get("/api/organization/lookups/education-levels").then(r => r.data);

// ─── Academics: /api/academics/* ────────────────────────────────────────────
/** getAcademicYears — NOTE: backend requires campusId in query */
export const getAcademicYears = (tenantId: string, campusId?: string) =>
  M ? delay(mockPage(MOCK_ACADEMIC_YEARS)) : api.get("/api/academics/academic-year", { params: { tenantId, campusId, page: 1, pageSize: 200 } }).then(r => r.data);

export const createAcademicYear = (body: object) =>
  M ? delay({ ...MOCK_ACADEMIC_YEARS[0], id: crypto.randomUUID() })
    : api.post("/api/academics/academic-year", body).then(r => r.data);

export const deleteAcademicYear = (id: string, tenantId: string) =>
  M ? delay({}) : api.delete(`/api/academics/academic-year/${id}`, { params: { tenantId } }).then(r => r.data);

export const getGradeLevels = (tenantId: string) =>
  M ? delay(mockPage(MOCK_GRADE_LEVELS)) : api.get("/api/academics/grade-level", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createGradeLevel = (body: object) =>
  M ? delay({ ...MOCK_GRADE_LEVELS[0], id: crypto.randomUUID() })
    : api.post("/api/academics/grade-level", body).then(r => r.data);

export const getClassSections = (tenantId: string) =>
  M ? delay(mockPage(MOCK_CLASS_SECTIONS)) : api.get("/api/academics/class-section", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createClassSection = (body: object) =>
  M ? delay({ ...MOCK_CLASS_SECTIONS[0], id: crypto.randomUUID() })
    : api.post("/api/academics/class-section", body).then(r => r.data);

export const getSubjects = (tenantId: string) =>
  M ? delay(mockPage(MOCK_SUBJECTS)) : api.get("/api/academics/subject", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createSubject = (body: object) =>
  M ? delay({ ...MOCK_SUBJECTS[0], id: crypto.randomUUID() })
    : api.post("/api/academics/subject", body).then(r => r.data);

// ─── Tenancy: /api/tenancy/* ────────────────────────────────────────────────
export const getTenants = () =>
  M ? delay(mockPage(MOCK_TENANTS)) : api.get("/api/tenancy/tenant").then(r => r.data);

export const createTenant = (body: object) =>
  M ? delay({ tenantId: crypto.randomUUID(), id: crypto.randomUUID(), code: `TNT-${Date.now()}`, name: (body as any).name, adminAccount: { userId: crypto.randomUUID(), email: (body as any).adminEmail, temporaryPassword: "TempPass123!", mustChangePassword: true } })
    : api.post("/api/tenancy/tenant", body).then(r => r.data);

// ─── Transport: /api/transport/* ────────────────────────────────────────────
export const getVehicles = (tenantId: string) =>
  M ? delay(mockPage(MOCK_VEHICLES)) : api.get("/api/transport/vehicle", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createVehicle = (body: object) =>
  M ? delay({ ...MOCK_VEHICLES[0], id: crypto.randomUUID() })
    : api.post("/api/transport/vehicle", body).then(r => r.data);

export const getRoutes = (tenantId: string) =>
  M ? delay(mockPage(MOCK_ROUTES)) : api.get("/api/transport/route", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createRoute = (body: object) =>
  M ? delay({ ...MOCK_ROUTES[0], id: crypto.randomUUID() })
    : api.post("/api/transport/route", body).then(r => r.data);

export const getDrivers = (tenantId: string) =>
  M ? delay(mockPage([])) : api.get("/api/transport/driver", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

// ─── Library: /api/library/* ────────────────────────────────────────────────
export const getBooks = (tenantId: string) =>
  M ? delay(mockPage(MOCK_BOOKS)) : api.get("/api/library/book", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createBook = (body: object) =>
  M ? delay({ ...MOCK_BOOKS[0], id: crypto.randomUUID() })
    : api.post("/api/library/book", body).then(r => r.data);

export const getLoans = (tenantId: string) =>
  M ? delay(mockPage([])) : api.get("/api/library/loan", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createLoan = (body: object) =>
  M ? delay({}) : api.post("/api/library/loan", body).then(r => r.data);

// ─── Examinations: /api/examinations/* ─────────────────────────────────────
export const getExams = (tenantId: string) =>
  M ? delay(mockPage(MOCK_EXAMS)) : api.get("/api/examinations/exam", { params: { tenantId, page: 1, pageSize: 100 } }).then(r => r.data);

export const createExam = (body: object) =>
  M ? delay({ ...MOCK_EXAMS[0], id: crypto.randomUUID() })
    : api.post("/api/examinations/exam", body).then(r => r.data);

// ─── Communication: /api/communication/* ────────────────────────────────────
export const getNotifications = (tenantId: string, recipientUserId: string, p = 1, ps = 30) =>
  M ? delay(mockPage(MOCK_NOTIFICATIONS, p, ps))
    : api.get("/api/communication/notification", { params: { tenantId, recipientUserId, page: p, pageSize: ps } }).then(r => r.data);

export const getUnreadCount = (tenantId: string, recipientUserId: string) =>
  M ? delay({ unreadCount: MOCK_NOTIFICATIONS.filter(n => !n.isRead).length })
    : api.get("/api/communication/notification/unread-count", { params: { tenantId, recipientUserId } }).then(r => r.data);

export const markNotificationRead = (id: string, tenantId: string, recipientUserId: string) =>
  M ? delay({}) : api.patch(`/api/communication/notification/${id}/read`, null, { params: { tenantId, recipientUserId } }).then(r => r.data);

export const markAllRead = (tenantId: string, recipientUserId: string) =>
  M ? delay({}) : api.patch("/api/communication/notification/read-all", null, { params: { tenantId, recipientUserId } }).then(r => r.data);

export const getConversations = (tenantId: string) =>
  M ? delay(MOCK_CONVERSATIONS) : api.get("/api/communication/conversation", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

export const getMessages = (tenantId: string, conversationId: string, p = 1) =>
  M ? delay(MOCK_MESSAGES.filter(msg => msg.conversationId === conversationId))
    : api.get("/api/communication/message", { params: { tenantId, conversationId, page: p, pageSize: 50 } }).then(r => r.data);

export const sendMessage = (tenantId: string, conversationId: string, message: string, senderUserId: string) =>
  M ? delay({ ...MOCK_MESSAGES[0], chatMessageId: crypto.randomUUID(), message, sentAt: new Date().toISOString() })
    : api.post("/api/communication/message", { tenantId, conversationId, message, senderUserId }).then(r => r.data);

export const createConversation = (body: object) =>
  M ? delay({ tenantId: "t1", chatConversationId: crypto.randomUUID(), title: (body as any).title, conversationType: "GROUP", createdByUserId: "usr1", isClosed: false })
    : api.post("/api/communication/conversation", body).then(r => r.data);

// ─── AICore: /api/aicore/* ──────────────────────────────────────────────────
export const getModelConfigs = (tenantId: string) =>
  M ? delay(mockPage(MOCK_MODEL_CONFIGS)) : api.get("/api/aicore/model-configuration", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

export const createModelConfig = (body: object) =>
  M ? delay({ ...MOCK_MODEL_CONFIGS[0], id: crypto.randomUUID() })
    : api.post("/api/aicore/model-configuration", body).then(r => r.data);

export const getKnowledgeCollections = (tenantId: string) =>
  M ? delay(mockPage(MOCK_COLLECTIONS)) : api.get("/api/aicore/knowledge-collection", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

export const createKnowledgeCollection = (body: object) =>
  M ? delay({ ...MOCK_COLLECTIONS[0], id: crypto.randomUUID() })
    : api.post("/api/aicore/knowledge-collection", body).then(r => r.data);

export const getExecutionLogs = (tenantId: string) =>
  M ? delay(mockPage(MOCK_EXEC_LOGS)) : api.get("/api/aicore/ai-execution-log", { params: { tenantId, page: 1, pageSize: 50 } }).then(r => r.data);

// ─── AI Chatbot / Assistant ──────────────────────────────────────────────────
export const askChatbot = (bot: string, body: { question: string; tenantId?: string; schoolId?: string }) =>
  M ? delay(MOCK_AI_RESPONSE) : api.post(`/api/chatbots/${bot}/ask`, body).then(r => r.data);

export const askAssistant = (body: { question: string; tenantId?: string; collections?: string[] }) =>
  M ? delay(MOCK_AI_RESPONSE) : api.post("/api/ai/assistant/ask", body).then(r => r.data);

// ─── AITutor: /api/aitutor/operations/* ─────────────────────────────────────
export const startTutorSession = (body: object) =>
  M ? delay({ sessionId: crypto.randomUUID(), conversationId: crypto.randomUUID() })
    : api.post("/api/aitutor/operations/sessions", body).then(r => r.data);

export const askTutor = (body: object) =>
  M ? delay({ messageId: crypto.randomUUID(), answer: "This is a mock tutor response. Ask me anything about your subject!", model: "llama3.2" })
    : api.post("/api/aitutor/operations/ask", body).then(r => r.data);

export const generateQuiz = (body: object) =>
  M ? delay({ quizId: crypto.randomUUID(), questions: [
      { question: "What is 2 + 2?",                       options: ["2","3","4","5"],                              correctAnswer: "4",          explanation: "2 plus 2 equals 4." },
      { question: "Capital of Pakistan?",                  options: ["Lahore","Karachi","Islamabad","Peshawar"],    correctAnswer: "Islamabad",  explanation: "Islamabad is the capital since 1966." },
      { question: "How many sides does a triangle have?",  options: ["2","3","4","5"],                              correctAnswer: "3",          explanation: "A triangle has exactly 3 sides." },
    ]})
    : api.post("/api/aitutor/operations/quizzes/generate", body).then(r => r.data);

export const getTutorRecommendation = (body: object) =>
  M ? delay({ recommendationId: crypto.randomUUID(), recommendation: "Focus on daily practice problems. Review Chapter 5 before moving to Chapter 6. Study 30 min per day." })
    : api.post("/api/aitutor/operations/recommendations/generate", body).then(r => r.data);

// ─── AIPrediction: /api/aiprediction/* ──────────────────────────────────────
export const predictStudent = (kind: string, body: object) =>
  M ? delay(MOCK_PREDICTION) : api.post(`/api/aiprediction/student/${kind}`, body).then(r => r.data);

export const getEarlyWarnings = (body: object) =>
  M ? delay(MOCK_EARLY_WARNINGS) : api.post("/api/aiprediction/early-warning", body).then(r => r.data);

// ─── Reference / Lookups: /api/lookups/* ────────────────────────────────────
export const getLookupTypes = () =>
  M ? delay(MOCK_LOOKUP_TYPES) : api.get("/api/lookups/types").then(r => r.data);

export const getLookupValues = (typeCode: string) =>
  M ? delay(MOCK_LOOKUP_VALUES.filter(v => v.typeCode === typeCode))
    : api.get(`/api/lookups/${typeCode}`).then(r => r.data);

/** createLookupValue — backend uses: typeCode, code, name, sortOrder, metadata */
export const createLookupValue = (body: object) =>
  M ? delay({ ...MOCK_LOOKUP_VALUES[0], id: crypto.randomUUID() })
    : api.post("/api/lookups", body).then(r => r.data);

export const deleteLookupValue = (id: string) =>
  M ? delay({}) : api.delete(`/api/lookups/${id}`).then(r => r.data);

// ─── Teachers: /api/teachers/* ──────────────────────────────────────────────
export const getTeacherMe = () =>
  M ? delay(MOCK_EMPLOYEES[0]) : api.get("/api/teachers/me").then(r => r.data);

export const getTeacherById = (id: string) =>
  M ? delay(MOCK_EMPLOYEES.find(e => e.id === id) ?? MOCK_EMPLOYEES[0])
    : api.get(`/api/teachers/${id}`).then(r => r.data);

export const getTeacherClasses = (id: string, tenantId: string) =>
  M ? delay([]) : api.get(`/api/teachers/${id}/classes`, { params: { tenantId } }).then(r => r.data);

export const getTeacherStudents = (id: string, tenantId: string) =>
  M ? delay(MOCK_STUDENTS.slice(0, 6)) : api.get(`/api/teachers/${id}/students`, { params: { tenantId } }).then(r => r.data);

export const getTeacherTimetable = (id: string, tenantId: string) =>
  M ? delay([]) : api.get(`/api/teachers/${id}/timetable`, { params: { tenantId } }).then(r => r.data);

export const getTeacherAssignments = (id: string, tenantId: string) =>
  M ? delay([]) : api.get(`/api/teachers/${id}/assignments`, { params: { tenantId } }).then(r => r.data);

export const getTeacherWorkload = (id: string, tenantId: string) =>
  M ? delay({ employeeId: id, activeAssignments: 4, periodsPerWeek: 20, classes: 4 })
    : api.get(`/api/teachers/${id}/workload`, { params: { tenantId } }).then(r => r.data);

export const createTeacherAssignment = (id: string, body: object) =>
  M ? delay({ assignmentId: crypto.randomUUID(), status: "PUBLISHED" })
    : api.post(`/api/teachers/${id}/assignments`, body).then(r => r.data);

export const applyTeacherLeave = (id: string, body: object) =>
  M ? delay({ leaveRequestId: crypto.randomUUID(), status: "PENDING" })
    : api.post(`/api/teachers/${id}/leave`, body).then(r => r.data);

// ─── Identity ────────────────────────────────────────────────────────────────
export const impersonateUser = (body: { targetUserId: string; tenantId?: string; reason?: string }) =>
  M ? delay({ token: "mock_token", refreshToken: "mock_refresh" })
    : api.post("/api/identity/users/impersonation/start", body).then(r => r.data);

// ─── Workflow: /api/workflows/* ──────────────────────────────────────────────
export const getWorkflowCatalog = () =>
  M ? delay([]) : api.get("/api/workflows/catalog").then(r => r.data);

// ─── Audit: /api/audit/* ────────────────────────────────────────────────────
export const getAuditLogs = (tenantId: string, p = 1, ps = 50) =>
  M ? delay(mockPage([], p, ps)) : api.get("/api/audit/audit-log", { params: { tenantId, page: p, pageSize: ps } }).then(r => r.data);
