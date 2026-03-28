import { useEffect } from 'react'
import { useGameStore } from './store/useGameStore'
import Landing3D from './components/overlays/Landing3D'
import Game3D from './3d/Game3D'
import Workstation2D from './components/workstation/Workstation2D'

function App() {
  const gameState = useGameStore((state) => state.gameState)

  // Force reset on fresh page load to prevent stale persisted state
  // skipping the 3D walkthrough
  useEffect(() => {
    const current = useGameStore.getState().gameState
    if (current === '2D_WORK' || current === 'PAUSE') {
      useGameStore.getState().setGameState('START')
    }
  }, [])

  return (
    <div className="w-full h-full bg-black text-nexus-accent overflow-hidden selection:bg-nexus-accent selection:text-black font-mono">
      {['START', 'MAIN_MENU'].includes(gameState) && <Landing3D />}

      {/* 3D Walk-around Phases + persisted desk scene behind 2D */}
      {(gameState.startsWith('3D_') || gameState === '2D_WORK') && <Game3D />}

      {/* 2D Workstation Phase — overlaid on the 3D monitor */}
      {gameState === '2D_WORK' && <Workstation2D />}
    </div>
  )
}

export default App
