// Shared settings for the popup, background and page script.
// TEST_BUILD unlocks Pro without paying (for development only).
// The publish workflow refuses to run while it is true.
// REVIEW_URL is filled in per store by scripts/build.mjs (empty = rating prompt off).
self.QV_CONFIG = {
  TEST_BUILD: false,
  EXTPAY_ID: 'quiet-volume-booster',
  PRO_PRICE: '$4.99 one-time',
  REVIEW_URL: '',
  MORE_URL: 'https://quietutilities-bit.github.io/#extensions',
  REVIEW_AFTER_USES: 3
};
