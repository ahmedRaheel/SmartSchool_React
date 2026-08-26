import { api } from "../../../core/api/ApiClient";

export interface StudentSummary {
  id: string;
  tenantId: string;
  studentNumber: string;
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
  tenantId: string;
  userId?: string | null;
  studentNumber: string;
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

  async enroll(request: CreateEnrollmentRequest) {
    const response = await api.post("/api/students/enrollment", request);
    return response.data;
  },
};
