// Environment configuration
// Vite exposes env vars on import.meta.env — types declared in vite-env.d.ts
export const env = {
  useMocks:       ((import.meta as any).env?.VITE_USE_MOCKS ?? "true") === "true",
  apiBaseUrl:     (import.meta as any).env?.VITE_API_BASE_URL     ?? "http://localhost:7001",
  identityBaseUrl:(import.meta as any).env?.VITE_IDENTITY_BASE_URL ?? "http://localhost:7101",
  tenantId:       (import.meta as any).env?.VITE_TENANT_ID        ?? "11111111-1111-1111-1111-111111111111",
};
