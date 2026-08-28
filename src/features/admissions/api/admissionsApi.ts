import { api } from "../../../core/api/ApiClient";
export type AdmissionStatus="SUBMITTED_APPLICATION"|"ADMISSION_ACCEPTED"|"ADMISSION_REJECTED"|"WAITING_LIST";
export interface AdmissionApplication {id:string;schoolId:string;branchId:string;academicYearId?:string;classId?:string;sectionId?:string;firstName:string;lastName?:string;dateOfBirth?:string;gender?:string;email?:string;phone?:string;guardianName:string;guardianEmail?:string;guardianPhone?:string;previousMarks?:number;status:AdmissionStatus;submittedAt:string;decisionNotes?:string;studentId?:string;}
export interface CreateAdmissionRequest {tenantId?:string;schoolId:string;branchId:string;academicYearId?:string;classId?:string;sectionId?:string;firstName:string;lastName?:string;dateOfBirth?:string;gender?:string;email?:string;phone?:string;address?:string;guardianName:string;guardianCnic?:string;guardianEmail?:string;guardianPhone?:string;relationship?:string;previousSchool?:string;previousMarks?:number;}
function rows<T>(data:any):T[]{const value=data?.value??data;return Array.isArray(value)?value:(value?.items??[])}
export const admissionsApi={async list(tenantId?:string){return rows<AdmissionApplication>((await api.get("/api/admissions/workflow/applications",{params:{tenantId}})).data)},async create(request:CreateAdmissionRequest){return (await api.post("/api/admissions/workflow/applications",request)).data},async status(id:string,status:AdmissionStatus,tenantId?:string,notes?:string){return (await api.put(`/api/admissions/workflow/applications/${id}/status`,{tenantId,status,notes})).data},async criteria(tenantId?:string){return rows<any>((await api.get("/api/admissions/criteria",{params:{tenantId}})).data)},async createCriteria(request:any){return (await api.post("/api/admissions/criteria",request)).data},async academicYears(tenantId?:string){return rows<any>((await api.get("/api/academics/academic-year",{params:{tenantId,page:1,pageSize:100}})).data)},async classSections(tenantId?:string){return rows<any>((await api.get("/api/academics/class-section",{params:{tenantId,page:1,pageSize:200}})).data)}};

export interface AcademicLookup { id:string; name:string; code?:string; parentId?:string; educationLevelId?:string; educationLevelName?:string; }
const academicLookupRoutes = {
  years: "/api/academics/academic-year",
  classes: "/api/academics/grade-level",
  sections: "/api/academics/class-section",
} as const;

export async function getAcademicSetup(
  kind: "years" | "classes" | "sections",
  _branchId: string,
  tenantId?: string,
): Promise<AcademicLookup[]> {
  const response = await api.get(academicLookupRoutes[kind], {
    params: { tenantId, page: 1, pageSize: 200 },
  });

  return rows<AcademicLookup>(response.data);
}
