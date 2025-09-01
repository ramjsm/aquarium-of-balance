# The School of Balance

A web visualization of Craig Reynolds' Boids algorithm with microphone interaction. Virtual fish swim together following flocking rules, but scatter when they detect noise from your microphone.

[**Live Demo**](https://schoolofbalance.netlify.app/)

## About

This is a visualization of the [Boids algorithm](https://www.red3d.com/cwr/boids/) that Craig Reynolds created in 1986. The simulation shows a school of koi fish following the three basic flocking rules: separation, alignment, and cohesion.

The twist here is that the fish react to microphone input - when they hear noise, they scatter apart, breaking their peaceful schooling behavior. It's a simple exploration of how external disturbances can disrupt collective harmony.

### What it does

- Implements Craig Reynolds' Boids flocking algorithm
- Fish scatter when they detect microphone noise
- Includes real-time parameter controls
- Works on desktop and mobile
- Has some ambient audio

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
2. Allow microphone access when prompted
3. Click "Start Swimming Lessons"
4. The fish will swim peacefully until they hear noise from your microphone, then they'll scatter
5. Use the "Behavior" control panel to adjust the algorithm parameters

## The Boids Algorithm

The simulation follows Craig Reynolds' three simple rules:

1. **Separation**: Avoid crowding nearby fish
2. **Alignment**: Swim in the same direction as nearby fish
3. **Cohesion**: Move toward the center of nearby fish

Additional behaviors:

- **Wander**: Random movement for natural-looking motion
- **Boundary Avoidance**: Turn away from aquarium walls
- **Noise Response**: Scatter when microphone detects sound

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

### Algorithm & Theory

- **Craig Reynolds' Boids Algorithm**: [red3d.com/cwr/boids](https://www.red3d.com/cwr/boids/)
- **R3F Implementation Tutorial and 3D Model**: [YouTube - Boids Flocking Simulation](https://www.youtube.com/watch?v=WepzbxlYROs)

### Audio & Design

- **Sound Design**: [Thibaut Bournazac](https://soundcloud.com/lefleuve)
- **Interaction Design**: [Ramses Salas](https://www.ramsessalas.com/)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

_A simple exploration of flocking behavior and how noise can disrupt collective harmony._
