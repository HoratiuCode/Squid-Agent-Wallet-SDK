import type { StructuredSquidErrorBody } from "./types.js";
export declare class SquidSdkError extends Error {
    readonly code: string;
    readonly type: string;
    readonly status: number | null;
    readonly context: Record<string, unknown>;
    constructor(message: string, options?: {
        code?: string;
        type?: string;
        status?: number | null;
        context?: Record<string, unknown>;
        cause?: unknown;
    });
    static fromResponse(status: number, body: StructuredSquidErrorBody | Record<string, unknown>): SquidSdkError;
}
export declare class SquidAuthError extends SquidSdkError {
    constructor(message: string, options?: {
        code?: string;
        status?: number | null;
        context?: Record<string, unknown>;
    });
}
export declare class SquidValidationError extends SquidSdkError {
    constructor(message: string, options?: {
        code?: string;
        context?: Record<string, unknown>;
    });
}
export declare class SquidForbiddenError extends SquidSdkError {
    constructor(message: string, options?: {
        code?: string;
        context?: Record<string, unknown>;
    });
}
//# sourceMappingURL=errors.d.ts.map