import { useState } from "react";
import axios from "axios";
import { AlertCircle, Bot, Send } from "lucide-react";
import { env } from "../../../config/env";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useUi } from "../../../components/ui/InteractiveUi";

type Citation={id:string;name:string;score:number};
type Answer={answer:string;citations:Citation[];model:string};

export function AiPage(){
 const {user}=useAuth(); const {notify}=useUi(); const [question,setQuestion]=useState(""); const [result,setResult]=useState<Answer|null>(null);
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function ask(){
  const q=question.trim(); if(!q)return; setBusy(true);setError("");
  try{
   const r=await axios.post(`${env.apiBaseUrl}/api/ai/assistant/ask`,
    {tenantId:effectiveTenantId(user),question:q,actor:user?.role,schoolId:user?.schoolId},
    {headers:{Authorization:`Bearer ${sessionStorage.getItem("access_token")??""}`}});
   setResult(r.data);
   notify({kind:"success",title:"AI response ready",message:"SmartSchool Assistant answered your question."});
  }catch(e:any){
   const message=e?.response?.data?.detail??e?.response?.data?.title??e?.response?.data?.message??e?.message??"AI request failed.";
   setResult(null); setError(message);
   notify({kind:"error",title:"AI request failed",message});
  }
  finally{setBusy(false);}
 }
 return <div><div className="page-header"><div><span className="eyebrow">Ollama + pgvector RAG</span><h1>SmartSchool AI Assistant</h1><p>Tenant-scoped knowledge assistant with source citations.</p></div></div>
 <section className="panel"><div className="chat-compose"><textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask about school notes, policies, learning material or student support..." />
 <button className="primary" disabled={busy} onClick={ask}><Send size={16}/>{busy?" Thinking...":" Ask"}</button></div>
 {error&&<div className="error-state" role="alert"><AlertCircle size={20}/><div><b>Unable to get an AI response</b><span>{error}</span></div></div>}
 {result&&<div><h3><Bot size={18}/> Answer</h3><p style={{whiteSpace:"pre-wrap"}}>{result.answer}</p><small>Model: {result.model}</small>
 <h4>Sources</h4>{result.citations.map((c,i)=><div key={c.id}>[{i+1}] {c.name} • relevance {(c.score*100).toFixed(1)}%</div>)}</div>}</section></div>;
}
