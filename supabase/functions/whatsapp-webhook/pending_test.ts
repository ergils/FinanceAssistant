import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { PendingStore } from "./pending.ts";

const transaction = {
  kind: "expense" as const,
  amount: 25000,
  description: "makan",
  currency: "IDR" as const,
};

Deno.test("pengirim dapat mengonfirmasi transaksi sendiri", () => {
  const store = new PendingStore();
  store.create("1", "sender-A", transaction, 1000);

  const result = store.resolve("sender-A", "confirm", 2000);

  assertEquals(result.status, "confirmed");
});

Deno.test("pengirim lain tidak dapat mengonfirmasi transaksi", () => {
  const store = new PendingStore();
  store.create("1", "sender-A", transaction, 1000);

  const result = store.resolve("sender-B", "confirm", 2000);

  assertEquals(result.status, "not_found");
});

Deno.test("BATAL membatalkan transaksi", () => {
  const store = new PendingStore();
  store.create("1", "sender-A", transaction, 1000);

  const result = store.resolve("sender-A", "cancel", 2000);

  assertEquals(result.status, "cancelled");
});

Deno.test("transaksi kedaluwarsa setelah lima menit", () => {
  const store = new PendingStore();
  store.create("1", "sender-A", transaction, 1000);

  const result = store.resolve("sender-A", "confirm", 301001);

  assertEquals(result.status, "expired");
});
