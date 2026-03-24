import { useState } from 'react';
import type { Room } from '../hooks/useRoom';

type Screen = 'home' | 'create' | 'join' | 'waiting';

interface Props {
  uid: string;
  defaultName: string;
  room: Room | null;
  roomCode: string | null;
  error: string | null;
  loading: boolean;
  onCreateRoom: (name: string) => void;
  onJoinRoom: (code: string, name: string) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onPlayLocal: () => void;
}

export default function Lobby({
  uid,
  defaultName,
  room,
  roomCode,
  error,
  loading,
  onCreateRoom,
  onJoinRoom,
  onStartGame,
  onLeaveRoom,
  onPlayLocal,
}: Props) {
  const [screen, setScreen] = useState<Screen>('home');
  const [name, setName] = useState(defaultName);
  const [code, setCode] = useState('');

  // Auto-advance to waiting room once in a room
  const inRoom = !!room;
  const isHost = room?.hostUid === uid;
  const canStart = (room?.players.length ?? 0) >= 2;

  if (inRoom) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>🎲</div>
          <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: '#f0a500' }}>Waiting room</h2>
          <div style={{ marginTop: 10, fontSize: 14, color: '#888' }}>Share this code with friends</div>
          <div style={{
            fontSize: 52, fontWeight: 900, letterSpacing: 10, color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
            padding: '12px 28px', marginTop: 8, fontFamily: 'monospace',
          }}>
            {roomCode}
          </div>
        </div>

        {/* Player list */}
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#a0c8a0', fontWeight: 700, letterSpacing: 0.5, marginBottom: 2 }}>
            PLAYERS ({room.players.length}/6)
          </div>
          {room.players.map((p, i) => (
            <div key={p.uid} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              backgroundColor: p.uid === uid ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.06)',
              border: p.uid === uid ? '1px solid rgba(240,165,0,0.3)' : '1px solid transparent',
            }}>
              <span style={{ fontSize: 18 }}>{i === 0 ? '👑' : '👤'}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
              {p.uid === uid && <span style={{ fontSize: 11, color: '#888' }}>you</span>}
            </div>
          ))}
          {room.players.length < 2 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#666', padding: '8px 0' }}>
              Waiting for at least one more player…
            </div>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              style={{
                padding: '16px', borderRadius: 12, border: 'none',
                backgroundColor: canStart ? '#f0a500' : 'rgba(255,255,255,0.08)',
                color: canStart ? '#1a1a1a' : '#555',
                fontSize: 16, fontWeight: 800, cursor: canStart ? 'pointer' : 'not-allowed',
              }}
            >
              {canStart ? 'START GAME →' : 'Waiting for players…'}
            </button>
          )}
          {!isHost && (
            <div style={{ textAlign: 'center', fontSize: 14, color: '#888', padding: '8px 0' }}>
              Waiting for the host to start…
            </div>
          )}
          <button onClick={onLeaveRoom} style={{
            padding: '10px', borderRadius: 10, border: 'none',
            backgroundColor: 'rgba(255,255,255,0.05)', color: '#888',
            fontSize: 14, cursor: 'pointer',
          }}>
            Leave room
          </button>
        </div>
      </div>
    );
  }

  // ─── Home screen ───────────────────────────────────────────────────────────
  if (screen === 'home') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 4 }}>🎲</div>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: '#f0a500', letterSpacing: 1 }}>Chance of 36</h1>
        </div>
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setScreen('create')} style={btnStyle('#f0a500', '#1a1a1a')}>
            🌐 PLAY ONLINE
          </button>
          <button onClick={() => setScreen('join')} style={btnStyle('rgba(255,255,255,0.1)', '#fff')}>
            🔑 JOIN A GAME
          </button>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#555', margin: '4px 0' }}>or</div>
          <button onClick={onPlayLocal} style={btnStyle('rgba(255,255,255,0.06)', '#aaa')}>
            📱 PLAY LOCAL (pass the device)
          </button>
        </div>
      </div>
    );
  }

  // ─── Create room ───────────────────────────────────────────────────────────
  if (screen === 'create') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f0a500', margin: 0 }}>Create a game</h2>
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 13, color: '#a0c8a0', fontWeight: 600 }}>YOUR NAME</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter your name"
            maxLength={14}
            style={inputStyle}
          />
          <button
            onClick={() => onCreateRoom(name)}
            disabled={!name.trim() || loading}
            style={btnStyle(name.trim() && !loading ? '#f0a500' : 'rgba(255,255,255,0.08)', name.trim() && !loading ? '#1a1a1a' : '#555')}
          >
            {loading ? 'Creating…' : 'CREATE GAME →'}
          </button>
          <button onClick={() => setScreen('home')} style={btnStyle('rgba(255,255,255,0.05)', '#888')}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // ─── Join room ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24 }}>
      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#f0a500', margin: 0 }}>Join a game</h2>
      <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ fontSize: 13, color: '#a0c8a0', fontWeight: 600 }}>YOUR NAME</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={14}
          style={inputStyle}
        />
        <label style={{ fontSize: 13, color: '#a0c8a0', fontWeight: 600, marginTop: 4 }}>ROOM CODE</label>
        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. WOLF"
          maxLength={4}
          style={{ ...inputStyle, fontSize: 28, fontWeight: 800, letterSpacing: 8, textAlign: 'center', fontFamily: 'monospace' }}
        />
        {error && (
          <div style={{ fontSize: 13, color: '#f87171', textAlign: 'center' }}>{error}</div>
        )}
        <button
          onClick={() => onJoinRoom(code, name)}
          disabled={!name.trim() || code.length !== 4 || loading}
          style={btnStyle(name.trim() && code.length === 4 && !loading ? '#f0a500' : 'rgba(255,255,255,0.08)', name.trim() && code.length === 4 && !loading ? '#1a1a1a' : '#555')}
        >
          {loading ? 'Joining…' : 'JOIN GAME →'}
        </button>
        <button onClick={() => setScreen('home')} style={btnStyle('rgba(255,255,255,0.05)', '#888')}>
          ← Back
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 8,
  border: '1.5px solid rgba(255,255,255,0.15)',
  backgroundColor: 'rgba(255,255,255,0.07)',
  color: '#f0f0f0', fontSize: 16, outline: 'none',
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '16px', borderRadius: 12, border: 'none',
    backgroundColor: bg, color, fontSize: 16, fontWeight: 800, cursor: 'pointer',
  };
}
