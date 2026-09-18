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
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon danger">
          <ShieldOff size={32} style={{ color: "var(--danger)" }} />
        </div>

        <div className="error-eyebrow">Access denied — 403</div>
        <h1 className="error-title">You don't have permission</h1>
        <p className="error-desc">
          Your role <strong style={{ color: "var(--text)" }}>{user?.role ?? "Unknown"}</strong> does not have access to this section.
        </p>
        <p className="error-hint">
          If you believe this is an error, please contact your school administrator.
        </p>

        <div className="error-actions">
          <button className="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} /> Go back
          </button>
          <button className="primary" onClick={() => navigate("/")}>
            <Home size={15} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
