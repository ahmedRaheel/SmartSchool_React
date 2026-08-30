import { useEffect, useRef, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth }    from "../../auth/auth";
import {
  useConversations, useMessages, useSendMessage, useNotifications,
} from "../../../core/api/queries";
import {
  createChatConnection, joinConversation, leaveConversation,
} from "../realtime/communicationRealtime";
import { chatApi } from "../../../core/api/smartschoolApi";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

export function CommunicationPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);

  const { data: conversations, refetch: refetchConvos } = useConversations();
  const { data: notifications } = useNotifications();
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const { data: messages, refetch: refetchMsgs } = useMessages(activeConvId);
  const sendMsg = useSendMessage(activeConvId ?? "");

  const [input, setInput] = useState("");
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const hubRef = useRef<import("@microsoft/signalr").HubConnection | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // SignalR connection
  useEffect(() => {
    if (!activeConvId) return;
    const hub = createChatConnection((msg: any) => {
      if (msg?.conversationId === activeConvId) void refetchMsgs();
    });
    hubRef.current = hub;
    hub.start()
      .then(() => joinConversation(hub, tenantId, activeConvId))
      .catch(() => {});
    return () => {
      if (hub.state !== "Disconnected") {
        void leaveConversation(hub, tenantId, activeConvId)
          .finally(() => void hub.stop());
      }
    };
  }, [activeConvId, tenantId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sendMsg.isPending) return;
    setInput("");
    await sendMsg.mutateAsync(text);
    void refetchMsgs();
  }

  async function createConversation() {
    if (!newTitle.trim()) return;
    setCreating(true);
    const res = await chatApi.create({
      tenantId, title: newTitle.trim(), type: "DIRECT",
      participants: [],
    });
    await refetchConvos();
    setActiveConvId(res.data.chatConversationId);
    setNewConvOpen(false);
    setNewTitle("");
    setCreating(false);
  }

  const activeConv = conversations?.find(c => c.chatConversationId === activeConvId);

  return (
    <>
      <PageHeader
        title="Communication Centre"
        subtitle="Inter-actor chat, messages and notifications"
        action={
          <button className="primary" onClick={() => setNewConvOpen(true)}>
            <Plus size={15}/> New conversation
          </button>
        }
      />

      <div className="grid-2">
        {/* Conversations list */}
        <div className="surface" style={{ display: "flex", flexDirection: "column", maxHeight: 600 }}>
          <div className="surface-head"><h3>Conversations</h3></div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!conversations?.length && (
              <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>
                No conversations yet. Create one above.
              </div>
            )}
            {conversations?.map(c => (
              <button key={c.chatConversationId}
                onClick={() => setActiveConvId(c.chatConversationId)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 16px", border: "none", textAlign: "left", cursor: "pointer",
                  borderBottom: "0.5px solid var(--border)",
                  background: activeConvId === c.chatConversationId ? "var(--bg-accent)" : "transparent",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "var(--bg-accent)", color: "var(--text-accent)", display: "grid", placeItems: "center", fontWeight: 500, fontSize: 13, flexShrink: 0 }}>
                  {c.title.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{c.conversationType}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Active conversation thread */}
        {activeConv ? (
          <div className="surface" style={{ display: "flex", flexDirection: "column", maxHeight: 600 }}>
            <div className="surface-head" style={{ borderBottom: "0.5px solid var(--border)" }}>
              <div><h3>{activeConv.title}</h3><p>{activeConv.conversationType}</p></div>
              <button className="icon-button" onClick={() => setActiveConvId(undefined)}><X size={16}/></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: "var(--surface-1)" }}>
              {messages?.map(m => {
                const isMe = m.senderUserId === user?.id;
                return (
                  <div key={m.chatMessageId} className={`floating-ai-message ${isMe ? "user" : ""}`}>
                    {!isMe && (
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-accent)", color: "var(--text-accent)", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                        {m.senderUserId.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="floating-ai-bubble">{m.message}</div>
                  </div>
                );
              })}
              {!messages?.length && (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, marginTop: 20 }}>
                  No messages yet. Start the conversation.
                </div>
              )}
              <div ref={endRef} />
            </div>
            <div style={{ padding: 10, borderTop: "0.5px solid var(--border)", display: "flex", gap: 8 }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message…" rows={1}
                style={{ flex: 1, resize: "none", border: "0.5px solid var(--border)", borderRadius: "var(--radius)", padding: "8px 10px", fontSize: 12, background: "var(--surface-2)", color: "var(--text-primary)" }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}/>
              <button className="primary" onClick={() => void send()} disabled={sendMsg.isPending} style={{ width: 38, height: 38, padding: 0, display: "grid", placeItems: "center" }}>
                <Send size={15}/>
              </button>
            </div>
          </div>
        ) : (
          <div className="surface">
            <div className="surface-head"><h3>Notifications</h3><p>Recent alerts for your role</p></div>
            <div style={{ padding: "0 18px 16px" }}>
              {!notifications?.items?.length && (
                <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No notifications yet.</div>
              )}
              {notifications?.items?.map(n => (
                <div key={n.id} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: "0.5px solid var(--border)", alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: n.isRead ? "var(--border)" : "var(--fill-pro)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{n.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 3 }}>{new Date(n.occurredAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      {newConvOpen && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setNewConvOpen(false); }}>
          <div className="modal-card" style={{ width: "min(480px, 96vw)" }}>
            <div className="modal-head">
              <h2>New conversation</h2>
              <button className="icon-button" onClick={() => setNewConvOpen(false)}><X size={18}/></button>
            </div>
            <div className="human-form">
              <label className="human-field">
                <span>Title *</span>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Grade 9-A Teachers"/>
              </label>
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setNewConvOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => void createConversation()} disabled={creating || !newTitle.trim()}>
                {creating ? "Creating…" : "Create conversation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
