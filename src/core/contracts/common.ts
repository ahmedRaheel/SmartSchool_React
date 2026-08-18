export type ApiResult<T> = {
    value: T;
    isSuccess: boolean;
    error?: {
        code: string;
        message: string;
    };
};
export type Page<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
};

