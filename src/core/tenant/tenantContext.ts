import { env } from "../../config/env";
import type { SessionUser } from "../../features/auth/auth";

export function effectiveTenantId(user:SessionUser|null):string {
  if (user?.roles?.includes("SuperAdmin")) {
    return sessionStorage.getItem("selected_tenant_id") || env.tenantId;
  }
  return user?.tenantId || sessionStorage.getItem("tenant_id") || env.tenantId;
}
