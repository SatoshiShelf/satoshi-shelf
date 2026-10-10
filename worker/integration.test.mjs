// End-to-end test of the worker handler using Node's global fetch/Request/Response.
// Run: node integration.test.mjs
import assert from "node:assert";
import worker from "./src/index.js";
import { ub64url } from "./src/lib.js";

const ADDR = "bc1qtestaddress";
const TXID = "b".repeat(64);

let fetchCalls = [];
globalThis.fetch = async (u) => {
  fetchCalls.push(u);
  if (u.includes("/v1/prices")) return { ok: true, status: 200, json: async () => ({ USD: 80000 }) };
  if (u.includes("/tx/")) return {
    ok: true, status: 200,
    json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: 20000 }], status: { confirmed: true, block_height: 800000 } }),
  };
  return { ok: false, status: 404, json: async () => ({}) };
};

const env = { DOWNLOAD_SECRET: "s3cret", BTC_ADDRESS: ADDR };
const call = (path, opts) => worker.fetch(new Request("https://w.dev" + path, opts), env);

// health
{
  const r = await call("/health");
  const j = await r.json();
  assert.ok(j.ok && j.products.includes("playbook"));
  console.log("  ok - health");
}

// verify good payment
let token;
{
  const r = await call("/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "playbook" }),
  });
  const j = await r.json();
  assert.ok(j.ok, "verify should pass: " + JSON.stringify(j));
  assert.ok(j.downloadUrl.includes("/download?token="));
  token = new URLSearchParams(j.downloadUrl.split("?")[1]).get("token");
  console.log("  ok - /verify issues a token");
}

// download with token
{
  const r = await call("/download?token=" + encodeURIComponent(token));
  assert.strictEqual(r.status, 200);
  assert.ok((r.headers.get("content-disposition") || "").includes("attachment"));
  const buf = new Uint8Array(await r.arrayBuffer());
  assert.ok(buf.length > 500);
  const text = new TextDecoder().decode(buf.slice(0, 60));
  assert.ok(text.includes("<!DOCTYPE html"));
  console.log("  ok - /download returns the real file (" + buf.length + " bytes)");
}

// invalid token rejected
{
  const r = await call("/download?token=bogus.token");
  assert.strictEqual(r.status, 403);
  console.log("  ok - /download rejects forged token");
}

// unknown product
{
  const r = await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "nope" }),
  });
  assert.strictEqual(r.status, 404);
  console.log("  ok - /verify rejects unknown product");
}

// underpayment
{
  globalThis.fetch = async (u) => {
    if (u.includes("/v1/prices")) return { ok: true, status: 200, json: async () => ({ USD: 80000 }) };
    return { ok: true, status: 200, json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: 10 }], status: { confirmed: false } }) };
  };
  const r = await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "playbook" }),
  });
  const j = await r.json();
  assert.ok(!j.ok);
  console.log("  ok - /verify rejects underpayment");
}

console.log("\nintegration: all passed");
