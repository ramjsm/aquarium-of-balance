import { useState } from 'react'
import { Environment } from '@react-three/drei'

const ENVIRONMENT_PRESETS = [
  { name: 'Ocean Bay', value: 'sunset', description: 'Deep ocean vibes' },
  { name: 'Desert', value: 'dawn', description: 'Tropical lagoon' },
  { name: 'Night Sky', value: 'night', description: 'Deep underwater' },
  { name: 'Field', value: 'park', description: 'Bright coral environment' },
  { name: 'Studio', value: 'studio', description: 'Clean aquarium lighting' },
  { name: 'Industrial Area', value: 'warehouse', description: 'Mysterious cave' },
  { name: 'Kelp Forest', value: 'forest', description: 'Underwater forest' },
  { name: 'Bright Room', value: 'lobby', description: 'Modern tank setup' }
]

export default function EnvironmentController({ currentEnvironment, onEnvironmentChange }) {
  const [blur] = useState(0.8)
  
  // Use the first environment as default if none provided
  const activeEnvironment = currentEnvironment || ENVIRONMENT_PRESETS[0]

  return (
    <>
      {/* Environment setup */}
      <Environment
        background={false}
        preset={activeEnvironment.value}
        blur={blur}
      />
    </>
  )
}

export { ENVIRONMENT_PRESETS }
