import axios, { AxiosError } from "axios";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { env } from "../../config/env";
import { captureApiError } from "../../core/telemetry/telemetry";

/** Represents the authenticated SmartSchool user stored in the browser session. */
export interface SessionUser {
  id: string;
  tenantId?: string | null;
  name: string;
  email: string;
  role: string;
  roles: string[];
  school: string;
  initials: string;
  accountType: string;
  businessEntityId?: string | null;
  schoolId?: string | null;
  mustChangePassword?: boolean;
  impersonated?: boolean;
  impersonatorSubject?: string | null;
}

/** Credentials accepted by the SmartSchool login form. */
export interface LoginCredentials { email: string; password: string; }

type AuthResult = { success: boolean; message?: string };
interface AuthContextValue {
  user: SessionUser | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => void;
  impersonate: (targetUserId: string, reason: string) => Promise<AuthResult>;
  stopImpersonation: () => void;
}

type JwtClaims = Record<string, unknown> & {
  sub?: string; tenant_id?: string; name?: string; email?: string; role?: string | string[];
  account_type?: string; given_name?: string; family_name?: string; business_entity_id?: string;
  school_id?: string; must_change_password?: boolean | string; impersonated?: boolean | string;
  impersonator_sub?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const identityUrl = (path: string) => import.meta.env.DEV ? `/identity${path}` : `${env.identityBaseUrl}${path}`;
const SESSION_KEY = "smartschool.session";
const ORIGINAL_TOKEN_KEY = "smartschool.original_access_token";
const ORIGINAL_SESSION_KEY = "smartschool.original_session";
const AUTH_KEYS = ["access_token", "refresh_token", "id_token", SESSION_KEY, "tenant_id", "selected_tenant_id",
  "impersonation_token", "impersonated_user", "impersonator_sub", ORIGINAL_TOKEN_KEY, ORIGINAL_SESSION_KEY] as const;

/** Clears every authentication and impersonation value owned by the portal. */
export function clearAuthenticationState(): void {
  AUTH_KEYS.forEach((key) => { sessionStorage.removeItem(key); localStorage.removeItem(key); });
}

function decodeJwt(token: string): JwtClaims {
  const part = token.split(".")[1];
  if (!part) throw new Error("Identity returned an invalid access token.");
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(part.length / 4) * 4, "=");
  const json = decodeURIComponent(Array.from(atob(normalized))
    .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
  return JSON.parse(json) as JwtClaims;
}

function claimValues(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function createSessionUser(token: string, fallbackEmail = ""): SessionUser {
  const claims = decodeJwt(token);
  const roles = claimValues(claims.role);
  const firstName = String(claims.given_name ?? "");
  const lastName = String(claims.family_name ?? "");
  const email = String(claims.email ?? fallbackEmail);
  const name = String(claims.name ?? "").trim() || `${firstName} ${lastName}`.trim() || email;
  const tenantId = String(claims.tenant_id ?? "").trim() || null;
  const accountType = String(claims.account_type ?? "").trim() || roles[0] || "";
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || name.slice(0, 2).toUpperCase();

  if (!claims.sub) throw new Error("Access token does not contain a subject claim.");

  return {
    id: String(claims.sub), tenantId, name, email, role: roles[0] || accountType, roles, accountType,
    school: "SmartSchool", initials, businessEntityId: claims.business_entity_id ? String(claims.business_entity_id) : null,
    schoolId: claims.school_id ? String(claims.school_id) : null,
    mustChangePassword: claims.must_change_password === true || String(claims.must_change_password ?? "").toLowerCase() === "true",
    impersonated: claims.impersonated === true || String(claims.impersonated ?? "").toLowerCase() === "true",
    impersonatorSubject: claims.impersonator_sub ? String(claims.impersonator_sub) : null,
  };
}

/** Provides login, logout and audited impersonation state to the portal. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
  });

  useEffect(() => {
    const unauthorized = () => setUser(null);
    window.addEventListener("smartschool:unauthorized", unauthorized);
    return () => window.removeEventListener("smartschool:unauthorized", unauthorized);
  }, []);

  function persistSession(token: string, sessionUser: SessionUser): void {
    sessionStorage.setItem("access_token", token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    if (sessionUser.tenantId) sessionStorage.setItem("tenant_id", sessionUser.tenantId);
    setUser(sessionUser);
  }

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const email = credentials.email.trim();
    if (!email || !credentials.password) return { success: false, message: "Email and password are required." };
    clearAuthenticationState(); setUser(null);
    const body = new URLSearchParams({ grant_type: "password", client_id: "smartschool-login-api", username: email,
      password: credentials.password, scope: "openid profile email smartschool.api offline_access" });
    try {
      const { data } = await axios.post(identityUrl("/connect/token"), body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, timeout: 30_000,
      });
      if (!data?.access_token) throw new Error("Identity did not return an access token.");
      if (data.refresh_token) sessionStorage.setItem("refresh_token", data.refresh_token);
      if (data.id_token) sessionStorage.setItem("id_token", data.id_token);
      persistSession(data.access_token, createSessionUser(data.access_token, email));
      return { success: true };
    } catch (error) {
      const e = error as AxiosError<{ error?: string; error_description?: string }>;
      const message = e.response?.data?.error_description || e.response?.data?.error || e.message || "Login failed.";
      clearAuthenticationState(); setUser(null); captureApiError(error, "IdentityLogin");
      return { success: false, message };
    }
  }

  async function impersonate(targetUserId: string, reason: string): Promise<AuthResult> {
    const actorToken = sessionStorage.getItem("access_token");
    if (!actorToken || !user) return { success: false, message: "Your administrator session is no longer available." };
    const body = new URLSearchParams({ grant_type: "impersonation", client_id: "smartschool-login-api",
      actor_token: actorToken, target_user_id: targetUserId, reason: reason.trim() || "Support session" });
    try {
      const { data } = await axios.post(identityUrl("/connect/token"), body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" }, timeout: 30_000,
      });
      if (!data?.access_token) throw new Error("Identity did not return an impersonation token.");
      sessionStorage.setItem(ORIGINAL_TOKEN_KEY, actorToken);
      sessionStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify(user));
      persistSession(data.access_token, createSessionUser(data.access_token));
      return { success: true };
    } catch (error) {
      const e = error as AxiosError<{ error?: string; error_description?: string }>;
      return { success: false, message: e.response?.data?.error_description || e.response?.data?.error || e.message };
    }
  }

  function stopImpersonation(): void {
    const token = sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
    const original = sessionStorage.getItem(ORIGINAL_SESSION_KEY);
    if (!token || !original) return;
    try {
      const originalUser = JSON.parse(original) as SessionUser;
      sessionStorage.removeItem(ORIGINAL_TOKEN_KEY); sessionStorage.removeItem(ORIGINAL_SESSION_KEY);
      sessionStorage.removeItem("selected_tenant_id");
      persistSession(token, originalUser);
    } catch { clearAuthenticationState(); setUser(null); }
  }

  function logout(): void { clearAuthenticationState(); setUser(null); }
  const value = useMemo(() => ({ user, login, logout, impersonate, stopImpersonation }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Returns the current authentication context. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
