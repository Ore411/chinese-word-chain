// Lightweight sound effects. Plays short local audio clips on game events.
// Designed to never throw: missing files, autoplay blocks, or SSR are all
// swallowed silently so gameplay is never interrupted.

export type SoundName = 'correct' | 'wrong';

const SOUND_FILES: Record<SoundName, string> = {
  correct: '/sounds/correct.wav',
  wrong: '/sounds/wrong.wav',
};

// Cache one Audio element per sound so we don't refetch on every play.
const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

let muted = false;

/** Globally enable/disable sound effects (e.g. for a settings toggle). */
export function setMuted(value: boolean): void {
  muted = value;
}

export function isMuted(): boolean {
  return muted;
}

/**
 * Play a short sound effect. Safe to call anywhere — never throws and
 * silently no-ops when audio is unavailable or blocked by the browser.
 */
export function playSound(name: SoundName): void {
  if (muted) return;
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;

  try {
    let audio = cache[name];
    if (!audio) {
      audio = new Audio(SOUND_FILES[name]);
      audio.preload = 'auto';
      audio.volume = 0.4;
      cache[name] = audio;
    }
    // Rewind so rapid repeats still play from the start.
    audio.currentTime = 0;
    const p = audio.play();
    // play() returns a promise in modern browsers; swallow rejections
    // (e.g. autoplay policy blocks before first user interaction).
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch {
    // Ignore — audio is non-essential.
  }
}
