import { Plus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { notifications } from "../../../mocks/data";
export function CommunicationPage() {
  return (
    <>
      <PageHeader title="Communication Centre" subtitle="Notices, messages and announcements" action={<div className="page-actions"><button className="primary"><Plus size={15}/> New Announcement</button></div>}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div className="surface">
          <div className="surface-head"><h3>Inbox</h3><p>Recent messages across all actors</p></div>
          <div style={{ padding: "0 18px 16px" }}>
            {[["Ms. Aisha (Math)","Ahmed scored 18/20 — excellent!","2h ago","#EEF2FF","#6366F1"],
              ["Admin Office","August fee receipt is ready.","1d ago","#EFF6FF","#2563EB"],
              ["Principal","P-T meeting Sep 2, 2026.","2d ago","#FFFBEB","#D97706"],
              ["Finance Office","Salary slip for August attached.","2d ago","#F5F3FF","#8B5CF6"]
            ].map(([from,msg,time,bg,col]) => (
              <div key={from as string} style={{ display:"flex", gap:10, padding:"11px 0", borderBottom:"1px solid var(--surface-2)" }}>
                <div style={{ width:32,height:32,borderRadius:9,background:bg as string,color:col as string,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,flexShrink:0 }}>{(from as string)[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12 }}><b>{from as string}:</b> {msg as string}</div>
                  <div style={{ fontSize:10,color:"var(--muted)",marginTop:3 }}>{time as string}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="surface">
          <div className="surface-head"><h3>Notifications</h3><p>System notifications for your role</p></div>
          <div style={{ padding:"0 18px 16px" }}>
            {notifications.slice(0,4).map(n => (
              <div key={n.id} style={{ display:"flex",gap:10,padding:"11px 0",borderBottom:"1px solid var(--surface-2)",alignItems:"flex-start" }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:n.read?"var(--line)":"var(--purple)",marginTop:4,flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12,fontWeight:600 }}>{n.title}</div>
                  <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>{n.message}</div>
                  <div style={{ fontSize:10,color:"var(--muted)",marginTop:3 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
