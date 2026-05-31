/**
 * Audio + haptics facade. Sounds are loaded lazily from assets/sfx; missing
 * files simply no-op so the game runs before final audio is dropped in.
 * Respects the user's mute / haptics settings from metaStore.
 */
import * as Haptics from 'expo-haptics';

import { useMetaStore } from '../state/metaStore';

type SfxName = 'flip' | 'coin' | 'death' | 'milestone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sounds: Partial<Record<SfxName, any>> = {};
let loaded = false;

export async function initAudio(): Promise<void> {
  if (loaded) return;
  loaded = true;
  try {
    const { Audio } = await import('expo-av');
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Asset wiring is intentionally guarded: drop files into assets/sfx and
    // map them here. Until then, playback is a safe no-op.
    // sounds.flip = (await Audio.Sound.createAsync(require('../assets/sfx/flip.mp3'))).sound;
  } catch {
    // audio unavailable — ignore
  }
}

export function playSfx(name: SfxName): void {
  if (useMetaStore.getState().muted) return;
  const snd = sounds[name];
  if (snd) {
    try {
      void snd.replayAsync();
    } catch {
      // ignore playback errors
    }
  }
}

export function haptic(kind: 'light' | 'heavy' = 'light'): void {
  if (!useMetaStore.getState().hapticsOn) return;
  try {
    void Haptics.impactAsync(
      kind === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Light,
    );
  } catch {
    // haptics unsupported — ignore
  }
}
