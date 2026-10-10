// Generates src/embedded.js from ../assets/products.js + the product files.
// The generated file is gitignored — it must never be committed to the public repo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, ".."); // repo root (parent of worker/)

const src = fs.readFileSync(path.join(root, "assets/products.js"), "utf8");
globalThis.window = globalThis;
const { PRODUCTS, STORE_CONFIG } = new Function(
  src + "\nreturn { PRODUCTS: window.PRODUCTS, STORE_CONFIG: window.STORE_CONFIG };"
)();

const out = {};
for (const p of PRODUCTS) {
  const entry = { name: p.name, priceUsd: p.priceUsd };
  if (p.url) {
    // External delivery link (e.g. MediaFire). Served only after verified payment.
    entry.url = p.url;
  } else {
    const fp = path.join(root, p.file);
    if (!fs.existsSync(fp)) {
      console.error("missing product file:", p.file);
      process.exit(1);
    }
    const buf = fs.readFileSync(fp);
    entry.filename = path.basename(p.file);
    entry.contentType = p.file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream";
    entry.b64 = buf.toString("base64");
  }
  out[p.id] = entry;
}

const content =
  `export const CONFIG = ${JSON.stringify({ btcAddress: STORE_CONFIG.btcAddress })};\n` +
  `export const PRODUCTS = ${JSON.stringify(out)};\n`;

fs.writeFileSync(path.join(here, "src", "embedded.js"), content);
console.log("embedded products:", Object.keys(out).join(", "));
