import { captureApiError } from "../../core/telemetry/telemetry";
import axios, { AxiosError } from "axios";
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { env } from "../../config/env";

export interface SessionUser { id:string; tenantId?:string|null; name:string; email:string; role:string; roles:string[]; school:string; initials:string; accountType:string; businessEntityId?:string|null; }
export interface LoginCredentials { email:string; password:string; }
interface AuthContextValue { user:SessionUser|null; login:(credentials:LoginCredentials)=>Promise<{success:boolean;message?:string}>; logout:()=>void; }
type JwtClaims = Record<string, unknown> & { sub?:string; tenant_id?:string; name?:string; email?:string; role?:string|string[]; account_type?:string; given_name?:string; family_name?:string; business_entity_id?:string; };
const AuthContext=createContext<AuthContextValue|null>(null);
const identityUrl=(path:string)=> import.meta.env.DEV ? `/identity${path}` : `${env.identityBaseUrl}${path}`;

function decodeJwt(token:string):JwtClaims {
  const part=token.split(".")[1];
  if(!part) throw new Error("Identity returned an invalid access token.");
  const normalized=part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=");
  const json=decodeURIComponent(Array.from(atob(normalized)).map(c=>`%${c.charCodeAt(0).toString(16).padStart(2,"0")}`).join(""));
  return JSON.parse(json) as JwtClaims;
}
function values(v:unknown):string[]{ return Array.isArray(v)?v.map(String):v?[String(v)]:[]; }

export function AuthProvider({children}:{children:ReactNode}) {
  const [user,setUser]=useState<SessionUser|null>(()=>{try{return JSON.parse(sessionStorage.getItem("smartschool.session")??"null")}catch{return null}});

  async function login(credentials:LoginCredentials) {
    const email=credentials.email.trim(); const password=credentials.password;
    if(!email||!password) return {success:false,message:"Email and password are required."};
    if(/^https?:\/\//i.test(password)) return {success:false,message:"Invalid password value received from the login form."};

    const body=new URLSearchParams();
    body.set("grant_type","password"); body.set("client_id","smartschool-login-api");
    body.set("username",email); body.set("password",password);
    body.set("scope","openid profile email smartschool.api offline_access");

    try {
      const {data:tokens}=await axios.post(identityUrl("/connect/token"),body.toString(),{headers:{"Content-Type":"application/x-www-form-urlencoded","Accept":"application/json"},timeout:30000});
      if(!tokens?.access_token) throw new Error("Identity did not return an access token.");
      sessionStorage.setItem("access_token",tokens.access_token);
      if(tokens.refresh_token) sessionStorage.setItem("refresh_token",tokens.refresh_token);

      // Do not call /api/account/me during login. The access token already contains
      // the profile/role claims and /me currently uses the interactive cookie challenge.
      const claims = decodeJwt(tokens.access_token);
      const roles = values(claims.role);
      const firstName = String(claims.given_name ?? "");
      const lastName = String(claims.family_name ?? "");
      const emailAddress = String(claims.email ?? email);
      const displayName =
        String(claims.name ?? "").trim() ||
        `${firstName} ${lastName}`.trim() ||
        emailAddress;
      const tenantId = String(claims.tenant_id ?? "").trim() || null;
      const accountType =
        String(claims.account_type ?? "").trim() ||
        roles[0] ||
        "";

      const sessionUser: SessionUser = {
        id: String(claims.sub ?? ""),
        tenantId,
        name: displayName,
        email: emailAddress,
        role: roles[0] || accountType,
        roles,
        accountType,
        school: "SmartSchool",
        initials: `${firstName.charAt(0)}${lastName.charAt(0)}`,
        businessEntityId: claims.business_entity_id
          ? String(claims.business_entity_id)
          : null,
      };
      if(!sessionUser.id) throw new Error("Access token does not contain a subject claim.");
      sessionStorage.setItem("tenant_id",tenantId||env.tenantId);
      sessionStorage.setItem("smartschool.session",JSON.stringify(sessionUser)); setUser(sessionUser);
      return {success:true};
    } catch(error) {
      const e=error as AxiosError<{error?:string;error_description?:string}>; const oauth=e.response?.data;
      const message=oauth?.error_description||oauth?.error||e.message||"Login failed.";
      captureApiError(error, "IdentityLogin");
      console.error("Identity login failed",{status:e.response?.status,oauthError:oauth?.error,message});
      return {success:false,message};
    }
  }
  function logout(){sessionStorage.clear();setUser(null)}
  const value=useMemo(()=>({user,login,logout}),[user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth(){const c=useContext(AuthContext);if(!c)throw new Error("useAuth must be used inside AuthProvider.");return c;}
