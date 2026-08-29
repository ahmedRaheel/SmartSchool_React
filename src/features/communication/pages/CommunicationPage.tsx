import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { notifications } from "../../../mocks/data";

const INBOX = [
  { from: "Ms. Aisha (Math)", msg: "Ahmed scored 18/20 — excellent performance!", time: "2h ago", bg: "#EEF2FF", color: "#6366F1" },
  { from: "Admin Office",     msg: "August fee receipt is ready for download.",   time: "1d ago", bg: "#EFF6FF", color: "#2563EB" },
  { from: "Principal",        msg: "Parent-Teacher meeting Sep 2, 2026.",         time: "2d ago", bg: "#FFFBEB", color: "#D97706" },
  { from: "Finance Office",   msg: "August salary slip has been processed.",      time: "2d ago", bg: "#F5F3FF", color: "#8B5CF6" },
];

export function CommunicationPage() {
  return (
    <>
      <PageHeader
        title="Communication Centre"
        subtitle="Notices, messages and school-wide announcements"
        action={
          <div className="page-actions">
            <button className="primary"><Plus size={15} /> New Announcement</button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Inbox */}
        <div className="surface">
          <div className="surface-head"><h3>Inbox</h3><p>Recent messages across all actors</p></div>
          <div style={{ padding: "0 18px 16px" }}>
            {INBOX.map(m => (
              <div key={m.from} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--surface-2)" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: m.bg, color: m.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 11,
                }}>
                  {m.from[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}><b>{m.from}:</b> {m.msg}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="surface">
          <div className="surface-head"><h3>Notifications</h3><p>System notifications for your role</p></div>
          <div style={{ padding: "0 18px 16px" }}>
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: "1px solid var(--surface-2)", alignItems: "flex-start" }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0,
                  background: n.read ? "var(--line)" : "var(--purple)",
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
