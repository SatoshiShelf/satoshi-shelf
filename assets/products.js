// Satoshi Shelf — product catalog
// Price in USD; BTC amount is computed live at checkout from mempool.space.
window.STORE_CONFIG = {
  storeName: "Satoshi Shelf",
  tagline: "Digital goods. Paid in Bitcoin. No middlemen.",
  btcAddress: "bc1qrs6leywqgu56d8h5ynw9ynn0e3kdduantgd2z3",
  // Secure delivery: paste your deployed Cloudflare Worker URL here.
  // Leave "" to fall back to public file links (not secure).
  workerUrl: "https://satoshi-shelf.xghabra.workers.dev",
  contact: "satoshishelf@proton.me",
  priceApi: "https://mempool.space/api/v1/prices",
  txApi: "https://mempool.space/api/tx/",
};

window.PRODUCTS = [
  {
    id: "playbook",
    name: "The Zero-Budget Online Income Playbook",
    tagline: "Turn a laptop and $0 into a real side income.",
    priceUsd: 9,
    emoji: "\u{1F4D8}",
    file: "products/zero-budget-playbook.html",
    summary:
      "A no-fluff guide to launching a legitimate online income project with zero upfront money: picking a niche, creating a digital product, accepting crypto, and getting the first buyers.",
    bullets: [
      "Pick a sellable niche fast",
      "Create a product in a weekend",
      "Accept Bitcoin with no fees or middlemen",
      "Where to find your first buyers",
      "Free hosting, free tools, zero budget",
    ],
  },
  {
    id: "starter-kit",
    name: "Bitcoin Storefront Starter Kit",
    tagline: "The exact code running this store. Yours to deploy.",
    priceUsd: 19,
    emoji: "\u{1F6D2}",
    file: "products/bitcoin-storefront-starter-kit.html",
    summary:
      "A working, dependency-free static storefront with live BTC pricing, QR checkout, on-chain payment verification, and instant digital delivery. Drop it on GitHub Pages in 5 minutes.",
    bullets: [
      "Plain HTML/CSS/JS — no build step",
      "Live BTC price conversion",
      "QR + bitcoin: URI checkout",
      "On-chain txid verification (mempool.space)",
      "Free hosting instructions included",
    ],
  },
  {
    id: "ai-toolkit",
    name: "AI Automation Toolkit",
    tagline: "Scripts + prompt templates that save hours every week.",
    priceUsd: 12,
    emoji: "\u{1F916}",
    file: "products/ai-automation-toolkit.html",
    summary:
      "A curated pack of copy-paste prompts and small scripts for automating repetitive work: writing, research, data cleanup, and content pipelines.",
    bullets: [
      "50+ battle-tested prompt templates",
      "Content repurposing pipeline",
      "Data cleanup scripts",
      "Outreach + lead-gen templates",
      "Works with any major AI model",
    ],
  },
];
