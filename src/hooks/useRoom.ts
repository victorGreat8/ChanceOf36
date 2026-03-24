import { useState, useEffect } from 'react';
import {
  doc, setDoc, getDoc, onSnapshot, updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db } from '../firebase';

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
}

function generateCode(): string {
  // Skip I and O to avoid confusion with 1 and 0
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function useRoom(uid: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen to room changes in real-time
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (snap) => {
      if (snap.exists()) setRoom(snap.data() as Room);
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
    // If player already in room (e.g. rejoining after refresh), just reattach
    if (!data.players.some(p => p.uid === uid)) {
      await updateDoc(ref, {
        players: arrayUnion({ uid, name: playerName.trim(), joinedAt: Date.now() }),
      });
    }
    setRoomCode(upper);
    setLoading(false);
  };

  const startGame = async () => {
    if (!roomCode) return;
    await updateDoc(doc(db, 'rooms', roomCode), { status: 'playing' });
  };

  const leaveRoom = () => {
    setRoom(null);
    setRoomCode(null);
    setError(null);
  };

  return { room, roomCode, error, loading, createRoom, joinRoom, startGame, leaveRoom };
}
