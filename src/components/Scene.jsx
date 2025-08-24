import { Canvas } from '@react-three/fiber'
import UIOverlay from './UIOverlay'
import SandPlane from './SandPlane'
import { useState } from 'react'

export default function Scene() {
  const [screen, setScreen] = useState('intro')
  return (
    <div className='w-screen h-screen'>
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 50,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        <color attach="background" args={["transparent"]} />
        {/* Aquarium Lighting */}
        <ambientLight intensity={1} color="#87ceeb" />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={5} 
          castShadow 
        />
        
        {/* Sand Plane Background */}
        <SandPlane />
        
        {/* Aquarium Sphere */}
        {/* <AquariumSphere breathData={breathData} /> */}
        
        {/* UI Overlay with Environment Controls and Breath Control */}
      </Canvas>
      <UIOverlay screen={screen} setScreen={setScreen} />
    </div>
  )
}
