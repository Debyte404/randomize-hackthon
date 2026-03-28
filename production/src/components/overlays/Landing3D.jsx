import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Monitor from './Monitor'
import OfficeEnvironment from './OfficeEnvironment'
import { useGameStore } from '../../store/useGameStore'

const Landing3D = () => {
  const setGameState = useGameStore((state) => state.setGameState)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleStart = () => {
    if (isTransitioning) return
    setIsTransitioning(true)
    
    // Play TV Cut transition for 1.2s before swapping to MAIN_MENU
    setTimeout(() => {
      setGameState('MAIN_MENU')
      setIsTransitioning(false) // Reset so the TV screen turns back on to reveal the menu!
    }, 1200)
  }

  return (
    <div className="w-full h-full bg-black relative">
      <Canvas shadows gl={{ antialias: false }} camera={{ position: [0, 0, 8], fov: 45 }}>
        <color attach="background" args={['#030303']} />

        {/* The New Stanley Parable warm office environment */}
        <OfficeEnvironment />

         {/* Monitor Key Light (still keep some specialized hardware lighting) */}
         <spotLight 
          position={[0, 5, 2]} 
          angle={0.4} 
          penumbra={1} 
          intensity={20} 
          color="#06b6d4"
        />

        {/* THE 3D MONITOR */}
        <group>
           <Monitor transitioning={isTransitioning} onStart={handleStart} />
        </group>
      </Canvas>
      
      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
      
      {/* Transition Fade out overlay */}
      <div className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-1000 ${isTransitioning ? 'opacity-100' : 'opacity-0 z-0'}`} style={{ zIndex: isTransitioning ? 999 : -1, transitionDelay: '1000ms' }} />
    </div>
  )
}

export default Landing3D
