import { GESTURE_TYPES } from './GestureClassifier.js';

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

    if (!landmarks || !gestureResult) {
      this.currentState = {
        ...this.getInitialState(),
        timestamp: Date.now()
      };
    } else {
      // Apply smoothing to position
      const smoothedPosition = this.smoothPosition(handCenter);

      // Apply smoothing to finger spread
      const smoothedSpread = this.smoothValue(
        fingerSpread,
        this.previousState.fingerSpread
      );

      // Apply smoothing to orientation if provided
      const smoothedOrientation = handOrientation ?
        this.smoothOrientation(handOrientation) : null;

      this.currentState = {
        isTracking: true,
        gesture: gestureResult.gesture,
        confidence: gestureResult.confidence,
        position: smoothedPosition,
        fingerSpread: smoothedSpread,
        isPinched: pinchData.isPinched,
        pinchDistance: pinchData.distance,
        orientation: smoothedOrientation,
        landmarks: landmarks, // Store landmarks for 3D processing
        timestamp: Date.now()
      };
    }

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
   * Map hand position to 3D scene coordinates
   * @param {number} sceneWidth - Scene width
   * @param {number} sceneHeight - Scene height
   * @param {number} videoWidth - Video width (default 640)
   * @param {number} videoHeight - Video height (default 480)
   * @returns {Object} Mapped 3D position {x, y, z}
   */
  mapTo3DCoordinates(sceneWidth = 100, sceneHeight = 80, videoWidth = 640, videoHeight = 480) {
    if (!this.currentState.isTracking) {
      return { x: 0, y: 0, z: 0 };
    }

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
