import { useRef, useState, useEffect } from 'react'

export default function AudioController({ breathData, onAudioReady }) {
  const harmonyAudioRef = useRef(null)
  const chaosAudioRef = useRef(null)
  const [isHarmonyLoaded, setIsHarmonyLoaded] = useState(false)
  const [isChaosLoaded, setIsChaosLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Calculate if both audio tracks are ready
  const isAudioReady = isHarmonyLoaded && isChaosLoaded
  
  // Notify parent component when audio is ready
  useEffect(() => {
    if (onAudioReady) {
      onAudioReady(isAudioReady)
    }
  }, [isAudioReady, onAudioReady])

  // Start playing both audio tracks
  const playAudio = async () => {
    try {
      if (harmonyAudioRef.current && chaosAudioRef.current) {
        // Start both tracks simultaneously
        await Promise.all([
          harmonyAudioRef.current.play(),
          chaosAudioRef.current.play()
        ])
        setIsPlaying(true)
        console.log('Both audio tracks started successfully')
      }
    } catch (error) {
      console.log('Audio autoplay prevented:', error)
    }
  }

  // Stop playing both audio tracks
  const stopAudio = () => {
    if (harmonyAudioRef.current) {
      harmonyAudioRef.current.pause()
      harmonyAudioRef.current.currentTime = 0
    }
    if (chaosAudioRef.current) {
      chaosAudioRef.current.pause()
      chaosAudioRef.current.currentTime = 0
    }
    setIsPlaying(false)
  }

  // Update volumes based on breath intensity or other factors
  const updateVolumes = (harmonyVolume = 1.0, chaosVolume = 0.0) => {
    if (harmonyAudioRef.current) {
      harmonyAudioRef.current.volume = Math.max(0, Math.min(1, harmonyVolume))
    }
    if (chaosAudioRef.current) {
      chaosAudioRef.current.volume = Math.max(0, Math.min(1, chaosVolume))
    }
  }

  // Effect to control volumes based on breath intensity
  useEffect(() => {
    if (isPlaying && breathData?.getBreathIntensity) {
      const updateAudioVolumes = () => {
        const intensity = breathData.getBreathIntensity()
        
        // Harmony volume decreases as intensity increases
        const harmonyVolume = Math.max(0.1, 1.0 - intensity)
        
        // Chaos volume increases as intensity increases
        const chaosVolume = Math.min(1.0, intensity)
        
        updateVolumes(harmonyVolume, chaosVolume)
      }

      // Update volumes on each animation frame
      const volumeUpdateInterval = setInterval(updateAudioVolumes, 100) // Update every 100ms
      
      return () => clearInterval(volumeUpdateInterval)
    }
  }, [isPlaying, breathData])

  // Initialize volumes when component mounts
  useEffect(() => {
    updateVolumes(1.0, 0.0) // Harmony at 100%, chaos at 0%
  }, [isHarmonyLoaded, isChaosLoaded])

  // Expose control methods to parent component
  useEffect(() => {
    if (window) {
      window.audioController = {
        play: playAudio,
        stop: stopAudio,
        updateVolumes,
        isPlaying,
        isReady: isAudioReady
      }
    }
  }, [isPlaying, isAudioReady])

  return (
    <>
      {/* Harmony Audio Track */}
      <audio
        ref={harmonyAudioRef}
        preload="auto"
        loop
        onCanPlayThrough={() => setIsHarmonyLoaded(true)}
        onError={(e) => console.error('Harmony audio loading error:', e)}
      >
        <source src="/sound/harmony_compressed.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Chaos Audio Track */}
      <audio
        ref={chaosAudioRef}
        preload="auto"
        loop
        onCanPlayThrough={() => setIsChaosLoaded(true)}
        onError={(e) => console.error('Chaos audio loading error:', e)}
      >
        <source src="/sound/chaos_compressed.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
    </>
  )
}
