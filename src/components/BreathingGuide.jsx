import { useState, useEffect, useRef } from 'react'

export default function BreathingGuide({ currentPhase, confidence }) {
  const [guidePhase, setGuidePhase] = useState('inhale')
  const [cycleCount, setCycleCount] = useState(0)
  const [isGuideActive, setIsGuideActive] = useState(false)
  const [phaseTime, setPhaseTime] = useState(0)
  const [matchScore, setMatchScore] = useState(0)
  const intervalRef = useRef(null)
  const cycleRef = useRef(null)

  // Configurable timing (in seconds)
  const INHALE_DURATION = 1.5
  const EXHALE_DURATION = 1.5
  const CYCLE_DURATION = INHALE_DURATION + EXHALE_DURATION

  // Start/stop guide
  const startGuide = () => {
    setIsGuideActive(true)
    setCycleCount(0)
    setPhaseTime(0)
    setGuidePhase('inhale')
  }

  const stopGuide = () => {
    setIsGuideActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (cycleRef.current) clearInterval(cycleRef.current)
  }

  // Guide timer logic
  useEffect(() => {
    if (isGuideActive) {
      // Phase progression timer (100ms updates for smooth animation)
      intervalRef.current = setInterval(() => {
        setPhaseTime(prev => {
          const newTime = prev + 0.1
          const currentPhaseDuration = guidePhase === 'inhale' ? INHALE_DURATION : EXHALE_DURATION
          
          // Check if phase should change
          if (newTime >= currentPhaseDuration) {
            setGuidePhase(current => {
              const newPhase = current === 'inhale' ? 'exhale' : 'inhale'
              // Increment cycle count when completing exhale (end of full cycle)
              if (newPhase === 'inhale') {
                setCycleCount(prev => prev + 1)
              }
              return newPhase
            })
            return 0
          }
          return newTime
        })
      }, 100)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (cycleRef.current) clearInterval(cycleRef.current)
      }
    }
  }, [isGuideActive, INHALE_DURATION, EXHALE_DURATION])

  // Calculate match score between guide and ML detection
  useEffect(() => {
    if (currentPhase && confidence > 0.3) {
      const isMatching = currentPhase === guidePhase
      const confidenceWeight = Math.min(confidence, 1.0)
      const newScore = isMatching ? confidenceWeight : (1 - confidenceWeight) * 0.5
      
      // Smooth the match score over time
      setMatchScore(prev => prev * 0.7 + newScore * 0.3)
    }
  }, [currentPhase, guidePhase, confidence])

  // Visual phase progress (0 to 1)
  const currentPhaseDuration = guidePhase === 'inhale' ? INHALE_DURATION : EXHALE_DURATION
  const phaseProgress = Math.min(phaseTime / currentPhaseDuration, 1)

  return (
    <div style={{
      padding: '1rem',
      backgroundColor: 'rgba(75, 0, 130, 0.1)',
      border: '1px solid rgba(75, 0, 130, 0.3)',
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '0.7rem',
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '0.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>🧘‍♀️ Breathing Guide</span>
        {isGuideActive && (
          <span style={{ color: '#d8bfd8' }}>
            Cycle {cycleCount + 1}
          </span>
        )}
      </div>

      {!isGuideActive ? (
        /* Start Guide Button */
        <button
          onClick={startGuide}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: 'rgba(75, 0, 130, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'rgba(75, 0, 130, 1)'
            e.target.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'rgba(75, 0, 130, 0.8)'
            e.target.style.transform = 'scale(1)'
          }}
        >
          🚀 Start Guided Breathing
        </button>
      ) : (
        <div>
          {/* Main Breathing Instruction */}
          <div style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: guidePhase === 'inhale' ? '#87ceeb' : '#ffa07a',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            textShadow: `0 0 10px ${guidePhase === 'inhale' ? '#87ceeb' : '#ffa07a'}40`
          }}>
            {guidePhase === 'inhale' ? '↑ INHALE' : '↓ EXHALE'}
          </div>

          {/* Visual Progress Circle */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            margin: '1rem auto',
            borderRadius: '50%',
            background: `conic-gradient(${guidePhase === 'inhale' ? '#87ceeb' : '#ffa07a'} ${phaseProgress * 360}deg, rgba(255, 255, 255, 0.1) 0deg)`
          }}>
            <div style={{
              position: 'absolute',
              top: '4px',
              left: '4px',
              right: '4px',
              bottom: '4px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              {guidePhase === 'inhale' ? '🔵' : '🔴'}
            </div>
          </div>

          {/* Phase Timer */}
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: guidePhase === 'inhale' ? '#87ceeb' : '#ffa07a',
            marginBottom: '1rem'
          }}>
            {(currentPhaseDuration - phaseTime).toFixed(1)}s
          </div>

          {/* Match Score with ML Detection */}
          {currentPhase && confidence > 0.3 && (
            <div style={{
              padding: '0.5rem',
              backgroundColor: matchScore > 0.6 ? 'rgba(107, 207, 127, 0.2)' : 
                              matchScore > 0.4 ? 'rgba(255, 217, 61, 0.2)' :
                              'rgba(255, 107, 107, 0.2)',
              border: `1px solid ${matchScore > 0.6 ? '#6bcf7f' : 
                                  matchScore > 0.4 ? '#ffd93d' : '#ff6b6b'}`,
              borderRadius: '6px',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.25rem'
              }}>
                Guide Sync
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: currentPhase === guidePhase ? '#6bcf7f' : '#ff6b6b'
                }}>
                  {currentPhase === guidePhase ? '✅ In Sync' : '❌ Out of Sync'}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: matchScore > 0.6 ? '#6bcf7f' : 
                        matchScore > 0.4 ? '#ffd93d' : '#ff6b6b'
                }}>
                  {(matchScore * 100).toFixed(0)}%
                </div>
              </div>
              
              {/* Match score progress bar */}
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                marginTop: '0.25rem'
              }}>
                <div style={{
                  width: `${matchScore * 100}%`,
                  height: '100%',
                  backgroundColor: matchScore > 0.6 ? '#6bcf7f' : 
                                  matchScore > 0.4 ? '#ffd93d' : '#ff6b6b',
                  transition: 'width 0.5s ease',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <button
              onClick={stopGuide}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(255, 107, 107, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}
            >
              ⏹️ Stop Guide
            </button>
          </div>

          {/* Breathing Tips */}
          <div style={{
            fontSize: '0.65rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '0.75rem',
            lineHeight: '1.3'
          }}>
            {guidePhase === 'inhale' 
              ? 'Breathe in slowly through your nose' 
              : 'Breathe out slowly through your mouth'
            }
          </div>
        </div>
      )}
    </div>
  )
}
