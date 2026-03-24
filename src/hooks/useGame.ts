import { useState, useCallback, useEffect } from 'react';
import type { Player, Die, GamePhase } from '../types/game';

function rollDie(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function makeDice(count: number, startId = 0): Die[] {
  return Array.from({ length: count }, (_, i) => ({
    id: startId + i,
    value: null,
    kept: false,
    selected: false,
    rolling: false,
  }));
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  phase: GamePhase;
  // Main phase dice
  dice: Die[];
  currentSum: number;
  // Bonus phase
  bonusDice: Die[];
  bonusTarget: number;        // The number to aim for (score - 30)
  bonusRoundHits: number;     // Target dice found this bonus round
  totalBonusMinus: number;    // Total minus points dealt this entire bonus phase
  message: string;
}

const INITIAL_STATE: GameState = {
  players: [],
  currentPlayerIndex: 0,
  phase: 'setup',
  dice: makeDice(6),
  currentSum: 0,
  bonusDice: [],
  bonusTarget: 0,
  bonusRoundHits: 0,
  totalBonusMinus: 0,
  message: '',
};

function loadSavedState(): GameState {
  try {
    const saved = localStorage.getItem('chanceof36_game');
    if (!saved) return INITIAL_STATE;
    const parsed: GameState = JSON.parse(saved);
    // Reset any mid-animation state so dice don't appear stuck
    return {
      ...parsed,
      dice: parsed.dice.map(d => ({ ...d, rolling: false })),
      bonusDice: parsed.bonusDice.map(d => ({ ...d, rolling: false })),
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function useGame() {
  const [state, setState] = useState<GameState>(loadSavedState);

  // Save to localStorage whenever state changes (skip the empty setup screen)
  useEffect(() => {
    if (state.phase !== 'setup') {
      localStorage.setItem('chanceof36_game', JSON.stringify(state));
    }
  }, [state]);

  // ─── Setup ────────────────────────────────────────────────────────────────

  const startGame = useCallback((playerDefs: Array<{ name: string; isComputer: boolean }>) => {
    localStorage.removeItem('chanceof36_game');
    const players: Player[] = playerDefs.map((def, i) => ({
      id: i,
      name: def.name,
      points: 30,
      eliminated: false,
      isComputer: def.isComputer,
    }));
    setState({
      ...INITIAL_STATE,
      players,
      phase: 'pre-roll',
      dice: makeDice(6),
      message: `${players[0].name}'s turn — Roll the dice!`,
    });
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function activePlayers(players: Player[]) {
    return players.filter(p => !p.eliminated);
  }

  function nextPlayerIndex(players: Player[], current: number): number {
    let next = (current + 1) % players.length;
    while (players[next].eliminated) {
      next = (next + 1) % players.length;
    }
    return next;
  }

  function applyPointsDelta(players: Player[], index: number, delta: number): Player[] {
    return players.map((p, i) =>
      i === index ? { ...p, points: Math.max(0, p.points + delta) } : p
    );
  }

  function checkEliminations(players: Player[]): Player[] {
    return players.map(p => ({
      ...p,
      eliminated: p.eliminated || p.points <= 0,
    }));
  }

  function clearRolling(field: 'dice' | 'bonusDice') {
    setTimeout(() => {
      setState(s => ({
        ...s,
        [field]: (s[field] as Die[]).map(d => ({ ...d, rolling: false })),
      }));
    }, 450);
  }

  // ─── Main Phase ───────────────────────────────────────────────────────────

  const roll = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'pre-roll') return prev;
      const newDice = prev.dice.map(d =>
        d.kept ? d : { ...d, value: rollDie(), rolling: true, selected: false }
      );
      return { ...prev, phase: 'selecting', dice: newDice, message: 'Tap dice to select, then press "Keep"' };
    });
    clearRolling('dice');
  }, []);

  const toggleDieSelect = useCallback((id: number) => {
    setState(prev => {
      if (prev.phase !== 'selecting') return prev;
      return {
        ...prev,
        dice: prev.dice.map(d =>
          d.id === id && !d.kept ? { ...d, selected: !d.selected } : d
        ),
      };
    });
  }, []);

  const keepSelected = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'selecting') return prev;
      const selectedCount = prev.dice.filter(d => !d.kept && d.selected).length;
      if (selectedCount === 0) return prev;

      const newDice = prev.dice.map(d =>
        d.selected ? { ...d, kept: true, selected: false } : d
      );
      if (!newDice.every(d => d.kept)) {
        return { ...prev, dice: newDice, phase: 'pre-roll', message: 'Roll the remaining dice!' };
      }

      const sum = newDice.reduce((acc, d) => acc + (d.value ?? 0), 0);
      return processMainResult(prev, newDice, sum);
    });
  }, []);

  // Used by AI to keep a specific set of dice in one atomic step
  const keepSpecificDice = useCallback((ids: number[]) => {
    setState(prev => {
      if (prev.phase !== 'selecting') return prev;
      const idSet = new Set(ids);
      const newDice = prev.dice.map(d =>
        !d.kept && idSet.has(d.id) ? { ...d, kept: true, selected: false } : { ...d, selected: false }
      );
      if (!newDice.every(d => d.kept)) {
        return { ...prev, dice: newDice, phase: 'pre-roll', message: 'Roll the remaining dice!' };
      }
      const sum = newDice.reduce((acc, d) => acc + (d.value ?? 0), 0);
      return processMainResult(prev, newDice, sum);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function processMainResult(prev: GameState, finalDice: Die[], sum: number): GameState {
    const name = prev.players[prev.currentPlayerIndex].name;

    if (sum < 30) {
      const loss = 30 - sum;
      const updated = checkEliminations(applyPointsDelta(prev.players, prev.currentPlayerIndex, -loss));
      return {
        ...prev, dice: finalDice, players: updated, currentSum: sum, phase: 'result',
        message: `${name} scored ${sum} — loses ${loss} point${loss !== 1 ? 's' : ''}!`,
      };
    }
    if (sum === 30) {
      return {
        ...prev, dice: finalDice, currentSum: sum, phase: 'result',
        message: `${name} scored exactly 30 — nothing happens!`,
      };
    }

    // sum > 30 — bonus phase
    const target = sum - 30;
    return {
      ...prev,
      dice: finalDice,
      currentSum: sum,
      bonusDice: makeDice(6),
      bonusTarget: target,
      bonusRoundHits: 0,
      totalBonusMinus: 0,
      phase: 'bonus-pre-roll',
      message: `${name} scored ${sum}! Bonus round — roll 6 dice and aim for ${target}s!`,
    };
  }

  // ─── Bonus Phase ──────────────────────────────────────────────────────────
  // Roll remaining bonus dice (starts with all 6).
  // Target dice are auto-kept. Re-roll non-target dice.
  // Zero targets in a throw → bonus ends immediately.

  const rollBonus = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'bonus-pre-roll') return prev;

      const { bonusTarget, currentPlayerIndex } = prev;
      const name = prev.players[currentPlayerIndex].name;

      // Roll only the non-kept dice
      const rolled = prev.bonusDice.map(d =>
        d.kept ? d : { ...d, value: rollDie(), rolling: true }
      );

      // Count new hits (only from dice we just rolled)
      const hits = rolled.filter(d => !prev.bonusDice.find(pd => pd.id === d.id)?.kept && d.value === bonusTarget).length;
      const minus = hits * bonusTarget;
      const newTotal = prev.totalBonusMinus + minus;

      // Auto-keep target dice
      const afterKeep = rolled.map(d =>
        !d.kept && d.value === bonusTarget ? { ...d, kept: true } : d
      );

      const remaining = afterKeep.filter(d => !d.kept).length;

      if (hits === 0) {
        const summary = newTotal > 0
          ? `No ${bonusTarget}s — bonus over. ${name} dealt ${newTotal} pts total.`
          : `No ${bonusTarget}s — bonus round ends.`;
        return { ...prev, bonusDice: rolled, phase: 'bonus-result', bonusRoundHits: 0, message: summary };
      }

      // Apply damage to opponents
      let updatedPlayers = prev.players;
      prev.players.forEach((_, i) => {
        if (i !== currentPlayerIndex && !prev.players[i].eliminated) {
          updatedPlayers = applyPointsDelta(updatedPlayers, i, -minus);
        }
      });
      updatedPlayers = checkEliminations(updatedPlayers);

      const continueMsg = remaining > 0
        ? `${hits} × ${bonusTarget} = −${minus} pts! Roll ${remaining} remaining!`
        : `${hits} × ${bonusTarget} = −${minus} pts! No dice left — bonus over!`;

      return {
        ...prev,
        bonusDice: afterKeep,
        players: updatedPlayers,
        bonusRoundHits: hits,
        totalBonusMinus: newTotal,
        phase: 'bonus-result',
        message: continueMsg,
      };
    });
    clearRolling('bonusDice');
  }, []);

  const continueBonusRound = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'bonus-result') return prev;

      // If no hits last throw, or no remaining dice → advance to next player
      if (prev.bonusRoundHits === 0 || prev.bonusDice.every(d => d.kept)) {
        return advanceToNextPlayer(prev);
      }

      // Still have non-kept dice to roll
      const remaining = prev.bonusDice.filter(d => !d.kept).length;
      return {
        ...prev,
        phase: 'bonus-pre-roll',
        message: `Roll ${remaining} dice — aim for ${prev.bonusTarget}s!`,
      };
    });
  }, []);

  // ─── Between turns ────────────────────────────────────────────────────────

  const nextTurn = useCallback(() => {
    setState(prev => {
      if (prev.phase !== 'result') return prev;
      return advanceToNextPlayer(prev);
    });
  }, []);

  function advanceToNextPlayer(prev: GameState): GameState {
    const active = activePlayers(prev.players);
    if (active.length <= 1) {
      const winner = active[0];
      return {
        ...prev,
        phase: 'game-over',
        message: winner ? `${winner.name} wins with ${winner.points} points!` : 'Game over!',
      };
    }
    const next = nextPlayerIndex(prev.players, prev.currentPlayerIndex);
    return {
      ...prev,
      currentPlayerIndex: next,
      phase: 'pre-roll',
      dice: makeDice(6),
      bonusDice: [],
      bonusTarget: 0,
      currentSum: 0,
      bonusRoundHits: 0,
      totalBonusMinus: 0,
      message: `${prev.players[next].name}'s turn — Roll the dice!`,
    };
  }

  const newGame = useCallback(() => {
    localStorage.removeItem('chanceof36_game');
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    startGame,
    roll,
    toggleDieSelect,
    keepSelected,
    keepSpecificDice,
    rollBonus,
    continueBonusRound,
    nextTurn,
    newGame,
  };
}
