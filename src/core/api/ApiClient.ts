import axios, { AxiosError } from "axios";
import { env } from "../../config/env";

export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  traceId: string;
  timestampUtc: string;
};

export class SmartSchoolApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly traceId?: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SmartSchoolApiError";
  }
}

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers.Accept = "application/json";
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>;

    if (body && typeof body === "object" && "success" in body) {
      if (!body.success) {
        throw new SmartSchoolApiError(
          body.error?.code ?? "request_failed",
          body.error?.message ?? "The request failed.",
          body.traceId,
          response.status,
        );
      }

      response.data = body.data;
    }

    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const body = error.response?.data;

    if (body && typeof body === "object" && "success" in body) {
      return Promise.reject(
        new SmartSchoolApiError(
          body.error?.code ?? "request_failed",
          body.error?.message ?? error.message,
          body.traceId,
          error.response?.status,
        ),
      );
    }

    return Promise.reject(error);
  },
);
