import cedict from 'cedict-json';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface Syllable {
  initial: string;
  final: string;
  tone: number | null;
}

interface WordEntry {
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

// Order matters: check longer initials first
const INITIALS_2 = ['zh', 'ch', 'sh'];
const INITIALS_1 = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];

function parseSyllable(raw: string): Syllable {
  const lower = raw.toLowerCase();
  const toneMatch = lower.match(/([1-5])$/);
  const tone = toneMatch ? parseInt(toneMatch[1]) : null;
  const withoutTone = toneMatch ? lower.slice(0, -1) : lower;

  for (const init of INITIALS_2) {
    if (withoutTone.startsWith(init)) {
      return { initial: init, final: withoutTone.slice(init.length), tone };
    }
  }
  for (const init of INITIALS_1) {
    if (withoutTone.startsWith(init)) {
      return { initial: init, final: withoutTone.slice(init.length), tone };
    }
  }
  // Vowel-initial syllable (a, e, o, etc.)
  return { initial: '', final: withoutTone, tone };
}

const CHINESE_ONLY = /^[一-鿿]+$/;

const hskVocabPath = join(process.cwd(), 'scripts', 'hsk-vocab.json');
const HSK_VOCAB: Record<string, number> = JSON.parse(readFileSync(hskVocabPath, 'utf-8'));

const results: WordEntry[] = [];
const seen = new Set<string>();

for (const entry of cedict as { traditional: string; simplified: string; pinyin: string; english: string[] }[]) {
  const { simplified, traditional, pinyin, english } = entry;

  if (!CHINESE_ONLY.test(simplified)) continue;

  const wordLength = [...simplified].length;
  if (wordLength < 2 || wordLength > 6) continue;

  // Skip duplicates (keep first occurrence)
  if (seen.has(simplified)) continue;
  seen.add(simplified);

  const syllables = pinyin.trim().split(/\s+/);
  if (syllables.length !== wordLength) continue;

  const firstSyllable = parseSyllable(syllables[0]);
  const lastSyllable = parseSyllable(syllables[syllables.length - 1]);

  const englishFull = Array.isArray(english) ? english.join('; ') : String(english);
  const englishStr = englishFull.length > 100 ? englishFull.slice(0, 97) + '…' : englishFull;
  const isChengyu = wordLength === 4 &&
    englishFull.toLowerCase().split(/[/;,]/).some(d => /\bidiom\b|\bchengyu\b|\bset phrase\b/i.test(d));

  results.push({
    simplified,
    pinyin,
    english: englishStr,
    firstChar: simplified[0],
    lastChar: simplified[wordLength - 1],
    firstSyllable,
    lastSyllable,
    wordLength,
    isChengyu,
    hskLevel: HSK_VOCAB[simplified] ?? null,
  });
}

const outPath = join(process.cwd(), 'public', 'dictionary.json');
writeFileSync(outPath, JSON.stringify(results));

console.log(`Wrote ${results.length} entries to ${outPath}`);
console.log(`Chengyu: ${results.filter(e => e.isChengyu).length}`);
console.log(`By length: ${[2,3,4,5,6].map(n => `${n}-char: ${results.filter(e => e.wordLength === n).length}`).join(', ')}`);
console.log(`HSK coverage: ${[1,2,3,4,5,6].map(l => `L${l}: ${results.filter(e => e.hskLevel === l).length}`).join(', ')}, untagged: ${results.filter(e => e.hskLevel === null).length}`);
