import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

/**
 * Core hand detection engine using MediaPipe/TensorFlow
 * Handles model loading, hand tracking, and landmark detection
 */
export class HandDetectionEngine {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.isLoading = false;
    this.onStateChange = null;
    this.onError = null;
  }

  /**
   * Initialize the hand detection model
   */
  async initialize() {
    if (this.isInitialized || this.isLoading) {
      return this.model;
    }

    this.isLoading = true;
    this.notifyStateChange({ isLoading: true });

    try {
      // Configure TensorFlow.js for optimal performance
      await tf.ready();
      
      // Load the handpose model (using default parameters as custom parameters may not be supported)
      this.model = await handpose.load();

      // Initialize adaptive parameters
      this.adaptiveParams = {
        baseConfidence: 0.7,
        lightingBoost: 0.0,
        stabilityFilter: 0.8,
        frameHistory: [],
        maxHistorySize: 10
      };

      this.isInitialized = true;
      this.isLoading = false;
      
      this.notifyStateChange({ 
        isLoading: false, 
        isInitialized: true 
      });

      console.log('✅ Hand detection model loaded successfully');
      return this.model;

    } catch (error) {
      this.isLoading = false;
      this.isInitialized = false;
      
      const errorMessage = `Failed to load hand detection model: ${error.message}`;
      console.error('❌', errorMessage);
      
      this.notifyError(errorMessage);
      throw error;
    }
  }

  /**
   * Detect hands in video element with adaptive parameters
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of hand predictions
   */
  async detectHands(videoElement) {
    if (!this.isInitialized || !this.model) {
      throw new Error('Hand detection model not initialized');
    }

    if (!videoElement || videoElement.readyState !== 4) {
      return [];
    }

    try {
      // Analyze lighting conditions for adaptive detection
      const lightingCondition = this.analyzeLightingConditions(videoElement);

      // Adjust detection parameters based on lighting
      this.adaptDetectionParameters(lightingCondition);

      const predictions = await this.model.estimateHands(videoElement);

      // Apply stability filtering to predictions
      return this.applyStabilityFilter(predictions);
    } catch (error) {
      console.warn('Hand detection error:', error);
      return [];
    }
  }

  /**
   * Extract landmarks from hand predictions
   * @param {Array} predictions - Hand predictions from model
   * @returns {Array|null} Hand landmarks or null if no hand detected
   */
  extractLandmarks(predictions) {
    if (!predictions || predictions.length === 0) {
      return null;
    }

    // Use the first detected hand
    const hand = predictions[0];
    return hand.landmarks;
  }

  /**
   * Calculate hand center position from landmarks
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Center position {x, y, z}
   */
  calculateHandCenter(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    // Use wrist (landmark 0) as reference point
    const wrist = landmarks[0];

    // Calculate estimated depth using palm size
    const depth = this.estimateHandDepth(landmarks);

    return {
      x: wrist[0],
      y: wrist[1],
      z: depth
    };
  }

  /**
   * Estimate hand depth using palm size and landmark distances
   * @param {Array} landmarks - Hand landmarks
   * @returns {number} Estimated depth in normalized units
   */
  estimateHandDepth(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return 0;
    }

    // Calculate palm size using key landmarks
    const wrist = landmarks[0];           // Wrist
    const thumbBase = landmarks[1];       // Thumb base
    const middleBase = landmarks[9];      // Middle finger base
    const pinkyBase = landmarks[17];      // Pinky base

    // Calculate palm width (distance between thumb base and pinky base)
    const palmWidth = Math.sqrt(
      Math.pow(thumbBase[0] - pinkyBase[0], 2) +
      Math.pow(thumbBase[1] - pinkyBase[1], 2)
    );

    // Calculate palm height (distance from wrist to middle finger base)
    const palmHeight = Math.sqrt(
      Math.pow(wrist[0] - middleBase[0], 2) +
      Math.pow(wrist[1] - middleBase[1], 2)
    );

    // Average palm size
    const palmSize = (palmWidth + palmHeight) / 2;

    // Normalize depth based on palm size (larger palm = closer to camera)
    // Typical palm size ranges from 40-120 pixels depending on distance
    const normalizedDepth = Math.max(0, Math.min(1, (palmSize - 40) / 80));

    return normalizedDepth;
  }

  /**
   * Calculate hand orientation from landmarks
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Hand orientation {pitch, yaw, roll}
   */
  calculateHandOrientation(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }

    const wrist = landmarks[0];
    const middleBase = landmarks[9];
    const indexTip = landmarks[8];
    const pinkyBase = landmarks[17];

    // Calculate hand direction vector (wrist to middle finger base)
    const handDirection = {
      x: middleBase[0] - wrist[0],
      y: middleBase[1] - wrist[1]
    };

    // Calculate hand width vector (pinky to index)
    const handWidth = {
      x: indexTip[0] - pinkyBase[0],
      y: indexTip[1] - pinkyBase[1]
    };

    // Calculate angles
    const yaw = Math.atan2(handDirection.x, handDirection.y);
    const roll = Math.atan2(handWidth.y, handWidth.x);

    // Pitch is harder to calculate from 2D landmarks, use palm size as approximation
    const pitch = (this.estimateHandDepth(landmarks) - 0.5) * Math.PI / 4;

    return {
      pitch: pitch,
      yaw: yaw,
      roll: roll
    };
  }

  /**
   * Calculate finger spread distance
   * @param {Array} landmarks - Hand landmarks
   * @returns {number} Finger spread distance
   */
  calculateFingerSpread(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return 0;
    }

    // Calculate distance between thumb tip and pinky tip
    const thumbTip = landmarks[4];
    const pinkyTip = landmarks[20];
    
    const dx = thumbTip[0] - pinkyTip[0];
    const dy = thumbTip[1] - pinkyTip[1];
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if hand is making a pinch gesture
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Pinch state {isPinched, distance, confidence}
   */
  detectPinch(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { isPinched: false, distance: 0, confidence: 0 };
    }

    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    const dx = thumbTip[0] - indexTip[0];
    const dy = thumbTip[1] - indexTip[1];
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const pinchThreshold = 30;
    const isPinched = distance < pinchThreshold;
    const confidence = Math.max(0, 1 - (distance / 100));
    
    return { isPinched, distance, confidence };
  }

  /**
   * Set state change callback
   * @param {Function} callback - Callback function
   */
  setStateChangeCallback(callback) {
    this.onStateChange = callback;
  }

  /**
   * Set error callback
   * @param {Function} callback - Error callback function
   */
  setErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Notify state change
   * @param {Object} state - New state
   */
  notifyStateChange(state) {
    if (this.onStateChange) {
      this.onStateChange(state);
    }
  }

  /**
   * Notify error
   * @param {string} error - Error message
   */
  notifyError(error) {
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Analyze lighting conditions from video element
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Object} Lighting analysis result
   */
  analyzeLightingConditions(videoElement) {
    try {
      // Create a temporary canvas to analyze the video frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 100; // Small sample size for performance
      canvas.height = 75;

      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate average brightness
      let totalBrightness = 0;
      let pixelCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate luminance using standard formula
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        totalBrightness += brightness;
        pixelCount++;
      }

      const avgBrightness = totalBrightness / pixelCount;

      // Categorize lighting condition
      let condition = 'normal';
      if (avgBrightness < 80) {
        condition = 'low';
      } else if (avgBrightness > 180) {
        condition = 'high';
      }

      return {
        brightness: avgBrightness,
        condition: condition,
        quality: Math.min(1, avgBrightness / 128) // Normalized quality score
      };
    } catch (error) {
      console.warn('Failed to analyze lighting conditions:', error);
      return {
        brightness: 128,
        condition: 'normal',
        quality: 1
      };
    }
  }

  /**
   * Adapt detection parameters based on lighting conditions
   * @param {Object} lightingCondition - Lighting analysis result
   */
  adaptDetectionParameters(lightingCondition) {
    if (!this.adaptiveParams) return;

    const { condition, quality } = lightingCondition;

    // Adjust confidence thresholds based on lighting
    switch (condition) {
      case 'low':
        this.adaptiveParams.lightingBoost = -0.1; // Lower threshold for low light
        break;
      case 'high':
        this.adaptiveParams.lightingBoost = 0.05; // Slightly higher threshold for bright light
        break;
      default:
        this.adaptiveParams.lightingBoost = 0.0;
    }

    // Update stability filter based on lighting quality
    this.adaptiveParams.stabilityFilter = Math.max(0.5, quality * 0.8);
  }

  /**
   * Apply stability filtering to predictions
   * @param {Array} predictions - Raw predictions from model
   * @returns {Array} Filtered predictions
   */
  applyStabilityFilter(predictions) {
    if (!this.adaptiveParams || !this.adaptiveParams.frameHistory) {
      return predictions;
    }

    // Add current predictions to history
    this.adaptiveParams.frameHistory.push(predictions);

    // Keep only recent history
    if (this.adaptiveParams.frameHistory.length > this.adaptiveParams.maxHistorySize) {
      this.adaptiveParams.frameHistory.shift();
    }

    // If we don't have enough history, return current predictions
    if (this.adaptiveParams.frameHistory.length < 3) {
      return predictions;
    }

    // Apply temporal smoothing
    if (predictions.length === 0) {
      // No current detection - check if we had consistent detections recently
      const recentDetections = this.adaptiveParams.frameHistory.slice(-3);
      const hasConsistentDetections = recentDetections.every(p => p.length > 0);

      if (hasConsistentDetections) {
        // Return the most recent detection to maintain continuity
        return this.adaptiveParams.frameHistory[this.adaptiveParams.frameHistory.length - 2] || [];
      }
    } else {
      // We have a detection - apply confidence filtering
      const filteredPredictions = predictions.filter(prediction => {
        const adjustedThreshold = this.adaptiveParams.baseConfidence + this.adaptiveParams.lightingBoost;
        return prediction.handInViewConfidence >= adjustedThreshold;
      });

      return filteredPredictions;
    }

    return predictions;
  }

  /**
   * Dispose resources
   */
  dispose() {
    // TensorFlow.js handpose model doesn't have a dispose method
    // Just clear the reference
    this.model = null;

    this.isInitialized = false;
    this.isLoading = false;
    this.onStateChange = null;
    this.onError = null;

    // Clear adaptive parameters
    if (this.adaptiveParams) {
      this.adaptiveParams.frameHistory = [];
      this.adaptiveParams = null;
    }
  }
}

export default HandDetectionEngine;
