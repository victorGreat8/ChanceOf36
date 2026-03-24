import type { Die } from '../types/game';

interface Props {
  die: Die;
  onClick?: () => void;
  interactive?: boolean;
  highlight?: boolean;  // For bonus dice showing 3
  size?: 'normal' | 'large' | 'small';
}

// Pip layout per face value using 3x3 grid positions (row, col) 0-indexed
const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value }: { value: number }) {
  const pips = PIP_POSITIONS[value] ?? [];
  const cells = Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const hasPip = pips.some(([r, c]) => r === row && c === col);
    return hasPip;
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '2px',
        padding: '4px',
        width: '100%',
        height: '100%',
      }}
    >
      {cells.map((hasPip, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {hasPip && (
            <div
              style={{
                width: '30%',
                paddingBottom: '30%',
                borderRadius: '50%',
                backgroundColor: '#1a1a2e',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function DieComponent({ die, onClick, interactive = false, highlight = false, size = 'normal' }: Props) {
  const sizeMap = {
    small: 56,
    normal: 72,
    large: 88,
  };
  const dim = sizeMap[size];

  let bg = '#f5f0e8';
  let border = '2px solid #c8b99a';
  let cursor = 'default';
  let opacity = 1;

  if (die.kept && !highlight) {
    bg = '#d4edda';
    border = '2px solid #5cb85c';
    opacity = 0.85;
  }

  if (die.selected) {
    bg = '#fff3cd';
    border = '3px solid #f0a500';
  }

  if (highlight && die.value === 3) {
    bg = '#d4edda';
    border = '3px solid #28a745';
  }

  if (interactive && !die.kept) {
    cursor = 'pointer';
  }

  const classes = [
    die.rolling ? 'die-rolling' : '',
    highlight && die.value === 3 ? 'die-bonus-hit' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={interactive && !die.kept ? onClick : undefined}
      style={{
        width: dim,
        height: dim,
        backgroundColor: bg,
        border,
        borderRadius: 10,
        cursor,
        opacity,
        transition: 'border-color 0.15s, background-color 0.15s',
        userSelect: 'none',
        flexShrink: 0,
      }}
      title={
        interactive && !die.kept
          ? die.selected ? 'Click to deselect' : 'Click to select'
          : undefined
      }
    >
      {die.value !== null ? (
        <DieFace value={die.value} />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: 24,
          }}
        >
          ?
        </div>
      )}
    </div>
  );
}
