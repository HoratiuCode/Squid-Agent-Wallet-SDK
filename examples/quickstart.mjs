/**
 * Quick read of Squid workspace status + wallets.
 *
 *   export SQUID_API_KEY=sq_master_…
 *   node examples/quickstart.mjs
 */
import { SquidAgentWallet, SAFETY } from "../dist/index.js";

const squid = new SquidAgentWallet({
  endpoint: process.env.SQUID_ENDPOINT || "http://localhost:4173",
  apiKey: process.env.SQUID_API_KEY
});

console.log("Safety:", SAFETY.description);
console.log("Transport:", squid.transport);
console.log("Status:", await squid.getStatus());
console.log("Wallets:", await squid.listWallets());
console.log("Open holds:", await squid.listHolds());
