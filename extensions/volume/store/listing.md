# Quiet Volume Booster — store listing

**Name:** Quiet Volume Booster
**Short summary (132 max):** Boost quiet videos up to 600%, or turn loud sites down. Remembers each site. No ads, no tracking.
**Category:** Productivity (Chrome: Tools if asked for a sub-category; Edge: Productivity; Firefox: Photos, Music & Videos)
**Language:** English (United States)
**Price:** Free, with an optional one-time Pro upgrade inside the extension
**Homepage URL:** https://quietutilities-bit.github.io/
**Support URL:** https://quietutilities-bit.github.io/#contact
**Privacy policy URL:** https://quietutilities-bit.github.io/privacy.html

## Description (Chrome and Firefox — paste as is)

Some videos are too quiet even at full volume. Some sites are always too loud. Quiet Volume Booster fixes both, and remembers each site so you only set it once.

HOW IT WORKS
• Boost up to 600%, or turn a site down below 100%. One slider, plus quick buttons for 50%, 100%, 200%, 400% and 600%.
• Remembers each site. Set YouTube to 200% and a loud news site to 50%, and they come back that way every visit.
• A built-in limiter keeps big boosts from crackling.
• The toolbar badge shows the level of the tab you're on.
• Alt+Shift+Up and Alt+Shift+Down turn any site up or down. Change the shortcuts any time in your browser's shortcut settings.
• Every website (optional): apply your settings everywhere without opening the popup first.
• Light and dark popup that follows your system.

PRO, ONE-TIME PURCHASE, NO SUBSCRIPTION
• Equalizer presets: Bass boost, Voice clarity, Treble boost, and Less bass for late nights.
• Mono: both channels in each ear, for one earbud or hearing in one ear.
• Quiet hours: set a time window (say 10 PM to 7 AM) and a maximum level, so nothing blasts late at night.

PRIVATE BY DESIGN
• All sound processing happens in your browser.
• No ads, no analytics, no tracking.
• Asks for access only to the sites you set. "Every website" asks for all sites only when you turn it on, and you can take that back any time.

Good to know: browser pages and store pages can't be changed. A few sites stream audio from another server in a way browsers don't allow extensions to touch; the popup tells you when that happens, and the site's own volume keeps working.

Made by Quiet Utilities, makers of small browser tools that do one job well.

Questions or ideas: quietutilities@gmail.com

## Description for Edge (under 1,000 characters)

See `description-short-under-1000-chars.txt` in the downloads folder.

## Single purpose (Chrome privacy tab)

Quiet Volume Booster changes the volume of audio and video on websites (boost above 100% or lower it), remembered per site.

## Permission justifications (Chrome privacy tab)

- **storage:** Saves the user's volume level for each site they set, their sound settings, and whether they have bought Pro. Stored locally in the browser.
- **activeTab:** Lets the popup and the keyboard shortcuts change the volume of the current tab right away, when the user clicks the icon or presses the shortcut, without needing access to every site.
- **scripting:** Runs the small script that routes the page's audio through a volume and equalizer control on the tab the user opened the extension on, and registers it for the sites the user has set so the level comes back on later visits.
- **Host permissions (optional, requested at runtime):** When the user sets a level on a site, the extension asks for access to that one site only, so the level is remembered after reloads. "<all_urls>" is requested only if the user turns on "Every website". Both can be revoked at any time.
- **Host permission `https://extensionpay.com/*` (content script):** Confirms a Pro purchase on the ExtensionPay payment page so Pro unlocks right after payment.
- **Remote code:** No, I am not using remote code. All code is packaged in the extension.

## Data usage (Chrome privacy tab)

- Personally identifiable information: YES (the buyer's email address, entered on the ExtensionPay checkout page, only if they buy Pro)
- Financial and payment information: YES (entered on the Stripe/ExtensionPay checkout page only if they buy Pro; never seen or stored by the extension)
- Everything else (health, authentication, personal communications, location, web history, user activity, website content): NO

Tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

## Distribution
- Payments: Free (Pro is sold inside the extension through ExtensionPay). If asked about in-app purchases, answer yes.
- Visibility: Public. Regions: All regions.

## Search terms (Edge, up to 7)

volume booster, volume up, sound booster, equalizer, bass boost, louder audio, volume control

## Notes for certification / reviewers

Quiet Volume Booster changes the volume of HTML audio and video on web pages using the Web Audio API. It makes no network requests except the optional ExtensionPay purchase check. To test: open any page with a video (for example a YouTube video), start playing, click the toolbar icon and press 200% or drag the slider. The video gets louder right away; the browser asks for access to that one site so the level is remembered after reload. Pro features (equalizer, mono, quiet hours) are locked until purchase; they can be reviewed from the popup. Browser pages and store pages can't be changed, and the popup says so.

## Store images (upload order)

1. `screenshot-1-1280x800.png` — boost a quiet video
2. `screenshot-2-1280x800.png` — every site remembers its level
3. `screenshot-3-1280x800.png` — Pro sound: equalizer, mono, quiet hours (dark mode)
- Small promo tile: `promo-small-440x280.png`
- Marquee: `promo-large-1400x560.png`
- Chrome store icon: `icon-128x128.png`; Edge logo: `logo-300x300-edge.png`
