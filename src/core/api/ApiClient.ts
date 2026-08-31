/**
 * SmartSchool API Client
 * Sends mock auth headers when VITE_USE_MOCKS=false but using mock backend.
 * When VITE_USE_MOCKS=true, all calls go through apiAdapter mocks (never hits network).
 * When VITE_USE_MOCKS=false, sends JWT Bearer token (or mock headers in dev).
 */
import axios from "axios";
import { env } from "../../config/env";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor — attach JWT or mock headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token && token !== "" && !token.startsWith("mock_")) {
    // Real JWT
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Mock mode headers — backend reads these to simulate the actor
    try {
      const sessionRaw = localStorage.getItem("smartschool.session");
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        config.headers["X-Mock-Role"]     = session.role ?? "SchoolAdmin";
        config.headers["X-Mock-UserId"]   = session.id ?? "00000000-0000-0000-0000-000000000001";
        config.headers["X-Mock-TenantId"] = session.tenantId ?? "11111111-1111-1111-1111-111111111111";
        // Actor-specific entity ID
        const entityId = session.employeeId ?? session.studentId ?? session.driverId ?? session.businessEntityId;
        if (entityId) config.headers["X-Mock-EntityId"] = entityId;
      }
    } catch { /* silently ignore parse errors */ }
  }
  return config;
});

// Response interceptor — handle 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Fire event — AppShell listens and redirects to login
      window.dispatchEvent(new Event("smartschool:unauthorized"));
    }
    return Promise.reject(err);
  }
);
