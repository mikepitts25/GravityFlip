import { create } from 'zustand';

import { loadJSON, saveJSON } from './storage';

export type SkinId = 'default' | 'robot' | 'ghost' | 'rocket' | 'cat';

interface MetaPersisted {
  bestScore: number;
  coins: number;
  deaths: number;
  ownedSkins: SkinId[];
  equippedSkin: SkinId;
  muted: boolean;
  hapticsOn: boolean;
}

interface MetaState extends MetaPersisted {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  recordDeath: (score: number, coinsEarned: number) => void;
  ownsSkin: (id: SkinId) => boolean;
  grantSkin: (id: SkinId) => void;
  equipSkin: (id: SkinId) => void;
  toggleMute: () => void;
  toggleHaptics: () => void;
}

const KEY = 'gravityflip.meta.v1';

const defaults: MetaPersisted = {
  bestScore: 0,
  coins: 0,
  deaths: 0,
  ownedSkins: ['default'],
  equippedSkin: 'default',
  muted: false,
  hapticsOn: true,
};

function persist(state: MetaPersisted): void {
  void saveJSON<MetaPersisted>(KEY, {
    bestScore: state.bestScore,
    coins: state.coins,
    deaths: state.deaths,
    ownedSkins: state.ownedSkins,
    equippedSkin: state.equippedSkin,
    muted: state.muted,
    hapticsOn: state.hapticsOn,
  });
}

export const useMetaStore = create<MetaState>((set, get) => ({
  ...defaults,
  hydrated: false,

  hydrate: async () => {
    const data = await loadJSON<MetaPersisted>(KEY, defaults);
    // Guarantee the default skin is always owned.
    const ownedSkins = Array.from(new Set<SkinId>(['default', ...data.ownedSkins]));
    set({ ...data, ownedSkins, hydrated: true });
  },

  recordDeath: (score, coinsEarned) =>
    set((s) => {
      const next: MetaState = {
        ...s,
        deaths: s.deaths + 1,
        coins: s.coins + coinsEarned,
        bestScore: Math.max(s.bestScore, Math.floor(score)),
      };
      persist(next);
      return next;
    }),

  ownsSkin: (id) => get().ownedSkins.includes(id),

  grantSkin: (id) =>
    set((s) => {
      if (s.ownedSkins.includes(id)) return s;
      const next = { ...s, ownedSkins: [...s.ownedSkins, id] };
      persist(next);
      return next;
    }),

  equipSkin: (id) =>
    set((s) => {
      if (!s.ownedSkins.includes(id)) return s;
      const next = { ...s, equippedSkin: id };
      persist(next);
      return next;
    }),

  toggleMute: () =>
    set((s) => {
      const next = { ...s, muted: !s.muted };
      persist(next);
      return next;
    }),

  toggleHaptics: () =>
    set((s) => {
      const next = { ...s, hapticsOn: !s.hapticsOn };
      persist(next);
      return next;
    }),
}));
