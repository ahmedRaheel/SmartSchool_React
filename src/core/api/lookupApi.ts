import { api } from "./ApiClient";

export interface LookupOption {
  id: number;
  typeCode: string;
  code: string;
  name: string;
  sortOrder: number;
}

export interface LookupGroup {
  code: string;
  name: string;
  values: LookupOption[];
}

export const lookupApi = {
  async getValues(typeCode: string): Promise<LookupOption[]> {
    const response = await api.get<LookupOption[]>(`/api/lookups/${typeCode}`);
    return response.data;
  },

  async getAll(): Promise<LookupGroup[]> {
    const response = await api.get<LookupGroup[]>("/api/lookups");
    return response.data;
  },
};

export interface GeographyOption { id: number; code: string; name: string; }
export const geographyApi = {
  async countries(): Promise<GeographyOption[]> { return (await api.get("/api/lookups/geography/countries")).data; },
  async provinces(countryId: number): Promise<GeographyOption[]> { return (await api.get("/api/lookups/geography/provinces", { params: { countryId } })).data; },
  async cities(provinceId: number): Promise<GeographyOption[]> { return (await api.get("/api/lookups/geography/cities", { params: { provinceId } })).data; },
};
