# 🎮 3D Hand Pose Game

A cutting-edge 3D hand gesture-controlled game built with React 18, Babylon.js, and TensorFlow.js. Experience intuitive hand tracking with real-time gesture recognition to control interactive 3D objects in a virtual environment.

![3D Hand Pose Game](https://img.shields.io/badge/React-18.2.0-blue) ![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.15.0-orange) ![Babylon.js](https://img.shields.io/badge/Babylon.js-6.38.1-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🤖 Advanced Hand Tracking
- **Real-time Hand Detection**: 60fps gesture recognition using TensorFlow.js MediaPipe
- **Multiple Gesture Types**: Open hand, closed fist, pinch gestures with confidence scoring
- **3D Motion Mode**: Full spatial hand tracking with calibration system
- **Adaptive Detection**: Automatic adjustment for different lighting conditions
- **Temporal Smoothing**: Reduces jitter and improves tracking stability

### 🎯 Interactive 3D Environment
- **Babylon.js 3D Engine**: High-performance WebGL rendering
- **Interactive Cube**: Responds to hand gestures with visual feedback
- **Physics Simulation**: Realistic movement with gravity, friction, and collision detection
- **Dynamic Lighting**: Adaptive lighting system with multiple presets
- **Smooth Animations**: Framer Motion powered UI transitions

### 🎨 Modern UI/UX
- **Minimalistic Design**: Clean, dark theme with accent colors
- **Real-time Performance HUD**: FPS, latency, and tracking quality metrics
- **Status Indicators**: Visual feedback for system components
- **Responsive Layout**: Works on desktop and mobile devices
- **Error Boundaries**: Comprehensive error handling with user-friendly messages

### 🔧 Technical Features
- **WebGL Context Recovery**: Automatic handling of graphics context loss
- **Calibration System**: Personalized 3D motion tracking setup
- **Performance Monitoring**: Real-time metrics and optimization
- **State Management**: Zustand-powered centralized state
- **TypeScript Ready**: Full type support for development

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 16.0 or higher
- **Yarn**: Package manager (required - npm not supported)
- **Modern Browser**: Chrome, Firefox, Safari, or Edge with WebGL 2.0 support
- **Webcam**: Required for hand tracking
- **Good Lighting**: Recommended for optimal hand detection

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/3d-hand-pose-game.git
   cd 3d-hand-pose-game
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Start the development server**
   ```bash
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3002` (or the port shown in your terminal)

5. **Grant camera permissions**
   Allow webcam access when prompted by your browser

## 🎮 How to Play

### Basic Controls
- **✋ Open Hand**: Move the cube by moving your hand
- **✊ Closed Fist**: Grab and drag the cube with enhanced control
- **🤏 Pinch**: Scale the cube by changing finger spread distance

### 3D Motion Mode
1. Click the "3D Motion" toggle in the top-left corner
2. Follow the calibration process to set up your interaction space
3. Enjoy full 3D spatial control with hand orientation tracking

### Tips for Best Experience
- Ensure good lighting conditions
- Keep your hand clearly visible to the camera
- Maintain a distance of 1-3 feet from the camera
- Use smooth, deliberate movements for better tracking

## 🛠️ Development

### Project Structure
```
src/
├── components/          # React components
├── core/               # Core hand tracking logic
├── 3d/                 # Babylon.js 3D scene management
├── hooks/              # Custom React hooks
├── objects/            # 3D object classes
├── store/              # Zustand state management
├── utils/              # Utility functions
└── styles/             # CSS and styling
```

### Key Technologies
- **React 18**: Modern React with concurrent features
- **Babylon.js 6.38**: 3D graphics engine
- **TensorFlow.js 4.15**: Machine learning for hand detection
- **Framer Motion**: Animation library
- **Tailwind CSS**: Utility-first CSS framework
- **Zustand**: Lightweight state management
- **Vite**: Fast build tool and development server

### Building for Production
```bash
# Build the project
yarn build

# Preview the production build
yarn preview
```

## 📊 Performance

### System Requirements
- **CPU**: Modern multi-core processor
- **GPU**: Dedicated graphics card recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Browser**: Latest version with WebGL 2.0 support

### Optimization Features
- Adaptive quality settings based on performance
- Efficient hand detection with configurable frame rates
- WebGL context recovery for stability
- Memory management for long sessions

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_HAND_DETECTION_FPS=30
VITE_ENABLE_DEBUG_MODE=false
VITE_DEFAULT_QUALITY=high
```

### Customization
- Modify `src/core/HandDetectionEngine.js` for detection parameters
- Adjust 3D scene settings in `src/3d/SceneManager.js`
- Customize UI themes in `tailwind.config.js`

## 🐛 Troubleshooting

### Common Issues

**Hand detection not working**
- Check camera permissions in browser settings
- Ensure good lighting conditions
- Try refreshing the page
- Check browser console for errors

**Poor performance**
- Lower quality settings in the performance HUD
- Close other browser tabs
- Update graphics drivers
- Use a dedicated graphics card if available

**3D scene not loading**
- Verify WebGL 2.0 support: visit `webglreport.com`
- Update your browser to the latest version
- Disable browser extensions that might interfere
- Try incognito/private browsing mode

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TensorFlow.js Team** for the MediaPipe hand tracking model
- **Babylon.js Community** for the excellent 3D engine
- **React Team** for the amazing framework
- **Open Source Community** for inspiration and tools

## 📞 Support

- 📧 Email: [harsh@greenhacker.tech](mailto:harsh@greenhacker.tech)


## 🔬 Technical Deep Dive

### Hand Detection Pipeline
1. **Video Capture**: Real-time webcam feed processing
2. **MediaPipe Model**: TensorFlow.js hand landmark detection
3. **Gesture Classification**: Custom gesture recognition algorithms
4. **3D Coordinate Mapping**: Transform 2D landmarks to 3D space
5. **Smoothing & Filtering**: Temporal smoothing for stable tracking

### 3D Rendering Pipeline
1. **Scene Setup**: Babylon.js engine initialization
2. **Object Creation**: Interactive 3D objects with physics
3. **Lighting System**: Dynamic lighting with multiple presets
4. **Animation System**: Smooth interpolation and transitions
5. **Render Loop**: Optimized 60fps rendering

### Performance Optimizations
- **Adaptive Quality**: Dynamic quality adjustment based on performance
- **Frame Rate Control**: Configurable detection and rendering rates
- **Memory Management**: Efficient resource cleanup and disposal
- **WebGL Recovery**: Automatic context restoration on graphics errors

## 🧪 Testing

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage
```

### Test Coverage
- Unit tests for core hand detection logic
- Integration tests for 3D scene interactions
- Performance benchmarks for optimization
- Browser compatibility testing

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
yarn global add vercel

# Deploy
vercel
```

### Netlify
```bash
# Build the project
yarn build

# Deploy dist/ folder to Netlify
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
EXPOSE 3002
CMD ["yarn", "preview"]
```

## 📈 Roadmap

### Version 2.0 (Coming Soon)
- [ ] Multi-hand tracking support
- [ ] Gesture sequence recognition
- [ ] Multiple 3D objects interaction
- [ ] Voice commands integration
- [ ] VR/AR compatibility

### Version 2.1
- [ ] Multiplayer support
- [ ] Custom gesture training
- [ ] Advanced physics simulation
- [ ] Mobile app version

---

**Made with ❤️ by GreenHacker**
