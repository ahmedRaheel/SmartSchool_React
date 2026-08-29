import { useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Menu, MessageSquare, Moon, Search, Send, Settings, ShieldCheck, Sun, UserRound, X } from "lucide-react";
import { useAuth } from "../../features/auth/auth";
import { Modal, useUi } from "../ui/InteractiveUi";
import { Sidebar } from "./Sidebar";
import { getNotifications, getUnreadCount, markAllRead, markRead, type NotificationItem } from "../../features/communication/api/notifications";
import { createNotificationConnection } from "../../features/communication/realtime/communicationRealtime";
import { effectiveTenantId } from "../../core/tenant/tenantContext";
import { FloatingAiChatbot } from "../../features/ai/components/FloatingAiChatbot";
import { PageErrorBoundary } from "../ui/PageErrorBoundary";

// ─── Inter-actor chat contacts (populated dynamically by role) ─
const ALL_ACTORS = [
  { id: "superadmin", title: "Super Admin",    subtitle: "Platform Master",        initials: "SA", path: "/communication" },
  { id: "principal",  title: "Principal",       subtitle: "Academic Head",          initials: "PR", path: "/communication" },
  { id: "admin",      title: "Admin Officer",   subtitle: "School Operations",      initials: "AO", path: "/communication" },
  { id: "teacher",    title: "Ms. Aisha",       subtitle: "Mathematics Teacher",    initials: "TS", path: "/communication" },
  { id: "parent",     title: "Mr. Hassan",      subtitle: "Parent — Ahmed, Hina",  initials: "PA", path: "/communication" },
  { id: "finance",    title: "Finance Office",  subtitle: "Accounts & Fees",        initials: "FO", path: "/finance" },
  { id: "driver",     title: "Bus Driver",      subtitle: "Route A — North",        initials: "DR", path: "/transport" },
];

export function AppShell() {
  const { user, logout, stopImpersonation } = useAuth();
  const { notify } = useUi();
  const nav = useNavigate();

  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [drawer,       setDrawer]       = useState<"chat" | "notifications" | null>(null);
  const [notes,        setNotes]        = useState<NotificationItem[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [activeChat,   setActiveChat]   = useState(ALL_ACTORS[3]); // Ms. Aisha default
  const [messages,     setMessages]     = useState<Record<string, string[]>>({
    teacher:  ["Ms. Aisha: Grade 10 timetable review is ready.", "You: Thanks, sharing now."],
    parent:   ["Mr. Hassan: Query about Ahmed's Physics grade — can we schedule a call?"],
    admin:    ["Admin Office: August fee collection summary has been prepared."],
    principal:["Principal: Staff meeting tomorrow at 9 AM in the conference room."],
    finance:  ["Finance Office: August payroll is processed. Slip shared."],
    driver:   ["Bus Driver: Route C delay — 15 min behind schedule today."],
  });
  const [chatText,     setChatText]     = useState("");
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [q,            setQ]            = useState("");
  const [dark,         setDark]         = useState(() => localStorage.getItem("smartschool.theme") === "dark");

  const profileRef  = useRef<HTMLDivElement>(null);
  const tenantId    = effectiveTenantId(user);

  // ── Theme toggle ────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("smartschool.theme", dark ? "dark" : "light");
  }, [dark]);

  // ── Global keyboard shortcut Ctrl/Cmd+K ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Close profile popover on outside click ──────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Load notifications + SignalR ────────────────────────────
  async function loadNotifications() {
    if (!user?.id || !tenantId) return;
    try {
      const [page, count] = await Promise.all([
        getNotifications(tenantId, user.id),
        getUnreadCount(tenantId, user.id),
      ]);
      setNotes(page.items ?? []);
      setUnreadCount(count ?? 0);
    } catch {}
  }

  useEffect(() => {
    if (!user?.id || !tenantId) return;
    let disposed = false;
    const hub = createNotificationConnection(notification => {
      if (disposed) return;
      setNotes(cur => [notification, ...cur.filter(n => n.id !== notification.id)].slice(0, 30));
      if (!notification.isRead) setUnreadCount(cur => cur + 1);
    });
    void loadNotifications();
    const t = window.setTimeout(() => {
      if (!disposed) void hub.start().catch(() => {});
    }, 100);
    return () => { disposed = true; window.clearTimeout(t); if (hub.state !== "Disconnected") void hub.stop(); };
  }, [user?.id, tenantId]);

  // ── Searchable modules ──────────────────────────────────────
  const modules = useMemo(() => [
    ["Dashboard","/"], ["Students","/students"], ["Teachers","/teachers"],
    ["Academics","/academics"], ["Examinations","/examinations"],
    ["Attendance","/attendance"], ["Finance","/finance"], ["HR & Payroll","/hr"],
    ["Transport","/transport"], ["Library","/library"],
    ["Communication","/communication"], ["AI Assistant","/ai"],
    ["Admissions","/admissions"], ["Reports","/reports"],
    ["Settings","/settings"], ["Tenants","/tenancy"], ["Platform","/platform"],
  ] as const, []);

  const results = useMemo(() =>
    q.trim()
      ? modules.filter(([t]) => t.toLowerCase().includes(q.toLowerCase()))
          .map(([title, path]) => ({ title, path }))
      : [],
  [q, modules]);

  // ── Chat send ───────────────────────────────────────────────
  function send() {
    const val = chatText.trim();
    if (!val) return;
    setMessages(s => ({ ...s, [activeChat.id]: [...(s[activeChat.id] ?? []), `You: ${val}`] }));
    setChatText("");
    notify({ kind: "success", title: "Message sent", message: `Your message to ${activeChat.title} was delivered.` });
    // Simulate reply after 1.2s
    setTimeout(() => {
      const replies = ["Understood, thank you!", "I'll look into that right away.", "Got it. Will follow up shortly.", "Thanks for the update!"];
      const reply = replies[Math.floor(Math.random() * replies.length)];
      setMessages(s => ({ ...s, [activeChat.id]: [...(s[activeChat.id] ?? []), `${activeChat.title}: ${reply}`] }));
    }, 1200);
  }

  const go = (path: string) => { setDrawer(null); setSearchOpen(false); nav(path); };

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main">
        {/* Impersonation banner */}
        {user?.impersonated && (
          <div className="impersonation-banner" role="status">
            <div><ShieldCheck size={16} /><span><b>Support session:</b> viewing SmartSchool as {user.name} ({user.role}). Actions are audited.</span></div>
            <button onClick={() => { stopImpersonation(); window.location.assign("/"); }}>Return to administrator</button>
          </div>
        )}

        {/* Topbar */}
        <header className="topbar">
          <div className="tb-left">
            <button className="mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}>
              <Menu size={19} />
            </button>
            <div className="breadcrumb">SmartSchool / <strong>Workspace</strong></div>
          </div>

          <button
            className="global-search"
            style={{ textAlign: "left", border: "1.5px solid var(--line)", cursor: "text" }}
            onClick={() => setSearchOpen(true)}
          >
            <Search size={15} />
            <span style={{ flex: 1, color: "var(--muted)", fontSize: 12 }}>Search modules…</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="top-actions">
            <button className="top-icon" title="Inter-actor chat" onClick={() => setDrawer("chat")}>
              <MessageSquare size={18} />
              <span className="notification-dot" />
            </button>
            <button className="top-icon" title="Notifications" onClick={() => setDrawer("notifications")}>
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </button>
            <button className="top-icon" title="Toggle theme" onClick={() => setDark(v => !v)}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="profile-menu" ref={profileRef}>
              <button className="profile-trigger" onClick={() => setProfileOpen(v => !v)}>
                <span className="avatar">{user?.initials}</span>
                <span className="profile-copy">
                  <b>{user?.name}</b>
                  <small>{user?.role}</small>
                </span>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="profile-popover">
                  <div className="profile-summary">
                    <span className="avatar large">{user?.initials}</span>
                    <div>
                      <b>{user?.name}</b>
                      <small>{user?.email}</small>
                    </div>
                  </div>
                  <button onClick={() => nav("/profiles")}><UserRound size={16} /> My profile</button>
                  <button onClick={() => nav("/settings")}><Settings size={16} /> Account settings</button>
                  <hr />
                  <button className="logout-item" onClick={() => { logout(); nav("/login", { replace: true }); }}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="content">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </div>
      </main>

      {/* ── Right drawer (chat + notifications) ────────────── */}
      {drawer && (
        <>
          <button className="drawer-backdrop" onClick={() => setDrawer(null)} />
          <aside className="right-drawer">
            <header className="drawer-head">
              <div>
                <span className="eyebrow">SmartSchool</span>
                <h2>{drawer === "chat" ? "Inter-Actor Chat" : "Notifications"}</h2>
              </div>
              <button className="icon-button" onClick={() => setDrawer(null)}><X size={18} /></button>
            </header>

            {/* ── NOTIFICATIONS ── */}
            {drawer === "notifications" && (
              <div className="drawer-content">
                <div className="drawer-toolbar">
                  <span>{unreadCount} unread</span>
                  <button
                    className="text-button"
                    onClick={async () => {
                      if (!user?.id) return;
                      await markAllRead(tenantId, user.id);
                      setNotes(n => n.map(i => ({ ...i, isRead: true })));
                      setUnreadCount(0);
                      notify({ kind: "success", title: "Notifications updated", message: "All marked as read." });
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notification-list">
                  {notes.length === 0 && (
                    <p style={{ padding: "20px 18px", color: "var(--muted)", fontSize: 12 }}>No notifications yet.</p>
                  )}
                  {notes.map(n => (
                    <button
                      key={n.id}
                      className={n.isRead ? "read" : ""}
                      onClick={async () => {
                        if (!user?.id) return;
                        if (!n.isRead) {
                          await markRead(tenantId, user.id, n.id);
                          setNotes(cur => cur.map(i => i.id === n.id ? { ...i, isRead: true } : i));
                          setUnreadCount(c => Math.max(0, c - 1));
                        }
                        if (n.actionUrl) go(n.actionUrl);
                      }}
                    >
                      <span className="notification-bullet" />
                      <div>
                        <b>{n.title}</b>
                        <p>{n.message}</p>
                        <time>{new Date(n.createdAt).toLocaleString()}</time>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── INTER-ACTOR CHAT ── */}
            {drawer === "chat" && (
              <div className="chat-shell">
                {/* Contact list */}
                <div className="conversation-list">
                  {ALL_ACTORS.map(c => (
                    <button key={c.id} className={activeChat.id === c.id ? "active" : ""} onClick={() => setActiveChat(c)}>
                      <span className="avatar small">{c.initials}</span>
                      <div>
                        <b>{c.title}</b>
                        <small>{c.subtitle}</small>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Active thread */}
                <div className="chat-thread">
                  <div className="chat-title">
                    <div>
                      <b>{activeChat.title}</b>
                      <small>{activeChat.subtitle}</small>
                    </div>
                    <button className="text-button" onClick={() => go(activeChat.path)}>Open module</button>
                  </div>
                  <div className="chat-messages">
                    {(messages[activeChat.id] ?? []).map((m, i) => (
                      <div key={i} className={`chat-bubble ${m.startsWith("You:") ? "mine" : ""}`}>
                        {m.replace(/^You: |^[^:]+: /, "")}
                      </div>
                    ))}
                  </div>
                  <div className="chat-compose">
                    <textarea
                      value={chatText}
                      onChange={e => setChatText(e.target.value)}
                      placeholder={`Message ${activeChat.title}…`}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    />
                    <button className="primary" onClick={send}><Send size={15} /></button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </>
      )}

      {/* ── Global search modal ─────────────────────────────── */}
      <Modal open={searchOpen} title="Search SmartSchool" onClose={() => setSearchOpen(false)}>
        <div className="command-search">
          <label className="search-box" style={{ maxWidth: "100%", marginBottom: 12 }}>
            <Search size={16} />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search modules, students, exams…" />
          </label>
          <div className="search-results">
            {q && !results.length && <div className="empty-state">No matching results.</div>}
            {results.map(r => (
              <button key={r.path} onClick={() => go(r.path)}>
                <span className="search-result-icon"><Search size={14} /></span>
                <div><b>{r.title}</b><small>SmartSchool module</small></div>
                <span>Open</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <FloatingAiChatbot />
    </div>
  );
}
