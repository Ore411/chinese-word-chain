'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import type { GameMode, VsSubmode, ComputerLevel, ChainMode } from '@/hooks/useGameState';
import GameBoard from '@/components/GameBoard';
import ConfirmModal from '@/components/ConfirmModal';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = (searchParams.get('mode') ?? 'vs-computer') as GameMode;
  const submode = (searchParams.get('submode') ?? undefined) as VsSubmode | undefined;
  const levelParam = searchParams.get('level');
  const computerLevel = (levelParam ? parseInt(levelParam) : null) as ComputerLevel;
  const timeParam = searchParams.get('time');
  const initialTurnSeconds = timeParam && [15, 30, 60].includes(parseInt(timeParam)) ? parseInt(timeParam) : undefined;
  const chainModeParam = searchParams.get('chainMode');
  const chainMode: ChainMode = chainModeParam === 'advanced' ? 'advanced' : 'learner';

  const [modal, setModal] = useState<'quit' | 'review' | null>(null);

  const {
    dictionaryLoading, status, mode: activeMode, vsSubmode, computerLevel: activeComputerLevel,
    chainMode: activeChainMode,
    chain, scores, currentPlayer, timeRemaining, isComputerThinking, gameOverReason,
    lastMoveResult, lives, playerTurnsLeft, firstToXTarget, roundsTotal, turnSeconds,
    submitWord, startGame, resetGame, finishGame,
  } = useGameState();

  useEffect(() => {
    if (status === 'ready') {
      startGame(mode, submode, computerLevel, initialTurnSeconds, chainMode);
    }
  }, [status, mode, submode, computerLevel, initialTurnSeconds, chainMode, startGame]);

  if (dictionaryLoading || status === 'loading' || status === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <div className="text-4xl font-bold text-white">词语接龙</div>
        <div className="text-slate-400">Loading dictionary…</div>
        <div className="w-48 bg-slate-700 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  const isSolo = mode === 'solo';
  const isPlaying = status === 'playing';

  function handleMenuClick() {
    if (status === 'game-over') {
      router.push('/');
    } else {
      setModal('quit');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <header className="flex-none flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <button
          onClick={handleMenuClick}
          className="text-slate-400 hover:text-white text-sm transition-colors w-32 text-left"
        >
          ← Menu
        </button>

        <span className="text-white font-semibold tracking-wide">词语接龙</span>

        {/* Right slot: Stop & Review button for practice mode */}
        <div className="w-32 flex justify-end">
          {isSolo && isPlaying && (
            <button
              onClick={() => setModal('review')}
              className="text-xs bg-slate-700 hover:bg-amber-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              Stop & Review
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <GameBoard
          chain={chain}
          scores={scores}
          currentPlayer={currentPlayer}
          timeRemaining={timeRemaining}
          isComputerThinking={isComputerThinking}
          gameOverReason={gameOverReason}
          lastMoveResult={lastMoveResult}
          mode={mode}
          vsSubmode={vsSubmode}
          computerLevel={activeComputerLevel}
          chainMode={activeChainMode}
          turnSeconds={turnSeconds}
          status={status}
          lives={lives}
          playerTurnsLeft={playerTurnsLeft}
          firstToXTarget={firstToXTarget}
          roundsTotal={roundsTotal}
          onSubmit={submitWord}
          onReset={resetGame}
          onFinish={() => setModal('review')}
        />
      </div>

      {/* Quit game modal (all modes) */}
      <ConfirmModal
        open={modal === 'quit'}
        title="Quit game?"
        message="Are you sure you want to quit the game? Your current progress will be lost."
        confirmLabel="Quit game"
        onConfirm={() => router.push('/')}
        onCancel={() => setModal(null)}
      />

      {/* Stop practice & review modal (solo only) */}
      <ConfirmModal
        open={modal === 'review'}
        title="Stop practice?"
        message="Are you sure you want to stop and review the vocabulary?"
        confirmLabel="Review vocabulary"
        confirmClassName="w-full py-3 rounded-xl font-semibold text-white transition-colors bg-amber-600 hover:bg-amber-500"
        onConfirm={() => { setModal(null); finishGame(); }}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense>
      <GameContent />
    </Suspense>
  );
}
