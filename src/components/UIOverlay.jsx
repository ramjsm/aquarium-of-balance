import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'

export default function UIOverlay({ screen, setScreen }) {
  const glassOverlayRef = useRef(null)
  const introContentRef = useRef(null)
  
  const handleEnterClick = () => {
    // Animate glass overlay sliding down
    gsap.to(glassOverlayRef.current, {
      y: '-62vh',
      duration: 1.5,
      ease: 'power3.inOut',
      onComplete: () => setScreen('exp')
    })
    
    // Fade out content slightly before glass slides
    gsap.to(introContentRef.current, {
      opacity: 0,
      duration: 1,
      ease: 'power2.out'
    })
  }
  
  return (
    <>
      { screen === 'intro' && (
        <div className='absolute top-0 left-0 w-screen h-screen overflow-hidden'>          
          {/* Intro Content */}
          <div ref={introContentRef} className='absolute top-0 left-0 flex flex-col gap-2 w-full h-full z-1 opacity-80'>
            <div className="mx-auto my-auto">
              <h1 className='font-black text-3xl -tracking-[0.07rem] mix-blend-overlay'>Aquarium of Balance</h1>
              <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
                Behind the glass, silence rests. <br></br>
                Here, light and shadow drift in harmony. <br></br>
                With your breath, the stillness awakens. <br></br>
              </p>
              <div className='mt-4'>
                <button 
                  onClick={handleEnterClick} 
                  className='border border-black px-2 py-1 mix-blend-overlay cursor-pointer hover:bg-black hover:text-white transition-colors duration-300'
                >
                  Enter the still waters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      { screen === 'exp' && (<>
        <div className="absolute left-10 top-10 z-1 opacity-80">
          <h1 className='font-black text-4xl -tracking-[0.07rem] mix-blend-overlay'>Your breath stirs the stillness</h1>
          <p className='mt-2 whitespace-pre-wrap mix-blend-overlay'>
            Enable microphone and breathe to interact
          </p>          
        </div>
        <div className="absolute right-10 bottom-5">
            <div className="flex gap-4 items-end mix-blend-overlay">
                <a href="https://www.ramsessalas.com/" target="_blank" rel="noopener noreferrer">Interaction Design / Ramses Salas</a>
                <a href="https://soundcloud.com/lefleuve" target="_blank" rel="noopener noreferrer">Sound Design / Thibauth Bournazac</a>
            </div>
        </div>
      </>)}
      {/* Glass Overlay */}
          <div 
            ref={glassOverlayRef}
            className='glass-overlay absolute top-[50%] left-0 w-full h-1/2 pointer-events-none -translate-y-1/2'
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
              backdropFilter: 'blur(0px)',
              borderBottom: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              transform: 'translateY(0%)' // Set initial transform
            }}
          />
    </>
  )
}
