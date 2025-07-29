import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HandTracker from './components/HandTracker.jsx';
import Scene3D from './components/Scene3D.jsx';
import PerformanceHUD from './components/PerformanceHUD.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import ThreeDMotionToggle from './components/3DMotionToggle.jsx';
import CalibrationModal from './components/CalibrationModal.jsx';
import ThreeDTrackingHUD from './components/3DTrackingHUD.jsx';
import EnhancedHandVisualization from './components/EnhancedHandVisualization.jsx';
import ConfidenceIndicator from './components/ConfidenceIndicator.jsx';
import InteractiveCalibrationGuide from './components/InteractiveCalibrationGuide.jsx';
import MobileUI from './components/MobileUI.jsx';
import useHandDetection from './hooks/useHandDetection.js';
import use3DScene from './hooks/use3DScene.js';
import useLenis from './hooks/useLenis.js';
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
  const [show3DTrackingHUD] = useState(true);
  const [trackingHUDMinimized, setTrackingHUDMinimized] = useState(false);

  // Enhanced visual feedback state
  const [showEnhancedVisualization, setShowEnhancedVisualization] = useState(true);
  const [showConfidenceIndicator, setShowConfidenceIndicator] = useState(true);
  const [confidenceIndicatorMinimized, setConfidenceIndicatorMinimized] = useState(false);
  const [isInteractiveCalibrating, setIsInteractiveCalibrating] = useState(false);

  // Mobile support state
  const [isMobile, setIsMobile] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');
  const [showMobileSettings, setShowMobileSettings] = useState(false);

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
    initializeAdaptiveMapper
  } = useHandDetection();

  const {
    isLoading: sceneLoading,
    error: sceneError,
    cubeInfo,
    initialize: initializeScene,
    updateCubeWithHand
  } = use3DScene(sceneCanvasRef);

  // Initialize Lenis smooth scrolling
  const { scrollTo, start: startLenis, stop: stopLenis } = useLenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    mouseMultiplier: 1,
    touchMultiplier: 2,
    smoothTouch: false, // Disable on touch to avoid conflicts with hand tracking
  });

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

        const startDetectionWhenReady = async () => {
          if (video.readyState >= 2) {
            console.log('🎥 Video ready, starting detection loop...');

            // Wait a bit to ensure hand detection is fully initialized
            setTimeout(() => {
              startDetection(video);
            }, 500);

            // Initialize adaptive mapper if scene is also ready
            if (sceneCanvasRef.current) {
              console.log('🎯 Initializing adaptive mapper with video and scene elements');
              await initializeAdaptiveMapper(video, sceneCanvasRef.current);
            }
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
   * Handle 3D scene initialization with adaptive mapping
   */
  const handleSceneReady = async (canvasRef) => {
    sceneCanvasRef.current = canvasRef.current;
    try {
      await initializeScene();

      // Initialize adaptive mapper if we have both video and scene elements
      if (sceneCanvasRef.current) {
        // Try to get video element from webcam ref (will be available after hand detection starts)
        setTimeout(async () => {
          const videoElement = document.querySelector('video'); // Find the webcam video element
          if (videoElement && sceneCanvasRef.current) {
            console.log('🎯 Initializing adaptive mapper with video and scene elements');
            await initializeAdaptiveMapper(videoElement, sceneCanvasRef.current);
          }
        }, 1000); // Give time for webcam to initialize
      }
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
   * Handle interactive calibration start
   */
  const handleInteractiveCalibration = () => {
    setIsInteractiveCalibrating(true);
  };

  /**
   * Handle calibration point collection
   */
  const handleCalibrationPoint = (point) => {
    console.log('📍 Calibration point collected:', point);
    // The point will be automatically processed by the adaptive mapper
  };

  /**
   * Handle interactive calibration completion
   */
  const handleInteractiveCalibrationComplete = (points) => {
    console.log('✅ Interactive calibration completed with', points.length, 'points');
    setIsInteractiveCalibrating(false);
  };

  /**
   * Handle interactive calibration cancellation
   */
  const handleInteractiveCalibrationCancel = () => {
    console.log('❌ Interactive calibration cancelled');
    setIsInteractiveCalibrating(false);
  };

  /**
   * Handle mobile touch gestures
   */
  const handleTouchGesture = (gestureType, event) => {
    console.log('👆 Touch gesture:', gestureType);
    // Handle different gesture types
    switch (gestureType) {
      case 'tap':
        // Single tap - could trigger interaction
        break;
      case 'pinch_in':
        // Pinch in - could zoom out or scale down
        break;
      case 'pinch_out':
        // Pinch out - could zoom in or scale up
        break;
      case 'two_finger_tap':
        // Two finger tap - could reset or special action
        break;
      case 'multi_touch':
        // Multi-touch - could open menu
        setShowMobileSettings(true);
        break;
    }
  };

  /**
   * Handle mobile settings
   */
  const handleMobileSettings = () => {
    setShowMobileSettings(!showMobileSettings);
  };

  /**
   * Detect mobile device on component mount
   */
  useEffect(() => {
    const detectMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setIsMobile(isMobileDevice || isTouch);

      // Detect orientation
      const updateOrientation = () => {
        setDeviceOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
      };

      updateOrientation();
      window.addEventListener('orientationchange', updateOrientation);
      window.addEventListener('resize', updateOrientation);

      return () => {
        window.removeEventListener('orientationchange', updateOrientation);
        window.removeEventListener('resize', updateOrientation);
      };
    };

    detectMobile();
  }, []);

  /**
   * Initialize hand detection on mount (only if not already initialized)
   */
  useEffect(() => {
    const initializeOnMount = async () => {
      try {
        if (!handLoading && !handState.isTracking && !handState.isInitialized) {
          console.log('🚀 Initializing hand detection system on mount...');
          await initializeHand();
        }
      } catch (error) {
        console.error('❌ Failed to initialize hand detection on mount:', error);
      }
    };

    // Only initialize once
    if (!handState.isInitialized) {
      initializeOnMount();
    }
  }, [initializeHand, handLoading, handState.isTracking, handState.isInitialized]);

  /**
   * Update cube with hand gestures
   */
  useEffect(() => {
    if (handState.isTracking && updateCubeWithHand) {
      const is3DMode = currentTrackingMode === TRACKING_MODES.MODE_3D;
      updateCubeWithHand(handState, is3DMode);
    }
  }, [handState, updateCubeWithHand, currentTrackingMode]);



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
        className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        data-lenis-prevent // Prevent Lenis on main container to avoid conflicts with hand tracking
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
              handState={handState}
              isLoading={handLoading}
              error={handError}
              width={320}
              height={240}
              showHandOverlay={true}
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
          <div className="space-y-2">
            <ThreeDMotionToggle
              currentMode={currentTrackingMode}
              onModeSwitch={handleModeSwitch}
              onCalibrationStart={handleCalibrationStart}
              modeStatus={get3DModeStatus()}
            />

            {/* Interactive Calibration Button */}
            <motion.button
              onClick={handleInteractiveCalibration}
              disabled={!handState.isTracking}
              className={`w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                handState.isTracking
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              whileHover={handState.isTracking ? { scale: 1.02 } : {}}
              whileTap={handState.isTracking ? { scale: 0.98 } : {}}
            >
              🎯 Interactive Calibration
            </motion.button>
          </div>
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

        {/* Enhanced Hand Visualization */}
        {showEnhancedVisualization && (
          <EnhancedHandVisualization
            handState={handState}
            canvasRef={sceneCanvasRef}
            showConfidenceIndicators={true}
            showHandSkeleton={true}
            showGestureIndicator={true}
            showQualityMetrics={false}
            className="z-20"
          />
        )}

        {/* Confidence Indicator */}
        {showConfidenceIndicator && (
          <ConfidenceIndicator
            handState={handState}
            qualityMetrics={handState.qualityMetrics}
            adaptiveMapping={{
              isActive: true,
              isCalibrated: false,
              boundaryViolations: 0,
              latency: performance?.detectionLatency || 0
            }}
            position="top-right"
            minimized={confidenceIndicatorMinimized}
            onToggleMinimize={() => setConfidenceIndicatorMinimized(!confidenceIndicatorMinimized)}
            className="z-30"
          />
        )}

        {/* Interactive Calibration Guide */}
        <InteractiveCalibrationGuide
          isActive={isInteractiveCalibrating}
          handState={handState}
          onCalibrationPoint={handleCalibrationPoint}
          onComplete={handleInteractiveCalibrationComplete}
          onCancel={handleInteractiveCalibrationCancel}
          className="z-40"
        />

        {/* Mobile UI */}
        <MobileUI
          handState={handState}
          onTouchGesture={handleTouchGesture}
          onCalibration={handleInteractiveCalibration}
          onSettings={handleMobileSettings}
          isMobile={isMobile}
          orientation={deviceOrientation}
          className="z-50"
        />

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
