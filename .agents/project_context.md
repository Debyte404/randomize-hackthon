# ShadowIntern: Virtual Industry Simulation Engine (VISE)
## Project Context & Architecture

### Problem Statement
**Background**: Students often lack real-world exposure before entering the job market.
**Challenge**: Develop a simulation platform that mimics real company workflows (tickets, standups, tight deadlines) to train students in realistic, stressful environments using the "Stanley Parable" narrative lens.

### Act 0: The "Busy Office" Infrastructure
The game begins in a high-fidelity 3D office environment designed to feel alive, chaotic, and corporate.

#### 1. Scene & Environment (`OfficeEnvironment.jsx`)
- **Aesthetics**: Chaotic desk setup with physics-inspired props (scattered manila folders, papers, soda cans, coffee mugs, pencils, and a stapler).
- **Lighting System**: Intensive SpotLights and PointLights with **1024x1024 shadow maps**. Includes a dedicated back-wall light to eliminate the "void" and create an enclosed room feel.
- **Physical Bounds**: High-contrast shadows and 90s-era CRT off-white/beige coloring for hardware assets.

#### 2. CRT Rendering Pipeline (`Monitor.jsx`, `CRTShaderMaterial.jsx`)
Instead of traditional recursive layers, the simulation uses a custom WebGL shader pipeline:
- **Barrel Distortion**: Post-processing fisheye effect applied to a single plane.
- **Scanlines & Vignetting**: High-frequency sinusoidal overlays and edge darkening for hardware authenticity.
- **RenderTexture Piping**: The `tDiffuse` for the CRT glass is a dynamic `RenderTexture`. This allows any 3D or text content to be drawn into a buffer and then projected onto the curved glass, naturally inheriting all shader distortions.
- **TV-Cut Transition**: A `uCollapse` uniform handles a vertical squish animation ("TV turn off" effect) triggered by a synthesized Web Audio thump.

#### 3. WebGL Main Menu (`MainMenu3D.jsx`)
- **3D Interactive Layer**: The main menu resides entirely inside the WebGL context.
- **Scale & Spacing**: Elements are scaled at **1.8x** for legibility. Columns are balanced at `±2.8` units to prevent overlap.
- **Event Forwarding**: The parent Monitor mesh forwards pointer events into the `RenderTexture` scene using R3F's raycaster, allowing for fully interactive 3D buttons.

### Global State & Persistence (`useGameStore.js`)
The application utilizes `zustand` for high-performance state management:
- **Volume Protocol**: Global volume setting (0.0 to 1.0) is tied directly to the master gain of the Audio synthesis engine.
- **Personnel Record Persistence**: Tracks high scores and playthrough logs (`playthroughs[]`) in `localStorage`.
- **System Wipe**: A "Format Personnel Record" feature clears all cookies, localStorage, and sessionStorage before triggering a hard browser reload (`window.location.reload()`).

### Technical Stack
- **Frontend**: React + Vite + Tailwind CSS.
- **3D Engine**: Three.js (`@react-three/fiber`, `@react-three/drei`).
- **State**: `zustand` (with `persist` middleware).
- **Audio**: Native Web Audio API (procedural synthesis).
- **Deployment**: Targeted for itch.io hosting.

### Architecture & Folder Structure
- **`dev/frontend/src/components/overlays/`**: 3D Scene components (Monitor, Office, Menus).
- **`dev/frontend/src/store/`**: Global game state and persistence logic.
- **`dev/frontend/src/hooks/`**: Specialized game logic and audio observers.
