import { useState, useEffect, useRef } from 'react'
import { MathUtils } from 'three'

export default function useBreathTracking() {
  const [breathLevel, setBreathLevel] = useState(0.8) // Start with high distortion
  const [rawBreathIntensity, setRawBreathIntensity] = useState(0)
  const [breathingPatternScore, setBreathingPatternScore] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [error, setError] = useState(null)
  
  // Track previous rhythm score for smooth lerping
  const previousRhythmScoreRef = useRef(0)
  
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const dataArrayRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // Breathing detection parameters
  const smoothingFactorRef = useRef(0.85) // For smoothing audio data
  const breathHistoryRef = useRef([]) // Store recent breath levels
  const historySize = 300 // Keep 300 frames of history (~5 seconds at 60fps)
  
  const startListening = async () => {
    try {
      setError(null)
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      // Create audio context and analyzer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      // Configure analyzer for breath detection
      analyserRef.current.fftSize = 512
      analyserRef.current.smoothingTimeConstant = smoothingFactorRef.current
      
      // Connect microphone to analyzer
      microphoneRef.current.connect(analyserRef.current)
      
      // Create data array for frequency analysis
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      
      setPermissionGranted(true)
      setIsListening(true)
      
      // Start the analysis loop
      analyzeBreath()
      
    } catch (err) {
      setError(`Microphone access denied: ${err.message}`)
      console.error('Error accessing microphone:', err)
    }
  }
  
  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    
    setIsListening(false)
  }
  
  const analyzeBreath = () => {
    if (!analyserRef.current || !dataArrayRef.current) return
    
    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current)
    
    // STEP 1: Extract Breath Frequencies (0-500Hz range)
    // We focus on the lower 10% of the frequency spectrum where breathing sounds occur
    const breathFrequencyRange = Math.floor(dataArrayRef.current.length * 0.1) // ~25 bins out of 256
    let breathIntensity = 0
    
    // Sum up the amplitudes in the breath frequency range
    for (let i = 0; i < breathFrequencyRange; i++) {
      breathIntensity += dataArrayRef.current[i] // Each bin value is 0-255
    }
    // Normalize: divide by number of bins and max value (255) to get 0-1 range
    breathIntensity = breathIntensity / breathFrequencyRange / 255
    
    // Store raw intensity for UI display (simple, working version)
    setRawBreathIntensity(breathIntensity)
    
    // STEP 2: Build History Buffer (Rolling Window)
    // Keep track of the last 300 breath intensity values (~5 seconds at 60fps)
    // This allows detection of complete breathing cycles (inhale + exhale = 3-6 seconds)
    breathHistoryRef.current.push(breathIntensity)
    if (breathHistoryRef.current.length > historySize) {
      breathHistoryRef.current.shift() // Remove oldest value
    }
    
    // STEP 3: Calculate Rhythm Score (Only when we have enough history)
    // Require more data before starting pattern analysis to avoid false positives
    if (breathHistoryRef.current.length >= historySize) {
      
      
      // COMPONENT A: Temporal Variation
      // Compare recent 1.5 seconds vs previous 1.5 seconds to detect breathing cycles
      const recent = breathHistoryRef.current.slice(-90)     // Last 1.5 seconds
      const older = breathHistoryRef.current.slice(-180, -90) // Previous 1.5 seconds
      
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
      const variation = Math.abs(recentAvg - olderAvg)
      // High variation = breathing pattern is changing (inhale/exhale cycles)
      
      // COMPONENT B: Overall Variability (Standard Deviation)
      // Measure how much the breath intensity varies across the entire 1-second window
      const mean = breathHistoryRef.current.reduce((a, b) => a + b, 0) / breathHistoryRef.current.length
      const variance = breathHistoryRef.current.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / breathHistoryRef.current.length
      const stdDev = Math.sqrt(variance)
      // High stdDev = lots of variation in breathing amplitude (rhythmic breathing)
      
      // COMPONENT C: Periodicity Detection (Advanced Rhythm Analysis)
      // Look for repeating patterns in the breathing data
      const windowSize = 60 // 1-second windows to check for patterns
      let periodicityScore = 0
      
      // Check multiple possible breathing frequencies (10-20 breaths per minute = 0.17-0.33 Hz)
      // In 60fps terms: one cycle every 180-360 frames (3-6 seconds)
      for (let period = 180; period <= 240; period += 10) { // Check common breathing periods
        if (breathHistoryRef.current.length >= period * 2) {
          const cycle1 = breathHistoryRef.current.slice(-period, -period + windowSize)
          const cycle2 = breathHistoryRef.current.slice(-windowSize)
          
          // Calculate correlation between two cycles
          const mean1 = cycle1.reduce((a, b) => a + b, 0) / cycle1.length
          const mean2 = cycle2.reduce((a, b) => a + b, 0) / cycle2.length
          
          let correlation = 0
          let variance1 = 0
          let variance2 = 0
          
          for (let i = 0; i < windowSize; i++) {
            const diff1 = cycle1[i] - mean1
            const diff2 = cycle2[i] - mean2
            correlation += diff1 * diff2
            variance1 += diff1 * diff1
            variance2 += diff2 * diff2
          }
          
          const normalizedCorrelation = correlation / Math.sqrt(variance1 * variance2)
          periodicityScore = Math.max(periodicityScore, Math.abs(normalizedCorrelation) || 0)
        }
      }
      
      // STEP 4: Combine All Three Components with Better Mapping
      // Apply exponential scaling to make higher scores more achievable
      
      // Scale each component individually for better sensitivity
      const scaledVariation = Math.min(variation * 5, 1) // Increased sensitivity to breathing cycles
      const scaledStdDev = Math.min(stdDev * 4, 1) // Higher sensitivity for breathing amplitude
      const scaledPeriodicity = Math.min(periodicityScore * 2.0, 1) // Better pattern recognition
      
      // Weight components: prioritize periodicity (actual rhythm) over raw variation
      const weightedScore = (scaledVariation * 0.15) + (scaledStdDev * 0.25) + (scaledPeriodicity * 0.6)
      
      // Apply more favorable curve to make higher scores achievable
      let rhythmScore = Math.pow(weightedScore, 0.6) // Easier curve (was 0.7)
      rhythmScore = Math.min(rhythmScore * 1.3, 1) // Higher boost (was 1.2)
      
      // Additional bonus for good patterns (helps reach 80-90%+)
      if (rhythmScore > 0.6) {
        rhythmScore = Math.min(rhythmScore * 1.15, 1) // 15% bonus for patterns above 60%
      }
      
      
      // STEP 5: Smooth the Rhythm Score Transition with THREE.js lerp (ONLY FOR DISPLAY)
      // Get the previous smoothed value (not the raw calculation value)
      const previousSmoothedRhythmScore = previousRhythmScoreRef.current
      const difference = Math.abs(rhythmScore - previousSmoothedRhythmScore)
      
      // Use faster lerp for small changes, slower for big changes
      let lerpFactor = 0.08 // Default smooth transition
      
      if (difference < 0.05) {
        lerpFactor = 0.15 // Faster for small adjustments
      } else if (difference > 0.3) {
        lerpFactor = 0.04 // Slower for big changes to avoid jarring
      }
      
      // Apply THREE.js lerp to smooth rhythm score transitions FOR DISPLAY ONLY
      const smoothedRhythmScore = MathUtils.lerp(previousSmoothedRhythmScore, rhythmScore, lerpFactor)
      
      // Update the previous SMOOTHED value for next iteration
      previousRhythmScoreRef.current = smoothedRhythmScore
      
      // Store smoothed pattern score for UI display
      setBreathingPatternScore(smoothedRhythmScore)
      
      // STEP 6: Apply to Distortion (INVERTED LOGIC)
      // More stable rhythm = Less distortion (calming effect)
      const distortionLevel = 1 - smoothedRhythmScore
      setBreathLevel(distortionLevel)
    }
    
    // Continue the analysis loop
    animationFrameRef.current = requestAnimationFrame(analyzeBreath)
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])
  
  // Calculate distortion value (0.1 to 0.8 range for good visual effect)
  const distortionValue = 0.1 + ((1 - breathingPatternScore) * 1)
  
  return {
    breathLevel, // 0-1 distortion level (inverted from rhythm)
    rawBreathIntensity, // 0-1 raw breath intensity from microphone
    breathingPatternScore, // 0-1 detected rhythm/pattern strength
    distortionValue, // Scaled distortion value for MeshDistortMaterial
    isListening,
    permissionGranted,
    error,
    startListening,
    stopListening
  }
}
