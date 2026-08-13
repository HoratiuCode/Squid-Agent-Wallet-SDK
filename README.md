# Squid Agent Wallet SDK

TypeScript SDK for AI agents and backends that connect to **Squid Pay**.

Agents can **read** permitted account context and **propose** payments or trades.  
They **cannot** approve holds, sign transactions, broadcast, or move money. The owner’s connected wallet remains the final signer.

```text
Agent (this SDK) → Squid validates / HOLDs → Human reviews → Owner wallet signs → Squid verifies
```

## Install

```bash
cd /Users/horatiubudai/ceo/Squid/sdk_developer
npm install
npm run build
```

From another project (local path):

```bash
npm install /Users/horatiubudai/ceo/Squid/sdk_developer
```

## Quick start

Create a **Platform API key** in Squid → **Settings → CLI** (`sq_master_…`),  
or use an **agent key** from **Agents** (`sq_live_…`).

```ts
import { SquidAgentWallet } from "@squid/agent-wallet-sdk";

const squid = new SquidAgentWallet({
  endpoint: process.env.SQUID_ENDPOINT || "http://localhost:4173",
  apiKey: process.env.SQUID_API_KEY
});

const status = await squid.getStatus();
const wallets = await squid.listWallets();

const proposal = await squid.proposePayment({
  asset: "USDC",
  amount: 25,
  recipient: "0xRecipient...",
  chain: "Base",
  note: "Vendor invoice #1042",
  idempotencyKey: "invoice-1042"
});

console.log(proposal.status);     // "held" | "ready_for_wallet"
console.log(proposal.proposalId); // Needs Review hold id
console.log(proposal.message);    // Human-readable next step
```

## Transports

| Key | Default transport | Endpoint |
| --- | --- | --- |
| `sq_master_…` (Platform API key) | CLI HTTP | `POST /api/cli/execute` |
| `sq_live_…` (agent key) | MCP | `POST /mcp` |

Force a transport:

```ts
new SquidAgentWallet({ apiKey, transport: "mcp" });
new SquidAgentWallet({ apiKey, transport: "cli" });
```

### MCP config for Cursor / Claude / Hermes

```ts
console.log(JSON.stringify(squid.toMcpServerConfig(), null, 2));
```

```json
{
  "mcpServers": {
    "squid": {
      "url": "http://localhost:4173/mcp",
      "headers": {
        "Authorization": "Bearer sq_live_…"
      }
    }
  }
}
```

Squid MCP tools exposed by this SDK:

| Tool | Purpose |
| --- | --- |
| `get_account_summary` | Profile, wallets, open reviews |
| `get_wallet_balances` | Balances / sync status |
| `get_financial_harness` | Agent budget + limits |
| `list_holds` | Pending human reviews |
| `get_agent_rules` | Policies, files, vendors |
| `get_platform_state` | Full read-only platform snapshot |
| `propose_action` | Create a review proposal (never signs) |

## API surface

```ts
squid.getStatus()
squid.listWallets() / getBalances()
squid.listHolds() / getHold(id)
squid.listAgents()
squid.listRules()
squid.listPaymentLinks() / getPaymentLink(id)
squid.getPlatformState()
squid.getFinancialHarness()
squid.doctor()

squid.proposeAction({ type, domain?, asset?, amount?, recipient?, chain?, note?, idempotencyKey? })
squid.proposePayment({ asset, amount, recipient, chain?, note?, idempotencyKey? })
squid.proposeTrade({ asset, amount, … })

squid.executeCli(["status"])
squid.callMcpTool("list_holds")
squid.listMcpTools()
squid.toMcpServerConfig()
```

Deliberately **not** available (throws `SquidForbiddenError`):

- `approveHold`
- `signTransaction`
- `exportPrivateKey`

## Safety contract

Matches Squid Pay:

1. No private keys / seed phrases in Squid or this SDK.
2. Proposals go through Squid Brain / policy; risky ones become **Needs Review** holds.
3. Money moves only after the owner wallet signs and Squid verifies the chain receipt.
4. Structured errors from Squid (`code`, `type`, `message`) are preserved as `SquidSdkError`.

## Examples

```bash
export SQUID_ENDPOINT=http://localhost:4173
export SQUID_API_KEY=sq_master_…
node examples/quickstart.mjs
node examples/propose-payment.mjs
node examples/mcp-config.mjs
```

## Relation to Squid Pay

This package lives next to the console at `bank_squid/Squid Pay /`.  
Run Squid with `npm run dev` there (default <http://localhost:4173>), then point the SDK at that origin.

| Package | Role |
| --- | --- |
| Squid Pay (`server.js` + `public/`) | Source of truth, wallet signing, verification |
| `@squid/pay-cli` | Terminal client for Platform API key |
| **`@squid/agent-wallet-sdk`** | Programmatic agent / backend client |

## Development

```bash
npm install
npm run build
npm test
```

Requires **Node.js ≥ 18** (native `fetch`).
