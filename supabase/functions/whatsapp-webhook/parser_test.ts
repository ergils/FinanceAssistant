
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Salinan sementara fungsi parser untuk uji kasus.
// Setelah lolos, kita pisahkan parser produksi agar tes
// menggunakan fungsi yang sama persis.

function parseTransaction(text: string) {
  const kind = /\b(pemasukan|masuk|income|diterima)\b/i.test(text)
    ? "income"
    : /\b(pengeluaran|keluar|expense|belanja|beli|bayar)\b/i.test(text)
    ? "expense"
    : null;

  if (!kind) return null;

  const match = text.match(
    /(?:rp\s*)?([0-9][0-9.,]*(?:\s*(?:rb|ribu|jt|juta|k|m))?)/i,
  );

  if (!match) return null;

  const token = match[1].replace(/\s/g, "").toLowerCase();
  const suffix = /[a-z]$/.test(token)
    ? (token.match(/(ribu|juta|rb|jt|k|m)$/)?.[1] ?? "")
    : "";

  const numberPart = suffix ? token.slice(0, -suffix.length) : token;
  const digits = numberPart.replace(/[.,]/g, "");

  if (!/^\d+$/.test(digits)) return null;

  const multiplier = ["rb", "ribu", "k"].includes(suffix)
    ? 1000
    : ["jt", "juta", "m"].includes(suffix)
    ? 1000000
    : 1;

  const amount = Number(digits) * multiplier;
  if (!Number.isSafeInteger(amount) || amount <= 0) return null;

  const description = text
    .replace(match[0], "")
    .replace(
      /\b(pemasukan|masuk|income|diterima|pengeluaran|keluar|expense|belanja|beli|bayar)\b/gi,
      "",
    )
    .replace(/[,:;\-]/g, " ")
    .trim()
    .slice(0, 120);

  return {
    kind,
    amount,
    description: description || "Transaksi WhatsApp",
    currency: "IDR",
  };
}

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

Deno.test("nominal 25.000 tidak dianggap juta", () => {
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
