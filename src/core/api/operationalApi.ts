import { api } from "./ApiClient";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "LEAVE";

export interface AttendanceRosterRow {
  studentId: string;
  studentNumber: string;
  studentName: string;
  status?: AttendanceStatus | null;
  remarks?: string | null;
  updatedAt?: string | null;
}

export interface AttendanceRosterResponse {
  classSectionId: string;
  attendanceDate: string;
  students: AttendanceRosterRow[];
}

export interface AttendanceHistoryItem {
  attendanceId: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  classSectionId: string;
  classSectionName: string;
  attendanceDate: string;
  status: AttendanceStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface LibraryCatalogueItem {
  bookId: string;
  title: string;
  isbn?: string | null;
  author?: string | null;
  publisher?: string | null;
  totalCopies: number;
  availableCopies: number;
}

export interface LibraryLoanItem {
  loanId: string;
  bookCopyId: string;
  barcode: string;
  title: string;
  studentId?: string | null;
  employeeId?: string | null;
  borrowerName: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string | null;
  isOverdue: boolean;
}

export interface LibraryOperationsResponse {
  catalogue: LibraryCatalogueItem[];
  currentLoans: LibraryLoanItem[];
  recentReturns: LibraryLoanItem[];
}

export interface FinanceInvoiceItem {
  invoiceId: string;
  studentId: string;
  studentName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string | null;
  status: string;
  totalAmount: number;
  balanceAmount: number;
}

export interface FinancePaymentItem {
  paymentId: string;
  studentId: string;
  studentName: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: string;
  referenceNo?: string | null;
}

export interface FinanceOperationsResponse {
  invoices: FinanceInvoiceItem[];
  payments: FinancePaymentItem[];
  outstandingBalance: number;
  collectedThisMonth: number;
}

export interface PayrollCompensationItem {
  compensationId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  basicSalary: number;
  grossSalary: number;
  currencyCode: string;
  status: string;
}

export interface PayrollRunItem {
  runId: string;
  periodId: string;
  year: number;
  month: number;
  status: string;
  createdAt: string;
  approvedAt?: string | null;
  employeeCount: number;
  grossAmount: number;
  netAmount: number;
}

export interface PayrollPayslipItem {
  employeePayrollId: string;
  runId: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  year: number;
  month: number;
  grossAmount: number;
  deductionAmount: number;
  netAmount: number;
  runStatus: string;
}

export interface PayrollOperationsResponse {
  compensations: PayrollCompensationItem[];
  runs: PayrollRunItem[];
  payslips: PayrollPayslipItem[];
}

export interface TimetablePeriodItem {
  periodId: string;
  campusId: string;
  periodNumber?: number | null;
  name: string;
  startTime: string;
  endTime: string;
  periodType: string;
}

export interface TimetableItem {
  timetableId: string;
  campusId: string;
  academicYearId: string;
  termId?: string | null;
  name: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status: string;
}

export interface TimetableEntryItem {
  entryId: string;
  timetableId: string;
  dayOfWeek: number;
  periodId: string;
  periodName: string;
  classSectionId?: string | null;
  classSectionName?: string | null;
  courseOfferingId?: string | null;
  courseName?: string | null;
  teacherCourseAssignmentId?: string | null;
  teacherEmployeeId?: string | null;
  teacherName?: string | null;
  roomId?: string | null;
  roomName?: string | null;
  entryType: string;
}

export interface TimetableOperationsResponse {
  periods: TimetablePeriodItem[];
  timetables: TimetableItem[];
  entries: TimetableEntryItem[];
}

export interface CertificateTemplateItem {
  templateId: string;
  campusId?: string | null;
  documentTypeCode: string;
  code: string;
  name: string;
  bodyHtml: string;
  headerHtml?: string | null;
  footerHtml?: string | null;
  languageCode: string;
  version: number;
  requiresApproval: boolean;
}

export interface IssuedCertificateItem {
  generatedDocumentId: string;
  templateId: string;
  templateName: string;
  documentTypeCode: string;
  documentNumber: string;
  studentId?: string | null;
  employeeId?: string | null;
  ownerName: string;
  status: string;
  verificationCode?: string | null;
  issuedAt?: string | null;
  approvedBy?: string | null;
}

export interface CertificateOperationsResponse {
  templates: CertificateTemplateItem[];
  issuedDocuments: IssuedCertificateItem[];
}

export const operationalApi = {
  attendance: {
    roster: async (tenantId: string, classSectionId: string, attendanceDate: string) =>
      (await api.get<AttendanceRosterResponse>("/api/students/attendance/roster", {
        params: { tenantId, classSectionId, attendanceDate },
      })).data,
    history: async (tenantId: string, params: { classSectionId?: string; studentId?: string; fromDate?: string; toDate?: string }) =>
      (await api.get<AttendanceHistoryItem[]>("/api/students/attendance", {
        params: { tenantId, ...params },
      })).data,
    mark: async (body: {
      tenantId: string;
      classSectionId: string;
      attendanceDate: string;
      students: { studentId: string; status: AttendanceStatus; remarks?: string | null }[];
    }) => (await api.put<{ savedCount: number }>("/api/students/attendance", body)).data,
  },

  library: {
    dashboard: async (tenantId: string) =>
      (await api.get<LibraryOperationsResponse>("/api/library/operations", { params: { tenantId } })).data,
    createBook: async (body: { tenantId: string; campusId: string; title: string; isbn?: string; author?: string; publisher?: string; copyCount: number }) =>
      (await api.post<{ bookId: string; copyCount: number }>("/api/library/operations/books", body)).data,
    issue: async (body: { tenantId: string; bookId: string; studentId?: string | null; employeeId?: string | null; dueAt: string }) =>
      (await api.post<{ loanId: string; bookCopyId: string; barcode: string }>("/api/library/operations/loans", body)).data,
    returnLoan: async (tenantId: string, loanId: string) =>
      (await api.put<{ loanId: string; returnedAt: string }>(`/api/library/operations/loans/${loanId}/return`, null, { params: { tenantId } })).data,
  },

  finance: {
    dashboard: async (tenantId: string) =>
      (await api.get<FinanceOperationsResponse>("/api/finance/operations", { params: { tenantId } })).data,
    createInvoice: async (body: { tenantId: string; studentId: string; academicYearId?: string | null; invoiceDate: string; dueDate?: string | null; totalAmount: number; description?: string | null }) =>
      (await api.post("/api/finance/operations/invoices", body)).data,
    postPayment: async (body: { tenantId: string; invoiceId: string; amount: number; paymentMethod: string; referenceNo?: string | null }) =>
      (await api.post("/api/finance/operations/payments", body)).data,
  },

  payroll: {
    dashboard: async (tenantId: string) =>
      (await api.get<PayrollOperationsResponse>("/api/payroll/operations", { params: { tenantId } })).data,
    saveCompensation: async (body: { tenantId: string; employeeId: string; jobGradeId?: string | null; effectiveFrom: string; basicSalary: number; grossSalary?: number | null; currencyCode: string }) =>
      (await api.post("/api/payroll/operations/compensations", body)).data,
    createRun: async (body: { tenantId: string; year: number; month: number }) =>
      (await api.post("/api/payroll/operations/runs", body)).data,
    approveRun: async (tenantId: string, runId: string) =>
      (await api.put(`/api/payroll/operations/runs/${runId}/approve`, null, { params: { tenantId } })).data,
    employeePayslips: async (tenantId: string, employeeId: string) =>
      (await api.get<PayrollPayslipItem[]>(`/api/payroll/operations/employees/${employeeId}/payslips`, { params: { tenantId } })).data,
  },

  timetable: {
    dashboard: async (tenantId: string, timetableId?: string) =>
      (await api.get<TimetableOperationsResponse>("/api/academics/timetable-operations", { params: { tenantId, timetableId } })).data,
    createPeriod: async (body: { tenantId: string; campusId: string; periodNumber?: number | null; name: string; startTime: string; endTime: string; periodType: string }) =>
      (await api.post("/api/academics/timetable-period", body)).data,
    createTimetable: async (body: { tenantId: string; campusId: string; academicYearId: string; termId?: string | null; name: string; effectiveFrom?: string | null; effectiveTo?: string | null }) =>
      (await api.post("/api/academics/timetable-operations", body)).data,
    addEntry: async (timetableId: string, body: { tenantId: string; timetableId: string; dayOfWeek: number; periodId: string; classSectionId: string; courseOfferingId: string; teacherCourseAssignmentId: string; roomId?: string | null; entryType: string }) =>
      (await api.post(`/api/academics/timetable-operations/${timetableId}/entries`, body)).data,
    deleteEntry: async (tenantId: string, entryId: string) =>
      (await api.delete(`/api/academics/timetable-operations/entries/${entryId}`, { params: { tenantId } })).data,
  },

  certificates: {
    dashboard: async (tenantId: string) =>
      (await api.get<CertificateOperationsResponse>("/api/documents/certificates", { params: { tenantId } })).data,
    createTemplate: async (body: { tenantId: string; campusId?: string | null; academicSystemId?: string | null; documentTypeCode: string; code: string; name: string; subjectTemplate?: string | null; headerHtml?: string | null; bodyHtml: string; footerHtml?: string | null; languageCode: string; requiresApproval: boolean }) =>
      (await api.post("/api/documents/certificate-templates", body)).data,
    issue: async (body: { tenantId: string; templateId: string; studentId?: string | null; employeeId?: string | null; fields?: Record<string, string | null> | null }) =>
      (await api.post("/api/documents/certificates/issue", body)).data,
    approve: async (tenantId: string, documentId: string) =>
      (await api.put(`/api/documents/certificates/${documentId}/approve`, null, { params: { tenantId } })).data,
    verify: async (verificationCode: string) =>
      (await api.get(`/api/documents/certificates/verify/${encodeURIComponent(verificationCode)}`)).data,
  },
};
