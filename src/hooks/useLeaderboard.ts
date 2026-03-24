import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export interface LeaderboardEntry {
  uid: string;
  name: string;
  wins: number;
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), orderBy('wins', 'desc'), limit(3));
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ uid: d.id, ...(d.data() as { name: string; wins: number }) })));
    });
    return unsub;
  }, []);

  return entries;
}
