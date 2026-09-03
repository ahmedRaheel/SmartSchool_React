import { api } from "../../../core/api/ApiClient";

export interface EmployeeSummary {
  tenantId: string;
  id: string;
  userId?: string | null;
  employeeNumber?: string | null;
  firstName: string;
  lastName?: string | null;
  cnicNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hireDate: string;
  employmentTypeCode: string;
  staffType?: string;
  status: string;
  sourceCandidateId?: string | null;
}

export interface EmployeePage {
  items: EmployeeSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface CreateEmployeeRequest {
  tenantId?: string;
  schoolId: string;
  branchId: string;
  departmentId?: string;
  userId?: string | null;
  firstName: string;
  lastName?: string | null;
  cnicNumber?: string | null;
  photo?: string | null;
  photoContentType?: string | null;
  photoFileName?: string | null;
  email?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  country?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  hireDate: string;
  employmentTypeCode: string;
  staffType?: string;
  status: string;
  sourceCandidateId?: string | null;
}

export const hrApi = {
  async getEmployees(tenantId: string, page = 1, pageSize = 25) {
    const response = await api.get<EmployeePage>("/api/hr/employee", {
      params: { tenantId, page, pageSize },
    });

    return response.data;
  },

  async createEmployee(request: CreateEmployeeRequest) {
    const response = await api.post<EmployeeSummary>(
      "/api/hr/employee",
      request,
    );

    return response.data;
  },

  async addEducation(employeeId: string, tenantId: string, row: any) {
    return (await api.post(`/api/hr/employee/${employeeId}/education`, { tenantId, ...row, startDate: row.startDate || null, endDate: row.endDate || null, isHighest: false })).data;
  },

  async addExperience(employeeId: string, tenantId: string, row: any) {
    return (await api.post(`/api/hr/employee/${employeeId}/experience`, { tenantId, ...row, endDate: row.endDate || null })).data;
  },

  async updateRecruitmentStatus(employeeId: string, tenantId: string, status: "SUBMITTED" | "REJECTED" | "WAITING_LIST") {
    return (await api.put(`/api/hr/employee/${employeeId}/recruitment-status`, { tenantId, employeeId, status })).data;
  },

  async approveEmployee(employeeId: string, tenantId: string, roles: string[]) {
    const response = await api.post(`/api/hr/employee/${employeeId}/approve`, {
      tenantId,
      employeeId,
      roles,
    });
    return response.data;
  },

  async terminateEmployee(employeeId: string, tenantId: string, reason: string) {
    const response = await api.post(`/api/hr/employee/${employeeId}/terminate`, {
      tenantId,
      employeeId,
      reason,
    });
    return response.data;
  },
};
