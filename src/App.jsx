import { Suspense } from 'react'
import { Loader } from '@react-three/drei'
import Scene from './components/Scene'
import LoadingScreen from './components/LoadingScreen'
import './App.css'

function App() {
  return (
    <>
        <Scene />
        <Loader />
    </>
  )
}

export default App
