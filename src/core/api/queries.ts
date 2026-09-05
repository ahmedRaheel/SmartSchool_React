/**
 * TanStack Query hooks — all route through apiAdapter.
 * VITE_USE_MOCKS toggle requires zero hook changes.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as A from "./apiAdapter";
import { useAuth } from "../../features/auth/auth";
import { effectiveTenantId } from "../tenant/tenantContext";

function useTid() { const { user } = useAuth(); return effectiveTenantId(user) ?? ""; }

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const useAdminDashboard   = () => { const tid=useTid(); return useQuery({ queryKey:["dash","admin",tid],   queryFn:()=>A.adminDashboard(tid),   staleTime:60_000 }); };
export const useStudentDashboard = (sid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=sid??user?.studentId??""; return useQuery({ queryKey:["dash","student",id], queryFn:()=>A.studentDashboard(id,tid), enabled:!!id }); };
export const useTeacherDashboard = (eid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=eid??user?.employeeId??""; return useQuery({ queryKey:["dash","teacher",id], queryFn:()=>A.teacherDashboard(id,tid), enabled:!!id }); };
export const useParentDashboard  = (gid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=gid??user?.businessEntityId??""; return useQuery({ queryKey:["dash","parent",id], queryFn:()=>A.parentDashboard(id,tid), enabled:!!id }); };
export const useDriverDashboard  = (did?:string) => { const {user}=useAuth(); const tid=useTid(); const id=did??user?.driverId??""; return useQuery({ queryKey:["dash","driver",id], queryFn:()=>A.driverDashboard(id,tid), enabled:!!id }); };

// ── Students ──────────────────────────────────────────────────────────────────
export const useStudents        = (page=1) => { const tid=useTid(); return useQuery({ queryKey:["students",tid,page], queryFn:()=>A.getStudentsPage(tid,page) }); };
export const useCreateStudent   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createStudent(b), onSuccess:()=>qc.invalidateQueries({queryKey:["students",tid]}) }); };
export const useApproveStudent  = () => useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.approveStudent(id,body) });
export const useEnrollments     = (studentId?:string) => { const tid=useTid(); return useQuery({ queryKey:["enrollments",tid,studentId], queryFn:()=>A.getEnrollments(tid,studentId), enabled:!!tid }); };
export const useCreateEnrollment= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createEnrollment(b), onSuccess:()=>qc.invalidateQueries({queryKey:["enrollments",tid]}) }); };
export const useCreateGuardian  = () => useMutation({ mutationFn:(b:object)=>A.createGuardian(b) });

// ── HR ───────────────────────────────────────────────────────────────────────
export const useEmployees       = (page=1) => { const tid=useTid(); return useQuery({ queryKey:["employees",tid,page], queryFn:()=>A.getEmployeesPage(tid,page) }); };
export const useCreateEmployee  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createEmployee(b), onSuccess:()=>qc.invalidateQueries({queryKey:["employees",tid]}) }); };
export const useLeaveRequests   = () => { const tid=useTid(); return useQuery({ queryKey:["leave-requests",tid], queryFn:()=>A.getLeaveRequests(tid) }); };
export const useCreateLeaveRequest=()=> { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createLeaveRequest(b), onSuccess:()=>qc.invalidateQueries({queryKey:["leave-requests",tid]}) }); };

// ── Finance ───────────────────────────────────────────────────────────────────
export const useInvoices        = (page=1) => { const tid=useTid(); return useQuery({ queryKey:["invoices",tid,page], queryFn:()=>A.getInvoicesPage(tid,page) }); };
export const useCreateInvoice   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createInvoice(b), onSuccess:()=>qc.invalidateQueries({queryKey:["invoices",tid]}) }); };
export const useCreatePayment   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createPayment(b), onSuccess:()=>qc.invalidateQueries({queryKey:["invoices",tid]}) }); };
export const useFeeTypes        = () => { const tid=useTid(); return useQuery({ queryKey:["fee-types",tid], queryFn:()=>A.getFeeTypes(tid) }); };
export const useCreateFeeType   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createFeeType(b), onSuccess:()=>qc.invalidateQueries({queryKey:["fee-types",tid]}) }); };
export const useFeeStructure    = () => { const tid=useTid(); return useQuery({ queryKey:["fee-structure",tid], queryFn:()=>A.getFeeStructure(tid) }); };
export const useCreateFeeStructure=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createFeeStructure(b), onSuccess:()=>qc.invalidateQueries({queryKey:["fee-structure",tid]}) }); };

// ── Admissions ────────────────────────────────────────────────────────────────
export const useInquiries       = (page=1) => { const tid=useTid(); return useQuery({ queryKey:["inquiries",tid,page], queryFn:()=>A.getInquiriesPage(tid,page) }); };
export const useCreateInquiry   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createInquiry(b), onSuccess:()=>qc.invalidateQueries({queryKey:["inquiries",tid]}) }); };
export const useUpdateInquiry   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateInquiry(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["inquiries",tid]}) }); };

// ── Organization ──────────────────────────────────────────────────────────────
export const useSchools         = () => { const tid=useTid(); return useQuery({ queryKey:["schools",tid], queryFn:()=>A.getSchools(tid) }); };
export const useCreateSchool    = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createSchool(b), onSuccess:()=>qc.invalidateQueries({queryKey:["schools",tid]}) }); };
export const useUpdateSchool    = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateSchool(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["schools",tid]}) }); };
export const useCampuses        = () => { const tid=useTid(); return useQuery({ queryKey:["campuses",tid], queryFn:()=>A.getCampuses(tid) }); };
export const useCreateCampus    = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createCampus(b), onSuccess:()=>qc.invalidateQueries({queryKey:["campuses",tid]}) }); };
export const useUpdateCampus    = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateCampus(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["campuses",tid]}) }); };
export const useDepartments     = () => { const tid=useTid(); return useQuery({ queryKey:["departments",tid], queryFn:()=>A.getDepartments(tid) }); };
export const useCreateDepartment= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createDepartment(b), onSuccess:()=>qc.invalidateQueries({queryKey:["departments",tid]}) }); };
export const useDeleteDepartment= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteDepartment(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["departments",tid]}) }); };
export const useBranchGenderTypes=()=> useQuery({ queryKey:["branch-gender-types"], queryFn:A.getBranchGenderTypes, staleTime:3_600_000 });
export const useEducationLevels = ()=> useQuery({ queryKey:["education-levels"],    queryFn:A.getEducationLevels,    staleTime:3_600_000 });

// ── Academics ─────────────────────────────────────────────────────────────────
export const useAcademicSystems = () => { const tid=useTid(); return useQuery({ queryKey:["academic-systems",tid], queryFn:()=>A.getAcademicSystems(tid) }); };
export const useCreateAcademicSystem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createAcademicSystem(b), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-systems",tid]}) }); };
export const useAcademicYears   = (campusId?:string) => { const tid=useTid(); return useQuery({ queryKey:["academic-years",tid,campusId], queryFn:()=>A.getAcademicYears(tid,campusId) }); };
export const useCreateAcademicYear=()=> { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createAcademicYear(b), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-years",tid]}) }); };
export const useDeleteAcademicYear=()=> { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteAcademicYear(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-years",tid]}) }); };
export const useGradeLevels     = () => { const tid=useTid(); return useQuery({ queryKey:["grade-levels",tid], queryFn:()=>A.getGradeLevels(tid) }); };
export const useCreateGradeLevel= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createGradeLevel(b), onSuccess:()=>qc.invalidateQueries({queryKey:["grade-levels",tid]}) }); };
export const useClassSections   = () => { const tid=useTid(); return useQuery({ queryKey:["sections",tid], queryFn:()=>A.getClassSections(tid) }); };
export const useCreateClassSection=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createClassSection(b), onSuccess:()=>qc.invalidateQueries({queryKey:["sections",tid]}) }); };
export const useSubjects        = () => { const tid=useTid(); return useQuery({ queryKey:["subjects",tid], queryFn:()=>A.getSubjects(tid) }); };
export const useCreateSubject   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createSubject(b), onSuccess:()=>qc.invalidateQueries({queryKey:["subjects",tid]}) }); };
export const useTimetable       = () => { const tid=useTid(); return useQuery({ queryKey:["timetable",tid], queryFn:()=>A.getTimetable(tid) }); };
export const useCourseOfferings = () => { const tid=useTid(); return useQuery({ queryKey:["course-offerings",tid], queryFn:()=>A.getCourseOfferings(tid) }); };
export const usePrograms        = () => { const tid=useTid(); return useQuery({ queryKey:["programs",tid], queryFn:()=>A.getPrograms(tid) }); };
export const useTerms           = () => { const tid=useTid(); return useQuery({ queryKey:["terms",tid], queryFn:()=>A.getTerms(tid) }); };

// ── Tenancy ───────────────────────────────────────────────────────────────────
export const useTenants         = (page = 1, pageSize = 25) => useQuery({
  queryKey: ["tenants", page, pageSize],
  queryFn: () => A.getTenants(page, pageSize),
  placeholderData: previousData => previousData,
});
export const useCreateTenant    = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(b:object)=>A.createTenant(b), onSuccess:()=>qc.invalidateQueries({queryKey:["tenants"]}) }); };

// ── Transport ─────────────────────────────────────────────────────────────────
export const useVehicles        = () => { const tid=useTid(); return useQuery({ queryKey:["vehicles",tid], queryFn:()=>A.getVehicles(tid) }); };
export const useCreateVehicle   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createVehicle(b), onSuccess:()=>qc.invalidateQueries({queryKey:["vehicles",tid]}) }); };
export const useRoutes          = () => { const tid=useTid(); return useQuery({ queryKey:["routes",tid], queryFn:()=>A.getRoutes(tid) }); };
export const useCreateRoute     = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createRoute(b), onSuccess:()=>qc.invalidateQueries({queryKey:["routes",tid]}) }); };
export const useStops           = () => { const tid=useTid(); return useQuery({ queryKey:["stops",tid], queryFn:()=>A.getStops(tid) }); };

// ── Library ───────────────────────────────────────────────────────────────────
export const useBooks           = () => { const tid=useTid(); return useQuery({ queryKey:["books",tid], queryFn:()=>A.getBooks(tid) }); };
export const useCreateBook      = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createBook(b), onSuccess:()=>qc.invalidateQueries({queryKey:["books",tid]}) }); };
export const useLoans           = () => { const tid=useTid(); return useQuery({ queryKey:["loans",tid], queryFn:()=>A.getLoans(tid) }); };
export const useCreateLoan      = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createLoan(b), onSuccess:()=>qc.invalidateQueries({queryKey:["loans",tid]}) }); };

// ── Examinations ──────────────────────────────────────────────────────────────
export const useExams           = () => { const tid=useTid(); return useQuery({ queryKey:["exams",tid], queryFn:()=>A.getExams(tid) }); };
export const useCreateExam      = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createExam(b), onSuccess:()=>qc.invalidateQueries({queryKey:["exams",tid]}) }); };
export const useExamResults     = () => { const tid=useTid(); return useQuery({ queryKey:["exam-results",tid], queryFn:()=>A.getExamResults(tid) }); };
export const useGradeScales     = () => { const tid=useTid(); return useQuery({ queryKey:["grade-scales",tid], queryFn:()=>A.getGradeScales(tid) }); };

// ── Payroll ───────────────────────────────────────────────────────────────────
export const usePayrollRuns     = () => { const tid=useTid(); return useQuery({ queryKey:["payroll-runs",tid], queryFn:()=>A.getPayrollRuns(tid) }); };
export const useCreatePayrollRun= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createPayrollRun(b), onSuccess:()=>qc.invalidateQueries({queryKey:["payroll-runs",tid]}) }); };
export const useSalaryStructures= () => { const tid=useTid(); return useQuery({ queryKey:["salary-structures",tid], queryFn:()=>A.getSalaryStructures(tid) }); };
export const usePayslips        = () => { const tid=useTid(); return useQuery({ queryKey:["payslips",tid], queryFn:()=>A.getPayslips(tid) }); };

// ── Learning ──────────────────────────────────────────────────────────────────
export const useAssignments     = () => { const tid=useTid(); return useQuery({ queryKey:["assignments",tid], queryFn:()=>A.getAssignments(tid) }); };
export const useCreateAssignment= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createAssignment(b), onSuccess:()=>qc.invalidateQueries({queryKey:["assignments",tid]}) }); };
export const useLessons         = () => { const tid=useTid(); return useQuery({ queryKey:["lessons",tid], queryFn:()=>A.getLessons(tid) }); };
export const useLearningResources=()=>{ const tid=useTid(); return useQuery({ queryKey:["learning-resources",tid], queryFn:()=>A.getLearningResources(tid) }); };

// ── Activities ────────────────────────────────────────────────────────────────
export const useActivities      = () => { const tid=useTid(); return useQuery({ queryKey:["activities",tid], queryFn:()=>A.getActivities(tid) }); };
export const useCreateActivity  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createActivity(b), onSuccess:()=>qc.invalidateQueries({queryKey:["activities",tid]}) }); };
export const useAwards          = () => { const tid=useTid(); return useQuery({ queryKey:["awards",tid], queryFn:()=>A.getAwards(tid) }); };

// ── Workflow ──────────────────────────────────────────────────────────────────
export const useWorkflowDefs    = () => { const tid=useTid(); return useQuery({ queryKey:["workflow-defs",tid], queryFn:()=>A.getWorkflowDefs(tid) }); };
export const useApprovals       = () => { const tid=useTid(); return useQuery({ queryKey:["approvals",tid], queryFn:()=>A.getApprovals(tid), refetchInterval:30_000 }); };
export const useProcessApproval = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.processApproval(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["approvals",tid]}) }); };
export const useWorkflowInstances=()=>{ const tid=useTid(); return useQuery({ queryKey:["workflow-instances",tid], queryFn:()=>A.getWorkflowInstances(tid) }); };

// ── Inventory ─────────────────────────────────────────────────────────────────
export const useInventoryItems  = () => { const tid=useTid(); return useQuery({ queryKey:["inventory",tid], queryFn:()=>A.getInventoryItems(tid) }); };
export const useCreateInventoryItem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createInventoryItem(b), onSuccess:()=>qc.invalidateQueries({queryKey:["inventory",tid]}) }); };
export const usePurchaseOrders  = () => { const tid=useTid(); return useQuery({ queryKey:["purchase-orders",tid], queryFn:()=>A.getPurchaseOrders(tid) }); };

// ── Communication ─────────────────────────────────────────────────────────────
export const useNotifications   = () => { const {user}=useAuth(); const tid=useTid(); return useQuery({ queryKey:["notifs",tid,user?.id], queryFn:()=>A.getNotifications(tid,user!.id), enabled:!!user?.id, refetchInterval:30_000 }); };
export const useUnreadCount     = () => { const {user}=useAuth(); const tid=useTid(); return useQuery({ queryKey:["unread",tid,user?.id], queryFn:()=>A.getUnreadCount(tid,user!.id).then(r=>(r as any).unreadCount??0), enabled:!!user?.id, refetchInterval:30_000 }); };
export const useMarkRead        = () => { const qc=useQueryClient(); const {user}=useAuth(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.markNotifRead(id,tid,user!.id), onSuccess:()=>{ qc.invalidateQueries({queryKey:["notifs"]}); qc.invalidateQueries({queryKey:["unread"]}); } }); };
export const useMarkAllRead     = () => { const qc=useQueryClient(); const {user}=useAuth(); const tid=useTid(); return useMutation({ mutationFn:()=>A.markAllRead(tid,user!.id), onSuccess:()=>{ qc.invalidateQueries({queryKey:["notifs"]}); qc.invalidateQueries({queryKey:["unread"]}); } }); };
export const useConversations   = () => { const tid=useTid(); return useQuery({ queryKey:["convs",tid], queryFn:()=>A.getConversations(tid) }); };
export const useMessages        = (convId?:string) => { const tid=useTid(); return useQuery({ queryKey:["msgs",tid,convId], queryFn:()=>A.getMessages(tid,convId!), enabled:!!convId, refetchInterval:5_000 }); };
export const useSendMessage     = (convId:string) => { const qc=useQueryClient(); const {user}=useAuth(); const tid=useTid(); return useMutation({ mutationFn:(msg:string)=>A.sendMessage(tid,convId,msg,user?.id??""), onSuccess:()=>qc.invalidateQueries({queryKey:["msgs",tid,convId]}) }); };
export const useCreateConversation=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createConversation(b), onSuccess:()=>qc.invalidateQueries({queryKey:["convs",tid]}) }); };

// ── AICore ────────────────────────────────────────────────────────────────────
export const useModelConfigs    = () => { const tid=useTid(); return useQuery({ queryKey:["model-configs",tid], queryFn:()=>A.getModelConfigs(tid) }); };
export const useCreateModelConfig=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createModelConfig(b), onSuccess:()=>qc.invalidateQueries({queryKey:["model-configs",tid]}) }); };
export const useCollections     = () => { const tid=useTid(); return useQuery({ queryKey:["collections",tid], queryFn:()=>A.getCollections(tid) }); };
export const useCreateCollection= () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createCollection(b), onSuccess:()=>qc.invalidateQueries({queryKey:["collections",tid]}) }); };
export const useIndexKnowledge  = () => useMutation({ mutationFn:(b:object)=>A.indexKnowledge(b) });
export const useExecLogs        = () => { const tid=useTid(); return useQuery({ queryKey:["exec-logs",tid], queryFn:()=>A.getExecLogs(tid), refetchInterval:15_000 }); };
export const usePromptTemplates = () => { const tid=useTid(); return useQuery({ queryKey:["prompt-templates",tid], queryFn:()=>A.getPromptTemplates(tid) }); };

// ── AI mutations ──────────────────────────────────────────────────────────────
export const useAskChatbot      = (bot:"student"|"teacher"|"parent"|"admissions"|"admin") => { const tid=useTid(); return useMutation({ mutationFn:(q:string)=>A.askChatbot(bot,{question:q,tenantId:tid}) }); };
export const useAskAssistant    = () => { const tid=useTid(); return useMutation({ mutationFn:(q:string)=>A.askAssistant({question:q,tenantId:tid}) }); };
export const useStartTutorSession=()=> useMutation({ mutationFn:(b:object)=>A.startTutorSession(b) });
export const useAskTutor        = () => useMutation({ mutationFn:(b:object)=>A.askTutor(b) });
export const useGenerateQuiz    = () => useMutation({ mutationFn:(b:object)=>A.generateQuiz(b) });
export const useStudentPrediction=()=> { const tid=useTid(); return useMutation({ mutationFn:({kind,...rest}:{kind:string;[k:string]:unknown})=>A.predictStudent(kind,{tenantId:tid,...rest}) }); };
export const useEarlyWarning    = (studentId:string) => { const tid=useTid(); return useQuery({ queryKey:["early-warning",tid,studentId], queryFn:()=>A.getEarlyWarnings({tenantId:tid,studentId}), enabled:!!studentId&&!!tid, staleTime:300_000 }); };
export const useAskParentAI     = () => { const tid=useTid(); const {user}=useAuth(); return useMutation({ mutationFn:(msg:string)=>A.askParentAI({message:msg,tenantId:tid,guardianId:user?.businessEntityId??undefined}) }); };
export const useHandleInquiryAI = () => { const tid=useTid(); return useMutation({ mutationFn:(msg:string)=>A.handleInquiryAI({message:msg,tenantId:tid}) }); };
export const useExecuteAI       = () => useMutation({ mutationFn:(b:object)=>A.executeAI(b) });
export const useIndexKnowledgeMutation=()=>useMutation({ mutationFn:(b:object)=>A.indexKnowledge(b) });

// ── Reference / Lookups ───────────────────────────────────────────────────────
export const useLookupTypes     = () => useQuery({ queryKey:["lookup-types"], queryFn:A.getLookupTypes });
export const useLookupValues    = (typeCode:string) => useQuery({ queryKey:["lookup-values",typeCode], queryFn:()=>A.getLookupValues(typeCode), enabled:!!typeCode });
export const useCreateLookup    = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(b:object)=>A.createLookup(b), onSuccess:()=>qc.invalidateQueries({queryKey:["lookup-values"]}) }); };
export const useDeleteLookup    = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(id:string)=>A.deleteLookup(id), onSuccess:()=>qc.invalidateQueries({queryKey:["lookup-values"]}) }); };

// ── Teachers ──────────────────────────────────────────────────────────────────
export const useTeacherStudents = (eid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=eid??user?.employeeId??""; return useQuery({ queryKey:["teacher-students",id,tid], queryFn:()=>A.getTeacherStudents(id,tid), enabled:!!id }); };
export const useTeacherClasses  = (eid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=eid??user?.employeeId??""; return useQuery({ queryKey:["teacher-classes",id,tid],  queryFn:()=>A.getTeacherClasses(id,tid),  enabled:!!id }); };
export const useTeacherTimetable= (eid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=eid??user?.employeeId??""; return useQuery({ queryKey:["teacher-timetable",id,tid],queryFn:()=>A.getTeacherTimetable(id,tid),enabled:!!id }); };
export const useTeacherWorkload = (eid?:string) => { const {user}=useAuth(); const tid=useTid(); const id=eid??user?.employeeId??""; return useQuery({ queryKey:["teacher-workload",id,tid],  queryFn:()=>A.getTeacherWorkload(id,tid),  enabled:!!id }); };
export const useCreateTeacherAssignment=(eid:string)=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createTeacherAssignment(eid,b), onSuccess:()=>qc.invalidateQueries({queryKey:["teacher-assignments",eid,tid]}) }); };
export const useApplyTeacherLeave=(eid:string)=>useMutation({ mutationFn:(b:object)=>A.applyTeacherLeave(eid,b) });

// ── Audit ─────────────────────────────────────────────────────────────────────
export const useAuditLogs       = (page=1) => { const tid=useTid(); return useQuery({ queryKey:["audit-logs",tid,page], queryFn:()=>A.getAuditLogs(tid,page,50) }); };

// ── Impersonation ─────────────────────────────────────────────────────────────
export const useImpersonate     = () => { const {impersonate}=useAuth(); return useMutation({ mutationFn:({targetUserId,reason}:{targetUserId:string;reason:string})=>impersonate(targetUserId,reason) }); };

// ── Aliases for pages that import the longer names ───────────────────────────
export const useKnowledgeCollections      = useCollections;
export const useCreateKnowledgeCollection = useCreateCollection;
export const useExecutionLogs = useExecLogs;

// ── Extended hooks (new entities, aliases) ─────────────────────────────────
export const useCreateAward            = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createAward(b), onSuccess:()=>qc.invalidateQueries({queryKey:["awards",tid]}) }); };
export const useCreateGradeScale       = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createGradeScale(b), onSuccess:()=>qc.invalidateQueries({queryKey:["grade-scales",tid]}) }); };
export const useCreateItem             = useCreateInventoryItem;
export const useCreateLesson           = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createLesson(b), onSuccess:()=>qc.invalidateQueries({queryKey:["lessons",tid]}) }); };
export const useCreatePurchaseOrder    = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createPurchaseOrder(b), onSuccess:()=>qc.invalidateQueries({queryKey:["purchase-orders",tid]}) }); };
export const useCreateWorkflowDefinition = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(b:object)=>A.createWorkflowDef(b), onSuccess:()=>qc.invalidateQueries({queryKey:["workflow-defs",tid]}) }); };
export const useItems                  = useInventoryItems;
export const useWorkflowDefinitions    = useWorkflowDefs;

// ── Leave approval hooks ──────────────────────────────────────────────────────
export const useApproveLeave = () => {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      A.approveLeave(id, { tenantId: tid, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-requests", tid] }),
  });
};
export const useRejectLeave = () => {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      A.rejectLeave(id, { tenantId: tid, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leave-requests", tid] }),
  });
};

// ── Update / Delete mutations — wired to real API when VITE_USE_MOCKS=false ───

// Students
export const useUpdateStudent  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateStudent(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["students",tid]}) }); };
export const useDeleteStudent  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteStudent(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["students",tid]}) }); };

// HR
export const useUpdateEmployee = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateEmployee(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["employees",tid]}) }); };
export const useDeleteEmployee = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteEmployee(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["employees",tid]}) }); };

// Payroll
export const useUpdatePayrollRun=() => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updatePayrollRun(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["payroll-runs",tid]}) }); };
export const useDeletePayrollRun=() => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deletePayrollRun(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["payroll-runs",tid]}) }); };

// Finance
export const useUpdateInvoice  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateInvoice(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["invoices",tid]}) }); };
export const useDeleteInvoice  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteInvoice(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["invoices",tid]}) }); };

// Library
export const useUpdateBook     = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateBook(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["books",tid]}) }); };
export const useDeleteBook     = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteBook(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["books",tid]}) }); };

// Transport
export const useUpdateVehicle  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateVehicle(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["vehicles",tid]}) }); };
export const useDeleteVehicle  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteVehicle(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["vehicles",tid]}) }); };

// Inventory
export const useUpdateInventoryItem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateInventoryItem(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["inventory",tid]}) }); };
export const useDeleteInventoryItem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteInventoryItem(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["inventory",tid]}) }); };

// Activities
export const useUpdateActivity = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateActivity(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["activities",tid]}) }); };
export const useDeleteActivity = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteActivity(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["activities",tid]}) }); };

// Admissions
export const useUpdateApplication=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateApplication(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["applications",tid]}) }); };
export const useDeleteApplication=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteApplication(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["applications",tid]}) }); };

// Examinations
export const useUpdateExam     = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateExam(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["exams",tid]}) }); };
export const useDeleteExam     = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteExam(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["exams",tid]}) }); };

// Learning
export const useUpdateAssignment=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateAssignment(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["assignments",tid]}) }); };
export const useDeleteAssignment=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteAssignment(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["assignments",tid]}) }); };

// Organization
export const useDeleteSchool   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteSchool(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["schools",tid]}) }); };
export const useDeleteCampus   = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteCampus(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["campuses",tid]}) }); };
export const useUpdateDepartment=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateDepartment(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["departments",tid]}) }); };

// Academic Systems
export const useUpdateAcademicSystem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateAcademicSystem(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-systems",tid]}) }); };
export const useDeleteAcademicSystem=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteAcademicSystem(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-systems",tid]}) }); };

// Academic Structure
export const useUpdateAcademicYear=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateAcademicYear(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["academic-years",tid]}) }); };
export const useUpdateGradeLevel=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateGradeLevel(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["grade-levels",tid]}) }); };
export const useDeleteGradeLevel=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteGradeLevel(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["grade-levels",tid]}) }); };
export const useUpdateClassSection=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateClassSection(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["class-sections",tid]}) }); };
export const useDeleteClassSection=()=>{ const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteClassSection(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["class-sections",tid]}) }); };

// Subjects
export const useUpdateSubject  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateSubject(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["subjects",tid]}) }); };
export const useDeleteSubject  = () => { const qc=useQueryClient(); const tid=useTid(); return useMutation({ mutationFn:(id:string)=>A.deleteSubject(id,tid), onSuccess:()=>qc.invalidateQueries({queryKey:["subjects",tid]}) }); };

// Tenants
export const useUpdateTenant   = () => { const qc=useQueryClient(); return useMutation({ mutationFn:({id,body}:{id:string;body:object})=>A.updateTenant(id,body), onSuccess:()=>qc.invalidateQueries({queryKey:["tenants"]}) }); };
export const useDeleteTenant   = () => { const qc=useQueryClient(); return useMutation({ mutationFn:(id:string)=>A.deleteTenant(id), onSuccess:()=>qc.invalidateQueries({queryKey:["tenants"]}) }); };

// ── GetById query hooks — fetches fresh record when View or Edit is opened ─────
// enabled only when an id is provided (i.e. drawer/modal is open)

export const useStudentById      = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["student",id],       queryFn:()=>A.getStudentById(id!,tid),       enabled:!!id, staleTime:0 }); };
export const useEmployeeById     = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["employee",id],      queryFn:()=>A.getEmployeeById(id!,tid),      enabled:!!id, staleTime:0 }); };
export const useInvoiceById      = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["invoice",id],       queryFn:()=>A.getInvoiceById(id!,tid),       enabled:!!id, staleTime:0 }); };
export const useBookById         = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["book",id],          queryFn:()=>A.getBookById(id!,tid),          enabled:!!id, staleTime:0 }); };
export const useVehicleById      = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["vehicle",id],       queryFn:()=>A.getVehicleById(id!,tid),       enabled:!!id, staleTime:0 }); };
export const useInventoryItemById= (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["inv-item",id],      queryFn:()=>A.getInventoryItemById(id!,tid), enabled:!!id, staleTime:0 }); };
export const useActivityById     = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["activity",id],      queryFn:()=>A.getActivityById(id!,tid),      enabled:!!id, staleTime:0 }); };
export const useApplicationById  = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["application",id],   queryFn:()=>A.getApplicationById(id!,tid),   enabled:!!id, staleTime:0 }); };
export const useExamById         = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["exam",id],          queryFn:()=>A.getExamById(id!,tid),          enabled:!!id, staleTime:0 }); };
export const useAssignmentById   = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["assignment",id],    queryFn:()=>A.getAssignmentById(id!,tid),    enabled:!!id, staleTime:0 }); };
export const useSchoolById       = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["school",id],        queryFn:()=>A.getSchoolById(id!,tid),        enabled:!!id, staleTime:0 }); };
export const useCampusById       = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["campus",id],        queryFn:()=>A.getCampusById(id!,tid),        enabled:!!id, staleTime:0 }); };
export const useDepartmentById   = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["department",id],    queryFn:()=>A.getDepartmentById(id!,tid),    enabled:!!id, staleTime:0 }); };
export const useTenantById       = (id?:string) => useQuery({ queryKey:["tenant",id], queryFn:()=>A.getTenantById(id!), enabled:!!id, staleTime:0 });
export const usePayrollRunById   = (id?:string) => { const tid=useTid(); return useQuery({ queryKey:["payroll-run",id],   queryFn:()=>A.getPayrollRunById(id!,tid),    enabled:!!id, staleTime:0 }); };
