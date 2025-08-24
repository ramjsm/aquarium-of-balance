import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'

export default function AquariumSphere({ breathData }) {
  const meshRef = useRef()
  const { 
    distortionValue, 
    breathLevel, 
    breathingPatternScore, 
    isListening,
    patternSignal,
    isPatternDetected 
  } = breathData || {
    distortionValue: 0.65,
    breathLevel: 0.8,
    breathingPatternScore: 0,
    isListening: false,
    patternSignal: 0,
    isPatternDetected: false
  }

  // Enhanced animation using pattern signal for organic movement
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Use pattern signal for more organic behavior
      const patternInfluence = patternSignal || 0
      
      // Rotation speed - faster when chaotic, slower when patterned
      const baseSpeed = 0.6
      const rotationSpeed = baseSpeed - (patternInfluence * 0.5)
      meshRef.current.rotation.x += delta * rotationSpeed
      meshRef.current.rotation.y += delta * (rotationSpeed * 1.2)
      
      // Subtle pulsing effect based on pattern detection
      if (isPatternDetected) {
        const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.05 + 1
        meshRef.current.scale.setScalar(pulse)
      } else {
        // Return to normal scale when no pattern
        meshRef.current.scale.lerp({ x: 1, y: 1, z: 1 }, delta * 2)
      }
    }
  })

  // Enhanced color system based on pattern analysis
  let sphereColor = '#87ceeb' // Default aqua blue
  
  if (isListening && patternSignal !== undefined) {
    if (isPatternDetected) {
      // Green-blue spectrum when pattern is detected (calming)
      const hue = 180 + (patternSignal * 40) // Cyan to green as pattern strengthens
      const saturation = 60 + (patternSignal * 30) // More saturated with stronger pattern
      const lightness = 55 + (patternSignal * 25) // Brighter with better pattern
      sphereColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    } else {
      // Blue-purple spectrum when no pattern (active but chaotic)
      const hue = 220 + (patternSignal * 20) // Blue to purple
      const saturation = 50 + (patternSignal * 20)
      const lightness = 50 + (patternSignal * 15)
      sphereColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
    }
  }
  
  // Calculate organic distortion value
  // Use pattern signal for smoother, more responsive distortion
  const organicDistortion = (() => {
    if (!isListening || patternSignal === undefined) {
      return 0.65 // Default high distortion when not listening
    }
    
    // Pattern signal is 0-1, where 1 = perfect pattern, 0 = no pattern
    // We want high distortion (chaotic) when pattern is low
    // and low distortion (calm) when pattern is high
    const baseDistortion = 0.1  // Minimum distortion (very calm)
    const maxDistortion = 0.8    // Maximum distortion (very chaotic)
    
    // Invert pattern signal: 0 pattern = high distortion, 1 pattern = low distortion
    const invertedPattern = 1 - patternSignal
    
    // Apply a gentle curve to make the transition more organic
    const curvedDistortion = Math.pow(invertedPattern, 0.7)
    
    return baseDistortion + (curvedDistortion * (maxDistortion - baseDistortion))
  })()

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 128, 128]} />
      <MeshDistortMaterial
        color={sphereColor}
        attach="material"
        distort={organicDistortion} // New organic distortion based on pattern analysis
        speed={isPatternDetected ? 1.0 : 1.8} // Slower animation when patterned
        roughness={0.1}
        metalness={0.2}
        transparent={true}
        opacity={isPatternDetected ? 0.8 : 0.7} // More opaque when patterned
        clearcoat={1.0}
        clearcoatRoughness={0.0}
        transmission={isPatternDetected ? 0.5 : 0.6} // Less transparent when patterned
        thickness={0.4}
        ior={1.33}
        envMapIntensity={isPatternDetected ? 2.5 : 2.0} // More reflective when patterned
      />
    </mesh>
  )
}
