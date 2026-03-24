import type { Player } from '../types/game';

interface Props {
  players: Player[];
  currentPlayerIndex: number;
}

export default function ScoreBoard({ players, currentPlayerIndex }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '12px 16px',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 12,
      }}
    >
      {players.map((player, i) => {
        const isCurrent = i === currentPlayerIndex && !player.eliminated;
        return (
          <div
            key={player.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 10,
              backgroundColor: player.eliminated
                ? 'rgba(100,0,0,0.4)'
                : isCurrent
                ? 'rgba(255,255,255,0.18)'
                : 'rgba(255,255,255,0.07)',
              border: isCurrent ? '2px solid #f0a500' : '2px solid transparent',
              minWidth: 70,
              opacity: player.eliminated ? 0.5 : 1,
              transition: 'all 0.3s',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: isCurrent ? '#f0a500' : '#ccc', marginBottom: 2 }}>
              {player.isComputer ? '🤖 ' : ''}{player.name}
            </span>
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: player.eliminated
                  ? '#f87171'
                  : player.points <= 10
                  ? '#f87171'
                  : player.points <= 20
                  ? '#fbbf24'
                  : '#86efac',
                lineHeight: 1,
              }}
            >
              {player.eliminated ? '✗' : player.points}
            </span>
            {player.eliminated && (
              <span style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>OUT</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
