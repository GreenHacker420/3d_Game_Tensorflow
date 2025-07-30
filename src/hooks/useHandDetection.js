import { useRef, useEffect, useState, useCallback } from 'react';
import HandDetectionEngine from '../core/HandDetectionEngine.js';
import GestureClassifier from '../core/GestureClassifier.js';
import HandStateManager from '../core/HandStateManager.js';
import PerformanceMonitor from '../utils/PerformanceMonitor.js';
import { GestureSequenceDetector } from '../utils/GestureSequence.js';
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
  const [activeCombo, setActiveCombo] = useState(null);
  const [comboProgress, setComboProgress] = useState([]);

  // Refs for detection components
  const detectionEngineRef = useRef(null);
  const gestureClassifierRef = useRef(null);
  const handStateManagerRef = useRef(null);
  const performanceMonitorRef = useRef(null);
  const motionModeManagerRef = useRef(null);
  const gestureSequenceDetectorRef = useRef(null);
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
      handStateManagerRef.current.setStateChangeCallback((newState) => {
        setHandState(newState);

        // Add gesture to sequence detector if gesture changed and is valid
        if (gestureSequenceDetectorRef.current &&
            newState.gesture !== 'no_hand' &&
            newState.confidence > 0.7) {
          const combo = gestureSequenceDetectorRef.current.addGesture(newState.gesture, newState.confidence);
          if (combo) {
            setComboProgress(gestureSequenceDetectorRef.current.gestureHistory);
          }
        }
      });

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

      // Initialize gesture sequence detector
      gestureSequenceDetectorRef.current = new GestureSequenceDetector(3000);
      gestureSequenceDetectorRef.current.onComboDetected = (combo) => {
        setActiveCombo(combo);
        console.log('🎯 Combo detected:', combo.name);
      };
      gestureSequenceDetectorRef.current.onComboCompleted = (combo, sequence) => {
        console.log('🎉 Combo completed:', combo.name);
        setActiveCombo(null);
        setComboProgress([]);
      };
      gestureSequenceDetectorRef.current.onComboFailed = () => {
        setActiveCombo(null);
        setComboProgress([]);
      };
      console.log('✅ Gesture Sequence Detector initialized');

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
      console.log('🔄 Waiting for initialization to complete...');

      // Wait for initialization and retry
      const retryInterval = setInterval(() => {
        if (isInitialized) {
          clearInterval(retryInterval);
          console.log('✅ Hand detection now initialized, starting detection...');
          startDetection(videoElement);
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite waiting
      setTimeout(() => clearInterval(retryInterval), 10000);
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

        // Use adaptive detection for better performance and accuracy
        const predictions = await detectionEngineRef.current.detectHandsAdaptive(videoElement);
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
   * Initialize adaptive mapper with video and scene elements
   * @param {HTMLVideoElement} videoElement - Webcam video element
   * @param {HTMLCanvasElement} sceneElement - 3D scene canvas element
   */
  const initializeAdaptiveMapper = useCallback(async (videoElement, sceneElement) => {
    if (handStateManagerRef.current && handStateManagerRef.current.initializeAdaptiveMapper) {
      try {
        const success = await handStateManagerRef.current.initializeAdaptiveMapper(videoElement, sceneElement);
        console.log(success ? '✅ Adaptive mapper initialized' : '⚠️ Adaptive mapper initialization failed');
        return success;
      } catch (error) {
        console.error('❌ Failed to initialize adaptive mapper:', error);
        return false;
      }
    }
    return false;
  }, []);

  /**
   * Start 3D calibration with adaptive mapping support
   */
  const startCalibration = useCallback((onProgress, onComplete) => {
    // Try adaptive mapper calibration first
    if (handStateManagerRef.current && handStateManagerRef.current.startCalibration) {
      const adaptiveResult = handStateManagerRef.current.startCalibration();
      if (adaptiveResult.isActive) {
        console.log('🎯 Starting adaptive calibration');
        return adaptiveResult;
      }
    }

    // Fallback to motion mode manager
    console.log('🎯 Starting legacy 3D calibration');
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
    activeCombo,
    comboProgress,

    // Methods
    initialize,
    startDetection,
    stopDetection,
    getCurrentHandState,
    mapTo3DCoordinates,
    reset,

    // Adaptive Mapping
    initializeAdaptiveMapper,

    // 3D Motion Mode
    switchTrackingMode,
    startCalibration,
    get3DModeStatus,
    resetCalibration,

    // Status
    isDetecting: isDetectingRef.current,

    // Components (for advanced usage)
    gestureSequenceDetector: gestureSequenceDetectorRef.current
  };
};

export default useHandDetection;
