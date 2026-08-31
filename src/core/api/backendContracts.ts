/**
 * SmartSchool Backend Contracts v3
 * 100% derived from the C# records in the uploaded backend (Aug 2026).
 * Route: GET/POST /api/{moduleSegment}/{entity}
 */

// ─── Shared ──────────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Pattern used by most entities: {TenantId, Id, Code, Name, MetadataJson?} */
export interface CodeNameMeta {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  metadataJson?: string | null;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface AdminDashboard {
  Students: number; Guardians: number; Employees: number; Exams: number;
  Invoices: number; OutstandingInvoices: number; UnreadNotifications: number;
  Vehicles: number; Drivers: number; ActiveStudents: number;
  CollectedAmount: number; OutstandingAmount: number;
  PassedResults: number; FailedResults: number;
}
export interface StudentDashboard {
  StudentId: string; StudentNumber: string; FirstName: string; LastName?: string|null;
  Status: string; Enrollments: number; Results: number; OutstandingInvoices: number;
}
export interface TeacherDashboard {
  EmployeeId: string; EmployeeNumber: string; FirstName: string; LastName?: string|null;
  Status: string; CourseAssignments: number; PendingLeaves: number;
}
export interface ParentDashboard {
  GuardianId: string; FullName: string; Email?: string|null; Phone?: string|null;
  Children: number; OutstandingInvoices: number;
}
export interface DriverDashboard {
  DriverId: string; DriverNumber: string; FullName: string; Phone?: string|null;
  Status: string; LicenseExpiresOn?: string|null; ActiveVehicleAssignments: number;
}
export interface ExaminerDashboard {
  UpcomingExams: number; ActiveExams: number; ResultsPendingVerification: number;
}

// ─── Organization: /api/organization/* ───────────────────────────────────────
/** GetSchoolPage.Response */
export interface SchoolItem {
  tenantId: string; id: string; code: string; name: string;
  registrationNumber?: string|null; email?: string|null; phone?: string|null;
  fax?: string|null; website?: string|null; address?: string|null;
  city?: string|null; province?: string|null; country?: string|null; logoUrl?: string|null;
}
/** GetCampusPage.Response */
export interface CampusItem {
  tenantId: string; id: string; schoolId: string; code: string; name: string;
  branchType: string; branchGenderTypeId: string; academicSystemId?: string|null;
  address?: string|null; city?: string|null; province?: string|null;
  country?: string|null; phone?: string|null; fax?: string|null;
  mobile?: string|null; email?: string|null; logoUrl?: string|null;
}
/** GetDepartmentPage.Response */
export interface DepartmentItem {
  tenantId: string; id: string; code: string; name: string;
  telephone?: string|null; email?: string|null;
  campusId?: string|null; headOfDepartmentEmployeeId?: string|null;
  metadataJson?: string|null;
}
/** CreateSchool.Request */
export interface CreateSchoolRequest {
  tenantId: string; name: string; registrationNumber?: string|null;
  email?: string|null; phone?: string|null; fax?: string|null;
  website?: string|null; address?: string|null; city?: string|null;
  province?: string|null; country?: string|null; logoUrl?: string|null;
}
/** CreateCampus.Request */
export interface CreateCampusRequest {
  tenantId?: string|null; schoolId: string; name: string;
  branchType: string; branchGenderTypeId: string;
  academicSystemId?: string|null;
  educationLevelIds?: string[]|null;
  address?: string|null; city?: string|null; province?: string|null;
  country?: string|null; phone?: string|null; fax?: string|null;
  mobile?: string|null; email?: string|null; logoUrl?: string|null;
}
/** CreateDepartment.Request */
export interface CreateDepartmentRequest {
  tenantId: string; campusId: string;
  headOfDepartmentEmployeeId?: string|null;
  name: string; telephone?: string|null; email?: string|null;
}

// ─── Students: /api/students/* ───────────────────────────────────────────────
export interface StudentItem {
  tenantId: string; id: string; studentNumber?: string|null;
  firstName: string; lastName?: string|null; dateOfBirth?: string|null;
  gender?: string|null; admissionDate?: string|null; status: string;
}
export interface GuardianItem {
  tenantId: string; id: string; userId?: string|null; fullName: string;
  cnicNumber?: string|null; email?: string|null; phone?: string|null;
}
export interface EnrollmentItem {
  tenantId: string; id: string; studentId: string; academicYearId: string;
  classSectionId: string; enrollmentDate: string; status: string;
}
export interface CreateStudentRequest {
  tenantId?: string|null; schoolId: string; branchId: string;
  academicYearId: string; classSectionId: string; userId?: string|null;
  firstName: string; lastName?: string|null; dateOfBirth?: string|null;
  gender?: string|null; admissionDate?: string|null;
}
export interface CreateGuardianRequest {
  tenantId: string; userId?: string|null; fullName: string;
  cnicNumber?: string|null; email?: string|null; phone?: string|null;
}
export interface CreateEnrollmentRequest {
  tenantId: string; studentId: string; academicYearId: string;
  classSectionId: string; enrollmentDate: string; status: string;
}

// ─── HR: /api/hr/* ───────────────────────────────────────────────────────────
export interface EmployeeItem {
  tenantId: string; id: string; employeeNumber?: string|null;
  firstName: string; lastName?: string|null; cnicNumber?: string|null;
  dateOfBirth?: string|null; gender?: string|null; jobTitle?: string|null;
  department?: string|null; qualification?: string|null;
  email?: string|null; phone?: string|null; alternatePhone?: string|null;
  address?: string|null; emergencyContactName?: string|null;
  emergencyContactPhone?: string|null;
  hireDate: string; employmentTypeCode: string; staffType: string; status: string;
}
export interface CreateEmployeeRequest {
  tenantId?: string|null; schoolId: string; branchId: string;
  departmentId?: string|null; userId?: string|null;
  firstName: string; lastName?: string|null; cnicNumber?: string|null;
  dateOfBirth?: string|null; gender?: string|null; jobTitle?: string|null;
  email?: string|null; phone?: string|null; alternatePhone?: string|null;
  address?: string|null; emergencyContactName?: string|null;
  emergencyContactPhone?: string|null;
  hireDate: string; employmentTypeCode: string;
  /** TEACHER|DRIVER|PRINCIPAL|ADMIN_OFFICER|ACCOUNTANT|HR|LIBRARIAN|TRANSPORT|OTHER */
  staffType: string; sourceCandidateId?: string|null;
}

// ─── Finance: /api/finance/* ─────────────────────────────────────────────────
/** GetFeeTypePage.Response — explicit fields (NOT MetadataJson) */
export interface FeeTypeItem {
  tenantId: string; id: string; code: string; name: string;
  /** Monthly|Term|Annual|OneTime */
  frequency: string; isActive: boolean; description?: string|null;
}
/** CreateFeeType.Request */
export interface CreateFeeTypeRequest {
  tenantId: string; name: string;
  frequency?: string;   // Monthly|Term|Annual|OneTime
  description?: string|null;
}
/** CreateFeeStructure.Request */
export interface CreateFeeStructureRequest {
  tenantId: string; gradeLevelId: string; feeTypeId: string;
  amount: number; frequency?: string;
  academicYearId?: string|null; effectiveFrom?: string|null; effectiveTo?: string|null;
}
export type InvoiceItem = CodeNameMeta;
export type FeeStructureItem = CodeNameMeta;
export type PaymentItem = CodeNameMeta;
export type DiscountItem = CodeNameMeta;

// ─── Admissions: /api/admissions/* ───────────────────────────────────────────
export type InquiryItem = CodeNameMeta;
export type ApplicantItem = CodeNameMeta;
export type ApplicationItem = CodeNameMeta;
export type AdmissionDecisionItem = CodeNameMeta;

// ─── Academics: /api/academics/* ─────────────────────────────────────────────
export type AcademicYearItem = CodeNameMeta;
export type GradeLevelItem = CodeNameMeta;
export type ClassSectionItem = CodeNameMeta;
export type SubjectItem = CodeNameMeta;
export type AcademicSystemItem = CodeNameMeta;
export type CourseOfferingItem = CodeNameMeta;
export type TimetableItem = CodeNameMeta;
export type ProgramItem = CodeNameMeta;
export type TermItem = CodeNameMeta;

export interface CreateAcademicYearRequest {
  tenantId: string; campusId: string; name: string;
  startDate: string; endDate: string; isCurrent: boolean;
}
export interface CreateSubjectRequest { tenantId: string; branchId: string; name: string; }
export interface CreateGradeLevelRequest { tenantId: string; name: string; }
export interface CreateClassSectionRequest { tenantId: string; name: string; }

// ─── Tenancy: /api/tenancy/* ─────────────────────────────────────────────────
export type TenantItem = CodeNameMeta;
export interface CreateTenantRequest {
  name: string; adminFirstName: string; adminLastName: string;
  adminEmail: string; adminPhoneNumber?: string|null;
  contactName: string; contactEmail: string; contactPhone: string; contactAddress: string;
}
export interface CreateTenantResponse {
  tenantId: string; id: string; code: string; name: string;
  adminAccount: { userId: string; email: string; temporaryPassword: string; mustChangePassword: boolean; };
}

// ─── Transport: /api/transport/* ─────────────────────────────────────────────
export type VehicleItem = CodeNameMeta;
export type RouteItem = CodeNameMeta;
export type StopItem = CodeNameMeta;

// ─── Library: /api/library/* ─────────────────────────────────────────────────
export type BookItem = CodeNameMeta;
export type LoanItem = CodeNameMeta;

// ─── Examinations: /api/examinations/* ───────────────────────────────────────
export type ExamItem = CodeNameMeta;
export type GradeScaleItem = CodeNameMeta;
export type StudentExamResultItem = CodeNameMeta;

// ─── Payroll: /api/payroll/* ─────────────────────────────────────────────────
export type PayrollRunItem = CodeNameMeta;
export type PayslipItem = CodeNameMeta;
export type SalaryStructureItem = CodeNameMeta;
export type EmployeeCompensationItem = CodeNameMeta;

// ─── Learning: /api/learning/* ───────────────────────────────────────────────
export type AssignmentItem = CodeNameMeta;
export type LessonItem = CodeNameMeta;
export type LearningResourceItem = CodeNameMeta;

// ─── Activities: /api/activities/* ───────────────────────────────────────────
export type ActivityItem = CodeNameMeta;
export type AwardItem = CodeNameMeta;

// ─── Workflow: /api/workflow/* ────────────────────────────────────────────────
export type WorkflowDefinitionItem = CodeNameMeta;
export type WorkflowInstanceItem = CodeNameMeta;
export type ApprovalItem = CodeNameMeta;

// ─── Inventory: /api/inventory/* ─────────────────────────────────────────────
export type InventoryItem = CodeNameMeta;
export type PurchaseOrderItem = CodeNameMeta;

// ─── Communication: /api/communication/* ─────────────────────────────────────
export interface NotificationItem {
  tenantId: string; id: string; recipientUserId: string;
  type: number|string; title: string; message: string;
  relatedEntityId?: string|null; relatedEntityType?: string|null;
  actionUrl?: string|null; priority: string; isRead: boolean;
  readAt?: string|null; occurredAt: string;
}
export interface MessageItem { tenantId: string; id: string; code: string; name: string; metadataJson?: string|null; }
export interface ConversationItem { tenantId: string; id: string; code: string; name: string; metadataJson?: string|null; }

// ─── AICore: /api/aicore/* ────────────────────────────────────────────────────
export type ModelConfigItem = CodeNameMeta;
export type KnowledgeCollectionItem = CodeNameMeta;
export type KnowledgeDocumentItem = CodeNameMeta;
export type AiExecutionLogItem = CodeNameMeta;
export type PromptTemplateItem = CodeNameMeta;

// ─── AITutor operational: /api/aitutor/operations/* ──────────────────────────
export interface StartTutorSessionRequest {
  tenantId?: string|null; studentId: string; subject: string; topic?: string|null;
}
export interface AskTutorRequest {
  tenantId?: string|null; sessionId: string; studentId: string;
  subject: string; topic: string; message: string;
}
export interface GenerateQuizRequest {
  tenantId?: string|null; studentId: string; subject: string; topic: string;
  questionCount?: number; difficulty?: string;
}
export interface TutorSessionResponse { sessionId: string; conversationId: string; }
export interface TutorAnswerResponse { messageId: string; answer: string; model: string; }
export interface QuizQuestion {
  question: string; options: string[]; correctAnswer: string; explanation: string;
}
export interface GeneratedQuizResponse { quizId: string; questions: QuizQuestion[]; }

// ─── AIPrediction: /api/aiprediction/* ───────────────────────────────────────
export interface StudentPredictionRequest {
  tenantId: string; studentId: string; subjectId?: string|null;
}
/** factors is string[] in new backend */
export interface PredictionResult {
  kind: string; score: number; probability: number;
  riskLevel: "Low"|"Medium"|"High"|"Critical";
  outcome: string; confidence: number; modelVersion: string;
  usedMachineLearning: boolean; factors: string[];
}

// ─── AI Chat responses ────────────────────────────────────────────────────────
export interface AiChatResponse {
  answer: string; contextStrategy: string; citations: AiCitation[];
}
export interface AiCitation {
  chunkId: string; documentTitle: string; relevanceScore: number; excerpt: string;
}

// ─── Lookups: /api/lookups/* ──────────────────────────────────────────────────
/** CreateLookup.Request — NO tenantId at top level */
export interface CreateLookupRequest {
  typeCode: string; code: string; name: string; sortOrder?: number; metadata?: string|null;
}
export interface LookupValue {
  id: string; typeCode: string; code: string; name: string;
  sortOrder?: number|null; isActive: boolean; metadata?: string|null;
}
export interface BranchGenderType { id: string; code: string; name: string; }
export interface EducationLevel { id: string; code: string; name: string; }

// ─── Teachers: /api/teachers/* ───────────────────────────────────────────────
export interface TeacherWorkload {
  employeeId: string; activeAssignments: number; periodsPerWeek: number; classes: number;
}
export interface CreateTeacherAssignmentRequest {
  tenantId?: string|null; courseOfferingId: string; classSectionId?: string|null;
  type: string; title: string; description?: string|null; instructions?: string|null;
  dueAt?: string|null; totalMarks?: number|null;
  allowLateSubmission?: boolean; maxAttempts?: number;
}
export interface CreateLeaveRequest {
  tenantId?: string|null; fromDate: string; toDate: string;
  leaveType: string; reason: string;
}

// ─── Identity ─────────────────────────────────────────────────────────────────
export interface ImpersonationResponse { token: string; refreshToken: string; }
