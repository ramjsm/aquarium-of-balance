# The School of Balance

A web visualization of Craig Reynolds' Boids algorithm with microphone interaction and dynamic audio. Virtual fish swim together following flocking rules, but scatter when they detect noise from your microphone, creating a dynamic relationship between sound, movement, and collective behavior.

[**Live Demo**](https://schoolofbalance.netlify.app/)

<img width="1709" height="1260" alt="image" src="https://github.com/user-attachments/assets/036511de-ab65-49b2-844d-600ae70a6561" />

## About

This is a visualization of the [Boids algorithm](https://www.red3d.com/cwr/boids/) that Craig Reynolds created in 1986. The simulation shows a school of koi fish following the three basic flocking rules: separation, alignment, and cohesion.

The project explores the relationship between noise and harmony through two interconnected systems:

- **Visual**: Fish react to microphone input by scattering when they detect noise
- **Audio**: An immersive soundscape that responds dynamically to both the fish behavior and environmental audio input

It's an exploration of how external disturbances can disrupt collective harmony, and how that disruption can be transformed into a meditative visualization experience.

### What it does

- Implements Craig Reynolds' Boids flocking algorithm
- Fish scatter when they detect microphone noise
- Features an immersive soundscape that responds to fish behavior
- Sound manipulation based on noise levels and collective fish movement
- Real-time parameter controls for both visual and audio elements

## 🛠️ Technology Stack

- **React 19** - UI framework
- **Three.js + React Three Fiber** - 3D rendering and scene management
- **React Three Drei** - Additional Three.js utilities and helpers
- **Leva** - Real-time parameter controls
- **GSAP** - Smooth animations and transitions
- **Tailwind CSS** - Styling and responsive design
- **Vite** - Build tool and development server

## How to Use

1. Open [schoolofbalance.netlify.app](https://schoolofbalance.netlify.app/)
2. Allow microphone access when prompted (required for both visual and audio interaction)
3. Click "Begin the Lesson" to begin the audiovisual experience
4. **Visual Interaction**: The fish swim peacefully until they detect noise from your microphone, then they scatter
5. **Audio Experience**: Listen as the soundscape responds to both the fish behavior and your environmental audio input
6. Use the "Behavior" control panel to adjust algorithm parameters and explore different interactions

## The Boids Algorithm & Sound Design

### Visual System

The simulation follows Craig Reynolds' three core rules:

1. **Separation**: Avoid crowding nearby fish
2. **Alignment**: Swim in the same direction as nearby fish
3. **Cohesion**: Move toward the center of nearby fish

Additional behaviors:

- **Species Cohesion**: Prefer to stay close to and align with fish of the same species
- **Wander**: Random movement for natural-looking motion
- **Boundary Avoidance**: Turn away from aquarium walls
- **Noise Response**: Scatter when microphone detects sound

### Audio System

The immersive soundscape operates on multiple layers:

- **Environmental Response**: Audio processing that reacts to microphone input levels
- **Behavioral Sonification**: Fish scattering and schooling behaviors influence the sound texture
- **Dynamic Audio Tracks**: Real-time mixing between harmony and chaos audio based on collective fish behavior
- **Ambient Soundscape**: Background audio that creates an underwater atmosphere

## 🔧 Project Structure

```
src/
├── components/
│   ├── Boids.jsx           # Core boids algorithm implementation
│   ├── Scene.jsx           # Main 3D scene setup
│   ├── UIOverlay.jsx       # User interface and noise visualization
│   ├── AudioController.jsx # Audio management and playback
│   └── SandPlane.jsx       # Aquarium floor
├── hooks/
│   └── useBreathTracking.js # Microphone input processing
└── App.jsx                 # Root component
```

## 📚 Resources & Credits

- **Craig Reynolds' Boids Algorithm**: [red3d.com/cwr/boids](https://www.red3d.com/cwr/boids/)
- **R3F Boids Implementation Tutorial and 3D Model**: [YouTube - Boids Flocking Simulation](https://www.youtube.com/watch?v=WepzbxlYROs)
- **Sound Design**: [Thibaut Bournazac](https://soundcloud.com/lefleuve)

---

_An exploration of flocking behavior, dynamic audio, and the relationship between noise, harmony, and collective movement._
