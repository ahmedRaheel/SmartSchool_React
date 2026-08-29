import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Shared page header used across all actor modules. */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </div>
  );
}
