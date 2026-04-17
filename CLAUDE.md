# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # local dev server (http://localhost:5173)
npm run build      # type-check + production build → dist/
npm run lint       # ESLint

firebase deploy --only hosting   # deploy to https://chanceof36.web.app
```

No test suite exists.

## Before every commit and push to GitHub

1. Check if README.md needs updating (new features, changed behaviour, new setup steps)
2. Build: `npm run build` — fix any TypeScript errors before committing
3. If the change is user-facing: also run `firebase deploy --only hosting`

## Stack constraints

- **Vite 5 + React 18 + TypeScript 5.6** — Node 18 compatible. Do NOT upgrade to Vite 7 or Tailwind v4.
- **Tailwind CSS v3** with PostCSS — config in `tailwind.config.js` / `postcss.config.js`.
- No backend. No test framework.

## Architecture

### Routing / mode switching (App.tsx)

There is no router. `App.tsx` uses a `mode` state (`'lobby' | 'local'`) plus Firebase state to decide what to render:

1. Loading spinner → Login screen (if not authenticated)
2. `room?.status === 'playing'` → online GameBoard (via `useOnlineGame`)
3. `mode === 'local'` → Setup or local GameBoard (via `useGame`)
4. default → Lobby

`mode` is persisted to `localStorage` so refresh doesn't reset it.

### Two parallel game engines

The same game logic exists in two places — keep them in sync when changing rules:

| | Local | Online |
|---|---|---|
| Hook | `useGame.ts` | `useOnlineGame.ts` |
| State lives in | React state + localStorage | Firestore `rooms/{code}.gameState` |
| Turn enforcement | none (pass device) | `isMyTurn` check (playerOrder UID match) |
| Die selection | React state (selected flag on Die) | local `Set<number>` merged into displayState |
| Animation | `rolling` flag + 450ms setTimeout | local `rollingIds` Set, never synced to Firestore |

`useOnlineGame` duplicates helpers from `useGame` (`rollDie`, `applyPointsDelta`, `checkEliminations`, etc.) because it must compute new state locally before writing to Firestore.

### Firestore collections

- `rooms/{4-letter-code}` — active game rooms. Deleted (not status-updated) when game ends.
- `leaderboard/{uid}` — win counts. Written by the player whose action triggers game-over.
- `players/{uid}` — saved display name per user.

### Key data flow for online games

1. `useRoom` owns room creation/joining and the `onSnapshot` listener → provides `room` object
2. `useOnlineGame` reads `room.gameState`, computes new state on each action, writes back via `updateDoc`
3. All devices see updates instantly via the `onSnapshot` listener in `useRoom`
4. Die selection is **not** synced — each player tracks their own selections locally and only writes on Keep

### AI players (local mode only)

`chooseKeptIds()` in `App.tsx` — greedy strategy. Threshold = `max(3, ceil(needed / remaining))`. If no dice meet threshold, keeps the single highest die. Triggered via `useEffect` watching `state.phase` and `currentPlayerIndex`.

### GamePhase flow

```
pre-roll → selecting → result → pre-roll (next player)
                     ↘ bonus-pre-roll → bonus-result → bonus-pre-roll (loop)
                                                      ↘ pre-roll (next player)
game-over
```
