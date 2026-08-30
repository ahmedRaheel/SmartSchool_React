import { useState, useEffect, useRef } from "react";
import { Bell, MessageSquare, Plus, Send, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useConversations, useMessages, useSendMessage, useCreateConversation, useNotifications, useMarkRead, useMarkAllRead } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";

export function CommunicationPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"messages"|"notifications">("messages");
  const [activeConv, setActiveConv] = useState<string|null>(null);
  const [message, setMessage] = useState("");
  const [newConvModal, setNewConvModal] = useState(false);
  const [convTitle, setConvTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useConversations();
  const { data: msgData }  = useMessages(activeConv ?? undefined);
  const { data: notifData } = useNotifications();
  const sendMsg = useSendMessage(activeConv ?? "");
  const createConv = useCreateConversation();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const conversations = Array.isArray(convData) ? convData : (convData as any)?.items ?? [];
  const messages      = Array.isArray(msgData)  ? msgData  : (msgData  as any)?.items ?? [];
  const notifs        = (notifData as any)?.items ?? (notifData as any) ?? [];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  async function send() {
    if (!message.trim() || !activeConv) return;
    await sendMsg.mutateAsync(message.trim());
    setMessage("");
  }

  async function createNewConv() {
    if (!convTitle.trim()) return;
    const r = await createConv.mutateAsync({ tenantId:"t1", title:convTitle, conversationType:"GROUP" }) as any;
    setActiveConv(r.chatConversationId ?? null);
    setNewConvModal(false); setConvTitle("");
  }

  return (
    <>
      <PageHeader title="Communication" subtitle="Messages and notifications"/>
      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="messages"?"active":""} onClick={()=>setTab("messages")}><MessageSquare size={13}/> Messages</button>
        <button className={tab==="notifications"?"active":""} onClick={()=>setTab("notifications")}><Bell size={13}/> Notifications ({notifs.filter((n:any)=>!n.isRead).length})</button>
      </div>

      {tab === "messages" && (
        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:12, height:"60vh", overflow:"hidden" }}>
          {/* Conversation list */}
          <div className="surface" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ padding:"12px 14px 8px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid var(--line)" }}>
              <b style={{ fontSize:12 }}>Conversations</b>
              <button className="icon-button" style={{ width:28, height:28 }} onClick={() => setNewConvModal(true)}><Plus size={14}/></button>
            </div>
            <div style={{ overflowY:"auto", flex:1 }}>
              {conversations.map((c:any) => (
                <div key={c.chatConversationId} onClick={() => setActiveConv(c.chatConversationId)}
                  style={{ padding:"10px 14px", cursor:"pointer", background:activeConv===c.chatConversationId?"var(--surface-2)":"", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                  <b style={{ display:"block" }}>{c.title}</b>
                  <span style={{ color:"var(--muted)", fontSize:10 }}>{c.conversationType}</span>
                </div>
              ))}
              {conversations.length === 0 && <div style={{ padding:20, color:"var(--muted)", fontSize:12, textAlign:"center" }}>No conversations yet</div>}
            </div>
          </div>

          {/* Message pane */}
          <div className="surface" style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {!activeConv ? (
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
                Select a conversation to view messages
              </div>
            ) : (
              <>
                <div style={{ flex:1, overflowY:"auto", padding:"12px 16px", display:"flex", flexDirection:"column", gap:8 }}>
                  {messages.map((msg:any) => {
                    const isMe = msg.senderUserId === user?.id;
                    return (
                      <div key={msg.chatMessageId} style={{ display:"flex", justifyContent:isMe?"flex-end":"flex-start" }}>
                        <div style={{
                          maxWidth:"70%", padding:"8px 12px", borderRadius:12, fontSize:12,
                          background:isMe?"var(--navy)":"var(--surface-2)",
                          color:isMe?"white":"var(--text)",
                        }}>
                          {!isMe && <div style={{ fontSize:10, color:"var(--muted)", marginBottom:2, fontWeight:600 }}>{msg.senderUserId}</div>}
                          {msg.message}
                          <div style={{ fontSize:9, marginTop:2, opacity:.6 }}>{new Date(msg.sentAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}/>
                </div>
                <div style={{ padding:"10px 14px", borderTop:"1px solid var(--line)", display:"flex", gap:8 }}>
                  <input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Type a message…"
                    style={{ flex:1, height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}/>
                  <button className="primary" style={{ width:40, height:36, padding:0 }} onClick={send} disabled={sendMsg.isPending}><Send size={15}/></button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="surface">
          <div className="surface-head">
            <h3>Notifications ({notifs.filter((n:any)=>!n.isRead).length} unread)</h3>
            <button className="secondary" style={{ fontSize:11 }} onClick={() => markAll.mutate()}>Mark all read</button>
          </div>
          <div style={{ padding:"0 20px 20px", display:"flex", flexDirection:"column", gap:8 }}>
            {notifs.length === 0 && <div style={{ padding:24, textAlign:"center", color:"var(--muted)" }}>No notifications</div>}
            {notifs.map((n:any) => (
              <div key={n.id} onClick={() => !n.isRead && markRead.mutate(n.id)}
                style={{ display:"flex", gap:12, padding:"12px 14px", borderRadius:10, border:`1px solid ${n.isRead?"var(--line)":"var(--navy)30"}`, background:n.isRead?"":"#EEF2FF", cursor:n.isRead?"default":"pointer" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:n.priority==="HIGH"?"#EF4444":"#2563EB", marginTop:3, flexShrink:0, opacity:n.isRead?.3:1 }}/>
                <div style={{ flex:1 }}>
                  <b style={{ fontSize:12, display:"block" }}>{n.title}</b>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>{n.message}</span>
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:4 }}>{new Date(n.occurredAt).toLocaleString()}</div>
                </div>
                {!n.isRead && <span className="status-pill info" style={{ fontSize:9, alignSelf:"flex-start" }}>NEW</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {newConvModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setNewConvModal(false)}}>
          <div className="modal-card" style={{ width:"min(400px,96vw)" }}>
            <div className="modal-head"><h2>New conversation</h2><button className="icon-button" onClick={()=>setNewConvModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Conversation title *</span><input value={convTitle} onChange={e=>setConvTitle(e.target.value)} placeholder="e.g. Grade 9-A Parents"/></label>
            </div></div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setNewConvModal(false)}>Cancel</button>
              <button className="primary" onClick={createNewConv} disabled={createConv.isPending}>{createConv.isPending?"Creating…":"Create"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
