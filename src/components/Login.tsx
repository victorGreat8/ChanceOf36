interface Props {
  onSignIn: () => void;
}

export default function Login({ onSignIn }: Props) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 32, padding: 24,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 4 }}>🎲</div>
        <h1 style={{
          fontSize: 42, fontWeight: 900, margin: 0, color: '#f0a500',
          textShadow: '0 2px 8px rgba(240,165,0,0.4)', letterSpacing: 1,
        }}>
          Chance of 36
        </h1>
        <p style={{ color: '#a0c8a0', marginTop: 8, fontSize: 15 }}>
          Sign in to play
        </p>
      </div>

      <button
        onClick={onSignIn}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 28px', borderRadius: 12, border: 'none',
          backgroundColor: '#fff', color: '#1a1a1a',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google"
          style={{ width: 22, height: 22 }}
        />
        Sign in with Google
      </button>
    </div>
  );
}
