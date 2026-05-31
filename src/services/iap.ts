/**
 * In-app purchase facade for react-native-iap.
 *
 * Currently a stub — purchases auto-grant so the skin unlock flow is testable
 * in Expo Go. To enable real purchases:
 *   1. npm install react-native-iap
 *   2. Build a dev client
 *   3. Uncomment the require + init block in initIAP()
 */
import { useMetaStore, type SkinId } from '../state/metaStore';
import { SKINS, SKIN_PACK_SKU } from '../game/skins';
import { track } from './analytics';

const available = false;

export function initIAP(): void {
  // Native module not installed — stub mode.
  // When react-native-iap is installed + dev client built:
  //   IAP = require('react-native-iap');
  //   IAP.initConnection();
  //   available = true;
}

function skinForSku(sku: string): SkinId | null {
  const entry = Object.values(SKINS).find((s) => s.sku === sku);
  return entry ? entry.id : null;
}

function grantSku(sku: string): void {
  const { grantSkin } = useMetaStore.getState();
  if (sku === SKIN_PACK_SKU) {
    (Object.keys(SKINS) as SkinId[]).forEach(grantSkin);
  } else {
    const id = skinForSku(sku);
    if (id) grantSkin(id);
  }
  track('iap_purchased', { sku });
}

export async function purchase(sku: string): Promise<boolean> {
  track('iap_viewed', { sku });
  if (!available) {
    grantSku(sku); // dev/testing: auto-grant
    return true;
  }
  return false;
}

export async function restore(): Promise<void> {
  // no-op without native module
}
