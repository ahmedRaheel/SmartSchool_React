import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label:    string;
  value:    string;
  note?:    string;
  children: ReactNode;
  color?:   string;
  bg?:      string;
  onClick?: () => void;
  loading?: boolean;
  trend?:   "up" | "down" | "neutral";
}

export function StatCard({
  label, value, note, children,
  color = "#2563EB", bg = "#EFF6FF",
  onClick, loading, trend,
}: StatCardProps) {
  return (
    <article
      className="stat-card"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-icon" style={{ background: bg, color }}>
        {children}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        {loading ? (
          <div className="skeleton" style={{ height: 28, width: 80, marginTop: 4, borderRadius: 6 }} />
        ) : (
          <div className="stat-value">{value}</div>
        )}
        {note && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
            {trend === "up"   && <TrendingUp   size={11} style={{ color: "var(--success)" }} />}
            {trend === "down" && <TrendingDown  size={11} style={{ color: "var(--danger)"  }} />}
            <span className={`stat-note ${trend === "up" ? "stat-up" : trend === "down" ? "stat-down" : ""}`}>
              {note}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
