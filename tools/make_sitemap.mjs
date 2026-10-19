import { writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://xghabra.github.io/satoshi-shelf/";

// products.js assigns window.STORE_CONFIG / window.PRODUCTS — evaluate it to read them.
const window = {};
new Function("window", readFileSync(join(ROOT, "assets", "products.js"), "utf8"))(window);

const today = new Date().toISOString().slice(0, 10);

const urls = [
  { loc: BASE, priority: "1.0" },
  { loc: BASE + "custom.html", priority: "0.6" },
  { loc: BASE + "launcher.html", priority: "0.5" },
];
for (const p of window.PRODUCTS) {
  urls.push({ loc: BASE + "product.html?id=" + encodeURIComponent(p.id), priority: "0.8", lastmod: today });
}

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc>` +
        (u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : "") +
        `<priority>${u.priority}</priority></url>`
    )
    .join("\n") +
  `\n</urlset>\n`;

writeFileSync(join(ROOT, "sitemap.xml"), xml);
console.log("sitemap.xml written:", urls.length, "URLs");
