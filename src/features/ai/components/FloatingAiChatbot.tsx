import { useMemo, useState } from "react";
import { Bot, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";

type ChatMessage = { id: string; role: "assistant" | "user"; text: string };
type AiAnswer = { answer: string; model?: string; contextSource?: string };
const welcome: ChatMessage[] = [{id:"welcome",role:"assistant",text:"Hello. I’m SmartSchool AI. Ask me about students, academics, attendance, results, fees, admissions, policies or school operations."}];

/** Persistent role-aware AI chatbot available from every authenticated screen. */
export function FloatingAiChatbot() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open,setOpen] = useState(false);
  const [input,setInput] = useState("");
  const [busy,setBusy] = useState(false);
  const [messages,setMessages] = useState<ChatMessage[]>(welcome);
  const title = useMemo(() => {
    const role=(user?.role??"").toLowerCase();
    if(role.includes("student")) return "AI Tutor";
    if(role.includes("teacher")) return "Teacher AI Assistant";
    if(role.includes("parent")) return "Parent AI Assistant";
    if(role.includes("principal")) return "Principal AI Assistant";
    if(role.includes("admin")) return "Admin AI Assistant";
    return "SmartSchool AI";
  },[user?.role]);
  if(!user) return null;

  async function sendMessage(){
    const prompt=input.trim(); if(!prompt||busy)return;
    setMessages(current=>[...current,{id:crypto.randomUUID(),role:"user",text:prompt}]); setInput(""); setBusy(true);
    try{
      const {data}=await api.post<AiAnswer>("/api/aicore/execute",{tenantId:effectiveTenantId(user),assistant:title,prompt,collections:collectionsFor(user.role),schoolId:user.schoolId,actorId:user.id});
      setMessages(current=>[...current,{id:crypto.randomUUID(),role:"assistant",text:data.answer}]);
    }catch(error){setMessages(current=>[...current,{id:crypto.randomUUID(),role:"assistant",text:`I couldn't complete that request. ${getErrorMessage(error)}`}]);}
    finally{setBusy(false);}
  }

  return <>
    {open&&<section className="floating-ai-panel" aria-label={title}>
      <header className="floating-ai-header"><span className="floating-ai-avatar"><Bot size={19}/></span><div><b>{title}</b><small><span className="ai-online-dot"/> Online · Ollama + SmartSchool knowledge</small></div><button className="floating-ai-close" onClick={()=>setOpen(false)}><X size={18}/></button></header>
      <div className="floating-ai-messages">{messages.map(message=><div key={message.id} className={`floating-ai-message ${message.role}`}>{message.role==="assistant"&&<span className="mini-ai-avatar"><Sparkles size={13}/></span>}<div className="floating-ai-bubble">{message.text}</div></div>)}{busy&&<div className="floating-ai-message assistant"><span className="mini-ai-avatar"><Sparkles size={13}/></span><div className="floating-ai-bubble">Thinking…</div></div>}</div>
      <div className="floating-ai-footer"><button className="floating-ai-workspace" onClick={()=>{setOpen(false);navigate("/ai")}}><ExternalLink size={13}/> Open full AI workspace</button><div className="floating-ai-compose"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={`Ask ${title}…`} rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void sendMessage()}}}/><button onClick={()=>void sendMessage()} disabled={busy||!input.trim()}><Send size={16}/></button></div><small className="floating-ai-disclaimer">AI responses follow your role, tenant and school access.</small></div>
    </section>}
    <button className={`floating-ai-launcher ${open?"active":""}`} onClick={()=>setOpen(v=>!v)} aria-label="Open SmartSchool AI chatbot">{open?<X size={22}/>:<Bot size={23}/>} {!open&&<span>AI</span>}</button>
  </>;
}
function collectionsFor(role:string):string[]{const v=role.toLowerCase();if(v.includes("student"))return["learning","academic","policy"];if(v.includes("teacher"))return["learning","academic","policy","operations"];if(v.includes("parent"))return["academic","policy"];if(v.includes("admin")||v.includes("principal"))return["operations","academic","policy","admissions"];return["learning","academic","policy"]}
