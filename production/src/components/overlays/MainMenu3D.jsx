import React, { useState } from 'react'
import { Text } from '@react-three/drei'
import { useGameStore } from '../../store/useGameStore'
import * as THREE from 'three'

// Simple interactive 3D text button
const Button3D = ({ position, text, onClick, fontSize = 0.15, align = 'left', color = '#06b6d4', width = 2 }) => {
    const [hovered, setHovered] = useState(false)
    
    return (
        <group position={position}>
            <Text
                position={[0, 0, 0]}
                fontSize={fontSize}
                color={hovered ? '#ffffff' : color}
                anchorX={align}
                anchorY="middle"
                
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick(); 
                }}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                {hovered ? `> ${text} <` : text}
            </Text>
            {/* Hitbox padding */}
            <mesh 
                position={[align === 'left' ? width/2 : (align === 'right' ? -width/2 : 0), 0, 0]} 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClick(); 
                }} 
                onPointerOver={() => setHovered(true)} 
                onPointerOut={() => setHovered(false)}
            >
                <planeGeometry args={[width, fontSize * 1.5]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </group>
    )
}

const MainMenu3D = () => {
    const { settings, updateSettings, clearHistory, playthroughs, highScore, setGameState } = useGameStore()

    const handleBegin = () => {
        if (settings.skip3D) setGameState('2D_WORK')
        else setGameState('3D_STREET')
    }

    // Hard Wipe Function
    const handleFullWipe = () => {
        // Clear Zustand store
        clearHistory()
        
        // Literal storage wipe
        localStorage.clear()
        sessionStorage.clear()
        
        // Wipe all cookies
        document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Force reload page to start completely fresh
        window.location.reload()
    }

    return (
        <group position={[0, 0, 0]}>
            {/* Header */}
            <Text position={[0, 1.2, 0]} fontSize={0.25} color="#06b6d4" anchorX="center" anchorY="middle" >
                NEXUS CORP OS - EMPLOYMENT PROTOCOL
            </Text>
            <mesh position={[0, 1.0, 0]}>
                <planeGeometry args={[3.6, 0.02]} />
                <meshBasicMaterial color="#06b6d4" transparent opacity={0.5} />
            </mesh>

            {/* Left Column (Actions) */}
            <group position={[-2.8, 0.6, 0]}>
                <Button3D position={[0, 0, 0]} text="BEGIN ASSIGNMENT" onClick={handleBegin} fontSize={0.2} color="#00ff00" />
                
                <Text position={[0, -0.4, 0]} fontSize={0.12} color="#06b6d4" anchorX="left" opacity={0.7} >
                    // SYSTEM SETTINGS
                </Text>

                <Button3D 
                    position={[0, -0.65, 0]} 
                    text={`VOL: ${Math.round(settings.volume * 100)}% [CHANGE]`} 
                    onClick={() => updateSettings({ volume: settings.volume >= 1 ? 0 : settings.volume + 0.25 })} 
                    fontSize={0.12} 
                />

                <Button3D 
                    position={[0, -0.9, 0]} 
                    text={`BYPASS 3D: ${settings.skip3D ? 'ON' : 'OFF'}`} 
                    onClick={() => updateSettings({ skip3D: !settings.skip3D })} 
                    fontSize={0.12} 
                />

                <Button3D 
                    position={[0, -1.3, 0]} 
                    text="FORMAT PERSONNEL RECORD" 
                    onClick={handleFullWipe} 
                    fontSize={0.1} 
                    color="#ff0000" 
                />
            </group>

            {/* Right Column (Stats) */}
            <group position={[2.8, 0.6, 0]}>
                <Text position={[0, 0, 0]} fontSize={0.12} color="#06b6d4" anchorX="right" opacity={0.7} >
                    GLOBAL APEX (HIGH SCORE)
                </Text>
                <Text position={[0, -0.3, 0]} fontSize={0.4} color="#ffffff" anchorX="right" >
                    {highScore}
                </Text>

                <Text position={[0, -0.7, 0]} fontSize={0.12} color="#06b6d4" anchorX="right" opacity={0.7} >
                    ASSIGNMENT LOGS:
                </Text>
                
                {playthroughs.slice(0, 4).map((log, i) => (
                    <Text key={i} position={[0, -0.9 - (i * 0.15), 0]} fontSize={0.10} color="#06b6d4" anchorX="right" >
                        {`${log?.date?.substring(0, 5) || '???'} - ${log?.score || 0}pts [${log?.ending?.substring(0, 10) || 'Unknown'}]`}
                    </Text>
                ))}
            </group>
        </group>
    )
}

export default MainMenu3D
