import { SquidSdkError } from "./errors.js";
import type { HttpClient } from "./http.js";
import { SDK_NAME, SDK_VERSION } from "./safety.js";
import type { McpToolName, ProposeActionInput, ProposalResult } from "./types.js";

type JsonRpcId = string | number;
type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: unknown;
};
type JsonRpcResponse = {
  jsonrpc?: "2.0";
  id?: JsonRpcId | null;
  result?: unknown;
  error?: { code?: number; message?: string; data?: unknown };
};

function parseToolPayload(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const content = (result as { content?: Array<{ type?: string; text?: string }> }).content;
  if (!Array.isArray(content)) return result;
  const text = content
    .filter((part) => part?.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
  if (!text) return result;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isToolError(result: unknown): boolean {
  return Boolean(result && typeof result === "object" && (result as { isError?: boolean }).isError);
}

export class McpTransport {
  private nextId = 1;

  constructor(
    private readonly http: HttpClient,
    private readonly mcpPath: string,
    private readonly clientName: string,
    private readonly clientVersion: string
  ) {}

  get url(): string {
    return `${this.http.endpoint}${this.mcpPath}`;
  }

  private id(): number {
    return this.nextId++;
  }

  private async post(body: JsonRpcRequest | JsonRpcRequest[]): Promise<JsonRpcResponse | JsonRpcResponse[]> {
    const { status, data } = await this.http.requestJson<JsonRpcResponse | JsonRpcResponse[] | { message?: string; code?: string; type?: string }>(
      this.mcpPath,
      {
        method: "POST",
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json"
        },
        body
      }
    );

    if (status === 401 || status === 403) {
      throw SquidSdkError.fromResponse(status, data as Record<string, unknown>);
    }
    if (status >= 400) {
      if (data && typeof data === "object" && "error" in data && (data as JsonRpcResponse).error) {
        const err = (data as JsonRpcResponse).error!;
        throw new SquidSdkError(err.message || `MCP request failed (${status}).`, {
          code: "mcp_error",
          type: "mcp_error",
          status,
          context: { rpcCode: err.code, data: err.data }
        });
      }
      throw SquidSdkError.fromResponse(status, data as Record<string, unknown>);
    }
    return data as JsonRpcResponse | JsonRpcResponse[];
  }

  private unwrap(response: JsonRpcResponse | JsonRpcResponse[], expectedId?: JsonRpcId): unknown {
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
  async callTool<T = unknown>(name: McpToolName, args: Record<string, unknown> = {}): Promise<T> {
    const initId = this.id();
    const callId = this.id();
    const batch: JsonRpcRequest[] = [
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
      const message =
        typeof parsed === "string"
          ? parsed
          : parsed && typeof parsed === "object" && "message" in (parsed as object)
            ? String((parsed as { message: unknown }).message)
            : `MCP tool ${name} returned an error.`;
      throw new SquidSdkError(message, {
        code: "mcp_tool_error",
        type: "mcp_error",
        context: { tool: name, result: parsed }
      });
    }
    return parseToolPayload(result) as T;
  }

  async listTools(): Promise<Array<{ name: string; description?: string; title?: string }>> {
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
    const result = this.unwrap(response, listId) as { tools?: Array<{ name: string; description?: string; title?: string }> };
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

  async proposeAction(input: ProposeActionInput): Promise<ProposalResult> {
    const { idempotencyKey: _ignored, ...mcpInput } = input;
    const result = await this.callTool<ProposalResult | Record<string, unknown>>("propose_action", mcpInput);
    if (result && typeof result === "object" && "proposalId" in result) {
      return result as ProposalResult;
    }
    return {
      status: String((result as { status?: string })?.status || "unknown"),
      proposalId: String((result as { proposalId?: string })?.proposalId || ""),
      proposal: (result as { proposal?: Record<string, unknown> })?.proposal || (result as Record<string, unknown>),
      message: String((result as { message?: string })?.message || "Proposal submitted to Squid.")
    };
  }
}
