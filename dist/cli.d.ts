import type { HttpClient } from "./http.js";
import type { ProposeActionInput, ProposalResult } from "./types.js";
export declare class CliTransport {
    private readonly http;
    constructor(http: HttpClient);
    execute<T = unknown>(argv: string[]): Promise<T>;
    status(): Promise<unknown>;
    listWallets(): Promise<unknown>;
    listHolds(): Promise<unknown>;
    showHold(id: string): Promise<unknown>;
    listAgents(): Promise<unknown>;
    listRules(): Promise<unknown>;
    listPaymentLinks(): Promise<unknown>;
    showPaymentLink(id: string): Promise<unknown>;
    mcpInfo(): Promise<unknown>;
    doctor(): Promise<unknown>;
    proposeAction(input: ProposeActionInput): Promise<ProposalResult>;
}
//# sourceMappingURL=cli.d.ts.map