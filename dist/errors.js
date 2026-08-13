export class SquidSdkError extends Error {
    code;
    type;
    status;
    context;
    constructor(message, options = {}) {
        super(message, options.cause !== undefined ? { cause: options.cause } : undefined);
        this.name = "SquidSdkError";
        this.code = options.code || "squid_sdk_error";
        this.type = options.type || "sdk_error";
        this.status = options.status ?? null;
        this.context = options.context || {};
    }
    static fromResponse(status, body) {
        const message = (typeof body.message === "string" && body.message) ||
            `Squid request failed (${status}).`;
        return new SquidSdkError(message, {
            code: typeof body.code === "string" ? body.code : "http_error",
            type: typeof body.type === "string" ? body.type : "http_error",
            status,
            context: typeof body.context === "object" && body.context ? body.context : { body }
        });
    }
}
export class SquidAuthError extends SquidSdkError {
    constructor(message, options = {}) {
        super(message, { ...options, type: "authentication_error", code: options.code || "authentication_error" });
        this.name = "SquidAuthError";
    }
}
export class SquidValidationError extends SquidSdkError {
    constructor(message, options = {}) {
        super(message, { ...options, type: "validation_error", code: options.code || "validation_error" });
        this.name = "SquidValidationError";
    }
}
export class SquidForbiddenError extends SquidSdkError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            type: "authorization_error",
            code: options.code || "capability_forbidden",
            status: 403
        });
        this.name = "SquidForbiddenError";
    }
}
//# sourceMappingURL=errors.js.map