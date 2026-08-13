export type SquidTransport = "auto" | "cli" | "mcp";

export type ActionDomain = "payments" | "trading" | "investing" | "contracts";

export type ProposeActionInput = {
  /** Action type such as `transfer` or `market_order`. */
  type: string;
  domain?: ActionDomain;
  asset?: string;
  amount?: number;
  recipient?: string;
  chain?: string;
  note?: string;
  /** Optional idempotency key for CLI/platform proposals. */
  idempotencyKey?: string;
};

export type HoldStatus = "held" | "ready_for_wallet" | "approved" | "rejected" | string;

export type ProposalResult = {
  status: HoldStatus;
  proposalId: string;
  proposal: Record<string, unknown>;
  idempotent?: boolean;
  message: string;
};

export type WalletBalance = {
  id?: string;
  address: string;
  chain?: string;
  source?: string;
  balance?: number | string | null;
  assets?: unknown;
  syncStatus?: string;
  lastSync?: string;
};

export type HoldItem = {
  id: string;
  actionType?: string;
  asset?: string;
  amount?: number;
  recipient?: string;
  chain?: string;
  status: string;
  reason?: string;
  sourceAgent?: string;
  timestamp?: string;
  intentId?: string;
  intentHash?: string;
  [key: string]: unknown;
};

export type AgentSummary = {
  id: string;
  name: string;
  type?: string;
  status?: string;
  permissions?: string[];
  policy?: Record<string, unknown>;
  usage?: Record<string, unknown>;
  lastActivity?: string;
};

export type PaymentLinkSummary = {
  id: string;
  label?: string;
  description?: string;
  status?: string;
  amount?: number | string;
  asset?: string;
  protocol?: string;
  network?: string;
  url?: string;
  receipt?: unknown;
  [key: string]: unknown;
};

export type WorkspaceStatus = {
  authenticated: boolean;
  version?: string;
  access?: string;
  workspace?: string;
  profile?: { name?: string; email?: string };
  masterKey?: { status?: string; preview?: string };
  counts?: {
    wallets?: number;
    agents?: number;
    heldActions?: number;
    paymentLinks?: number;
  };
  safety?: string;
  [key: string]: unknown;
};

export type McpToolName =
  | "get_account_summary"
  | "get_wallet_balances"
  | "get_financial_harness"
  | "list_holds"
  | "get_agent_rules"
  | "get_platform_state"
  | "propose_action"
  | "get_paid_resource"
  | "get_payment_receipt"
  | (string & {});

export type SquidAgentWalletOptions = {
  /** Squid origin, e.g. http://localhost:4173 */
  endpoint?: string;
  /**
   * Platform API key (`sq_master_…`) or agent key (`sq_live_…`).
   * Prefer env `SQUID_API_KEY` when omitted.
   */
  apiKey?: string;
  /**
   * auto — Platform keys use CLI HTTP; agent keys use MCP.
   * cli — POST /api/cli/execute (requires platform access).
   * mcp — POST /mcp Streamable HTTP tools.
   */
  transport?: SquidTransport;
  /** Override MCP path (default /mcp). Use /mcp/paid for x402 grants. */
  mcpPath?: string;
  /** Optional fetch implementation (tests / edge runtimes). */
  fetch?: typeof fetch;
  /** Request timeout in ms (default 30_000). */
  timeoutMs?: number;
  /** Client name reported to MCP initialize. */
  clientName?: string;
  /** Client version reported to MCP initialize. */
  clientVersion?: string;
};

export type McpServerConfig = {
  mcpServers: {
    squid: {
      url: string;
      headers: { Authorization: string };
    };
  };
};

export type StructuredSquidErrorBody = {
  status?: string;
  type?: string;
  code?: string;
  message?: string;
  context?: Record<string, unknown>;
};
