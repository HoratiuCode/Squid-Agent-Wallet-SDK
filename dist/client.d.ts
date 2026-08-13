import type { AgentSummary, HoldItem, McpServerConfig, PaymentLinkSummary, ProposeActionInput, ProposalResult, SquidAgentWalletOptions, WalletBalance, WorkspaceStatus } from "./types.js";
/**
 * Squid Agent Wallet — typed client for AI agents and backends.
 *
 * Agents may read allowed context and propose payments/trades.
 * They cannot approve holds, sign, broadcast, or move money.
 */
export declare class SquidAgentWallet {
    readonly endpoint: string;
    readonly apiKey: string;
    readonly transport: "cli" | "mcp";
    readonly safety: {
        readonly canReadContext: true;
        readonly canProposeActions: true;
        readonly canApproveHolds: false;
        readonly canSignTransactions: false;
        readonly canBroadcastTransactions: false;
        readonly canAccessPrivateKeys: false;
        readonly canMoveMoney: false;
        readonly description: "Agents propose. Squid Brain / policy may HOLD or BLOCK. Humans review. Owner wallets sign.";
    };
    readonly version = "0.1.0";
    private readonly http;
    private readonly cli;
    private readonly mcp;
    constructor(options?: SquidAgentWalletOptions);
    /** Cursor / Claude Desktop style MCP server config. */
    toMcpServerConfig(): McpServerConfig;
    /** Low-level CLI argv execute (Platform / platform-access keys). */
    executeCli<T = unknown>(argv: string[]): Promise<T>;
    /** Low-level MCP tools/call. */
    callMcpTool<T = unknown>(name: string, args?: Record<string, unknown>): Promise<T>;
    listMcpTools(): Promise<{
        name: string;
        description?: string;
        title?: string;
    }[]>;
    getStatus(): Promise<WorkspaceStatus>;
    listWallets(): Promise<WalletBalance[]>;
    getBalances(): Promise<WalletBalance[]>;
    listHolds(): Promise<HoldItem[]>;
    getHold(id: string): Promise<HoldItem>;
    listAgents(): Promise<AgentSummary[]>;
    listRules(): Promise<unknown>;
    listPaymentLinks(): Promise<PaymentLinkSummary[]>;
    getPaymentLink(id: string): Promise<PaymentLinkSummary>;
    getFinancialHarness(): Promise<unknown>;
    getPlatformState(): Promise<unknown>;
    doctor(): Promise<unknown>;
    /**
     * Propose a payment / trade / other action for human review.
     * Never signs or broadcasts. Returns a hold or ready_for_wallet proposal.
     */
    proposeAction(input: ProposeActionInput): Promise<ProposalResult>;
    /** Convenience wrapper for USDC/SOL/ETH style transfers. */
    proposePayment(input: Omit<ProposeActionInput, "type" | "domain"> & {
        type?: string;
    }): Promise<ProposalResult>;
    /** Convenience wrapper for trading proposals (still review-only). */
    proposeTrade(input: Omit<ProposeActionInput, "type" | "domain"> & {
        type?: string;
    }): Promise<ProposalResult>;
    /**
     * Explicitly refuse unsafe capabilities so agents cannot accidentally call them.
     */
    approveHold(_id: string): never;
    signTransaction(_payload: unknown): never;
    exportPrivateKey(): never;
    get forbiddenCapabilities(): readonly string[];
}
export declare function createSquidAgentWallet(options?: SquidAgentWalletOptions): SquidAgentWallet;
//# sourceMappingURL=client.d.ts.map