'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import usePartySocket from 'partysocket/react';
import { playSound } from '@/lib/sound';

export interface Syllable {
  initial: string;
  final: string;
  tone: number | null;
}

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

export interface ChainEntry {
  word: WordEntry;
  playedBy: string;
  playerIndex: number;
  score: number;
  connectionType: string;
  speedMultiplier: number;
}

export interface PlayerInfo {
  id: string;
  clientId: string;
  index: number;
  name: string;
  score: number;
  connected: boolean;
  timeouts: number;
  lives: number;
  eliminated: boolean;
}

export type RoomStatus = 'waiting' | 'playing' | 'game-over';
export type ChainMode = 'learner' | 'advanced';

export interface RoomState {
  status: RoomStatus;
  hostId: string | null;
  players: PlayerInfo[];
  chain: ChainEntry[];
  currentPlayerIndex: number;
  turnSeconds: number;
  timeRemaining: number;
  targetScore: number | null;
  livesMode: number | null;
  chainMode: ChainMode;
  gameOverReason: string | null;
  lastMoveError: string | null;
}

type ServerMsg =
  | { type: 'state'; state: RoomState }
  | { type: 'error'; message: string };

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'chinese-word-chain.ore411.partykit.dev';

function getOrCreateClientId(): string {
  const key = 'mpClientId';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export function useMultiplayerGame(roomId: string, playerName: string) {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  // Sound effects: track chain growth so we only chime on our own accepted move.
  const prevChainLenRef = useRef(0);
  const myClientIdRef = useRef('');
  useEffect(() => {
    if (typeof window !== 'undefined') myClientIdRef.current = getOrCreateClientId();
  }, []);

  const ws = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onOpen() {
      // On reconnect, PartySocket re-fires onOpen — re-send join so server
      // can re-associate the new connection id with this player's slot.
      if (joined) {
        const clientId = getOrCreateClientId();
        ws.send(JSON.stringify({ type: 'join', name: playerName, clientId }));
      }
    },
    onMessage(e: MessageEvent) {
      const msg = JSON.parse(e.data as string) as ServerMsg;
      if (msg.type === 'state') {
        const chain = msg.state.chain;
        // Chime when a new word was added and it was our own move.
        if (chain.length > prevChainLenRef.current) {
          const last = chain[chain.length - 1];
          const me = msg.state.players.find(p => p.clientId === myClientIdRef.current);
          if (me && last.playerIndex === me.index) playSound('correct');
        }
        prevChainLenRef.current = chain.length;
        setRoomState(msg.state);
        setServerError(null);
      } else if (msg.type === 'error') {
        // Server rejected our move (invalid word / connection / not your turn).
        playSound('wrong');
        setServerError(msg.message);
      }
    },
  });

  useEffect(() => {
    if (!ws || joined) return;
    const id = (ws as unknown as { id: string }).id;
    if (!id) return;
    setMyId(id);
    const clientId = getOrCreateClientId();
    ws.send(JSON.stringify({ type: 'join', name: playerName, clientId }));
    setJoined(true);
  }, [ws, playerName, joined]);

  const submitWord = useCallback((word: string) => {
    ws?.send(JSON.stringify({ type: 'play', word }));
  }, [ws]);

  const startGame = useCallback((turnSeconds: 15 | 30 | 60, targetScore: number | null, livesMode: number | null, chainMode: ChainMode = 'learner') => {
    ws?.send(JSON.stringify({ type: 'start', turnSeconds, targetScore, livesMode, chainMode }));
  }, [ws]);

  const rematch = useCallback(() => {
    ws?.send(JSON.stringify({ type: 'rematch' }));
  }, [ws]);

  // Identify ourselves by clientId (stable across reconnects), not connection id
  const [myClientId] = useState(() => typeof window !== 'undefined' ? getOrCreateClientId() : '');
  const myPlayer = roomState?.players.find(p => p.clientId === myClientId);
  const myIndex: number | null = myPlayer?.index ?? null;
  const isMyTurn = myIndex !== null && roomState?.currentPlayerIndex === myIndex;
  const isHost = myPlayer !== undefined && roomState?.hostId === myPlayer.id;

  return { roomState, myId, myIndex, isMyTurn, isHost, serverError, submitWord, startGame, rematch };
}
