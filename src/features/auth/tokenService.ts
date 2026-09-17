import axios from "axios";
import { env } from "../../config/env";

let refreshPromise: Promise<string | null> | null = null;

function identityUrl(path: string): string {
  return `${env.identityBaseUrl}${path}`;
}

/** Refreshes the current access token through the Identity host without exposing a client secret. */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken || env.useMocks) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { data } = await axios.post(
        identityUrl("/api/account/refresh"),
        { refreshToken },
        { headers: { "Content-Type": "application/json" }, timeout: 30_000 },
      );

      const accessToken = data?.access_token ?? data?.accessToken;
      const rotatedRefreshToken = data?.refresh_token ?? data?.refreshToken;
      if (!accessToken) return null;

      localStorage.setItem("access_token", accessToken);
      if (rotatedRefreshToken) localStorage.setItem("refresh_token", rotatedRefreshToken);
      return String(accessToken);
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
