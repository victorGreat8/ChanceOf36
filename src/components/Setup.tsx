import { useState } from 'react';

interface PlayerDef {
  name: string;
  isComputer: boolean;
}

interface Props {
  onStart: (players: PlayerDef[]) => void;
  onLogOut: () => void;
  userName: string;
}

export default function Setup({ onStart, onLogOut, userName }: Props) {
  const [playerCount, setPlayerCount] = useState(2);
  const [players, setPlayers] = useState<PlayerDef[]>(
    Array.from({ length: 6 }, (_, i) => ({ name: '', isComputer: i > 0 && i === 1 ? false : false }))
  );

  const setName = (i: number, name: string) => {
    const next = [...players];
    next[i] = { ...next[i], name };
    setPlayers(next);
  };

  const toggleCpu = (i: number) => {
    const next = [...players];
    next[i] = { ...next[i], isComputer: !next[i].isComputer };
    setPlayers(next);
  };

  const handleStart = () => {
    const defs = players.slice(0, playerCount).map((p, i) => ({
      name: p.name.trim() || (p.isComputer ? `CPU ${i + 1}` : `Player ${i + 1}`),
      isComputer: p.isComputer,
    }));
    onStart(defs);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, gap: 32 }}>

      {/* User bar */}
      <div style={{ position: 'fixed', top: 12, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#a0c8a0' }}>{userName}</span>
        <button onClick={onLogOut} style={{
          fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none',
          backgroundColor: 'rgba(255,255,255,0.08)', color: '#aaa', cursor: 'pointer',
        }}>
          Sign out
        </button>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 4 }}>🎲</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: '#f0a500', textShadow: '0 2px 8px rgba(240,165,0,0.4)', letterSpacing: 1 }}>
          Chance of 36
        </h1>
        <p style={{ color: '#a0c8a0', marginTop: 8, fontSize: 15 }}>Roll • Keep • Score</p>
      </div>

      {/* Card */}
      <div style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Player count */}
        <div>
          <label style={{ fontSize: 13, color: '#a0c8a0', fontWeight: 600, marginBottom: 10, display: 'block', letterSpacing: 0.5 }}>
            NUMBER OF PLAYERS
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setPlayerCount(n)} style={{
                flex: 1, padding: '10px 0', borderRadius: 8,
                border: playerCount === n ? '2px solid #f0a500' : '2px solid rgba(255,255,255,0.1)',
                backgroundColor: playerCount === n ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.05)',
                color: playerCount === n ? '#f0a500' : '#ccc',
                fontSize: 18, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 13, color: '#a0c8a0', fontWeight: 600, letterSpacing: 0.5 }}>
            PLAYERS
          </label>
          {Array.from({ length: playerCount }, (_, i) => {
            const p = players[i];
            return (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder={p.isComputer ? `CPU ${i + 1}` : `Player ${i + 1}`}
                  value={p.name}
                  onChange={e => setName(i, e.target.value)}
                  maxLength={14}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8,
                    border: '1.5px solid rgba(255,255,255,0.15)',
                    backgroundColor: p.isComputer ? 'rgba(100,160,255,0.08)' : 'rgba(255,255,255,0.07)',
                    color: '#f0f0f0', fontSize: 15, outline: 'none',
                  }}
                />
                {/* Human / CPU toggle */}
                <button
                  onClick={() => toggleCpu(i)}
                  title={p.isComputer ? 'Switch to Human' : 'Switch to CPU'}
                  style={{
                    padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    backgroundColor: p.isComputer ? 'rgba(100,160,255,0.25)' : 'rgba(255,255,255,0.08)',
                    fontSize: 18, lineHeight: 1, flexShrink: 0,
                    transition: 'background-color 0.15s',
                  }}
                >
                  {p.isComputer ? '🤖' : '👤'}
                </button>
              </div>
            );
          })}
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
            Tap 👤/🤖 to toggle human or computer player
          </div>
        </div>

        <button onClick={handleStart} style={{
          padding: '14px', borderRadius: 10, border: 'none',
          backgroundColor: '#f0a500', color: '#1a1a1a', fontSize: 17, fontWeight: 800,
          cursor: 'pointer', letterSpacing: 0.5,
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          START GAME
        </button>
      </div>

      {/* Rules */}
      <div style={{ maxWidth: 400, fontSize: 13, color: '#7a9a7a', lineHeight: 1.7, textAlign: 'center' }}>
        All players start at <strong style={{ color: '#a0c8a0' }}>30 points</strong>.
        Roll 6 dice, keep at least one per throw.
        Score &gt;30 → bonus round targeting a specific number.
        Score &lt;30 → lose the difference. Reach 0 and you're out!
      </div>
    </div>
  );
}
