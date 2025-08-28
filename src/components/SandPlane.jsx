import { useTexture } from '@react-three/drei'
import { CircleGeometry, RepeatWrapping } from 'three'
import RippleSandMaterial from './RippleSandMaterial'

// Preload textures
useTexture.preload('/textures/sand/sand.png')
useTexture.preload('/textures/sand/sand01_Displacement.jpg')
useTexture.preload('/textures/sand/sand01_Normal.jpg')
useTexture.preload('/textures/sand/sand01_Roughness.jpg')

export default function SandPlane({ position }) {
  // Load the sand textures
  const [
    colorMap,
    displacementMap,
    normalMap,
    roughnessMap
  ] = useTexture([
    '/textures/sand/sand.png',
    '/textures/sand/sand01_Displacement.jpg',
    '/textures/sand/sand01_Normal.jpg',
    '/textures/sand/sand01_Roughness.jpg',
  ])
  
  // Set texture wrapping (repeat is handled in shader)
  colorMap.wrapS = colorMap.wrapT = RepeatWrapping
  displacementMap.wrapS = displacementMap.wrapT = RepeatWrapping
  normalMap.wrapS = normalMap.wrapT = RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping
  
  // Texture repeat value - HIGHER numbers = smaller texture (more zoomed out)
  // Examples: 2 = big texture, 8 = small texture, 12 = very small texture  
  const repeatValue = 4
  
  return (
    <mesh
      position={position} // Position behind other objects
      rotation={[-Math.PI / 2, 0, 0]} // Face the camera directly
      receiveShadow
    >
      {/* Create a large plane geometry with enough segments for ripple effects */}
      <planeGeometry args={[50, 50, 128, 128]} />
      
      {/* Apply custom ripple sand material */}
      <meshStandardMaterial
        colorMap={colorMap}
        displacementMap={displacementMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
      />
    </mesh>
  )
}
