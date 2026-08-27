import { api } from "../../../core/api/ApiClient";

export interface School {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  fax?: string;
  website?: string;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  logoUrl?: string;
}

export interface Campus {
  id: string;
  tenantId: string;
  schoolId: string;
  code: string;
  name: string;
  branchType: "HEAD_OFFICE" | "REGIONAL_HEAD_OFFICE" | "REGIONAL_BRANCH";
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  fax?: string;
  mobile?: string;
  email?: string;
  logoUrl?: string;
}

export type CreateSchoolRequest = Omit<School, "id" | "code">;
export type CreateCampusRequest = Omit<Campus, "id" | "code">;

function items<T>(payload: unknown): T[] {
  const data = payload as { items?: T[]; value?: { items?: T[] } };
  return data?.items ?? data?.value?.items ?? [];
}

export const organizationApi = {
  async getSchools(tenantId: string): Promise<School[]> {
    const response = await api.get("/api/organization/school", { params: { tenantId, page: 1, pageSize: 100 } });
    return items<School>(response.data);
  },
  async createSchool(request: CreateSchoolRequest): Promise<void> {
    await api.post("/api/organization/school", request);
  },
  async getCampuses(tenantId: string): Promise<Campus[]> {
    const response = await api.get("/api/organization/campus", { params: { tenantId, page: 1, pageSize: 200 } });
    return items<Campus>(response.data);
  },
  async createCampus(request: CreateCampusRequest): Promise<void> {
    await api.post("/api/organization/campus", request);
  },
};
