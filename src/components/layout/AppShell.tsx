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
const chats = [{ id: "parent", title: "Mrs. Yusuf", subtitle: "Amina • Grade 10 A", path: "/communication" }, { id: "teacher", title: "Sadia Iqbal", subtitle: "Mathematics Teacher", path: "/academics" }, { id: "finance", title: "Finance Office", subtitle: "Accounts & Fees", path: "/finance" }];
export function AppShell() {
    const { user, logout, stopImpersonation } = useAuth();
    const { notify } = useUi();
    const nav = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [drawer, setDrawer] = useState<"chat" | "notifications" | null>(null);
    const [notes, setNotes] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const tenantId = effectiveTenantId(user);
    const [activeChat, setActiveChat] = useState(chats[0]);
    const [messages, setMessages] = useState<Record<string, string[]>>({ parent: ["Mrs. Yusuf: Assalam-o-Alaikum, I wanted to confirm Amina's assignment deadline.", "You: Wa-Alaikum-Salam. It is due on Thursday."], teacher: ["Sadia Iqbal: Grade 10 timetable review is ready."], finance: ["Finance Office: August collection summary has been prepared."] });
    const [text, setText] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);
    const [q, setQ] = useState("");
    const [dark, setDark] = useState(() => localStorage.getItem("smartschool.theme") === "dark");
    const profileRef = useRef<HTMLDivElement>(null);
    useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("smartschool.theme", dark ? "dark" : "light"); }, [dark]);
    useEffect(() => { const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
    } }; document.addEventListener("keydown", f); return () => document.removeEventListener("keydown", f); }, []);
    useEffect(() => { const f = (e: MouseEvent) => { if (!profileRef.current?.contains(e.target as Node))
        setProfileOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
    async function loadNotifications() {
        if (!user?.id || !tenantId) return;
        try {
            const [page, count] = await Promise.all([
                getNotifications(tenantId, user.id),
                getUnreadCount(tenantId, user.id),
            ]);
            setNotes(page.items ?? []);
            setUnreadCount(count ?? 0);
        } catch (error) {
            console.error("Unable to load notifications", error);
        }
    }
    useEffect(() => {
        if (!user?.id || !tenantId) return;
        let disposed = false;
        const hub = createNotificationConnection((notification) => {
            if (disposed) return;
            setNotes(current => [notification, ...current.filter(item => item.id !== notification.id)].slice(0, 30));
            if (!notification.isRead) setUnreadCount(current => current + 1);
        });

        // Hydrate once. New notifications arrive through SignalR; there is no polling timer.
        void loadNotifications();
        const startTimer = window.setTimeout(() => {
            if (disposed) return;
            void hub.start().catch(error => {
                if (!disposed && error?.name !== "AbortError") {
                    console.error("Notification SignalR connection failed", error);
                }
            });
        }, 100);

        return () => {
            disposed = true;
            window.clearTimeout(startTimer);
            if (hub.state !== "Disconnected") {
                void hub.stop();
            }
        };
    }, [user?.id, tenantId]);
    const searchableModules = useMemo(() => [
        ["Dashboard", "/"], ["Students", "/students"], ["Teachers", "/teachers"], ["Academics", "/academics"],
        ["Examinations", "/examinations"], ["Attendance", "/attendance"], ["Finance", "/finance"], ["HR & Payroll", "/hr"],
        ["Transport", "/transport"], ["Communication", "/communication"], ["AI Assistant", "/ai"], ["Workflows", "/workflow"],
        ["Reports", "/reports"], ["Settings", "/settings"], ["Tenants", "/tenancy"], ["Platform", "/platform"],
    ] as const, []);
    const results = useMemo(() => q.trim() ? searchableModules
        .filter(([title]) => title.toLowerCase().includes(q.trim().toLowerCase()))
        .map(([title, path]) => ({ id: path, title, module: "SmartSchool", subtitle: "Open workspace", meta: "", path })) : [], [q, searchableModules]);
    const go = (path: string) => { setDrawer(null); setSearchOpen(false); nav(path); };
    function send() { const value = text.trim(); if (!value)
        return; setMessages(s => ({ ...s, [activeChat.id]: [...(s[activeChat.id] ?? []), `You: ${value}`] })); setText(""); notify({kind:"success",title:"Message sent",message:"Your message was added to the conversation."}); }
    return <div className="app">
<Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)}/>
<main className="main">
{user?.impersonated && <div className="impersonation-banner" role="status"><div><ShieldCheck size={16}/><span><b>Support session:</b> you are viewing SmartSchool as {user.name} ({user.role}). Actions are audited.</span></div><button onClick={() => { stopImpersonation(); window.location.assign("/"); }}>Return to administrator</button></div>}
<header className="topbar">
<div className="tb-left">
<button className="mobile-menu tb-toggle" onClick={() => setSidebarOpen(true)}><Menu size={19}/></button>
<div className="breadcrumb">SmartSchool / <strong>Workspace</strong></div>
</div>
<div className="tb-right">
<button className="global-search global-search-button" onClick={() => setSearchOpen(true)}>
<Search size={16}/><span>Search...</span>
</button>
<div className="top-actions">
<button className="top-icon" onClick={() => setDrawer("chat")}>
<MessageSquare size={19}/>
<span className="notification-dot"/>
</button>
<button className="top-icon" onClick={() => setDrawer("notifications")}>
<Bell size={19}/>
<span className="notification-count">{unreadCount}</span>
</button>
<button className="top-icon" onClick={() => setDark(v => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
<div className="profile-menu" ref={profileRef}>
<button className="profile-trigger" onClick={() => setProfileOpen(v => !v)}>
<span className="avatar">{user?.initials}</span>
<span className="profile-copy">
<b>{user?.name}</b>
<small>{user?.role}</small>
</span>
<ChevronDown size={15}/>
</button>{profileOpen && <div className="profile-popover">
<div className="profile-summary">
<span className="avatar large">{user?.initials}</span>
<div>
<b>{user?.name}</b>
<small>{user?.email}</small>
</div>
</div>
<button onClick={() => nav("/profiles")}>
<UserRound size={17}/> My profile</button>
<button onClick={() => nav("/settings")}>
<Settings size={17}/> Account settings</button>
<hr />
<button className="logout-item" onClick={() => { logout(); nav("/login", { replace: true }); }}>
<LogOut size={17}/> Log out</button>
</div>}</div>
</div>
</div>
</header>
<div className="content">
<Outlet />
</div>
</main>
 {drawer && <>
<button className="drawer-backdrop" onClick={() => setDrawer(null)}/>
<aside className="right-drawer">
<header className="drawer-head">
<div>
<span className="eyebrow">SmartSchool</span>
<h2>{drawer === "chat" ? "Messages" : "Notifications"}</h2>
</div>
<button className="icon-button" onClick={() => setDrawer(null)}>
<X size={19}/>
</button>
</header>{drawer === "notifications" ? <div className="drawer-content">
<div className="drawer-toolbar">
<span>{unreadCount} unread</span>
<button className="text-button" onClick={async () => { if(!user?.id)return; await markAllRead(tenantId,user.id); setNotes(current => current.map(item => ({...item,isRead:true}))); setUnreadCount(0); notify({kind:"success",title:"Notifications updated",message:"All notifications were marked as read."}); }}>Mark all read</button>
</div>
<div className="notification-list">{notes.map(n => <button key={n.id} className={n.isRead ? "read" : ""} onClick={async () => { if(!user?.id)return; if(!n.isRead){await markRead(tenantId,user.id,n.id); setNotes(current => current.map(item => item.id===n.id?{...item,isRead:true}:item)); setUnreadCount(current => Math.max(0,current-1));} if(n.actionUrl)go(n.actionUrl); }}>
<span className="notification-bullet"/>
<div>
<b>{n.title}</b>
<p>{n.message}</p>
</div>
</button>)}</div>
</div> : <div className="chat-shell">
<div className="conversation-list">{chats.map(c => <button key={c.id} className={activeChat.id === c.id ? "active" : ""} onClick={() => setActiveChat(c)}>
<span className="avatar small">{c.title.slice(0, 2).toUpperCase()}</span>
<div>
<b>{c.title}</b>
<small>{c.subtitle}</small>
</div>
</button>)}</div>
<div className="chat-thread">
<div className="chat-title">
<div>
<b>{activeChat.title}</b>
<small>{activeChat.subtitle}</small>
</div>
<button className="text-button" onClick={() => go(activeChat.path)}>Open module</button>
</div>
<div className="chat-messages">{(messages[activeChat.id] ?? []).map((m, i) => <div key={i} className={m.startsWith("You:") ? "chat-bubble mine" : "chat-bubble"}>{m.replace(/^You: |^[^:]+: /, "")}</div>)}</div>
<div className="chat-compose">
<textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write a message..." onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
    } }}/>
<button className="primary" onClick={send}>
<Send size={16}/>
</button>
</div>
</div>
</div>}</aside>
</>}
 <Modal open={searchOpen} title="Search SmartSchool" onClose={() => setSearchOpen(false)}>
<div className="command-search">
<label className="search-box">
<Search size={18}/>
<input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search SmartSchool..."/>
</label>
<div className="search-results">{q && !results.length && <div className="empty-state">No matching records.</div>}{results.map(x => <button key={`${x.path}-${x.id}`} onClick={() => go(x.path)}>
<span className="search-result-icon">
<Search size={15}/>
</span>
<div>
<b>{x.title}</b>
<small>{x.module} • {x.subtitle} • {x.meta}</small>
</div>
<span>Open</span>
</button>)}</div>
</div>
</Modal>
<FloatingAiChatbot />
</div>;
}

