import React from 'react'

const OfficeEnvironment = () => {
    return (
        <group>
            {/* Main Desk Surface */}
            <mesh position={[0, -2.5, 0]} receiveShadow>
                <boxGeometry args={[30, 1, 15]} />
                <meshStandardMaterial color="#3d2817" roughness={0.8} />
            </mesh>
            
            {/* Keyboard */}
            <mesh position={[0, -1.95, 3]} receiveShadow castShadow rotation={[-0.05, 0, 0]}>
                <boxGeometry args={[2.5, 0.1, 0.8]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
            </mesh>
            
            {/* Computer Mouse */}
            <mesh position={[2.0, -1.95, 3]} receiveShadow castShadow>
                <boxGeometry args={[0.4, 0.15, 0.7]} />
                <meshStandardMaterial color="#111" roughness={0.6} />
            </mesh>

            {/* Scatter Papers */}
            {Array.from({ length: 6 }).map((_, i) => (
                <mesh 
                    key={`paper-${i}`} 
                    position={[-3 + Math.random() * 6, -1.98 + i * 0.001, 1 + Math.random() * 3]} 
                    rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]} 
                    receiveShadow
                >
                    <planeGeometry args={[0.85, 1.1]} />
                    <meshStandardMaterial color={Math.random() > 0.8 ? "#fdfd96" : "#ffffff"} roughness={1} />
                </mesh>
            ))}

            {/* Stack of Manila Folders / Binders */}
            <mesh position={[-4.5, -1.8, 1]} rotation={[0, 0.4, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.4, 1.5]} />
                <meshStandardMaterial color="#e5c185" roughness={0.9} />
            </mesh>
            <mesh position={[-4.5, -1.5, 1]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 0.2, 1.4]} />
                <meshStandardMaterial color="#cd8c52" roughness={0.8} />
            </mesh>

            {/* Coffee Mug 1 */}
            <group position={[-3, -2.0, 2]} rotation={[0, Math.PI/4, 0]} castShadow>
                <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.25, 0.25, 0.6, 32]} />
                    <meshStandardMaterial color="#f0f0f0" roughness={0.2} />
                </mesh>
                <mesh position={[-0.25, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                    <torusGeometry args={[0.15, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#f0f0f0" roughness={0.2} />
                </mesh>
            </group>

            {/* Coffee Mug 2 (Tipped Over) */}
            <group position={[4, -1.9, 2.5]} rotation={[0, -0.5, Math.PI/2]} castShadow>
                <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.25, 0.25, 0.6, 32]} />
                    <meshStandardMaterial color="#333" roughness={0.5} />
                </mesh>
                <mesh position={[-0.25, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
                    <torusGeometry args={[0.15, 0.05, 16, 32]} />
                    <meshStandardMaterial color="#333" roughness={0.5} />
                </mesh>
            </group>

            {/* Soda Can */}
            <mesh position={[3, -1.75, 1.5]} rotation={[0, Math.random(), 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.5, 32]} />
                <meshStandardMaterial color="#ff0000" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Soda Can 2 (Empty/Crushed imitation) */}
            <mesh position={[-2.5, -1.9, 3.8]} rotation={[Math.PI/2, Math.random(), 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.2, 0.45, 16]} />
                <meshStandardMaterial color="#0055ff" metalness={0.7} roughness={0.4} />
            </mesh>
            
            {/* Stapler */}
            <group position={[3.5, -2.0, 0]} rotation={[0, -0.8, 0]} castShadow>
                <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.2, 0.1, 1.0]} />
                    <meshStandardMaterial color="#222" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.2, -0.3]} rotation={[0.15, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.2, 0.15, 1.0]} />
                    <meshStandardMaterial color="#111" roughness={0.5} metalness={0.2} />
                </mesh>
            </group>

            {/* Pens / Pencils */}
            {Array.from({ length: 4 }).map((_, i) => (
                <mesh 
                    key={`pen-${i}`} 
                    position={[2 + Math.random(), -1.96, 3 + Math.random()]} 
                    rotation={[Math.PI / 2, 0, Math.random() * Math.PI]} 
                    castShadow
                >
                    <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                    <meshStandardMaterial color={['#000', '#ffd700', '#00f'][i % 3]} roughness={0.4} />
                </mesh>
            ))}

            {/* Warm Office Lights (Intense Cinematic Spotlights) */}
            <ambientLight intensity={1.5} color="#ffe8cd" />
            <spotLight 
                position={[0, 10, 5]} 
                angle={1.0} 
                penumbra={0.8} 
                intensity={400} 
                color="#ffedd6" 
                castShadow 
                shadow-mapSize={[1024, 1024]}
                shadow-bias={-0.0001}
            />
            {/* Desk Lamp imitation light */}
            <spotLight 
                position={[-4, 2, 1]} 
                angle={0.6} 
                penumbra={1} 
                intensity={250} 
                color="#ffb973" 
                castShadow 
                target-position={[-2, -2, 2]}
            />
            <pointLight position={[5, 4, -2]} intensity={100} color="#ffedd6" />
            {/* Background Office Wall */}
            <mesh position={[0, 1, -8]} receiveShadow>
                <planeGeometry args={[40, 20]} />
                <meshStandardMaterial color="#d1cdba" roughness={0.9} />
            </mesh>

            {/* Subtle light pointing at the background wall to avoid pure black void */}
            <pointLight position={[0, 4, -4]} intensity={60} distance={20} color="#ffedd6" />

        </group>
    )
}

export default OfficeEnvironment
