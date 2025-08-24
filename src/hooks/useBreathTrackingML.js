import { useState, useEffect, useRef } from 'react'
import { MathUtils } from 'three'
import BreathingCNN from '../ml/breathingModel.js'
import BreathingPatternAnalyzer from '../ml/breathingPatternAnalyzer.js'

export default function useBreathTrackingML() {
  // Core state
  const [breathLevel, setBreathLevel] = useState(0.8) // Start with high distortion
  const [rawBreathIntensity, setRawBreathIntensity] = useState(0)
  const [breathingPatternScore, setBreathingPatternScore] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [error, setError] = useState(null)
  
  // ML-specific state
  const [currentBreathingPhase, setCurrentBreathingPhase] = useState('inhale')
  const [phaseConfidence, setPhaseConfidence] = useState(0)
  const [modelStatus, setModelStatus] = useState('loading') // loading, training, ready, error
  const [modelInfo, setModelInfo] = useState(null)
  
  // Pattern analysis state
  const [patternAnalysis, setPatternAnalysis] = useState(null)
  const [patternSignal, setPatternSignal] = useState(0) // 0-1 normalized pattern strength
  const [isPatternDetected, setIsPatternDetected] = useState(false)
  const [patternQuality, setPatternQuality] = useState('No Pattern')
  
  // Refs for audio processing
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const microphoneRef = useRef(null)
  const dataArrayRef = useRef(null)
  const animationFrameRef = useRef(null)
  
  // ML model ref
  const modelRef = useRef(null)
  
  // Pattern analyzer ref
  const patternAnalyzerRef = useRef(null)
  
  // Pattern tracking for rhythm score
  const phaseHistoryRef = useRef([]) // Store recent phase predictions
  const patternScoreRef = useRef(0) // Smoothed pattern score
  const breathingCyclesRef = useRef([]) // Track complete breathing cycles
  
  // Initialize ML model
  useEffect(() => {
    initializeModel()
    return () => {
      // Cleanup model resources if needed
      if (modelRef.current) {
        // TensorFlow.js handles most cleanup automatically
      }
    }
  }, [])

  const initializeModel = async () => {
    try {
      setModelStatus('loading')
      setError(null)
      
      // Create new model instance
      modelRef.current = new BreathingCNN()
      
      // Try to load existing model first
      const modelLoaded = await modelRef.current.loadModel()
      
      if (modelLoaded) {
        setModelStatus('ready')
        setModelInfo(modelRef.current.getModelInfo())
        console.log('✅ Pre-trained model loaded successfully')
      } else {
        // No saved model, need to train a new one
        setModelStatus('training')
        console.log('🏗️ No saved model found, training new model...')
        
        try {
          // Train with synthetic data - handle concurrent training error
          await modelRef.current.trainWithSyntheticData(15, 0.2)
          
          // Save the newly trained model
          await modelRef.current.saveModel()
          
          setModelStatus('ready')
          setModelInfo(modelRef.current.getModelInfo())
          console.log('✅ New model trained and ready!')
        } catch (trainError) {
          if (trainError.message.includes('another fit() call is ongoing')) {
            console.log('⚠️ Another training session detected, waiting...')
            // Wait and try to load an existing model that might be created by another instance
            await new Promise(resolve => setTimeout(resolve, 3000))
            
            const retryModelLoaded = await modelRef.current.loadModel()
            if (retryModelLoaded) {
              setModelStatus('ready')
              setModelInfo(modelRef.current.getModelInfo())
              console.log('✅ Model loaded after waiting for concurrent training')
            } else {
              // If still no model, create a simpler fallback
              console.log('🔄 Creating fallback model...')
              await createFallbackModel()
            }
          } else {
            throw trainError // Re-throw if it's a different error
          }
        }
      }
      
    } catch (err) {
      console.error('Model initialization error:', err)
      
      // Try fallback approach
      try {
        console.log('🔄 Attempting fallback model creation...')
        await createFallbackModel()
      } catch (fallbackErr) {
        setError(`Model initialization failed: ${err.message}. Fallback failed: ${fallbackErr.message}`)
        setModelStatus('error')
      }
    }
  }
  
  const createFallbackModel = async () => {
    // Create a simple model without training (just build architecture)
    modelRef.current.buildModel()
    
    // Initialize with random weights (not ideal but allows functionality)
    setModelStatus('ready')
    setModelInfo({
      totalParams: modelRef.current.model?.countParams() || 'Unknown',
      layers: modelRef.current.model?.layers?.length || 'Unknown',
      status: 'Fallback model (untrained)'
    })
    
    setError('Using fallback model. Predictions may be inaccurate until proper training completes.')
    console.log('⚠️ Fallback model created - predictions will be random until trained')
  }

  const startListening = async () => {
    if (modelStatus !== 'ready') {
      setError('Model not ready. Please wait for initialization to complete.')
      return
    }

    try {
      setError(null)
      
      // Request microphone permission with optimized settings for breathing detection
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false, // Keep raw audio for breathing detection
          noiseSuppression: false, // We want to detect breathing sounds
          autoGainControl: false, // Consistent levels for ML model
          sampleRate: 44100,
          channelCount: 1 // Mono is sufficient
        } 
      })
      
      // Create audio context and analyzer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      
      // Configure analyzer for ML feature extraction
      analyserRef.current.fftSize = 512 // 256 frequency bins
      analyserRef.current.smoothingTimeConstant = 0.3 // Less smoothing for ML
      
      // Connect microphone to analyzer
      microphoneRef.current.connect(analyserRef.current)
      
      // Create data array for frequency analysis
      const bufferLength = analyserRef.current.frequencyBinCount
      dataArrayRef.current = new Uint8Array(bufferLength)
      
      setPermissionGranted(true)
      setIsListening(true)
      
      // Initialize pattern analyzer
      patternAnalyzerRef.current = new BreathingPatternAnalyzer()
      
      // Reset tracking arrays
      phaseHistoryRef.current = []
      breathingCyclesRef.current = []
      
      // Start the ML analysis loop
      analyzeBreathWithML()
      
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
  
  const analyzeBreathWithML = async () => {
    if (!analyserRef.current || !dataArrayRef.current || !modelRef.current) {
      return
    }
    
    try {
      // Get frequency data from microphone
      analyserRef.current.getByteFrequencyData(dataArrayRef.current)
      
      // Calculate raw breathing intensity (for legacy compatibility)
      const breathFrequencyRange = Math.floor(dataArrayRef.current.length * 0.1)
      let rawIntensity = 0
      for (let i = 0; i < breathFrequencyRange; i++) {
        rawIntensity += dataArrayRef.current[i]
      }
      rawIntensity = rawIntensity / breathFrequencyRange / 255
      setRawBreathIntensity(rawIntensity)
      
      // ML PREDICTION: Get breathing phase from CNN model
      const prediction = await modelRef.current.predict(dataArrayRef.current)
      
      // Debug: Log predictions every 60 frames (~1 second)
      if (phaseHistoryRef.current.length % 60 === 0) {
        console.log('🔮 ML Prediction:', {
          class: prediction.class,
          confidence: (prediction.confidence * 100).toFixed(1) + '%',
          probabilities: {
            inhale: (prediction.probabilities.inhale * 100).toFixed(1) + '%',
            exhale: (prediction.probabilities.exhale * 100).toFixed(1) + '%'
          },
          rawIntensity: (rawIntensity * 100).toFixed(1) + '%'
        })
      }
      
      // Update current phase and confidence
      setCurrentBreathingPhase(prediction.class)
      setPhaseConfidence(prediction.confidence)
      
      // Store prediction in history for pattern analysis
      phaseHistoryRef.current.push({
        phase: prediction.class,
        confidence: prediction.confidence,
        timestamp: Date.now(),
        probabilities: prediction.probabilities,
        breathingScore: prediction.breathingScore
      })
      
      // Keep history manageable (last 5 seconds at ~30fps)
      if (phaseHistoryRef.current.length > 150) {
        phaseHistoryRef.current.shift()
      }
      
      // ADVANCED PATTERN ANALYSIS: Use the pattern analyzer
      if (patternAnalyzerRef.current) {
        // Map model prediction format to pattern analyzer format
        const analyzePrediction = {
          phase: prediction.class,        // Map 'class' to 'phase'
          confidence: prediction.confidence,
          probabilities: prediction.probabilities
        }
        
        const analysis = patternAnalyzerRef.current.processPrediction(analyzePrediction)
        
        // Update pattern analysis state
        setPatternAnalysis(analysis)
        setPatternSignal(analysis.patternSignal)
        setIsPatternDetected(analysis.isPatternDetected)
        setPatternQuality(analysis.patternQuality)
        
        // Use the pattern signal as the breathing pattern score
        setBreathingPatternScore(analysis.patternSignal)
        
        // Update distortion level using the pattern signal
        // Higher pattern signal = better pattern = less distortion
        const distortionLevel = 1 - analysis.patternSignal
        setBreathLevel(distortionLevel)
      } else {
        // Fallback to simple analysis if pattern analyzer not ready
        const rhythmScore = calculateRhythmScoreFromML()
        const smoothedScore = MathUtils.lerp(patternScoreRef.current, rhythmScore, 0.1)
        patternScoreRef.current = smoothedScore
        setBreathingPatternScore(smoothedScore)
        const distortionLevel = 1 - smoothedScore
        setBreathLevel(distortionLevel)
      }
      
    } catch (err) {
      console.error('ML analysis error:', err)
      // Fall back to raw intensity if ML fails
      setCurrentBreathingPhase('unknown')
      setPhaseConfidence(0)
    }
    
    // Continue the analysis loop
    animationFrameRef.current = requestAnimationFrame(analyzeBreathWithML)
  }
  
  /**
   * Calculate breathing rhythm score from ML phase predictions
   * Updated for 2-class system (inhale/exhale only)
   */
  const calculateRhythmScoreFromML = () => {
    const history = phaseHistoryRef.current
    if (history.length < 30) return 0 // Need some history
    
    // Component 1: Phase Transition Quality
    // Good breathing has clear transitions: inhale -> exhale -> inhale
    let transitionScore = 0
    let validTransitions = 0
    
    for (let i = 1; i < history.length; i++) {
      const current = history[i]
      const previous = history[i - 1]
      
      // Only count high-confidence predictions
      if (current.confidence > 0.4 && previous.confidence > 0.4) {
        if (current.phase !== previous.phase) {
          // For 2-class system, any alternation is good
          if ((previous.phase === 'inhale' && current.phase === 'exhale') ||
              (previous.phase === 'exhale' && current.phase === 'inhale')) {
            transitionScore += 1
          }
          validTransitions += 1
        }
      }
    }
    
    const transitionQuality = validTransitions > 0 ? transitionScore / validTransitions : 0
    
    // Component 2: Overall Confidence
    const avgConfidence = history.reduce((sum, pred) => sum + pred.confidence, 0) / history.length
    
    // Component 3: Breathing Activity Level (all breathing is now active)
    const recentActivity = history.slice(-30) // Last second
    const breathingActivity = recentActivity.length > 0 ? 1 : 0 // Always active in 2-class system
    
    // Component 4: ML Model's Built-in Breathing Score
    const avgBreathingScore = history.reduce((sum, pred) => sum + pred.breathingScore, 0) / history.length
    
    // Component 5: Use the detectBreathingCycle function
    const cycleDetection = detectBreathingCycle()
    const cycleScore = cycleDetection ? cycleDetection.cycleScore : 0
    
    // Combine all components with weights
    const combinedScore = (
      transitionQuality * 0.25 +    // Phase transitions
      avgConfidence * 0.15 +        // Model confidence
      breathingActivity * 0.1 +     // Activity level
      avgBreathingScore * 0.25 +    // ML breathing quality score
      cycleScore * 0.25             // Cycle detection score
    )
    
    // Apply scaling to make high scores more achievable
    return Math.min(Math.pow(combinedScore, 0.8) * 1.2, 1)
  }
  
  /**
   * Detect complete breathing cycles for advanced analysis
   * Updated for 2-class system (inhale/exhale only)
   */
  const detectBreathingCycle = () => {
    const history = phaseHistoryRef.current
    if (history.length < 10) return null
    
    // Look for alternating inhale/exhale patterns
    const recentPhases = history.slice(-20).map(h => h.phase)
    
    // Count alternating transitions (good breathing pattern)
    let alternatingCount = 0
    let totalTransitions = 0
    const phaseChanges = []
    
    for (let i = 1; i < recentPhases.length; i++) {
      if (recentPhases[i] !== recentPhases[i-1]) {
        phaseChanges.push(recentPhases[i])
        totalTransitions++
        
        // Check if this is a good alternation (inhale<->exhale)
        if ((recentPhases[i-1] === 'inhale' && recentPhases[i] === 'exhale') ||
            (recentPhases[i-1] === 'exhale' && recentPhases[i] === 'inhale')) {
          alternatingCount++
        }
      }
    }
    
    // Calculate cycle quality based on alternation ratio
    let cycleScore = 0
    if (totalTransitions > 0) {
      const alternationRatio = alternatingCount / totalTransitions
      // Bonus for having multiple transitions
      const transitionBonus = Math.min(totalTransitions / 6, 1)
      cycleScore = alternationRatio * transitionBonus
    }

    console.log(cycleScore)
    
    return { 
      cycleScore, 
      phaseChanges,
      alternatingCount,
      totalTransitions,
      alternationRatio: totalTransitions > 0 ? alternatingCount / totalTransitions : 0
    }
  }
  
  // Force retrain function to clear old model and train with improved data
  const forceRetrainModel = async () => {
    try {
      // Clear the old model from localStorage
      localStorage.removeItem('tensorflowjs_models/breathing-model/model_topology')
      localStorage.removeItem('tensorflowjs_models/breathing-model/weight_specs')
      localStorage.removeItem('tensorflowjs_models/breathing-model/weight_data')
      localStorage.removeItem('tensorflowjs_models/breathing-model/model_metadata')
      
      // Clear all localStorage keys that start with 'tensorflowjs_models/breathing-model'
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.includes('breathing-model')) {
          localStorage.removeItem(key)
        }
      })
      
      console.log('🗑️ Cleared old model from storage')
      
      // Reinitialize with new improved training
      await initializeModel()
      
    } catch (err) {
      console.error('Error during force retrain:', err)
      setError(`Force retrain failed: ${err.message}`)
    }
  }
  
  // Calculate distortion value for the sphere (for backward compatibility)
  const distortionValue = 0.1 + (breathLevel * 0.9)
  
  return {
    // Legacy compatibility
    breathLevel,
    rawBreathIntensity,
    breathingPatternScore,
    distortionValue,
    isListening,
    permissionGranted,
    error,
    startListening,
    stopListening,
    
    // New ML features
    currentBreathingPhase,
    phaseConfidence,
    modelStatus,
    modelInfo,
    
    // Pattern Analysis Features
    patternAnalysis,        // Complete pattern analysis data
    patternSignal,          // 0-1 normalized pattern strength signal
    isPatternDetected,      // Boolean: is rhythmic pattern detected?
    patternQuality,         // Human-readable pattern quality label
    
    // Enhanced analytics
    phaseHistory: phaseHistoryRef.current.slice(-10), // Last 10 predictions for debugging
    retrainModel: initializeModel, // Allow manual retraining
    forceRetrainModel: forceRetrainModel // Force retrain with new data
  }
}
