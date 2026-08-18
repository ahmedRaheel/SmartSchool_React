import type { ApiClient } from "./ApiClient";
import { http } from "./httpClient";

export class HttpApiClient implements ApiClient {
    async get<TResponse>(url: string): Promise<TResponse> {
        const response = await http.get<TResponse>(url);
        return response.data;
    }

    async post<TRequest, TResponse>(
        url: string,
        body: TRequest,
    ): Promise<TResponse> {
        const response = await http.post<TResponse>(url, body);
        return response.data;
    }

    async put<TRequest, TResponse>(
        url: string,
        body: TRequest,
    ): Promise<TResponse> {
        const response = await http.put<TResponse>(url, body);
        return response.data;
    }

    async delete<TResponse>(url: string): Promise<TResponse> {
        const response = await http.delete<TResponse>(url);
        return response.data;
    }
}
