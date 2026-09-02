/**
 * SmartSchool API Adapter v3
 * Toggle: VITE_USE_MOCKS=true (mock) | false (real API)
 * Every function has identical signatures — pages need zero changes.
 */
import { env } from "../../config/env";
import { api } from "./ApiClient";
import type { PagedResult } from "./backendContracts";
import {
  MOCK_ADMIN_DASHBOARD, MOCK_STUDENT_DASHBOARD, MOCK_TEACHER_DASHBOARD,
  MOCK_PARENT_DASHBOARD, MOCK_DRIVER_DASHBOARD,
  MOCK_STUDENTS, MOCK_STUDENTS_PAGE, MOCK_EMPLOYEES, MOCK_EMPLOYEES_PAGE,
  MOCK_SCHOOLS, MOCK_CAMPUSES, MOCK_DEPARTMENTS,
  MOCK_FEE_TYPES, MOCK_INVOICES, MOCK_ACADEMIC_SYSTEMS,
  MOCK_ACADEMIC_YEARS, MOCK_GRADE_LEVELS, MOCK_CLASS_SECTIONS, MOCK_SUBJECTS,
  MOCK_TENANTS, MOCK_VEHICLES, MOCK_ROUTES, MOCK_BOOKS, MOCK_EXAMS,
  MOCK_NOTIFICATIONS, MOCK_CONVERSATIONS, MOCK_MESSAGES,
  MOCK_MODEL_CONFIGS, MOCK_COLLECTIONS, MOCK_EXEC_LOGS,
  MOCK_LOOKUP_TYPES, MOCK_LOOKUP_VALUES,
  MOCK_AI_RESPONSE, MOCK_PREDICTION, MOCK_EARLY_WARNINGS,
  MOCK_BRANCH_GENDER_TYPES, MOCK_EDUCATION_LEVELS,
  MOCK_INQUIRIES, MOCK_WORKFLOW_DEFS, MOCK_APPROVALS,
  MOCK_ACTIVITIES, MOCK_ASSIGNMENTS, MOCK_INVENTORY,
  page,
} from "./mockData";

const M = env.useMocks;
const ms = <T>(v: T, delay = 100): Promise<T> => new Promise(r => setTimeout(() => r(v), delay));
const pg = <T>(items: T[], p = 1, ps = 50): PagedResult<T> => {
  const s = (p-1)*ps;
  return { items: items.slice(s, s+ps), page: p, pageSize: ps, totalCount: items.length };
};
const uid = () => crypto.randomUUID();

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const adminDashboard   = (tenantId?: string)                    => M ? ms(MOCK_ADMIN_DASHBOARD)   : api.get("/api/dashboard/admin",                    { params: { tenantId } }).then(r=>r.data);
export const studentDashboard = (studentId: string, tenantId: string) => M ? ms(MOCK_STUDENT_DASHBOARD) : api.get(`/api/dashboard/student/${studentId}`,     { params: { tenantId } }).then(r=>r.data);
export const teacherDashboard = (employeeId: string, tenantId: string)=> M ? ms(MOCK_TEACHER_DASHBOARD) : api.get(`/api/dashboard/teacher/${employeeId}`,    { params: { tenantId } }).then(r=>r.data);
export const parentDashboard  = (guardianId: string, tenantId: string)=> M ? ms(MOCK_PARENT_DASHBOARD)  : api.get(`/api/dashboard/parent/${guardianId}`,     { params: { tenantId } }).then(r=>r.data);
export const driverDashboard  = (driverId: string, tenantId: string)  => M ? ms(MOCK_DRIVER_DASHBOARD)  : api.get(`/api/dashboard/driver/${driverId}`,       { params: { tenantId } }).then(r=>r.data);

// ── Students ───────────────────────────────────────────────────────────────────
export const getStudentsPage   = (tenantId: string, p=1, ps=50) => M ? ms(pg(MOCK_STUDENTS,p,ps)) : api.get("/api/students/student",    { params:{tenantId,page:p,pageSize:ps} }).then(r=>r.data);
export const createStudent     = (body: object)                   => M ? ms({...MOCK_STUDENTS[0], id:uid(), studentNumber:`STU-${Date.now()}`}) : api.post("/api/students/student", body).then(r=>r.data);
export const approveStudent    = (id: string, body: object)       => M ? ms({}) : api.post(`/api/students/student/${id}/approve`, body).then(r=>r.data);
export const createGuardian    = (body: object)                   => M ? ms({ tenantId:"t1", id:uid(), fullName:"New Guardian" }) : api.post("/api/students/guardian", body).then(r=>r.data);
export const createEnrollment  = (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/students/enrollment", body).then(r=>r.data);
export const linkGuardian      = (body: object)                   => M ? ms({}) : api.post("/api/students/student-guardian/link", body).then(r=>r.data);
export const getEnrollments    = (tenantId: string, studentId?: string) => M ? ms(pg([])) : api.get("/api/students/enrollment", { params:{tenantId,studentId,page:1,pageSize:50} }).then(r=>r.data);

// ── HR ────────────────────────────────────────────────────────────────────────
export const getEmployeesPage  = (tenantId: string, p=1, ps=50) => M ? ms(pg(MOCK_EMPLOYEES,p,ps)) : api.get("/api/hr/employee", { params:{tenantId,page:p,pageSize:ps} }).then(r=>r.data);
export const createEmployee    = (body: object)                   => M ? ms({...MOCK_EMPLOYEES[0], id:uid(), employeeNumber:`EMP-${Date.now()}`}) : api.post("/api/hr/employee", body).then(r=>r.data);
export const approveEmployee   = (id: string, body: object)       => M ? ms({}) : api.post(`/api/hr/employee/${id}/approve`, body).then(r=>r.data);
export const terminateEmployee = (id: string, body: object)       => M ? ms({}) : api.post(`/api/hr/employee/${id}/terminate`, body).then(r=>r.data);
export const getLeaveRequests  = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/hr/leave-request", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createLeaveRequest= (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/hr/leave-request", body).then(r=>r.data);

// ── Finance ───────────────────────────────────────────────────────────────────
export const getInvoicesPage   = (tenantId: string, p=1, ps=50) => M ? ms(pg(MOCK_INVOICES,p,ps)) : api.get("/api/finance/invoice",       { params:{tenantId,page:p,pageSize:ps} }).then(r=>r.data);
export const createInvoice     = (body: object)                   => M ? ms({...MOCK_INVOICES[0], id:uid(), code:`INV-${Date.now()}`}) : api.post("/api/finance/invoice", body).then(r=>r.data);
export const createPayment     = (body: object)                   => M ? ms({ id:uid(), code:`PAY-${Date.now()}` }) : api.post("/api/finance/payment", body).then(r=>r.data);
export const getFeeTypes       = (tenantId: string)               => M ? ms(MOCK_FEE_TYPES) : api.get("/api/finance/fee-type", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createFeeType     = (body: object)                   => M ? ms({ id:uid(), ...body }) : api.post("/api/finance/fee-type", body).then(r=>r.data);
export const getFeeStructure   = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/finance/fee-structure", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createFeeStructure= (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/finance/fee-structure", body).then(r=>r.data);
export const getScholarships   = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/finance/scholarship", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const getStudentFees    = (tenantId: string, studentId?: string) => M ? ms(pg([])) : api.get("/api/finance/student-fee", { params:{tenantId,studentId,page:1,pageSize:50} }).then(r=>r.data);

// ── Admissions ────────────────────────────────────────────────────────────────
export const getInquiriesPage  = (tenantId: string, p=1, ps=50) => M ? ms(pg(MOCK_INQUIRIES,p,ps)) : api.get("/api/admissions/inquiry",   { params:{tenantId,page:p,pageSize:ps} }).then(r=>r.data);
export const createInquiry     = (body: object)                   => M ? ms({...MOCK_INQUIRIES[0], id:uid(), code:`INQ-${Date.now()}`}) : api.post("/api/admissions/inquiry", body).then(r=>r.data);
export const updateInquiry     = (id: string, body: object)       => M ? ms({}) : api.put(`/api/admissions/inquiry/${id}`, body).then(r=>r.data);
export const getApplicants     = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/admissions/applicant",  { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createApplicant   = (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/admissions/applicant", body).then(r=>r.data);

// ── Organization ──────────────────────────────────────────────────────────────
export const getSchools        = (tenantId?: string)              => M ? ms(pg(MOCK_SCHOOLS))  : api.get("/api/organization/school",      { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createSchool      = (body: object)                   => M ? ms({...MOCK_SCHOOLS[0], id:uid(), code:`SCH-${Date.now()}`}) : api.post("/api/organization/school", body).then(r=>r.data);
export const updateSchool      = (id: string, body: object)       => M ? ms({}) : api.put(`/api/organization/school/${id}`, body).then(r=>r.data);
export const getCampuses       = (tenantId?: string)              => M ? ms(pg(MOCK_CAMPUSES)) : api.get("/api/organization/campus",      { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createCampus      = (body: object)                   => M ? ms({...MOCK_CAMPUSES[0], id:uid(), code:`BR-${Date.now()}`}) : api.post("/api/organization/campus", body).then(r=>r.data);
export const updateCampus      = (id: string, body: object)       => M ? ms({}) : api.put(`/api/organization/campus/${id}`, body).then(r=>r.data);
export const getBranchPolicy   = (branchId: string)               => M ? ms({}) : api.get(`/api/organization/branches/${branchId}/policy`).then(r=>r.data);
export const getDepartments    = (tenantId: string)               => M ? ms(pg(MOCK_DEPARTMENTS)) : api.get("/api/organization/department", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createDepartment  = (body: object)                   => M ? ms({...MOCK_DEPARTMENTS[0], id:uid()}) : api.post("/api/organization/department", body).then(r=>r.data);
export const deleteDepartment  = (id: string, tenantId: string)   => M ? ms({}) : api.delete(`/api/organization/department/${id}`, { params:{tenantId} }).then(r=>r.data);
export const getBranchGenderTypes = ()                            => M ? ms(MOCK_BRANCH_GENDER_TYPES) : api.get("/api/organization/lookups/branch-gender-types").then(r=>r.data);
export const getEducationLevels   = ()                            => M ? ms(MOCK_EDUCATION_LEVELS) : api.get("/api/organization/lookups/education-levels").then(r=>r.data);

// ── Academics ─────────────────────────────────────────────────────────────────
export const getAcademicSystems= (tenantId: string)               => M ? ms(page(MOCK_ACADEMIC_SYSTEMS)) : api.get("/api/academics/academic-system", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createAcademicSystem=(body: object)                  => M ? ms({ id:uid() }) : api.post("/api/academics/academic-system", body).then(r=>r.data);
export const getAcademicYears  = (tenantId: string, campusId?: string) => M ? ms(pg(MOCK_ACADEMIC_YEARS)) : api.get("/api/academics/academic-year", { params:{tenantId,campusId,page:1,pageSize:200} }).then(r=>r.data);
export const createAcademicYear= (body: object)                   => M ? ms({...MOCK_ACADEMIC_YEARS[0], id:uid()}) : api.post("/api/academics/academic-year", body).then(r=>r.data);
export const deleteAcademicYear= (id: string, tenantId: string)   => M ? ms({}) : api.delete(`/api/academics/academic-year/${id}`, { params:{tenantId} }).then(r=>r.data);
export const getGradeLevels    = (tenantId: string)               => M ? ms(pg(MOCK_GRADE_LEVELS)) : api.get("/api/academics/grade-level",   { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createGradeLevel  = (body: object)                   => M ? ms({...MOCK_GRADE_LEVELS[0], id:uid()}) : api.post("/api/academics/grade-level", body).then(r=>r.data);
export const getClassSections  = (tenantId: string)               => M ? ms(pg(MOCK_CLASS_SECTIONS)) : api.get("/api/academics/class-section",  { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createClassSection= (body: object)                   => M ? ms({...MOCK_CLASS_SECTIONS[0], id:uid()}) : api.post("/api/academics/class-section", body).then(r=>r.data);
export const getSubjects       = (tenantId: string)               => M ? ms(pg(MOCK_SUBJECTS)) : api.get("/api/academics/subject",          { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createSubject     = (body: object)                   => M ? ms({...MOCK_SUBJECTS[0], id:uid()}) : api.post("/api/academics/subject", body).then(r=>r.data);
export const getTimetable      = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/academics/timetable",         { params:{tenantId,page:1,pageSize:200} }).then(r=>r.data);
export const getCourseOfferings= (tenantId: string)               => M ? ms(pg([])) : api.get("/api/academics/course-offering",   { params:{tenantId,page:1,pageSize:200} }).then(r=>r.data);
export const getPrograms       = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/academics/program",           { params:{tenantId,page:1,pageSize:50}  }).then(r=>r.data);
export const getTerms          = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/academics/term",              { params:{tenantId,page:1,pageSize:50}  }).then(r=>r.data);

// ── Tenancy ───────────────────────────────────────────────────────────────────
export const getTenants        = ()                               => M ? ms(pg(MOCK_TENANTS)) : api.get("/api/tenancy/tenant").then(r=>r.data);
export const createTenant      = (body: object)                   => M ? ms({ tenantId:uid(), id:uid(), code:`TNT-${Date.now()}`, name:(body as any).name, adminAccount:{ userId:uid(), email:(body as any).adminEmail, temporaryPassword:"TempPass123!", mustChangePassword:true } }) : api.post("/api/tenancy/tenant", body).then(r=>r.data);
export const getCampusBranding = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/tenancy/campus-branding", { params:{tenantId,page:1,pageSize:20} }).then(r=>r.data);

// ── Transport ─────────────────────────────────────────────────────────────────
export const getVehicles       = (tenantId: string)               => M ? ms(pg(MOCK_VEHICLES)) : api.get("/api/transport/vehicle", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createVehicle     = (body: object)                   => M ? ms({...MOCK_VEHICLES[0], id:uid()}) : api.post("/api/transport/vehicle", body).then(r=>r.data);
export const getRoutes         = (tenantId: string)               => M ? ms(pg(MOCK_ROUTES)) : api.get("/api/transport/route",   { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createRoute       = (body: object)                   => M ? ms({...MOCK_ROUTES[0], id:uid()}) : api.post("/api/transport/route", body).then(r=>r.data);
export const getStops          = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/transport/stop",    { params:{tenantId,page:1,pageSize:200} }).then(r=>r.data);
export const getStudentTransport=(tenantId: string)               => M ? ms(pg([])) : api.get("/api/transport/student-transport", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);

// ── Library ───────────────────────────────────────────────────────────────────
export const getBooks          = (tenantId: string)               => M ? ms(pg(MOCK_BOOKS)) : api.get("/api/library/book",      { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createBook        = (body: object)                   => M ? ms({...MOCK_BOOKS[0], id:uid()}) : api.post("/api/library/book", body).then(r=>r.data);
export const getLoans          = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/library/loan",      { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createLoan        = (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/library/loan", body).then(r=>r.data);
export const getReservations   = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/library/reservation", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);

// ── Examinations ──────────────────────────────────────────────────────────────
export const getExams          = (tenantId: string)               => M ? ms(pg(MOCK_EXAMS)) : api.get("/api/examinations/exam",        { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createExam        = (body: object)                   => M ? ms({...MOCK_EXAMS[0], id:uid()}) : api.post("/api/examinations/exam", body).then(r=>r.data);
export const getGradeScales    = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/examinations/grade-scale",   { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getExamResults    = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/examinations/student-exam-result", { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);

// ── Payroll ───────────────────────────────────────────────────────────────────
export const getPayrollRuns    = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/payroll/payroll-run",          { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createPayrollRun  = (body: object)                   => M ? ms({ id:uid() }) : api.post("/api/payroll/payroll-run", body).then(r=>r.data);
export const getSalaryStructures=(tenantId: string)               => M ? ms(pg([])) : api.get("/api/payroll/salary-structure",    { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getPayslips       = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/payroll/payslip",             { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);

// ── Learning ──────────────────────────────────────────────────────────────────
export const getAssignments    = (tenantId: string)               => M ? ms(pg(MOCK_ASSIGNMENTS)) : api.get("/api/learning/assignment",          { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createAssignment  = (body: object)                   => M ? ms({...MOCK_ASSIGNMENTS[0], id:uid()}) : api.post("/api/learning/assignment", body).then(r=>r.data);
export const getLessons        = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/learning/lesson",              { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const getLearningResources=(tenantId: string)              => M ? ms(pg([])) : api.get("/api/learning/learning-resource",   { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);

// ── Activities ────────────────────────────────────────────────────────────────
export const getActivities     = (tenantId: string)               => M ? ms(pg(MOCK_ACTIVITIES)) : api.get("/api/activities/activity",      { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createActivity    = (body: object)                   => M ? ms({...MOCK_ACTIVITIES[0], id:uid()}) : api.post("/api/activities/activity", body).then(r=>r.data);
export const getAwards         = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/activities/award",          { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);

// ── Workflow ──────────────────────────────────────────────────────────────────
export const getWorkflowDefs   = (tenantId: string)               => M ? ms(pg(MOCK_WORKFLOW_DEFS)) : api.get("/api/workflow/workflow-definition", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getApprovals      = (tenantId: string)               => M ? ms(pg(MOCK_APPROVALS)) : api.get("/api/workflow/approval",          { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const processApproval   = (id: string, body: object)       => M ? ms({}) : api.put(`/api/workflow/approval/${id}`, body).then(r=>r.data);
export const getWorkflowInstances=(tenantId: string)              => M ? ms(pg([])) : api.get("/api/workflow/workflow-instance",  { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);

// ── Inventory ─────────────────────────────────────────────────────────────────
export const getInventoryItems = (tenantId: string)               => M ? ms(pg(MOCK_INVENTORY)) : api.get("/api/inventory/item",           { params:{tenantId,page:1,pageSize:100} }).then(r=>r.data);
export const createInventoryItem=(body: object)                   => M ? ms({...MOCK_INVENTORY[0], id:uid()}) : api.post("/api/inventory/item", body).then(r=>r.data);
export const getPurchaseOrders = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/inventory/purchase-order",   { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createPurchaseOrder=(body: object)                   => M ? ms({ id:uid() }) : api.post("/api/inventory/purchase-order", body).then(r=>r.data);

// ── Documents ─────────────────────────────────────────────────────────────────
export const getDocumentTemplates=(tenantId: string)              => M ? ms(pg([])) : api.get("/api/documents/document-template", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getSchoolLogos    = (tenantId: string)               => M ? ms(pg([])) : api.get("/api/documents/school-logo",       { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);

// ── Communication ─────────────────────────────────────────────────────────────
export const getNotifications  = (tenantId: string, recipientUserId: string, p=1, ps=30) =>
  M ? ms(pg(MOCK_NOTIFICATIONS,p,ps)) : api.get("/api/communication/notification", { params:{tenantId,recipientUserId,page:p,pageSize:ps} }).then(r=>r.data);
export const getUnreadCount    = (tenantId: string, recipientUserId: string) =>
  M ? ms({ unreadCount: MOCK_NOTIFICATIONS.filter(n=>!n.isRead).length }) : api.get("/api/communication/notification/unread-count", { params:{tenantId,recipientUserId} }).then(r=>r.data);
export const markNotifRead     = (id: string, tenantId: string, uid2: string) =>
  M ? ms({}) : api.patch(`/api/communication/notification/${id}/read`, null, { params:{tenantId,recipientUserId:uid2} }).then(r=>r.data);
export const markAllRead       = (tenantId: string, uid2: string) =>
  M ? ms({}) : api.patch("/api/communication/notification/read-all", null, { params:{tenantId,recipientUserId:uid2} }).then(r=>r.data);
export const getConversations  = (tenantId: string)               => M ? ms(MOCK_CONVERSATIONS) : api.get("/api/communication/conversation", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getMessages       = (tenantId: string, conversationId: string) =>
  M ? ms(MOCK_MESSAGES.filter(m=>{ const meta = JSON.parse(m.metadataJson??"{}"); return meta.convId === conversationId; }))
    : api.get("/api/communication/message", { params:{tenantId,conversationId,page:1,pageSize:50} }).then(r=>r.data);
export const sendMessage       = (tenantId: string, conversationId: string, text: string, senderUserId: string) =>
  M ? ms({ id:uid(), code:`MSG-${Date.now()}`, name:text, tenantId, metadataJson:JSON.stringify({ convId:conversationId, sender:"Me", text, sentAt:new Date().toISOString() }) })
    : api.post("/api/communication/message", { tenantId, conversationId, message:text, senderUserId }).then(r=>r.data);
export const createConversation= (body: object)                   => M ? ms({ id:uid(), code:`CV-${Date.now()}`, name:(body as any).title, tenantId:"t1", metadataJson:"{}" }) : api.post("/api/communication/conversation", body).then(r=>r.data);
export const createNotification= (body: object)                   => M ? ms({}) : api.post("/api/communication/notification", body).then(r=>r.data);

// ── AICore ────────────────────────────────────────────────────────────────────
export const getModelConfigs   = (tenantId: string)               => M ? ms(pg(MOCK_MODEL_CONFIGS)) : api.get("/api/aicore/model-configuration",  { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createModelConfig = (body: object)                   => M ? ms({...MOCK_MODEL_CONFIGS[0], id:uid()}) : api.post("/api/aicore/model-configuration", body).then(r=>r.data);
export const getCollections    = (tenantId: string)               => M ? ms(pg(MOCK_COLLECTIONS)) : api.get("/api/aicore/knowledge-collection",  { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const createCollection  = (body: object)                   => M ? ms({...MOCK_COLLECTIONS[0], id:uid()}) : api.post("/api/aicore/knowledge-collection", body).then(r=>r.data);
export const indexKnowledge    = (body: object)                   => M ? ms({ queued:true }) : api.post("/api/aicore/knowledge/index", body).then(r=>r.data);
export const executeAI         = (body: object)                   => M ? ms(MOCK_AI_RESPONSE) : api.post("/api/aicore/execute", body).then(r=>r.data);
export const getExecLogs       = (tenantId: string)               => M ? ms(pg(MOCK_EXEC_LOGS)) : api.get("/api/aicore/ai-execution-log", { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);
export const getPromptTemplates= (tenantId: string)               => M ? ms(pg([])) : api.get("/api/aicore/prompt-template",   { params:{tenantId,page:1,pageSize:50} }).then(r=>r.data);

// ── AI Chat / Chatbots ─────────────────────────────────────────────────────────
export const askChatbot        = (bot: string, body: { question:string; tenantId?:string }) =>
  M ? ms(MOCK_AI_RESPONSE) : api.post(`/api/chatbots/${bot}/ask`, body).then(r=>r.data);
export const askAssistant      = (body: { question:string; tenantId?:string; collections?:string[] }) =>
  M ? ms(MOCK_AI_RESPONSE) : api.post("/api/ai/assistant/ask", body).then(r=>r.data);

// ── AITutor operational ────────────────────────────────────────────────────────
export const startTutorSession = (body: object) =>
  M ? ms({ sessionId:uid(), conversationId:uid() }) : api.post("/api/aitutor/operations/sessions", body).then(r=>r.data);
export const askTutor          = (body: object) =>
  M ? ms({ messageId:uid(), answer:"Let me help you understand this concept. Here is a step-by-step explanation tailored to your level…", model:"llama3.2" }) : api.post("/api/aitutor/operations/ask", body).then(r=>r.data);
export const generateQuiz      = (body: object) =>
  M ? ms({ quizId:uid(), questions:[
      { question:"What is 2 + 2?",         options:["2","3","4","5"],                           correctAnswer:"4",          explanation:"2+2=4 (basic arithmetic)" },
      { question:"Capital of Pakistan?",    options:["Lahore","Karachi","Islamabad","Quetta"],   correctAnswer:"Islamabad",  explanation:"Islamabad became capital in 1966." },
      { question:"H₂O is the formula for?",options:["Carbon dioxide","Water","Oxygen","Nitrogen"],correctAnswer:"Water",     explanation:"H₂O = 2 Hydrogen + 1 Oxygen = Water." },
  ]})
  : api.post("/api/aitutor/operations/quizzes/generate", body).then(r=>r.data);
export const getTutorRec       = (body: object) =>
  M ? ms({ recommendationId:uid(), recommendation:"Review Chapter 5 exercises daily. Focus on problem-solving techniques before moving to Chapter 6." })
    : api.post("/api/aitutor/operations/recommendations/generate", body).then(r=>r.data);

// ── AIPrediction ──────────────────────────────────────────────────────────────
export const predictStudent    = (kind: string, body: object) =>
  M ? ms(MOCK_PREDICTION) : api.post(`/api/aiprediction/student/${kind}`, body).then(r=>r.data);
export const getEarlyWarnings  = (body: object) =>
  M ? ms(MOCK_EARLY_WARNINGS) : api.post("/api/aiprediction/early-warning", body).then(r=>r.data);
export const predictAdmission  = (kind: string, body: object) =>
  M ? ms({ ...MOCK_PREDICTION, kind:`admission-${kind}` }) : api.post(`/api/aiprediction/admission/${kind}`, body).then(r=>r.data);
export const predictTeacher    = (kind: string, body: object) =>
  M ? ms({ ...MOCK_PREDICTION, kind:`teacher-${kind}` }) : api.post(`/api/aiprediction/teacher/${kind}`, body).then(r=>r.data);
export const predictForecast   = (kind: string, body: object) =>
  M ? ms({ ...MOCK_PREDICTION, kind:`forecast-${kind}` }) : api.post(`/api/aiprediction/forecast/${kind}`, body).then(r=>r.data);

// ── AIParent ──────────────────────────────────────────────────────────────────
export const askParentAI       = (body: { message:string; tenantId?:string; guardianId?:string }) =>
  M ? ms({ answer:"Your child Ahmed Hassan has an outstanding fee balance of PKR 4,500 for September. Attendance this month is 88%. Next exam: Mid-Term on October 1st.", conversationId:uid() })
    : api.post("/api/aiparent/parent-message", body).then(r=>r.data);

// ── AIInquiry (Admissions chatbot) ────────────────────────────────────────────
export const handleInquiryAI   = (body: { message:string; tenantId?:string }) =>
  M ? ms({ answer:"Welcome! Al-Noor Academy offers Matric (BISE Punjab), FSc, and Cambridge O/A Level programmes. Admissions are open for 2026–27. Would you like to schedule a visit?", conversationId:uid() })
    : api.post("/api/aiinquiry/inquiry-message", body).then(r=>r.data);

// ── Lookups ───────────────────────────────────────────────────────────────────
export const getLookupTypes    = ()                               => M ? ms(MOCK_LOOKUP_TYPES) : api.get("/api/lookups/types").then(r=>r.data);
export const getLookupValues   = (typeCode: string)               => M ? ms(MOCK_LOOKUP_VALUES.filter(v=>v.typeCode===typeCode)) : api.get(`/api/lookups/${typeCode}`).then(r=>r.data);
export const createLookup      = (body: object)                   => M ? ms({...MOCK_LOOKUP_VALUES[0], id:uid()}) : api.post("/api/lookups", body).then(r=>r.data);
export const deleteLookup      = (id: string)                     => M ? ms({}) : api.delete(`/api/lookups/${id}`).then(r=>r.data);
export const getAllLookups      = ()                               => M ? ms(MOCK_LOOKUP_VALUES) : api.get("/api/lookups").then(r=>r.data);
export const getGeography      = (type: "countries"|"provinces"|"cities") => M ? ms([]) : api.get(`/api/lookups/geography/${type}`).then(r=>r.data);

// ── Teachers ──────────────────────────────────────────────────────────────────
export const getTeacherMe      = ()                               => M ? ms(MOCK_EMPLOYEES[0]) : api.get("/api/teachers/me").then(r=>r.data);
export const getTeacherStudents= (id: string, tenantId: string)   => M ? ms(MOCK_STUDENTS.slice(0,6)) : api.get(`/api/teachers/${id}/students`, { params:{tenantId} }).then(r=>r.data);
export const getTeacherClasses = (id: string, tenantId: string)   => M ? ms([]) : api.get(`/api/teachers/${id}/classes`,   { params:{tenantId} }).then(r=>r.data);
export const getTeacherTimetable=(id: string, tenantId: string)   => M ? ms([]) : api.get(`/api/teachers/${id}/timetable`, { params:{tenantId} }).then(r=>r.data);
export const getTeacherWorkload= (id: string, tenantId: string)   => M ? ms({ employeeId:id, activeAssignments:4, periodsPerWeek:20, classes:4 }) : api.get(`/api/teachers/${id}/workload`, { params:{tenantId} }).then(r=>r.data);
export const createTeacherAssignment=(id: string, body: object)   => M ? ms({ assignmentId:uid() }) : api.post(`/api/teachers/${id}/assignments`, body).then(r=>r.data);
export const applyTeacherLeave = (id: string, body: object)       => M ? ms({ leaveRequestId:uid(), status:"PENDING" }) : api.post(`/api/teachers/${id}/leave`, body).then(r=>r.data);

// ── Audit ─────────────────────────────────────────────────────────────────────
export const getAuditLogs      = (tenantId: string, p=1, ps=50)  => M ? ms(pg([],p,ps)) : api.get("/api/audit/audit-log", { params:{tenantId,page:p,pageSize:ps} }).then(r=>r.data);

// ── Identity ──────────────────────────────────────────────────────────────────
export const impersonateUser   = (body: { targetUserId:string; tenantId?:string; reason?:string }) =>
  M ? ms({ token:"mock_token", refreshToken:"mock_refresh" }) : api.post("/api/identity/users/impersonation/start", body).then(r=>r.data);

// ── Workflow catalog ──────────────────────────────────────────────────────────
export const getWorkflowCatalog= ()                               => M ? ms([]) : api.get("/api/workflows/catalog").then(r=>r.data);

// ── Missing adapters (added to satisfy new hooks) ─────────────────────────────
export const createGradeScale  = (body: object) => M ? ms({ id:uid() }) : api.post("/api/examinations/grade-scale", body).then(r=>r.data);
export const createLesson      = (body: object) => M ? ms({ id:uid() }) : api.post("/api/learning/lesson", body).then(r=>r.data);
export const createAward       = (body: object) => M ? ms({ id:uid() }) : api.post("/api/activities/award", body).then(r=>r.data);
export const createWorkflowDef = (body: object) => M ? ms({ id:uid() }) : api.post("/api/workflow/workflow-definition", body).then(r=>r.data);

// ── Knowledge / RAG document upload ───────────────────────────────────────────
export const uploadKnowledgeDoc = (collectionId: string, file: File, tenantId: string): Promise<{id:string;title:string;chunks:number;status:string}> => {
  if (M) return ms({ id: uid(), title: file.name, chunks: Math.floor(file.size/800)+1, status:"INDEXED" }, 1500) as any;
  const form = new FormData();
  form.append("file", file);
  form.append("collectionId", collectionId);
  form.append("tenantId", tenantId);
  form.append("title", file.name);
  return api.post("/api/aicore/knowledge/upload", form, { headers:{"Content-Type":"multipart/form-data"} }).then(r=>r.data);
};

// ── Exam result entry ─────────────────────────────────────────────────────────
export const enterExamResult  = (body: object) => M ? ms({ id:uid(), status:"ENTERED" }, 300) : api.post("/api/examinations/student-exam-result", body).then(r=>r.data);
export const updateExamResult = (id: string, body: object) => M ? ms({ id, status:"UPDATED" }, 300) : api.put(`/api/examinations/student-exam-result/${id}`, body).then(r=>r.data);
export const publishResults   = (examId: string, tenantId: string) => M ? ms({ published:true, count:30 }, 800) : api.post(`/api/examinations/exam/${examId}/publish`, { tenantId }).then(r=>r.data);

// ── Assignment submission (student) ───────────────────────────────────────────
export const submitAssignment = (assignmentId: string, file: File|null, comment: string, tenantId: string, studentId: string) => {
  if (M) return ms({ id:uid(), status:"SUBMITTED", submittedAt: new Date().toISOString() }, 700);
  const form = new FormData();
  if (file) form.append("file", file);
  form.append("assignmentId", assignmentId);
  form.append("comment", comment);
  form.append("tenantId", tenantId);
  form.append("studentId", studentId);
  return api.post("/api/learning/assignment-submission", form, { headers:{"Content-Type":"multipart/form-data"} }).then(r=>r.data);
};
export const gradeSubmission  = (submissionId: string, body: object) => M ? ms({ id: submissionId, graded:true }, 400) : api.put(`/api/learning/assignment-submission/${submissionId}/grade`, body).then(r=>r.data);
export const getSubmissions   = (assignmentId: string, tenantId: string) => M ? ms(pg([], 1, 50)) : api.get("/api/learning/assignment-submission", { params:{assignmentId, tenantId, page:1, pageSize:100} }).then(r=>r.data);

// ── Leave management ──────────────────────────────────────────────────────────
export const approveLeave     = (id: string, body: object) => M ? ms({ id, status:"APPROVED" }, 400) : api.put(`/api/hr/leave-request/${id}/approve`, body).then(r=>r.data);
export const rejectLeave      = (id: string, body: object) => M ? ms({ id, status:"REJECTED" }, 400) : api.put(`/api/hr/leave-request/${id}/reject`, body).then(r=>r.data);

// ── Attendance (real save) ────────────────────────────────────────────────────
export const saveAttendanceBulk = (body: object) => M ? ms({ saved:true, count:(body as any).records?.length ?? 0 }, 600) : api.post("/api/students/attendance", body).then(r=>r.data);

// ── Quiz submission (student) ─────────────────────────────────────────────────
export const submitQuizAttempt = (body: object) => M ? ms({ id:uid(), score:0, passed:false }, 500) : api.post("/api/aitutor/operations/quizzes/submit", body).then(r=>r.data);

// ── Chatbot with conversation history ────────────────────────────────────────
export const sendChatbotMessage = (bot: string, body: { message: string; conversationId?: string; tenantId: string; contextId?: string }) =>
  M ? ms({ answer: MOCK_AI_RESPONSE.answer, conversationId: uid(), citations: MOCK_AI_RESPONSE.citations }, 900) :
  api.post(`/api/chatbots/${bot}/ask`, body).then(r=>r.data);
