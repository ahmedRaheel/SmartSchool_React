import axios, { AxiosError } from "axios";
import { env } from "../../config/env";
import { clearAuthenticationState } from "../../features/auth/auth";
import { validateContactPayload } from "../validation/contactInformation";

export type ApiError = {
  code: string;
  message: string;
};

export type Result<T> = {
  isSuccess: boolean;
  isFailure: boolean;
  error: ApiError;
  value?: T | null;
};

export class SmartSchoolApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SmartSchoolApiError";
  }
}

let pendingRequests = 0;
function publishBusy(delta: number) { pendingRequests = Math.max(0, pendingRequests + delta); window.dispatchEvent(new CustomEvent("smartschool:api-busy", { detail: pendingRequests > 0 })); }

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (config.data && !(config.data instanceof FormData)) {
    validateContactPayload(config.data);
  }

  publishBusy(1);
  const token = localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  config.headers.Accept = "application/json";
  return config;
});

api.interceptors.response.use(
  (response) => {
    publishBusy(-1);
    const result = response.data as Result<unknown>;

    if (result && typeof result === "object" && "isSuccess" in result) {
      if (!result.isSuccess) {
        throw new SmartSchoolApiError(
          result.error?.code ?? "REQUEST_FAILED",
          result.error?.message ?? "The request could not be completed.",
          response.status,
        );
      }

      response.data = result.value ?? null;
    }

    return response;
  },
  async (error: AxiosError<Result<unknown>>) => {
    publishBusy(-1);
    const originalRequest = error.config as (typeof error.config & { _smartSchoolRetried?: boolean });

    if (error.response?.status === 401 && originalRequest && !originalRequest._smartSchoolRetried) {
      const refreshToken = localStorage.getItem("refresh_token") ?? sessionStorage.getItem("refresh_token");
      if (refreshToken) {
        originalRequest._smartSchoolRetried = true;
        try {
          const tokenUrl = import.meta.env.DEV ? "/identity/connect/token" : `${env.identityBaseUrl}/connect/token`;
          const body = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: "smartschool-login-api",
            refresh_token: refreshToken,
          });
          const refreshResponse = await axios.post(tokenUrl, body.toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
            timeout: 30_000,
          });
          const accessToken = refreshResponse.data?.access_token;
          if (accessToken) {
            localStorage.setItem("access_token", accessToken);
            if (refreshResponse.data?.refresh_token) localStorage.setItem("refresh_token", refreshResponse.data.refresh_token);
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api.request(originalRequest);
          }
        } catch {
          // Refresh really failed; only now end the persisted login session.
        }
      }
      clearAuthenticationState();
      window.dispatchEvent(new CustomEvent("smartschool:unauthorized"));
    }

    const result = error.response?.data;

    if (result && typeof result === "object" && "isSuccess" in result) {
      return Promise.reject(
        new SmartSchoolApiError(
          result.error?.code ?? "REQUEST_FAILED",
          result.error?.message ?? error.message,
          error.response?.status,
        ),
      );
    }

    return Promise.reject(error);
  },
);
