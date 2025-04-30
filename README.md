# 3D Game with TensorFlow Hand Detection

An interactive 3D game built with Babylon.js and TensorFlow.js that lets you control a 3D box using hand gestures through your webcam.

## Features

- Real-time hand detection and tracking
- Gesture-based controls for movement and resizing
- Beautiful HDR skybox environment
- Smooth movement and boundary constraints
- Responsive 3D environment

## Controls

The game uses hand detection through your webcam for interaction:

- 👆 **Move Hand**: Control box position
- 🤏 **Pinch**: Enter resize mode
- ✋ **While Pinched**: Move hand apart/together to resize
- 👋 **Release Pinch**: Return to movement mode

## Prerequisites

- Yarn package manager
- Node.js (v14 or higher)
- Modern web browser with WebGL support
- Webcam access

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
- **Build Tool**: Vite
- **Package Manager**: Yarn
- **Environment Maps**: HDR skybox

## Project Structure

```
3d_Game_Tensorflow/
├── src/
│   ├── utils/
│   │   ├── game.js         # Main game logic
│   │   └── hand_detection.js
│   ├── App.jsx            # React application entry
│   └── main.jsx          # Main entry point
├── public/               # Static assets
├── package.json         # Project dependencies
├── yarn.lock           # Yarn lock file
└── vite.config.js       # Vite configuration
```

## Development

The game uses Vite for development with hot module replacement (HMR). The development server will automatically reload when you make changes to the code.

### Environment Setup

Make sure your webcam is accessible and your browser has permission to use it. The hand detection requires a clear view of your hands for optimal performance.

### Performance Considerations

- Good lighting conditions improve hand detection accuracy
- Keep your hand within the camera frame
- Maintain a reasonable distance from the camera (approximately arm's length)

## Troubleshooting

If you encounter issues:

1. **No hand detection**:
   - Check if your webcam is properly connected
   - Ensure browser has permission to access the camera
   - Try improving lighting conditions

2. **Performance issues**:
   - Close other resource-intensive applications
   - Check your browser's WebGL support
   - Ensure your graphics drivers are up to date

3. **Installation issues**:
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




made with Love ❤️ by GreenHacker