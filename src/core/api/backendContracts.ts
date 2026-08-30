/**
 * SmartSchool Backend Contracts v2 — 100% synced with latest backend.
 * Field names, nullability and types match C# records exactly.
 * Generated from SmartSchool.zip (Aug 2026).
 *
 * API Route pattern: POST/GET /api/{moduleSegment}/{entity}
 * Modules: students | hr | finance | admissions | organization | academics
 *          tenancy | transport | library | examinations | payroll | audit
 *          communication | aicore | aiprediction | aitutor | lookups
 *          identity | activities | documents | learning | workflow | teachers
 */

// ─── Shared ─────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** {Code, Name, MetadataJson} — pattern used by: Finance, Admissions, Library,
 *  Examinations, Transport, Payroll, Audit, AICore, AITutor, AIPrediction,
 *  Academics (AcademicYear, ClassSection, GradeLevel, Subject), Tenancy, Activities */
export interface CodeNameMeta {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  metadataJson?: string | null;
}

// ─── Dashboard (DashboardEndpoints.cs) ──────────────────────────────────────
/** GET /api/dashboard/admin — NEW: includes ActiveStudents, CollectedAmount, OutstandingAmount, PassedResults, FailedResults */
export interface AdminDashboard {
  Students: number;
  Guardians: number;
  Employees: number;
  Exams: number;
  Invoices: number;
  OutstandingInvoices: number;
  UnreadNotifications: number;
  Vehicles: number;
  Drivers: number;
  ActiveStudents: number;
  CollectedAmount: number;
  OutstandingAmount: number;
  PassedResults: number;
  FailedResults: number;
}

/** GET /api/dashboard/student/{id} */
export interface StudentDashboard {
  StudentId: string;
  StudentNumber: string;
  FirstName: string;
  LastName?: string | null;
  Status: string;
  Enrollments: number;
  Results: number;
  OutstandingInvoices: number;
}

/** GET /api/dashboard/teacher/{id} */
export interface TeacherDashboard {
  EmployeeId: string;
  EmployeeNumber: string;
  FirstName: string;
  LastName?: string | null;
  Status: string;
  CourseAssignments: number;
  PendingLeaves: number;
}

/** GET /api/dashboard/parent/{id} */
export interface ParentDashboard {
  GuardianId: string;
  FullName: string;
  Email?: string | null;
  Phone?: string | null;
  Children: number;
  OutstandingInvoices: number;
}

/** GET /api/dashboard/driver/{id} */
export interface DriverDashboard {
  DriverId: string;
  DriverNumber: string;
  FullName: string;
  Phone?: string | null;
  Status: string;
  LicenseExpiresOn?: string | null;
  ActiveVehicleAssignments: number;
}

/** GET /api/dashboard/examiner */
export interface ExaminerDashboard {
  UpcomingExams: number;
  ActiveExams: number;
  ResultsPendingVerification: number;
}

// ─── Students: /api/students/* ───────────────────────────────────────────────
/** GetStudentPage.Response */
export interface StudentItem {
  tenantId: string;
  id: string;
  studentNumber?: string | null;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  admissionDate?: string | null;
  status: string;
}

/** CreateStudent.Request */
export interface CreateStudentRequest {
  tenantId?: string | null;
  schoolId: string;       // required
  branchId: string;       // required (campus)
  academicYearId: string; // required
  classSectionId: string; // required
  userId?: string | null;
  firstName: string;      // required, max 100
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  admissionDate?: string | null;
}

/** CreateGuardian.Request — NEW: userId field, cnicNumber optional */
export interface CreateGuardianRequest {
  tenantId: string;
  userId?: string | null;
  fullName: string;       // required
  cnicNumber?: string | null;
  email?: string | null;
  phone?: string | null;
}

/** CreateEnrollment.Request */
export interface CreateEnrollmentRequest {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  classSectionId: string;
  enrollmentDate: string;
  status: string;
}

// ─── HR: /api/hr/* ──────────────────────────────────────────────────────────
/** GetEmployeePage.Response — NEW: dateOfBirth, gender, jobTitle, department, qualification */
export interface EmployeeItem {
  tenantId: string;
  id: string;
  employeeNumber?: string | null;
  firstName: string;
  lastName?: string | null;
  cnicNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  qualification?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hireDate: string;
  employmentTypeCode: string;
  staffType: string;
  status: string;
}

/** CreateEmployee.Request — NEW: dateOfBirth, gender, jobTitle */
export interface CreateEmployeeRequest {
  tenantId?: string | null;
  schoolId: string;           // required
  branchId: string;           // required
  departmentId?: string | null;
  userId?: string | null;
  firstName: string;          // required, max 100
  lastName?: string | null;
  cnicNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hireDate: string;           // required DateOnly
  employmentTypeCode: string; // required
  /** TEACHER | DRIVER | PRINCIPAL | ADMIN_OFFICER | ACCOUNTANT | HR | LIBRARIAN | TRANSPORT | OTHER */
  staffType: string;          // required
  sourceCandidateId?: string | null;
}

// ─── Finance: /api/finance/* ────────────────────────────────────────────────
/** GetFeeTypePage.Response — NEW: no MetadataJson, explicit fields */
export interface FeeTypeItem {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  /** Monthly | Term | Annual | OneTime */
  frequency: string;
  isActive: boolean;
  description?: string | null;
}

/** CreateFeeType.Request — NEW: Frequency enum, Description */
export interface CreateFeeTypeRequest {
  tenantId: string;
  name: string;               // required, max 120
  /** Monthly | Term | Annual | OneTime */
  frequency?: string;
  description?: string | null;
}

/** CreateFeeStructure.Request — full shape */
export interface CreateFeeStructureRequest {
  tenantId: string;
  gradeLevelId: string;
  feeTypeId: string;
  amount: number;
  /** Monthly | Term | Annual | OneTime */
  frequency?: string;
  academicYearId?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

/** Finance MetadataJson pattern items (Invoice, Payment, Scholarship, Discount, StudentFee) */
export type InvoiceItem = CodeNameMeta;
export type PaymentItem = CodeNameMeta;
export type FeeStructureItem = CodeNameMeta;

// ─── Admissions: /api/admissions/* ──────────────────────────────────────────
export type InquiryItem = CodeNameMeta;
export type ApplicationItem = CodeNameMeta;

/** CreateInquiry.Request */
export interface CreateInquiryRequest {
  tenantId: string;
  name: string;
  metadataJson?: string | null;
}

// ─── Organization: /api/organization/* ──────────────────────────────────────
/** GetSchoolPage.Response */
export interface SchoolItem {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

/** GetCampusPage.Response — NEW: academicSystemId */
export interface CampusItem {
  tenantId: string;
  id: string;
  schoolId: string;
  code: string;
  name: string;
  branchType: string;
  branchGenderTypeId: string;
  academicSystemId?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

/** GetDepartmentPage.Response — explicit fields (not MetadataJson) */
export interface DepartmentItem {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  telephone?: string | null;
  email?: string | null;
  campusId?: string | null;
  headOfDepartmentEmployeeId?: string | null;
  metadataJson?: string | null;
}

/** CreateSchool.Request */
export interface CreateSchoolRequest {
  tenantId: string;
  name: string;               // required, max 200
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  fax?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

/** CreateCampus.Request — NEW: academicSystemId optional */
export interface CreateCampusRequest {
  tenantId?: string | null;
  schoolId: string;
  name: string;               // required, max 200
  branchType: string;         // required
  branchGenderTypeId: string; // required
  academicSystemId?: string | null;
  educationLevelIds?: string[] | null; // at least one recommended
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  phone?: string | null;
  fax?: string | null;
  mobile?: string | null;
  email?: string | null;
  logoUrl?: string | null;
}

/** CreateDepartment.Request */
export interface CreateDepartmentRequest {
  tenantId: string;
  campusId: string;
  headOfDepartmentEmployeeId?: string | null;
  name: string;               // required, max 250
  telephone?: string | null;
  email?: string | null;
}

// ─── Academics: /api/academics/* ────────────────────────────────────────────
export type AcademicYearItem = CodeNameMeta;
export type GradeLevelItem = CodeNameMeta;
export type ClassSectionItem = CodeNameMeta;
export type SubjectItem = CodeNameMeta;

/** CreateAcademicYear.Request — requires CampusId */
export interface CreateAcademicYearRequest {
  tenantId: string;
  campusId: string;   // required — GetAcademicYearPage also needs campusId
  name: string;
  startDate: string;  // DateOnly
  endDate: string;    // DateOnly
  isCurrent: boolean;
}

/** CreateSubject.Request */
export interface CreateSubjectRequest {
  tenantId: string;
  branchId: string;   // required (campus)
  name: string;
}

/** CreateGradeLevel.Request */
export interface CreateGradeLevelRequest {
  tenantId: string;
  name: string;
}

/** CreateClassSection.Request */
export interface CreateClassSectionRequest {
  tenantId: string;
  name: string;
}

// ─── Tenancy: /api/tenancy/* ────────────────────────────────────────────────
export type TenantItem = CodeNameMeta;

/** CreateTenant.Request */
export interface CreateTenantRequest {
  name: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhoneNumber?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

/** CreateTenant.Response */
export interface CreateTenantResponse {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  adminAccount: {
    userId: string;
    email: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
  };
}

// ─── Transport: /api/transport/* ────────────────────────────────────────────
export type VehicleItem = CodeNameMeta;
export type RouteItem = CodeNameMeta;
export type StopItem = CodeNameMeta;

// ─── Library: /api/library/* ────────────────────────────────────────────────
export type BookItem = CodeNameMeta;
export type LoanItem = CodeNameMeta;

// ─── Examinations: /api/examinations/* ──────────────────────────────────────
export type ExamItem = CodeNameMeta;

// ─── Payroll: /api/payroll/* ────────────────────────────────────────────────
export type PayrollRunItem = CodeNameMeta;
export type PayslipItem = CodeNameMeta;

// ─── Communication: /api/communication/* ────────────────────────────────────
export interface NotificationItem {
  tenantId: string;
  id: string;
  recipientUserId: string;
  type: number | string;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  priority: string;
  isRead: boolean;
  readAt?: string | null;
  occurredAt: string;
}

export interface ChatConversation {
  tenantId: string;
  chatConversationId: string;
  title: string;
  conversationType: string;
  createdByUserId: string;
  isClosed: boolean;
}

export interface ChatMessage {
  tenantId: string;
  chatMessageId: string;
  conversationId: string;
  senderUserId: string;
  message: string;
  sentAt: string;
  editedAt?: string | null;
}

// ─── AI module responses ─────────────────────────────────────────────────────
export interface AiChatResponse {
  answer: string;
  contextStrategy: string;
  citations: AiCitation[];
}

export interface AiCitation {
  chunkId: string;
  documentTitle: string;
  relevanceScore: number;
  excerpt: string;
}

// ─── AITutor: /api/aitutor/operations/* ────────────────────────────────────
/** POST /api/aitutor/operations/sessions */
export interface StartTutorSessionRequest {
  tenantId?: string | null;
  studentId: string;
  subject: string;
  topic?: string | null;
}

/** POST /api/aitutor/operations/ask */
export interface AskTutorRequest {
  tenantId?: string | null;
  sessionId: string;
  studentId: string;
  subject: string;
  topic: string;
  message: string;
}

export interface TutorSessionResponse {
  sessionId: string;
  conversationId: string;
}

export interface TutorAnswerResponse {
  messageId: string;
  answer: string;
  model: string;
}

/** POST /api/aitutor/operations/quizzes/generate */
export interface GenerateQuizRequest {
  tenantId?: string | null;
  studentId: string;
  subject: string;
  topic: string;
  questionCount?: number;
  difficulty?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuizResponse {
  quizId: string;
  questions: QuizQuestion[];
}

// ─── AIPrediction: /api/aiprediction/* ─────────────────────────────────────
/** POST /api/aiprediction/student/{predictionKind} */
export interface StudentPredictionRequest {
  tenantId: string;
  studentId: string;
  subjectId?: string | null;
}

/** PredictionResult — Factors is now IReadOnlyList<string> not a dict */
export interface PredictionResult {
  kind: string;
  score: number;
  probability: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  outcome: string;
  confidence: number;
  modelVersion: string;
  usedMachineLearning: boolean;
  factors: string[];
}

// ─── AICore: /api/aicore/* ───────────────────────────────────────────────────
export type ModelConfigItem = CodeNameMeta;
export type KnowledgeCollectionItem = CodeNameMeta;
export type KnowledgeDocumentItem = CodeNameMeta;
export type AiExecutionLogItem = CodeNameMeta;

// ─── Reference / Lookups ────────────────────────────────────────────────────
/** POST /api/lookups */
export interface CreateLookupRequest {
  typeCode: string;   // required
  code: string;       // required
  name: string;       // required
  sortOrder?: number;
  metadata?: string | null;
}

export interface LookupValue {
  id: string;
  typeCode: string;
  code: string;
  name: string;
  sortOrder?: number | null;
  isActive: boolean;
  metadata?: string | null;
}

export interface BranchGenderType {
  id: string;
  code: string;
  name: string;
}

export interface EducationLevel {
  id: string;
  code: string;
  name: string;
}

// ─── Teachers: /api/teachers/* ──────────────────────────────────────────────
export interface TeacherProfile {
  employeeId: string;
  tenantId: string;
  userId?: string | null;
  employeeNumber?: string | null;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
}

export interface TeacherClass {
  assignmentId: string;
  courseOfferingId: string;
  classSectionId: string;
  role: string;
  periodsPerWeek: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
}

export interface TeacherStudent {
  studentId: string;
  studentNumber?: string | null;
  firstName: string;
  lastName?: string | null;
  status: string;
  classSectionId: string;
}

export interface TeacherTimetableEntry {
  timetableEntryId: string;
  dayOfWeek: number;
  period: string;
  startTime: string;
  endTime: string;
  classSectionId: string;
  courseOfferingId: string;
  roomId?: string | null;
}

export interface TeacherWorkload {
  employeeId: string;
  activeAssignments: number;
  periodsPerWeek: number;
  classes: number;
}

/** POST /api/teachers/{id}/assignments */
export interface CreateAssignmentRequest {
  tenantId?: string | null;
  courseOfferingId: string;
  classSecitonId?: string | null;
  type: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueAt?: string | null;
  totalMarks?: number | null;
  allowLateSubmission?: boolean;
  maxAttempts?: number;
}

/** POST /api/teachers/{id}/leave */
export interface CreateLeaveRequest {
  tenantId?: string | null;
  fromDate: string;
  toDate: string;
  leaveType: string;
  reason: string;
}

// ─── Workflow: /api/workflows/* ─────────────────────────────────────────────
export interface WorkflowDefinition {
  code: string;
  name: string;
  initiators: string[];
  approvers: string[];
  steps: string[];
}

// ─── Identity ────────────────────────────────────────────────────────────────
export interface ImpersonationResponse {
  token: string;
  refreshToken: string;
}
