/**
 * Audio + haptics facade. Sounds are loaded lazily from assets/sfx; missing
 * files simply no-op so the game runs before final audio is dropped in.
 * Respects the user's mute / haptics settings from metaStore.
 */
import { useMetaStore } from '../state/metaStore';

type SfxName = 'flip' | 'coin' | 'death' | 'milestone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sounds: Partial<Record<SfxName, any>> = {};
let loaded = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Haptics: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Haptics = require('expo-haptics');
} catch {
  // haptics unavailable
}

export function initAudio(): void {
  if (loaded) return;
  loaded = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Audio } = require('expo-av');
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    // Asset wiring: drop files into assets/sfx and map them here.
    // sounds.flip = Audio.Sound.createAsync(require('../assets/sfx/flip.mp3')).sound;
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
      // ignore playback errors
    }
  }
}

export function haptic(kind: 'light' | 'heavy' = 'light'): void {
  if (!useMetaStore.getState().hapticsOn) return;
  if (!Haptics) return;
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
