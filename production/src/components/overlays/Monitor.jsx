import React, { useRef, useMemo } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { Text, RenderTexture, OrthographicCamera } from '@react-three/drei'
import * as THREE from 'three'
import { CRTShaderMaterial } from './CRTShaderMaterial'
import MainMenu3D from './MainMenu3D'
import { useGameStore } from '../../store/useGameStore'

extend({ CRTShaderMaterial })

// Quick TV Turn off sound
const playTVCutSound = () => {
    try {
        const volume = useGameStore.getState().settings.volume;
        if (volume <= 0) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        
        // Thump
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(1.0 * volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);

        // High pitch zip
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(8000, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        gain2.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        
        osc2.start();
        osc2.stop(ctx.currentTime + 0.2);
    } catch(e) {
        console.log("Audio not supported or blocked");
    }
}

const Monitor = ({ onStart, transitioning }) => {
  const gameState = useGameStore(state => state.gameState)
  const meshRef = useRef()
  const shaderRef = useRef()
  const { mouse } = useThree()

  // Pre-generate shared geometries
  const { wallGeo, backGeo } = useMemo(() => {
    return {
      wallGeo: new THREE.BoxGeometry(0.1, 3.2, 2),    // side
      backGeo: new THREE.BoxGeometry(4.2, 3.2, 0.1),   // back
    }
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.elapsedTime

        // Swivel logic removed to keep the monitor strictly fixed
        meshRef.current.rotation.x = 0;
        meshRef.current.rotation.y = 0;

        if (shaderRef.current) {
            shaderRef.current.uTime = time

            // TV Cut Animation
            if (transitioning) {
                shaderRef.current.uCollapse = THREE.MathUtils.lerp(shaderRef.current.uCollapse, 0.0, 0.08)
            } else {
                shaderRef.current.uCollapse = 1.0
            }

            // Glitch Update
            if (Math.random() > 0.98) {
                shaderRef.current.uGlitch = Math.random()
            } else {
                shaderRef.current.uGlitch = THREE.MathUtils.lerp(shaderRef.current.uGlitch, 0, 0.1)
            }
            // Keep uHoverNudge at 0 since hover glitch is removed
            shaderRef.current.uHoverNudge.set(0, 0)
        }
    })

    const handleClick = (e) => {
        e.stopPropagation()
        if (!transitioning && gameState === 'START') {
            playTVCutSound()
            onStart()
        }
    }

    return (
        <group ref={meshRef}>
            {/* The side walls of the monitor case */}
            <group>
        <mesh position={[-2.1, 0, 0]} geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d6d2c4" roughness={0.8} />
        </mesh>
        <mesh position={[2.1, 0, 0]} geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d6d2c4" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.6, 0]} rotation={[0, 0, Math.PI/2]} geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d6d2c4" roughness={0.8} />
        </mesh>
        <mesh position={[0, -1.6, 0]} rotation={[0, 0, Math.PI/2]} geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial color="#d6d2c4" roughness={0.8} />
        </mesh>
      </group>
      
      {/* Back Plate */}
      <mesh position={[0, 0, -1]} geometry={backGeo}>
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* HOLLOW BEZEL RIM */}
      <group position={[0, 0, 1.01]}>
          <mesh position={[0, 1.4, 0]}>
              <boxGeometry args={[4, 0.2, 0.1]} />
              <meshStandardMaterial color="#d6d2c4" />
          </mesh>
          <mesh position={[0, -1.4, 0]}>
              <boxGeometry args={[4, 0.2, 0.1]} />
              <meshStandardMaterial color="#d6d2c4" />
          </mesh>
          <mesh position={[-1.9, 0, 0]}>
              <boxGeometry args={[0.2, 3, 0.1]} />
              <meshStandardMaterial color="#d6d2c4" />
          </mesh>
          <mesh position={[1.9, 0, 0]}>
              <boxGeometry args={[0.2, 3, 0.1]} />
              <meshStandardMaterial color="#d6d2c4" />
          </mesh>
      </group>

      {/* POWER LED */}
      <mesh position={[1.7, -1.4, 1.06]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} />
      </mesh>

      {/* CRT SCREEN (Replaces Recursive Layers) */}
      <mesh 
        position={[0, 0, 0.9]} 
        onClick={(e) => {
            if (gameState === 'START') {
                e.stopPropagation()
                handleClick(e)
            }
        }}
      >
        <planeGeometry args={[3.85, 2.85]} />
        <cRTShaderMaterial ref={shaderRef} transparent={true}>
            {/* Using default perspective camera for RenderTexture so text renders visibly within bounds */}
            <RenderTexture attach="tDiffuse">
                <color attach="background" args={['#020202']} />
                
                {/* The Content inside the TV. Switch based on game state. */}
                <group scale={1.8}>
                    {gameState === 'MAIN_MENU' ? (
                        <MainMenu3D />
                    ) : (
                        <Text
                            fontSize={0.35}
                            color="#06b6d4"
                            anchorX="center"
                            anchorY="middle"
                            position={[0, 0, 0]}
                        >
                            TAP TO WORK
                        </Text>
                    )}
                </group>
                
                {/* Simple grid lines embedded in the texture */}
                <gridHelper args={[10, 20, '#022126', '#022126']} rotation={[Math.PI/2, 0, 0]} position={[0, 0, -1]} />
            </RenderTexture>
        </cRTShaderMaterial>
      </mesh>

      {/* Stand */}
      <mesh position={[0, -1.8, 0.2]} castShadow>
        <cylinderGeometry args={[0.3, 0.5, 0.4, 16]} />
        <meshStandardMaterial color="#d6d2c4" />
      </mesh>

      {/* Atmospheric Interior Light */}
      <pointLight position={[0, 0, 1.5]} intensity={5} distance={5} color="#06b6d4" />
    </group>
  )
}

export default Monitor


