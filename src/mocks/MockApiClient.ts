import type { ApiClient } from '../core/api/ApiClient';
import { dashboard, students } from './data';
export class MockApiClient implements ApiClient {
    async get<T>(u: string) { if (u.includes('dashboard'))
        return dashboard as T; if (u.includes('students'))
        return students as T; return [] as T; }
    async post<A, B>(_u: string, b: A) { return b as unknown as B; }
    async put<A, B>(_u: string, b: A) { return b as unknown as B; }
    async delete<T>(_u: string) { return true as T; }
}

