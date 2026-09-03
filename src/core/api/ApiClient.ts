/**
 * SmartSchool API Client
 * - Attaches JWT Bearer token on every request
 * - Proactively checks token expiry before each request
 * - On 401 response → clears all auth state, fires event, redirects to /login
 * - On network error → re-throws for React Query to surface
 */
import axios from "axios";
import { env } from "../../config/env";

/** Interface implemented by both the real HttpApiClient and MockApiClient. */
export interface ApiClient {
  get<T>(url: string, config?: object): Promise<T>;
  post<A, B>(url: string, body: A, config?: object): Promise<B>;
  put<A, B>(url: string, body: A, config?: object): Promise<B>;
  delete<T>(url: string): Promise<T>;
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/** Decode a JWT and return its payload without verifying the signature. */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Return true if the token is expired (or will expire in <30 s). */
function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return false; // mock tokens have no exp
  return payload.exp * 1000 < Date.now() + 30_000; // 30 s buffer
}

/** Wipe every auth key from both storage backends and redirect to /login. */
function forceLogout(reason: "expired" | "unauthorized"): void {
  const AUTH_KEYS = [
    "access_token", "refresh_token", "id_token",
    "smartschool.session", "tenant_id", "selected_tenant_id",
    "impersonation_token", "impersonated_user", "impersonator_sub",
    "smartschool.original_access_token", "smartschool.original_session",
  ];
  AUTH_KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });

  // Fire event so React state also clears (AuthProvider listens)
  window.dispatchEvent(new CustomEvent("smartschool:session-ended", { detail: { reason } }));

  // Redirect — preserve current path so we can restore after re-login
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  const loginUrl = returnTo === "%2F" || returnTo === "%2Flogin"
    ? "/login"
    : `/login?returnTo=${returnTo}`;

  // Use replace so the back button doesn't go back to a broken authenticated page
  window.location.replace(loginUrl);
}

// ── Request interceptor ────────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token && !token.startsWith("mock_")) {
    // Proactive expiry check — catch it before the server does
    if (isTokenExpired(token)) {
      forceLogout("expired");
      // Abort the request by returning a never-resolving promise
      return new Promise(() => {});
    }
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Mock-mode headers — backend reads these to simulate the actor
    try {
      const raw = localStorage.getItem("smartschool.session");
      if (raw) {
        const s = JSON.parse(raw);
        config.headers["X-Mock-Role"]     = s.role     ?? "SchoolAdmin";
        config.headers["X-Mock-UserId"]   = s.id       ?? "00000000-0000-0000-0000-000000000001";
        config.headers["X-Mock-TenantId"] = s.tenantId ?? "11111111-1111-1111-1111-111111111111";
        const entityId = s.employeeId ?? s.studentId ?? s.driverId ?? s.businessEntityId;
        if (entityId) config.headers["X-Mock-EntityId"] = entityId;
      }
    } catch { /* silently ignore */ }
  }

  return config;
});

// ── Response interceptor ───────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => {
    // SmartSchool backend uses Result<T>. Unwrap it once globally so every
    // screen receives the same contract in mock and real-API modes.
    const payload = res.data as any;
    if (payload && typeof payload === "object" && "isSuccess" in payload && "value" in payload) {
      if (payload.isSuccess === false) {
        const message = payload?.error?.message ?? "The request could not be completed.";
        window.dispatchEvent(new CustomEvent("smartschool:api-error", { detail: { message, error: payload?.error } }));
        return Promise.reject(new Error(message));
      }
      res.data = payload.value;
    }

    const method = String(res.config.method ?? "get").toLowerCase();
    if (["post", "put", "patch", "delete"].includes(method)) {
      const message = method === "delete" ? "Deleted successfully." : "Saved successfully.";
      window.dispatchEvent(new CustomEvent("smartschool:api-success", { detail: { message } }));
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;

    if (status === 401) {
      // Token was rejected by the server (expired, revoked, or tampered)
      forceLogout("unauthorized");
      return new Promise(() => {}); // swallow — page is being replaced
    }

    // Surface validation/business/server errors globally. Do not convert a
    // failed request into an empty collection; empty-state UI is only for a
    // successful API response containing zero rows.
    const payload = err.response?.data;
    const validation = payload?.error?.errors ?? payload?.errors;
    let message = payload?.error?.message ?? payload?.title ?? err.message ?? "The request could not be completed.";
    if (validation && typeof validation === "object") {
      const details = Object.entries(validation)
        .flatMap(([field, messages]) => (Array.isArray(messages) ? messages : [messages]).map(x => `${field}: ${String(x)}`))
        .join(" • ");
      if (details) message = details;
    }
    window.dispatchEvent(new CustomEvent("smartschool:api-error", { detail: { message, error: payload?.error ?? payload } }));
    return Promise.reject(err);
  }
);
