
// Prototipe penerima WhatsApp Cloud API.
// Belum menyimpan transaksi ke database.

const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "";
const APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

async function verifySignature(body: string, signature: string) {
  if (!APP_SECRET || !signature.startsWith("sha256=")) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );

  return safeEqual(
    "sha256=" + toHex(new Uint8Array(digest)),
    signature,
  );
}

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

function extractMessages(payload: any): string[] {
  const messages: string[] = [];

  for (const entry of payload?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      for (const message of change?.value?.messages ?? []) {
        if (
          message?.type === "text" &&
          typeof message?.text?.body === "string"
        ) {
          messages.push(message.text.body);
        }
      }
    }
  }

  return messages;
}

Deno.serve(async (req: Request) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (
      mode === "subscribe" &&
      VERIFY_TOKEN &&
      token &&
      safeEqual(token, VERIFY_TOKEN) &&
      challenge
    ) {
      return new Response(challenge, { status: 200 });
    }

    return json({ error: "Webhook verification failed" }, 403);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  if (!(await verifySignature(rawBody, signature))) {
    return json({ error: "Invalid webhook signature" }, 401);
  }

  let payload: any;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const parsed = extractMessages(payload).map(parseTransaction);
  const recognized = parsed.filter(Boolean);

  // Belum ada penulisan ke database.
  // Pemetaan pemilik nomor dan konfirmasi transaksi
  // harus dirancang sebelum fitur penyimpanan diaktifkan.

  return json({
    ok: true,
    received: parsed.length,
    recognized: recognized.length,
    preview: parsed,
    saved: 0,
  });
});
