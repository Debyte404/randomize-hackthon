# ShadowIntern: Virtual Industry Simulation Engine (VISE)
## Phase 2: 2D System Design (The assignment)

## Overview
This document outlines the **2D gameplay system** that follows the Act 0 intro. This system represents the "Computer Phase" where the player performs their actual labor within the Nexus Corp ecosystem.

---

# 1. Technical Integration (Act 0 Compatibility)

To preserve the immersion established in the 3D Office, the 2D OS is not a separate HTML overlay, but a **high-performance WebGL interface** piped through the existing infrastructure.

### The Rendering Pipeline
- **Transition**: `DeskScene.js` sets `gameState` to `2D_WORK`. 
- **Component**: `Workstation2D.jsx` (New) replaces `Game3D.jsx` in the main component tree.
- **Context**: Renders a dedicated 2D scene utilizing `CRTShaderMaterial` to maintain the "Looking at a Monitor" aesthetic from Act 0.
- **Resolution**: 1024x768 virtual resolution, scaled to fit the viewport while preserving the 4:3 CRT aspect ratio.

---

# 2. Core Design Philosophy

You are NOT building a puzzle game. You are building a **Workflow Simulator**.
Every mechanic maps to corporate friction:
- **Jira** → The Task System.
- **Outlook** → The Meeting System (Timed interruptions).
- **Slack** → The Interruption System (Focus penalties).

---

# 3. Core Systems & State (`useGameStore`)

The 2D System is strictly driven by the global `zustand` store:

| Metric | Store Key | Implementation |
|--------|-----------|----------------|
| Productivity | `score` | Increases on task completion. |
| Burnout | `settings.burnout` | Increases with each unhandled ping/meeting. |
| Time | `globalClock` | Drives deadlines and shifting lighting in Act 0. |

---

# 4. Interface Design: "Nexus Corp OS"

### Layout
- **Taskbar**: Top thin strip (Clock, Burnout Meter, "Efficiency" score).
- **Desktop Area**: Central zone where windows (ShadowJira, Outlook) are spawned.
- **Wallpaper**: Static corporate logo with "Property of Nexus Corp - Do Not Distribute" watermark.

### Interaction System
- **Mouse**: Custom 2D pointer (green crosshair).
- **Windows**: Draggable `<Plane>` meshes.
- **Modals**: High-friction pop-ups that block the task queue.

---

# 5. Core Apps (The Work)

### ShadowJira (Task Runner)
- **Mechanic**: User must click-and-drag "Tickets" (text blocks) from a "Backlog" column to "Done".
- **Friction**: Tickets have "Dependencies" (color-coded blocks) that must be cleared first.
- **Burnout**: As burnout increases, ticket text becomes garbled (scrambled characters).

### QuickOutlook (Email Interrupts)
- **Mechanic**: Periodically spawns unskippable "Meeting Requests".
- **Impact**: If ignored for >10s, the Burnout meter spikes and a "MISSING_MEETING" overlay glitches the screen.

---

# 6. Burnout & Glitch Effects

As the `settings.burnout` stat increases (0.0 to 1.0):
1.  **Visual Distortions**: `uGlitch` and `uCollapse` in the CRT shader increase.
2.  **Sound Distortion**: Ambient "office hum" becomes a high-pitched tinnitus whine.
3.  **UI Decay**: Window titles shift randomly, and buttons move slightly when the mouse approaches.

---

# 7. Implementation Steps

1.  **State Sync**: Update `App.jsx` to render `Workstation2D` for `2D_WORK` state.
2.  **OS Foundation**: Create `Workstation2D.jsx` with a basic scene and the `CRTShaderMaterial`.
3.  **Window Manager**: Implement a generic `WorkWindow` component.
4.  **Task Logic**: Hook `ShadowJira` ticket data to the `zustand` store.
5.  **Transition Polish**: Ensure `DeskScene.js` fade-out and `Workstation2D` fade-in feel like a single continuous zoom.
End of Document
