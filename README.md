# 3D Game with Advanced ML Gesture Recognition

An interactive 3D game built with Babylon.js and TensorFlow.js that uses **advanced machine learning** to recognize 8 different hand gestures in real-time, providing a rich and intuitive gaming experience.

## 🚀 New Features

### 🤖 AI-Powered Gesture Recognition
- **8 Different Gestures**: Open hand, closed fist, pinch, point, victory, thumbs up, rock on, and OK sign
- **Real-time Confidence Scoring**: Each gesture comes with a confidence percentage
- **Temporal Smoothing**: Reduces jitter and provides stable gesture detection
- **Gesture History**: Maintains gesture stability across frames
- **Advanced Finger Angle Analysis**: Uses mathematical angle calculations for precise gesture detection

### 🎮 Enhanced Game Controls
- **✋ Open Hand**: Standard movement mode
- **🤏 Pinch**: Resize objects with finger spread
- **✊ Closed Fist**: Grab mode with special effects
- **👆 Point**: Selection mode for precise interaction
- **✌️ Victory**: Special actions and effects
- **👍 Thumbs Up**: Confirm actions
- **🤘 Rock On**: Special effects and animations
- **👌 OK Sign**: Reset game state

### 📊 Performance Monitoring
- **Real-time FPS tracking**
- **Latency monitoring**
- **Gesture confidence visualization**
- **Performance metrics display**

## Features

- Real-time hand detection and tracking with TensorFlow.js
- Advanced ML-based gesture recognition with 8 gesture types
- Beautiful HDR skybox environment with Babylon.js
- Smooth movement and boundary constraints
- Responsive 3D environment with physics
- Enhanced visual feedback for all gestures
- Performance monitoring and optimization
- Cross-platform compatibility

## Controls

The game uses **advanced machine learning** to detect hand gestures through your webcam:

### Basic Controls
- **✋ Open Hand**: Move box around the scene
- **🤏 Pinch**: Enter resize mode, spread/close fingers to resize
- **✊ Closed Fist**: Grab mode (hold for special effects)
- **👆 Point**: Selection mode (hold for special effects)

### Advanced Controls
- **✌️ Victory Sign**: Special actions (hold for effects)
- **👍 Thumbs Up**: Confirm current action (hold for effects)
- **🤘 Rock On**: Special effects (hold for effects)
- **👌 OK Sign**: Reset game state (hold for effects)

## Prerequisites

- Yarn package manager
- Node.js (v14 or higher)
- Modern web browser with WebGL support
- Webcam access
- Good lighting conditions for optimal hand detection

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/3d_Game_Tensorflow.git
cd 3d_Game_Tensorflow
```

2. Install dependencies:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

4. Open your browser and navigate to `http://localhost:3002`

> **Note**: This project uses Yarn as the package manager. NPM is not supported.

## Technology Stack

- **Frontend Framework**: React
- **3D Engine**: Babylon.js
- **Hand Detection**: TensorFlow.js
- **Gesture Recognition**: Custom ML algorithms with temporal smoothing
- **Build Tool**: Vite
- **Package Manager**: Yarn
- **Environment Maps**: HDR skybox

## Project Structure

```
3d_Game_Tensorflow/
├── src/
│   ├── utils/
│   │   ├── game.js              # Enhanced game logic with gesture handling
│   │   ├── gestureRecognition.js # ML-based gesture recognition system
│   │   ├── index.js             # Hand detection with gesture integration
│   │   └── gestureTest.js       # Gesture recognition testing utilities
│   ├── App.jsx                  # React application with enhanced UI
│   └── main.jsx                 # Main entry point
├── public/                      # Static assets
├── package.json                 # Project dependencies
├── yarn.lock                   # Yarn lock file
└── vite.config.js              # Vite configuration
```

## 🤖 AI Gesture Recognition System

### How It Works
The gesture recognition system uses **machine learning techniques** to analyze hand landmarks:

1. **Finger Angle Analysis**: Calculates angles between finger joints to determine if fingers are extended or bent
2. **Distance Calculations**: Measures distances between key points (e.g., thumb-index pinch)
3. **Confidence Scoring**: Each gesture gets a confidence score based on how well it matches the expected pattern
4. **Temporal Smoothing**: Reduces jitter by averaging confidence over multiple frames
5. **Gesture History**: Maintains stability by tracking gesture changes over time

### Supported Gestures
- **Open Hand**: All fingers extended for movement
- **Closed Fist**: All fingers bent for grab mode
- **Pinch**: Thumb and index finger close together for resize
- **Point**: Only index finger extended for selection
- **Victory**: Index and middle fingers extended for special actions
- **Thumbs Up**: Thumb extended, others bent for confirmation
- **Rock On**: Index and pinky extended, others bent for effects
- **OK Sign**: Thumb-index circle with other fingers extended for reset

## Development

The game uses Vite for development with hot module replacement (HMR). The development server will automatically reload when you make changes to the code.

### Environment Setup

Make sure your webcam is accessible and your browser has permission to use it. The hand detection requires:
- Clear view of your hands
- Good lighting conditions
- Reasonable distance from camera (arm's length)
- Stable hand positioning

### Performance Considerations

- **Good lighting** improves hand detection accuracy
- **Keep your hand within the camera frame**
- **Maintain a reasonable distance** from the camera
- **Close other resource-intensive applications** for better performance
- **Check your browser's WebGL support**
- **Ensure graphics drivers are up to date**

### Testing Gesture Recognition

You can test the gesture recognition system in the browser console:

```javascript
import testGestureRecognition from './src/utils/gestureTest.js';
testGestureRecognition();
```

## Troubleshooting

If you encounter issues:

1. **No hand detection**:
   - Check if your webcam is properly connected
   - Ensure browser has permission to access the camera
   - Try improving lighting conditions
   - Make sure your hand is clearly visible

2. **Poor gesture recognition**:
   - Ensure good lighting conditions
   - Keep your hand steady and clearly visible
   - Try different hand positions
   - Check the confidence score in the UI

3. **Performance issues**:
   - Close other resource-intensive applications
   - Check your browser's WebGL support
   - Ensure your graphics drivers are up to date
   - Try reducing browser window size

4. **Installation issues**:
   - Make sure you're using Yarn and not NPM
   - Clear yarn cache if needed: `yarn cache clean`
   - Delete `node_modules` and run `yarn install` again

## Scripts

Available yarn commands:
```bash
yarn dev        # Start development server
yarn build      # Build for production
yarn preview    # Preview production build
```

## Future Enhancements

- **Multi-hand support** for cooperative gameplay
- **Gesture sequence recognition** for complex actions
- **Custom gesture training** for personalized controls
- **VR/AR integration** for immersive experiences
- **Advanced physics interactions** with gesture-based manipulation
- **Multiplayer support** with gesture-based communication

## License

MIT License - feel free to use this project for your own learning and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Install dependencies (`yarn install`)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

**Made with ❤️ by GreenHacker**

*This project demonstrates advanced machine learning techniques for real-time gesture recognition in interactive 3D applications.*