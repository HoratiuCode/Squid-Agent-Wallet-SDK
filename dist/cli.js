import { SquidSdkError } from "./errors.js";
export class CliTransport {
    http;
    constructor(http) {
        this.http = http;
    }
    async execute(argv) {
        const { status, data } = await this.http.requestJson("/api/cli/execute", {
            method: "POST",
            body: { argv }
        });
        if (status === 401) {
            throw SquidSdkError.fromResponse(status, data);
        }
        if (status >= 400 || data.status !== "ok") {
            throw SquidSdkError.fromResponse(status, data);
        }
        return data.data;
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
    showHold(id) {
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
    showPaymentLink(id) {
        return this.execute(["payment-links", "show", id]);
    }
    mcpInfo() {
        return this.execute(["mcp", "info"]);
    }
    doctor() {
        return this.execute(["doctor"]);
    }
    async proposeAction(input) {
        const argv = ["actions", "propose", "--type", input.type];
        if (input.domain)
            argv.push("--domain", input.domain);
        if (input.asset)
            argv.push("--asset", input.asset);
        if (input.amount !== undefined)
            argv.push("--amount", String(input.amount));
        if (input.recipient)
            argv.push("--recipient", input.recipient);
        if (input.chain)
            argv.push("--chain", input.chain);
        if (input.note)
            argv.push("--note", input.note);
        if (input.idempotencyKey)
            argv.push("--idempotency-key", input.idempotencyKey);
        return this.execute(argv);
    }
}
//# sourceMappingURL=cli.js.map