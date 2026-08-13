# Squid Agent Wallet SDK — Agent notes

This package is the **developer SDK** for agents connecting to Squid Pay.

## Hard rules

- Propose and read only. Never implement approve / sign / broadcast / private-key flows.
- Squid Pay (`../bank_squid/Squid Pay /`) remains source of truth for money movement.
- Prefer typed wrappers over raw HTTP when extending the public API.
- Keep examples honest: proposals are not receipts.

## Layout

```text
src/client.ts   — SquidAgentWallet facade
src/cli.ts      — POST /api/cli/execute
src/mcp.ts      — POST /mcp (stateless JSON-RPC batch)
src/safety.ts   — capability contract
```

## Verify

```bash
npm install
npm run build
npm test
```
