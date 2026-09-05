/**
 * usePermissions — React hook wrapping the RBAC system.
 * Use this in every page/component instead of checking role strings directly.
 */
import { useMemo } from "react";
import { useAuth } from "../../features/auth/auth";
import {
  can, canAny, canAll, permissionsFor, primaryRole,
  type Permission, type Role} from "./permissions";

export interface PermissionSet {
  role:    Role;
  can:     (p: Permission) => boolean;
  canAny:  (ps: Permission[]) => boolean;
  canAll:  (ps: Permission[]) => boolean;

  // Convenience booleans used across many pages
  isSuperAdmin:  boolean;
  isOwner:       boolean;   // School Owner (Tenant)
  isPrincipal:   boolean;
  isAdmin:       boolean;   // Admin Officer
  isTeacher:     boolean;
  isStudent:     boolean;
  isParent:      boolean;
  isDriver:      boolean;
  isAccountant:  boolean;
  isHRManager:   boolean;
  isLibrarian:   boolean;
  isExaminer:    boolean;

  // Staff = anyone who works at the school (not student/parent)
  isStaff:       boolean;
  // Can manage others (not just own data)
  isManagement:  boolean;
}

export function usePermissions(): PermissionSet {
  const { user } = useAuth();
  const roles = useMemo(() => user?.roles ?? (user?.role ? [user.role] : ["Admin"]), [user]);

  return useMemo(() => {
    const role = primaryRole(roles);
    const perms = permissionsFor(roles);
    const check = (p: Permission) => perms.has(p);

    const isStudent    = role === "Student";
    const isParent     = role === "Parent";
    const isDriver     = role === "Driver";
    const isTeacher    = role === "Teacher";
    const isLibrarian  = role === "Librarian";
    const isExaminer   = role === "Examiner";
    const isAccountant = role === "Accountant";
    const isHRManager  = role === "HRManager";
    const isAdmin      = role === "Admin";
    const isPrincipal  = role === "Principal";
    const isOwner      = role === "Tenant";
    const isSuperAdmin = role === "SuperAdmin";

    return {
      role,
      can: check,
      canAny: (ps: Permission[]) => ps.some(p => perms.has(p)),
      canAll: (ps: Permission[]) => ps.every(p => perms.has(p)),
      isSuperAdmin, isOwner, isPrincipal, isAdmin,
      isTeacher, isStudent, isParent, isDriver,
      isAccountant, isHRManager, isLibrarian, isExaminer,
      isStaff: !isStudent && !isParent,
      isManagement: isSuperAdmin || isOwner || isPrincipal || isAdmin,
    };
  }, [roles]);
}
