import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import HandTracker from './components/HandTracker.jsx';
import Scene3D from './components/Scene3D.jsx';
import PerformanceHUD from './components/PerformanceHUD.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ThreeDMotionToggle from './components/3DMotionToggle.jsx';
import CalibrationModal from './components/CalibrationModal.jsx';
import ThreeDTrackingHUD from './components/3DTrackingHUD.jsx';
import useHandDetection from './hooks/useHandDetection.js';
import use3DScene from './hooks/use3DScene.js';
import { TRACKING_MODES } from './core/3DMotionModeManager.js';
import './App.css';

/**
 * Minimalistic 3D Hand Pose Game
 * Focus: Hand detection + Single interactive cube
 */
function App() {
  const sceneCanvasRef = useRef(null);

  // 3D Motion Mode state
  const [currentTrackingMode, setCurrentTrackingMode] = useState(TRACKING_MODES.MODE_2D);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [show3DTrackingHUD, setShow3DTrackingHUD] = useState(true);
  const [trackingHUDMinimized, setTrackingHUDMinimized] = useState(false);

  // Custom hooks for hand detection and 3D scene
  const {
    isLoading: handLoading,
    error: handError,
    handState,
    performance,
    initialize: initializeHand,
    startDetection,
    switchTrackingMode,
    startCalibration,
    get3DModeStatus,
    resetCalibration
  } = useHandDetection();

  const {
    isLoading: sceneLoading,
    error: sceneError,
    cubeInfo,
    initialize: initializeScene,
    updateCubeWithHand
  } = use3DScene(sceneCanvasRef);

  /**
   * Handle hand detection initialization
   */
  const handleHandDetection = async (webcamRef) => {
    try {
      console.log('🎯 Initializing hand detection...');

      // First initialize the hand detection system
      await initializeHand();

      console.log('✅ Hand detection initialized, starting detection...');

      // Then start detection with video
      if (webcamRef && webcamRef.current && webcamRef.current.video) {
        const video = webcamRef.current.video;

        const startDetectionWhenReady = () => {
          if (video.readyState >= 2) {
            console.log('🎥 Video ready, starting detection loop...');
            startDetection(video);
          } else {
            console.log('⏳ Waiting for video to be ready...');
            video.addEventListener('loadeddata', startDetectionWhenReady, { once: true });
          }
        };

        startDetectionWhenReady();
      } else {
        console.warn('⚠️ Webcam reference not available');
      }
    } catch (error) {
      console.error('❌ Failed to initialize hand detection:', error);
    }
  };

  /**
   * Handle 3D scene initialization
   */
  const handleSceneReady = async (canvasRef) => {
    sceneCanvasRef.current = canvasRef.current;
    try {
      await initializeScene();
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
    }
  };

  /**
   * Handle tracking mode switch
   */
  const handleModeSwitch = (mode) => {
    const success = switchTrackingMode(mode);
    if (success) {
      setCurrentTrackingMode(mode);
    }
  };

  /**
   * Handle calibration start
   */
  const handleCalibrationStart = () => {
    setShowCalibrationModal(true);
  };

  /**
   * Handle calibration complete
   */
  const handleCalibrationComplete = () => {
    setShowCalibrationModal(false);
    setCurrentTrackingMode(TRACKING_MODES.MODE_3D);
  };

  /**
   * Initialize hand detection on mount
   */
  useEffect(() => {
    const initializeOnMount = async () => {
      try {
        console.log('🚀 Initializing hand detection system on mount...');
        await initializeHand();
      } catch (error) {
        console.error('❌ Failed to initialize hand detection on mount:', error);
      }
    };

    initializeOnMount();
  }, [initializeHand]);

  /**
   * Update cube with hand gestures
   */
  useEffect(() => {
    if (handState.isTracking && updateCubeWithHand) {
      const is3DMode = currentTrackingMode === TRACKING_MODES.MODE_3D;
      updateCubeWithHand(handState, is3DMode);
    }
  }, [handState, updateCubeWithHand, currentTrackingMode]);

  const isLoading = handLoading || sceneLoading;
  const error = handError || sceneError;

  // Determine status for indicators
  const getHandDetectionStatus = () => {
    if (handError) return 'error';
    if (handLoading) return 'loading';
    if (handState.isTracking) return 'ready';
    return 'waiting';
  };

  const getSceneStatus = () => {
    if (sceneError) return 'error';
    if (sceneLoading) return 'loading';
    if (cubeInfo) return 'ready';
    return 'waiting';
  };

  return (
    <ErrorBoundary>
      <motion.div
        className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-dark-800 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Main Content */}
        <div className="flex h-screen gap-4 p-4">
          {/* Hand Tracking Panel */}
          <motion.div
            className="hand-tracker-container w-80 h-60 flex-shrink-0"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <HandTracker
              onHandDetection={handleHandDetection}
              isLoading={handLoading}
              error={handError}
              width={320}
              height={240}
            />
          </motion.div>

          {/* 3D Scene Panel */}
          <motion.div
            className="scene-container flex-1 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Scene3D
              onSceneReady={handleSceneReady}
              className="w-full h-full"
            />

            {/* Loading overlay for 3D scene */}
            <AnimatePresence>
              {sceneLoading && (
                <motion.div
                  className="overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="overlay-content">
                    <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                    <p className="text-accent-400 font-medium">Initializing 3D Scene...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error overlay for 3D scene */}
            <AnimatePresence>
              {sceneError && (
                <motion.div
                  className="overlay glow-error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="overlay-content">
                    <p className="text-red-400 font-medium">⚠️ {sceneError}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Status Indicator */}
        <motion.div
          className="absolute top-4 left-4 z-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <StatusIndicator
            handDetectionStatus={getHandDetectionStatus()}
            sceneStatus={getSceneStatus()}
          />
        </motion.div>

        {/* Performance HUD */}
        <motion.div
          className="absolute top-4 right-4 z-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <PerformanceHUD
            handState={handState}
            performance={performance}
            cubeInfo={cubeInfo}
            position="top-right"
          />
        </motion.div>

        {/* 3D Motion Toggle */}
        <motion.div
          className="absolute top-20 left-4 z-10"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <ThreeDMotionToggle
            currentMode={currentTrackingMode}
            onModeSwitch={handleModeSwitch}
            onCalibrationStart={handleCalibrationStart}
            modeStatus={get3DModeStatus()}
          />
        </motion.div>

        {/* 3D Tracking HUD */}
        {show3DTrackingHUD && (
          <motion.div
            className="absolute top-20 right-4 z-10"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <ThreeDTrackingHUD
              handState={handState}
              modeStatus={get3DModeStatus()}
              isMinimized={trackingHUDMinimized}
              onToggleMinimize={() => setTrackingHUDMinimized(!trackingHUDMinimized)}
            />
          </motion.div>
        )}

        {/* Instructions Panel */}
        <motion.div
          className="absolute bottom-4 left-4 z-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="card-compact space-y-2">
            <h3 className="text-sm font-semibold text-accent-400 mb-3">Gesture Controls</h3>
            <motion.div
              className="gesture-item"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <span className="gesture-icon">✋</span>
              <span className="gesture-text">Open Hand - Move Cube</span>
            </motion.div>
            <motion.div
              className="gesture-item"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <span className="gesture-icon">✊</span>
              <span className="gesture-text">Fist - Grab Cube</span>
            </motion.div>
            <motion.div
              className="gesture-item"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
              transition={{ duration: 0.2 }}
            >
              <span className="gesture-icon">🤏</span>
              <span className="gesture-text">Pinch - Scale Cube</span>
            </motion.div>

            {/* 3D Mode Instruction */}
            {currentTrackingMode === TRACKING_MODES.MODE_3D && (
              <motion.div
                className="gesture-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                <span className="gesture-icon">🎯</span>
                <span className="gesture-text">3D Motion - Full Spatial Control</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Calibration Modal */}
        <CalibrationModal
          isOpen={showCalibrationModal}
          onClose={() => setShowCalibrationModal(false)}
          onComplete={handleCalibrationComplete}
          handState={handState}
          startCalibration={startCalibration}
        />
      </motion.div>
    </ErrorBoundary>
  );
}

export default App;
