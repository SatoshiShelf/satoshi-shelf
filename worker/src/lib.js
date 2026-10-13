// Satoshi Shelf worker — pure helpers (testable in Node >=20)
const enc = new TextEncoder();

export function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function ub64url(str) {
  str = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function b64ToBytes(b64) {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export function bytesToB64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// AES-256-GCM at-rest encryption for paid deliverables.
// The key never leaves the (gitignored) worker bundle / Worker secret, so the
// encrypted copies committed to the public repo are useless without paying.
async function aesKey(secret) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptBytes(secret, bytes) {
  const key = await aesKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  return { iv: b64url(iv), ct: b64url(ct) };
}

export async function decryptBytes(secret, ivB64, ctB64) {
  const key = await aesKey(secret);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ub64url(ivB64) }, key, ub64url(ctB64)
  );
  return new Uint8Array(pt);
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64url(new Uint8Array(sig));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function makeToken(secret, payload, ttlSec, nowSec) {
  const now = nowSec || Math.floor(Date.now() / 1000);
  const body = { ...payload, e: now + ttlSec };
  const p = b64url(enc.encode(JSON.stringify(body)));
  const s = await hmac(secret, p);
  return p + "." + s;
}

export async function verifyToken(secret, token, nowSec) {
  const [p, s] = String(token || "").split(".");
  if (!p || !s) return null;
  const expect = await hmac(secret, p);
  if (!safeEqual(expect, s)) return null;
  let body;
  try { body = JSON.parse(new TextDecoder().decode(ub64url(p))); } catch { return null; }
  const now = nowSec || Math.floor(Date.now() / 1000);
  if (!body.e || body.e < now) return null;
  return body;
}

// Verify a txid paid >= minSats to `address`.
export async function verifyPayment({ txid, address, minSats, fetchImpl, apiBase }) {
  const base = apiBase || "https://mempool.space/api";
  const f = fetchImpl || fetch;
  if (!/^[0-9a-fA-F]{64}$/.test(String(txid || ""))) {
    return { ok: false, reason: "That doesn't look like a valid transaction ID." };
  }
  const r = await f(base + "/tx/" + txid);
  if (r.status === 404) return { ok: false, reason: "Transaction not found yet — wait a moment and retry." };
  if (!r.ok) return { ok: false, reason: "Block explorer unavailable. Try again." };
  const tx = await r.json();
  let paid = 0;
  for (const v of (tx.vout || [])) {
    if (v.scriptpubkey_address === address) paid += v.value || 0;
  }
  if (paid < minSats) {
    return { ok: false, reason: `Payment was ${paid} sats; ${minSats} required.`, paid };
  }
  const confirmed = !!(tx.status && tx.status.confirmed);
  return { ok: true, paid, confirmed, block: confirmed ? tx.status.block_height : null };
}
