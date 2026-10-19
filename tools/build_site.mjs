import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist");

const FILES = ["index.html", "product.html", "launcher.html", "404.html", "custom.html", "robots.txt"];
const DIRS = ["assets", "previews"];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

let n = 0;
for (const f of FILES) {
  const src = join(ROOT, f);
  if (existsSync(src)) { cpSync(src, join(OUT, f)); n++; }
}
for (const d of DIRS) {
  const src = join(ROOT, d);
  if (existsSync(src)) { cpSync(src, join(OUT, d), { recursive: true }); n++; }
}
console.log("built dist/ with", n, "entries ->", OUT);
