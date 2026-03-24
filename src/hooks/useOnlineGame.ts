import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { Die, Player } from '../types/game';
import type { GameState } from './useGame';
import type { Room } from './useRoom';

// ─── Pure helpers (same logic as useGame.ts) ──────────────────────────────────

function rollDie() { return Math.floor(Math.random() * 6) + 1; }

function makeDice(count: number): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i, value: null, kept: false, selected: false, rolling: false,
  }));
}

function applyPointsDelta(players: Player[], index: number, delta: number): Player[] {
  return players.map((p, i) =>
    i === index ? { ...p, points: Math.max(0, p.points + delta) } : p
  );
}

function checkEliminations(players: Player[]): Player[] {
  return players.map(p => ({ ...p, eliminated: p.eliminated || p.points <= 0 }));
}

function nextPlayerIndex(players: Player[], current: number): number {
  let next = (current + 1) % players.length;
  while (players[next].eliminated) next = (next + 1) % players.length;
  return next;
}

function activePlayers(players: Player[]) {
  return players.filter(p => !p.eliminated);
}

function advanceToNextPlayer(state: GameState): GameState {
  const active = activePlayers(state.players);
  if (active.length <= 1) {
    const winner = active[0];
    return { ...state, phase: 'game-over', message: winner ? `${winner.name} wins!` : 'Game over!' };
  }
  const next = nextPlayerIndex(state.players, state.currentPlayerIndex);
  return {
    ...state,
    currentPlayerIndex: next,
    phase: 'pre-roll',
    dice: makeDice(6),
    bonusDice: [],
    bonusTarget: 0,
    currentSum: 0,
    bonusRoundHits: 0,
    totalBonusMinus: 0,
    message: `${state.players[next].name}'s turn — Roll the dice!`,
  };
}

function processMainResult(state: GameState, finalDice: Die[], sum: number): GameState {
  const name = state.players[state.currentPlayerIndex].name;
  if (sum < 30) {
    const loss = 30 - sum;
    const updated = checkEliminations(applyPointsDelta(state.players, state.currentPlayerIndex, -loss));
    return { ...state, dice: finalDice, players: updated, currentSum: sum, phase: 'result',
      message: `${name} scored ${sum} — loses ${loss} point${loss !== 1 ? 's' : ''}!` };
  }
  if (sum === 30) {
    return { ...state, dice: finalDice, currentSum: sum, phase: 'result',
      message: `${name} scored exactly 30 — nothing happens!` };
  }
  const target = sum - 30;
  return { ...state, dice: finalDice, currentSum: sum, bonusDice: makeDice(6),
    bonusTarget: target, bonusRoundHits: 0, totalBonusMinus: 0, phase: 'bonus-pre-roll',
    message: `${name} scored ${sum}! Bonus round — roll 6 dice and aim for ${target}s!` };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnlineGame(room: Room | null, roomCode: string | null, uid: string) {
  // Local-only: which bonus dice the current player has selected
  const [localSelected, setLocalSelected] = useState<Set<number>>(new Set());

  const gameState = room?.gameState ?? null;

  // Is it this player's turn?
  const isMyTurn = !!(
    gameState &&
    room?.playerOrder &&
    room.playerOrder[gameState.currentPlayerIndex] === uid &&
    gameState.phase !== 'game-over'
  );

  // Merge local selection into the display state so the UI shows selected dice
  const displayState: GameState | null = gameState ? {
    ...gameState,
    dice: gameState.dice.map(d => ({
      ...d,
      selected: !d.kept && localSelected.has(d.id),
    })),
  } : null;

  // Write new game state to Firestore
  const write = useCallback(async (newState: GameState) => {
    if (!roomCode) return;
    await updateDoc(doc(db, 'rooms', roomCode), { gameState: newState });
  }, [roomCode]);

  // ─── Main phase ─────────────────────────────────────────────────────────────

  const roll = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'pre-roll') return;
    const newDice = gameState.dice.map(d =>
      d.kept ? d : { ...d, value: rollDie(), rolling: false }
    );
    await write({ ...gameState, phase: 'selecting', dice: newDice, message: 'Select dice to keep, then press Keep' });
  }, [gameState, isMyTurn, write]);

  const toggleDieSelect = useCallback((id: number) => {
    if (!isMyTurn || gameState?.phase !== 'selecting') return;
    const die = gameState?.dice.find(d => d.id === id);
    if (!die || die.kept) return;
    setLocalSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, [isMyTurn, gameState]);

  const keepSelected = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'selecting') return;
    if (localSelected.size === 0) return;
    setLocalSelected(new Set());

    const newDice = gameState.dice.map(d =>
      localSelected.has(d.id) ? { ...d, kept: true, selected: false } : { ...d, selected: false }
    );
    if (!newDice.every(d => d.kept)) {
      await write({ ...gameState, dice: newDice, phase: 'pre-roll', message: 'Roll the remaining dice!' });
      return;
    }
    const sum = newDice.reduce((a, d) => a + (d.value ?? 0), 0);
    await write(processMainResult(gameState, newDice, sum));
  }, [gameState, isMyTurn, localSelected, write]);

  // ─── Bonus phase ────────────────────────────────────────────────────────────

  const rollBonus = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'bonus-pre-roll') return;
    const { bonusTarget, currentPlayerIndex } = gameState;
    const name = gameState.players[currentPlayerIndex].name;

    const rolled = gameState.bonusDice.map(d =>
      d.kept ? d : { ...d, value: rollDie(), rolling: false }
    );
    const hits = rolled.filter(d => !gameState.bonusDice.find(pd => pd.id === d.id)?.kept && d.value === bonusTarget).length;
    const minus = hits * bonusTarget;
    const newTotal = gameState.totalBonusMinus + minus;
    const afterKeep = rolled.map(d => !d.kept && d.value === bonusTarget ? { ...d, kept: true } : d);
    const remaining = afterKeep.filter(d => !d.kept).length;

    if (hits === 0) {
      const summary = newTotal > 0
        ? `No ${bonusTarget}s — bonus over. ${name} dealt ${newTotal} pts total.`
        : `No ${bonusTarget}s — bonus round ends.`;
      await write({ ...gameState, bonusDice: rolled, phase: 'bonus-result', bonusRoundHits: 0, message: summary });
      return;
    }

    let updatedPlayers = gameState.players;
    gameState.players.forEach((_, i) => {
      if (i !== currentPlayerIndex && !gameState.players[i].eliminated) {
        updatedPlayers = applyPointsDelta(updatedPlayers, i, -minus);
      }
    });
    updatedPlayers = checkEliminations(updatedPlayers);

    const msg = remaining > 0
      ? `${hits} × ${bonusTarget} = −${minus} pts! Roll ${remaining} remaining!`
      : `${hits} × ${bonusTarget} = −${minus} pts! No dice left — bonus over!`;

    await write({ ...gameState, bonusDice: afterKeep, players: updatedPlayers,
      bonusRoundHits: hits, totalBonusMinus: newTotal, phase: 'bonus-result', message: msg });
  }, [gameState, isMyTurn, write]);

  const continueBonusRound = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'bonus-result') return;
    if (gameState.bonusRoundHits === 0 || gameState.bonusDice.every(d => d.kept)) {
      await write(advanceToNextPlayer(gameState));
      return;
    }
    const remaining = gameState.bonusDice.filter(d => !d.kept).length;
    await write({ ...gameState, phase: 'bonus-pre-roll',
      message: `Roll ${remaining} dice — aim for ${gameState.bonusTarget}s!` });
  }, [gameState, isMyTurn, write]);

  const nextTurn = useCallback(async () => {
    if (!gameState || !isMyTurn || gameState.phase !== 'result') return;
    await write(advanceToNextPlayer(gameState));
  }, [gameState, isMyTurn, write]);

  return { displayState, isMyTurn, roll, toggleDieSelect, keepSelected, rollBonus, continueBonusRound, nextTurn };
}
