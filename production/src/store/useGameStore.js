import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGameStore = create(
  persist(
    (set) => ({
      // Game State: 'START', '3D_STREET', '3D_LOBBY', '3D_INTERVIEW', '3D_OFFICE', '2D_WORK', 'PAUSE'
      gameState: 'START',
      highScore: 0,
      playthroughs: [],
      settings: {
        volume: 0.5,
        graphics: 'ULTRAKILL', // 'ULTRAKILL' (pixelated) vs 'STANDARD'
        skip3D: false,
      },

      // Actions
      setGameState: (state) => set({ gameState: state }),
      setHighScore: (score) => set((state) => ({ 
        highScore: score > state.highScore ? score : state.highScore 
      })),
      addPlaythrough: (playthrough) => set((state) => ({ 
        playthroughs: [playthrough, ...state.playthroughs].slice(0, 10) 
      })),
      updateSettings: (newSettings) => set((state) => ({ 
        settings: { ...state.settings, ...newSettings } 
      })),
      clearHistory: () => set({ 
        highScore: 0, 
        playthroughs: [],
        gameState: 'START' 
      }),
    }),
    {
      name: 'shadow-intern-storage',
    }
  )
)
