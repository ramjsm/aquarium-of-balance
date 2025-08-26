import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export function Koi(props) {
  const { offset = 0, radius = 1, speed = 1 } = props
  const { nodes, materials } = useGLTF('/models/koi_test.glb')
  const groupRef = useRef()
  
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.elapsedTime
      // Circular motion - clockwise direction
      const angle = -time * speed + offset // Negative for clockwise
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      
      groupRef.current.position.set(x, y, 0)
      
      // Rotate the koi to face the direction it's moving
      // For clockwise motion, the koi should face the direction of movement
      groupRef.current.rotation.z = angle
    }
  })
  
  return (
    <group ref={groupRef} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Koi_Test.geometry}
        material={materials.defaultMat}
        position={[0, 0, -2]}
        rotation={[Math.PI / 2, 0, 0]} // 90 degrees in radians
      />
    </group>
  )
}

useGLTF.preload('/models/koi_test.glb')