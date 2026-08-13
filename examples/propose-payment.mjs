/**
 * Propose a payment for human review (does not sign or send).
 *
 *   export SQUID_API_KEY=sq_master_…
 *   node examples/propose-payment.mjs
 */
import { SquidAgentWallet } from "../dist/index.js";

const recipient = process.env.SQUID_RECIPIENT || "0x0000000000000000000000000000000000000001";
const amount = Number(process.env.SQUID_AMOUNT || "1");

const squid = new SquidAgentWallet({
  endpoint: process.env.SQUID_ENDPOINT || "http://localhost:4173",
  apiKey: process.env.SQUID_API_KEY
});

const proposal = await squid.proposePayment({
  asset: process.env.SQUID_ASSET || "USDC",
  amount,
  recipient,
  chain: process.env.SQUID_CHAIN || "Base",
  note: process.env.SQUID_NOTE || "SDK example proposal — review only",
  idempotencyKey: process.env.SQUID_IDEMPOTENCY_KEY || `sdk-example-${Date.now()}`
});

console.log(JSON.stringify(proposal, null, 2));
console.log("\nNext: open Squid → Needs Review. Your wallet still has to sign before any funds move.");
