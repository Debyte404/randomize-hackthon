import React, { useState, useEffect } from 'react';
import RecursiveScreen from './RecursiveScreen';
import { useGameStore } from '../../store/useGameStore';

const LandingPage = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const setGameState = useGameStore((state) => state.setGameState);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // Normalize mouse position to range [-1, 1]
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleStart = () => {
    // Transition to Main Menu first or directly to game?
    // PRD says transitions to 3D scenario on press.
    setGameState('MAIN_MENU'); // Let's go to menu first as per PRD structure
  };

  return (
    <div className="crt-screen bg-black cursor-pointer" onClick={handleStart}>
      {/* SVG filter for fish-eye distortion */}
      <svg width="0" height="0" className="absolute">
        <filter id="crt-distort">
          <feTurbulence baseFrequency="0.01 0.01" numOctaves="2" result="noise" seed="1" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      
      <div className="w-full h-full crt-distort flex items-center justify-center p-12">
        <RecursiveScreen depth={0} mousePos={mousePos} />
      </div>

      {/* Retro flickering overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 animate-pulse bg-white/5" />
    </div>
  );
};

export default LandingPage;
