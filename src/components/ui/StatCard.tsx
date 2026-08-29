import { type ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  note?: string;
  children: ReactNode;   // icon
  color?: string;
  bg?: string;
}

/**
 * Reusable KPI stat card used across all 9 actor dashboards.
 * Renders a colored icon, numeric value, label and optional trend note.
 */
export function StatCard({ label, value, note, children, color = "#2563EB", bg = "#EFF6FF" }: StatCardProps) {
  const isUp   = note?.includes("↑");
  const isDown = note?.includes("↓");

  return (
    <article className="stat-card">
      <div className="stat-icon" style={{ background: bg, color }}>
        {children}
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {note && (
          <div className={`stat-note ${isUp ? "stat-up" : isDown ? "stat-down" : ""}`}>
            {note}
          </div>
        )}
      </div>
    </article>
  );
}
