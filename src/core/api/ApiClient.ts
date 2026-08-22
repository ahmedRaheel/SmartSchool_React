import axios, { AxiosError } from "axios";
import { env } from "../../config/env";

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
  (error: AxiosError<Result<unknown>>) => {
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
