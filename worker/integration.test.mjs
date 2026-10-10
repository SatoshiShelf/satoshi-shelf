// End-to-end test of the worker handler using Node's global fetch/Request/Response.
// Run: node integration.test.mjs
import assert from "node:assert";
import worker from "./src/index.js";

const ADDR = "bc1qtestaddress";
const TXID = "b".repeat(64);

globalThis.fetch = async (u) => {
  if (u.includes("/v1/prices")) return { ok: true, status: 200, json: async () => ({ USD: 80000 }) };
  if (u.includes("/tx/")) return {
    ok: true, status: 200,
    json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: 20000 }], status: { confirmed: true, block_height: 800000 } }),
  };
  return { ok: false, status: 404, json: async () => ({}) };
};

const env = { DOWNLOAD_SECRET: "s3cret", BTC_ADDRESS: ADDR };
const call = (path, opts) => worker.fetch(new Request("https://w.dev" + path, opts), env);

{
  const j = await (await call("/health")).json();
  assert.ok(j.ok && j.products.includes("playbook"));
  console.log("  ok - health");
}

{
  const r = await call("/verify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ txid: TXID, productId: "playbook" }),
  });
  const j = await r.json();
  assert.ok(j.ok, "verify should pass: " + JSON.stringify(j));
  assert.ok(/^https:\/\//.test(j.downloadUrl), "should return an absolute delivery URL: " + j.downloadUrl);
  assert.ok(j.confirmed);
  console.log("  ok - /verify returns the delivery link after a valid payment ->", j.downloadUrl.slice(0, 45) + "...");
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
  globalThis.fetch = async (u) => {
    if (u.includes("/v1/prices")) return { ok: true, status: 200, json: async () => ({ USD: 80000 }) };
    return { ok: true, status: 200, json: async () => ({ vout: [{ scriptpubkey_address: ADDR, value: 10 }], status: { confirmed: false } }) };
  };
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
