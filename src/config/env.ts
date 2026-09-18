// Environment configuration. Production builds fail fast when service URLs are missing.
const viteEnv = (import.meta as any).env ?? {};
const isProduction = viteEnv.PROD === true || viteEnv.MODE === "production";

function requiredUrl(name: string, fallback: string): string {
  const value = String(viteEnv[name] ?? fallback).trim();
  if (isProduction) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${name} must be a valid absolute URL for production.`);
    }

    if (url.protocol !== "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      throw new Error(`${name} must be configured with a deployed HTTPS service URL for production.`);
    }
  }
  return value.replace(/\/$/, "");
}

export const env = {
  useMocks: String(viteEnv.VITE_USE_MOCKS ?? "false") === "true",
  apiBaseUrl: requiredUrl("VITE_API_BASE_URL", "http://localhost:61342"),
  identityBaseUrl: requiredUrl("VITE_IDENTITY_BASE_URL", "http://localhost:7101"),
  tenantId: String(viteEnv.VITE_TENANT_ID ?? "").trim(),
};

if (isProduction && env.useMocks) {
  throw new Error("VITE_USE_MOCKS cannot be enabled in a production build.");
}
