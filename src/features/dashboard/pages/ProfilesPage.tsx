import { useAuth } from "../../auth/auth";
import { PageHeader } from "../../../components/ui/PageHeader";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

export function ProfilesPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  if (!user) return null;

  const initials = user.initials || user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

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
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 16px",
            background: "linear-gradient(135deg,#6366F1,#8B5CF6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 28, fontWeight: 800,
          }}>
            {initials}
          </div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{user.name}</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 12 }}>{user.email}</div>
          <span style={{ padding: "3px 12px", borderRadius: 20, background: "#EEF2FF", color: "#6366F1", fontSize: 11, fontWeight: 700 }}>
            {user.role}
          </span>
          {user.impersonated && (
            <div style={{ marginTop: 12, padding: "6px 10px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 11, color: "#D97706" }}>
              ⚠️ Impersonated session
            </div>
          )}
        </div>

        {/* Details */}
        <div className="surface">
          <div className="surface-head"><h3>Account details</h3></div>
          <div style={{ padding: "0 20px 20px" }}>
            {fields.map(f => (
              <div key={f.label} style={{ display: "flex", padding: "12px 0", borderBottom: "1px solid var(--surface-2)", gap: 16, alignItems: "flex-start" }}>
                <span style={{ width: 140, flexShrink: 0, fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, wordBreak: "break-all" }}>{f.value || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
