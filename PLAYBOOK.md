# New product playbook

How Quiet Utilities builds a new Chrome extension. The product studio task follows this exactly.

## 1. Pick an idea (evidence first)
- Sources: users stranded by removed/abandoned extensions (Manifest V2 removal Aug 2026), low-rated popular extensions (3.x stars with many users), repeated requests on forums/Reddit snapshots, customer emails to quietutilities@gmail.com.
- Score each idea 1–5 on: demand evidence, weak competition, fits "small tool, one job", can be built and tested here, sensible Pro upgrade (or deliberately free to build reputation).
- Reject: anything that scrapes/automates sites against their terms, touches passwords/finance/health data, needs a server, copies another extension's name/brand/code, or duplicates an existing Quiet Utilities tool (Chrome Web Store spam policy).
- Record the idea, evidence links and score in PIPELINE.md.

## 2. Build
- Folder: `extensions/<short-name>/` with `extension/`, `tests/`, `store/`, `package.json`, `store.json` (`extensionId` empty until the owner creates the item).
- Manifest V3, minimum permissions, optional permissions for anything broad. No remote code, no analytics.
- Paid tools: copy the ExtensionPay setup from bulk-downloader (`lib/ExtPay.js`, `lib/config.js`, `lib/license.js`). Leave `EXTPAY_ID` empty and `TEST_BUILD: true` until the owner registers it in ExtensionPay.
- Style: the Quiet Utilities look (see bulk-downloader popup.css): calm green accent, light + dark mode, plain language.

## 3. Test (must all pass)
- Unit tests for every pure function (`node --test`).
- End-to-end in real Chromium with a local test site (`xvfb-run -a npm run e2e`), covering the main job, edge cases, restricted pages, free vs Pro, dark mode screenshot.
- Look at the screenshots yourself before calling it done.

## 4. Store kit
- `store/listing.md`: description, category, permission justifications, privacy answers, distribution (copy the bulk-downloader format).
- 3 screenshots 1280×800, promo tile 440×280, marquee 1400×560, 128 icon.
- Add the product to the website repo (quietutilities-bit/quietutilities-bit.github.io): a card on the home page; update privacy.html if the new tool handles data differently.

## 5. Hand over
- Set PIPELINE.md status to `ready-for-owner`, push, and report to the owner: what it does, why (evidence), price, permissions, and the exact steps for them (create store item, ExtensionPay registration if paid). Never create store items, register payments, or submit for review yourself.
- After the owner sends the item ID: put it in `store.json`; future updates ship through `.github/workflows/publish.yml`.
