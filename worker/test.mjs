// Minimal unit tests for the worker's pure logic. Run: node test.mjs
import assert from "node:assert";
import { makeToken, verifyToken, verifyPayment, b64ToBytes, b64url, ub64url, encryptBytes, decryptBytes } from "./src/lib.js";

let pass = 0;
function ok(name, cond) { assert.ok(cond, name); pass++; console.log("  ok -", name); }

// base64url roundtrip
{
  const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 62, 63]);
  const back = ub64url(b64url(bytes));
  ok("b64url roundtrip", back.every((v, i) => v === bytes[i]));
}

// token sign / verify
{
  const secret = "test-secret";
  const tok = await makeToken(secret, { p: "playbook", t: "abc" }, 900);
  ok("token parts", tok.split(".").length === 2);
  const p = await verifyToken(secret, tok);
  ok("token validates", p && p.p === "playbook" && p.t === "abc");
  ok("wrong secret rejected", (await verifyToken("other", tok)) === null);
  ok("tampered rejected", (await verifyToken(secret, tok.replace(/.$/, "x"))) === null);
  const expired = await makeToken(secret, { p: "x" }, -10);
  ok("expired rejected", (await verifyToken(secret, expired)) === null);
}

// payment verification with mocked explorer
{
  const addr = "bc1qtestaddress";
  const mk = (vouts, status) => async () => ({
    ok: true, status: 200,
    json: async () => ({ vout: vouts, status }),
  });
  const good = await verifyPayment({
    txid: "a".repeat(64), address: addr, minSats: 1000,
    fetchImpl: mk([{ scriptpubkey_address: addr, value: 1500 }], { confirmed: true, block_height: 900000 }),
  });
  ok("valid payment accepted", good.ok && good.paid === 1500 && good.confirmed);

  const under = await verifyPayment({
    txid: "a".repeat(64), address: addr, minSats: 1000,
    fetchImpl: mk([{ scriptpubkey_address: addr, value: 400 }], { confirmed: false }),
  });
  ok("underpayment rejected", !under.ok);

  const otherAddr = await verifyPayment({
    txid: "a".repeat(64), address: addr, minSats: 1000,
    fetchImpl: mk([{ scriptpubkey_address: "someoneelse", value: 999999 }], { confirmed: true }),
  });
  ok("wrong address rejected", !otherAddr.ok);

  const bad = await verifyPayment({ txid: "nope", address: addr, minSats: 1, fetchImpl: mk([], {}) });
  ok("bad txid rejected", !bad.ok);
}

// b64ToBytes
ok("b64ToBytes length", b64ToBytes("aGVsbG8=").length === 5);

// AES-256-GCM deliverable encryption
{
  const key = "shelf-test-key";
  const bytes = new Uint8Array([0, 1, 2, 127, 128, 200, 250, 251, 252, 253, 254, 255]);
  const { iv, ct } = await encryptBytes(key, bytes);
  ok("ciphertext differs from plaintext", ct !== b64url(bytes));
  const back = await decryptBytes(key, iv, ct);
  ok("decrypt roundtrip", back.length === bytes.length && back.every((v, i) => v === bytes[i]));

  let threw = false;
  try { await decryptBytes("wrong-key", iv, ct); } catch { threw = true; }
  ok("wrong key rejected", threw);

  let tampered = false;
  try { await decryptBytes(key, iv, ct.slice(0, -2) + (ct.slice(-2) === "AA" ? "BB" : "AA")); } catch { tampered = true; }
  ok("tampered ciphertext rejected", tampered);
}

console.log(`\n${pass} checks passed`);
