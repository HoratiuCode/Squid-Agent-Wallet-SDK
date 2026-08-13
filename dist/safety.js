/**
 * Squid Agent Wallet SDK safety contract.
 *
 * Squid never gives agents private keys or wallet-signing authority.
 * This SDK can only read permitted context and propose actions for human review.
 */
import { SquidForbiddenError } from "./errors.js";
export const SDK_NAME = "Squid Agent Wallet SDK";
export const SDK_VERSION = "0.1.0";
export const SAFETY = {
    canReadContext: true,
    canProposeActions: true,
    canApproveHolds: false,
    canSignTransactions: false,
    canBroadcastTransactions: false,
    canAccessPrivateKeys: false,
    canMoveMoney: false,
    description: "Agents propose. Squid Brain / policy may HOLD or BLOCK. Humans review. Owner wallets sign."
};
/** Methods this SDK deliberately does not expose. */
export const FORBIDDEN_CAPABILITIES = [
    "approve_hold",
    "reject_hold",
    "sign_transaction",
    "broadcast_transaction",
    "export_private_key",
    "export_seed_phrase",
    "execute_payment",
    "activate_automation"
];
export function assertNotForbidden(capability) {
    if (FORBIDDEN_CAPABILITIES.includes(capability)) {
        throw new SquidForbiddenError(`Squid Agent Wallet SDK cannot ${capability}. Agents propose only; the owner wallet signs.`, { code: "capability_forbidden", context: { capability } });
    }
}
//# sourceMappingURL=safety.js.map