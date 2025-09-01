import { useAnimations, useGLTF, useTexture } from "@react-three/drei";

// import { useAtom } from "jotai";
import { useEffect, useMemo, useRef, memo } from "react";
import { Vector3 } from "three";
import { SkeletonUtils } from "three-stdlib";
// import { themeAtom, THEMES } from "./UI";
import { useControls } from "leva";
import { randFloat } from "three/src/math/MathUtils.js";
import { useFrame } from "@react-three/fiber";
import * as THREE from 'three'

const wander = new Vector3();
const horizontalWander = new Vector3();
const steering = new Vector3();
const limits = new Vector3();
const alignment = new Vector3();
const avoidance = new Vector3();
const cohesion = new Vector3();

const BoidsComponent = ({
    boundaries,
    breathData
}) => {
  const previousIntensityRef = useRef(null)
  const MIN_SCALE = 0.7
  const MAX_SCALE =  1.1
  const MIN_SPEED =  0.5
  const MAX_SPEED = 1.0
  const MAX_STEERING = 0.05
 /*  const { MIN_SCALE, MAX_SCALE, MIN_SPEED , MAX_SPEED, MAX_STEERING } = useControls(
    "General Setting",
    {
        MIN_SCALE: { value: 0.7, min: 0.1, max: 2, step: 0.1 },
        MAX_SCALE: { value: 1.1, min: 0.1, max: 2, step: 0.1 },
        MIN_SPEED: { value: 0.5, min: 0, max: 10, step: 0.1 },
        MAX_SPEED: { value: 1.0, min: 0, max: 10, step: 0.1 },
        MAX_STEERING: { value: 0.05, min: 0, max: 1, step: 0.01 },
    },
    { collapsed: true }
  ) */

  // Wander settings - hardcoded (hidden from Leva)
  const WANDER_RADIUS = 1
  const WANDER_STRENGTH = 2
  const WANDER_CIRCLE = false
  /* const { WANDER_CIRCLE, WANDER_STRENGTH, WANDER_RADIUS } = useControls(
    "Wander",
    {
        WANDER_RADIUS: { value: 1, min: 1, max: 10 },
        WANDER_STRENGTH: { value: 2, min: 0, max: 10, step: 1 },
        WANDER_CIRCLE: false
    },
    { collapsed: true }
  ) */

  const DisplayVisualRange = false

  const { Fishes, Alignment, Avoidance, Cohesion, VisualRange  } = useControls(
    {
        Fishes: { value: 80, min: 1, max: 200 }, 
        VisualRange: { value: 3, min: 1, max: 10 },
        Alignment: { value: 0, min: 0, max: 10, step: 1 },
        Avoidance: { value: 0, min: 0, max: 40, step: 1 },
        Cohesion: { value: 0, min: 0, max: 10, step: 1 }
    },
    { collapsed: false }
  )



  const boids = useMemo(() => {   
    return new Array(Fishes).fill().map((_, i) => ({
        model: 'Koi_01',
        position: new Vector3(
            randFloat(-boundaries.x / 2, boundaries.x / 2),
            randFloat(-boundaries.y / 2, boundaries.y / 2),
            randFloat(-boundaries.z / 2, boundaries.z / 2),
        ),
        velocity: new Vector3(0, 0, 0),
        wander: randFloat(0, Math.PI * 2),
        scale: randFloat(MIN_SCALE, MAX_SCALE),
        type: i % 2 === 0 ? 'white' : 'black' // Alternate between white and black
    }))
  }, [Fishes, boundaries, MIN_SCALE, MAX_SCALE])

  useFrame((_, delta) => {
    for(let i = 0; i < boids.length; i++) {
      const boid = boids[i];

      // WANDER 
      boid.wander += randFloat(-0.05, 0.05);
      wander.set(
        Math.cos(boid.wander) * WANDER_RADIUS,
        Math.sin(boid.wander) * WANDER_RADIUS,
        0,
      )

      wander.normalize();
      wander.multiplyScalar(WANDER_STRENGTH);

      horizontalWander.set(
        Math.cos(boid.wander) * WANDER_RADIUS,
        0,
        Math.sin(boid.wander) * WANDER_RADIUS,
      )

      horizontalWander.normalize();
      horizontalWander.multiplyScalar(WANDER_STRENGTH);

      // RESET FORCES
      limits.multiplyScalar(0)
      steering.multiplyScalar(0);
      alignment.multiplyScalar(0);
      avoidance.multiplyScalar(0);
      cohesion.multiplyScalar(0);

      // LIMITS
      if(Math.abs(boid.position.x) + 1 > boundaries.x / 2 ) {
        limits.x = -boid.position.x;
        boid.wander += Math.PI;
      }

      if(Math.abs(boid.position.y) + 1 > boundaries.y / 2 ) {
        limits.y = -boid.position.y;
        boid.wander += Math.PI;
      }

      if(Math.abs(boid.position.z) + 1 > boundaries.z / 2 ) {
        limits.z = -boid.position.z;
        boid.wander += Math.PI;
      }

      const intensity = THREE.MathUtils.lerp(previousIntensityRef.current, Math.max(breathData.getBreathIntensity() * 20, 1), 0.75);
      previousIntensityRef.current = intensity

      limits.normalize()
      limits.multiplyScalar(intensity * 10)

      let totalCohesion = 0;

      for (let b = 0; b < boids.length; b++) {
        if(b === i) {
          continue;
        }
        const other = boids[b];
        let d = boid.position.distanceTo(other.position)

        // ALIGNMENT

        if((d > 0 && d < VisualRange) && boid.type === other.type) {
          const copy = other.velocity.clone()
          copy.normalize()
          copy.divideScalar(d)
          alignment.add(copy)
        }

        // AVOID
        if(d > 0 && d < VisualRange) {
          const diff = boid.position.clone().sub(other.position)
          diff.normalize()
          diff.divideScalar(d)
          avoidance.add(diff)
        }

        // COHESION
        if((d > 0 && d < VisualRange)  && boid.type === other.type) {
          cohesion.add(other.position)
          totalCohesion++;
        }
      }

      // APPLY FORCES
      steering.add(limits);
      steering.add(wander);
      steering.add(horizontalWander);

      if(Alignment > 0) {
        alignment.normalize();
        alignment.multiplyScalar(Alignment)
        steering.add(alignment)
      }

      if(Avoidance > 0) {
        avoidance.normalize();
        avoidance.multiplyScalar(Avoidance)
        steering.add(avoidance)
      }

      if(Cohesion > 0 && totalCohesion > 0) {
        cohesion.divideScalar(totalCohesion);
        cohesion.sub(boid.position);
        cohesion.normalize()
        cohesion.multiplyScalar(Cohesion)
        steering.add(cohesion)
      }

      steering.clampLength(0, MAX_STEERING * delta);
      boid.velocity.add(steering);

      boid.velocity.clampLength(
      0, 
      THREE.MathUtils.mapLinear(boid.scale, MIN_SCALE, MAX_SCALE, (MAX_SPEED * intensity), (MIN_SPEED * intensity)) *
      delta
      );

      // APPLY VELOCITY
      boid.position.add(boid.velocity)
    }
  })

  return boids.map((boid, index) => (
      <Boid
        key={index}
        position={boid.position}
        model={boid.model}
        scale={boid.scale}
        velocity={boid.velocity}
        animation={"Fish_Armature|Swimming_Fast"}
        type={boid.type}
        wanderCircle={WANDER_CIRCLE}
        wanderRadius={WANDER_RADIUS / boid.scale}
        showVisualRange={DisplayVisualRange}
        visualRange={VisualRange / boid.scale}
        breathData={breathData}
      />
  ))
};

// Custom comparison function for React.memo
function arePropsEqual(prevProps, nextProps) {
  // Only re-render if boundaries object properties actually changed
  return (
    prevProps.boundaries.x === nextProps.boundaries.x &&
    prevProps.boundaries.y === nextProps.boundaries.y &&
    prevProps.boundaries.z === nextProps.boundaries.z
  )
}

// Memoized export to prevent re-renders when breath data changes
export const Boids = memo(BoidsComponent, arePropsEqual)

const Boid = ({ position, model, animation, velocity, type, wanderCircle, wanderRadius, showVisualRange, visualRange, breathData, ...props }) => {
  const { scene, animations } = useGLTF(`/models/${model}.glb`);
  const [koiWhiteTexture, koiBlackTexture] = useTexture([
    '/textures/sand/koi_white_edited.png',
    '/textures/sand/koi_black_edited.png'
  ]);
  koiWhiteTexture.flipY = false
  koiBlackTexture.flipY = false
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const group = useRef();
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        // Apply the appropriate koi texture based on textureType
        if (child.material) {
          // Clone the material to avoid sharing between instances
          child.material = child.material.clone();
          child.material.map = type === 'white' ? koiWhiteTexture : koiBlackTexture;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [clone, koiWhiteTexture, koiBlackTexture, type]);

  useEffect(() => {
    actions[animation]?.play()

    return () => {
      actions[animation]?.stop();
    };
  }, [actions, animation]);

  useFrame(() => {
    const target = group.current.clone(false);
    target.lookAt(group.current.position.clone().add(velocity));
    group.current.quaternion.slerp(target.quaternion, 0.05)
    
    group.current.position.copy(position)

    actions[animation].timeScale = Math.max(breathData.getBreathIntensity() * 5, 1)
  })

  return (
    <group {...props} ref={group} position={position}>
      <primitive object={clone} rotation-y={Math.PI / 2} />
      <mesh visible={wanderCircle}>
        <sphereGeometry args={[wanderRadius, 32]} />
        <meshStandardMaterial color="red" wireframe />
      </mesh>
      <mesh visible={showVisualRange}>
        <sphereGeometry args={[visualRange, 32]} />
        <meshStandardMaterial color="gray" wireframe transparent opacity={0.025} />
      </mesh>
    </group>
  );
};