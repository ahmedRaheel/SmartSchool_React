import { api } from "../../../core/api/ApiClient";

export interface DocumentLookup {
  id: string;
  code: string;
  name: string;
  ownerType?: string | null;
}

export interface DocumentRequirement {
  id: string;
  userRole: string;
  isMandatory: boolean;
  requiredDocumentTypeId: string;
  requiredDocumentTypeName: string;
}

export interface RequiredDocument extends DocumentRequirement {
  documentType: string;
  displayName: string;
  isRequired: boolean;
  conditionCode?: string;
}

export interface DocumentSetup {
  documentTypes: DocumentLookup[];
  requiredDocumentTypes: DocumentLookup[];
  requiredDocuments: DocumentRequirement[];
}

export interface DocumentItem {
  documentId: string;
  documentNumber: string;
  documentTypeCode: string;
  documentTypeName: string;
  requiredDocumentTypeId?: string | null;
  ownerType: string;
  ownerId: string;
  fileName: string;
  title?: string | null;
  createdAt: string;
}

export interface UploadDocumentInput {
  tenantId?: string;
  schoolId?: string;
  branchId?: string;
  entityType: string;
  entityId: string;
  purpose?: string;
  category?: string;
  documentType?: string;
  documentTypeId?: string;
  requiredDocumentTypeId?: string;
  title?: string;
  isPrimary?: boolean;
  file: File;
}

export function documentOwnerType(actorType: string): string {
  const ownerTypes: Record<string, string> = {
    STUDENT: "StudentDocument", TEACHER: "TeacherDocument", DRIVER: "DriverDocument",
    GUARDIAN: "ParentDocument", PARENT: "ParentDocument", CAMPUS: "CampusDocument",
    EXAMINER: "ExaminerDocument", EMPLOYEE: "EmployeeDocument", ADMIN_OFFICER: "EmployeeDocument",
    ADMISSION: "AdmissionDocument",
  };
  return ownerTypes[actorType.toUpperCase()] ?? actorType;
}

export const documentApi = {
  async setup(tenantId: string): Promise<DocumentSetup> {
    return (await api.get<DocumentSetup>("/api/documents/setup", { params: { tenantId } })).data;
  },

  async list(tenantId: string, ownerType?: string, ownerId?: string, page = 1, pageSize = 25) {
    return (await api.get<{ items: DocumentItem[]; totalCount: number }>("/api/documents", {
      params: { tenantId, ownerType, ownerId, page, pageSize },
    })).data;
  },

  async allForOwner(tenantId: string, ownerType: string, ownerId: string): Promise<DocumentItem[]> {
    const items: DocumentItem[] = [];
    let page = 1;
    let totalCount: number;
    do {
      const response = await this.list(tenantId, ownerType, ownerId, page++, 100);
      items.push(...response.items);
      totalCount = response.totalCount;
      if (!response.items.length) break;
    } while (items.length < totalCount);
    return items;
  },

  async requirements(tenantId: string, actorType: string, staffType?: string) {
    const setup = await this.setup(tenantId);
    const role = (actorType === "ADMISSION" ? "STUDENT" : staffType ?? actorType).toUpperCase();
    return setup.requiredDocuments.filter(item => item.userRole.toUpperCase() === role).map(item => ({
      ...item,
      documentType: setup.requiredDocumentTypes.find(type => type.id === item.requiredDocumentTypeId)?.code ?? "",
      displayName: item.requiredDocumentTypeName,
      isRequired: item.isMandatory,
    }));
  },

  async upload(input: UploadDocumentInput) {
    if (input.file.size === 0 || input.file.size > 25 * 1024 * 1024) {
      throw new Error("Choose a nonempty file up to 25 MB.");
    }
    let documentTypeId = input.documentTypeId;
    if (!documentTypeId) {
      const setup = await this.setup(input.tenantId ?? "");
      documentTypeId = setup.documentTypes.find(item => item.code.toUpperCase() === input.documentType?.toUpperCase())?.id;
    }
    if (!documentTypeId) {
      throw new Error(`Configure the ${input.documentType ?? "requested"} document type in Document Setup first.`);
    }
    const form = new FormData();
    form.append("file", input.file);
    form.append("ownerType", documentOwnerType(input.entityType));
    form.append("ownerId", input.entityId);
    form.append("documentTypeId", documentTypeId);
    if (input.requiredDocumentTypeId) form.append("requiredDocumentTypeId", input.requiredDocumentTypeId);
    if (input.title) form.append("title", input.title);
    return (await api.post("/api/documents", form, {
      params: { tenantId: input.tenantId },
      headers: { "Content-Type": undefined },
    })).data;
  },

  async download(document: DocumentItem, tenantId: string): Promise<void> {
    const response = await api.get(`/api/documents/files/${document.documentId}`, {
      params: { tenantId }, responseType: "blob",
    });
    const url = URL.createObjectURL(response.data);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
