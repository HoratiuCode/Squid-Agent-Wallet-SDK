import test from "node:test";
import assert from "node:assert/strict";
import {
  SquidAgentWallet,
  SquidForbiddenError,
  SquidValidationError,
  SAFETY,
  FORBIDDEN_CAPABILITIES,
  keyKind,
  resolveEndpoint,
  assertNotForbidden
} from "../dist/index.js";

test("safety contract forbids signing and money movement", () => {
  assert.equal(SAFETY.canProposeActions, true);
  assert.equal(SAFETY.canSignTransactions, false);
  assert.equal(SAFETY.canMoveMoney, false);
  assert.ok(FORBIDDEN_CAPABILITIES.includes("sign_transaction"));
  assert.throws(() => assertNotForbidden("approve_hold"));
});

test("keyKind detects Squid key prefixes", () => {
  assert.equal(keyKind("sq_master_abc"), "platform");
  assert.equal(keyKind("sq_live_abc"), "agent");
});

test("resolveEndpoint normalizes origin", () => {
  assert.equal(resolveEndpoint("http://localhost:4173/"), "http://localhost:4173");
  assert.throws(() => resolveEndpoint("not-a-url"), SquidValidationError);
});

test("client refuses forbidden wallet capabilities", () => {
  const squid = new SquidAgentWallet({
    endpoint: "http://localhost:4173",
    apiKey: "sq_master_test_key_for_unit_tests_only"
  });
  assert.equal(squid.transport, "cli");
  assert.throws(() => squid.approveHold("hold_1"), SquidForbiddenError);
  assert.throws(() => squid.signTransaction({}), SquidForbiddenError);
  assert.throws(() => squid.exportPrivateKey(), SquidForbiddenError);
});

test("agent keys default to MCP transport", () => {
  const squid = new SquidAgentWallet({
    endpoint: "http://localhost:4173",
    apiKey: "sq_live_test_key_for_unit_tests_only"
  });
  assert.equal(squid.transport, "mcp");
  const config = squid.toMcpServerConfig();
  assert.equal(config.mcpServers.squid.url, "http://localhost:4173/mcp");
  assert.match(config.mcpServers.squid.headers.Authorization, /^Bearer sq_live_/);
});

test("CLI propose builds argv through mocked fetch", async () => {
  /** @type {unknown} */
  let posted = null;
  const squid = new SquidAgentWallet({
    endpoint: "http://localhost:4173",
    apiKey: "sq_master_test_key_for_unit_tests_only",
    transport: "cli",
    fetch: async (_url, init) => {
      posted = JSON.parse(String(init?.body || "{}"));
      return new Response(
        JSON.stringify({
          status: "ok",
          data: {
            status: "held",
            proposalId: "hold_test",
            proposal: { id: "hold_test" },
            message: "Waiting for review."
          }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
  });

  const result = await squid.proposePayment({
    amount: 25,
    recipient: "0xabc",
    chain: "Base",
    idempotencyKey: "k1"
  });

  assert.equal(result.proposalId, "hold_test");
  assert.deepEqual(posted, {
    argv: [
      "actions",
      "propose",
      "--type",
      "transfer",
      "--domain",
      "payments",
      "--asset",
      "USDC",
      "--amount",
      "25",
      "--recipient",
      "0xabc",
      "--chain",
      "Base",
      "--idempotency-key",
      "k1"
    ]
  });
});
