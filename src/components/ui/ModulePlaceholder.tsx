interface ModulePlaceholderProps { module: string; }
export function ModulePlaceholder({ module }: ModulePlaceholderProps) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>{module}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>This module is backed by real API endpoints.<br/>Connect your backend to see live data here.</div>
    </div>
  );
}
