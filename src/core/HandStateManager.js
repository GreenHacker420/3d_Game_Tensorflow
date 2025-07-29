import { GESTURE_TYPES } from './GestureClassifier.js';
import AdaptiveCanvasMapper from './AdaptiveCanvasMapper.js';
import PredictiveTracker from './PredictiveTracker.js';
import { getMemoryPoolManager } from './MemoryPoolManager.js';

/**
 * Manages hand state and provides smooth hand tracking data
 */
export class HandStateManager {
  constructor() {
    this.currentState = this.getInitialState();
    this.previousState = this.getInitialState();
    this.smoothingFactor = 0.7;
    this.confidenceThreshold = 0.6;
    this.onStateChange = null;

    // Adaptive canvas mapper for dynamic coordinate transformation
    this.adaptiveMapper = new AdaptiveCanvasMapper();
    this.isMapperInitialized = false;

    // Predictive tracker for smooth tracking and predictions
    this.predictiveTracker = new PredictiveTracker({
      enablePrediction: true,
      predictionTimeAhead: 0.1,
      adaptiveSmoothing: true,
      confidenceThreshold: 0.3
    });

    // Enhanced state tracking
    this.stateHistory = [];
    this.maxHistorySize = 10;
    this.qualityMetrics = {
      stability: 1.0,
      accuracy: 1.0,
      responsiveness: 1.0
    };

    // Video and scene element references for adaptive mapping
    this.videoElement = null;
    this.sceneElement = null;

    // Memory pool manager for performance optimization
    this.memoryPool = getMemoryPoolManager();
  }

  /**
   * Get initial hand state
   * @returns {Object} Initial state
   */
  getInitialState() {
    return {
      isTracking: false,
      gesture: GESTURE_TYPES.NO_HAND,
      confidence: 0,
      position: { x: 0, y: 0 },
      fingerSpread: 0,
      isPinched: false,
      pinchDistance: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Update hand state with new detection data
   * @param {Array} landmarks - Hand landmarks
   * @param {Object} gestureResult - Gesture classification result
   * @param {Object} handCenter - Hand center position
   * @param {number} fingerSpread - Finger spread distance
   * @param {Object} pinchData - Pinch detection data
   * @param {Object} handOrientation - Hand orientation data (optional)
   */
  updateState(landmarks, gestureResult, handCenter, fingerSpread, pinchData, handOrientation = null) {
    this.previousState = { ...this.currentState };

    // Create basic hand state for predictive tracker using memory pool
    let basicHandState;
    if (!landmarks || !gestureResult) {
      basicHandState = this.memoryPool.get('HandState', (obj) => {
        Object.assign(obj, this.getInitialState());
        obj.timestamp = Date.now();
      });
    } else {
      basicHandState = this.memoryPool.get('HandState', (obj) => {
        obj.isTracking = true;
        obj.gesture = gestureResult.gesture;
        obj.confidence = gestureResult.confidence;
        obj.position = handCenter;
        obj.fingerSpread = fingerSpread;
        obj.isPinched = pinchData.isPinched;
        obj.pinchDistance = pinchData.distance;
        obj.orientation = handOrientation;
        obj.landmarks = landmarks;
        obj.timestamp = Date.now();
      });
    }

    // Enhance with predictive tracking
    const enhancedState = this.predictiveTracker.update(basicHandState);

    // Apply traditional smoothing to finger spread and orientation
    const smoothedSpread = landmarks && gestureResult ? this.smoothValue(
      fingerSpread,
      this.previousState.fingerSpread
    ) : fingerSpread;

    const smoothedOrientation = handOrientation && landmarks && gestureResult ?
      this.smoothOrientation(handOrientation) : handOrientation;

    // Update current state with enhanced data
    this.currentState = {
      ...enhancedState,
      // Keep original data for compatibility
      fingerSpread: smoothedSpread,
      isPinched: pinchData?.isPinched || false,
      pinchDistance: pinchData?.distance || 0,
      orientation: smoothedOrientation,
      landmarks: landmarks,
      timestamp: Date.now(),

      // Add enhanced tracking data
      smoothedPosition: enhancedState.smoothedPosition,
      predictedPosition: enhancedState.predictedPosition,
      velocity: enhancedState.velocity,
      predictions: enhancedState.predictions,
      trackingMetrics: enhancedState.trackingMetrics
    };

    // Update quality metrics with enhanced data
    if (enhancedState.qualityMetrics) {
      this.qualityMetrics = {
        stability: enhancedState.qualityMetrics.smoothness,
        accuracy: enhancedState.qualityMetrics.overall,
        responsiveness: enhancedState.qualityMetrics.responsiveness
      };
    }

    // Release the pooled basic hand state object
    this.memoryPool.release(basicHandState);

    // Notify state change
    this.notifyStateChange();
  }

  /**
   * Apply position smoothing to reduce jitter
   * @param {Object} newPosition - New position {x, y}
   * @returns {Object} Smoothed position
   */
  smoothPosition(newPosition) {
    if (!this.previousState.isTracking) {
      return newPosition;
    }

    return {
      x: this.smoothValue(newPosition.x, this.previousState.position.x),
      y: this.smoothValue(newPosition.y, this.previousState.position.y)
    };
  }

  /**
   * Apply smoothing to a single value
   * @param {number} newValue - New value
   * @param {number} oldValue - Previous value
   * @returns {number} Smoothed value
   */
  smoothValue(newValue, oldValue) {
    return oldValue + (newValue - oldValue) * this.smoothingFactor;
  }

  /**
   * Apply smoothing to hand orientation
   * @param {Object} newOrientation - New orientation {pitch, yaw, roll}
   * @returns {Object} Smoothed orientation
   */
  smoothOrientation(newOrientation) {
    if (!this.previousState.orientation) {
      return newOrientation;
    }

    const prev = this.previousState.orientation;
    return {
      pitch: prev.pitch + (newOrientation.pitch - prev.pitch) * this.smoothingFactor,
      yaw: prev.yaw + (newOrientation.yaw - prev.yaw) * this.smoothingFactor,
      roll: prev.roll + (newOrientation.roll - prev.roll) * this.smoothingFactor
    };
  }

  /**
   * Get current hand state
   * @returns {Object} Current state
   */
  getCurrentState() {
    return { ...this.currentState };
  }

  /**
   * Check if gesture is stable (held for minimum duration)
   * @param {number} minDuration - Minimum duration in ms
   * @returns {boolean} True if gesture is stable
   */
  isGestureStable(minDuration = 500) {
    if (!this.currentState.isTracking) {
      return false;
    }

    const now = Date.now();
    const gestureDuration = now - this.currentState.timestamp;
    
    return gestureDuration >= minDuration && 
           this.currentState.confidence >= this.confidenceThreshold;
  }

  /**
   * Get gesture duration in milliseconds
   * @returns {number} Duration
   */
  getGestureDuration() {
    if (!this.currentState.isTracking) {
      return 0;
    }

    return Date.now() - this.currentState.timestamp;
  }

  /**
   * Check if hand position has changed significantly
   * @param {number} threshold - Movement threshold
   * @returns {boolean} True if hand moved
   */
  hasHandMoved(threshold = 10) {
    if (!this.previousState.isTracking || !this.currentState.isTracking) {
      return false;
    }

    const dx = this.currentState.position.x - this.previousState.position.x;
    const dy = this.currentState.position.y - this.previousState.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance > threshold;
  }

  /**
   * Initialize adaptive mapper with video and scene elements
   * @param {HTMLVideoElement} videoElement - Webcam video element
   * @param {HTMLCanvasElement} sceneElement - 3D scene canvas element
   * @returns {Promise<boolean>} Success status
   */
  async initializeAdaptiveMapper(videoElement, sceneElement) {
    this.videoElement = videoElement;
    this.sceneElement = sceneElement;

    try {
      const success = await this.adaptiveMapper.initialize(videoElement, sceneElement);
      this.isMapperInitialized = success;

      if (success) {
        console.log('✅ HandStateManager: Adaptive mapper initialized');
      } else {
        console.warn('⚠️ HandStateManager: Adaptive mapper initialization failed');
      }

      return success;
    } catch (error) {
      console.error('❌ HandStateManager: Failed to initialize adaptive mapper:', error);
      this.isMapperInitialized = false;
      return false;
    }
  }

  /**
   * Map hand position to 3D scene coordinates using adaptive mapping
   * @param {number} sceneWidth - Scene width (fallback)
   * @param {number} sceneHeight - Scene height (fallback)
   * @param {number} videoWidth - Video width (fallback)
   * @param {number} videoHeight - Video height (fallback)
   * @returns {Object} Mapped 3D position {x, y, z}
   */
  mapTo3DCoordinates(sceneWidth = 100, sceneHeight = 80, videoWidth = 640, videoHeight = 480) {
    if (!this.currentState.isTracking) {
      return { x: 0, y: 0, z: 0 };
    }

    // Use adaptive mapper if available
    if (this.isMapperInitialized && this.adaptiveMapper) {
      try {
        const mappingResult = this.adaptiveMapper.mapCoordinates(
          this.currentState.position,
          this.currentState.confidence
        );

        if (mappingResult.isValid) {
          // Update quality metrics
          this.updateQualityMetrics(mappingResult);

          return {
            x: mappingResult.position.x,
            y: mappingResult.position.y,
            z: mappingResult.position.z
          };
        }
      } catch (error) {
        console.warn('⚠️ Adaptive mapping failed, falling back to legacy mapping:', error);
      }
    }

    // Fallback to legacy mapping
    return this.mapTo3DCoordinatesLegacy(sceneWidth, sceneHeight, videoWidth, videoHeight);
  }

  /**
   * Legacy coordinate mapping (fallback)
   * @param {number} sceneWidth - Scene width
   * @param {number} sceneHeight - Scene height
   * @param {number} videoWidth - Video width
   * @param {number} videoHeight - Video height
   * @returns {Object} Mapped 3D position {x, y, z}
   */
  mapTo3DCoordinatesLegacy(sceneWidth, sceneHeight, videoWidth, videoHeight) {
    // Map webcam coordinates to scene coordinates
    const mappedX = ((this.currentState.position.x / videoWidth) * sceneWidth) - (sceneWidth / 2);
    const mappedY = ((1 - this.currentState.position.y / videoHeight) * sceneHeight) - (sceneHeight / 2);

    // Z coordinate based on finger spread (for depth simulation)
    const mappedZ = (this.currentState.fingerSpread / 200) * 20 - 10;

    return {
      x: mappedX,
      y: mappedY,
      z: mappedZ
    };
  }

  /**
   * Update quality metrics based on mapping results
   * @param {Object} mappingResult - Result from adaptive mapper
   */
  updateQualityMetrics(mappingResult) {
    const alpha = 0.1; // Smoothing factor for metrics

    // Update stability based on mapping quality
    this.qualityMetrics.stability = this.qualityMetrics.stability * (1 - alpha) +
                                   mappingResult.quality * alpha;

    // Update accuracy based on confidence
    this.qualityMetrics.accuracy = this.qualityMetrics.accuracy * (1 - alpha) +
                                  this.currentState.confidence * alpha;

    // Update responsiveness based on latency
    if (mappingResult.metadata && mappingResult.metadata.latency) {
      const responsivenessScore = Math.max(0, 1 - mappingResult.metadata.latency / 50); // 50ms target
      this.qualityMetrics.responsiveness = this.qualityMetrics.responsiveness * (1 - alpha) +
                                          responsivenessScore * alpha;
    }
  }

  /**
   * Get current quality metrics with enhanced tracking data
   * @returns {Object} Quality metrics
   */
  getQualityMetrics() {
    const baseMetrics = {
      ...this.qualityMetrics,
      isAdaptiveMapping: this.isMapperInitialized,
      overallQuality: (this.qualityMetrics.stability +
                      this.qualityMetrics.accuracy +
                      this.qualityMetrics.responsiveness) / 3
    };

    // Add predictive tracking metrics if available
    if (this.currentState.trackingMetrics) {
      return {
        ...baseMetrics,
        predictiveTracking: {
          isActive: this.currentState.trackingMetrics.isTracking,
          smoothness: this.currentState.qualityMetrics?.smoothness || baseMetrics.stability,
          predictionAccuracy: this.currentState.qualityMetrics?.predictionAccuracy || 1.0,
          latency: this.currentState.trackingMetrics.latency || 0,
          frameCount: this.currentState.trackingMetrics.frameCount || 0
        },
        kalmanFilter: {
          position: this.currentState.trackingMetrics.positionFilterMetrics || {},
          gesture: this.currentState.trackingMetrics.gestureFilterMetrics || {}
        }
      };
    }

    return baseMetrics;
  }

  /**
   * Update scene dimensions for responsive design
   * @param {HTMLCanvasElement} sceneElement - Updated scene element
   */
  updateSceneDimensions(sceneElement) {
    if (this.isMapperInitialized && this.adaptiveMapper) {
      this.sceneElement = sceneElement;
      this.adaptiveMapper.updateSceneDimensions(sceneElement);
    }
  }

  /**
   * Start calibration for 3D mapping
   * @param {Object} options - Calibration options
   * @returns {Object} Calibration session info
   */
  startCalibration(options = {}) {
    if (this.isMapperInitialized && this.adaptiveMapper) {
      return this.adaptiveMapper.startCalibration(options);
    }

    console.warn('⚠️ Cannot start calibration: Adaptive mapper not initialized');
    return { isActive: false, error: 'Adaptive mapper not initialized' };
  }

  /**
   * Add calibration point
   * @param {string} pointType - Type of calibration point
   * @returns {Object} Calibration progress
   */
  addCalibrationPoint(pointType) {
    if (this.isMapperInitialized && this.adaptiveMapper && this.currentState.isTracking) {
      return this.adaptiveMapper.addCalibrationPoint(this.currentState.position, pointType);
    }

    console.warn('⚠️ Cannot add calibration point: Mapper not initialized or hand not tracked');
    return { isComplete: false, error: 'Cannot add calibration point' };
  }

  /**
   * Reset calibration
   */
  resetCalibration() {
    if (this.isMapperInitialized && this.adaptiveMapper) {
      this.adaptiveMapper.resetCalibration();
    }
  }

  /**
   * Set state change callback
   * @param {Function} callback - Callback function
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Notify state change
   */
  notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.currentState);
    }
  }

  /**
   * Reset hand state
   */
  reset() {
    this.currentState = this.getInitialState();
    this.previousState = this.getInitialState();
  }

  /**
   * Set smoothing factor
   * @param {number} factor - Smoothing factor (0-1)
   */
  setSmoothingFactor(factor) {
    this.smoothingFactor = Math.max(0, Math.min(1, factor));
  }

  /**
   * Set confidence threshold
   * @param {number} threshold - Confidence threshold (0-1)
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }
}

export default HandStateManager;
