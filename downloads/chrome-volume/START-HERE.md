# Swap Grayscale for Volume Booster on Chrome (about 15 minutes)

Claude can't click in your Chrome dashboard from the cloud, so these are the only clicks left. Everything to upload or paste is in this folder.

Before you start: on extensionpay.com, check that an extension called `quiet-volume-booster` exists. If it doesn't, create it with that exact ID and the price $4.99 one-time.

## 1. Free a slot (Grayscale)
1. Dashboard → Quiet Grayscale. If it says "Pending review", click **Cancel review**.
2. **Distribution** tab → **Unpublish**. Do NOT delete. Existing users keep it; it stays on Edge.

## 2. Add Volume Booster
1. Dashboard → **New item** → upload `volume-1.0.1-chrome.zip`.
   - If it still says you're at the limit: republish Grayscale (Distribution → Publish) and tell Claude. Nothing is lost.
2. **Store listing** tab: paste the Description from `listing-to-paste.md`. Category: Tools. Language: English.
   Images: icon from the package is fine (or `store-icon-512.png`), screenshots 1–3, `promo-tile-440x280.png`, `marquee-1400x560.png`.
   Homepage: https://quietutilities-bit.github.io/ · Support: https://quietutilities-bit.github.io/#contact
3. **Privacy** tab: copy Single purpose, the permission justifications, remote code = No, and the Data usage answers from `listing-to-paste.md`. Privacy policy URL: https://quietutilities-bit.github.io/privacy.html
4. **Distribution** tab: Free, in-app purchases yes, Public, all regions.
5. **Test instructions** (if asked): paste "Notes for certification / reviewers".
6. **Submit for review**.

## 3. Tell Claude the new item ID
It's the 32-letter ID under the item name (like egekfgjldnkhelljbpbkgebahhgikjej). Claude then wires up auto-updates and switches the website links.
