// Pro license check.
// TEST_BUILD unlocks Pro so it can be tried before payments are connected.
// Before publishing: set TEST_BUILD = false and wire ExtensionPay (ExtPay.js) here.
export const TEST_BUILD = true;
export const PRO_PRICE = '$9.99 one-time';

export async function isPro() {
  if (TEST_BUILD) return true;
  try {
    const { proUnlocked } = await chrome.storage.local.get('proUnlocked');
    return Boolean(proUnlocked);
  } catch {
    return false;
  }
}

export async function openUpgrade() {
  // Placeholder until ExtensionPay is connected: extpay.openPaymentPage()
  return false;
}
