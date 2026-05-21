import type { Syllable } from './pinyin';
import { initialsCompatible, finalsRelation } from './pinyin';

export interface WordEntry {
  simplified: string;
  pinyin: string;
  english: string;
  firstChar: string;
  lastChar: string;
  firstSyllable: Syllable;
  lastSyllable: Syllable;
  wordLength: number;
  isChengyu: boolean;
  hskLevel: number | null;
}

export type ConnectionType =
  | 'exactChar'
  | 'exactInitialExactFinal'
  | 'familyInitialExactFinal'
  | 'exactInitialStrongFinal'
  | 'familyInitialStrongFinal'
  | 'weakMusicalFinal'
  | 'invalid';

export interface MoveResult {
  valid: boolean;
  connectionType: ConnectionType;
  baseScore: number;
  lengthBonus: number;
  chengyuBonus: number;
  totalScore: number;
}

const BASE_SCORES: Record<ConnectionType, number> = {
  exactChar: 10,
  exactInitialExactFinal: 8,
  familyInitialExactFinal: 6,
  exactInitialStrongFinal: 5,
  familyInitialStrongFinal: 3,
  weakMusicalFinal: 2,
  invalid: 0,
};

function lengthBonus(wordLength: number): number {
  if (wordLength === 2) return 0;
  if (wordLength === 3) return 2;
  if (wordLength === 4) return 4;
  return 6; // 5+
}

function classifyConnection(prev: WordEntry, next: WordEntry): ConnectionType {
  // Exact character takes priority
  if (prev.lastChar === next.firstChar) return 'exactChar';

  const ps = prev.lastSyllable;
  const ns = next.firstSyllable;

  const finalRel = finalsRelation(ps.final, ns.final);
  if (finalRel === 'invalid') return 'invalid';

  const exactInitial = ps.initial === ns.initial;
  const familyInitial = !exactInitial && initialsCompatible(ps.initial, ns.initial);

  if (!exactInitial && !familyInitial) return 'invalid';

  if (finalRel === 'weakMusical') return 'weakMusicalFinal';

  if (finalRel === 'exact') {
    return exactInitial ? 'exactInitialExactFinal' : 'familyInitialExactFinal';
  }

  // strongSimilar
  return exactInitial ? 'exactInitialStrongFinal' : 'familyInitialStrongFinal';
}

export function evaluateMove(
  prev: WordEntry,
  next: WordEntry,
  usedWords: Set<string>
): MoveResult {
  if (usedWords.has(next.simplified)) {
    return { valid: false, connectionType: 'invalid', baseScore: 0, lengthBonus: 0, chengyuBonus: 0, totalScore: 0 };
  }

  const connectionType = classifyConnection(prev, next);
  if (connectionType === 'invalid') {
    return { valid: false, connectionType, baseScore: 0, lengthBonus: 0, chengyuBonus: 0, totalScore: 0 };
  }

  const base = BASE_SCORES[connectionType];
  const lb = lengthBonus(next.wordLength);
  const cb = next.isChengyu ? 5 : 0;

  return {
    valid: true,
    connectionType,
    baseScore: base,
    lengthBonus: lb,
    chengyuBonus: cb,
    totalScore: base + lb + cb,
  };
}

export function findValidMoves(prev: WordEntry, dictionary: WordEntry[], usedWords: Set<string>): WordEntry[] {
  return dictionary.filter(entry => {
    if (usedWords.has(entry.simplified)) return false;
    return classifyConnection(prev, entry) !== 'invalid';
  });
}

export { BASE_SCORES };
