/**
 * In-app purchase facade for react-native-iap.
 *
 * Loads the native module lazily; without it (Expo Go / local dev) purchases
 * resolve as granted so the unlock flow is testable end-to-end. Entitlements
 * are persisted client-side via metaStore (receipt validation is a v1.1 TODO).
 */
import { useMetaStore, type SkinId } from '../state/metaStore';
import { SKINS, SKIN_PACK_SKU } from '../game/skins';
import { track } from './analytics';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let IAP: any = null;
let available = false;

const ALL_SKUS = [
  ...Object.values(SKINS)
    .map((s) => s.sku)
    .filter((s): s is string => Boolean(s)),
  SKIN_PACK_SKU,
];

export async function initIAP(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import('react-native-iap');
    IAP = mod;
    await mod.initConnection();
    await mod.getProducts({ skus: ALL_SKUS });
    available = true;
  } catch {
    available = false;
  }
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

/** Purchase a product. Returns true once the entitlement is granted. */
export async function purchase(sku: string): Promise<boolean> {
  track('iap_viewed', { sku });
  if (!available) {
    grantSku(sku); // dev/testing path
    return true;
  }
  try {
    await IAP.requestPurchase({ sku });
    grantSku(sku); // for consumables/validation, finishTransaction in a listener
    return true;
  } catch {
    return false;
  }
}

/** Restore previously bought products (App Store / Play). */
export async function restore(): Promise<void> {
  if (!available) return;
  try {
    const purchases = await IAP.getAvailablePurchases();
    for (const p of purchases) grantSku(p.productId);
  } catch {
    // ignore
  }
}
