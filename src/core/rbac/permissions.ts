/**
 * SmartSchool — Role-Based Access Control
 * Single source of truth for what each role can see and do.
 */

export type Role =
  | "SuperAdmin"
  | "Tenant"
  | "Principal"
  | "Admin"
  | "Teacher"
  | "Student"
  | "Parent"
  | "Driver"
  | "Accountant"
  | "HRManager"
  | "Librarian"
  | "Examiner";

export type Permission =
  // Platform (SuperAdmin only)
  | "platform.tenants.manage"
  | "platform.subscriptions.manage"
  | "platform.audit.view"
  | "platform.ai.configure"
  | "platform.users.create"
  | "platform.users.delete"

  // School-wide
  | "school.settings.manage"
  | "school.setup.manage"
  | "school.reports.view"
  | "school.workflow.manage"
  | "school.documents.manage"
  | "school.communication.send"
  | "school.notifications.view"

  // Students
  | "students.list"
  | "students.view"
  | "students.create"
  | "students.edit"
  | "students.delete"
  | "students.own.view"

  // HR / Staff
  | "hr.list"
  | "hr.view"
  | "hr.create"
  | "hr.edit"
  | "hr.delete"
  | "hr.own.view"
  | "hr.leave.apply"
  | "hr.leave.approve"
  | "hr.leave.manage"

  // Payroll
  | "payroll.view"
  | "payroll.run"
  | "payroll.own.view"

  // Finance
  | "finance.invoices.list"
  | "finance.invoices.create"
  | "finance.invoices.manage"
  | "finance.fees.manage"
  | "finance.payments.record"
  | "finance.waiver.approve"    // Principal can approve fee waiver requests
  | "finance.own.view"

  // Attendance
  | "attendance.mark"
  | "attendance.view.class"
  | "attendance.view.all"
  | "attendance.own.view"
  | "attendance.edit"           // correct a submitted attendance record

  // Examinations
  | "exams.manage"
  | "exams.enter.marks"
  | "exams.publish"
  | "exams.view.all"
  | "exams.own.view"
  | "exams.gradescale.manage"

  // Learning / Assignments
  | "learning.assignments.create"
  | "learning.assignments.view.all"
  | "learning.assignments.own"
  | "learning.submissions.grade"
  | "learning.lessons.manage"

  // Audit — view only, system-written, no one can add/delete
  | "audit.view"

  // AI
  | "ai.assistant"
  | "ai.tutor"
  | "ai.quiz"
  | "ai.predictions.run"
  | "ai.predictions.class"
  | "ai.agent"
  | "ai.knowledge.manage"
  | "ai.models.configure"

  // Transport
  | "transport.fleet.manage"
  | "transport.routes.manage"
  | "transport.own.route"

  // Library
  | "library.catalogue.manage"
  | "library.loans.manage"
  | "library.own.loans"

  // Inventory
  | "inventory.manage"
  | "inventory.view"

  // Activities
  | "activities.manage"
  | "activities.view"

  // Admissions
  | "admissions.manage"
  | "admissions.view"

  // Communication
  | "communication.messages"
  | "communication.broadcast"

  // Profile
  | "profile.own.view"
  | "profile.own.edit";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {

  SuperAdmin: [
    "platform.tenants.manage", "platform.subscriptions.manage", "platform.audit.view",
    "platform.ai.configure", "platform.users.create", "platform.users.delete",
    "school.settings.manage", "school.setup.manage", "school.reports.view",
    "school.workflow.manage", "school.documents.manage", "school.communication.send",
    "school.notifications.view",
    "students.list", "students.view", "students.create", "students.edit", "students.delete",
    "hr.list", "hr.view", "hr.create", "hr.edit", "hr.delete",
    "hr.leave.manage", "hr.leave.approve",
    "payroll.view", "payroll.run",
    "finance.invoices.list", "finance.invoices.create", "finance.invoices.manage",
    "finance.fees.manage", "finance.payments.record", "finance.waiver.approve",
    "attendance.mark", "attendance.view.class", "attendance.view.all", "attendance.edit",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "learning.assignments.create", "learning.assignments.view.all", "learning.submissions.grade",
    "learning.lessons.manage",
    "audit.view",
    "ai.assistant", "ai.tutor", "ai.quiz", "ai.predictions.run", "ai.predictions.class",
    "ai.agent", "ai.knowledge.manage", "ai.models.configure",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "inventory.view",
    "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  Tenant: [
    "school.settings.manage", "school.setup.manage", "school.reports.view",
    "school.workflow.manage", "school.documents.manage", "school.communication.send",
    "school.notifications.view",
    "students.list", "students.view", "students.create", "students.edit", "students.delete",
    "hr.list", "hr.view", "hr.create", "hr.edit", "hr.delete",
    "hr.leave.manage", "hr.leave.approve",
    "payroll.view", "payroll.run",
    "finance.invoices.list", "finance.invoices.create", "finance.invoices.manage",
    "finance.fees.manage", "finance.payments.record", "finance.waiver.approve",
    "attendance.mark", "attendance.view.class", "attendance.view.all", "attendance.edit",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "learning.assignments.create", "learning.assignments.view.all", "learning.submissions.grade",
    "learning.lessons.manage",
    "audit.view",
    "ai.assistant", "ai.tutor", "ai.quiz", "ai.predictions.run", "ai.predictions.class",
    "ai.agent", "ai.knowledge.manage",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "inventory.view",
    "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  // ── Principal ───────────────────────────────────────────────────────────────
  // VIEW students/staff/attendance/results/assignments — cannot ADD finance records
  // Can approve fee waivers (requests routed to principal)
  // Audit is view-only (system-written, no one can add/delete)
  Principal: [
    "school.reports.view", "school.workflow.manage", "school.documents.manage",
    "school.communication.send", "school.notifications.view",
    // Students — view list, view profile — NO create/delete
    "students.list", "students.view",
    // Staff — view only, can approve leave
    "hr.list", "hr.view", "hr.leave.approve", "hr.leave.manage",
    // Finance — list invoices only, approve waiver requests — NO create/record
    "finance.invoices.list", "finance.waiver.approve",
    // Attendance — view all, NO mark (teacher marks), can edit corrections
    "attendance.view.class", "attendance.view.all", "attendance.edit",
    // Exams & Results — view all, publish results — NO add/delete
    "exams.view.all", "exams.publish", "exams.gradescale.manage",
    // Learning — view all assignments/submissions — NO create/delete
    "learning.assignments.view.all",
    // Audit — view only (system-written, no one can add)
    "audit.view",
    // AI — insights and reports
    "ai.assistant", "ai.quiz", "ai.predictions.run", "ai.predictions.class",
    "ai.agent", "ai.knowledge.manage",
    // Other operational views
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.view",
    "activities.view",
    "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  Admin: [
    "school.reports.view", "school.documents.manage", "school.notifications.view",
    "school.communication.send",
    "students.list", "students.view", "students.create", "students.edit",
    "hr.list", "hr.view", "hr.leave.approve",
    "payroll.view",
    "finance.invoices.list", "finance.invoices.create", "finance.payments.record",
    "attendance.view.all", "attendance.mark", "attendance.edit",
    "exams.view.all",
    "learning.assignments.view.all",
    "audit.view",
    "ai.assistant", "ai.predictions.run", "ai.predictions.class",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "inventory.view",
    "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  // ── Teacher ─────────────────────────────────────────────────────────────────
  // NO finance, NO HR management, NO inventory
  // Only own class attendance + grading + assignments
  Teacher: [
    "school.notifications.view",
    "students.list", "students.view",
    "hr.own.view", "hr.leave.apply", "hr.leave.approve",
    "payroll.own.view",
    // Attendance — mark own class only
    "attendance.mark", "attendance.view.class",
    // Exams — enter marks + view results (no manage/publish)
    "exams.enter.marks", "exams.view.all",
    // Assignments — full control of own assignments
    "learning.assignments.create", "learning.assignments.view.all",
    "learning.submissions.grade", "learning.lessons.manage",
    "activities.view", "activities.manage",
    "ai.assistant", "ai.quiz", "ai.predictions.run", "ai.predictions.class", "ai.agent",
    "communication.messages",
    "library.own.loans",
    "profile.own.view", "profile.own.edit",
  ],

  Student: [
    "school.notifications.view",
    "students.own.view",
    "attendance.own.view",
    "exams.own.view",
    "finance.own.view",
    "learning.assignments.own",
    "library.own.loans",
    "activities.view",
    "ai.tutor", "ai.quiz", "ai.assistant", "ai.predictions.run",
    "communication.messages",
    "hr.leave.apply",
    "profile.own.view", "profile.own.edit",
  ],

  Parent: [
    "school.notifications.view",
    "students.own.view",
    "attendance.own.view",
    "exams.own.view",
    "finance.own.view",
    "activities.view",
    "ai.assistant", "ai.tutor", "ai.predictions.run",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Driver: [
    "school.notifications.view",
    "transport.own.route",
    "students.list",
    "hr.own.view", "hr.leave.apply",
    "payroll.own.view",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Accountant: [
    "school.reports.view", "school.notifications.view",
    "students.list", "students.view",
    "finance.invoices.list", "finance.invoices.create", "finance.invoices.manage",
    "finance.fees.manage", "finance.payments.record",
    "payroll.view", "payroll.run",
    "hr.own.view", "hr.leave.apply", "payroll.own.view",
    "ai.assistant",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  HRManager: [
    "school.reports.view", "school.notifications.view",
    "hr.list", "hr.view", "hr.create", "hr.edit",
    "hr.leave.manage", "hr.leave.approve",
    "payroll.view", "payroll.run",
    "hr.own.view", "hr.leave.apply", "payroll.own.view",
    "ai.assistant",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Librarian: [
    "school.notifications.view",
    "students.list", "students.view",
    "library.catalogue.manage", "library.loans.manage",
    "hr.own.view", "hr.leave.apply", "payroll.own.view",
    "ai.assistant",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Examiner: [
    "school.reports.view", "school.notifications.view",
    "students.list", "students.view",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "hr.own.view", "hr.leave.apply", "payroll.own.view",
    "ai.assistant", "ai.predictions.run",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],
};

export function normaliseRole(raw: string): Role {
  const r = raw.toLowerCase().trim();
  if (r === "superadmin")                                         return "SuperAdmin";
  if (r === "tenant" || r === "schoolowner" || r === "owner")    return "Tenant";
  if (r === "principal")                                          return "Principal";
  if (r === "admin" || r === "adminofficer" || r === "schooladmin") return "Admin";
  if (r === "teacher")                                            return "Teacher";
  if (r === "student")                                            return "Student";
  if (r === "parent" || r === "guardian")                         return "Parent";
  if (r === "driver")                                             return "Driver";
  if (r === "accountant")                                         return "Accountant";
  if (r === "hrmanager" || r === "hr")                            return "HRManager";
  if (r === "librarian")                                          return "Librarian";
  if (r === "examiner")                                           return "Examiner";
  return "Admin";
}

export function permissionsFor(roles: readonly string[]): Set<Permission> {
  const perms = new Set<Permission>();
  for (const raw of roles) {
    for (const p of ROLE_PERMISSIONS[normaliseRole(raw)] ?? []) perms.add(p);
  }
  return perms;
}

export function can(roles: readonly string[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}
export function canAny(roles: readonly string[], permissions: Permission[]): boolean {
  const perms = permissionsFor(roles);
  return permissions.some(p => perms.has(p));
}
export function canAll(roles: readonly string[], permissions: Permission[]): boolean {
  const perms = permissionsFor(roles);
  return permissions.every(p => perms.has(p));
}
export function primaryRole(roles: readonly string[]): Role {
  return normaliseRole(roles[0] ?? "Admin");
}
