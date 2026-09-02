/**
 * ForbiddenPage — shown when a user navigates to a route they don't have permission for.
 */
import { useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../../features/auth/auth";

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24, background: "var(--bg)",
    }}>
      <div style={{
        maxWidth: 480, width: "100%", textAlign: "center",
        padding: 48, background: "var(--surface)", borderRadius: 24,
        border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, background: "var(--danger-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", border: "1.5px solid var(--danger-border)",
        }}>
          <ShieldOff size={32} style={{ color: "var(--danger)" }} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, color: "var(--danger)", marginBottom: 12 }}>
          Access denied — 403
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-.4px", color: "var(--text)" }}>
          You don't have permission
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 8px" }}>
          Your role <strong style={{ color: "var(--text)" }}>{user?.role ?? "Unknown"}</strong> does not have access to this section.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted-2)", lineHeight: 1.55, margin: "0 0 32px" }}>
          If you believe this is an error, please contact your school administrator.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 40, padding: "0 18px", borderRadius: 10,
              border: "1.5px solid var(--line)", background: "var(--surface)",
              color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
            <ArrowLeft size={15} /> Go back
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              height: 40, padding: "0 18px", borderRadius: 10,
              border: "none", background: "var(--navy)",
              color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
            <Home size={15} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
