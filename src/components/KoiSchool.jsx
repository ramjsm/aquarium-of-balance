import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

export function KoiSchool({ 
  count = 2, 
  radius = 2.5, 
  speed = 0.5, 
  offsets = [0, Math.PI],
  animationMode = 'harmonious', // 'harmonious' or 'chaotic'
  // Boids flocking parameters
  separationRadius = 0.8,
  alignmentRadius = 1.2, 
  cohesionRadius = 1.5,
  separationWeight = 1.5,
  alignmentWeight = 1.0,
  cohesionWeight = 1.0,
  maxSpeed = 2.0,
  maxForce = 0.3
}) {
  const { nodes, materials } = useGLTF('/models/koi_test.glb')
  const instancedMeshRef = useRef()
  
  // Data structures for boids simulation
  const boidsData = useMemo(() => {
    const positions = []
    const velocities = []
    const accelerations = []
    
    for (let i = 0; i < count; i++) {
      // Initialize positions randomly or in a pattern
      const angle = (i / count) * Math.PI * 2
      positions.push(new THREE.Vector3(
        Math.cos(angle) * radius * 0.5,
        0,
        Math.sin(angle) * radius * 0.5
      ))
      
      // Initialize random velocities for chaotic mode
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        0,
        (Math.random() - 0.5) * 2
      ))
      
      // Initialize zero accelerations
      accelerations.push(new THREE.Vector3(0, 0, 0))
    }
    
    return { positions, velocities, accelerations }
  }, [count, radius])
  
  // Harmonious circular motion animation
  const updateHarmoniousMotion = (time) => {
    for (let i = 0; i < count; i++) {
      // Calculate circular motion for each instance
      const offset = offsets[i] || (i * (Math.PI * 2) / count) // Default to evenly spaced
      const angle = -time * speed + offset // Negative for clockwise
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      // Create transformation matrix
      const tempObject = new THREE.Object3D()
      tempObject.position.set(x, 0, z)
      tempObject.rotation.set(Math.PI / 2, angle + Math.PI / 2, 0) // Face direction + base rotation
      tempObject.updateMatrix()
      
      // Update the instance matrix
      instancedMeshRef.current.setMatrixAt(i, tempObject.matrix)
    }
  }
  
  // Helper function to find neighbors within a given radius
  const getNeighbors = (boidIndex, searchRadius) => {
    const neighbors = []
    const boidPosition = boidsData.positions[boidIndex]
    
    for (let i = 0; i < count; i++) {
      if (i !== boidIndex) {
        const distance = boidPosition.distanceTo(boidsData.positions[i])
        if (distance < searchRadius) {
          neighbors.push(i)
        }
      }
    }
    
    return neighbors
  }
  
  // Separation: steer to avoid crowding local flockmates
  const separate = (boidIndex) => {
    const steer = new THREE.Vector3(0, 0, 0)
    const neighbors = getNeighbors(boidIndex, separationRadius)
    
    if (neighbors.length > 0) {
      const boidPosition = boidsData.positions[boidIndex]
      
      for (const neighborIndex of neighbors) {
        const neighborPosition = boidsData.positions[neighborIndex]
        const diff = new THREE.Vector3().subVectors(boidPosition, neighborPosition)
        const distance = diff.length()
        
        if (distance > 0) {
          diff.normalize()
          diff.divideScalar(distance) // Weight by distance (closer = stronger force)
          steer.add(diff)
        }
      }
      
      steer.divideScalar(neighbors.length)
      
      if (steer.length() > 0) {
        steer.normalize()
        steer.multiplyScalar(maxSpeed)
        steer.sub(boidsData.velocities[boidIndex])
        steer.clampLength(0, maxForce)
      }
    }
    
    return steer
  }
  
  // Alignment: steer towards the average heading of neighbors
  const align = (boidIndex) => {
    const steer = new THREE.Vector3(0, 0, 0)
    const neighbors = getNeighbors(boidIndex, alignmentRadius)
    
    if (neighbors.length > 0) {
      for (const neighborIndex of neighbors) {
        steer.add(boidsData.velocities[neighborIndex])
      }
      
      steer.divideScalar(neighbors.length)
      steer.normalize()
      steer.multiplyScalar(maxSpeed)
      steer.sub(boidsData.velocities[boidIndex])
      steer.clampLength(0, maxForce)
    }
    
    return steer
  }
  
  // Cohesion: steer to move towards the average position of neighbors
  const cohesion = (boidIndex) => {
    const steer = new THREE.Vector3(0, 0, 0)
    const neighbors = getNeighbors(boidIndex, cohesionRadius)
    
    if (neighbors.length > 0) {
      const center = new THREE.Vector3(0, 0, 0)
      
      for (const neighborIndex of neighbors) {
        center.add(boidsData.positions[neighborIndex])
      }
      
      center.divideScalar(neighbors.length)
      steer.subVectors(center, boidsData.positions[boidIndex])
      
      if (steer.length() > 0) {
        steer.normalize()
        steer.multiplyScalar(maxSpeed)
        steer.sub(boidsData.velocities[boidIndex])
        steer.clampLength(0, maxForce)
      }
    }
    
    return steer
  }
  
  // Boundary avoidance: steer away from edges
  const avoidBoundaries = (boidIndex) => {
    const steer = new THREE.Vector3(0, 0, 0)
    const position = boidsData.positions[boidIndex]
    const distance = position.length()
    
    // If close to boundary, steer towards center
    if (distance > radius * 0.8) {
      const toCenter = new THREE.Vector3().copy(position).negate()
      toCenter.normalize()
      toCenter.multiplyScalar(maxSpeed)
      steer.subVectors(toCenter, boidsData.velocities[boidIndex])
      steer.clampLength(0, maxForce * 2) // Stronger force for boundaries
    }
    
    return steer
  }
  
  // Full boids flocking simulation
  const updateChaoticMotion = (time, deltaTime) => {
    // Debug: Check if we're getting valid deltaTime
    if (deltaTime <= 0 || deltaTime > 0.1) {
      deltaTime = 1/60 // Fallback to 60fps
    }
    
    // Calculate forces for each boid
    for (let i = 0; i < count; i++) {
      const acceleration = boidsData.accelerations[i]
      acceleration.set(0, 0, 0) // Reset acceleration
      
      // Apply flocking forces
      const separationForce = separate(i)
      const alignmentForce = align(i)
      const cohesionForce = cohesion(i)
      const boundaryForce = avoidBoundaries(i)
      
      // Weight and combine forces
      separationForce.multiplyScalar(separationWeight)
      alignmentForce.multiplyScalar(alignmentWeight)
      cohesionForce.multiplyScalar(cohesionWeight)
      
      acceleration.add(separationForce)
      acceleration.add(alignmentForce)
      acceleration.add(cohesionForce)
      acceleration.add(boundaryForce)
      
      // Add some random motion as fallback if no forces are applied
      if (acceleration.length() < 0.01) {
        acceleration.add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          0,
          (Math.random() - 0.5) * 0.2
        ))
      }
    }
    
    // Update positions and velocities
    for (let i = 0; i < count; i++) {
      const position = boidsData.positions[i]
      const velocity = boidsData.velocities[i]
      const acceleration = boidsData.accelerations[i]
      
      // Update velocity and position
      velocity.add(acceleration.clone().multiplyScalar(deltaTime))
      velocity.clampLength(0, maxSpeed)
      position.add(velocity.clone().multiplyScalar(deltaTime))
      
      // Hard boundary constraint (safety net)
      const distance = position.length()
      if (distance > radius) {
        position.normalize().multiplyScalar(radius)
        velocity.multiplyScalar(0.5) // Reduce speed when hitting boundary
      }
      
      // Calculate rotation to face movement direction
      const angle = Math.atan2(velocity.z, velocity.x)
      
      // Create transformation matrix
      const tempObject = new THREE.Object3D()
      tempObject.position.copy(position)
      tempObject.rotation.set(Math.PI / 2, angle + Math.PI / 2, 0)
      tempObject.updateMatrix()
      
      // Update the instance matrix
      instancedMeshRef.current.setMatrixAt(i, tempObject.matrix)
    }
  }
  
  useFrame((state) => {
    if (instancedMeshRef.current) {
      const time = state.clock.elapsedTime
      const deltaTime = state.clock.getDelta()
      
      // Choose animation based on mode
      if (animationMode === 'harmonious') {
        updateHarmoniousMotion(time)
      } else if (animationMode === 'chaotic') {
        updateChaoticMotion(time, deltaTime)
      }
      
      // Mark matrices as needing update
      instancedMeshRef.current.instanceMatrix.needsUpdate = true
    }
  })
  
  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[nodes.Koi_Test.geometry, materials.defaultMat, count]}
      castShadow
      receiveShadow
    />
  )
}

useGLTF.preload('/models/koi_test.glb')
