import React, { useRef, useEffect, useState } from 'react'
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import Webcam from 'react-webcam';
import { drawHand, GESTURE_TYPES } from './utils';
import Game from './utils/game';
import HandTrackingHUD from './components/HandTrackingHUD';
import SceneOverlay from './components/SceneOverlay';

import './App.css'

function App() {
  const webcamRef = useRef();
  const canvasRef = useRef();
  const gameCanvasRef = useRef();
  const gameRef = useRef();
  const [isLoading, setIsLoading] = useState(false);
  const [handState, setHandState] = useState({
    isTracking: false,
    gesture: GESTURE_TYPES.NO_HAND,
    confidence: 0,
    position: { x: 0, y: 0 },
    fingerSpread: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    latency: 0,
    frameCount: 0,
    lastFrameTime: 0
  });

  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [hudMinimized, setHudMinimized] = useState(false);
  const [overlayMinimized, setOverlayMinimized] = useState(false);

  const initializeHandpose = async () => {
    setIsLoading(true);
    const net = await handpose.load();
    setIsLoading(false);
    
    // Start detection loop with performance monitoring
    let frameCount = 0;
    let lastFrameTime = performance.now();
    
    const detectLoop = () => {
      detect(net);
      frameCount++;
      
      // Calculate FPS every 60 frames
      if (frameCount % 60 === 0) {
        const currentTime = performance.now();
        const fps = 60000 / (currentTime - lastFrameTime);
        lastFrameTime = currentTime;
        
        setPerformanceMetrics(prev => ({
          ...prev,
          fps: Math.round(fps),
          frameCount
        }));
      }
      
      // Continue loop
      requestAnimationFrame(detectLoop);
    };
    
    detectLoop();
  }

  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video.readyState === 4) {
      const startTime = performance.now();
      
      canvasRef.current.width = webcamRef.current.video.videoWidth;
      canvasRef.current.height = webcamRef.current.video.videoHeight;
      
      const hand = await net.estimateHands(webcamRef.current.video);
      const newHandState = drawHand(hand, canvasRef.current.getContext('2d'));
      
      // Update hand state
      setHandState(newHandState);
      
      // Update game with new hand state
      if (gameRef.current) {
        gameRef.current.updateHandState(newHandState);

        // Update object information
        if (gameRef.current.getAllObjects) {
          const allObjects = gameRef.current.getAllObjects();
          const selected = gameRef.current.getSelectedObject();
          setObjects(allObjects);
          setSelectedObject(selected);
        }
      }
      
      // Calculate latency
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        ...prev,
        latency: Math.round(latency)
      }));
    }
  }

  useEffect(() => {
    gameCanvasRef.current.width = window.innerWidth / 2;
    gameCanvasRef.current.height = window.innerHeight - 100;

    gameRef.current = new Game(gameCanvasRef.current);
    initializeHandpose();

    // Add keyboard shortcuts for HUD controls
    const handleKeyPress = (event) => {
      // H key to toggle Hand Tracking HUD
      if (event.key.toLowerCase() === 'h' && !event.ctrlKey && !event.altKey) {
        setHudMinimized(prev => !prev);
      }
      // O key to toggle Object info Overlay
      if (event.key.toLowerCase() === 'o' && !event.ctrlKey && !event.altKey) {
        setOverlayMinimized(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [])

  const getGestureEmoji = (gesture) => {
    const emojis = {
      [GESTURE_TYPES.OPEN_HAND]: '✋',
      [GESTURE_TYPES.CLOSED_FIST]: '✊',
      [GESTURE_TYPES.PINCH]: '🤏',
      [GESTURE_TYPES.POINT]: '👆',
      [GESTURE_TYPES.VICTORY]: '✌️',
      [GESTURE_TYPES.THUMBS_UP]: '👍',
      [GESTURE_TYPES.ROCK_ON]: '🤘',
      [GESTURE_TYPES.OK_SIGN]: '👌',
      [GESTURE_TYPES.NO_HAND]: '❌'
    };
    return emojis[gesture] || '❓';
  };

  const getGestureDescription = (gesture) => {
    const descriptions = {
      [GESTURE_TYPES.OPEN_HAND]: 'Open Hand - Movement Mode',
      [GESTURE_TYPES.CLOSED_FIST]: 'Closed Fist - Grab Mode',
      [GESTURE_TYPES.PINCH]: 'Pinch - Resize Mode',
      [GESTURE_TYPES.POINT]: 'Point - Select Mode',
      [GESTURE_TYPES.VICTORY]: 'Victory - Special Action',
      [GESTURE_TYPES.THUMBS_UP]: 'Thumbs Up - Confirm',
      [GESTURE_TYPES.ROCK_ON]: 'Rock On - Special Effect',
      [GESTURE_TYPES.OK_SIGN]: 'OK Sign - Reset',
      [GESTURE_TYPES.NO_HAND]: 'No Hand Detected'
    };
    return descriptions[gesture] || 'Unknown Gesture';
  };

  return (
    <>
      <div className="App">
        <div className="webcam-ai__container">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <h1>Initializing AI Model...</h1>
              <p>Please ensure your webcam is enabled</p>
            </div>
          )}
          <Webcam ref={webcamRef} className="webcam"/>
          <canvas className="webcam-ai__canvas" ref={canvasRef}/>
          
          {/* Enhanced Hand Tracking HUD */}
          <HandTrackingHUD
            handState={handState}
            isLoading={isLoading}
            objects={objects}
            selectedObject={selectedObject}
            isMinimized={hudMinimized}
            onToggleMinimize={() => setHudMinimized(!hudMinimized)}
          />
        </div>
        
        <div className="game">
          <canvas className="game__canvas" ref={gameCanvasRef}/>

          {/* Enhanced 3D Scene Overlay */}
          <SceneOverlay
            handState={handState}
            gameRef={gameRef}
            isMinimized={overlayMinimized}
            onToggleMinimize={() => setOverlayMinimized(!overlayMinimized)}
          />
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts-help">
        <div className="shortcuts-content">
          <span className="shortcut-item">
            <kbd>H</kbd> Toggle Hand HUD
          </span>
          <span className="shortcut-item">
            <kbd>O</kbd> Toggle Object Panel
          </span>
        </div>
      </div>

      <footer className="footer">
        <div className="instructions">
          <h2>🎮 Enhanced Hand Controls</h2>
          <div className="instruction-grid">
            <div className="instruction-item">
              <span className="emoji">✋</span>
              <div>
                <strong>Open Hand</strong>
                <p>Move box around the scene</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">🤏</span>
              <div>
                <strong>Pinch Gesture</strong>
                <p>Resize the box</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">✊</span>
              <div>
                <strong>Closed Fist</strong>
                <p>Grab mode (hold for effect)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">👆</span>
              <div>
                <strong>Point Gesture</strong>
                <p>Selection mode (hold for effect)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">✌️</span>
              <div>
                <strong>Victory Sign</strong>
                <p>Special action (hold for effect)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">👍</span>
              <div>
                <strong>Thumbs Up</strong>
                <p>Confirm action (hold for effect)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">🤘</span>
              <div>
                <strong>Rock On</strong>
                <p>Special effect (hold for effect)</p>
              </div>
            </div>
            
            <div className="instruction-item">
              <span className="emoji">👌</span>
              <div>
                <strong>OK Sign</strong>
                <p>Reset game (hold for effect)</p>
              </div>
            </div>
          </div>
          
          <div className="ai-info">
            <h3>🤖 AI-Powered Gesture Recognition</h3>
            <p>This game uses advanced machine learning to recognize 8 different hand gestures with real-time confidence scoring and temporal smoothing for stable detection.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App
