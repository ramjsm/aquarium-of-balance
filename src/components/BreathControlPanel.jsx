export default function BreathControlPanel({ breathData }) {
  // Extract breathData or use defaults
  const { 
    breathLevel, 
    rawBreathIntensity,
    breathingPatternScore,
    distortionValue, 
    isListening, 
    permissionGranted, 
    error, 
    startListening, 
    stopListening 
  } = breathData || {
    breathLevel: 0.8,
    rawBreathIntensity: 0,
    breathingPatternScore: 0,
    distortionValue: 0.65,
    isListening: false,
    permissionGranted: false,
    error: null,
    startListening: () => {},
    stopListening: () => {}
  }
  
  const getBreathingState = () => {
    // Updated thresholds for more achievable ranges
    if (breathingPatternScore < 0.4) return { state: 'Chaotic', color: '#ff6b6b' }
    if (breathingPatternScore < 0.65) return { state: 'Developing', color: '#ffd93d' }
    return { state: 'Rhythmic', color: '#6bcf7f' }
  }
  
  const breathState = getBreathingState()

  return (
    <div
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '1rem',
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        minWidth: '200px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <h3 style={{ 
        margin: '0 0 1rem 0', 
        fontSize: '1rem', 
        color: '#87ceeb',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        Breathing
        {isListening && (
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: 'transparent',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }} />
        )}
      </h3>

      {/* Microphone Control */}
      <div style={{ marginBottom: '1rem' }}>
        {!permissionGranted ? (
          <button
            onClick={startListening}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4fc3f7',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}
          >
            🎤 Enable Microphone
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={isListening ? stopListening : startListening}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: isListening ? '#ff6b6b' : '#6bcf7f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {isListening ? '⏹️ Stop' : '▶️ Start'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '0.5rem',
          backgroundColor: 'rgba(255, 107, 107, 0.2)',
          border: '1px solid #ff6b6b',
          borderRadius: '6px',
          fontSize: '0.8rem',
          marginBottom: '1rem',
          color: '#ff6b6b'
        }}>
          {error}
        </div>
      )}

      {/* Breath Status */}
      {isListening && (
        <div style={{ fontSize: '0.85rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>State:</span>
            <span style={{ color: breathState.color, fontWeight: 'bold' }}>
              {breathState.state}
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>Distortion:</span>
            <span style={{ color: '#87ceeb' }}>
              {(distortionValue * 100).toFixed(0)}%
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>Raw Intensity:</span>
            <span style={{ color: '#87ceeb' }}>
              {(rawBreathIntensity * 100).toFixed(0)}%
            </span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span>Pattern Score:</span>
            <span style={{ color: breathState.color }}>
              {(breathingPatternScore * 100).toFixed(0)}%
            </span>
          </div>

          {/* Visual indicators */}
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Raw Breath Intensity */}
            <div>
              <div style={{ 
                fontSize: '0.7rem', 
                marginBottom: '0.25rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Breath Intensity
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${rawBreathIntensity * 100}%`,
                  height: '100%',
                  backgroundColor: '#87ceeb',
                  transition: 'width 0.1s ease',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
            
            {/* Breathing Pattern Score */}
            <div>
              <div style={{ 
                fontSize: '0.7rem', 
                marginBottom: '0.25rem',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Pattern Stability
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${breathingPatternScore * 100}%`,
                  height: '100%',
                  backgroundColor: breathState.color,
                  transition: 'width 0.3s ease',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
            
          </div>
        </div>
      )}

      <div style={{ 
        fontSize: '0.7rem', 
        color: 'rgba(255, 255, 255, 0.6)',
        marginTop: '1rem',
        textAlign: 'center',
        lineHeight: '1.3'
      }}>
        Practice rhythmic breathing to calm the sphere.<br/>
        Stable patterns reduce distortion.
      </div>
    </div>
  )
}
