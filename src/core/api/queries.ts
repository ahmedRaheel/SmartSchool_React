/**
 * TanStack Query hooks — all queries keyed precisely to backend endpoints.
 * Fallback to mock data when API is unavailable in development.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardApi, studentsApi, hrApi, financeApi, admissionsApi,
  referenceApi, transportApi, libraryApi, examsApi, notificationApi,
  chatApi, organizationApi, academicsApi, aiCoreApi, aiApi, aiTutorApi,
  predictionApi, tenancyApi, identityApi, teachersApi,
} from "./smartschoolApi";
import { effectiveTenantId } from "../tenant/tenantContext";
import { useAuth } from "../../features/auth/auth";
import type { SessionUser } from "../../features/auth/auth";

// ─── Query key factory ────────────────────────────────────────────────────────
export const QK = {
  dashboard: (role: string, id?: string) => ["dashboard", role, id],
  students:  (tenantId: string, page = 1) => ["students", tenantId, page],
  student:   (id: string, tenantId: string) => ["student", id, tenantId],
  employees: (tenantId: string, page = 1) => ["employees", tenantId, page],
  invoices:  (tenantId: string, page = 1) => ["invoices", tenantId, page],
  admissions:(tenantId: string, page = 1) => ["admissions", tenantId, page],
  schools:   (tenantId: string) => ["schools", tenantId],
  campuses:  (tenantId: string) => ["campuses", tenantId],
  academicYears: (tenantId: string) => ["academic-years", tenantId],
  grades:    (tenantId: string) => ["grades", tenantId],
  sections:  (tenantId: string) => ["sections", tenantId],
  vehicles:  (tenantId: string) => ["vehicles", tenantId],
  books:     (tenantId: string) => ["books", tenantId],
  exams:     (tenantId: string) => ["exams", tenantId],
  notifications:(tenantId: string, userId: string) => ["notifications", tenantId, userId],
  unreadCount: (tenantId: string, userId: string) => ["unread-count", tenantId, userId],
  conversations: () => ["conversations"],
  messages:  (convId: string) => ["messages", convId],
  feeTypes:  (tenantId: string) => ["fee-types", tenantId],
  lookupTypes:(tenantId?: string) => ["lookup-types", tenantId],
  lookupValues:(typeCode: string, tenantId?: string) => ["lookup-values", typeCode, tenantId],
  modelConfigs: (tenantId: string) => ["model-configs", tenantId],
  collections: (tenantId: string) => ["rag-collections", tenantId],
  execLogs:  (tenantId: string) => ["exec-logs", tenantId],
  tenants:   () => ["tenants"],
  users:     (tenantId?: string) => ["users", tenantId],
  workload:  (eid: string, tid: string) => ["workload", eid, tid],
  timetable: (eid: string, tid: string) => ["timetable", eid, tid],
};

function useTenant(user: SessionUser | null): string {
  return effectiveTenantId(user);
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function useAdminDashboard() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.dashboard("admin", tenantId),
    queryFn: () => dashboardApi.admin(tenantId).then(r => r.data),
    staleTime: 60_000,
  });
}
export function useStudentDashboard(studentId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const sid = studentId ?? user?.studentId ?? "";
  return useQuery({
    queryKey: QK.dashboard("student", sid),
    queryFn: () => dashboardApi.student(sid, tenantId).then(r => r.data),
    enabled: !!sid,
  });
}
export function useTeacherDashboard(employeeId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const eid = employeeId ?? user?.employeeId ?? "";
  return useQuery({
    queryKey: QK.dashboard("teacher", eid),
    queryFn: () => dashboardApi.teacher(eid, tenantId).then(r => r.data),
    enabled: !!eid,
  });
}
export function useParentDashboard(guardianId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const gid = guardianId ?? user?.businessEntityId ?? "";
  return useQuery({
    queryKey: QK.dashboard("parent", gid),
    queryFn: () => dashboardApi.parent(gid, tenantId).then(r => r.data),
    enabled: !!gid,
  });
}
export function useDriverDashboard(driverId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const did = driverId ?? user?.driverId ?? "";
  return useQuery({
    queryKey: QK.dashboard("driver", did),
    queryFn: () => dashboardApi.driver(did, tenantId).then(r => r.data),
    enabled: !!did,
  });
}

// ─── Students ─────────────────────────────────────────────────────────────────
export function useStudents(page = 1) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.students(tenantId, page),
    queryFn: () => studentsApi.page(tenantId, { page }).then(r => r.data),
  });
}
export function useCreateStudent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => studentsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.students(tenantId) }),
  });
}

// ─── HR / Employees ───────────────────────────────────────────────────────────
export function useEmployees(page = 1) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.employees(tenantId, page),
    queryFn: () => hrApi.page(tenantId, { page }).then(r => r.data),
  });
}
export function useCreateEmployee() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => hrApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.employees(tenantId) }),
  });
}

// ─── Finance ─────────────────────────────────────────────────────────────────
export function useInvoices(page = 1) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.invoices(tenantId, page),
    queryFn: () => financeApi.invoices(tenantId, { page }).then(r => r.data),
  });
}
export function useCreateInvoice() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => financeApi.createInvoice(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.invoices(tenantId) }),
  });
}
export function useRecordPayment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => financeApi.recordPayment(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.invoices(tenantId) }),
  });
}

// ─── Admissions ───────────────────────────────────────────────────────────────
export function useAdmissions(page = 1) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.admissions(tenantId, page),
    queryFn: () => admissionsApi.page(tenantId, { page }).then(r => r.data),
  });
}
export function useCreateAdmission() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => admissionsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.admissions(tenantId) }),
  });
}

// ─── Organization ─────────────────────────────────────────────────────────────
export function useSchools() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.schools(tenantId),
    queryFn: () => organizationApi.schools(tenantId).then(r => r.data),
  });
}
export function useCampuses() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.campuses(tenantId),
    queryFn: () => organizationApi.campuses(tenantId).then(r => r.data),
  });
}
export function useCreateSchool() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: object) => organizationApi.createSchool(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.schools(tenantId) }),
  });
}

// ─── Academics ────────────────────────────────────────────────────────────────
export function useAcademicYears() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.academicYears(tenantId),
    queryFn: () => academicsApi.academicYears(tenantId).then(r => r.data),
  });
}

// ─── Reference / Lookup ───────────────────────────────────────────────────────
export function useLookupTypes() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.lookupTypes(tenantId),
    queryFn: () => referenceApi.types(tenantId).then(r => r.data),
  });
}
export function useLookupValues(typeCode: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.lookupValues(typeCode, tenantId),
    queryFn: () => referenceApi.byType(typeCode, tenantId).then(r => r.data),
    enabled: !!typeCode,
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export function useNotifications() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.notifications(tenantId, user?.id ?? ""),
    queryFn: () => notificationApi.list(tenantId, user!.id).then(r => r.data),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });
}
export function useUnreadCount() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.unreadCount(tenantId, user?.id ?? ""),
    queryFn: () => notificationApi.unreadCount(tenantId, user!.id).then(r => r.data.unreadCount),
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export function useConversations() {
  return useQuery({
    queryKey: QK.conversations(),
    queryFn: () => chatApi.conversations().then(r => r.data),
  });
}
export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: QK.messages(conversationId ?? ""),
    queryFn: () => chatApi.messages(conversationId!).then(r => r.data),
    enabled: !!conversationId,
    refetchInterval: 5_000,
  });
}
export function useSendMessage(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => chatApi.send(conversationId, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.messages(conversationId) }),
  });
}

// ─── Transport ────────────────────────────────────────────────────────────────
export function useVehicles() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.vehicles(tenantId),
    queryFn: () => transportApi.vehicles(tenantId).then(r => r.data),
  });
}

// ─── Library ──────────────────────────────────────────────────────────────────
export function useBooks() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.books(tenantId),
    queryFn: () => libraryApi.books(tenantId).then(r => r.data),
  });
}

// ─── Examinations ─────────────────────────────────────────────────────────────
export function useExams() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.exams(tenantId),
    queryFn: () => examsApi.exams(tenantId).then(r => r.data),
  });
}

// ─── AI Core ─────────────────────────────────────────────────────────────────
export function useModelConfigs() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.modelConfigs(tenantId),
    queryFn: () => aiCoreApi.modelConfigs(tenantId).then(r => r.data),
  });
}
export function useKnowledgeCollections() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.collections(tenantId),
    queryFn: () => aiCoreApi.collections(tenantId).then(r => r.data),
  });
}
export function useExecutionLogs() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: QK.execLogs(tenantId),
    queryFn: () => aiCoreApi.executionLogs(tenantId).then(r => r.data),
    refetchInterval: 15_000,
  });
}

// ─── Teacher workspace ────────────────────────────────────────────────────────
export function useTeacherWorkload(employeeId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const eid = employeeId ?? user?.employeeId ?? "";
  return useQuery({
    queryKey: QK.workload(eid, tenantId),
    queryFn: () => teachersApi.workload(eid, tenantId).then(r => r.data),
    enabled: !!eid,
  });
}
export function useTeacherTimetable(employeeId?: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  const eid = employeeId ?? user?.employeeId ?? "";
  return useQuery({
    queryKey: QK.timetable(eid, tenantId),
    queryFn: () => teachersApi.timetable(eid, tenantId).then(r => r.data),
    enabled: !!eid,
  });
}

// ─── Tenancy ─────────────────────────────────────────────────────────────────
export function useTenants() {
  return useQuery({
    queryKey: QK.tenants(),
    queryFn: () => tenancyApi.list().then(r => r.data),
  });
}
export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: object) => tenancyApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.tenants() }),
  });
}

// ─── AI mutation helpers ──────────────────────────────────────────────────────
export function useAskChatbot(bot: "student" | "teacher" | "parent" | "admissions" | "admin") {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (question: string) =>
      aiApi.chatbot(bot, { question, tenantId }).then(r => r.data),
  });
}
export function useAskAssistant() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (question: string) =>
      aiApi.ask({ question, tenantId }).then(r => r.data),
  });
}
export function useStartTutorSession() {
  return useMutation({
    mutationFn: (body: { studentId: string; subject: string; topic?: string; tenantId?: string }) =>
      aiTutorApi.start(body).then(r => r.data),
  });
}
export function useAskTutor() {
  return useMutation({
    mutationFn: (body: {
      sessionId: string; studentId: string; subject: string;
      topic: string; message: string; tenantId?: string;
    }) => aiTutorApi.ask(body).then(r => r.data),
  });
}
export function useGenerateQuiz() {
  return useMutation({
    mutationFn: (body: {
      studentId: string; subject: string; topic: string;
      questionCount?: number; difficulty?: string; tenantId?: string;
    }) => aiTutorApi.generateQuiz(body).then(r => r.data),
  });
}
export function useStudentPrediction() {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useMutation({
    mutationFn: (body: {
      kind: "DropoutRisk" | "GradeDecline" | "FeeDefault" | "AttendanceAnomaly";
      studentId: string; subjectId?: string;
    }) => predictionApi.student(body.kind, { tenantId, ...body }).then(r => r.data),
  });
}
export function useEarlyWarning(studentId: string) {
  const { user } = useAuth();
  const tenantId = useTenant(user);
  return useQuery({
    queryKey: ["early-warning", studentId, tenantId],
    queryFn: () => predictionApi.earlyWarning({ tenantId, studentId }).then(r => r.data),
    enabled: !!studentId && !!tenantId,
    staleTime: 300_000,
  });
}
export function useImpersonate() {
  const { impersonate } = useAuth();
  return useMutation({
    mutationFn: ({ targetUserId, reason }: { targetUserId: string; reason: string }) =>
      impersonate(targetUserId, reason),
  });
}
