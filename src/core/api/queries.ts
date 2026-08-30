/**
 * TanStack Query hooks — all route through apiAdapter.
 * Toggle VITE_USE_MOCKS in .env to switch between mock and real API.
 * Zero code changes needed in pages.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as A from "./apiAdapter";
import { useAuth } from "../../features/auth/auth";
import { effectiveTenantId } from "../tenant/tenantContext";

function useTid() {
  const { user } = useAuth();
  return effectiveTenantId(user) ?? "";
}

// ─── Dashboard ──────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  const tid = useTid();
  return useQuery({ queryKey: ["dashboard","admin",tid], queryFn: () => A.adminDashboard(tid), staleTime: 60_000 });
}
export function useStudentDashboard(sid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = sid ?? user?.studentId ?? "";
  return useQuery({ queryKey: ["dashboard","student",id], queryFn: () => A.studentDashboard(id, tid), enabled: !!id });
}
export function useTeacherDashboard(eid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = eid ?? user?.employeeId ?? "";
  return useQuery({ queryKey: ["dashboard","teacher",id], queryFn: () => A.teacherDashboard(id, tid), enabled: !!id });
}
export function useParentDashboard(gid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = gid ?? user?.businessEntityId ?? "";
  return useQuery({ queryKey: ["dashboard","parent",id], queryFn: () => A.parentDashboard(id, tid), enabled: !!id });
}
export function useDriverDashboard(did?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = did ?? user?.driverId ?? "";
  return useQuery({ queryKey: ["dashboard","driver",id], queryFn: () => A.driverDashboard(id, tid), enabled: !!id });
}

// ─── Students ───────────────────────────────────────────────────────────────
export function useStudents(page = 1) {
  const tid = useTid();
  return useQuery({ queryKey: ["students",tid,page], queryFn: () => A.getStudentsPage(tid, page) });
}
export function useCreateStudent() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createStudent(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["students",tid] }) });
}
export function useApproveStudent() {
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: object }) => A.approveStudent(id, body) });
}

// ─── HR ─────────────────────────────────────────────────────────────────────
export function useEmployees(page = 1) {
  const tid = useTid();
  return useQuery({ queryKey: ["employees",tid,page], queryFn: () => A.getEmployeesPage(tid, page) });
}
export function useCreateEmployee() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createEmployee(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["employees",tid] }) });
}

// ─── Finance ────────────────────────────────────────────────────────────────
export function useInvoices(page = 1) {
  const tid = useTid();
  return useQuery({ queryKey: ["invoices",tid,page], queryFn: () => A.getInvoicesPage(tid, page) });
}
export function useCreateInvoice() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createInvoice(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices",tid] }) });
}
export function useCreatePayment() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createPayment(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices",tid] }) });
}
export function useFeeTypes() {
  const tid = useTid();
  return useQuery({ queryKey: ["fee-types",tid], queryFn: () => A.getFeeTypes(tid) });
}
export function useCreateFeeType() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createFeeType(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-types",tid] }) });
}
export function useFeeStructure() {
  const tid = useTid();
  return useQuery({ queryKey: ["fee-structure",tid], queryFn: () => A.getFeeStructure(tid) });
}
export function useCreateFeeStructure() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createFeeStructure(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["fee-structure",tid] }) });
}

// ─── Admissions ─────────────────────────────────────────────────────────────
export function useInquiries(page = 1) {
  const tid = useTid();
  return useQuery({ queryKey: ["inquiries",tid,page], queryFn: () => A.getInquiriesPage(tid, page) });
}
export function useCreateInquiry() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createInquiry(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["inquiries",tid] }) });
}
export function useUpdateInquiry() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: ({ id, body }: { id: string; body: object }) => A.updateInquiry(id, body), onSuccess: () => qc.invalidateQueries({ queryKey: ["inquiries",tid] }) });
}

// ─── Organization ───────────────────────────────────────────────────────────
export function useSchools() {
  const tid = useTid();
  return useQuery({ queryKey: ["schools",tid], queryFn: () => A.getSchools(tid) });
}
export function useCreateSchool() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createSchool(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["schools",tid] }) });
}
export function useCampuses() {
  const tid = useTid();
  return useQuery({ queryKey: ["campuses",tid], queryFn: () => A.getCampuses(tid) });
}
export function useCreateCampus() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createCampus(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["campuses",tid] }) });
}
export function useDepartments() {
  const tid = useTid();
  return useQuery({ queryKey: ["departments",tid], queryFn: () => A.getDepartments(tid) });
}
export function useCreateDepartment() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createDepartment(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["departments",tid] }) });
}
export function useDeleteDepartment() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (id: string) => A.deleteDepartment(id, tid), onSuccess: () => qc.invalidateQueries({ queryKey: ["departments",tid] }) });
}
export function useBranchGenderTypes() {
  return useQuery({ queryKey: ["branch-gender-types"], queryFn: () => A.getBranchGenderTypes(), staleTime: 3_600_000 });
}
export function useEducationLevels() {
  return useQuery({ queryKey: ["education-levels"], queryFn: () => A.getEducationLevels(), staleTime: 3_600_000 });
}

// ─── Academics ──────────────────────────────────────────────────────────────
export function useAcademicYears(campusId?: string) {
  const tid = useTid();
  return useQuery({ queryKey: ["academic-years",tid,campusId], queryFn: () => A.getAcademicYears(tid, campusId) });
}
export function useCreateAcademicYear() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createAcademicYear(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years",tid] }) });
}
export function useDeleteAcademicYear() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (id: string) => A.deleteAcademicYear(id, tid), onSuccess: () => qc.invalidateQueries({ queryKey: ["academic-years",tid] }) });
}
export function useGradeLevels() {
  const tid = useTid();
  return useQuery({ queryKey: ["grade-levels",tid], queryFn: () => A.getGradeLevels(tid) });
}
export function useCreateGradeLevel() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createGradeLevel(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["grade-levels",tid] }) });
}
export function useClassSections() {
  const tid = useTid();
  return useQuery({ queryKey: ["sections",tid], queryFn: () => A.getClassSections(tid) });
}
export function useCreateClassSection() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createClassSection(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["sections",tid] }) });
}
export function useSubjects() {
  const tid = useTid();
  return useQuery({ queryKey: ["subjects",tid], queryFn: () => A.getSubjects(tid) });
}
export function useCreateSubject() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createSubject(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects",tid] }) });
}

// ─── Tenancy ─────────────────────────────────────────────────────────────────
export function useTenants() {
  return useQuery({ queryKey: ["tenants"], queryFn: () => A.getTenants() });
}
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: object) => A.createTenant(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants"] }) });
}

// ─── Transport ───────────────────────────────────────────────────────────────
export function useVehicles() {
  const tid = useTid();
  return useQuery({ queryKey: ["vehicles",tid], queryFn: () => A.getVehicles(tid) });
}
export function useCreateVehicle() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createVehicle(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles",tid] }) });
}
export function useRoutes() {
  const tid = useTid();
  return useQuery({ queryKey: ["routes",tid], queryFn: () => A.getRoutes(tid) });
}
export function useDrivers() {
  const tid = useTid();
  return useQuery({ queryKey: ["drivers",tid], queryFn: () => A.getDrivers(tid) });
}

// ─── Library ─────────────────────────────────────────────────────────────────
export function useBooks() {
  const tid = useTid();
  return useQuery({ queryKey: ["books",tid], queryFn: () => A.getBooks(tid) });
}
export function useCreateBook() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createBook(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["books",tid] }) });
}

// ─── Examinations ────────────────────────────────────────────────────────────
export function useExams() {
  const tid = useTid();
  return useQuery({ queryKey: ["exams",tid], queryFn: () => A.getExams(tid) });
}
export function useCreateExam() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createExam(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["exams",tid] }) });
}

// ─── Communication ───────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth(); const tid = useTid();
  return useQuery({ queryKey: ["notifications",tid,user?.id], queryFn: () => A.getNotifications(tid, user!.id), enabled: !!user?.id, refetchInterval: 30_000 });
}
export function useUnreadCount() {
  const { user } = useAuth(); const tid = useTid();
  return useQuery({
    queryKey: ["unread-count",tid,user?.id],
    queryFn: () => A.getUnreadCount(tid, user!.id).then(r => r.unreadCount ?? 0),
    enabled: !!user?.id, refetchInterval: 30_000,
  });
}
export function useMarkRead() {
  const qc = useQueryClient(); const { user } = useAuth(); const tid = useTid();
  return useMutation({
    mutationFn: (id: string) => A.markNotificationRead(id, tid, user!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-count"] }); },
  });
}
export function useMarkAllRead() {
  const qc = useQueryClient(); const { user } = useAuth(); const tid = useTid();
  return useMutation({
    mutationFn: () => A.markAllRead(tid, user!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); qc.invalidateQueries({ queryKey: ["unread-count"] }); },
  });
}
export function useConversations() {
  const tid = useTid();
  return useQuery({ queryKey: ["conversations",tid], queryFn: () => A.getConversations(tid) });
}
export function useMessages(convId?: string) {
  const tid = useTid();
  return useQuery({ queryKey: ["messages",tid,convId], queryFn: () => A.getMessages(tid, convId!), enabled: !!convId, refetchInterval: 5_000 });
}
export function useSendMessage(convId: string) {
  const qc = useQueryClient(); const { user } = useAuth(); const tid = useTid();
  return useMutation({ mutationFn: (msg: string) => A.sendMessage(tid, convId, msg, user?.id ?? ""), onSuccess: () => qc.invalidateQueries({ queryKey: ["messages",tid,convId] }) });
}
export function useCreateConversation() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createConversation(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations",tid] }) });
}

// ─── AI Core ─────────────────────────────────────────────────────────────────
export function useModelConfigs() {
  const tid = useTid();
  return useQuery({ queryKey: ["model-configs",tid], queryFn: () => A.getModelConfigs(tid) });
}
export function useCreateModelConfig() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createModelConfig(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["model-configs",tid] }) });
}
export function useKnowledgeCollections() {
  const tid = useTid();
  return useQuery({ queryKey: ["rag-collections",tid], queryFn: () => A.getKnowledgeCollections(tid) });
}
export function useCreateKnowledgeCollection() {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createKnowledgeCollection(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["rag-collections",tid] }) });
}
export function useExecutionLogs() {
  const tid = useTid();
  return useQuery({ queryKey: ["exec-logs",tid], queryFn: () => A.getExecutionLogs(tid), refetchInterval: 15_000 });
}

// ─── Reference ───────────────────────────────────────────────────────────────
export function useLookupTypes() {
  return useQuery({ queryKey: ["lookup-types"], queryFn: () => A.getLookupTypes() });
}
export function useLookupValues(typeCode: string) {
  return useQuery({ queryKey: ["lookup-values",typeCode], queryFn: () => A.getLookupValues(typeCode), enabled: !!typeCode });
}
export function useCreateLookup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: object) => A.createLookupValue(b), onSuccess: () => qc.invalidateQueries({ queryKey: ["lookup-values"] }) });
}
export function useDeleteLookup() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => A.deleteLookupValue(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["lookup-values"] }) });
}

// ─── AI mutations ─────────────────────────────────────────────────────────────
export function useAskChatbot(bot: "student"|"teacher"|"parent"|"admissions"|"admin") {
  const tid = useTid();
  return useMutation({ mutationFn: (q: string) => A.askChatbot(bot, { question: q, tenantId: tid }) });
}
export function useAskAssistant() {
  const tid = useTid();
  return useMutation({ mutationFn: (q: string) => A.askAssistant({ question: q, tenantId: tid }) });
}
export function useStartTutorSession() {
  return useMutation({ mutationFn: (b: object) => A.startTutorSession(b) });
}
export function useAskTutor() {
  return useMutation({ mutationFn: (b: object) => A.askTutor(b) });
}
export function useGenerateQuiz() {
  return useMutation({ mutationFn: (b: object) => A.generateQuiz(b) });
}
export function useStudentPrediction() {
  const tid = useTid();
  return useMutation({ mutationFn: ({ kind, ...rest }: { kind: string; [k: string]: unknown }) => A.predictStudent(kind, { tenantId: tid, ...rest }) });
}
export function useEarlyWarning(studentId: string) {
  const tid = useTid();
  return useQuery({
    queryKey: ["early-warning",tid,studentId],
    queryFn: () => A.getEarlyWarnings({ tenantId: tid, studentId }),
    enabled: !!studentId && !!tid,
    staleTime: 300_000,
  });
}
export function useImpersonate() {
  const { impersonate } = useAuth();
  return useMutation({ mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason: string }) => impersonate(targetUserId, reason) });
}

// ─── Teachers ────────────────────────────────────────────────────────────────
export function useTeacherStudents(eid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = eid ?? user?.employeeId ?? "";
  return useQuery({ queryKey: ["teacher-students",id,tid], queryFn: () => A.getTeacherStudents(id, tid), enabled: !!id });
}
export function useTeacherClasses(eid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = eid ?? user?.employeeId ?? "";
  return useQuery({ queryKey: ["teacher-classes",id,tid], queryFn: () => A.getTeacherClasses(id, tid), enabled: !!id });
}
export function useTeacherTimetable(eid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = eid ?? user?.employeeId ?? "";
  return useQuery({ queryKey: ["teacher-timetable",id,tid], queryFn: () => A.getTeacherTimetable(id, tid), enabled: !!id });
}
export function useTeacherWorkload(eid?: string) {
  const { user } = useAuth(); const tid = useTid();
  const id = eid ?? user?.employeeId ?? "";
  return useQuery({ queryKey: ["teacher-workload",id,tid], queryFn: () => A.getTeacherWorkload(id, tid), enabled: !!id });
}
export function useCreateTeacherAssignment(eid: string) {
  const qc = useQueryClient(); const tid = useTid();
  return useMutation({ mutationFn: (b: object) => A.createTeacherAssignment(eid, b), onSuccess: () => qc.invalidateQueries({ queryKey: ["teacher-assignments",eid,tid] }) });
}
export function useApplyTeacherLeave(eid: string) {
  return useMutation({ mutationFn: (b: object) => A.applyTeacherLeave(eid, b) });
}
