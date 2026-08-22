import { useEffect, useState } from "react";
import axios from "axios";
import { env } from "../../../config/env";
import { useAuth } from "../../auth/auth";
import { PageHeader } from "../../../components/ui/PageHeader";
import { http } from "../../../core/api/httpClient";

type Tenant={id:string;tenantId:string;code:string;name:string};
type IdentityUser = {
  id:string; tenantId?:string|null; schoolId?:string|null; email:string;
  firstName:string; lastName:string; displayName?:string|null; accountType?:string|null;
  isActive:boolean; mustChangePassword:boolean; roles:string[];
};

const authHeader=()=>({Authorization:`Bearer ${sessionStorage.getItem("access_token")??""}`});

export function PlatformAdminPage(){
  const {user}=useAuth();
  const [tenantId,setTenantId]=useState(sessionStorage.getItem("selected_tenant_id")??"");
  const [users,setUsers]=useState<IdentityUser[]>([]);const[tenants,setTenants]=useState<Tenant[]>([]);
  const [message,setMessage]=useState("");
  const [email,setEmail]=useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");

  const isSuperAdmin=user?.roles?.includes("SuperAdmin");
  async function loadUsers(){
    if(!isSuperAdmin)return;
    const r=await axios.get(`${env.identityBaseUrl}/api/identity/users`,{
      params:{page:1,pageSize:100,tenantId:tenantId||undefined},headers:authHeader()
    });
    setUsers(r.data.items??[]);
  }
  useEffect(()=>{void loadUsers()},[tenantId,isSuperAdmin]);useEffect(()=>{if(!isSuperAdmin)return;const pt=sessionStorage.getItem("tenant_id")||env.tenantId;http.get("/api/tenancy/tenant",{params:{tenantId:pt,page:1,pageSize:250}}).then(r=>{const d:any=r.data;setTenants(d?.items??d?.data?.items??[])}).catch(()=>setTenants([]))},[isSuperAdmin]);

  function selectTenant(value:string){
    setTenantId(value);
    if(value)sessionStorage.setItem("selected_tenant_id",value);
    else sessionStorage.removeItem("selected_tenant_id");
  }

  async function createSchoolAdmin(){
    if(!tenantId||!email||!firstName||!lastName){setMessage("Tenant, email and name are required.");return;}
    const r=await axios.post(`${env.identityBaseUrl}/api/identity/users`,{
      tenantId,schoolId:null,email,password:null,firstName,lastName,
      accountType:"SchoolAdmin",roles:["SchoolAdmin"]
    },{headers:authHeader()});
    setMessage(`School Admin created. Temporary password: ${r.data.temporaryPassword}`);
    setEmail("");setFirstName("");setLastName("");await loadUsers();
  }

  async function setTenantActive(active:boolean){
    if(!tenantId)return;
    const r=await axios.post(`${env.identityBaseUrl}/api/identity/users/tenant/${tenantId}/status`,
      {isActive:active},{headers:authHeader()});
    setMessage(`${active?"Enabled":"Disabled"} tenant; affected ${r.data.affectedUsers} users.`);
    await loadUsers();
  }

  async function impersonate(target:IdentityUser){
    const r=await axios.post(`${env.identityBaseUrl}/api/identity/users/impersonation/start`,
      {targetUserId:target.id,reason:"SuperAdmin support session"},{headers:authHeader()});
    sessionStorage.setItem("impersonation_target",JSON.stringify(r.data.impersonation));
    setMessage(`Impersonation prepared for ${target.displayName||target.email}. Token exchange is required before switching identity.`);
  }

  if(!isSuperAdmin)return <div className="empty-state">Platform management is available to SuperAdmin only.</div>;

  return <>
    <PageHeader title="Platform Management" subtitle="Tenants, school master users and support impersonation"/>
    <section className="panel">
      <h3>Tenant context</h3>
      <select className="filter-select" value={tenantId} onChange={e=>selectTenant(e.target.value)}><option value="">All tenants</option>{tenants.map(t=><option key={t.id||t.tenantId} value={t.id||t.tenantId}>{t.name} ({t.code})</option>)}</select>
      <button onClick={()=>setTenantActive(true)}>Enable tenant</button>
      <button className="secondary" onClick={()=>setTenantActive(false)}>Disable tenant & users</button>
    </section>
    <section className="panel">
      <h3>Create School Master Admin</h3>
      <div className="form-grid">
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Admin email"/>
        <input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name"/>
        <input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name"/>
      </div>
      <button onClick={createSchoolAdmin}>Create with temporary password</button>
      {message&&<p>{message}</p>}
    </section>
    <section className="panel">
      <h3>Tenant users</h3>
      <table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Support</th></tr></thead>
      <tbody>{users.map(x=><tr key={x.id}><td>{x.displayName||x.email}<br/><small>{x.email}</small></td>
        <td>{x.roles.join(", ")}</td><td>{x.isActive?"Active":"Disabled"}</td>
        <td><button className="secondary" onClick={()=>impersonate(x)}>Login as user</button></td></tr>)}</tbody></table>
    </section>
  </>;
}
