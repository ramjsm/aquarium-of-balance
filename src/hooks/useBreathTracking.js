import { useState, useEffect, useRef } from 'react'

export default function useBreathTracking() {
  // Only state that should trigger re-renders (status changes)
  const [isListening, setIsListening] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [error, setError] = useState(null)
  
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const dataArrayRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // Breathing detection parameters
  const smoothingFactorRef = useRef(0.6) // Less smoothing for more responsive detection
  const breathIntensityRef = useRef(0) // Store current breath intensity without triggering re-renders
  const debugFrameCountRef = useRef(0) // For debug logging
  
  // Function to get current breath intensity (for real-time access without re-renders)
  const getBreathIntensity = () => breathIntensityRef.current
  
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
    
    // BREATH-SPECIFIC FREQUENCY DETECTION
    // Breathing sounds typically occur in 50-1000Hz range
    // With 512 FFT size and 44100 sample rate: each bin = ~86Hz
    // So bins 1-12 cover roughly 86-1032Hz (good for breathing)
    
    const breathStartBin = 1 // Skip DC component (bin 0)
    const breathEndBin = Math.floor(dataArrayRef.current.length * 0.15) // ~15% of spectrum (~1200Hz)
    
    let breathIntensity = 0
    let maxBreathValue = 0
    
    // Sum amplitudes in the breathing frequency range
    for (let i = breathStartBin; i < breathEndBin; i++) {
      const value = dataArrayRef.current[i]
      breathIntensity += value
      maxBreathValue = Math.max(maxBreathValue, value)
    }
    
    // Normalize by range and max value
    const avgBreathIntensity = breathIntensity / (breathEndBin - breathStartBin) / 255
    const maxBreathIntensity = maxBreathValue / 255
    
    // Combine average and peak detection for better sensitivity
    let intensity = Math.max(avgBreathIntensity * 2, maxBreathIntensity * 0.8)
    
    // Clamp to 0-1 range
    intensity = Math.min(intensity, 1)
    
    // Apply smoothing to reduce noise
    const currentIntensity = breathIntensityRef.current || 0
    const smoothedIntensity = currentIntensity * 0.8 + intensity * 0.2
    
    // Store intensity in ref only (no state update = no re-renders)
    breathIntensityRef.current = smoothedIntensity
    
    // Debug: Log every 60 frames (~1 second)
    debugFrameCountRef.current = (debugFrameCountRef.current || 0) + 1
    
    // Continue the analysis loop
    animationFrameRef.current = requestAnimationFrame(analyzeBreath)
  }

  const isNoisy = () => getBreathIntensity() > 0.7
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [])
  
  return {
    getBreathIntensity, // Function to get current breath intensity without triggering re-renders
    breathIntensityRef, // Direct ref access for performance-critical components
    isListening,
    permissionGranted,
    error,
    startListening,
    stopListening,
    isNoisy
  }
}
