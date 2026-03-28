import React, { useState, useEffect, useRef } from 'react';

const RecursiveScreen = ({ depth, mousePos, maxDepth = 6 }) => {
  if (depth >= maxDepth) return null;

  // Mouse repulsion logic: Invert mousePos to move AWAY from the cursor
  const repulsionStrength = 40 / (depth + 1);
  const offsetX = -mousePos.x * repulsionStrength;
  const offsetY = -mousePos.y * repulsionStrength;

  return (
    <div 
      className="relative flex items-center justify-center border-4 border-nexus-accent/30 bg-black/40 overflow-hidden"
      style={{
        width: `${100 - depth * 12}%`,
        height: `${100 - depth * 12}%`,
        transform: `translate(${offsetX}px, ${offsetY}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {depth === 0 && (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          {/* Scanlines Overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,118,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
          
          {/* Curved Corners Vignette */}
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] z-[101]" />
        </div>
      )}

      {/* The recursive child */}
      <RecursiveScreen depth={depth + 1} mousePos={mousePos} maxDepth={maxDepth} />
      
      {depth === 0 && (
         <div className="absolute z-30 flex flex-col items-center">
            <h1 className="text-6xl md:text-8xl font-black text-nexus-accent tracking-tighter drop-shadow-2xl animate-pulse cursor-default select-none group">
              TAP TO START
            </h1>
            <div className="mt-8 text-xs text-nexus-accent/40 font-mono tracking-widest uppercase">
              // NexusCorp Workstation v3.14
            </div>
         </div>
      )}
    </div>
  );
};

export default RecursiveScreen;
