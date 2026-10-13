// End-to-end test of the worker handler using Node's global fetch/Request/Response.
// Run: node integration.test.mjs
import assert from "node:assert";
import worker from "./src/index.js";

const ADDR = "bc1qtestaddress";
const TXID = "b".repeat(64);
const PRICE = 80000;

function mockFetch(paidSats, confirmed) {
  return async (u) => {
    const s = String(u);
    if (s.includes("/v1/prices")) return { ok: true, status: 200, json: async () => ({ USD: PRICE }) };
    if (s.includes("/tx/")) return {
      ok: true, status: 200,
      json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: paidSats }], status: { confirmed, block_height: 800000 } }),
    };
    return { ok: false, status: 404, json: async () => ({}) };
  };
}

const env = { DOWNLOAD_SECRET: "s3cret", BTC_ADDRESS: ADDR };
const call = (path, opts) => worker.fetch(new Request("https://w.dev" + path, opts), env);

{
  const j = await (await call("/health")).json();
  assert.ok(j.ok && j.products.includes("playbook"));
  console.log("  ok - health");
}

let downloadPath;
{
  globalThis.fetch = mockFetch(1e8, true);
  const r = await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "playbook" }),
  });
  const j = await r.json();
  assert.ok(j.ok, "verify should pass: " + JSON.stringify(j));
  assert.ok(/^\/download\?token=/.test(j.downloadUrl), "should return a signed download path: " + j.downloadUrl);
  assert.ok(j.confirmed);
  downloadPath = j.downloadUrl;
  console.log("  ok - /verify returns a signed download path after a valid payment");
}

{
  const r = await call(downloadPath);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.headers.get("content-type"), "text/html; charset=utf-8");
  assert.ok(/attachment; filename=/.test(r.headers.get("content-disposition")));
  const body = await r.text();
  assert.ok(body.length > 200 && /<!DOCTYPE|<html/i.test(body), "decrypted deliverable should be readable HTML");
  console.log("  ok - /download streams the decrypted deliverable (", body.length, "bytes )");
}

{
  const r = await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "nope" }),
  });
  assert.strictEqual(r.status, 404);
  console.log("  ok - /verify rejects unknown product");
}

{
  globalThis.fetch = mockFetch(10, false);
  const j = await (await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "playbook" }),
  })).json();
  assert.ok(!j.ok);
  console.log("  ok - /verify rejects underpayment");
}

{
  const r = await call("/download?token=bogus.token");
  assert.strictEqual(r.status, 403);
  console.log("  ok - /download rejects forged token");
}

console.log("\nintegration: all passed");
