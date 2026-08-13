import { SquidAuthError, SquidSdkError, SquidValidationError } from "./errors.js";
function normalizeEndpoint(endpoint) {
    return String(endpoint || "").trim().replace(/\/$/, "");
}
export function resolveApiKey(apiKey) {
    const value = String(apiKey || process.env.SQUID_API_KEY || "").trim();
    if (!value) {
        throw new SquidAuthError("Missing Squid API key. Pass apiKey or set SQUID_API_KEY (Platform key sq_master_… or agent key sq_live_…).", { code: "missing_api_key" });
    }
    return value;
}
export function resolveEndpoint(endpoint) {
    const value = normalizeEndpoint(endpoint || process.env.SQUID_ENDPOINT || "http://localhost:4173");
    try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error("invalid protocol");
        }
        return url.origin;
    }
    catch {
        throw new SquidValidationError(`Invalid Squid endpoint: ${value}`, { code: "invalid_endpoint" });
    }
}
export function keyKind(apiKey) {
    if (apiKey.startsWith("sq_master_"))
        return "platform";
    if (apiKey.startsWith("sq_live_"))
        return "agent";
    if (apiKey.startsWith("sq_grant_") || apiKey.length >= 24)
        return "paid_grant";
    return "unknown";
}
export class HttpClient {
    endpoint;
    apiKey;
    fetchImpl;
    timeoutMs;
    constructor(options) {
        this.endpoint = options.endpoint;
        this.apiKey = options.apiKey;
        this.fetchImpl = options.fetchImpl;
        this.timeoutMs = options.timeoutMs;
    }
    async requestJson(path, init = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(`${this.endpoint}${path}`, {
                method: init.method || "GET",
                headers: {
                    accept: "application/json",
                    authorization: `Bearer ${this.apiKey}`,
                    ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
                    ...(init.headers || {})
                },
                body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
                signal: controller.signal
            });
            const data = (await response.json().catch(() => ({})));
            return { status: response.status, headers: response.headers, data };
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                throw new SquidSdkError(`Squid request timed out after ${this.timeoutMs}ms.`, {
                    code: "request_timeout",
                    type: "network_error"
                });
            }
            throw new SquidSdkError(error instanceof Error ? error.message : "Squid network request failed.", {
                code: "network_error",
                type: "network_error",
                cause: error
            });
        }
        finally {
            clearTimeout(timer);
        }
    }
}
//# sourceMappingURL=http.js.map