import { CliTransport } from "./cli.js";
import { SquidForbiddenError, SquidValidationError } from "./errors.js";
import { HttpClient, keyKind, resolveApiKey, resolveEndpoint } from "./http.js";
import { McpTransport } from "./mcp.js";
import { FORBIDDEN_CAPABILITIES, SAFETY, SDK_NAME, SDK_VERSION, assertNotForbidden } from "./safety.js";
import type {
  AgentSummary,
  HoldItem,
  McpServerConfig,
  PaymentLinkSummary,
  ProposeActionInput,
  ProposalResult,
  SquidAgentWalletOptions,
  SquidTransport,
  WalletBalance,
  WorkspaceStatus
} from "./types.js";

function preferTransport(apiKey: string, requested: SquidTransport): "cli" | "mcp" {
  if (requested === "cli" || requested === "mcp") return requested;
  const kind = keyKind(apiKey);
  if (kind === "platform") return "cli";
  return "mcp";
}

/**
 * Squid Agent Wallet — typed client for AI agents and backends.
 *
 * Agents may read allowed context and propose payments/trades.
 * They cannot approve holds, sign, broadcast, or move money.
 */
export class SquidAgentWallet {
  readonly endpoint: string;
  readonly apiKey: string;
  readonly transport: "cli" | "mcp";
  readonly safety = SAFETY;
  readonly version = SDK_VERSION;

  private readonly http: HttpClient;
  private readonly cli: CliTransport;
  private readonly mcp: McpTransport;

  constructor(options: SquidAgentWalletOptions = {}) {
    const apiKey = resolveApiKey(options.apiKey);
    const endpoint = resolveEndpoint(options.endpoint);
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.transport = preferTransport(apiKey, options.transport || "auto");
    this.http = new HttpClient({
      endpoint,
      apiKey,
      fetchImpl: options.fetch || fetch,
      timeoutMs: options.timeoutMs ?? 30_000
    });
    this.cli = new CliTransport(this.http);
    this.mcp = new McpTransport(
      this.http,
      options.mcpPath || "/mcp",
      options.clientName || SDK_NAME,
      options.clientVersion || SDK_VERSION
    );
  }

  /** Cursor / Claude Desktop style MCP server config. */
  toMcpServerConfig(): McpServerConfig {
    return {
      mcpServers: {
        squid: {
          url: this.mcp.url,
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      }
    };
  }

  /** Low-level CLI argv execute (Platform / platform-access keys). */
  executeCli<T = unknown>(argv: string[]): Promise<T> {
    return this.cli.execute<T>(argv);
  }

  /** Low-level MCP tools/call. */
  callMcpTool<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
    return this.mcp.callTool<T>(name, args);
  }

  listMcpTools() {
    return this.mcp.listTools();
  }

  async getStatus(): Promise<WorkspaceStatus> {
    if (this.transport === "cli") return this.cli.status() as Promise<WorkspaceStatus>;
    const summary = (await this.mcp.getAccountSummary()) as Record<string, unknown>;
    return {
      authenticated: true,
      access: keyKind(this.apiKey) === "platform" ? "Platform API key" : "Agent API key",
      workspace: String(summary.accountMode || "Individual"),
      profile: (summary.profile as WorkspaceStatus["profile"]) || {},
      counts: {
        wallets: Array.isArray(summary.wallets) ? summary.wallets.length : 0,
        agents: Array.isArray(summary.agents) ? summary.agents.length : 0,
        heldActions: Number(summary.heldActions || 0)
      },
      safety: SAFETY.description,
      accountSummary: summary
    };
  }

  async listWallets(): Promise<WalletBalance[]> {
    if (this.transport === "cli") return (await this.cli.listWallets()) as WalletBalance[];
    return (await this.mcp.getWalletBalances()) as WalletBalance[];
  }

  async getBalances(): Promise<WalletBalance[]> {
    return this.listWallets();
  }

  async listHolds(): Promise<HoldItem[]> {
    if (this.transport === "cli") return (await this.cli.listHolds()) as HoldItem[];
    return (await this.mcp.listHolds()) as HoldItem[];
  }

  async getHold(id: string): Promise<HoldItem> {
    if (!id) throw new SquidValidationError("Hold id is required.", { code: "missing_hold_id" });
    if (this.transport === "cli") return (await this.cli.showHold(id)) as HoldItem;
    const holds = await this.listHolds();
    const hold = holds.find((item) => item.id === id);
    if (!hold) throw new SquidValidationError("That review hold was not found.", { code: "hold_not_found" });
    return hold;
  }

  async listAgents(): Promise<AgentSummary[]> {
    if (this.transport === "cli") return (await this.cli.listAgents()) as AgentSummary[];
    const state = (await this.mcp.getPlatformState()) as { agents?: AgentSummary[] };
    return state.agents || [];
  }

  async listRules(): Promise<unknown> {
    if (this.transport === "cli") return this.cli.listRules();
    return this.mcp.getAgentRules();
  }

  async listPaymentLinks(): Promise<PaymentLinkSummary[]> {
    if (this.transport === "cli") return (await this.cli.listPaymentLinks()) as PaymentLinkSummary[];
    const state = (await this.mcp.getPlatformState()) as { paymentLinks?: PaymentLinkSummary[] };
    return state.paymentLinks || [];
  }

  async getPaymentLink(id: string): Promise<PaymentLinkSummary> {
    if (!id) throw new SquidValidationError("Payment link id is required.", { code: "missing_payment_link_id" });
    if (this.transport === "cli") return (await this.cli.showPaymentLink(id)) as PaymentLinkSummary;
    const links = await this.listPaymentLinks();
    const link = links.find((item) => item.id === id);
    if (!link) throw new SquidValidationError("That payment link was not found.", { code: "payment_link_not_found" });
    return link;
  }

  async getFinancialHarness(): Promise<unknown> {
    return this.mcp.getFinancialHarness();
  }

  async getPlatformState(): Promise<unknown> {
    if (this.transport === "mcp") return this.mcp.getPlatformState();
    const [status, wallets, holds, agents, rules, paymentLinks, mcpInfo] = await Promise.all([
      this.cli.status(),
      this.cli.listWallets(),
      this.cli.listHolds(),
      this.cli.listAgents(),
      this.cli.listRules(),
      this.cli.listPaymentLinks(),
      this.cli.mcpInfo().catch(() => null)
    ]);
    return { status, wallets, holds, agents, rules, paymentLinks, mcp: mcpInfo };
  }

  async doctor(): Promise<unknown> {
    if (this.transport === "cli") return this.cli.doctor();
    const [tools, summary] = await Promise.all([this.mcp.listTools(), this.mcp.getAccountSummary()]);
    return {
      transport: "mcp",
      endpoint: this.endpoint,
      mcpUrl: this.mcp.url,
      tools: tools.map((tool) => tool.name),
      account: summary,
      safety: SAFETY
    };
  }

  /**
   * Propose a payment / trade / other action for human review.
   * Never signs or broadcasts. Returns a hold or ready_for_wallet proposal.
   */
  async proposeAction(input: ProposeActionInput): Promise<ProposalResult> {
    if (!input?.type) {
      throw new SquidValidationError("Propose requires a type (e.g. transfer).", { code: "missing_action_type" });
    }
    if (this.transport === "cli") return this.cli.proposeAction(input);
    return this.mcp.proposeAction(input);
  }

  /** Convenience wrapper for USDC/SOL/ETH style transfers. */
  proposePayment(input: Omit<ProposeActionInput, "type" | "domain"> & { type?: string }): Promise<ProposalResult> {
    return this.proposeAction({
      type: input.type || "transfer",
      domain: "payments",
      asset: input.asset || "USDC",
      amount: input.amount,
      recipient: input.recipient,
      chain: input.chain || "Base",
      note: input.note,
      idempotencyKey: input.idempotencyKey
    });
  }

  /** Convenience wrapper for trading proposals (still review-only). */
  proposeTrade(input: Omit<ProposeActionInput, "type" | "domain"> & { type?: string }): Promise<ProposalResult> {
    return this.proposeAction({
      type: input.type || "market_order",
      domain: "trading",
      asset: input.asset,
      amount: input.amount,
      recipient: input.recipient,
      chain: input.chain,
      note: input.note,
      idempotencyKey: input.idempotencyKey
    });
  }

  /**
   * Explicitly refuse unsafe capabilities so agents cannot accidentally call them.
   */
  approveHold(_id: string): never {
    assertNotForbidden("approve_hold");
    throw new SquidForbiddenError("Agents cannot approve holds.");
  }

  signTransaction(_payload: unknown): never {
    assertNotForbidden("sign_transaction");
    throw new SquidForbiddenError("Agents cannot sign transactions.");
  }

  exportPrivateKey(): never {
    assertNotForbidden("export_private_key");
    throw new SquidForbiddenError("Squid never exposes private keys or seed phrases.");
  }

  get forbiddenCapabilities(): readonly string[] {
    return FORBIDDEN_CAPABILITIES;
  }
}

export function createSquidAgentWallet(options?: SquidAgentWalletOptions): SquidAgentWallet {
  return new SquidAgentWallet(options);
}
