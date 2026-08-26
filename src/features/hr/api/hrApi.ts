import { api } from "../../../core/api/ApiClient";

export interface EmployeeSummary {
  tenantId: string;
  id: string;
  userId?: string | null;
  employeeNumber: string;
  firstName: string;
  lastName?: string | null;
  cnicNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  hireDate: string;
  employmentTypeCode: string;
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
  tenantId: string;
  userId?: string | null;
  employeeNumber: string;
  firstName: string;
  lastName?: string | null;
  cnicNumber?: string | null;
  photo?: string | null;
  photoContentType?: string | null;
  photoFileName?: string | null;
  email?: string | null;
  phone?: string | null;
  hireDate: string;
  employmentTypeCode: string;
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
};
