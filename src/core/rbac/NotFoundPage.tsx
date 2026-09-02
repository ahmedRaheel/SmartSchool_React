/**
 * NotFoundPage — 404 for routes that don't exist.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();
  const location = useLocation();

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
          fontSize: 80, fontWeight: 900, color: "var(--line-2)",
          lineHeight: 1, marginBottom: 8, letterSpacing: -4,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          404
        </div>

        <div style={{
          width: 64, height: 64, borderRadius: 18, background: "var(--surface-2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", border: "1.5px solid var(--line)",
        }}>
          <SearchX size={28} style={{ color: "var(--muted)" }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", letterSpacing: "-.4px" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: "0 0 6px" }}>
          The page <code style={{ fontSize: 12, padding: "2px 6px", background: "var(--surface-2)", borderRadius: 5, border: "1px solid var(--line)" }}>{location.pathname}</code> doesn't exist.
        </p>
        <p style={{ fontSize: 12, color: "var(--muted-2)", margin: "0 0 32px" }}>
          It may have been moved, renamed, or the link may be incorrect.
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
