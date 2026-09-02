/**
 * RoleGuard — wraps a page/section and renders ForbiddenPage if the user
 * doesn't have the required permission.
 *
 * Usage:
 *   <RoleGuard require="students.list">
 *     <StudentsPage />
 *   </RoleGuard>
 *
 *   <RoleGuard requireAny={["hr.list","hr.own.view"]}>
 *     <HrPage />
 *   </RoleGuard>
 */
import type { ReactNode } from "react";
import { usePermissions } from "./usePermissions";
import { ForbiddenPage } from "./ForbiddenPage";
import type { Permission } from "./permissions";

interface Props {
  children: ReactNode;
  /** User must have this single permission. */
  require?: Permission;
  /** User must have at least one of these permissions. */
  requireAny?: Permission[];
  /** User must have ALL of these permissions. */
  requireAll?: Permission[];
}

export function RoleGuard({ children, require: single, requireAny, requireAll }: Props) {
  const perms = usePermissions();

  let allowed = true;
  if (single)      allowed = perms.can(single);
  if (requireAny)  allowed = perms.canAny(requireAny);
  if (requireAll)  allowed = perms.canAll(requireAll);

  if (!allowed) return <ForbiddenPage />;
  return <>{children}</>;
}
