import type { SkinId } from '../state/metaStore';

export type SkinShape = 'square' | 'blob' | 'triangle' | 'cat';

export interface SkinDef {
  id: SkinId;
  name: string;
  shape: SkinShape;
  color: string; // neon body
  glow: string; // glow halo
  price: number; // USD; 0 = free/default
  sku?: string; // store product id
}

export const SKINS: Record<SkinId, SkinDef> = {
  default: { id: 'default', name: 'Pulse', shape: 'square', color: '#27e8ff', glow: '#27e8ff', price: 0 },
  robot: { id: 'robot', name: 'Robot', shape: 'square', color: '#8aff5b', glow: '#8aff5b', price: 0.99, sku: 'skin_robot' },
  ghost: { id: 'ghost', name: 'Ghost', shape: 'blob', color: '#c08bff', glow: '#c08bff', price: 0.99, sku: 'skin_ghost' },
  rocket: { id: 'rocket', name: 'Rocket', shape: 'triangle', color: '#ff8a3d', glow: '#ff8a3d', price: 0.99, sku: 'skin_rocket' },
  cat: { id: 'cat', name: 'Cat', shape: 'cat', color: '#ff5bd1', glow: '#ff5bd1', price: 0.99, sku: 'skin_cat' },
};

export const SKIN_PACK_SKU = 'skin_pack_all';
export const SKIN_PACK_PRICE = 2.99;

export const PURCHASABLE_SKINS: SkinDef[] = Object.values(SKINS).filter((s) => s.price > 0);
