import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useProfile(uid: string) {
  const [savedName, setSavedName] = useState<string>('');

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'players', uid)).then(snap => {
      if (snap.exists()) setSavedName((snap.data() as { name: string }).name);
    });
  }, [uid]);

  const saveName = (name: string) => {
    if (!uid || !name.trim()) return;
    setDoc(doc(db, 'players', uid), { name: name.trim() });
    setSavedName(name.trim());
  };

  return { savedName, saveName };
}
