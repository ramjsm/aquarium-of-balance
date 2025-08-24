import { useTexture } from '@react-three/drei'
import { DoubleSide, RepeatWrapping } from 'three'

export default function SandPlane() {
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
  
  // Set texture wrapping and repeat for tiling
  colorMap.wrapS = colorMap.wrapT = RepeatWrapping
  displacementMap.wrapS = displacementMap.wrapT = RepeatWrapping
  normalMap.wrapS = normalMap.wrapT = RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = RepeatWrapping
  
  // Repeat the texture for better coverage
  const repeatValue = 5
  colorMap.repeat.set(repeatValue, repeatValue)
  displacementMap.repeat.set(repeatValue, repeatValue)
  normalMap.repeat.set(repeatValue, repeatValue)
  roughnessMap.repeat.set(repeatValue, repeatValue)
  
  return (
    <mesh
      position={[0, 0, -5]} // Position behind other objects
      rotation={[0, 0, 0]} // Face the camera directly
    >
      {/* Create a large plane geometry with enough segments for displacement */}
      <planeGeometry args={[20, 20, 32]} />
      
      {/* Apply sand texture material with proper maps */}
      <meshStandardMaterial
        map={colorMap}
        displacementMap={displacementMap}
        displacementScale={0.1} // Adjust this value to control displacement intensity
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        roughness={0.8} // Base roughness value
        side={DoubleSide}
      />
    </mesh>
  )
}
