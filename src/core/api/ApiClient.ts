export interface ApiClient {
    get<TResponse>(url: string): Promise<TResponse>;

    post<TRequest, TResponse>(
        url: string,
        body: TRequest,
    ): Promise<TResponse>;

    put<TRequest, TResponse>(
        url: string,
        body: TRequest,
    ): Promise<TResponse>;

    delete<TResponse>(url: string): Promise<TResponse>;
}
