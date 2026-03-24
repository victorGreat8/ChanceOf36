import { useEffect } from 'react';
import { useGame } from './hooks/useGame';
import Setup from './components/Setup';
import GameBoard from './components/GameBoard';
import './index.css';

// AI strategy: keep highest-value dice, always trying to push sum > 30.
// Keeps all dice >= threshold, with threshold scaling based on kept sum so far.
function chooseKeptIds(dice: { id: number; value: number | null; kept: boolean }[]): number[] {
  const unrolled = dice.filter(d => !d.kept && d.value !== null);
  if (unrolled.length === 0) return [];

  const keptSum = dice.filter(d => d.kept).reduce((a, d) => a + (d.value ?? 0), 0);
  const remainingAfterThis = dice.filter(d => !d.kept).length;

  // How much more do we need to reach 30?
  const needed = Math.max(0, 31 - keptSum);
  // Average per remaining die
  const neededPerDie = remainingAfterThis > 0 ? needed / remainingAfterThis : 0;

  // Keep dice that are above the needed average (be greedy with good dice)
  const threshold = Math.max(3, Math.ceil(neededPerDie));
  let toKeep = unrolled.filter(d => (d.value ?? 0) >= threshold);

  // Must keep at least 1
  if (toKeep.length === 0) {
    const best = unrolled.reduce((a, b) => (b.value ?? 0) > (a.value ?? 0) ? b : a);
    toKeep = [best];
  }

  return toKeep.map(d => d.id);
}

export default function App() {
  const { state, startGame, roll, toggleDieSelect, keepSelected, keepSpecificDice, rollBonus, continueBonusRound, nextTurn, newGame } = useGame();

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isCpuTurn = currentPlayer?.isComputer && !currentPlayer.eliminated;

  // AI auto-play
  useEffect(() => {
    if (!isCpuTurn) return;

    let timer: ReturnType<typeof setTimeout>;

    if (state.phase === 'pre-roll') {
      timer = setTimeout(() => roll(), 700);
    } else if (state.phase === 'selecting') {
      timer = setTimeout(() => {
        const ids = chooseKeptIds(state.dice);
        keepSpecificDice(ids);
      }, 900);
    } else if (state.phase === 'bonus-pre-roll') {
      timer = setTimeout(() => rollBonus(), 700);
    } else if (state.phase === 'bonus-result') {
      timer = setTimeout(() => continueBonusRound(), 900);
    } else if (state.phase === 'result') {
      timer = setTimeout(() => nextTurn(), 1200);
    }

    return () => clearTimeout(timer);
  }, [state.phase, state.currentPlayerIndex, isCpuTurn]);

  if (state.phase === 'setup') {
    return <Setup onStart={startGame} />;
  }

  return (
    <GameBoard
      state={state}
      onRoll={roll}
      onToggleSelect={toggleDieSelect}
      onKeepSelected={keepSelected}
      onRollBonus={rollBonus}
      onContinueBonusRound={continueBonusRound}
      onNextTurn={nextTurn}
      onNewGame={newGame}
    />
  );
}
