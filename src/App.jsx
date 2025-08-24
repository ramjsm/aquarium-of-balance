import { Suspense } from 'react'
import { Loader } from '@react-three/drei'
import Scene from './components/Scene'
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './App.css'

gsap.registerPlugin(ScrollTrigger, SplitText)

function App() {
  return (
    <>
        <Scene />
        <Loader />
    </>
  )
}

export default App
