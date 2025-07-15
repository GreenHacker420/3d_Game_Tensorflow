import { useRef, useEffect, useState, useCallback } from 'react';
import HandDetectionEngine from '../core/HandDetectionEngine.js';
import GestureClassifier from '../core/GestureClassifier.js';
import HandStateManager from '../core/HandStateManager.js';
import PerformanceMonitor from '../utils/PerformanceMonitor.js';
import { ThreeDMotionModeManager } from '../core/3DMotionModeManager.js';

/**
 * React hook for hand detection and gesture recognition
 */
export const useHandDetection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [handState, setHandState] = useState({
    isTracking: false,
    gesture: 'no_hand',
    confidence: 0,
    position: { x: 0, y: 0 },
    fingerSpread: 0,
    isPinched: false
  });
  const [performance, setPerformance] = useState({
    fps: 0,
    latency: 0,
    frameCount: 0
  });

  // Refs for detection components
  const detectionEngineRef = useRef(null);
  const gestureClassifierRef = useRef(null);
  const handStateManagerRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const motionModeManagerRef = useRef(null);
  const detectionLoopRef = useRef(null);
  const isDetectingRef = useRef(false);

  /**
   * Initialize hand detection system
   */
  const initialize = useCallback(async () => {
    if (isInitialized || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize detection engine
      detectionEngineRef.current = new HandDetectionEngine();
      detectionEngineRef.current.setStateChangeCallback(({ isLoading: engineLoading }) => {
        setIsLoading(engineLoading);
      });
      detectionEngineRef.current.setErrorCallback(setError);

      // Initialize gesture classifier
      gestureClassifierRef.current = new GestureClassifier();

      // Initialize hand state manager
      handStateManagerRef.current = new HandStateManager();
      handStateManagerRef.current.setStateChangeCallback(setHandState);

      // Initialize performance monitor
      performanceMonitorRef.current = new PerformanceMonitor();
      performanceMonitorRef.current.setMetricsUpdateCallback(setPerformance);

      // Initialize 3D Motion Mode Manager
      motionModeManagerRef.current = new ThreeDMotionModeManager();
      await motionModeManagerRef.current.initialize();

      // Load the hand detection model
      await detectionEngineRef.current.initialize();

      // Start performance monitoring
      performanceMonitorRef.current.start();

      setIsInitialized(true);
      console.log('✅ Hand detection system initialized');

    } catch (err) {
      setError(err.message);
      console.error('❌ Failed to initialize hand detection:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  /**
   * Start detection loop
   */
  const startDetection = useCallback((videoElement) => {
    if (!isInitialized) {
      console.warn('❌ Cannot start detection: Hand detection not initialized');
      return;
    }

    if (isDetectingRef.current) {
      console.warn('⚠️ Detection already running');
      return;
    }

    if (!videoElement) {
      console.warn('❌ Cannot start detection: No video element provided');
      return;
    }

    console.log('🎯 Starting hand detection with video element:', videoElement);
    isDetectingRef.current = true;

    const detectLoop = async () => {
      if (!isDetectingRef.current) {
        return;
      }

      // Check if detection engine is initialized
      if (!detectionEngineRef.current || !detectionEngineRef.current.isInitialized) {
        // Wait a bit and try again
        setTimeout(detectLoop, 100);
        return;
      }

      try {
        const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        // Detect hands
        const predictions = await detectionEngineRef.current.detectHands(videoElement);
        const landmarks = detectionEngineRef.current.extractLandmarks(predictions);

        if (landmarks) {
          // Classify gesture
          const gestureResult = gestureClassifierRef.current.classifyGesture(landmarks);

          // Calculate hand data
          const handCenter = detectionEngineRef.current.calculateHandCenter(landmarks);
          const fingerSpread = detectionEngineRef.current.calculateFingerSpread(landmarks);
          const pinchData = detectionEngineRef.current.detectPinch(landmarks);
          const handOrientation = detectionEngineRef.current.calculateHandOrientation(landmarks);

          // Update hand state
          handStateManagerRef.current.updateState(
            landmarks,
            gestureResult,
            handCenter,
            fingerSpread,
            pinchData,
            handOrientation
          );
        } else {
          // No hand detected
          handStateManagerRef.current.updateState(null, null, null, 0, { isPinched: false, distance: 0 });
        }

        // Record performance
        const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const latency = endTime - startTime;
        
        performanceMonitorRef.current.recordFrame();
        performanceMonitorRef.current.recordLatency(latency);

      } catch (err) {
        console.warn('Detection loop error:', err);
      }

      // Continue loop
      detectionLoopRef.current = requestAnimationFrame(detectLoop);
    };

    detectLoop();
    console.log('🎯 Hand detection started');
  }, [isInitialized]);

  /**
   * Stop detection loop
   */
  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    
    if (detectionLoopRef.current) {
      cancelAnimationFrame(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }

    console.log('⏹️ Hand detection stopped');
  }, []);

  /**
   * Get current hand state
   */
  const getCurrentHandState = useCallback(() => {
    return handStateManagerRef.current?.getCurrentState() || handState;
  }, [handState]);

  /**
   * Map hand position to 3D coordinates
   */
  const mapTo3DCoordinates = useCallback((sceneWidth, sceneHeight) => {
    return handStateManagerRef.current?.mapTo3DCoordinates(sceneWidth, sceneHeight) || { x: 0, y: 0, z: 0 };
  }, []);

  /**
   * Reset detection system
   */
  const reset = useCallback(() => {
    gestureClassifierRef.current?.reset();
    handStateManagerRef.current?.reset();
    performanceMonitorRef.current?.reset();
  }, []);

  /**
   * Switch tracking mode (2D or 3D)
   */
  const switchTrackingMode = useCallback((mode) => {
    return motionModeManagerRef.current?.switchMode(mode) || false;
  }, []);

  /**
   * Start 3D calibration
   */
  const startCalibration = useCallback((onProgress, onComplete) => {
    return motionModeManagerRef.current?.startCalibration(onProgress, onComplete);
  }, []);

  /**
   * Get 3D motion mode status
   */
  const get3DModeStatus = useCallback(() => {
    return motionModeManagerRef.current?.getModeStatus() || null;
  }, []);

  /**
   * Reset 3D calibration
   */
  const resetCalibration = useCallback(() => {
    motionModeManagerRef.current?.resetCalibration();
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopDetection();
      
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.stop();
      }
      
      if (detectionEngineRef.current) {
        detectionEngineRef.current.dispose();
      }
    };
  }, [stopDetection]);

  return {
    // State
    isLoading,
    isInitialized,
    error,
    handState,
    performance,

    // Methods
    initialize,
    startDetection,
    stopDetection,
    getCurrentHandState,
    mapTo3DCoordinates,
    reset,

    // 3D Motion Mode
    switchTrackingMode,
    startCalibration,
    get3DModeStatus,
    resetCalibration,

    // Status
    isDetecting: isDetectingRef.current
  };
};

export default useHandDetection;
