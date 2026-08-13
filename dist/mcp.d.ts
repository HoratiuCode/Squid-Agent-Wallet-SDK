import type { HttpClient } from "./http.js";
import type { McpToolName, ProposeActionInput, ProposalResult } from "./types.js";
export declare class McpTransport {
    private readonly http;
    private readonly mcpPath;
    private readonly clientName;
    private readonly clientVersion;
    private nextId;
    constructor(http: HttpClient, mcpPath: string, clientName: string, clientVersion: string);
    get url(): string;
    private id;
    private post;
    private unwrap;
    /**
     * Squid creates a fresh MCP server per HTTP request (stateless Streamable HTTP).
     * Send initialize + notifications/initialized + tools/call as one JSON-RPC batch.
     */
    callTool<T = unknown>(name: McpToolName, args?: Record<string, unknown>): Promise<T>;
    listTools(): Promise<Array<{
        name: string;
        description?: string;
        title?: string;
    }>>;
    getAccountSummary(): Promise<unknown>;
    getWalletBalances(): Promise<unknown>;
    getFinancialHarness(): Promise<unknown>;
    listHolds(): Promise<unknown>;
    getAgentRules(): Promise<unknown>;
    getPlatformState(): Promise<unknown>;
    proposeAction(input: ProposeActionInput): Promise<ProposalResult>;
}
//# sourceMappingURL=mcp.d.ts.map