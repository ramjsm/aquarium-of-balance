import { Canvas } from '@react-three/fiber'
import UIOverlay from './UIOverlay'
import SandPlane from './SandPlane'
import { useState, useRef, useEffect, useMemo, memo } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { KoiSchool } from './KoiSchool'
import { Leva, useControls } from 'leva'
import { DoubleSide } from 'three'
import { Boids } from './Boids'
import { Environment, OrbitControls, SoftShadows } from '@react-three/drei'
import useBreathTracking from '../hooks/useBreathTracking'

// Separate memoized component for the 3D Canvas to prevent re-renders from breath tracking
const AquariumCanvas = memo(({ animationMode, responsiveBoundaries, boundaries, background, breathData }) => {
  return (
    <Canvas
      camera={{
        position: [0, 0, 4],
        fov: 80,
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
      {/* LIGHTS */}
      <SoftShadows size={15} focus={1.5} samples={12} />
      <Environment preset="sunset"></Environment>
      <directionalLight
        position={[15, 15, 15]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
        shadow-camera-far={300}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.1}
      />
      <color attach="background" args={[background]} />
      {/* <fog attach="fog" args={["#000000", 12, 20]} /> */}

      {/* Boundaries */}
      <mesh visible={boundaries.debug}>
        <boxGeometry args={[responsiveBoundaries.x, responsiveBoundaries.y, responsiveBoundaries.z]} />
        <meshStandardMaterial color="red" transparent opacity={0.5} side={DoubleSide} wireframe />
      </mesh>
      
      {/* Sand Plane Background */}
      <SandPlane position={[0, (-responsiveBoundaries.y / 2) - 1, 0]} />
      
      {/* Boids */}
      <Boids boundaries={responsiveBoundaries} breathData={breathData} />
      
      {/* UI Overlay with Environment Controls and Breath Control */}
      <OrbitControls />
    </Canvas>
  )
})

export default function Scene() {
  const [screen, setScreen] = useState('intro')
  const [animationMode, setAnimationMode] = useState('harmonious') // 'harmonious' or 'chaotic'
  const [size, setSize] = useState([window.innerWidth, window.innerHeight])
  
  // Breath tracking hook
  const breathData = useBreathTracking()
  const scaleX = Math.max(0.5, size[0] / 1920)
  const scaleY = Math.max(0.5, size[1] / 1080)
   const boundaries = useControls('Boundaries', {
    debug: false,
    x: { value: 20, min: 0, max: 40 },
    y: { value: 3.6, min: 0, max: 40 },
    z: { value: 20, min: 0, max: 40 },
    },
    { collapsed: true }
);

const { background } = useControls('Colors', {
    background: '#3ba2c1'
  },
    { collapsed: true }
);
  // Memoize responsiveBoundaries to prevent unnecessary re-renders
  const responsiveBoundaries = useMemo(() => ({
    x: boundaries.x * scaleX,
    y: boundaries.y * scaleY,
    z: boundaries.z
  }), [boundaries.x, boundaries.y, boundaries.z, scaleX, scaleY])
  const containerRef = useRef(null)
 

// TODO: use r3f resize instead
useEffect(() => {
  let timeout;
  function updateSize() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setSize([window.innerWidth, window.innerHeight])
    }, 50)
  }
  window.addEventListener("resize", updateSize);
  return () => window.removeEventListener("resize", updateSize);
})

  // Keyboard controls for switching animation modes
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'h' || event.key === 'H') {
        setAnimationMode('harmonious')
        console.log('Animation mode: Harmonious')
      } else if (event.key === 'c' || event.key === 'C') {
        setAnimationMode('chaotic')
        console.log('Animation mode: Chaotic')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useGSAP(() => {
    gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 2, ease: 'power2.out' }
      )
  }, [])

  return (
    <div ref={containerRef} className='w-screen h-screen overflow-hidden opacity-0'>
      {/* Memoized 3D Canvas - won't re-render when breath data updates */}
      <AquariumCanvas 
        animationMode={animationMode}
        responsiveBoundaries={responsiveBoundaries}
        boundaries={boundaries}
        background={background}
        breathData={breathData}
      />
      
      {/* UI Overlay - will re-render for breath data updates */}
      <UIOverlay screen={screen} setScreen={setScreen} breathData={breathData} />
      <Leva collapsed />
    </div>
  )
}
