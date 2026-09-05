import axios from "axios";


/** Converts API, OAuth and network failures into a user-friendly message. */
export function getErrorMessage(error: unknown, fallback = "The request could not be completed."): string {
  if (error instanceof Error) return error.message;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    const value = data?.detail ?? data?.title ?? data?.message ?? data?.error_description ?? data?.error;
    if (value) return String(value);
    if (!error.response) return "The SmartSchool service could not be reached. Check that the backend is running.";
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
