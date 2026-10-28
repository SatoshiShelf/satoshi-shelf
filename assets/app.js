// Satoshi Shelf — shared client logic
(function () {
  const CFG = window.STORE_CONFIG;

  function fmtUsd(n) {
    return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
  }

  function fmtSats(btc) {
    return Math.round(btc * 1e8).toLocaleString() + " sats";
  }

  let _rateCache = null;
  async function getBtcPrice() {
    if (_rateCache) return _rateCache;
    const r = await fetch(CFG.priceApi);
    if (!r.ok) throw new Error("Could not fetch BTC price");
    const data = await r.json();
    const usd = data.USD || data.usd;
    if (!usd) throw new Error("No USD price found");
    _rateCache = usd;
    return usd;
  }

  async function usdToBtc(usd) {
    const p = await getBtcPrice();
    return usd / p;
  }

  function btcUri(address, btcAmount, label) {
    let uri = "bitcoin:" + address;
    const params = [];
    if (btcAmount) params.push("amount=" + btcAmount.toFixed(8));
    if (label) params.push("label=" + encodeURIComponent(label));
    if (params.length) uri += "?" + params.join("&");
    return uri;
  }

  function renderQR(el, text) {
    el.innerHTML = "";
    try {
      const qr = qrcode(0, "M");
      qr.addData(text);
      qr.make();
      el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } catch (e) {
      el.textContent = "QR error: " + e.message;
    }
  }

  // Verify that a txid pays >= minBtc to CFG.btcAddress (client-side, no server)
  async function verifyPayment(txid, minBtc) {
    const t = (txid || "").trim();
    if (!/^[0-9a-fA-F]{64}$/.test(t)) {
      return { ok: false, reason: "That doesn't look like a valid transaction ID (64 hex chars)." };
    }
    const r = await fetch(CFG.txApi + t);
    if (r.status === 404) return { ok: false, reason: "Transaction not found yet. Wait for it to be broadcast, then retry." };
    if (!r.ok) return { ok: false, reason: "Could not reach the block explorer. Try again shortly." };
    const tx = await r.json();

    const minSats = Math.floor(minBtc * 1e8 * 0.995); // 0.5% tolerance
    let paid = 0;
    for (const v of (tx.vout || [])) {
      const addr = v.scriptpubkey_address;
      if (addr === CFG.btcAddress) paid += v.value || 0;
    }
    if (paid < minSats) {
      return { ok: false, reason: "Payment to this address is " + paid + " sats; need ~" + minSats + " sats." };
    }
    const conf = (tx.status && tx.status.confirmed) ? tx.status.block_height : null;
    return { ok: true, paidSats: paid, confirmed: !!conf, block: conf };
  }

  // Secure delivery via the Cloudflare Worker: server verifies on-chain and
  // returns a short-lived signed download URL. Files never live in the public site.
  function workerBase() {
    return (CFG.workerUrl || "").replace(/\/+$/, "");
  }

  function workerDownloadUrl(u) {
    const s = String(u || "");
    if (/^https:\/\//i.test(s)) return s;
    if (/^\/[^/]/.test(s)) return workerBase() + s;
    return "";
  }

  async function workerPurchase(productId, txid) {
    const base = workerBase();
    if (!base) return { ok: false, reason: "Secure delivery not configured." };
    let r;
    try {
      r = await fetch(base + "/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, txid: (txid || "").trim() }),
      });
    } catch {
      return { ok: false, reason: "Could not reach the delivery server. Try again." };
    }
    let d = {};
    try { d = await r.json(); } catch {}
    if (!r.ok) return { ok: false, reason: d.reason || ("Server error (" + r.status + ").") };
    if (!d.ok) return { ok: false, reason: d.reason || "Payment could not be verified." };
    return { ok: true, downloadUrl: workerDownloadUrl(d.downloadUrl), paidSats: d.paid || null, confirmed: !!d.confirmed };
  }

  window.Shelf = {
    fmtUsd, fmtSats, getBtcPrice, usdToBtc, btcUri, renderQR,
    verifyPayment, workerPurchase,
    isSecure: () => !!workerBase(), CFG,
  };
})();
