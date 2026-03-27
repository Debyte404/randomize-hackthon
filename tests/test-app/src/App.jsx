import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

function Box(props) {
  const meshRef = useRef()
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta
    meshRef.current.rotation.y += delta * 0.5
  })

  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color={'#06b6d4'} />
    </mesh>
  )
}

function App() {
  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="absolute top-0 left-0 w-full p-8 z-10 pointer-events-none selection:bg-cyan-900">
        <h1 className="text-5xl font-black tracking-tight text-center text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          ShadowIntern Test Build
        </h1>
        <p className="text-center text-gray-300 mt-4 text-xl">React + Tailwind UI Layer overlays Three.js Canvas</p>
      </div>
      
      <div className="flex-grow w-full h-full cursor-grab active:cursor-grabbing">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Box position={[0, 0, 0]} />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  )
}

export default App
