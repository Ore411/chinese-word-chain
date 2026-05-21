import type { WordEntry } from './gameRules';

let cachedDictionary: WordEntry[] | null = null;
let wordMap: Map<string, WordEntry> | null = null;

export async function loadDictionary(): Promise<WordEntry[]> {
  if (cachedDictionary) return cachedDictionary;

  const res = await fetch('/dictionary.json');
  if (!res.ok) throw new Error('Failed to load dictionary');
  const data: WordEntry[] = await res.json();

  cachedDictionary = data;
  wordMap = new Map(data.map(e => [e.simplified, e]));

  return data;
}

export function lookupWord(simplified: string): WordEntry | undefined {
  return wordMap?.get(simplified);
}

export function isDictionaryLoaded(): boolean {
  return cachedDictionary !== null;
}
