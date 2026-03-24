# Chance of 36

> **Note:** This project was built with [Claude Code](https://claude.ai/claude-code) (Anthropic's AI coding tool). The game concept, rules, and design decisions were made by the developer — the implementation was written by Claude.

A multiplayer dice game for 2–6 players built with React + TypeScript + Vite + Firebase.

## How to play

- All players start at **30 points**
- On your turn: roll 6 dice, keep at least 1 per throw, repeat until all 6 are used
- Your score = sum of all kept dice
  - **Score < 30** → you lose the difference (e.g. score 27 = −3 pts)
  - **Score = 30** → nothing happens
  - **Score > 30** → bonus round starts
- **Bonus round:** your target number = score − 30 (e.g. score 33 → aim for 3s)
  - Roll all 6 dice — any dice showing your target are auto-kept and deal damage
  - Each target die = −target pts to every opponent
  - Keep rolling the remaining dice as long as you keep hitting your target
  - First throw with zero target dice ends your turn
- A player reaching 0 points is eliminated — last one standing wins

## Features

- **Online multiplayer** — create a room, share a 4-letter code, play on separate devices in real-time
- **Local multiplayer** — pass the device, 2–6 players
- Google Sign-In via Firebase Auth
- Computer players (🤖) with auto-play (local mode)
- Game state saved to localStorage — refresh won't lose your progress
- Dark mobile-friendly UI

## Dev setup

```bash
npm install
npm run dev
```

## Tech stack

- Vite 5 + React 18 + TypeScript
- Tailwind CSS v3
- Firebase (Auth + Firestore)
