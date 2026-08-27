import { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  description?: string;
}

/** Shared KPI card. Keeps icon, value and copy in dedicated layout regions. */
export function StatCard({ icon, value, label, description }: StatCardProps) {
  return (
    <article className="stat-card">
      <span className="stat-card-icon" aria-hidden="true">{icon}</span>
      <div className="stat-card-content">
        <strong className="stat-card-value">{value}</strong>
        <span className="stat-card-label">{label}</span>
        {description && <small className="stat-card-description">{description}</small>}
      </div>
    </article>
  );
}
