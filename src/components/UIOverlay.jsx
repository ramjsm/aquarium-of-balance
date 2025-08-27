import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import { SplitText } from 'gsap/SplitText'

export default function UIOverlay({ screen, setScreen }) {
  const glassOverlayRef = useRef(null)
  const introContentRef = useRef(null)
  const audioRef = useRef(null)
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)
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

  const handleEnterClick = contextSafe(
    () => {
      // Play harmony audio
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log('Audio autoplay prevented:', error)
        })
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
        <source src="/sound/ACQUARIUM_ZEN_final-bounce.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {screen === 'intro' && (
        <div className='absolute top-0 left-0 w-screen h-screen overflow-hidden'>
          {/* Intro Content */}
          <div ref={introContentRef} className='absolute top-[50%] left-0 flex flex-col gap-2 w-full h-1/2 z-1 opacity-80 -translate-y-1/2'>
            <div className="mx-auto my-auto">
              <h1 id="intro-header" className='font-black text-3xl -tracking-[0.07rem] mix-blend-overlay'>Aquarium of Balance</h1>
              <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
                Behind the glass, silence rests. <br></br>
                Here, light and shadow drift in harmony. <br></br>
                With your breath, the stillness awakens. <br></br>
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
                  {isAudioLoaded ? 'Enter the still waters' : 'Loading harmony...'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {screen === 'exp' && (<>
        <div className="absolute left-10 top-10 z-1 opacity-80">
          <h1 id="exp-header" className='font-black text-4xl -tracking-[0.07rem] mix-blend-overlay'>Your breath stirs the stillness</h1>
          <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
            Enable microphone and breathe to interact
          </p>
        </div>
        <div className="absolute left-10 lg:right-10 bottom-5 opacity-80">
          <div className="flex flex-col justify-start lg:flex-row lg:gap-4 lg:items-end gap-1">
            <a href="https://www.ramsessalas.com/" target="_blank" rel="noopener noreferrer">Interaction Design / Ramses Salas</a>
            <a href="https://soundcloud.com/lefleuve" target="_blank" rel="noopener noreferrer">Sound Design / Thibaut Bournazac</a>
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
