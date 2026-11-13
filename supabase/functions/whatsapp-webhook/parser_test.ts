
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseTransaction } from "./parser.ts";

Deno.test("pengeluaran makan 25rb", () => {
  assertEquals(parseTransaction("pengeluaran makan 25rb"), {
    kind: "expense",
    amount: 25000,
    description: "makan",
    currency: "IDR",
  });
});

Deno.test("pemasukan gaji 2jt", () => {
  assertEquals(parseTransaction("pemasukan gaji 2jt"), {
    kind: "income",
    amount: 2000000,
    description: "gaji",
    currency: "IDR",
  });
});

Deno.test("nominal 25.000 dikenali sebagai 25000", () => {
  assertEquals(parseTransaction("pengeluaran 25.000 makan"), {
    kind: "expense",
    amount: 25000,
    description: "makan",
    currency: "IDR",
  });
});

Deno.test("pesan tanpa nominal tidak dikenali", () => {
  assertEquals(parseTransaction("beli kopi"), null);
});
