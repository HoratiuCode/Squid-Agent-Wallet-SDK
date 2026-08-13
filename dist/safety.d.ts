/**
 * Squid Agent Wallet SDK safety contract.
 *
 * Squid never gives agents private keys or wallet-signing authority.
 * This SDK can only read permitted context and propose actions for human review.
 */
export declare const SDK_NAME = "Squid Agent Wallet SDK";
export declare const SDK_VERSION = "0.1.0";
export declare const SAFETY: {
    readonly canReadContext: true;
    readonly canProposeActions: true;
    readonly canApproveHolds: false;
    readonly canSignTransactions: false;
    readonly canBroadcastTransactions: false;
    readonly canAccessPrivateKeys: false;
    readonly canMoveMoney: false;
    readonly description: "Agents propose. Squid Brain / policy may HOLD or BLOCK. Humans review. Owner wallets sign.";
};
/** Methods this SDK deliberately does not expose. */
export declare const FORBIDDEN_CAPABILITIES: readonly ["approve_hold", "reject_hold", "sign_transaction", "broadcast_transaction", "export_private_key", "export_seed_phrase", "execute_payment", "activate_automation"];
export type ForbiddenCapability = (typeof FORBIDDEN_CAPABILITIES)[number];
export declare function assertNotForbidden(capability: string): void;
//# sourceMappingURL=safety.d.ts.map