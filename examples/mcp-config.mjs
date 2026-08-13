/**
 * Print MCP server config for Cursor / Claude / Hermes.
 *
 *   export SQUID_API_KEY=sq_live_…
 *   node examples/mcp-config.mjs
 */
import { SquidAgentWallet } from "../dist/index.js";

const squid = new SquidAgentWallet({
  endpoint: process.env.SQUID_ENDPOINT || "http://localhost:4173",
  apiKey: process.env.SQUID_API_KEY,
  transport: "mcp"
});

console.log(JSON.stringify(squid.toMcpServerConfig(), null, 2));

if (process.env.SQUID_API_KEY) {
  try {
    const tools = await squid.listMcpTools();
    console.log("\nLive tools:", tools.map((tool) => tool.name).join(", ") || "(none)");
  } catch (error) {
    console.error("\nCould not list MCP tools:", error.message);
  }
}
