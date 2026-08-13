import type { StructuredSquidErrorBody } from "./types.js";

export class SquidSdkError extends Error {
  readonly code: string;
  readonly type: string;
  readonly status: number | null;
  readonly context: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      type?: string;
      status?: number | null;
      context?: Record<string, unknown>;
      cause?: unknown;
    } = {}
  ) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = "SquidSdkError";
    this.code = options.code || "squid_sdk_error";
    this.type = options.type || "sdk_error";
    this.status = options.status ?? null;
    this.context = options.context || {};
  }

  static fromResponse(status: number, body: StructuredSquidErrorBody | Record<string, unknown>): SquidSdkError {
    const message =
      (typeof body.message === "string" && body.message) ||
      `Squid request failed (${status}).`;
    return new SquidSdkError(message, {
      code: typeof body.code === "string" ? body.code : "http_error",
      type: typeof body.type === "string" ? body.type : "http_error",
      status,
      context: typeof body.context === "object" && body.context ? (body.context as Record<string, unknown>) : { body }
    });
  }
}

export class SquidAuthError extends SquidSdkError {
  constructor(message: string, options: { code?: string; status?: number | null; context?: Record<string, unknown> } = {}) {
    super(message, { ...options, type: "authentication_error", code: options.code || "authentication_error" });
    this.name = "SquidAuthError";
  }
}

export class SquidValidationError extends SquidSdkError {
  constructor(message: string, options: { code?: string; context?: Record<string, unknown> } = {}) {
    super(message, { ...options, type: "validation_error", code: options.code || "validation_error" });
    this.name = "SquidValidationError";
  }
}

export class SquidForbiddenError extends SquidSdkError {
  constructor(message: string, options: { code?: string; context?: Record<string, unknown> } = {}) {
    super(message, {
      ...options,
      type: "authorization_error",
      code: options.code || "capability_forbidden",
      status: 403
    });
    this.name = "SquidForbiddenError";
  }
}
