# Satoshi Shelf

A dependency-free static storefront that sells digital products for Bitcoin.
No framework, no build step, no backend, no payment processor.

## Files

```
index.html              Store home + product grid
product.html            Product page + checkout (reads ?id=<product>)
assets/products.js      YOUR catalog + BTC address  <- edit this
assets/app.js           BTC price, QR, tx verification
assets/qrcode.js        Vendored QR generator
assets/style.css        Theme
products/*.html         Deliverable files (what buyers download)
```

## Configure

Edit `assets/products.js`:

- `btcAddress` — your public Bitcoin receive address (never a seed/private key)
- `products[]` — id, name, tagline, priceUsd, file, bullets

Prices are in USD; the store fetches the live BTC/USD rate from
`mempool.space` and converts at checkout.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy free (GitHub Pages)

```bash
git init
git add .
git commit -m "Satoshi Shelf store"
git branch -M main
git remote add origin https://github.com/xGhabra/satoshi-shelf.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root)**.
Live at `https://xghabra.github.io/satoshi-shelf/`.

## How checkout works

1. Buyer clicks **Pay with Bitcoin** → live BTC amount + QR (`bitcoin:` URI).
2. Buyer pays on-chain to `btcAddress`.
3. Buyer pastes the **transaction ID**.
4. The page verifies via `https://mempool.space/api/tx/<txid>` that a vout pays
   `btcAddress` at least the required amount, then unlocks the download.

### Security note

Client-side verification is fine for low-priced digital goods. A determined
visitor can read the JS to find the file URL directly. For higher-value
products add a serverless verifier (Cloudflare Worker / Vercel function) that
checks the tx server-side and returns a one-time signed link.

## Safety

- **Never** commit a seed phrase or private key. Only the public address goes here.
- Sell only content you own the rights to.
- Income from sales may be taxable where you live — keep records.
