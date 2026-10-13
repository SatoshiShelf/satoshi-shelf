import { CONFIG, PRODUCTS } from "./embedded.js";
import { makeToken, verifyToken, verifyPayment, b64ToBytes, decryptBytes } from "./lib.js";

const PRICE_API = "https://mempool.space/api/v1/prices";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, "content-type": "application/json" },
  });
}

async function btcPrice() {
  const r = await fetch(PRICE_API);
  if (!r.ok) throw new Error("price");
  const d = await r.json();
  const usd = d.USD || d.usd;
  if (!usd) throw new Error("price");
  return usd;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (url.pathname === "/" || url.pathname === "") {
      return Response.redirect(env.STORE_URL || "https://xghabra.github.io/satoshi-shelf/", 302);
    }
    if (url.pathname === "/health") return json({ ok: true, products: Object.keys(PRODUCTS) });

    const secret = env.DOWNLOAD_SECRET || CONFIG.key;
    const decKey = env.SHELF_KEY || CONFIG.key;
    const address = env.BTC_ADDRESS || CONFIG.btcAddress;

    if (url.pathname === "/verify" && request.method === "POST") {
      if (!secret) return json({ ok: false, reason: "Server not configured." }, 500);
      let body;
      try { body = await request.json(); } catch { return json({ ok: false, reason: "Bad request." }, 400); }

      const product = PRODUCTS[body.productId];
      if (!product) return json({ ok: false, reason: "Unknown product." }, 404);

      let price;
      try { price = await btcPrice(); } catch { return json({ ok: false, reason: "Live price unavailable, try again." }, 502); }

      const minSats = Math.floor((product.priceUsd / price) * 1e8 * 0.995);
      const res = await verifyPayment({ txid: body.txid, address, minSats, fetchImpl: fetch });
      if (!res.ok) return json(res, 200);

      // External link (e.g. MediaFire) — returned only after a verified payment.
      if (product.url) {
        return json({ ok: true, downloadUrl: product.url, confirmed: res.confirmed, paid: res.paid });
      }

      const token = await makeToken(secret, { p: body.productId, t: String(body.txid).toLowerCase() }, 900);
      return json({ ok: true, token, downloadUrl: "/download?token=" + encodeURIComponent(token), confirmed: res.confirmed });
    }

    if (url.pathname === "/download" && request.method === "GET") {
      if (!secret) return json({ ok: false, reason: "Server not configured." }, 500);
      const payload = await verifyToken(secret, url.searchParams.get("token"));
      if (!payload) return new Response("This link is invalid or has expired. Verify your payment again.", { status: 403, headers: CORS });
      const product = PRODUCTS[payload.p];
      if (!product) return new Response("Unknown product.", { status: 404, headers: CORS });

      let body;
      if (product.ct) {
        if (!decKey) return new Response("Server not configured.", { status: 500, headers: CORS });
        try {
          body = await decryptBytes(decKey, product.iv, product.ct);
        } catch {
          return new Response("Delivery error.", { status: 500, headers: CORS });
        }
      } else if (product.b64) {
        body = b64ToBytes(product.b64);
      } else if (product.url) {
        return Response.redirect(product.url, 302);
      } else {
        return new Response("Unknown product.", { status: 404, headers: CORS });
      }

      return new Response(body, {
        headers: {
          ...CORS,
          "content-type": product.contentType || "application/octet-stream",
          "content-disposition": `attachment; filename="${product.filename}"`,
          "cache-control": "no-store",
        },
      });
    }

    return json({ ok: false, reason: "Not found." }, 404);
  },
};
