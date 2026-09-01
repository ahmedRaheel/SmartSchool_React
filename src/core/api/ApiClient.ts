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

// Request interceptor — real mode always uses the real JWT.
// X-Mock-* headers are never emitted when VITE_USE_MOCKS=false.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (!env.useMocks) {
    if (token && token.trim() !== "" && !token.startsWith("mock_")) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    delete config.headers["X-Mock-Role"];
    delete config.headers["X-Mock-UserId"];
    delete config.headers["X-Mock-TenantId"];
    delete config.headers["X-Mock-EntityId"];

    return config;
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
