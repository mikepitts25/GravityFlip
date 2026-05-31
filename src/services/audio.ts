/**
 * Audio + haptics facade. Sounds are loaded lazily from assets/sfx; missing
 * files simply no-op so the game runs before final audio is dropped in.
 * Respects the user's mute / haptics settings from metaStore.
 */
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { useMetaStore } from '../state/metaStore';

type SfxName = 'flip' | 'coin' | 'death' | 'milestone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sounds: Partial<Record<SfxName, any>> = {};
let loaded = false;

export function initAudio(): void {
  if (loaded) return;
  loaded = true;
  try {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Asset wiring: drop .mp3 files into assets/sfx/ and map here, e.g.:
    // Audio.Sound.createAsync(require('../../assets/sfx/flip.mp3'))
    //   .then(({ sound }) => { sounds.flip = sound; });
  } catch {
    // audio unavailable — ignore
  }
}

export function playSfx(name: SfxName): void {
  if (useMetaStore.getState().muted) return;
  const snd = sounds[name];
  if (snd) {
    try {
      snd.replayAsync();
    } catch {
      // ignore
    }
  }
}

export function haptic(kind: 'light' | 'heavy' = 'light'): void {
  if (!useMetaStore.getState().hapticsOn) return;
  try {
    Haptics.impactAsync(
      kind === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // haptics unsupported — ignore
  }
}
