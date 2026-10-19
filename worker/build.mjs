// Generates src/embedded.js (gitignored) from ../assets/products.js + the product
// files. Every deliverable is AES-256-GCM encrypted; the decryption key lives only
// in the (private) worker bundle / Worker secret, so the plaintext files are never
// public.
//
// A local mirror of the encrypted catalog is written to ../secure/catalog.enc.json
// for backup only. That path is gitignored and must NEVER be deployed or published:
// the Worker already embeds its own copy, and publishing ciphertext of every paid
// file only hands attackers material to attack offline.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { encryptBytes } from "./src/lib.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, ".."); // repo root (parent of worker/)

// ---- Encryption key (private; never committed) -----------------------------
const keyFile = path.join(here, ".shelfkey");
let KEY = process.env.SHELF_KEY;
if (!KEY) {
  if (fs.existsSync(keyFile)) {
    KEY = fs.readFileSync(keyFile, "utf8").trim();
  } else {
    KEY = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
    fs.writeFileSync(keyFile, KEY + "\n", { mode: 0o600 });
    console.log("generated new shelf key -> worker/.shelfkey  (KEEP THIS PRIVATE / back it up)");
  }
}

// ---- Read the catalog ------------------------------------------------------
const src = fs.readFileSync(path.join(root, "assets/products.js"), "utf8");
globalThis.window = globalThis;
const { PRODUCTS, STORE_CONFIG } = new Function(
  src + "\nreturn { PRODUCTS: window.PRODUCTS, STORE_CONFIG: window.STORE_CONFIG };"
)();

// ---- Encrypt every deliverable --------------------------------------------
const out = {};
const secure = { generated: new Date().toISOString(), algo: "AES-256-GCM", count: 0, products: {} };

for (const p of PRODUCTS) {
  const fp = path.join(root, p.file);
  if (!fs.existsSync(fp)) {
    console.error("missing product file:", p.file);
    process.exit(1);
  }
  const meta = {
    name: p.name,
    priceUsd: p.priceUsd,
    filename: path.basename(p.file),
    contentType: p.file.endsWith(".html")
      ? "text/html; charset=utf-8"
      : "application/octet-stream",
  };
  const { iv, ct } = await encryptBytes(KEY, new Uint8Array(fs.readFileSync(fp)));
  out[p.id] = { ...meta, iv, ct };
  secure.products[p.id] = { ...meta, iv, ct };
}
secure.count = Object.keys(secure.products).length;

const content =
  `export const CONFIG = ${JSON.stringify({ btcAddress: STORE_CONFIG.btcAddress, key: KEY })};\n` +
  `export const PRODUCTS = ${JSON.stringify(out)};\n`;

fs.writeFileSync(path.join(here, "src", "embedded.js"), content);

// Local-only encrypted mirror, for backup. Gitignored — never publish this:
// it holds the ciphertext of every paid deliverable.
fs.mkdirSync(path.join(root, "secure"), { recursive: true });
fs.writeFileSync(path.join(root, "secure", "catalog.enc.json"), JSON.stringify(secure));

console.log("encrypted products:", Object.keys(out).length);
