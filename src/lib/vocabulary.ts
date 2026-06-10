// Local "My Vocabulary" store. Persists saved words in localStorage only —
// no backend, no accounts. All access is SSR-safe and wrapped so a corrupt
// or unavailable store never throws.

export interface SavedWord {
  hanzi: string;
  pinyin: string;
  meaning: string;
  savedAt: string; // ISO timestamp
}

const STORAGE_KEY = 'myVocabulary';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Return all saved words, newest first. Never throws. */
export function getSavedWords(): SavedWord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (w): w is SavedWord =>
        w && typeof w.hanzi === 'string' && typeof w.pinyin === 'string' &&
        typeof w.meaning === 'string' && typeof w.savedAt === 'string',
    );
  } catch {
    return [];
  }
}

function writeAll(words: SavedWord[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // Quota or serialization error — ignore; vocabulary is non-critical.
  }
}

/**
 * Save new words, skipping any whose hanzi is already stored.
 * Returns the number of words actually added.
 */
export function saveWords(words: Omit<SavedWord, 'savedAt'>[]): number {
  if (words.length === 0) return 0;
  const existing = getSavedWords();
  const have = new Set(existing.map(w => w.hanzi));
  const now = new Date().toISOString();
  const additions: SavedWord[] = [];
  for (const w of words) {
    if (have.has(w.hanzi)) continue;
    have.add(w.hanzi);
    additions.push({ hanzi: w.hanzi, pinyin: w.pinyin, meaning: w.meaning, savedAt: now });
  }
  if (additions.length === 0) return 0;
  // Newest first.
  writeAll([...additions, ...existing]);
  return additions.length;
}

/** Delete a saved word by its hanzi. */
export function deleteWord(hanzi: string): void {
  const remaining = getSavedWords().filter(w => w.hanzi !== hanzi);
  writeAll(remaining);
}

/** True if a word with this hanzi is already saved. */
export function isSaved(hanzi: string): boolean {
  return getSavedWords().some(w => w.hanzi === hanzi);
}
