export const env = {
  useMocks:      (import.meta.env.VITE_USE_MOCKS ?? "true") === "true",
  apiBaseUrl:    import.meta.env.VITE_API_BASE_URL     ?? "http://localhost:7001",
  identityBaseUrl: import.meta.env.VITE_IDENTITY_BASE_URL ?? "http://localhost:7101",
  tenantId:      import.meta.env.VITE_TENANT_ID        ?? "11111111-1111-1111-1111-111111111111",
};
