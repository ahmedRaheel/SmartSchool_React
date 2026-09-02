import { Suspense, useEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Bell, Bot, LogOut, Menu, Moon, Search, Settings,
  ShieldAlert, Sun, X, ChevronRight, User,
} from "lucide-react";
import { useAuth } from "../../features/auth/auth";
import { Sidebar } from "./Sidebar";
import { FloatingAiChatbot } from "../../features/ai/components/FloatingAiChatbot";
import { createNotificationConnection } from "../../features/communication/realtime/communicationRealtime";
import { effectiveTenantId } from "../../core/tenant/tenantContext";
import { useUnreadCount } from "../../core/api/queries";
import type { NotificationItem } from "../../features/communication/api/notifications";

export function AppShell() {
  const { user, logout, stopImpersonation } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tenantId = effectiveTenantId(user);

  const [dark, setDark]           = useState(() => localStorage.getItem("ss_dark") === "1");
  const [sidebarOpen, setSidebar] = useState(false);
  const [searchOpen, setSearch]   = useState(false);
  const [profileOpen, setProfile] = useState(false);
  const [notifOpen, setNotif]     = useState(false);
  const [toasts, setToasts]       = useState<NotificationItem[]>([]);
  const [searchQ, setSearchQ]     = useState("");

  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef   = useRef<HTMLDivElement>(null);
  const hubRef     = useRef<import("@microsoft/signalr").HubConnection | null>(null);
  const { data: unreadCount = 0 } = useUnreadCount();

  // Dark mode
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("ss_dark", dark ? "1" : "0");
  }, [dark]);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebar(false); }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotif(false);
      }
    }
    if (profileOpen || notifOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [profileOpen, notifOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearch(s => !s); }
      if (e.key === "Escape") { setSearch(false); setProfile(false); setNotif(false); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // SignalR
  useEffect(() => {
    if (!user || !tenantId) return;
    const hub = createNotificationConnection((n) => {
      setToasts(t => [n, ...t].slice(0, 4));
    });
    hubRef.current = hub;
    hub.start().catch(() => {});
    return () => { if (hub.state !== "Disconnected") void hub.stop(); };
  }, [user?.id, tenantId]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toasts.length) return;
    const t = setTimeout(() => setToasts(p => p.slice(0, -1)), 5000);
    return () => clearTimeout(t);
  }, [toasts]);

  if (!user) {
    // Not authenticated — redirect to login, preserving the intended destination
    const returnTo = encodeURIComponent(location.pathname + location.search);
    const dest = returnTo === "%2F" ? "/login" : `/login?returnTo=${returnTo}`;
    navigate(dest, { replace: true });
    return null;
  }

  const isImpersonating = user.impersonated === true;
  const initials = user.initials || user.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  const NAV_SHORTCUTS = [
    { label: "Dashboard",     path: "/"             },
    { label: "Students",      path: "/students"     },
    { label: "Finance",       path: "/finance"      },
    { label: "Admissions",    path: "/admissions"   },
    { label: "HR & Staff",    path: "/hr"           },
    { label: "Attendance",    path: "/attendance"   },
    { label: "AI Tools",      path: "/ai"           },
    { label: "Transport",     path: "/transport"    },
    { label: "Library",       path: "/library"      },
    { label: "Reports",       path: "/reports"      },
    { label: "Communication", path: "/communication"},
    { label: "Examinations",  path: "/examinations" },
    { label: "Tenants",       path: "/tenancy"      },
    { label: "Payroll",       path: "/payroll"      },
    { label: "Audit Logs",    path: "/audit"        },
    { label: "AI Platform",   path: "/ai-platform"  },
    { label: "Settings",      path: "/settings"     },
    { label: "My Profile",    path: "/profiles"     },
    { label: "School Setup",  path: "/setup"        },
  ].filter(s => !searchQ || s.label.toLowerCase().includes(searchQ.toLowerCase()));

  function handleLogout() {
    setProfile(false);
    logout();
    navigate("/login", { replace: true });
  }

  function handleNavigate(path: string) {
    setProfile(false);
    setNotif(false);
    navigate(path);
  }

  return (
    <div className="app">
      {/* ── Impersonation banner ── */}
      {isImpersonating && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000,
          background: "#D97706", color: "#fff", padding: "8px 20px",
          display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 500,
        }}>
          <ShieldAlert size={16}/>
          <span>Impersonation active — viewing as <b>{user.name}</b> ({user.role}). All actions are logged.</span>
          <div style={{ flex: 1 }}/>
          <button
            onClick={stopImpersonation}
            style={{ background: "rgba(255,255,255,.25)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            Exit impersonation
          </button>
        </div>
      )}

      {/* ── Sidebar ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebar(false)} />

      {/* ── Main ── */}
      <div className="main" style={{ paddingTop: isImpersonating ? 36 : 0 }}>

        {/* ── Topbar ── */}
        <header className="topbar">
          <div className="tb-left">
            <button className="mobile-menu icon-button" onClick={() => setSidebar(o => !o)} aria-label="Toggle navigation">
              <Menu size={18}/>
            </button>
            <button className="global-search" onClick={() => setSearch(true)} aria-label="Open search">
              <Search size={13}/>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>Search modules…</span>
              <kbd>⌘K</kbd>
            </button>
          </div>

          {/* Right actions */}
          <div className="top-actions">
            <button className="top-icon" onClick={() => setDark(d => !d)} aria-label="Toggle dark mode">
              {dark ? <Sun size={17}/> : <Moon size={17}/>}
            </button>

            {/* Notifications */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button className="top-icon" onClick={() => { setNotif(o => !o); setProfile(false); }} aria-label="Notifications">
                <Bell size={17}/>
                {Number(unreadCount) > 0 && (
                  <span className="notification-count">{Number(unreadCount) > 9 ? "9+" : unreadCount}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300,
                  background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 12,
                  boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                    <span>Notifications</span>
                    {Number(unreadCount) > 0 && <span style={{ fontSize: 11, color: "var(--muted)" }}>{unreadCount} unread</span>}
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {Number(unreadCount) === 0
                      ? <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)", fontSize: 12 }}>No new notifications</div>
                      : <div style={{ padding: "8px 16px", fontSize: 12, color: "var(--muted)" }}>{unreadCount} notification{Number(unreadCount) !== 1 ? "s" : ""} — view in communication</div>
                    }
                  </div>
                  <div style={{ padding: "8px 16px", borderTop: "1px solid var(--line)" }}>
                    <button
                      className="text-button"
                      style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}
                      onClick={() => handleNavigate("/communication")}
                    >
                      View all <ChevronRight size={12}/>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* AI shortcut */}
            <button className="top-icon" onClick={() => navigate("/ai")} aria-label="AI assistant">
              <Bot size={17}/>
            </button>

            {/* Profile menu — uses ref for outside-click, not overlay div */}
            <div className="profile-menu" ref={profileRef}>
              <button
                className="profile-trigger"
                onClick={() => { setProfile(o => !o); setNotif(false); }}
                aria-label="Profile menu"
              >
                <div className="avatar" style={{ fontSize: 11 }}>{initials}</div>
                <div className="profile-copy">
                  <b>{user.name}</b>
                  <small>{user.role}</small>
                </div>
              </button>

              {profileOpen && (
                <div className="profile-popover" style={{ zIndex: 600 }}>
                  {/* User summary */}
                  <div className="profile-summary">
                    <div className="avatar large" style={{ background: "linear-gradient(135deg,#6366F1,#8B5CF6)", color: "#fff", fontSize: 16, fontWeight: 800 }}>
                      {initials}
                    </div>
                    <div>
                      <b style={{ fontSize: 13 }}>{user.name}</b>
                      <small style={{ display: "block", color: "var(--muted)", fontSize: 11 }}>{user.email}</small>
                      <span style={{ display: "inline-block", marginTop: 4, padding: "1px 8px", borderRadius: 20, background: "#EEF2FF", color: "#6366F1", fontSize: 10, fontWeight: 700 }}>
                        {user.role}
                      </span>
                    </div>
                  </div>

                  <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--line)" }}/>

                  <button
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "var(--text)", borderRadius: 8, textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => handleNavigate("/profiles")}
                  >
                    <User size={14} style={{ color: "var(--muted)" }}/> My Profile
                  </button>

                  <button
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "var(--text)", borderRadius: 8, textAlign: "left" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={() => handleNavigate("/settings")}
                  >
                    <Settings size={14} style={{ color: "var(--muted)" }}/> Settings
                  </button>

                  <hr style={{ margin: "6px 0", border: "none", borderTop: "1px solid var(--line)" }}/>

                  <button
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#DC2626", borderRadius: 8, textAlign: "left", fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#FFF0F1")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    onClick={handleLogout}
                  >
                    <LogOut size={14}/> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <div className="content">
          <Suspense fallback={<div style={{ padding: 40, color: "var(--muted)", textAlign: "center" }}>Loading…</div>}>
            <Outlet/>
          </Suspense>
        </div>
      </div>

      {/* ── Floating AI chatbot ── */}
      <FloatingAiChatbot/>

      {/* ── Toast stack ── */}
      <div style={{ position: "fixed", bottom: 90, left: 20, display: "flex", flexDirection: "column-reverse", gap: 8, zIndex: 900, maxWidth: 320 }}>
        {toasts.map((t, i) => (
          <div key={i} style={{ background: "var(--surface)", border: "1.5px solid var(--line)", borderRadius: 12, padding: "12px 16px", boxShadow: "var(--shadow-lg)", fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>
            <div style={{ color: "var(--muted)" }}>{t.message}</div>
          </div>
        ))}
      </div>

      {/* ── Search overlay ── */}
      {searchOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1500, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh" }}
          onClick={e => { if (e.target === e.currentTarget) setSearch(false); }}
        >
          <div style={{ background: "var(--surface)", borderRadius: 16, width: "min(560px,94vw)", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
              <Search size={16} style={{ color: "var(--muted)", flexShrink: 0 }}/>
              <input
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search modules, pages…"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--text)" }}
              />
              <button className="icon-button" style={{ width: 28, height: 28, flexShrink: 0 }} onClick={() => setSearch(false)}><X size={15}/></button>
            </div>
            <div style={{ maxHeight: 320, overflowY: "auto", padding: 8 }}>
              {NAV_SHORTCUTS.map(s => (
                <button key={s.path}
                  onClick={() => { navigate(s.path); setSearch(false); setSearchQ(""); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "var(--radius)", border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: "var(--text)", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <span>{s.label}</span>
                  <ChevronRight size={14} style={{ color: "var(--muted)" }}/>
                </button>
              ))}
              {NAV_SHORTCUTS.length === 0 && (
                <div style={{ padding: "16px 12px", color: "var(--muted)", fontSize: 13 }}>No results for "{searchQ}"</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
