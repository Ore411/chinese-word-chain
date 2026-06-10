'use client';

import { useState } from 'react';
import { saveWords } from '@/lib/vocabulary';

export interface SaveCandidate {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

interface Props {
  words: SaveCandidate[];
}

export default function SaveWordsPanel({ words }: Props) {
  // Default: all words selected.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(words.map(w => w.hanzi)));
  const [savedCount, setSavedCount] = useState<number | null>(null);

  if (words.length === 0) return null;

  const toggle = (hanzi: string) => {
    setSavedCount(null);
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(hanzi)) next.delete(hanzi);
      else next.add(hanzi);
      return next;
    });
  };

  const allSelected = selected.size === words.length;
  const toggleAll = () => {
    setSavedCount(null);
    setSelected(allSelected ? new Set() : new Set(words.map(w => w.hanzi)));
  };

  const handleSave = () => {
    const toSave = words.filter(w => selected.has(w.hanzi));
    const added = saveWords(toSave);
    setSavedCount(added);
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-6 flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700" />
        <span className="text-slate-400 text-sm font-medium">Review Words</span>
        <div className="flex-1 h-px bg-slate-700" />
      </div>

      <p className="text-slate-500 text-xs text-center -mt-1">
        Select the words you want to keep in My Vocabulary.
      </p>

      {/* Select all */}
      <button
        onClick={toggleAll}
        className="self-end text-xs text-slate-400 hover:text-white transition-colors"
      >
        {allSelected ? 'Deselect all' : 'Select all'}
      </button>

      {/* Word list */}
      <div className="flex flex-col gap-2">
        {words.map(w => {
          const isOn = selected.has(w.hanzi);
          return (
            <button
              key={w.hanzi}
              onClick={() => toggle(w.hanzi)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                isOn
                  ? 'bg-slate-800 border-emerald-600'
                  : 'bg-slate-800/40 border-slate-700 opacity-60'
              }`}
            >
              {/* Checkbox */}
              <span
                className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                  isOn ? 'bg-emerald-600 text-white' : 'border border-slate-600 text-transparent'
                }`}
              >
                ✓
              </span>

              {/* Hanzi + pinyin */}
              <div className="flex flex-col items-start shrink-0 min-w-[4.5rem]">
                <span className="text-white text-xl font-bold tracking-wide leading-tight">{w.hanzi}</span>
                <span className="text-slate-400 text-xs font-mono mt-0.5">{w.pinyin}</span>
              </div>

              {/* Meaning */}
              <span className="text-slate-300 text-sm leading-snug flex-1">{w.meaning}</span>
            </button>
          );
        })}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={selected.size === 0}
        className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
      >
        Save Selected Words{selected.size > 0 ? ` (${selected.size})` : ''}
      </button>

      {savedCount !== null && (
        <p className="text-center text-sm text-emerald-400">
          {savedCount > 0
            ? `Saved ${savedCount} word${savedCount === 1 ? '' : 's'} to My Vocabulary.`
            : 'Those words are already in My Vocabulary.'}
        </p>
      )}
    </div>
  );
}
