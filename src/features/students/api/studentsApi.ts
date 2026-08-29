import { api } from "../../../core/api/ApiClient";

export interface StudentSummary {
  id: string;
  tenantId: string;
  studentNumber?: string | null;
  firstName: string;
  lastName?: string;
  status: string;
  admissionDate?: string;
}

export interface PagedStudents {
  items: StudentSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateStudentRequest {
  tenantId?: string;
  schoolId: string;
  branchId: string;
  academicYearId: string;
  classSectionId: string;
  userId?: string | null;
  firstName: string;
  lastName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  photo?: string | null;
  photoContentType?: string | null;
  photoFileName?: string | null;
  admissionDate?: string | null;
  status: string;
}

export interface CreateEnrollmentRequest {
  tenantId: string;
  studentId: string;
  academicYearId: string;
  classSectionId: string;
  enrollmentDate: string;
  status: string;
}

export const studentsApi = {
  async getPage(tenantId: string, page = 1, pageSize = 25) {
    const response = await api.get<PagedStudents>("/api/students/student", {
      params: { tenantId, page, pageSize },
    });

    return response.data;
  },

  async create(request: CreateStudentRequest) {
    const response = await api.post<StudentSummary>(
      "/api/students/student",
      request,
    );

    return response.data;
  },

  async createGuardian(request: { tenantId: string; fullName: string; cnicNumber: string; email?: string | null; phone?: string | null }) {
    return (await api.post<any>("/api/students/guardian", request)).data;
  },

  async linkGuardian(request: { tenantId: string; studentId: string; guardianId: string; relationship: string }) {
    return (await api.post<any>("/api/students/student-guardian/link", request)).data;
  },

  async approve(studentId: string, tenantId: string, email: string) {
    const response = await api.post(`/api/students/student/${studentId}/approve`, {
      tenantId,
      studentId,
      email,
    });
    return response.data;
  },

  async strikeOff(studentId: string, tenantId: string, reason: string) {
    const response = await api.post(`/api/students/student/${studentId}/strike-off`, {
      tenantId,
      studentId,
      reason,
    });
    return response.data;
  },

  async enroll(request: CreateEnrollmentRequest) {
    const response = await api.post("/api/students/enrollment", request);
    return response.data;
  },
};
