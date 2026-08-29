import { api } from "../../../core/api/ApiClient";

export interface UploadDocumentInput {
  tenantId?: string;
  schoolId?: string;
  branchId?: string;
  entityType: string;
  entityId: string;
  purpose: string;
  category: string;
  documentType: string;
  title?: string;
  isPrimary?: boolean;
  file: File;
}

export interface RequiredDocument { id: string; actorType: string; staffType?: string | null; documentType: string; displayName: string; isRequired: boolean; conditionCode?: string | null; minCount: number; }

export const documentApi = {
  async requirements(tenantId: string, actorType: string, staffType?: string) {
    return (await api.get<RequiredDocument[]>(`/api/documents/files/requirements/${actorType}`, { params: { tenantId, staffType } })).data;
  },
  async upload(input: UploadDocumentInput) {
    const form = new FormData();
    form.append("file", input.file);
    form.append("entityType", input.entityType);
    form.append("entityId", input.entityId);
    form.append("purpose", input.purpose);
    form.append("category", input.category);
    form.append("documentType", input.documentType);
    if (input.schoolId) form.append("schoolId", input.schoolId);
    if (input.branchId) form.append("branchId", input.branchId);
    if (input.title) form.append("title", input.title);
    form.append("isPrimary", String(Boolean(input.isPrimary)));
    return (await api.post("/api/documents/files", form, { params: { tenantId: input.tenantId } })).data;
  },
};
