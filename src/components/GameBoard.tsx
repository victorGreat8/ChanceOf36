import type { GameState } from '../hooks/useGame';
import type { Die } from '../types/game';
import ScoreBoard from './ScoreBoard';
import DieComponent from './DieComponent';

interface Props {
  state: GameState;
  onRoll: () => void;
  onToggleSelect: (id: number) => void;
  onKeepSelected: () => void;
  onRollBonus: () => void;
  onContinueBonusRound: () => void;
  onNextTurn: () => void;
  onNewGame: () => void;
  onLogOut: () => void;
  userName: string;
  isMyTurn?: boolean;       // undefined = local game (always true)
  roomCode?: string;        // shown in online games
}

function DiceRow({ dice, interactive, onToggle, highlightValue }: {
  dice: Die[];
  interactive: boolean;
  onToggle?: (id: number) => void;
  highlightValue?: number;
}) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      {dice.map(die => (
        <DieComponent
          key={die.id}
          die={die}
          interactive={interactive}
          onClick={() => onToggle?.(die.id)}
          highlight={highlightValue !== undefined && die.value === highlightValue}
        />
      ))}
    </div>
  );
}

export default function GameBoard({
  state,
  onRoll,
  onToggleSelect,
  onKeepSelected,
  onRollBonus,
  onContinueBonusRound,
  onNextTurn,
  onNewGame,
  onLogOut,
  userName,
  isMyTurn = true,
  roomCode,
}: Props) {
  const { players, currentPlayerIndex, phase, dice, bonusDice, bonusTarget, message, currentSum, totalBonusMinus } = state;
  const currentPlayer = players[currentPlayerIndex];

  const isMainPhase = phase === 'pre-roll' || phase === 'selecting';
  const isBonusPhase = phase === 'bonus-pre-roll' || phase === 'bonus-result';

  const keptDice = dice.filter(d => d.kept);
  const activeDice = dice.filter(d => !d.kept);
  const selectedCount = dice.filter(d => !d.kept && d.selected).length;
  const canKeep = selectedCount > 0;

  // Best possible score if you keep selected + roll remaining dice and get all 6s
  const keptSum = keptDice.reduce((a, d) => a + (d.value ?? 0), 0);
  const selectedSum = dice.filter(d => !d.kept && d.selected).reduce((a, d) => a + (d.value ?? 0), 0);
  const remainingCount = dice.filter(d => !d.kept && !d.selected).length;
  const bestCase = keptSum + selectedSum + remainingCount * 6;

  // ─── Game Over ────────────────────────────────────────────────────────────

  if (phase === 'game-over') {
    const winner = players.find(p => !p.eliminated);
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
        <div style={{ fontSize: 72 }}>🏆</div>
        <h2 style={{ fontSize: 36, fontWeight: 900, color: '#f0a500', margin: 0, textAlign: 'center' }}>
          {winner ? `${winner.name} wins!` : 'Game Over!'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {players.slice().sort((a, b) => b.points - a.points).map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '8px 20px', borderRadius: 10, minWidth: 200,
              backgroundColor: p.id === winner?.id ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)',
              border: p.id === winner?.id ? '1px solid #f0a500' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 18, width: 28 }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </span>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: p.eliminated ? '#f87171' : '#86efac' }}>
                {p.points}
              </span>
            </div>
          ))}
        </div>
        <button onClick={onNewGame} style={{
          marginTop: 8, padding: '14px 40px', borderRadius: 10,
          border: 'none', backgroundColor: '#f0a500', color: '#1a1a1a',
          fontSize: 17, fontWeight: 800, cursor: 'pointer',
        }}>
          PLAY AGAIN
        </button>
      </div>
    );
  }

  // ─── Main layout ──────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 16, gap: 14, maxWidth: 600, margin: '0 auto' }}>

      {/* User bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {roomCode
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#666', fontFamily: 'monospace', letterSpacing: 2 }}>ROOM: {roomCode}</span>
              <button
                onClick={() => { if (window.confirm('End the game for everyone?')) onNewGame(); }}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171', cursor: 'pointer' }}
              >End</button>
            </div>
          : <button onClick={onNewGame} style={{
              fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none',
              backgroundColor: 'rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer',
            }}>← Menu</button>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: '#a0c8a0' }}>{userName}</span>
          <button onClick={onLogOut} style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none',
            backgroundColor: 'rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>
      </div>

      <ScoreBoard players={players} currentPlayerIndex={currentPlayerIndex} />

      {/* Player + phase badge */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 1,
          padding: '3px 10px', borderRadius: 20, marginBottom: 4,
          backgroundColor: isBonusPhase ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.08)',
          color: isBonusPhase ? '#f0a500' : '#a0c8a0',
        }}>
          {isMainPhase ? 'MAIN THROW' : isBonusPhase ? `★ BONUS — AIM FOR ${bonusTarget}s ★` : phase === 'result' ? 'RESULT' : ''}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          {currentPlayer?.isComputer ? '🤖 ' : ''}{currentPlayer?.name}
          {currentPlayer?.isComputer && (
            <span style={{ fontSize: 13, color: '#888', fontWeight: 400, marginLeft: 6 }}>thinking…</span>
          )}
        </div>
      </div>

      {/* Message */}
      <div style={{
        textAlign: 'center', padding: '10px 16px', borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.3)', fontSize: 15, color: '#e0e0e0',
        minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {message}
      </div>

      {/* ─── MAIN PHASE DICE ─── */}
      {isMainPhase && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {keptDice.length > 0 && (
            <div>
              <div style={{ fontSize: 11, color: '#5cb85c', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                KEPT — sum: {keptDice.reduce((a, d) => a + (d.value ?? 0), 0)}
              </div>
              <DiceRow dice={keptDice} interactive={false} />
            </div>
          )}
          {keptDice.length > 0 && activeDice.length > 0 && (
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
          )}
          {activeDice.length > 0 && (
            <div>
              {phase === 'selecting' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#f0a500', fontWeight: 700 }}>
                    TAP TO SELECT
                  </div>
                  {selectedCount > 0 && (
                    <div style={{ fontSize: 12, color: '#a0c8a0', fontWeight: 700 }}>
                      Chance of: <span style={{ color: bestCase >= 30 ? '#86efac' : '#f87171', fontSize: 14 }}>{bestCase}</span>
                    </div>
                  )}
                </div>
              )}
              <DiceRow dice={activeDice} interactive={phase === 'selecting'} onToggle={onToggleSelect} />
            </div>
          )}
        </div>
      )}

      {/* ─── BONUS PHASE DICE ─── */}
      {isBonusPhase && bonusDice.length > 0 && (() => {
        const bonusKept = bonusDice.filter(d => d.kept);
        const bonusActive = bonusDice.filter(d => !d.kept);
        return (
          <div style={{
            backgroundColor: 'rgba(240,165,0,0.06)',
            border: '1.5px solid rgba(240,165,0,0.25)',
            borderRadius: 14, padding: 16,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {bonusKept.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#5cb85c', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                  TARGET DICE KEPT ({bonusKept.length})
                </div>
                <DiceRow dice={bonusKept} interactive={false} highlightValue={bonusTarget} />
              </div>
            )}
            {bonusKept.length > 0 && bonusActive.length > 0 && (
              <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }} />
            )}
            {bonusActive.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: '#aaa', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                  TO ROLL ({bonusActive.length})
                </div>
                <DiceRow dice={bonusActive} interactive={false} highlightValue={bonusTarget} />
              </div>
            )}
            {phase === 'bonus-result' && totalBonusMinus > 0 && (
              <div style={{ textAlign: 'center', fontSize: 14, color: '#a0c8a0', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 10 }}>
                Total dealt: <strong style={{ color: '#f0a500' }}>−{totalBonusMinus} pts</strong> to each opponent
              </div>
            )}
          </div>
        );
      })()}

      {/* ─── MAIN RESULT ─── */}
      {phase === 'result' && (
        <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#a0c8a0', marginBottom: 8 }}>FINAL SCORE</div>
          <div style={{
            fontSize: 64, fontWeight: 900, lineHeight: 1,
            color: currentSum < 30 ? '#f87171' : currentSum > 30 ? '#f0a500' : '#86efac',
          }}>
            {currentSum}
          </div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
            {currentSum < 30 && `→ ${currentPlayer?.name} loses ${30 - currentSum} pt${30 - currentSum !== 1 ? 's' : ''}`}
            {currentSum === 30 && '→ No change'}
            {currentSum > 30 && `→ Bonus round! Aim for ${currentSum - 30}s`}
          </div>
          <div style={{ marginTop: 14 }}>
            <DiceRow dice={dice} interactive={false} />
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* ─── ACTION BUTTONS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!isMyTurn ? (
          <div style={{
            textAlign: 'center', padding: 16, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.04)', color: '#666', fontSize: 15,
          }}>
            Waiting for {currentPlayer?.name}…
          </div>
        ) : (
          <>
            {phase === 'pre-roll' && (
              <Btn onClick={onRoll}>🎲 ROLL DICE</Btn>
            )}
            {phase === 'selecting' && (
              <Btn onClick={onKeepSelected} disabled={!canKeep}>
                {canKeep ? `KEEP ${selectedCount} SELECTED` : 'SELECT AT LEAST 1 DIE'}
              </Btn>
            )}
            {phase === 'bonus-pre-roll' && (
              <Btn onClick={onRollBonus} gold>
                🎲 ROLL {bonusDice.filter(d => !d.kept).length || 6} DICE
              </Btn>
            )}
            {phase === 'bonus-result' && (() => {
              const remaining = bonusDice.filter(d => !d.kept).length;
              const hasHits = state.bonusRoundHits > 0;
              const canContinue = hasHits && remaining > 0;
              return (
                <Btn onClick={onContinueBonusRound} gold={canContinue}>
                  {canContinue ? `🎲 ROLL ${remaining} REMAINING` : 'NEXT PLAYER →'}
                </Btn>
              );
            })()}
            {phase === 'result' && (
              <Btn onClick={onNextTurn}>NEXT PLAYER →</Btn>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, disabled = false, gold = false }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  gold?: boolean;
}) {
  const bg = disabled ? 'rgba(255,255,255,0.08)' : gold ? '#f0a500' : '#4a7c59';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '16px', borderRadius: 12, border: 'none',
        backgroundColor: bg,
        color: disabled ? '#555' : '#1a1a1a',
        fontSize: 16, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: 0.5, opacity: disabled ? 0.6 : 1, transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  );
}
