/**
 * CommunicationPage — Real-time messaging + notifications hub
 * Tabs: Messages (conversation list + chat) · Notifications (bell centre)
 * Roles: All actors — each sees their own conversations
 */
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Bell, MessageSquare, Plus, Send, X, CheckCheck, Search,
  Users, RefreshCw, Megaphone, Dot,
} from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import {
  useConversations, useMessages, useSendMessage,
  useCreateConversation, useNotifications,
  useMarkRead, useMarkAllRead, useUnreadCount,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

const NOTIF_TYPE_ICON: Record<string|number, string> = {
  1:"⚠️", 2:"💰", 3:"🎓", 4:"📊", 5:"🚌",
  HIGH:"🔴", NORMAL:"🔵",
};

const NOTIF_PRIORITY_PILL: Record<string,string> = {
  HIGH:"danger", NORMAL:"info", LOW:"gray",
};

// ─── Notification centre ────────────────────────────────────────────────────
function NotificationsPanel() {
  const { user } = useAuth();
  const { data: notifData, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAll  = useMarkAllRead();
  const { data: unread = 0 } = useUnreadCount();

  const notifs = (notifData as any)?.items ?? (notifData as any) ?? [];
  const [filter, setFilter] = useState<"all"|"unread">("all");

  const visible = filter === "unread" ? notifs.filter((n:any) => !n.isRead) : notifs;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",gap:8}}>
          <button className={filter==="all"?"primary":"secondary"} style={{fontSize:11,height:30}} onClick={()=>setFilter("all")}>All ({notifs.length})</button>
          <button className={filter==="unread"?"primary":"secondary"} style={{fontSize:11,height:30}} onClick={()=>setFilter("unread")}>
            Unread ({Number(unread)})
          </button>
        </div>
        {Number(unread) > 0 && (
          <button className="secondary" style={{fontSize:11,height:30,display:"flex",alignItems:"center",gap:6}} onClick={()=>markAll.mutate()}>
            <CheckCheck size={12}/> Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div>
      ) : visible.length === 0 ? (
        <div style={{padding:48,textAlign:"center",color:"var(--muted)"}}>
          <Bell size={32} style={{margin:"0 auto 12px",display:"block",opacity:.3}}/>
          <b>No notifications</b><br/><span style={{fontSize:12}}>You're all caught up!</span>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {visible.map((n:any) => (
            <div key={n.id} onClick={()=>!n.isRead&&markRead.mutate(n.id)}
              style={{padding:"12px 16px",border:`1.5px solid ${!n.isRead?"var(--navy)30":"var(--line)"}`,borderRadius:12,background:!n.isRead?"var(--surface-2)":"var(--surface)",cursor:"pointer",transition:"all .12s",display:"flex",gap:12}}>
              <div style={{fontSize:20,flexShrink:0,marginTop:2}}>
                {NOTIF_TYPE_ICON[n.type] ?? "🔔"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:3}}>
                  <b style={{fontSize:12,fontWeight:n.isRead?600:700}}>{n.title}</b>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    {!n.isRead && <span style={{width:8,height:8,borderRadius:"50%",background:"#6366F1",display:"inline-block"}}/>}
                    <span className={`status-pill ${NOTIF_PRIORITY_PILL[n.priority]??"info"}`} style={{fontSize:9}}>{n.priority}</span>
                  </div>
                </div>
                <p style={{fontSize:12,color:"var(--muted)",margin:"0 0 4px",lineHeight:1.5}}>{n.message}</p>
                <span style={{fontSize:10,color:"var(--muted)"}}>{new Date(n.occurredAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Messages panel ──────────────────────────────────────────────────────────
function MessagesPanel() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [activeConv, setActiveConv] = useState<string|null>(null);
  const [searchQ, setSearchQ]       = useState("");
  const [newModal, setNewModal]     = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = useConversations();
  const { data: msgData,  isLoading: msgLoading  } = useMessages(activeConv ?? undefined);
  const sendMsg   = useSendMessage(activeConv ?? "");
  const createConv= useCreateConversation();

  const convs = Array.isArray(convData) ? convData : (convData as any)?.items ?? [];
  const msgs  = Array.isArray(msgData)  ? msgData  : (msgData as any)?.items  ?? [];

  const activeConvObj = convs.find((c:any) => c.id === activeConv);

  const filteredConvs = useMemo(() =>
    convs.filter((c:any) => c.name?.toLowerCase().includes(searchQ.toLowerCase())),
    [convs, searchQ]
  );

  useEffect(() => { endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  async function send(msg: string) {
    if (!msg.trim() || !activeConv) return;
    await sendMsg.mutateAsync(msg);
  }

  async function createNew() {
    if (!newTitle.trim()) return;
    const conv = await createConv.mutateAsync({tenantId:tid, name:newTitle.trim()}) as any;
    setActiveConv(conv?.id ?? null);
    setNewModal(false); setNewTitle("");
  }

  function getMeta(c: any) { return parseMeta(c.metadataJson); }
  function getMsgMeta(m: any) { return parseMeta(m.metadataJson); }

  const [msg, setMsg] = useState("");
  function doSend() { if (!msg.trim()) return; send(msg); setMsg(""); }

  return (
    <div style={{display:"flex",height:"calc(100vh - 340px)",minHeight:480,border:"1px solid var(--line)",borderRadius:14,overflow:"hidden",background:"var(--surface)"}}>
      {/* Conversation list */}
      <div style={{width:260,borderRight:"1px solid var(--line)",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"12px 12px 8px"}}>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <label style={{display:"flex",alignItems:"center",gap:6,flex:1,background:"var(--surface-2)",borderRadius:8,padding:"0 10px",border:"1px solid var(--line)"}}>
              <Search size={12} style={{color:"var(--muted)"}}/>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search…" style={{border:"none",background:"transparent",fontSize:12,outline:"none",flex:1,height:30}}/>
            </label>
            <button style={{width:32,height:32,borderRadius:8,border:"1px solid var(--line)",background:"var(--surface)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewModal(true)}>
              <Plus size={14}/>
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {convLoading ? <div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:12}}>Loading…</div>
          : filteredConvs.length === 0 ? (
            <div style={{padding:20,textAlign:"center",color:"var(--muted)",fontSize:12}}>
              <MessageSquare size={24} style={{margin:"0 auto 8px",display:"block",opacity:.3}}/> No conversations yet
            </div>
          ) : filteredConvs.map((c:any) => {
            const meta = getMeta(c);
            const isActive = c.id === activeConv;
            return (
              <button key={c.id} onClick={()=>setActiveConv(c.id)}
                style={{width:"100%",padding:"11px 14px",border:"none",borderBottom:"1px solid var(--line)",background:isActive?"var(--surface-2)":"transparent",cursor:"pointer",textAlign:"left",display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:36,height:36,borderRadius:10,background:isActive?"var(--navy)":"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {meta.type==="BROADCAST"?<Megaphone size={16} style={{color:isActive?"white":"#6366F1"}}/>:meta.type==="GROUP"?<Users size={16} style={{color:isActive?"white":"#6366F1"}}/>:<MessageSquare size={16} style={{color:isActive?"white":"#6366F1"}}/>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <b style={{fontSize:12,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isActive?"var(--navy)":"var(--text)"}}>{c.name}</b>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{meta.type ?? "Direct"} · {meta.memberCount??2} members</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      {!activeConv ? (
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"var(--muted)"}}>
          <MessageSquare size={40} style={{opacity:.2}}/>
          <b>Select a conversation to start chatting</b>
          <button className="primary" style={{fontSize:12,height:36}} onClick={()=>setNewModal(true)}><Plus size={13}/> New conversation</button>
        </div>
      ) : (
        <div style={{flex:1,display:"flex",flexDirection:"column"}}>
          {/* Chat header */}
          <div style={{padding:"12px 16px",borderBottom:"1px solid var(--line)",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <MessageSquare size={14} style={{color:"#6366F1"}}/>
            </div>
            <div>
              <b style={{fontSize:13}}>{activeConvObj?.name ?? "Conversation"}</b>
              <div style={{fontSize:10,color:"var(--muted)"}}>{parseMeta(activeConvObj?.metadataJson).memberCount??2} members</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"16px",display:"flex",flexDirection:"column",gap:10}}>
            {msgLoading ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:12,padding:20}}>Loading…</div>
            : msgs.length === 0 ? <div style={{textAlign:"center",color:"var(--muted)",fontSize:12,padding:20}}>No messages yet. Say hello!</div>
            : msgs.map((m:any) => {
              const meta = getMsgMeta(m);
              const isMe = meta.sender === "Me";
              return (
                <div key={m.id} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
                  {!isMe && <div style={{width:24,height:24,borderRadius:"50%",background:"#EEF2FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:10,fontWeight:700,color:"#6366F1"}}>{(meta.sender||"?")[0]}</div>}
                  <div style={{maxWidth:"72%"}}>
                    {!isMe && <div style={{fontSize:10,color:"var(--muted)",marginBottom:2,paddingLeft:2}}>{meta.sender}</div>}
                    <div style={{padding:"9px 13px",borderRadius:isMe?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isMe?"var(--navy)":"var(--surface-2)",color:isMe?"white":"var(--text)",fontSize:12,lineHeight:1.55}}>
                      {meta.text ?? m.name}
                    </div>
                    <div style={{fontSize:9,color:"var(--muted)",marginTop:2,textAlign:isMe?"right":"left",paddingLeft:isMe?0:4}}>
                      {meta.sentAt ? new Date(meta.sentAt).toLocaleTimeString() : ""}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef}/>
          </div>

          {/* Input */}
          <div style={{padding:"10px 14px",borderTop:"1px solid var(--line)",display:"flex",gap:8}}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();doSend();}}}
              placeholder="Type a message…"
              style={{flex:1,height:38,padding:"0 14px",border:"1.5px solid var(--line)",borderRadius:20,background:"var(--surface-2)",fontSize:13,outline:"none"}}/>
            <button onClick={doSend} disabled={!msg.trim()||sendMsg.isPending}
              style={{width:38,height:38,borderRadius:"50%",border:"none",background:msg.trim()?"var(--navy)":"var(--line)",color:"white",cursor:msg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {sendMsg.isPending?<RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/>:<Send size={14}/>}
            </button>
          </div>
        </div>
      )}

      {/* New conversation modal */}
      {newModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setNewModal(false)}}>
          <div className="modal-card" style={{width:"min(380px,96vw)"}}>
            <div className="modal-head"><h2>New conversation</h2><button className="icon-button" onClick={()=>setNewModal(false)}><X size={18}/></button></div>
            <div className="human-form">
              <label className="human-field field-wide"><span>Conversation title</span><input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="e.g. Grade 9-A Teachers"/></label>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setNewModal(false)}>Cancel</button>
              <button className="primary" onClick={createNew} disabled={!newTitle.trim()||createConv.isPending}>{createConv.isPending?"Creating…":"Create"}</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export function CommunicationPage() {
  const { data: unread = 0 } = useUnreadCount();
  const [tab, setTab] = useState<"messages"|"notifications">("messages");

  return (
    <>
      <PageHeader title="Communication" subtitle="Messages and notifications"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Unread notifications" value={String(unread)} note="" color={Number(unread)>0?"#EF4444":"#10B981"} bg={Number(unread)>0?"#FFF0F1":"#ECFDF5"}><Bell size={20}/></StatCard>
        <StatCard label="Messages" value="—" note="Active conversations" color="#2563EB" bg="#EFF6FF"><MessageSquare size={20}/></StatCard>
      </section>
      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="messages"?"active":""} onClick={()=>setTab("messages")}>💬 Messages</button>
        <button className={tab==="notifications"?"active":""} onClick={()=>setTab("notifications")}>
          🔔 Notifications {Number(unread)>0 && <span style={{background:"#EF4444",color:"white",borderRadius:20,fontSize:9,padding:"1px 6px",marginLeft:4,fontWeight:700}}>{unread}</span>}
        </button>
      </div>
      {tab==="messages"      && <MessagesPanel/>}
      {tab==="notifications" && <NotificationsPanel/>}
    </>
  );
}
