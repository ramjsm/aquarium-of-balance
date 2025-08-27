import { useGLTF } from '@react-three/drei'

export function Koi(props) {
  const { nodes, materials } = useGLTF('/models/koi_test.glb')
  
  return (
    <group {...props} dispose={null}>
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