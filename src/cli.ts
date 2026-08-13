import { SquidSdkError } from "./errors.js";
import type { HttpClient } from "./http.js";
import type { ProposeActionInput, ProposalResult } from "./types.js";

type CliOkResponse = {
  status?: string;
  command?: string;
  data?: unknown;
  message?: string;
  code?: string;
  type?: string;
  context?: Record<string, unknown>;
};

export class CliTransport {
  constructor(private readonly http: HttpClient) {}

  async execute<T = unknown>(argv: string[]): Promise<T> {
    const { status, data } = await this.http.requestJson<CliOkResponse>("/api/cli/execute", {
      method: "POST",
      body: { argv }
    });
    if (status === 401) {
      throw SquidSdkError.fromResponse(status, data);
    }
    if (status >= 400 || data.status !== "ok") {
      throw SquidSdkError.fromResponse(status, data);
    }
    return data.data as T;
  }

  status() {
    return this.execute(["status"]);
  }

  listWallets() {
    return this.execute(["wallets", "list"]);
  }

  listHolds() {
    return this.execute(["holds", "list"]);
  }

  showHold(id: string) {
    return this.execute(["holds", "show", id]);
  }

  listAgents() {
    return this.execute(["agents", "list"]);
  }

  listRules() {
    return this.execute(["rules", "list"]);
  }

  listPaymentLinks() {
    return this.execute(["payment-links", "list"]);
  }

  showPaymentLink(id: string) {
    return this.execute(["payment-links", "show", id]);
  }

  mcpInfo() {
    return this.execute(["mcp", "info"]);
  }

  doctor() {
    return this.execute(["doctor"]);
  }

  async proposeAction(input: ProposeActionInput): Promise<ProposalResult> {
    const argv = ["actions", "propose", "--type", input.type];
    if (input.domain) argv.push("--domain", input.domain);
    if (input.asset) argv.push("--asset", input.asset);
    if (input.amount !== undefined) argv.push("--amount", String(input.amount));
    if (input.recipient) argv.push("--recipient", input.recipient);
    if (input.chain) argv.push("--chain", input.chain);
    if (input.note) argv.push("--note", input.note);
    if (input.idempotencyKey) argv.push("--idempotency-key", input.idempotencyKey);
    return this.execute<ProposalResult>(argv);
  }
}
