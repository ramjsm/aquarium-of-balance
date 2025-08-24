import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

// Custom shader material that extends Three.js MeshStandardMaterial for proper lighting
class RippleSandMaterialImpl extends THREE.MeshStandardMaterial {
  constructor(props = {}) {
    super(props)
    
    // Custom uniforms for ripple effects and texture repeat
    this.userData = {
      uTime: { value: 0 },
      uRippleStrength: { value: 0.05 },
      uRippleFrequency: { value: 2.0 },
      uRippleSpeed: { value: 0.8 },
      uTextureRepeat: { value: new THREE.Vector2(8, 8) },
    }
    
    // Override shader compilation to add custom effects
    this.onBeforeCompile = (shader) => {
      // Add our custom uniforms to the shader
      shader.uniforms.uTime = this.userData.uTime
      shader.uniforms.uRippleStrength = this.userData.uRippleStrength
      shader.uniforms.uRippleFrequency = this.userData.uRippleFrequency
      shader.uniforms.uRippleSpeed = this.userData.uRippleSpeed
      shader.uniforms.uTextureRepeat = this.userData.uTextureRepeat
      
      // Modify vertex shader to add ripple displacement
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        uniform float uRippleStrength;
        uniform float uRippleFrequency;
        uniform float uRippleSpeed;
        uniform vec2 uTextureRepeat;
        varying vec2 vRippleUv;
        `
      )
      
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        
        // Store UV for fragment shader
        vRippleUv = uv;
        
        // Create animated UV offset for displacement texture sampling
        vec2 animatedUv = uv * uTextureRepeat;
        vec2 displacementOffset = vec2(
          sin(animatedUv.x * uRippleFrequency * 1.5 + uTime * uRippleSpeed * 0.5) * 0.02,
          cos(animatedUv.y * uRippleFrequency * 1.2 + uTime * uRippleSpeed * 0.7) * 0.02
        );
        vec2 movingDisplacementUv = animatedUv + displacementOffset;
        
        // Sample displacement texture with moving UVs
        #ifdef USE_DISPLACEMENTMAP
          float displacementValue = texture2D(displacementMap, movingDisplacementUv).r;
          // Convert from 0-1 range to -0.5 to 0.5 range for more natural displacement
          displacementValue = (displacementValue - 0.5) * displacementScale;
        #else
          float displacementValue = 0.0;
        #endif
        
        // Create water ripple displacement
        float ripple1 = sin(position.x * uRippleFrequency + uTime * uRippleSpeed) * 0.5;
        float ripple2 = sin(position.y * uRippleFrequency * 1.3 + uTime * uRippleSpeed * 0.7) * 0.3;
        float ripple3 = sin((position.x + position.y) * uRippleFrequency * 0.8 + uTime * uRippleSpeed * 1.2) * 0.2;
        float rippleDisplacement = (ripple1 + ripple2 + ripple3) * uRippleStrength;
        
        // Combine displacement texture and water ripples
        transformed.z += displacementValue + rippleDisplacement;
        `
      )
      
      // Modify fragment shader to add UV animation
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform float uTime;
        uniform float uRippleStrength;
        uniform float uRippleFrequency;
        uniform float uRippleSpeed;
        uniform vec2 uTextureRepeat;
        varying vec2 vRippleUv;
        `
      )
      
      // Replace UV sampling with animated/distorted UVs
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        // Apply texture repeat to UVs
        vec2 repeatedUv = vRippleUv * uTextureRepeat;
        
        // Create animated UV distortion
        vec2 rippleOffset = vec2(
          sin(repeatedUv.x * uRippleFrequency * 2.0 + uTime * uRippleSpeed) * uRippleStrength * 0.01,
          cos(repeatedUv.y * uRippleFrequency * 1.5 + uTime * uRippleSpeed * 0.8) * uRippleStrength * 0.01
        );
        
        rippleOffset += vec2(
          cos(repeatedUv.y * uRippleFrequency * 3.0 - uTime * uRippleSpeed * 1.5) * uRippleStrength * 0.005,
          sin(repeatedUv.x * uRippleFrequency * 2.5 - uTime * uRippleSpeed * 1.2) * uRippleStrength * 0.005
        );
        
        vec2 distortedUv = repeatedUv + rippleOffset;
        
        #ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, distortedUv );
          #ifdef DECODE_VIDEO_TEXTURE
            sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
          #endif
          diffuseColor *= sampledDiffuseColor;
        #endif
        `
      )
      
      // Update normal map sampling
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normalmap_fragment>',
        `
        #ifdef USE_NORMALMAP
          vec4 texelNormal = texture2D( normalMap, distortedUv );
          vec3 mapN = texelNormal.xyz * 2.0 - 1.0;
          mapN.xy *= normalScale;
          normal = perturbNormalArb( - vViewPosition, normal, mapN, faceDirection );
        #endif
        `
      )
      
      // Update roughness map sampling  
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 texelRoughness = texture2D( roughnessMap, distortedUv );
          roughnessFactor *= texelRoughness.g;
        #endif
        `
      )
      
      // Update displacement map sampling
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <displacementmap_fragment>',
        `
        #ifdef USE_DISPLACEMENTMAP
          // Displacement is handled in vertex shader
        #endif
        `
      )
    }
  }
  
  // Update custom uniform values
  updateUniforms(props) {
    if (props.rippleStrength !== undefined) this.userData.uRippleStrength.value = props.rippleStrength
    if (props.rippleFrequency !== undefined) this.userData.uRippleFrequency.value = props.rippleFrequency
    if (props.rippleSpeed !== undefined) this.userData.uRippleSpeed.value = props.rippleSpeed
    if (props.textureRepeat !== undefined) {
      this.userData.uTextureRepeat.value.set(props.textureRepeat[0], props.textureRepeat[1])
    }
  }
}

// Extend the material so we can use it as a component
extend({ RippleSandMaterialImpl })

export default function RippleSandMaterial({ 
  colorMap, 
  displacementMap, 
  normalMap, 
  roughnessMap,
  rippleStrength = 0.05,
  rippleFrequency = 2.0,
  rippleSpeed = 0.8,
  textureRepeat = [12, 12]
}) {
  const materialRef = useRef()
  
  // Update time uniform for animation
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.userData.uTime.value = state.clock.elapsedTime
      
      // Update other uniforms
      materialRef.current.updateUniforms({
        rippleStrength,
        rippleFrequency,
        rippleSpeed,
        textureRepeat
      })
    }
  })
  
  return (
    <rippleSandMaterialImpl
      ref={materialRef}
      map={colorMap}
      displacementMap={displacementMap}
      normalMap={normalMap}
      roughnessMap={roughnessMap}
      displacementScale={0.3}
      roughness={0.8}
      side={THREE.DoubleSide}
    />
  )
}
