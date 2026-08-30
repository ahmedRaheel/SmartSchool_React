import { useAuth } from "../../auth/auth";
import { PageHeader } from "../../../components/ui/PageHeader";

export function ProfilesPage() {
  const { user } = useAuth();
  if (!user) return null;

  const fields = [
    ["Name",        user.name],
    ["Email",       user.email],
    ["Role",        user.role],
    ["Account type",user.accountType],
    ["Tenant ID",   user.tenantId ?? "—"],
    ["School ID",   user.schoolId ?? "—"],
    ["Student ID",  user.studentId ?? "—"],
    ["Employee ID", user.employeeId ?? "—"],
    ["Driver ID",   user.driverId ?? "—"],
  ].filter(([,v]) => v && v !== "—");

  return (
    <>
      <PageHeader title="My Profile" subtitle="Account details and settings"/>
      <div className="surface" style={{ maxWidth:640, padding:24 }}>
        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:24, paddingBottom:20, borderBottom:"1px solid var(--line)" }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"var(--navy)", color:"#fff", display:"grid", placeItems:"center", fontSize:22, fontWeight:700, flexShrink:0 }}>
            {user.initials || user.name?.slice(0,2).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>{user.name}</h2>
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>{user.email}</div>
            <span className="status-pill info" style={{ marginTop:6, display:"inline-block" }}>{user.role}</span>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {fields.map(([l,v]) => (
            <div key={l as string} style={{ padding:"12px 14px", border:"0.5px solid var(--line)", borderRadius:10, background:"var(--surface-2)" }}>
              <div style={{ fontSize:10, color:"var(--muted)", fontWeight:700, textTransform:"uppercase", letterSpacing:.7, marginBottom:4 }}>{l}</div>
              <div style={{ fontSize:13, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
