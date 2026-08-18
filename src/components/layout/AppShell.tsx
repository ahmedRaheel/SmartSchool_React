import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../features/auth/auth";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
          <label className="global-search"><Search size={18} /><input placeholder="Search students, classes, invoices..." /><kbd>⌘ K</kbd></label>
          <div className="top-actions">
            <button className="top-icon" title="Messages"><MessageSquare size={19} /><span className="notification-dot" /></button>
            <button className="top-icon" title="Notifications"><Bell size={19} /><span className="notification-count">3</span></button>
            <button className="top-icon" onClick={() => setDark((value) => !value)} title="Toggle theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button>
            <div className="profile-menu" ref={profileRef}>
              <button className="profile-trigger" onClick={() => setProfileOpen((value) => !value)}>
                <span className="avatar">{user?.initials}</span>
                <span className="profile-copy"><b>{user?.name}</b><small>{user?.role}</small></span>
                <ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="profile-popover">
                  <div className="profile-summary"><span className="avatar large">{user?.initials}</span><div><b>{user?.name}</b><small>{user?.email}</small></div></div>
                  <button><UserRound size={17} /> My profile</button>
                  <button onClick={() => navigate("/settings")}><Settings size={17} /> Account settings</button>
                  <hr />
                  <button className="logout-item" onClick={handleLogout}><LogOut size={17} /> Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
