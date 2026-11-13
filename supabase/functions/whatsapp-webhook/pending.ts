import type { ParsedTransaction } from "./parser.ts";

export type PendingItem = {
  id: string;
  senderId: string;
  transaction: ParsedTransaction;
  expiresAt: number;
};

export type PendingResult =
  | { status: "confirmed"; transaction: ParsedTransaction }
  | { status: "cancelled" }
  | { status: "expired" }
  | { status: "not_found" };

export class PendingStore {
  private items = new Map<string, PendingItem>();

  create(
    id: string,
    senderId: string,
    transaction: ParsedTransaction,
    now = Date.now(),
  ): PendingItem {
    const item: PendingItem = {
      id,
      senderId,
      transaction,
      expiresAt: now + 5 * 60 * 1000,
    };

    this.items.set(senderId, item);
    return item;
  }

  resolve(
    senderId: string,
    action: "confirm" | "cancel",
    now = Date.now(),
  ): PendingResult {
    const item = this.items.get(senderId);

    if (!item) return { status: "not_found" };

    if (now >= item.expiresAt) {
      this.items.delete(senderId);
      return { status: "expired" };
    }

    this.items.delete(senderId);

    if (action === "cancel") {
      return { status: "cancelled" };
    }

    return {
      status: "confirmed",
      transaction: item.transaction,
    };
  }
}
