// Shared settings for the popup and background script.
// TEST_BUILD unlocks Pro for testing. The publish workflow refuses to run while it is true.
self.QBD_CONFIG = {
  TEST_BUILD: true,
  EXTPAY_ID: '',
  PRO_PRICE: '$9.99 one-time'
};
