import type { WordEntry } from './gameRules';
import { findValidMoves } from './gameRules';

export function pickComputerMove(
  prev: WordEntry,
  dictionary: WordEntry[],
  usedWords: Set<string>,
  maxHskLevel?: number | null,
): WordEntry | null {
  let pool = findValidMoves(prev, dictionary, usedWords);
  if (pool.length === 0) return null;

  if (maxHskLevel != null) {
    const filtered = pool.filter(w => w.hskLevel !== null && w.hskLevel <= maxHskLevel);
    // Fall back to full pool if no HSK-tagged moves are available
    if (filtered.length > 0) pool = filtered;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
