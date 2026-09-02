import axios, { AxiosError } from "axios";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { env } from "../../config/env";
import { captureApiError } from "../../core/telemetry/telemetry";

/** Represents the authenticated SmartSchool user persisted across browser refreshes. */
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
  branchId?: string | null;
  studentId?: string | null;
  teacherId?: string | null;
  driverId?: string | null;
  examinerId?: string | null;
  employeeId?: string | null;
  mustChangePassword?: boolean;
  impersonated?: boolean;
  impersonatorSubject?: string | null;
}

/** Credentials accepted by the SmartSchool login form. */
export interface LoginCredentials {
  email: string;
  password: string;
}

type AuthResult = { success: boolean; message?: string };
interface AuthContextValue {
  user: SessionUser | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  logout: () => void;
  impersonate: (targetUserId: string, reason: string) => Promise<AuthResult>;
  stopImpersonation: () => void;
}

type JwtClaims = Record<string, unknown> & {
  sub?: string;
  tenant_id?: string;
  name?: string;
  email?: string;
  role?: string | string[];
  account_type?: string;
  given_name?: string;
  family_name?: string;
  business_entity_id?: string;
  school_id?: string;
  branch_id?: string;
  student_id?: string;
  teacher_id?: string;
  driver_id?: string;
  examiner_id?: string;
  employee_id?: string;
  must_change_password?: boolean | string;
  impersonated?: boolean | string;
  impersonator_sub?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const identityUrl = (path: string) =>`${env.identityBaseUrl}${path}`;
const SESSION_KEY = "smartschool.session";
const ORIGINAL_TOKEN_KEY = "smartschool.original_access_token";
const ORIGINAL_SESSION_KEY = "smartschool.original_session";
const AUTH_KEYS = [
  "access_token",
  "refresh_token",
  "id_token",
  SESSION_KEY,
  "tenant_id",
  "selected_tenant_id",
  "impersonation_token",
  "impersonated_user",
  "impersonator_sub",
  ORIGINAL_TOKEN_KEY,
  ORIGINAL_SESSION_KEY,
] as const;

/** Clears every authentication and impersonation value owned by the portal. */
export function clearAuthenticationState(): void {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

function decodeJwt(token: string): JwtClaims {
  const part = token.split(".")[1];
  if (!part) throw new Error("Identity returned an invalid access token.");
  const normalized = part
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(part.length / 4) * 4, "=");
  const json = decodeURIComponent(
    Array.from(atob(normalized))
      .map(
        (character) =>
          `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`
      )
      .join("")
  );
  return JSON.parse(json) as JwtClaims;
}

function claimValues(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(String)
    : value
    ? [String(value)]
    : [];
}

function createSessionUser(token: string, fallbackEmail = ""): SessionUser {
  const claims = decodeJwt(token);
  const roles = claimValues(claims.role);
  const firstName = String(claims.given_name ?? "");
  const lastName = String(claims.family_name ?? "");
  const email = String(claims.email ?? fallbackEmail);
  const name =
    String(claims.name ?? "").trim() ||
    `${firstName} ${lastName}`.trim() ||
    email;
  const tenantId = String(claims.tenant_id ?? "").trim() || null;
  const accountType =
    String(claims.account_type ?? "").trim() || roles[0] || "";
  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}` ||
    name.slice(0, 2).toUpperCase();

  if (!claims.sub)
    throw new Error("Access token does not contain a subject claim.");

  return {
    id: String(claims.sub),
    tenantId,
    name,
    email,
    role: roles[0] || accountType,
    roles,
    accountType,
    school: "SmartSchool",
    initials,
    businessEntityId: claims.business_entity_id
      ? String(claims.business_entity_id)
      : null,
    schoolId: claims.school_id ? String(claims.school_id) : null,
    branchId: claims.branch_id ? String(claims.branch_id) : null,
    studentId: claims.student_id ? String(claims.student_id) : null,
    teacherId: claims.teacher_id ? String(claims.teacher_id) : null,
    driverId: claims.driver_id ? String(claims.driver_id) : null,
    examinerId: claims.examiner_id ? String(claims.examiner_id) : null,
    employeeId: claims.employee_id ? String(claims.employee_id) : null,
    mustChangePassword:
      claims.must_change_password === true ||
      String(claims.must_change_password ?? "").toLowerCase() === "true",
    impersonated:
      claims.impersonated === true ||
      String(claims.impersonated ?? "").toLowerCase() === "true",
    impersonatorSubject: claims.impersonator_sub
      ? String(claims.impersonator_sub)
      : null,
  };
}

/** Provides login, logout and audited impersonation state to the portal. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const stored =
        localStorage.getItem(SESSION_KEY) ??
        sessionStorage.getItem(SESSION_KEY);
      return JSON.parse(stored ?? "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // ApiClient fires this when a 401 is received OR the token is proactively
    // detected as expired before a request. Storage is already wiped by that
    // point — we just need to sync React state.
    const onSessionEnded = () => {
      setUser(null);
      // ApiClient already called window.location.replace("/login…")
      // but if for any reason we're still here, redirect now.
      if (!window.location.pathname.startsWith("/login")) {
        const returnTo = encodeURIComponent(window.location.pathname);
        window.location.replace(`/login?returnTo=${returnTo}`);
      }
    };
    window.addEventListener("smartschool:session-ended", onSessionEnded);
    // Keep backward-compat with the old event name
    window.addEventListener("smartschool:unauthorized",  onSessionEnded);
    return () => {
      window.removeEventListener("smartschool:session-ended", onSessionEnded);
      window.removeEventListener("smartschool:unauthorized",  onSessionEnded);
    };
  }, []);

  // ── Proactive expiry timer ──────────────────────────────────────────────────
  // Checks every 60 s whether the stored token has passed its `exp` claim.
  // Fires even when no API call is in flight (e.g. idle user on a dashboard).
  useEffect(() => {
    if (!user) return; // already logged out

    function checkExpiry() {
      const token = localStorage.getItem("access_token");
      if (!token || token.startsWith("mock_")) return; // mock tokens never expire

      try {
        const part = token.split(".")[1];
        if (!part) return;
        const { exp } = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
        if (typeof exp === "number" && exp * 1000 < Date.now()) {
          // Session expired while tab was idle
          clearAuthenticationState();
          setUser(null);
          const returnTo = encodeURIComponent(window.location.pathname);
          window.location.replace(`/login?returnTo=${returnTo}&reason=expired`);
        }
      } catch { /* ignore malformed tokens */ }
    }

    checkExpiry(); // immediate check on mount / user change
    const id = window.setInterval(checkExpiry, 60_000); // repeat every minute
    return () => window.clearInterval(id);
  }, [user?.id]); // re-register only when the logged-in user changes

  function persistSession(token: string, sessionUser: SessionUser): void {
    localStorage.setItem("access_token", token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    if (sessionUser.tenantId) {
      localStorage.setItem("tenant_id", sessionUser.tenantId);
      if (!sessionUser.roles.includes("SuperAdmin")) {
        sessionStorage.removeItem("selected_tenant_id");
        localStorage.removeItem("selected_tenant_id");
      }
    }
    setUser(sessionUser);
  }

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const email = credentials.email.trim();
    if (!email || !credentials.password)
      return { success: false, message: "Email and password are required." };

    // ── MOCK MODE: bypass identity server, create session from email ───────
    if (env.useMocks) {
      const MOCK_ROLES: Record<string, Partial<SessionUser>> = {
        "superadmin@smartschool.local": { role:"SuperAdmin",   roles:["SuperAdmin"],  name:"Platform Admin",  accountType:"SuperAdmin",  school:"SmartSchool Platform" },
        "owner@alnoor.edu.pk":          { role:"Tenant",       roles:["Tenant"],      name:"School Owner",    accountType:"Tenant",      school:"Al-Noor Academy" },
        "principal@alnoor.edu.pk":      { role:"Principal",    roles:["Principal"],   name:"Principal",       accountType:"Principal",   school:"Al-Noor Academy" },
        "admin@alnoor.edu.pk":          { role:"Admin",        roles:["Admin"],       name:"Admin Officer",   accountType:"Admin",       school:"Al-Noor Academy" },
        "teacher@alnoor.edu.pk":        { role:"Teacher",      roles:["Teacher"],     name:"Aisha Siddiqui",  accountType:"Employee",    school:"Al-Noor Academy", employeeId:"33333333-3333-3333-3333-333333333333" },
        "student@alnoor.edu.pk":        { role:"Student",      roles:["Student"],     name:"Ahmed Hassan",    accountType:"Student",     school:"Al-Noor Academy", studentId:"22222222-2222-2222-2222-222222222222" },
        "parent@alnoor.edu.pk":         { role:"Parent",       roles:["Parent"],      name:"Ali Hassan",      accountType:"Guardian",    school:"Al-Noor Academy", businessEntityId:"44444444-4444-4444-4444-444444444444" },
        "driver@alnoor.edu.pk":         { role:"Driver",       roles:["Driver"],      name:"Arif Khan",       accountType:"Employee",    school:"Al-Noor Academy", driverId:"55555555-5555-5555-5555-555555555555" },
        "accountant@alnoor.edu.pk":     { role:"Accountant",   roles:["Accountant"],  name:"Zulfiqar Ahmed",  accountType:"Employee",    school:"Al-Noor Academy", employeeId:"66666666-6666-6666-6666-666666666666" },
        "hrmanager@alnoor.edu.pk":      { role:"HRManager",    roles:["HRManager"],   name:"Nadia Pervez",    accountType:"Employee",    school:"Al-Noor Academy", employeeId:"77777777-7777-7777-7777-777777777777" },
        "examiner@alnoor.edu.pk":       { role:"Examiner",     roles:["Examiner"],    name:"Dr. Tariq Malik", accountType:"Employee",    school:"Al-Noor Academy", examinerId:"88888888-8888-8888-8888-888888888888" },
      };
      const mock = MOCK_ROLES[email] ?? { role:"Admin", roles:["Admin"], name:email.split("@")[0], accountType:"Admin", school:"School" };
      const mockUser: SessionUser = {
        id: "mock-" + email,
        tenantId: "11111111-1111-1111-1111-111111111111",
        email,
        initials: (mock.name ?? email).split(" ").map((w:string) => w[0]).join("").slice(0,2).toUpperCase(),
        mustChangePassword: false,
        impersonated: false,
        impersonatorSubject: null,
        schoolId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        branchId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        ...mock,
      } as SessionUser;
      persistSession("mock_access_token_" + Date.now(), mockUser);
      return { success: true };
    }
    // ──────────────────────────────────────────────────────────────────────

    clearAuthenticationState();
    setUser(null);
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: "smartschool-login-api",
      client_secret: "development-login-api-secret-change-me",
      username: email,
      password: credentials.password,
      scope: "openid profile email smartschool.api offline_access",
    });
    try {
      const { data } = await axios.post(
        identityUrl("/connect/token"),
        body.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          timeout: 30_000,
        }
      );
      if (!data?.access_token)
        throw new Error("Identity did not return an access token.");
      if (data.refresh_token)
        localStorage.setItem("refresh_token", data.refresh_token);
      if (data.id_token) localStorage.setItem("id_token", data.id_token);
      persistSession(
        data.access_token,
        createSessionUser(data.access_token, email)
      );
      return { success: true };
    } catch (error) {
      const e = error as AxiosError<{
        error?: string;
        error_description?: string;
      }>;
      const message =
        e.response?.data?.error_description ||
        e.response?.data?.error ||
        e.message ||
        "Login failed.";
      clearAuthenticationState();
      setUser(null);
      captureApiError(error, "IdentityLogin");
      return { success: false, message };
    }
  }

  async function impersonate(
    targetUserId: string,
    reason: string
  ): Promise<AuthResult> {
    const actorToken =
      localStorage.getItem("access_token") ??
      localStorage.getItem("access_token") ??
      sessionStorage.getItem("access_token");
    if (!actorToken || !user)
      return {
        success: false,
        message: "Your administrator session is no longer available.",
      };
    const body = new URLSearchParams({
      grant_type: "impersonation",
      client_id: "smartschool-login-api",
      actor_token: actorToken,
      target_user_id: targetUserId,
      reason: reason.trim() || "Support session",
    });
    try {
      const { data } = await axios.post(
        identityUrl("/connect/token"),
        body.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          timeout: 30_000,
        }
      );
      if (!data?.access_token)
        throw new Error("Identity did not return an impersonation token.");
      localStorage.setItem(ORIGINAL_TOKEN_KEY, actorToken);
      localStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify(user));
      persistSession(data.access_token, createSessionUser(data.access_token));
      return { success: true };
    } catch (error) {
      const e = error as AxiosError<{
        error?: string;
        error_description?: string;
      }>;
      return {
        success: false,
        message:
          e.response?.data?.error_description ||
          e.response?.data?.error ||
          e.message,
      };
    }
  }

  function stopImpersonation(): void {
    const token =
      localStorage.getItem(ORIGINAL_TOKEN_KEY) ??
      sessionStorage.getItem(ORIGINAL_TOKEN_KEY);
    const original =
      localStorage.getItem(ORIGINAL_SESSION_KEY) ??
      sessionStorage.getItem(ORIGINAL_SESSION_KEY);
    if (!token || !original) return;
    try {
      const originalUser = JSON.parse(original) as SessionUser;
      localStorage.removeItem(ORIGINAL_TOKEN_KEY);
      localStorage.removeItem(ORIGINAL_SESSION_KEY);
      localStorage.removeItem("selected_tenant_id");
      sessionStorage.removeItem("selected_tenant_id");
      persistSession(token, originalUser);
    } catch {
      clearAuthenticationState();
      setUser(null);
    }
  }

  function logout(): void {
    clearAuthenticationState();
    setUser(null);
  }
  const value = useMemo(
    () => ({ user, login, logout, impersonate, stopImpersonation }),
    [user]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Returns the current authentication context. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
