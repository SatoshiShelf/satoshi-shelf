# Satoshi Shelf

Bitcoin-paid digital product store.
Live: https://xghabra.github.io/satoshi-shelf/

## Layout

Public site files live at the repo root (index.html, product.html, launcher.html,
404.html, custom.html, robots.txt, sitemap.xml, assets/, previews/).

Everything else is source-only and is served 404 by GitHub Pages:

- `__marketing_src/` — private marketing notes and drafts
- `tools/` — generators (covers, previews, sitemap, site build)
- `worker/` — Cloudflare Worker: payment verification + pay-gated delivery
- `products/` — plaintext paid deliverables (gitignored, never published)
- `dist/` — Cloudflare publish bundle (gitignored)
- `secure/` — local encrypted mirror (gitignored, never published)

## Security model

- Deliverables are AES-256-GCM encrypted; the key lives only in the deployed
  Worker (and the gitignored `worker/.shelfkey`). Plaintext never leaves disk.
- `/verify` checks a real on-chain payment to the store address before issuing a
  signed, 15-minute download token.
- The storefront is served with a strict CSP, `frame-ancestors 'none'`,
  nosniff, and HSTS.
