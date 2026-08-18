import axios from "axios";
import { env } from "../../config/env";

export const http = axios.create({
    baseURL: env.apiBaseUrl,
    timeout: 15_000,
});

http.interceptors.request.use((config) => {
    const accessToken = sessionStorage.getItem("access_token");
    const tenantId = sessionStorage.getItem("tenant_id");

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (tenantId) {
        config.headers["X-Tenant-ID"] = tenantId;
    }

    config.headers["X-Correlation-ID"] = crypto.randomUUID();

    return config;
});
