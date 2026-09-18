/**
 * NotFoundPage — 404 for routes that don't exist.
 */
import { useNavigate, useLocation } from "react-router-dom";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-code">404</div>

        <div className="error-icon">
          <SearchX size={28} style={{ color: "var(--muted)" }} />
        </div>

        <h1 className="error-title">Page not found</h1>
        <p className="error-desc">
          The page <code className="chip-tag">{location.pathname}</code> doesn't exist.
        </p>
        <p className="error-hint">
          It may have been moved, renamed, or the link may be incorrect.
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
