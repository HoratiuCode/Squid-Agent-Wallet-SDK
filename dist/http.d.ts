export type HttpClientOptions = {
    endpoint: string;
    apiKey: string;
    fetchImpl: typeof fetch;
    timeoutMs: number;
};
export declare function resolveApiKey(apiKey?: string): string;
export declare function resolveEndpoint(endpoint?: string): string;
export declare function keyKind(apiKey: string): "platform" | "agent" | "paid_grant" | "unknown";
export declare class HttpClient {
    readonly endpoint: string;
    readonly apiKey: string;
    private readonly fetchImpl;
    private readonly timeoutMs;
    constructor(options: HttpClientOptions);
    requestJson<T = unknown>(path: string, init?: {
        method?: string;
        body?: unknown;
        headers?: Record<string, string>;
    }): Promise<{
        status: number;
        headers: Headers;
        data: T;
    }>;
}
//# sourceMappingURL=http.d.ts.map