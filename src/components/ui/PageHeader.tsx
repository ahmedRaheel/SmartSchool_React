import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface Crumb { label: string; href?: string; }

interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  action?:   ReactNode;
  breadcrumbs?: Crumb[];
  meta?:     ReactNode;  // extra info right of title
}

export function PageHeader({ title, subtitle, action, breadcrumbs, meta }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
            {breadcrumbs.map((c, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {i > 0 && <ChevronRight size={11} style={{ color: "var(--muted-2)" }} />}
                <span style={{ fontSize: 11, color: i === breadcrumbs.length - 1 ? "var(--muted)" : "var(--accent)", fontWeight: 600 }}>
                  {c.label}
                </span>
              </span>
            ))}
          </nav>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1>{title}</h1>
          {meta && <div style={{ flexShrink: 0 }}>{meta}</div>}
        </div>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
