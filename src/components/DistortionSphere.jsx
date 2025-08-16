import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'

export default function AquariumSphere({ breathData }) {
  const meshRef = useRef()
  const { distortionValue, breathLevel, breathingPatternScore, isListening } = breathData || {
    distortionValue: 0.65,
    breathLevel: 0.8,
    breathingPatternScore: 0,
    isListening: false
  }

  // Rotation animation - slower when breathing is more stable/rhythmic
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Rotation speed varies inversely with pattern stability (more stable = slower rotation)
      const baseSpeed = 0.5 // Start with higher base speed
      const patternInfluence = breathingPatternScore * 0.4 // Pattern score reduces speed
      const rotationSpeed = baseSpeed - patternInfluence
      meshRef.current.rotation.x += delta * rotationSpeed
      meshRef.current.rotation.y += delta * (rotationSpeed * 1.5)
    }
  })

  // Color shifts based on breathing pattern stability
  const sphereColor = isListening 
    ? `hsl(${200 + (breathingPatternScore * 60)}, 70%, ${60 + (breathingPatternScore * 20)}%)` // Blue to cyan as pattern improves
    : '#87ceeb'

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.8, 128, 128]} />
      <MeshDistortMaterial
        color={sphereColor}
        attach="material"
        distort={distortionValue} // Controlled by breathing
        speed={1.5}
        roughness={0.1}
        metalness={0.2}
        transparent={true}
        opacity={0.7}
        clearcoat={1.0}
        clearcoatRoughness={0.0}
        transmission={0.6}
        thickness={0.4}
        ior={1.33}
        envMapIntensity={2.0}
      />
    </mesh>
  )
}
