/**
 * SmartSchool Backend Contract Types
 * Precisely mirroring every C# Request/Response record from the backend source.
 *
 * Strategy for MetadataJson modules:
 *   - Backend stores domain fields in MetadataJson (JSON string)
 *   - We define a typed "domain payload" interface for each entity
 *   - Helpers serialize payload → MetadataJson on write, parse on read
 */

// ─── Core pagination ──────────────────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ─── MetadataJson base ────────────────────────────────────────────────────────
export interface MetaEntity {
  tenantId: string;
  id: string;
  code: string;
  name: string;
  metadataJson?: string | null;
}

// ─── Serialization helpers ────────────────────────────────────────────────────
export function toMetaJson<T extends object>(payload: T): string {
  return JSON.stringify(payload);
}
export function fromMetaJson<T>(json?: string | null): Partial<T> {
  if (!json) return {};
  try { return JSON.parse(json) as T; } catch { return {}; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD — exact SQL projections from DashboardEndpoints.cs
// ═══════════════════════════════════════════════════════════════════════════════
export interface AdminDashboard {
  Students: number; Guardians: number; Employees: number;
  Exams: number; Invoices: number; OutstandingInvoices: number;
  UnreadNotifications: number; Vehicles: number; Drivers: number;
}
export interface StudentDashboard {
  StudentId: string; StudentNumber: string; FirstName: string;
  LastName?: string; Status: string;
  Enrollments: number; Results: number; OutstandingInvoices: number;
}
export interface TeacherDashboard {
  EmployeeId: string; EmployeeNumber: string; FirstName: string;
  LastName?: string; Status: string;
  CourseAssignments: number; PendingLeaves: number;
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

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENTS — GetStudentPage.Response (real domain fields from DB columns)
// ═══════════════════════════════════════════════════════════════════════════════
export interface StudentListItem {
  TenantId: string;
  Id: string;            // student_id
  StudentNumber?: string;
  FirstName: string;
  LastName?: string;
  DateOfBirth?: string;
  Gender?: string;
  AdmissionDate?: string;
  Status: string;
}

// CreateStudent.Request — all fields sent to POST /api/students/student
export interface CreateStudentRequest {
  TenantId?: string;
  SchoolId: string;
  BranchId: string;
  AcademicYearId: string;
  ClassSectionId: string;
  UserId?: string;
  FirstName: string;
  LastName?: string;
  DateOfBirth?: string;  // "YYYY-MM-DD"
  Gender?: string;
  AdmissionDate?: string;
}

// CreateEnrollment.Request — separate enrolment after student exists
export interface CreateEnrollmentRequest {
  TenantId: string;
  StudentId: string;
  AcademicYearId: string;
  ClassSectionId: string;
  EnrollmentDate: string; // "YYYY-MM-DD"
  Status: string;         // "ACTIVE" | "INACTIVE" | ...
}

// ═══════════════════════════════════════════════════════════════════════════════
// HR — GetEmployeePage.Response
// ═══════════════════════════════════════════════════════════════════════════════
export interface EmployeeListItem {
  TenantId: string;
  Id: string;            // employee_id
  EmployeeNumber?: string;
  FirstName: string;
  LastName?: string;
  CnicNumber?: string;
  Email?: string;
  Phone?: string;
  HireDate: string;
  EmploymentTypeCode: string;
  StaffType: string;
  Status: string;
}

// CreateEmployee.Request — exact C# record
export interface CreateEmployeeRequest {
  TenantId?: string;
  SchoolId: string;
  BranchId: string;
  DepartmentId?: string;
  UserId?: string;
  FirstName: string;
  LastName?: string;
  CnicNumber?: string;
  Email?: string;
  Phone?: string;
  AlternatePhone?: string;
  Address?: string;
  EmergencyContactName?: string;
  EmergencyContactPhone?: string;
  HireDate: string;       // "YYYY-MM-DD"
  EmploymentTypeCode: string;
  StaffType: string;
  SourceCandidateId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ORGANIZATION — Campus.Request / School.Request / Department.Request
// ═══════════════════════════════════════════════════════════════════════════════
export interface CreateSchoolRequest {
  TenantId: string;
  Name: string;
  RegistrationNumber?: string;
  Email?: string;
  Phone?: string;
  Fax?: string;
  Website?: string;
  Address?: string;
  City?: string;
  Province?: string;
  Country?: string;
  LogoUrl?: string;
}

export interface SchoolListItem {
  TenantId: string; Id: string; Code: string; Name: string;
  RegistrationNumber?: string; Email?: string; Phone?: string;
  Fax?: string; Website?: string; Address?: string;
  City?: string; Province?: string; Country?: string; LogoUrl?: string;
}

export interface CreateCampusRequest {
  TenantId?: string;
  SchoolId: string;
  Name: string;
  BranchType: string;           // "PRIMARY" | "SECONDARY" | "HIGHER_SECONDARY" | ...
  BranchGenderTypeId: string;   // Lookup Guid
  EducationLevelIds: string[];  // Array of Guid
  Address?: string;
  City?: string;
  Province?: string;
  Country?: string;
  Phone?: string;
  Fax?: string;
  Mobile?: string;
  Email?: string;
  LogoUrl?: string;
}

export interface CampusListItem {
  TenantId: string; Id: string; Code: string; Name: string;
  BranchType: string; BranchGenderTypeId: string;
  EducationLevelIds: string[];
  Address?: string; City?: string; Phone?: string; Email?: string;
}

export interface CreateDepartmentRequest {
  TenantId: string;
  CampusId: string;
  HeadOfDepartmentEmployeeId?: string;
  Name: string;
  Telephone?: string;
  Email?: string;
}

export interface DepartmentListItem extends MetaEntity {
  Telephone?: string; Email?: string;
  CampusId?: string; HeadOfDepartmentEmployeeId?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACADEMICS — AcademicYear / GradeLevel / ClassSection / Subject
// ═══════════════════════════════════════════════════════════════════════════════
export interface CreateAcademicYearRequest {
  TenantId: string;
  CampusId: string;
  Name: string;
  StartDate: string;  // "YYYY-MM-DD"
  EndDate: string;
  IsCurrent: boolean;
}

export interface CreateGradeLevelRequest {
  TenantId: string;
  Name: string;
}

export interface CreateClassSectionRequest {
  TenantId: string;
  Name: string;
}

export interface CreateSubjectRequest {
  TenantId: string;
  BranchId: string;
  Name: string;
}

// All return MetaEntity shape: { TenantId, Id, Code, Name, MetadataJson }

// ═══════════════════════════════════════════════════════════════════════════════
// TENANCY — CreateTenant.Request + Response
// ═══════════════════════════════════════════════════════════════════════════════
export interface CreateTenantRequest {
  Name: string;
  AdminFirstName: string;
  AdminLastName: string;
  AdminEmail: string;
  AdminPhoneNumber?: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone: string;
  ContactAddress: string;
}

export interface TenantListItem extends MetaEntity {}  // {TenantId,Id,Code,Name,MetadataJson}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE — MetadataJson modules
// All finance Create requests use: { TenantId, Name, MetadataJson }
// Domain fields we store inside MetadataJson:
// ═══════════════════════════════════════════════════════════════════════════════

// Invoice MetadataJson payload
export interface InvoiceMeta {
  studentId: string;
  studentName?: string;
  academicYearId?: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;                 // PENDING | PAID | OVERDUE | CANCELLED | PARTIAL
  totalAmount: number;
  balanceAmount: number;
  paidAmount: number;
  feeTypeCode?: string;
  feeTypeName?: string;
  notes?: string;
}

// CreateInvoice request body  { TenantId, Name, MetadataJson }
export interface CreateInvoiceBody {
  TenantId: string;
  Name: string;                   // e.g. "INV-2026-0892"
  MetadataJson: string;           // toMetaJson(InvoiceMeta)
}

// Payment MetadataJson payload
export interface PaymentMeta {
  studentId: string;
  invoiceId: string;
  invoiceName?: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;          // Cash | Bank Transfer | Online | Cheque
  referenceNo?: string;
  notes?: string;
}

export interface CreatePaymentBody {
  TenantId: string;
  Name: string;
  MetadataJson: string;
}

// FeeType MetadataJson payload
export interface FeeTypeMeta {
  description?: string;
  category?: string;             // TUITION | TRANSPORT | LIBRARY | LAB | SPORTS | ADMISSION | OTHER
  isRecurring?: boolean;
  frequency?: string;            // MONTHLY | QUARTERLY | ANNUALLY | ONE_TIME
  defaultAmount?: number;
}

export interface CreateFeeTypeBody {
  TenantId: string;
  Name: string;
  MetadataJson: string;
}

// FeeStructure MetadataJson payload
export interface FeeStructureMeta {
  gradeLevelId?: string;
  gradeLevelName?: string;
  academicYearId?: string;
  feeTypeId?: string;
  feeTypeName?: string;
  amount: number;
  dueDay?: number;               // day of month
  frequency?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMISSIONS — MetadataJson module
// Domain fields stored in MetadataJson:
// ═══════════════════════════════════════════════════════════════════════════════

export interface InquiryMeta {
  applicantFirstName: string;
  applicantLastName?: string;
  dateOfBirth?: string;
  gender?: string;
  gradeApplied?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianCnic?: string;
  sourceOfInquiry?: string;      // Walk-In | Website | Referral | AI Chatbot | Social Media | Phone
  status: string;                // NEW | UNDER_REVIEW | TEST_SCHEDULED | APPROVED | REJECTED | ENROLLED | WITHDRAWN
  notes?: string;
  inquiryDate: string;
  testDate?: string;
  interviewDate?: string;
  previousSchool?: string;
  siblingsEnrolled?: number;
}

export interface CreateInquiryBody {
  TenantId: string;
  Name: string;                  // applicant display name
  MetadataJson: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARY — MetadataJson module
// ═══════════════════════════════════════════════════════════════════════════════

export interface BookMeta {
  isbn?: string;
  title: string;
  authorText?: string;
  publisherText?: string;
  edition?: string;
  publicationYear?: number;
  category?: string;             // Textbook | Reference | Fiction | Non-Fiction | ...
  language?: string;
  totalCopies?: number;
  availableCopies?: number;
  shelfLocation?: string;
  subject?: string;
  gradeLevel?: string;
}

export interface CreateBookBody {
  TenantId: string;
  Name: string;                  // book title
  MetadataJson: string;
}

export interface LoanMeta {
  bookCopyId: string;
  bookTitle?: string;
  isbn?: string;
  studentId?: string;
  studentName?: string;
  employeeId?: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  fineAmount?: number;
  finePaid?: boolean;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMINATIONS — MetadataJson module
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExamMeta {
  examType?: string;            // UNIT_TEST | MID_TERM | FINAL | MOCK | ASSIGNMENT
  academicYearId?: string;
  startDate?: string;
  endDate?: string;
  resultDate?: string;
  status: string;               // DRAFT | SCHEDULED | IN_PROGRESS | RESULT_ENTRY | PUBLISHED | CANCELLED
  totalMarks?: number;
  passingMarks?: number;
  gradeLevelIds?: string[];
  description?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSPORT — MetadataJson module
// ═══════════════════════════════════════════════════════════════════════════════

export interface VehicleMeta {
  registrationNumber?: string;
  make?: string;
  model?: string;
  year?: number;
  vehicleType?: string;         // BUS | VAN | MINI_BUS
  capacity?: number;
  color?: string;
  fuelType?: string;
  insuranceExpiry?: string;
  lastServiceDate?: string;
  status?: string;
}

export interface RouteMeta {
  routeNumber?: string;
  startPoint?: string;
  endPoint?: string;
  distanceKm?: number;
  estimatedDuration?: number;   // minutes
  departureTime?: string;
  returnTime?: string;
  isActive?: boolean;
  stopCount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL — MetadataJson module
// ═══════════════════════════════════════════════════════════════════════════════

export interface PayrollRunMeta {
  month: number;
  year: number;
  periodName: string;
  status: string;               // DRAFT | PROCESSING | COMPLETED | PAID
  totalGross?: number;
  totalDeductions?: number;
  totalNet?: number;
  employeeCount?: number;
  processedAt?: string;
  paidAt?: string;
}

export interface PayslipMeta {
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  department?: string;
  payrollRunId?: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status?: string;
  paymentDate?: string;
  paymentMethod?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI CORE — MetadataJson module
// ═══════════════════════════════════════════════════════════════════════════════

export interface ModelConfigMeta {
  provider: string;             // OpenAI | Ollama | Azure | Anthropic
  modelIdentifier: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
  roleScope?: string;           // all | student | teacher | parent | admin
  isDefault?: boolean;
  isActive?: boolean;
}

export interface KnowledgeCollectionMeta {
  slug?: string;
  description?: string;
  vectorStore?: string;         // pgvector | pinecone | weaviate
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  documentCount?: number;
  chunkCount?: number;
  lastIndexedAt?: string;
  isActive?: boolean;
  accessRoles?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNICATION — Notification
// ═══════════════════════════════════════════════════════════════════════════════

export interface NotificationItem {
  tenantId: string;
  id: string;
  recipientUserId: string;
  type: string | number;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  priority: string;            // LOW | MEDIUM | HIGH | CRITICAL
  isRead: boolean;
  readAt?: string | null;
  occurredAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════════════════════════

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
  editedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// REFERENCE / LOOKUPS
// ═══════════════════════════════════════════════════════════════════════════════

export interface LookupValue {
  id: string;
  typeCode: string;
  code: string;
  name: string;
  sortOrder?: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI Tutor / RAG
// ═══════════════════════════════════════════════════════════════════════════════

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

export interface TutorSession {
  sessionId: string;
  conversationId: string;
}

export interface TutorAnswer {
  messageId: string;
  answer: string;
  model: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  quizId: string;
  questions: QuizQuestion[];
}

export interface PredictionResult {
  kind: string;
  score: number;
  probability: number;
  riskLevel: string;
  outcome: string;
  confidence: number;
  modelVersion: string;
  usedMachineLearning: boolean;
  factors: Record<string, number>;
}
