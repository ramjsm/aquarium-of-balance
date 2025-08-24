import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import AquariumSphere from './DistortionSphere'
import UIOverlay from './UIOverlay'
import EnvironmentController from './EnvironmentController'
import ModelLoadingScreen from './ModelLoadingScreen'
import useBreathTrackingML from '../hooks/useBreathTrackingML'

import { ENVIRONMENT_PRESETS } from './EnvironmentController'
// Import test functions for development
import '../ml/test-model.js'

export default function Scene() {
  const [currentEnvironment, setCurrentEnvironment] = useState(ENVIRONMENT_PRESETS[0])
  const breathData = useBreathTrackingML()

  const handleEnvironmentChange = (environment) => {
    setCurrentEnvironment(environment)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(180deg, #001122 0%, #003344 50%, #004466 100%)' }}>
      {/* Model Loading Screen Overlay */}
      <ModelLoadingScreen 
        modelStatus={breathData.modelStatus}
        error={breathData.error}
        onRetry={breathData.retrainModel}
      />
      
      <Canvas
        camera={{
          position: [0, 0, 4],
          fov: 50,
        }}
        gl={{
          antialias: true,
          alpha: false,
        }}
      >
        {/* Aquarium Lighting */}
        <ambientLight intensity={0.4} color="#87ceeb" />
        <directionalLight position={[2, 8, 5]} intensity={0.8} color="#87ceeb" />
        <pointLight position={[-3, 2, -2]} intensity={0.6} color="#4fc3f7" />
        <pointLight position={[3, -2, 3]} intensity={0.4} color="#87ceeb" />
        
        {/* Dynamic Environment Controller */}
        <EnvironmentController 
          currentEnvironment={currentEnvironment}
          onEnvironmentChange={handleEnvironmentChange} 
        />
        
        {/* Aquarium Sphere */}
        <AquariumSphere breathData={breathData} />
        
        
        {/* Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          maxDistance={10}
          minDistance={2}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        
        {/* UI Overlay with Environment Controls and Breath Control */}
        <UIOverlay 
          currentEnvironment={currentEnvironment}
          onEnvironmentChange={handleEnvironmentChange}
          breathData={breathData}
        />
      </Canvas>
    </div>
  )
}
