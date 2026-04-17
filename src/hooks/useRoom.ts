import { useState, useEffect } from 'react';
import {
  doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState } from './useGame';
import type { Player, Die } from '../types/game';

export interface RoomPlayer {
  uid: string;
  name: string;
  joinedAt: number;
}

export interface Room {
  code: string;
  hostUid: string;
  status: 'lobby' | 'playing' | 'finished';
  players: RoomPlayer[];
  playerOrder?: string[];   // UIDs in turn order — set when game starts
  gameState?: GameState;    // full game state — set when game starts
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function makeDice(count: number): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i, value: null, kept: false, selected: false, rolling: false,
  }));
}

function buildInitialGameState(roomPlayers: RoomPlayer[]): GameState {
  const sorted = [...roomPlayers].sort((a, b) => a.joinedAt - b.joinedAt);
  const players: Player[] = sorted.map((p, i) => ({
    id: i, name: p.name, points: 30, eliminated: false, isComputer: false,
  }));
  return {
    players,
    currentPlayerIndex: 0,
    phase: 'pre-roll',
    dice: makeDice(6),
    currentSum: 0,
    bonusDice: [],
    bonusTarget: 0,
    bonusRoundHits: 0,
    totalBonusMinus: 0,
    message: `${players[0].name}'s turn — Roll the dice!`,
  };
}

export function useRoom(uid: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
      if (snap.exists()) setRoom(snap.data() as Room);
      else { setRoom(null); setRoomCode(null); }
    });
    return unsub;
  }, [roomCode]);

  const createRoom = async (playerName: string) => {
    setLoading(true);
    const code = generateCode();
    await setDoc(doc(db, 'rooms', code), {
      code,
      hostUid: uid,
      status: 'lobby',
      players: [{ uid, name: playerName.trim(), joinedAt: Date.now() }],
    });
    setRoomCode(code);
    setLoading(false);
  };

  const joinRoom = async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    const upper = code.trim().toUpperCase();
    const ref = doc(db, 'rooms', upper);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError('Room not found — check the code and try again.');
      setLoading(false);
      return;
    }
    const data = snap.data() as Room;
    if (data.status !== 'lobby') {
      setError('That game has already started.');
      setLoading(false);
      return;
    }
    if (data.players.length >= 6) {
      setError('Room is full (max 6 players).');
      setLoading(false);
      return;
    }
    if (!data.players.some(p => p.uid === uid)) {
      await updateDoc(ref, {
        players: arrayUnion({ uid, name: playerName.trim(), joinedAt: Date.now() }),
      });
    }
    setRoomCode(upper);
    setLoading(false);
  };

  const startGame = async () => {
    if (!roomCode || !room) return;
    const sorted = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);
    const playerOrder = sorted.map(p => p.uid);
    const gameState = buildInitialGameState(room.players);
    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'playing',
      playerOrder,
      gameState,
    });
  };

  const endGame = async () => {
    if (!roomCode) return;
    await deleteDoc(doc(db, 'rooms', roomCode));
  };

  const leaveRoom = async () => {
    if (roomCode && room && room.status === 'lobby') {
      if (room.hostUid === uid) {
        await deleteDoc(doc(db, 'rooms', roomCode));
      } else {
        const updatedPlayers = room.players.filter(p => p.uid !== uid);
        await updateDoc(doc(db, 'rooms', roomCode), { players: updatedPlayers });
      }
    }
    setRoom(null);
    setRoomCode(null);
    setError(null);
  };

  return { room, roomCode, error, loading, createRoom, joinRoom, startGame, endGame, leaveRoom };
}
