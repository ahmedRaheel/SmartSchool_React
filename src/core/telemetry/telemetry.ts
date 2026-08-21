import axios from "axios";
import { env } from "../../config/env";

export interface UiError {
  message: string;
  stack?: string;
  component?: string;
  traceId?: string;
  correlationId?: string;
  context?: Record<string, string | null | undefined>;
}

const recentErrors: UiError[] = [];

export function getRecentUiErrors(): readonly UiError[] {
  return recentErrors;
}

export async function reportUiError(error: UiError): Promise<void> {
  recentErrors.unshift(error);
  if (recentErrors.length > 20) recentErrors.length = 20;

  try {
    await axios.post(`${env.identityBaseUrl}/api/telemetry/ui-errors`, {
      ...error,
      url: window.location.href,
    }, { timeout: 5000 });
  } catch {
    // Telemetry must never break the user flow.
  }
}

export function captureApiError(error: any, component?: string): UiError {
  const traceId = error?.response?.headers?.["x-trace-id"];
  const correlationId = error?.response?.headers?.["x-correlation-id"];
  const item: UiError = {
    message: error?.response?.data?.detail ?? error?.message ?? "Unexpected error",
    stack: error?.stack,
    component,
    traceId,
    correlationId,
  };
  void reportUiError(item);
  return item;
}

export function installGlobalErrorTelemetry(): void {
  window.addEventListener("error", event => {
    void reportUiError({
      message: event.message || "Unhandled browser error",
      stack: event.error?.stack,
      component: "window.error",
    });
  });

  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason;
    void reportUiError({
      message: reason?.message ?? String(reason ?? "Unhandled promise rejection"),
      stack: reason?.stack,
      component: "unhandledrejection",
    });
  });
}
