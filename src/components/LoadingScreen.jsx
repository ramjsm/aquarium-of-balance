import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

export default function LoadingScreen() {
  const loadingRef = useRef(null)
  const dotsRef = useRef(null)
  
  useEffect(() => {
    // Animate the loading dots
    if (dotsRef.current) {
      gsap.to(dotsRef.current.children, {
        opacity: 0.3,
        duration: 0.8,
        stagger: 0.2,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      })
    }
    
    // Subtle fade in animation for the loading screen
    if (loadingRef.current) {
      gsap.fromTo(loadingRef.current, 
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      )
    }
  }, [])
  
  return (
    <div 
      ref={loadingRef}
      className="fixed inset-0 flex items-center justify-center bg-white z-50"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Loading animation - inspired by water/aquarium */}
        <div className="relative">
          <div className="w-16 h-16 border-2 border-gray-200 rounded-full">
            <div className="w-16 h-16 border-2 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          <div className="absolute inset-2 w-12 h-12 border-2 border-gray-100 rounded-full">
            <div className="w-12 h-12 border-2 border-transparent border-t-cyan-300 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-xl font-black -tracking-[0.07rem] text-gray-800 mb-2">
            Filling the aquarium
          </h2>
          <div className="flex items-center justify-center gap-1">
            <span className="text-gray-600">Loading</span>
            <div ref={dotsRef} className="flex gap-1">
              <span className="text-gray-600">.</span>
              <span className="text-gray-600">.</span>
              <span className="text-gray-600">.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
