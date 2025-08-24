import { useEffect, useState } from 'react'

export default function ModelLoadingScreen({ modelStatus, error, onRetry }) {
  const [dots, setDots] = useState('')
  const [progress, setProgress] = useState(0)

  // Animate loading dots
  useEffect(() => {
    if (modelStatus === 'loading' || modelStatus === 'training') {
      const interval = setInterval(() => {
        setDots(prev => {
          if (prev.length >= 3) return ''
          return prev + '.'
        })
      }, 500)
      
      return () => clearInterval(interval)
    }
  }, [modelStatus])

  // Simulate progress for training
  useEffect(() => {
    if (modelStatus === 'training') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90 // Don't reach 100% until actually done
          return prev + Math.random() * 10
        })
      }, 1000)
      
      return () => clearInterval(interval)
    } else if (modelStatus === 'ready') {
      setProgress(100)
    }
  }, [modelStatus])

  const getStatusInfo = () => {
    switch (modelStatus) {
      case 'loading':
        return {
          title: 'Initializing AI Model',
          subtitle: 'Setting up breathing detection system',
          icon: '🧠',
          color: '#87ceeb'
        }
      case 'training':
        return {
          title: 'Training AI Model',
          subtitle: 'Learning breathing patterns from synthetic data',
          icon: '🏗️',
          color: '#ffd93d'
        }
      case 'ready':
        return {
          title: 'Model Ready!',
          subtitle: 'AI breathing detection is now active',
          icon: '✅',
          color: '#6bcf7f'
        }
      case 'error':
        return {
          title: 'Model Error',
          subtitle: 'Failed to initialize breathing detection',
          icon: '❌',
          color: '#ff6b6b'
        }
      default:
        return {
          title: 'Loading',
          subtitle: 'Please wait...',
          icon: '⏳',
          color: '#87ceeb'
        }
    }
  }

  const statusInfo = getStatusInfo()

  if (modelStatus === 'ready') {
    return null // Don't show loading screen when ready
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Main Loading Content */}
      <div style={{
        textAlign: 'center',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Icon */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          animation: modelStatus === 'training' ? 'pulse 2s infinite' : 'none'
        }}>
          {statusInfo.icon}
        </div>

        {/* Title */}
        <h2 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.5rem',
          color: statusInfo.color,
          fontWeight: 'bold'
        }}>
          {statusInfo.title}{modelStatus === 'loading' || modelStatus === 'training' ? dots : ''}
        </h2>

        {/* Subtitle */}
        <p style={{
          margin: '0 0 2rem 0',
          fontSize: '1rem',
          color: 'rgba(255, 255, 255, 0.8)',
          lineHeight: '1.4'
        }}>
          {statusInfo.subtitle}
        </p>

        {/* Progress Bar (only for training) */}
        {modelStatus === 'training' && (
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: statusInfo.color,
              borderRadius: '3px',
              transition: 'width 1s ease',
              animation: 'shimmer 2s infinite'
            }} />
          </div>
        )}

        {/* Loading Spinner */}
        {(modelStatus === 'loading' || modelStatus === 'training') && (
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: `3px solid ${statusInfo.color}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem auto'
          }} />
        )}

        {/* Error Details */}
        {modelStatus === 'error' && error && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 107, 107, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.4)',
            borderRadius: '8px',
            fontSize: '0.9rem',
            color: '#ffcccb',
            textAlign: 'left'
          }}>
            <strong>Error Details:</strong><br/>
            {error}
            
            {/* Retry Button */}
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4fc3f7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'block',
                  margin: '1rem auto 0 auto',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#87ceeb'
                  e.target.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#4fc3f7'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                🔄 Retry Initialization
              </button>
            )}
          </div>
        )}

        {/* Status Messages */}
        {modelStatus === 'training' && (
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '1rem'
          }}>
            <p>• Creating neural network architecture</p>
            <p>• Generating synthetic breathing data</p>
            <p>• Training AI to recognize inhale/exhale patterns</p>
            <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
              This usually takes 10-30 seconds...
            </p>
          </div>
        )}

        {modelStatus === 'loading' && (
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '1rem'
          }}>
            <p>• Checking for existing AI model</p>
            <p>• Loading TensorFlow.js libraries</p>
            <p>• Preparing breathing detection system</p>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>
    </div>
  )
}
