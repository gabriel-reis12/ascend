// ============================================================================
// ASCEND — Game Feel, Synthesized Web Audio SFX & Haptic Feedback Engine
// ============================================================================
// Zero external audio assets required. Respects user preferences and
// prefers-reduced-motion accessibility settings.
// ============================================================================

export const ASCEND_SOUND_KEY = 'ascend_sound_enabled';
export const ASCEND_HAPTICS_KEY = 'ascend_haptics_enabled';

export type GameFeelEventType = 'questComplete' | 'bossHit' | 'levelUp' | 'rankUp';

let memorySoundEnabled = true;
let memoryHapticsEnabled = true;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return memorySoundEnabled;
  try {
    const raw = window.localStorage.getItem(ASCEND_SOUND_KEY);
    return raw === null ? memorySoundEnabled : raw === 'true';
  } catch {
    return memorySoundEnabled;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  memorySoundEnabled = Boolean(enabled);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ASCEND_SOUND_KEY, String(Boolean(enabled)));
    window.dispatchEvent(new CustomEvent('ascend:gamefeel-prefs-changed'));
  } catch {
    // Ignore storage errors
  }
}

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return memoryHapticsEnabled;
  try {
    const raw = window.localStorage.getItem(ASCEND_HAPTICS_KEY);
    return raw === null ? memoryHapticsEnabled : raw === 'true';
  } catch {
    return memoryHapticsEnabled;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  memoryHapticsEnabled = Boolean(enabled);
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ASCEND_HAPTICS_KEY, String(Boolean(enabled)));
    window.dispatchEvent(new CustomEvent('ascend:gamefeel-prefs-changed'));
  } catch {
    // Ignore storage errors
  }
}

export function isReducedMotionPreferred(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function triggerHaptic(type: GameFeelEventType | 'light'): void {
  if (typeof window === 'undefined' || !isHapticsEnabled() || isReducedMotionPreferred()) {
    return;
  }
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'questComplete':
        navigator.vibrate([18, 30, 28]);
        break;
      case 'bossHit':
        navigator.vibrate([35, 25, 55]);
        break;
      case 'levelUp':
        navigator.vibrate([40, 40, 60, 40, 110]);
        break;
      case 'rankUp':
        navigator.vibrate([60, 40, 80, 40, 140, 50, 180]);
        break;
    }
  } catch {
    // Ignore unsupported vibration environments
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    void sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playSynthesizedSfx(type: GameFeelEventType): void {
  if (typeof window === 'undefined' || !isSoundEnabled()) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'questComplete') {
      // Crisp 2-note tactical confirmation chime
      const notes = [523.25, 659.25]; // C5 -> E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.065 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.065 + 0.14);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.15);
      });
      return;
    }

    if (type === 'bossHit') {
      // Tactical energy strike pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.16);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
      return;
    }

    if (type === 'levelUp') {
      // 4-note ascending Hunter Level-Up fanfare
      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.075;
        const duration = idx === notes.length - 1 ? 0.28 : 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.1, start + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.01);
      });
      return;
    }

    if (type === 'rankUp') {
      // 5-note Sovereign Rank Promotion harmonic sequence
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.085;
        const duration = idx === notes.length - 1 ? 0.42 : 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration + 0.02);
      });
    }
  } catch {
    // Ignore Web Audio API restrictions when autoplay is blocked
  }
}

export function triggerGameFeel(type: GameFeelEventType): void {
  triggerHaptic(type);
  playSynthesizedSfx(type);
}
