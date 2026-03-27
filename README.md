# ShadowIntern: Virtual Industry Simulation Engine 🚀

A web-based 3D/2D game developed for the **Randomize Hackathon**.

## 📝 Problem Statement
**Background**: Students lack real-world exposure before entering jobs.
**Challenge**: Develop a simulation platform that mimics real company workflows (tickets, standups, deadlines) to train students in realistic environments.

## 🎮 Concept: The ShadowIntern Experience
We are approaching this by creating an immersive web game inspired by *The Stanley Parable*, set in an *Ultrakill*-style pixelated retro-3D aesthetic:
- **Phase 1 (3D)**: The first ~10 minutes involve a narrative-driven 3D experience where the player takes on opening tasks in a simulated office.
- **Phase 2 (2D)**: The character sits down at an in-game computer, and the game shifts to a 2D interface to simulate actual company workflows (tickets, deadlines, standups).
- **Progression**: The game tracks progression via the browser's local cache. Players can clear their history to start fresh.

## 📁 Project Structure
The project is organized into dedicated development environments:
- **`dev/frontend/`**: The frontend directory for building and iterating on the web game interface.
- **`dev/backend/`**: The backend directory for API and server-side development. 
- *A production-ready build will be extracted from these for the final deployment on itch.io.*

## 🏷️ Tags
`#hackathon` `#randomize` `#simulation` `#web-game` `#react` `#threejs` `#itchio`

---

## 📅 Project Status
- [x] Received Problem Statement
- [x] Brainstorming & Concept Design
- [ ] Backend & Frontend Initialization
- [ ] Initial Implementation (3D & 2D Phases)
- [ ] Final Presentation & Deployment

## 🛠️ Stack
- **Frontend Framework**: React + Vite
- **Styling**: Tailwind CSS
- **3D Rendering**: Three.js (with custom pixelation shaders)
- **Deployment**: Web build hosted on [itch.io](https://itch.io)
