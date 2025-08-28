import { useRef, useState, useEffect } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

export default function UIOverlay({ screen, setScreen, breathData }) {
  const glassOverlayRef = useRef(null)
  const introContentRef = useRef(null)
  const audioRef = useRef(null)
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)
  
  // Refs for breath visualization elements (updated without React re-renders)
  const breathProgressRef = useRef(null)
  const breathCircleRef = useRef(null)
  const breathTextRef = useRef(null)
  const breathPercentRef = useRef(null)
  const animationFrameIdRef = useRef(null)
  
  const { contextSafe } = useGSAP({ scope: introContentRef });
  const mm = gsap.matchMedia();

  useGSAP(() => {
    document.fonts.ready.then(() => {
      SplitText.create('#intro-header', {
        type: 'chars',
        smartWrap: true,
        onSplit: (self) => {
          gsap.from(self.chars, {
            stagger: 0.1,
            autoAlpha: 0,
            y: -10,
            ease: 'power1.inOut',
            scrollTrigger: {
              trigger: '#intro-header',
            },
          })
        },
      })
    })
  })

  // Effect to handle breath visualization updates without React re-renders
  useEffect(() => {
    if (!breathData || !breathData.isListening) {
      // Stop animation loop if not listening
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
      return
    }

    // Start animation loop for breath visualization
    const updateBreathVisuals = () => {
      if (breathData.getBreathIntensity && screen === 'exp') {
        const intensity = breathData.getBreathIntensity()
        const percentage = Math.round(intensity * 100)
        
        // Update progress bar width directly
        if (breathProgressRef.current) {
          breathProgressRef.current.style.width = `${percentage}%`
        }
        
        // Update circular progress
        if (breathCircleRef.current) {
          const dashLength = intensity * 176 // 176 is the circle circumference
          breathCircleRef.current.style.strokeDasharray = `${dashLength} 176`
        }
        
        // Update text displays
        if (breathTextRef.current) {
          breathTextRef.current.textContent = `Intensity: ${percentage}%`
        }
        
        if (breathPercentRef.current) {
          breathPercentRef.current.textContent = percentage
        }
      }
      
      animationFrameIdRef.current = requestAnimationFrame(updateBreathVisuals)
    }
    
    updateBreathVisuals()
    
    // Cleanup animation frame on unmount or when listening stops
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
    }
  }, [breathData?.isListening, screen])

  const handleEnterClick = contextSafe(
    async () => {
      // Play harmony audio
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log('Audio autoplay prevented:', error)
        })
      }

      // Start breath tracking (request microphone access)
      if (breathData && breathData.startListening) {
        try {
          await breathData.startListening()
          console.log('Breath tracking started successfully')
        } catch (error) {
          console.error('Failed to start breath tracking:', error)
        }
      }

      mm.add({
        isMobile: "(max-width: 500px)",
        isDesktop: "(min-width: 501px)",
      }, (context) => {
        let { isMobile, isDesktop } = context.conditions;

        if(isMobile) {
        gsap.to(glassOverlayRef.current, {
                  top: '0',
                  height: '23rem',
                  duration: 1.5,
                  ease: 'power3.inOut',
                  onComplete: () => setScreen('exp')
                })
        }

        if(isDesktop) {
            gsap.to(glassOverlayRef.current, {
                  top: '0',
                  height: '20rem',
                  duration: 1.5,
                  ease: 'power3.inOut',
                  onComplete: () => setScreen('exp')
                })
        }
      })


      // Fade out content slightly before glass slides
      gsap.to(introContentRef.current, {
        opacity: 0,
        duration: 1,
        ease: 'power2.out'
      })
    }
  )

  return (
    <>
      {/* Hidden audio element for harmony.mp3 */}
      <audio
        ref={audioRef}
        preload="auto"
        loop
        onCanPlayThrough={() => setIsAudioLoaded(true)}
        onError={(e) => console.error('Audio loading error:', e)}
      >
        <source src="/sound/harmony_compressed.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {screen === 'intro' && (
        <div className='absolute top-0 left-0 w-screen h-screen overflow-hidden'>
          {/* Intro Content */}
          <div ref={introContentRef} className='absolute top-[50%] left-0 flex flex-col gap-2 w-full h-1/2 z-1 opacity-80 -translate-y-1/2'>
            <div className="mx-auto my-auto">
              <h1 id="intro-header" className='font-black text-3xl -tracking-[0.07rem] mix-blend-overlay'>Fish School Is in Session</h1>
              <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
                They’re learning to swim together and it’s a bit wobbly. <br></br>
                They’ll need your help to find the perfect rhythm… <br></br>
                But be careful, loud noises make them panic! <br></br>
              </p>
              <div className='mt-4'>
                <button
                  onClick={handleEnterClick}
                  className={`border border-black px-2 py-1 mix-blend-overlay transition-colors duration-300 ${isAudioLoaded
                      ? 'cursor-pointer hover:bg-black hover:text-white'
                      : 'cursor-wait opacity-50'
                    }`}
                  disabled={!isAudioLoaded}
                >
                  {isAudioLoaded ? 'Start Swimming Lessons' : 'Loading harmony...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {screen === 'exp' && (<>
        <div className="absolute left-10 top-10 z-1 opacity-80">
          <h1 id="exp-header" className='font-black text-4xl -tracking-[0.07rem] mix-blend-overlay'>Shhh… the fish are in class</h1>
          <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
            Enable microphone to interact
          </p>
        </div>
        
        {/* Breath Intensity Visual Display */}
        <div className="absolute lg:bottom-8 left-10 bottom-22 z-100 opacity-80">
          <div className="white backdrop-blur-sm rounded-lg min-w-[200px]">
            <h3 className="font-semibold text-xl mb-3 mix-blend-overlay">Noise Level</h3>
            
            {/* Microphone Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-3 h-3 rounded-full ${
                breathData?.isListening ? 'bg-green-400 animate-pulse' : 
                breathData?.error ? 'bg-red-400' : 'bg-gray-400'
              }`} />
              <span className="mix-blend-overlay">
                {breathData?.isListening ? 'Listening' : 
                 breathData?.error ? 'Error' : 
                 breathData?.permissionGranted ? 'Ready' : 'Not connected'}
              </span>
            </div>
            
            {/* Breath Intensity Visualization */}
            <div>
              <div ref={breathTextRef} className="mb-1 mix-blend-overlay">
                Noise: 0%
              </div>
              
              {/* Progress Bar */}
              <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div 
                  ref={breathProgressRef}
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-75 ease-out"
                  style={{ width: '0%' }}
                />
              </div>
            </div>
            
            {/* Error Display */}
            {breathData?.error && (
              <div className="mt-2 text-red-300 text-xs mix-blend-overlay">
                {breathData.error}
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute left-10 lg:right-10 bottom-5 opacity-80">
          <div className="flex flex-col justify-start lg:justify-end lg:flex-row lg:gap-4 lg:items-end gap-1">
            <a href="https://www.ramsessalas.com/" target="_blank" rel="noopener noreferrer">Interaction / Ramses Salas</a>
            <a href="https://soundcloud.com/lefleuve" target="_blank" rel="noopener noreferrer">Sound / Thibaut Bournazac</a>
          </div>
        </div>
      </>)}
      {/* Glass Overlay */}
      <div
        ref={glassOverlayRef}
        className='glass-overlay absolute top-[50%] left-0 w-full h-1/2 pointer-events-none -translate-y-1/2'
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
          backdropFilter: 'blur(2px)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          transform: 'translateY(0%)' // Set initial transform
        }}
      />
    </>
  )
}
