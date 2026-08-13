import { SquidSdkError } from "./errors.js";
import { SDK_NAME, SDK_VERSION } from "./safety.js";
function parseToolPayload(result) {
    if (!result || typeof result !== "object")
        return result;
    const content = result.content;
    if (!Array.isArray(content))
        return result;
    const text = content
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
        .trim();
    if (!text)
        return result;
    try {
        return JSON.parse(text);
    }
    catch {
        return text;
    }
}
function isToolError(result) {
    return Boolean(result && typeof result === "object" && result.isError);
}
export class McpTransport {
    http;
    mcpPath;
    clientName;
    clientVersion;
    nextId = 1;
    constructor(http, mcpPath, clientName, clientVersion) {
        this.http = http;
        this.mcpPath = mcpPath;
        this.clientName = clientName;
        this.clientVersion = clientVersion;
    }
    get url() {
        return `${this.http.endpoint}${this.mcpPath}`;
    }
    id() {
        return this.nextId++;
    }
    async post(body) {
        const { status, data } = await this.http.requestJson(this.mcpPath, {
            method: "POST",
            headers: {
                accept: "application/json, text/event-stream",
                "content-type": "application/json"
            },
            body
        });
        if (status === 401 || status === 403) {
            throw SquidSdkError.fromResponse(status, data);
        }
        if (status >= 400) {
            if (data && typeof data === "object" && "error" in data && data.error) {
                const err = data.error;
                throw new SquidSdkError(err.message || `MCP request failed (${status}).`, {
                    code: "mcp_error",
                    type: "mcp_error",
                    status,
                    context: { rpcCode: err.code, data: err.data }
                });
            }
            throw SquidSdkError.fromResponse(status, data);
        }
        return data;
    }
    unwrap(response, expectedId) {
        const item = Array.isArray(response)
            ? response.find((entry) => entry && entry.id === expectedId) || response[response.length - 1]
            : response;
        if (!item) {
            throw new SquidSdkError("Empty MCP response.", { code: "mcp_empty_response", type: "mcp_error" });
        }
        if (item.error) {
            throw new SquidSdkError(item.error.message || "MCP tool failed.", {
                code: "mcp_rpc_error",
                type: "mcp_error",
                context: { rpcCode: item.error.code, data: item.error.data }
            });
        }
        return item.result;
    }
    /**
     * Squid creates a fresh MCP server per HTTP request (stateless Streamable HTTP).
     * Send initialize + notifications/initialized + tools/call as one JSON-RPC batch.
     */
    async callTool(name, args = {}) {
        const initId = this.id();
        const callId = this.id();
        const batch = [
            {
                jsonrpc: "2.0",
                id: initId,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: {
                        name: this.clientName || SDK_NAME,
                        version: this.clientVersion || SDK_VERSION
                    }
                }
            },
            {
                jsonrpc: "2.0",
                method: "notifications/initialized"
            },
            {
                jsonrpc: "2.0",
                id: callId,
                method: "tools/call",
                params: { name, arguments: args }
            }
        ];
        const response = await this.post(batch);
        const result = this.unwrap(response, callId);
        if (isToolError(result)) {
            const parsed = parseToolPayload(result);
            const message = typeof parsed === "string"
                ? parsed
                : parsed && typeof parsed === "object" && "message" in parsed
                    ? String(parsed.message)
                    : `MCP tool ${name} returned an error.`;
            throw new SquidSdkError(message, {
                code: "mcp_tool_error",
                type: "mcp_error",
                context: { tool: name, result: parsed }
            });
        }
        return parseToolPayload(result);
    }
    async listTools() {
        const initId = this.id();
        const listId = this.id();
        const response = await this.post([
            {
                jsonrpc: "2.0",
                id: initId,
                method: "initialize",
                params: {
                    protocolVersion: "2024-11-05",
                    capabilities: {},
                    clientInfo: { name: this.clientName || SDK_NAME, version: this.clientVersion || SDK_VERSION }
                }
            },
            { jsonrpc: "2.0", method: "notifications/initialized" },
            { jsonrpc: "2.0", id: listId, method: "tools/list" }
        ]);
        const result = this.unwrap(response, listId);
        return result?.tools || [];
    }
    getAccountSummary() {
        return this.callTool("get_account_summary");
    }
    getWalletBalances() {
        return this.callTool("get_wallet_balances");
    }
    getFinancialHarness() {
        return this.callTool("get_financial_harness");
    }
    listHolds() {
        return this.callTool("list_holds");
    }
    getAgentRules() {
        return this.callTool("get_agent_rules");
    }
    getPlatformState() {
        return this.callTool("get_platform_state");
    }
    async proposeAction(input) {
        const { idempotencyKey: _ignored, ...mcpInput } = input;
        const result = await this.callTool("propose_action", mcpInput);
        if (result && typeof result === "object" && "proposalId" in result) {
            return result;
        }
        return {
            status: String(result?.status || "unknown"),
            proposalId: String(result?.proposalId || ""),
            proposal: result?.proposal || result,
            message: String(result?.message || "Proposal submitted to Squid.")
        };
    }
}
//# sourceMappingURL=mcp.js.map