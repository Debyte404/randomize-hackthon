# ShadowIntern: Virtual Industry Simulation Engine
## Project Context

### Problem Statement
**Background**: Students often lack real-world exposure before entering the job market.
**Challenge**: Develop a simulation platform that mimics real company workflows (such as tickets, standups, and tight deadlines) to train students in realistic environments.

### Proposed Solution & Approach
The approach is to tackle this problem statement by creating an engaging website game that simulates this environment through interactive gameplay.

#### Gameplay Mechanics & Flow
- **Initial Phase (3D)**: The game begins with an initial story-driven phase lasting about 10 minutes. This part occurs in a 3D environment where the player completes opening tasks.
- **Transition to 2D**: Following the initial 3D segment, the player's character moves to a computer, and the game transitions into a 2D interface.
- **Progression System**: The user's progress throughout the game will be stored locally in the website's cache. Players will have the functionality to clear their history to reset the game to zero.

#### Artistic Direction
- **Inspiration**: The narrative style and gameplay feel will draw inspiration from *The Stanley Parable*.
- **Aesthetics**: The visual style will emulate *Ultrakill* with prominent pixelation, utilizing multiple shaders to achieve the distinctive "retro-3D" look.

#### Technical Stack
- **Frontend Framework**: React + Vite
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js
- **Deployment**: The final version will be built and hosted on itch.io as a web game.

### Architecture & Folder Structure
Development will be segmented to keep environments clean:
- **`dev/frontend/`**: Directory dedicated to building and thoroughly developing the frontend website.
- **`dev/backend/`**: Directory for any backend development needed.
- Once development is complete, a production-ready version will be compiled for hosting.
