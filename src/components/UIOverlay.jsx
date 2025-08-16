import { useState } from 'react'
import { Html } from '@react-three/drei'
import { ENVIRONMENT_PRESETS } from './EnvironmentController'
import BreathControlPanel from './BreathControlPanel'

export default function UIOverlay({ currentEnvironment, onEnvironmentChange, breathData }) {
  const [showEnvironmentMenu, setShowEnvironmentMenu] = useState(false)
  
  // Use the first environment as default if none provided
  const activeEnvironment = currentEnvironment || ENVIRONMENT_PRESETS[0]

  const handleEnvironmentSelect = (environment) => {
    setShowEnvironmentMenu(false)
    if (onEnvironmentChange) {
      onEnvironmentChange(environment)
    }
  }
  return (
    <Html
      fullscreen
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        pointerEvents: 'none', // Allow interaction with 3D scene
      }}
    >
      {/* Left Side - Breath Control */}
      <div
        style={{
          position: 'absolute',
          left: '2rem',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'auto',
        }}
      >
        <BreathControlPanel breathData={breathData} />
      </div>

      {/* Top UI */}
      <div
        style={{
          padding: '2rem',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          pointerEvents: 'auto',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'white' }}>
          
        </h1>
        <p style={{ margin: '0.5rem 0', fontSize: '1rem', opacity: 0.8 }}>
          
        </p>
      </div>

      {/* Environment Menu */}
      {showEnvironmentMenu && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            maxWidth: '400px',
            pointerEvents: 'auto',
          }}
        >
          <h3 style={{ 
            gridColumn: '1 / -1', 
            margin: '0 0 1rem 0', 
            color: '#87ceeb', 
            textAlign: 'center',
            fontSize: '1.2rem'
          }}>
            Choose Aquarium Environment
          </h3>
          {ENVIRONMENT_PRESETS.map((env) => (
            <button
              key={env.value}
              onClick={() => handleEnvironmentSelect(env)}
              title={env.description}
              style={{
                padding: '0.5rem',
                backgroundColor: activeEnvironment.value === env.value 
                  ? '#4fc3f7' 
                  : 'rgba(135, 206, 235, 0.1)',
                color: 'white',
                border: '1px solid rgba(135, 206, 235, 0.3)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                transition: 'all 0.2s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (activeEnvironment.value !== env.value) {
                  e.target.style.backgroundColor = 'rgba(135, 206, 235, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeEnvironment.value !== env.value) {
                  e.target.style.backgroundColor = 'rgba(135, 206, 235, 0.1)'
                }
              }}
            >
              <div>{env.name}</div>
              <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '2px' }}>
                {env.description}
              </div>
            </button>
          ))}
          <button
            onClick={() => setShowEnvironmentMenu(false)}
            style={{
              gridColumn: '1 / -1',
              marginTop: '0.5rem',
              padding: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      )}

      {/* Bottom UI */}
      <div
        style={{
          padding: '2rem',
          display: 'flex',
          gap: '1rem',
          pointerEvents: 'auto',
        }}
      > 
        <button
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.2s',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
            e.target.style.transform = 'scale(1)'
          }}
          onClick={() => setShowEnvironmentMenu(!showEnvironmentMenu)}
        >
          Environment: {activeEnvironment.name}
        </button>
      </div>
      
      <style>
        {
          `
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          `
        }
      </style>
    </Html>
  )
}
