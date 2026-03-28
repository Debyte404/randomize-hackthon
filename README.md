# ShadowIntern: Virtual Industry Simulation Engine

> *"This game is based on a true story. The names have been changed. The suffering has not."*

A narrative-driven web game that simulates the chaos of a corporate internship — from walking into the office on Day 1, to drowning in Jira tickets, Slack pings, and meetings that could've been emails. Built for the **Randomize Hackathon**.

---

## The Concept

**Problem Statement**: Students lack real-world exposure before entering jobs.
**Our Approach**: Instead of a dry simulation, we built a game. A darkly funny, increasingly frantic game.

You play as **[INTERN]** — no name, just a title — on your first day at **Nexus Corp**. The game unfolds in two phases:

### Phase 1: The 3D Experience (~3 min)
A narrative-driven first-person walkthrough inspired by *The Stanley Parable*, rendered in a retro pixelated aesthetic:

1. **The Street** — You arrive at the glass tower of Nexus Corp
2. **The Lobby** — The aggressively beige reception area
3. **The Interview** — Two interviewers who stopped feeling things around Q2 2019
4. **The Office Floor** — Open-plan despair with sticky notes and cold coffee
5. **The Desk** — The monitor begins to glow. You sit down. The real work begins.

### Phase 2: NexusOS 98 (~unlimited)
The game transitions into a fully interactive **Windows 98-style desktop simulation** where you must survive a workday by juggling:

- **ShadowJira** — Solve programming puzzles disguised as tickets (6 visual puzzle types + quick-fire text challenges)
- **QuickOutlook** — Read and triage incoming emails before they expire
- **NexusNet** — The company intranet browser
- **Slack Popups** — Random interruptions from coworkers
- **Meetings** — Mandatory time sinks that slow everything down
- **Terminal** — A working command-line with 12 commands

All while managing your **burnout meter**, maintaining **combo streaks**, leveling up through **XP**, unlocking **achievements**, and surviving **Boss Alerts** (close all non-work apps in 5 seconds or face consequences).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| 3D Rendering | Three.js r183 via @react-three/fiber + drei |
| State Management | Zustand 5 (with persist middleware) |
| Styling | Tailwind CSS 3 |
| Audio | Web Audio API (procedural — zero audio files) |
| Storage | Browser localStorage (progress persistence) |

**Zero backend. Zero external assets. Pure JavaScript.**

---

## Project Structure

```
dev/frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx                          # Root — routes game states to scenes
│   ├── store/
│   │   ├── useGameStore.js              # Persisted game state (high scores, settings, playthroughs)
│   │   ├── useWorkStore.js              # Core 2D game engine (tick loop, tasks, combos, XP, achievements)
│   │   └── puzzleEngine.js              # Puzzle generation (6 types + text), templates, events
│   └── components/
│       ├── overlays/
│       │   ├── Landing3D.jsx            # 3D title screen
│       │   ├── LandingPage.jsx          # Landing page UI
│       │   ├── MainMenu.jsx             # Main menu
│       │   ├── MainMenu3D.jsx           # 3D main menu scene
│       │   ├── CRTShaderMaterial.jsx     # Retro CRT screen shader
│       │   ├── Monitor.jsx              # In-game monitor model
│       │   ├── OfficeEnvironment.jsx     # 3D office scene
│       │   └── RecursiveScreen.jsx       # Recursive screen effect
│       └── workstation/
│           ├── Workstation2D.jsx         # Full NexusOS 98 desktop (~800 lines)
│           └── Workstation2D.css         # Win98 styling, animations, effects
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Game Mechanics

### Puzzle Types
| Type | Description |
|------|-------------|
| Neural Network | Connect nodes to build a neural network path |
| Pattern Match | Identify and complete visual patterns |
| Node Connection | Wire up components in the correct order |
| Sorting | Arrange elements by priority/value |
| Logic Grid | Deduce correct cells in a logic grid |
| Pathfinding | Navigate through a maze/graph |
| Text Input | Quick-fire coding/trivia questions |

### Scoring System
- **Base points** per task completion
- **Combo multiplier** — complete tasks within 30s of each other (up to 5x)
- **XP & Levels** — earn XP, level up, unlock harder challenges
- **Achievements** — 10 milestones (First Task, Speed Demon, Combo Master, etc.)

### Stress Mechanics
- **Burnout meter** — rises from overwork, screen effects intensify (glitch, shake)
- **Boss Alert** — random event: close all non-work apps within 5 seconds
- **Meeting drain** — mandatory meetings steal your time and slow task completion
- **Email expiry** — unread emails expire and hurt your performance

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl + 1-7` | Quick-launch desktop apps |
| `Escape` | Close active window |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
cd dev/frontend
npm install
```

### Development
```bash
npm run dev
```
Opens at `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
Create `dev/frontend/.env` for optional AI features:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## Performance Notes

- **Tick loop** throttles expensive operations (email/task expiry, array pruning) to 1/sec while keeping lightweight updates (clock, burnout, timers) at 60fps
- **Audio** uses a single shared `AudioContext` with procedural generation — no audio files to load
- **State** arrays are bounded and pruned (max 50 notifications, 20 completed tasks, etc.)
- **3D scenes** use optimized geometries and shared materials
- **Total repo size**: ~286 MB (under 500 MB budget)

---

## Deployment

The game is a static web build — deploy anywhere:
- [itch.io](https://itch.io) (primary target)
- Vercel / Netlify / GitHub Pages
- Any static file host

```bash
npm run build  # outputs to dist/
```

---

## Tags

`#hackathon` `#randomize` `#simulation` `#web-game` `#react` `#threejs` `#zustand` `#retro` `#windows98` `#itchio`

---

## Project Status

- [x] Problem Statement & Concept Design
- [x] 3D Phase — 5 narrative scenes (Street → Lobby → Interview → Office → Desk)
- [x] 2D Phase — NexusOS 98 desktop simulation
- [x] Puzzle Engine — 7 puzzle types with procedural generation
- [x] Game Mechanics — Combo system, XP/levels, achievements, boss alert
- [x] Audio — Procedural Web Audio (no files)
- [x] Performance — Optimized tick loop, bounded state, shared resources
- [x] Persistence — localStorage save/load via Zustand persist
- [ ] Final Polish & Deployment to itch.io

---

*Built with sleep deprivation and too much coffee at the Randomize Hackathon.*
