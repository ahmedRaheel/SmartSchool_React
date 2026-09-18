import { useAuth } from "../../auth/auth";
import { PageHeader } from "../../../components/ui/PageHeader";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

export function ProfilesPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  if (!user) return null;

  const initials = user.initials || user.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const fields = [
    { label: "Full name",    value: user.name },
    { label: "Email",        value: user.email },
    { label: "Role",         value: user.role },
    { label: "Account type", value: user.accountType },
    { label: "School",       value: user.school },
    { label: "Tenant ID",    value: tid ?? "—" },
    { label: "User ID",      value: user.id },
    ...(user.employeeId ? [{ label: "Employee ID", value: user.employeeId }] : []),
    ...(user.studentId  ? [{ label: "Student ID",  value: user.studentId  }] : []),
    ...(user.driverId   ? [{ label: "Driver ID",   value: user.driverId   }] : []),
  ];

  return (
    <>
      <PageHeader title="My Profile" subtitle="Your account details"/>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>

        {/* Avatar card */}
        <div className="surface" style={{ textAlign: "center", padding: 32 }}>
          <div className="profile-avatar-lg">{initials}</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{user.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>{user.email}</div>
          <span className="role-badge">{user.role}</span>
          {user.impersonated && (
            <div className="warn-callout" style={{ marginTop: 12, fontSize: 11 }}>
              ⚠️ Impersonated session
            </div>
          )}
        </div>

        {/* Details */}
        <div className="surface">
          <div className="surface-head"><h3>Account details</h3></div>
          <div style={{ padding: "0 20px 20px" }}>
            {fields.map(f => (
              <div key={f.label} className="review-row">
                <span className="review-row-label">{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>{f.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
