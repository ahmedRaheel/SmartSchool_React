import axios from "axios";import{createContext,type ReactNode,useContext,useMemo,useState}from"react";import{env}from"../../config/env";
export interface SessionUser{id:string;tenantId?:string|null;name:string;email:string;role:string;roles:string[];school:string;initials:string;accountType:string;businessEntityId?:string|null}
const C=createContext<any>(null);
const tokenUrl=()=>`${env.identityBaseUrl}/connect/token`;
export function AuthProvider({children}:{children:ReactNode}){const[user,setUser]=useState<SessionUser|null>(()=>{try{return JSON.parse(sessionStorage.getItem("smartschool.session")||"null")}catch{return null}});
async function login(email:string,password:string){try{
 const body=new URLSearchParams();body.set("grant_type","password");body.set("client_id","smartschool-login-api");body.set("username",email);body.set("password",password);body.set("scope","openid profile email smartschool.profile smartschool.api offline_access");
 const{data:tokens}=await axios.post(tokenUrl(),body,{headers:{"Content-Type":"application/x-www-form-urlencoded"}});
 sessionStorage.setItem("access_token",tokens.access_token);if(tokens.refresh_token)sessionStorage.setItem("refresh_token",tokens.refresh_token);
 const{data:x}=await axios.get(`${env.identityBaseUrl}/api/account/me`,{headers:{Authorization:`Bearer ${tokens.access_token}`}});
 sessionStorage.setItem("tenant_id",x.tenantId||env.tenantId);
 const u:SessionUser={id:x.id,tenantId:x.tenantId,name:x.displayName,email:x.email,role:x.roles?.[0]||x.accountType,roles:x.roles||[],accountType:x.accountType,school:"SmartSchool",initials:`${x.firstName?.[0]||""}${x.lastName?.[0]||""}`};
 sessionStorage.setItem("smartschool.session",JSON.stringify(u));setUser(u);return true
}catch(error:any){console.error("Identity login failed",error.response?.data||error);return false}}
function logout(){sessionStorage.clear();setUser(null)}
const value=useMemo(()=>({user,login,logout}),[user]);return <C.Provider value={value}>{children}</C.Provider>}
export function useAuth(){const c=useContext(C);if(!c)throw new Error("useAuth outside provider");return c}
