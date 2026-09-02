/**
 * SmartSchool — Role-Based Access Control
 *
 * Single source of truth for what each role can see and do.
 * Import { can, usePermissions } anywhere — never hardcode role strings in pages.
 */

export type Role =
  | "SuperAdmin"
  | "Tenant"       // School Owner
  | "Principal"
  | "Admin"        // Admin Officer
  | "Teacher"
  | "Student"
  | "Parent"
  | "Driver"
  | "Accountant"
  | "HRManager"
  | "Librarian"
  | "Examiner";

// ── Permission keys ────────────────────────────────────────────────────────────
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
  | "students.own.view"          // student sees own record

  // HR / Staff
  | "hr.list"
  | "hr.view"
  | "hr.create"
  | "hr.edit"
  | "hr.delete"
  | "hr.own.view"               // employee sees own profile
  | "hr.leave.apply"
  | "hr.leave.approve"          // teacher approves student leave; admin/principal approves staff
  | "hr.leave.manage"           // full leave management

  // Payroll
  | "payroll.view"
  | "payroll.run"
  | "payroll.own.view"          // employee sees own payslip

  // Finance
  | "finance.invoices.list"
  | "finance.invoices.create"
  | "finance.invoices.manage"
  | "finance.fees.manage"
  | "finance.payments.record"
  | "finance.own.view"          // student/parent sees own fees

  // Attendance
  | "attendance.mark"           // teacher marks class attendance
  | "attendance.view.class"     // teacher views their class
  | "attendance.view.all"       // admin/principal sees all
  | "attendance.own.view"       // student sees own

  // Examinations
  | "exams.manage"              // create, schedule
  | "exams.enter.marks"         // teacher/examiner enters marks
  | "exams.publish"
  | "exams.view.all"
  | "exams.own.view"            // student sees own results
  | "exams.gradescale.manage"

  // Learning / Assignments
  | "learning.assignments.create"
  | "learning.assignments.view.all"
  | "learning.assignments.own"   // student sees own
  | "learning.submissions.grade"
  | "learning.lessons.manage"

  // AI features
  | "ai.assistant"              // RAG chatbot
  | "ai.tutor"                  // AI tutor (student focused)
  | "ai.quiz"
  | "ai.predictions.run"
  | "ai.predictions.class"      // teacher sees class-wide risk
  | "ai.agent"                  // autonomous agent (admin/teacher)
  | "ai.knowledge.manage"       // upload docs to RAG
  | "ai.models.configure"       // model config (superadmin)

  // Transport
  | "transport.fleet.manage"
  | "transport.routes.manage"
  | "transport.own.route"       // driver sees own route

  // Library
  | "library.catalogue.manage"
  | "library.loans.manage"
  | "library.own.loans"

  // Inventory
  | "inventory.manage"

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

// ── Permission matrix ──────────────────────────────────────────────────────────
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
    "finance.fees.manage", "finance.payments.record",
    "attendance.mark", "attendance.view.class", "attendance.view.all",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "learning.assignments.create", "learning.assignments.view.all", "learning.submissions.grade",
    "learning.lessons.manage",
    "ai.assistant", "ai.tutor", "ai.quiz", "ai.predictions.run", "ai.predictions.class",
    "ai.agent", "ai.knowledge.manage", "ai.models.configure",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  Tenant: [
    // Full school ownership — everything except platform admin
    "school.settings.manage", "school.setup.manage", "school.reports.view",
    "school.workflow.manage", "school.documents.manage", "school.communication.send",
    "school.notifications.view",
    "students.list", "students.view", "students.create", "students.edit", "students.delete",
    "hr.list", "hr.view", "hr.create", "hr.edit", "hr.delete",
    "hr.leave.manage", "hr.leave.approve",
    "payroll.view", "payroll.run",
    "finance.invoices.list", "finance.invoices.create", "finance.invoices.manage",
    "finance.fees.manage", "finance.payments.record",
    "attendance.mark", "attendance.view.class", "attendance.view.all",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "learning.assignments.create", "learning.assignments.view.all", "learning.submissions.grade",
    "learning.lessons.manage",
    "ai.assistant", "ai.tutor", "ai.quiz", "ai.predictions.run", "ai.predictions.class",
    "ai.agent", "ai.knowledge.manage",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  Principal: [
    "school.reports.view", "school.workflow.manage", "school.documents.manage",
    "school.communication.send", "school.notifications.view",
    "students.list", "students.view", "students.create", "students.edit",
    "hr.list", "hr.view", "hr.leave.approve", "hr.leave.manage",
    "payroll.view",
    "finance.invoices.list",
    "attendance.mark", "attendance.view.class", "attendance.view.all",
    "exams.manage", "exams.enter.marks", "exams.publish", "exams.view.all", "exams.gradescale.manage",
    "learning.assignments.create", "learning.assignments.view.all", "learning.submissions.grade",
    "learning.lessons.manage",
    "ai.assistant", "ai.quiz", "ai.predictions.run", "ai.predictions.class", "ai.agent", "ai.knowledge.manage",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages", "communication.broadcast",
    "profile.own.view", "profile.own.edit",
  ],

  Admin: [
    // Admin Officer — day-to-day school operations
    "school.reports.view", "school.documents.manage", "school.notifications.view",
    "students.list", "students.view", "students.create", "students.edit",
    "hr.list", "hr.view", "hr.leave.approve",
    "payroll.view",
    "finance.invoices.list", "finance.invoices.create", "finance.payments.record",
    "attendance.view.all", "attendance.mark",
    "exams.view.all",
    "learning.assignments.view.all",
    "ai.assistant", "ai.predictions.run", "ai.predictions.class",
    "transport.fleet.manage", "transport.routes.manage",
    "library.catalogue.manage", "library.loans.manage",
    "inventory.manage", "activities.manage", "activities.view",
    "admissions.manage", "admissions.view",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Teacher: [
    // Teacher — own classes only, student welfare in their subjects
    "school.notifications.view",
    "students.list",        // see class roster
    "students.view",        // view student profiles in their class
    "hr.own.view",          // own employee profile
    "hr.leave.apply",       // submit own leave
    "hr.leave.approve",     // approve student leave requests
    "payroll.own.view",     // own payslip
    "attendance.mark",      // mark own class attendance
    "attendance.view.class",
    "exams.enter.marks",    // enter marks for own subject
    "exams.view.all",       // view published results
    "learning.assignments.create",
    "learning.assignments.view.all",
    "learning.submissions.grade",
    "learning.lessons.manage",
    "ai.assistant", "ai.quiz", "ai.predictions.run", "ai.predictions.class", "ai.agent",
    "activities.view", "activities.manage",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Student: [
    // Student — own data only
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
    "hr.leave.apply",       // apply for leave
    "profile.own.view", "profile.own.edit",
  ],

  Parent: [
    // Parent — children's data only
    "school.notifications.view",
    "students.own.view",    // child's profile
    "attendance.own.view",  // child's attendance
    "exams.own.view",       // child's results
    "finance.own.view",     // child's fee account
    "activities.view",
    "ai.assistant", "ai.tutor", "ai.predictions.run",
    "communication.messages",
    "profile.own.view", "profile.own.edit",
  ],

  Driver: [
    "school.notifications.view",
    "transport.own.route",
    "students.list",        // manifest for route
    "hr.own.view",
    "hr.leave.apply",
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

// ── Runtime helpers ────────────────────────────────────────────────────────────

/** Normalise a raw role string from the JWT into our Role enum. */
export function normaliseRole(raw: string): Role {
  const r = raw.toLowerCase().trim();
  if (r === "superadmin")                                    return "SuperAdmin";
  if (r === "tenant" || r === "schoolowner" || r === "owner") return "Tenant";
  if (r === "principal")                                     return "Principal";
  if (r === "admin" || r === "adminofficer" || r === "schooladmin") return "Admin";
  if (r === "teacher")                                       return "Teacher";
  if (r === "student")                                       return "Student";
  if (r === "parent" || r === "guardian")                    return "Parent";
  if (r === "driver")                                        return "Driver";
  if (r === "accountant")                                    return "Accountant";
  if (r === "hrmanager" || r === "hr")                       return "HRManager";
  if (r === "librarian")                                     return "Librarian";
  if (r === "examiner")                                      return "Examiner";
  return "Admin"; // safe default
}

/** Return the set of permissions for a user's role(s). */
export function permissionsFor(roles: readonly string[]): Set<Permission> {
  const perms = new Set<Permission>();
  for (const raw of roles) {
    const role = normaliseRole(raw);
    for (const p of ROLE_PERMISSIONS[role] ?? []) perms.add(p);
  }
  return perms;
}

/** Check if a user with the given roles has a specific permission. */
export function can(roles: readonly string[], permission: Permission): boolean {
  return permissionsFor(roles).has(permission);
}

/** Check if the user has ANY of the listed permissions. */
export function canAny(roles: readonly string[], permissions: Permission[]): boolean {
  const perms = permissionsFor(roles);
  return permissions.some(p => perms.has(p));
}

/** Check if the user has ALL of the listed permissions. */
export function canAll(roles: readonly string[], permissions: Permission[]): boolean {
  const perms = permissionsFor(roles);
  return permissions.every(p => perms.has(p));
}

/** The primary normalised role for a user. */
export function primaryRole(roles: readonly string[]): Role {
  return normaliseRole(roles[0] ?? "Admin");
}
