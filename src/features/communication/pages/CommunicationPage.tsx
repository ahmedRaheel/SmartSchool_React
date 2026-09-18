import { useEffect, useMemo, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, MessageSquare, Plus, Search, Send, Users, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { toItems } from "../../../core/utils/dataHelpers";
import {
  useChatDirectory,
  useConversations,
  useCreateConversation,
  useMarkAllRead,
  useMarkConversationRead,
  useMarkRead,
  useMessages,
  useNotifications,
  useSendMessage,
  useUnreadCount,
} from "../../../core/api/queries";
import { env } from "../../../config/env";
import { useAuth } from "../../auth/auth";

const NOTIFICATION_ICON: Record<string | number, string> = {
  1: "⚠️",
  2: "💰",
  3: "🎓",
  4: "📊",
  5: "🚌",
  HIGH: "🔴",
  NORMAL: "🔵",
};

function NotificationsPanel() {
  const navigate = useNavigate();
  const { data: notificationData, isLoading } = useNotifications();
  const { data: unread = 0 } = useUnreadCount();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const notifications = toItems(notificationData);
  const visible = filter === "unread"
    ? notifications.filter((notification: any) => !notification.isRead)
    : notifications;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter("all")}>All ({notifications.length})</button>
          <button className={filter === "unread" ? "primary" : "secondary"} onClick={() => setFilter("unread")}>Unread ({Number(unread)})</button>
        </div>
        {Number(unread) > 0 && (
          <button className="secondary" onClick={() => markAllRead.mutate()}>
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
          <Bell size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }} />
          No notifications.
        </div>
      ) : (
        visible.map((notification: any) => (
          <button
            key={notification.id}
            onClick={() => {
              if (!notification.isRead) {
                markRead.mutate(notification.id);
              }
              if (notification.actionUrl) {
                navigate(notification.actionUrl);
              }
            }}
            className={`notif-item${notification.isRead ? "" : " unread"}`}
          >
            <span style={{ fontSize: 20 }}>{NOTIFICATION_ICON[notification.type] ?? "🔔"}</span>
            <span style={{ flex: 1 }}>
              <b style={{ fontSize: 12 }}>{notification.title}</b>
              <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{notification.message}</span>
              <span style={{ display: "block", fontSize: 10, color: "var(--muted)", marginTop: 4 }}>
                {notification.occurredAt ? new Date(notification.occurredAt).toLocaleString() : ""}
              </span>
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function MessagesPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: conversationData, isLoading: conversationsLoading } = useConversations();
  const { data: directoryData } = useChatDirectory();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { data: messageData, isLoading: messagesLoading } = useMessages(activeConversationId ?? undefined);
  const sendMessage = useSendMessage(activeConversationId ?? "");
  const createConversation = useCreateConversation();
  const markConversationRead = useMarkConversationRead();

  const conversations = Array.isArray(conversationData) ? conversationData : toItems(conversationData);
  const messages = Array.isArray(messageData) ? messageData : toItems(messageData);
  const directory = toItems(directoryData).filter((entry: any) => entry.id !== user?.id && entry.isActive !== false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [title, setTitle] = useState("");
  const [conversationType, setConversationType] = useState<"DIRECT" | "GROUP" | "BROADCAST">("DIRECT");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((item: any) => item.conversationId === activeConversationId);
  const filteredConversations = useMemo(
    () => conversations.filter((item: any) => item.title?.toLowerCase().includes(search.toLowerCase())),
    [conversations, search],
  );

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      setActiveConversationId(conversations[0].conversationId);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    markConversationRead.mutate(activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    if (env.useMocks || !activeConversationId) {
      return;
    }

    const token = localStorage.getItem("access_token") ?? "";
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${env.apiBaseUrl}/hubs/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("MessageReceived", () => {
      void queryClient.invalidateQueries({ queryKey: ["msgs"] });
      void queryClient.invalidateQueries({ queryKey: ["convs"] });
    });

    void connection.start()
      .then(() => connection.invoke("JoinConversation", activeConversationId))
      .catch(() => undefined);

    return () => {
      void connection.stop();
    };
  }, [activeConversationId, queryClient]);

  function toggleParticipant(userId: string) {
    setParticipantIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  }

  async function createNewConversation() {
    setError("");
    if (!title.trim()) {
      setError("Conversation title is required.");
      return;
    }
    if (conversationType === "DIRECT" && participantIds.length !== 1) {
      setError("Select exactly one person for a direct conversation.");
      return;
    }
    if (conversationType !== "DIRECT" && participantIds.length === 0) {
      setError("Select at least one participant.");
      return;
    }

    const participants = participantIds.map(userId => {
      const entry: any = directory.find((item: any) => item.id === userId);
      return { userId, role: entry?.accountType || entry?.roles?.[0] || "Member" };
    });

    const response: any = await createConversation.mutateAsync({
      title: title.trim(),
      type: conversationType,
      participants,
    });

    setActiveConversationId(response?.conversationId ?? null);
    setTitle("");
    setParticipantIds([]);
    setConversationType("DIRECT");
    setShowNewConversation(false);
  }

  async function send() {
    if (!message.trim() || !activeConversationId) {
      return;
    }
    const value = message.trim();
    setMessage("");
    await sendMessage.mutateAsync(value);
    await markConversationRead.mutateAsync(activeConversationId);
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 340px)", minHeight: 500, border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--surface)" }}>
      <aside style={{ width: 300, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 12, display: "flex", gap: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, border: "1px solid var(--line)", borderRadius: "var(--r)", padding: "0 10px" }}>
            <Search size={13} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" style={{ flex: 1, border: 0, outline: 0, background: "transparent", height: 32 }} />
          </label>
          <button className="icon-button" onClick={() => setShowNewConversation(true)}><Plus size={15} /></button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {conversationsLoading ? <div style={{ padding: 20 }}>Loading…</div> : filteredConversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No conversations.</div>
          ) : filteredConversations.map((conversation: any) => (
            <button
              key={conversation.conversationId}
              onClick={() => setActiveConversationId(conversation.conversationId)}
              className={`convo-item${activeConversationId === conversation.conversationId ? " active" : ""}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <b style={{ fontSize: 12 }}>{conversation.title}</b>
                {conversation.unreadCount > 0 && <span className="status-pill danger">{conversation.unreadCount}</span>}
              </div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>{conversation.conversationType} · {conversation.participantCount} members</div>
              <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 4 }}>{conversation.lastMessage || "No messages yet"}</div>
            </button>
          ))}
        </div>
      </aside>

      {!activeConversationId ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)" }}>Select or create a conversation.</div>
      ) : (
        <section style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
            <b>{activeConversation?.title ?? "Conversation"}</b>
            <div style={{ fontSize: 10, color: "var(--muted)" }}>{activeConversation?.participantCount ?? 0} participants</div>
          </header>
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {messagesLoading ? <div>Loading…</div> : messages.length === 0 ? <div style={{ color: "var(--muted)", textAlign: "center" }}>No messages yet.</div> : messages.map((item: any) => {
              const mine = item.senderUserId === user?.id;
              return (
                <div key={item.messageId} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "72%" }}>
                    {!mine && <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{item.senderDisplayName}{item.senderRole ? ` · ${item.senderRole}` : ""}</div>}
                    <div style={{ padding: "9px 13px", borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: mine ? "var(--navy)" : "var(--surface-2)", color: mine ? "#fff" : "var(--text)", fontSize: 12 }}>{item.message}</div>
                    <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, textAlign: mine ? "right" : "left" }}>{item.sentAt ? new Date(item.sentAt).toLocaleTimeString() : ""}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
            <input
              value={message}
              onChange={event => setMessage(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send();
                }
              }}
              placeholder="Type a message…"
              style={{ flex: 1, height: 38, padding: "0 14px", border: "1.5px solid var(--line)", borderRadius:"var(--r-2xl)", background: "var(--surface-2)" }}
            />
            <button className="primary" onClick={() => void send()} disabled={!message.trim() || sendMessage.isPending}><Send size={14} /></button>
          </div>
        </section>
      )}

      {showNewConversation && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setShowNewConversation(false)}>
          <div className="modal-card" style={{ width: "min(560px,96vw)" }}>
            <div className="modal-head"><h2>New conversation</h2><button className="icon-button" onClick={() => setShowNewConversation(false)}><X size={18} /></button></div>
            <div className="human-form">
              {error && <div className="error-banner field-wide">{error}</div>}
              <label className="human-field field-wide"><span>Title</span><input value={title} onChange={event => setTitle(event.target.value)} /></label>
              <label className="human-field field-wide"><span>Type</span><select value={conversationType} onChange={event => setConversationType(event.target.value as any)}><option value="DIRECT">Direct</option><option value="GROUP">Group</option><option value="BROADCAST">Broadcast</option></select></label>
              <div className="field-wide">
                <span style={{ fontSize: 11, fontWeight: 700 }}>Participants</span>
                <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--line)", borderRadius: "var(--r-md)", marginTop: 6 }}>
                  {directory.length === 0 ? <div style={{ padding: 16, color: "var(--muted)" }}>No tenant users available.</div> : directory.map((entry: any) => (
                    <label key={entry.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}>
                      <input type="checkbox" checked={participantIds.includes(entry.id)} onChange={() => toggleParticipant(entry.id)} />
                      <Users size={14} />
                      <span><b style={{ fontSize: 12 }}>{entry.displayName || `${entry.firstName ?? ""} ${entry.lastName ?? ""}`.trim() || entry.email}</b><span style={{ display: "block", fontSize: 10, color: "var(--muted)" }}>{entry.accountType || entry.roles?.join(", ")}</span></span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-actions"><button className="secondary" onClick={() => setShowNewConversation(false)}>Cancel</button><button className="primary" onClick={() => void createNewConversation()} disabled={createConversation.isPending}>Create</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunicationPage() {
  const { data: unread = 0 } = useUnreadCount();
  const { data: conversationData } = useConversations();
  const [tab, setTab] = useState<"messages" | "notifications">("messages");
  const conversations = Array.isArray(conversationData) ? conversationData : toItems(conversationData);

  return (
    <>
      <PageHeader title="Communication" subtitle="Real-time conversations and notifications" />
      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Unread notifications" value={String(unread)} note="" color={Number(unread) > 0 ? "#EF4444" : "#10B981"} bg={Number(unread) > 0 ? "#FFF0F1" : "#ECFDF5"}><Bell size={20} /></StatCard>
        <StatCard label="Conversations" value={String(conversations.length)} note="" color="#2563EB" bg="#EFF6FF"><MessageSquare size={20} /></StatCard>
      </section>
      <div className="section-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "messages" ? "active" : ""} onClick={() => setTab("messages")}>Messages</button>
        <button className={tab === "notifications" ? "active" : ""} onClick={() => setTab("notifications")}>Notifications {Number(unread) > 0 ? `(${unread})` : ""}</button>
      </div>
      {tab === "messages" ? <MessagesPanel /> : <NotificationsPanel />}
    </>
  );
}
