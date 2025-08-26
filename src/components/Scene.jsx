import { Canvas } from '@react-three/fiber'
import UIOverlay from './UIOverlay'
import SandPlane from './SandPlane'
import { useState, useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { Koi } from './Koi'
import { OrbitControls } from '@react-three/drei'

export default function Scene() {
  const [screen, setScreen] = useState('intro')
  const containerRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 2, ease: 'power2.out' }
      )
  }, [])

  return (
    <div ref={containerRef} className='w-screen h-screen overflow-hidden opacity-0'>
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 50,
        }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true, // Prevent context loss
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]} // Limit device pixel ratio for performance
        performance={{
          min: 0.5,
          max: 1,
          debounce: 200
        }}
      >
        {/* Aquarium Lighting */}
        <ambientLight intensity={0.5} color="#87ceeb" />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={3} 
          castShadow 
        />
        
        {/* Sand Plane Background */}
        <SandPlane />

        <OrbitControls />
        
        {/* Two Koi fish with circular motion - 180 degrees offset */}
        <Koi offset={0} radius={1.8} speed={0.5} />
        <Koi offset={Math.PI} radius={1.8} speed={0.5} />
        
        {/* Aquarium Sphere */}
        {/* <AquariumSphere breathData={breathData} /> */}
        
        {/* UI Overlay with Environment Controls and Breath Control */}
      </Canvas>
      <UIOverlay screen={screen} setScreen={setScreen} />
    </div>
  )
}
