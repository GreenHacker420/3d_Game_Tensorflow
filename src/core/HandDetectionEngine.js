import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { getMemoryPoolManager } from './MemoryPoolManager.js';

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

    // Enhanced adaptive parameters
    this.adaptiveParams = {
      baseConfidence: 0.7,
      lightingBoost: 0.0,
      stabilityFilter: 0.8,
      frameHistory: [],
      maxHistorySize: 10,
      movementHistory: [],
      maxMovementHistory: 20
    };

    // Lighting analysis
    this.lightingAnalysis = {
      brightness: 0.5,
      contrast: 0.5,
      stability: 1.0,
      lastAnalysis: 0,
      analysisInterval: 1000 // Analyze every 1 second
    };

    // Movement tracking
    this.movementTracking = {
      speed: 0,
      acceleration: 0,
      direction: { x: 0, y: 0 },
      lastPosition: null,
      lastTimestamp: 0
    };

    // Performance optimization
    this.performanceOptimization = {
      adaptiveFrameRate: 30,
      targetFrameRate: 30,
      skipFrameCount: 0,
      maxSkipFrames: 2,
      lastProcessTime: 0
    };

    // WebWorker manager for offloading processing (only initialize once)
    this.webWorkerManager = null;
    this.useWebWorker = false; // Will be enabled after successful initialization

    // Memory pool manager for performance optimization
    this.memoryPool = getMemoryPoolManager();
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
      console.log('🔧 Configuring TensorFlow.js...');
      // Configure TensorFlow.js for optimal performance
      await tf.ready();
      console.log('✅ TensorFlow.js ready');

      console.log('📦 Loading handpose model...');
      // Load the handpose model (using default parameters as custom parameters may not be supported)
      this.model = await handpose.load();
      console.log('✅ Handpose model loaded');

      // Enhanced adaptive parameters are now initialized in constructor

      // Try to initialize WebWorker for better performance (only in development)
      if (import.meta.env.DEV) {
        try {
          const { default: WebWorkerManager } = await import('./WebWorkerManager.js');
          this.webWorkerManager = new WebWorkerManager({
            enableFallback: true,
            maxConcurrentFrames: 2
          });

          const workerInitialized = await this.webWorkerManager.initialize();
          if (workerInitialized) {
            this.useWebWorker = true;
            console.log('✅ WebWorker initialized for hand detection');
          } else {
            console.log('⚠️ WebWorker initialization failed, using main thread');
          }
        } catch (error) {
          console.warn('⚠️ WebWorker not available, using main thread:', error);
        }
      } else {
        console.log('🔧 Production build: Using main thread processing for stability');
      }

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
      const startTime = performance.now();

      // Check if we should skip this frame for performance
      if (this.shouldSkipFrame()) {
        return this.getLastValidPrediction();
      }

      // Analyze lighting conditions for adaptive detection
      const lightingCondition = this.analyzeLightingConditions(videoElement);

      // Calculate movement speed for adaptive processing
      const movementSpeed = this.calculateMovementSpeed();

      // Adjust detection parameters based on conditions
      this.adaptDetectionParameters(lightingCondition, movementSpeed);

      const predictions = await this.model.estimateHands(videoElement);

      // Apply enhanced stability filtering
      const filteredPredictions = this.applyEnhancedStabilityFilter(predictions);

      // Update movement tracking
      this.updateMovementTracking(filteredPredictions);

      // Record performance metrics
      this.updatePerformanceMetrics(startTime);

      return filteredPredictions;
    } catch (error) {
      console.warn('Hand detection error:', error);
      return this.getLastValidPrediction();
    }
  }

  /**
   * Enhanced hand detection with adaptive parameters and WebWorker support
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of hand predictions with enhanced processing
   */
  async detectHandsAdaptive(videoElement) {
    try {
      // Use WebWorker if available and enabled
      if (this.useWebWorker && this.webWorkerManager.isInitialized) {
        return await this.detectHandsWithWorker(videoElement);
      }

      // Fallback to main thread processing
      return await this.detectHandsMainThread(videoElement);
    } catch (error) {
      console.warn('Adaptive hand detection error:', error);
      return this.detectHands(videoElement); // Fallback to standard detection
    }
  }

  /**
   * Detect hands using WebWorker
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of hand predictions
   */
  async detectHandsWithWorker(videoElement) {
    try {
      const predictions = await this.webWorkerManager.processFrame(videoElement);

      // Convert worker format to expected format if needed
      return this.processWorkerPredictions(predictions);
    } catch (error) {
      console.warn('WebWorker detection failed, falling back to main thread:', error);
      this.useWebWorker = false; // Disable worker for this session
      return this.detectHandsMainThread(videoElement);
    }
  }

  /**
   * Detect hands on main thread with enhanced processing
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Promise<Array>} Array of hand predictions
   */
  async detectHandsMainThread(videoElement) {
    const startTime = performance.now();

    try {
      // Check if we should skip this frame for performance
      if (this.shouldSkipFrame()) {
        return this.getLastValidPrediction();
      }

      // Analyze lighting conditions for adaptive detection
      const lightingCondition = this.analyzeLightingConditions(videoElement);

      // Calculate movement speed for adaptive processing
      const movementSpeed = this.calculateMovementSpeed();

      // Adjust detection parameters based on conditions
      this.adaptDetectionParameters(lightingCondition, movementSpeed);

      // Use the main model for detection
      const predictions = await this.model.estimateHands(videoElement);

      // Apply enhanced stability filtering
      const filteredPredictions = this.applyEnhancedStabilityFilter(predictions);

      // Update movement tracking
      this.updateMovementTracking(filteredPredictions);

      // Update adaptive parameters based on results
      this.updateAdaptiveParameters(filteredPredictions, performance.now() - startTime);

      return filteredPredictions;
    } catch (error) {
      console.warn('Main thread detection error:', error);
      return this.detectHands(videoElement); // Fallback to basic detection
    }
  }

  /**
   * Process predictions from WebWorker
   * @param {Array} workerPredictions - Predictions from worker
   * @returns {Array} Processed predictions
   */
  processWorkerPredictions(workerPredictions) {
    if (!workerPredictions || workerPredictions.length === 0) {
      return [];
    }

    // Worker already provides processed data, just ensure format compatibility
    return workerPredictions.map(prediction => ({
      ...prediction,
      // Ensure all expected properties are present
      landmarks: prediction.landmarks || [],
      handInViewConfidence: prediction.handInViewConfidence || 0,
      boundingBox: prediction.boundingBox || { topLeft: [0, 0], bottomRight: [0, 0] }
    }));
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
   * Check if current frame should be skipped for performance optimization
   * @returns {boolean} True if frame should be skipped
   */
  shouldSkipFrame() {
    const now = performance.now();
    const timeSinceLastProcess = now - this.performanceOptimization.lastProcessTime;
    const targetInterval = 1000 / this.performanceOptimization.adaptiveFrameRate;

    if (timeSinceLastProcess < targetInterval) {
      this.performanceOptimization.skipFrameCount++;
      return this.performanceOptimization.skipFrameCount <= this.performanceOptimization.maxSkipFrames;
    }

    this.performanceOptimization.skipFrameCount = 0;
    this.performanceOptimization.lastProcessTime = now;
    return false;
  }

  /**
   * Get last valid prediction for frame skipping
   * @returns {Array} Last valid hand predictions
   */
  getLastValidPrediction() {
    if (this.adaptiveParams.frameHistory.length > 0) {
      return this.adaptiveParams.frameHistory[this.adaptiveParams.frameHistory.length - 1];
    }
    return [];
  }

  /**
   * Calculate movement speed from recent hand positions
   * @returns {number} Movement speed in pixels per second
   */
  calculateMovementSpeed() {
    if (this.adaptiveParams.movementHistory.length < 2) {
      return 0;
    }

    const recent = this.adaptiveParams.movementHistory.slice(-2);
    const timeDiff = recent[1].timestamp - recent[0].timestamp;

    if (timeDiff === 0) return 0;

    const distance = Math.sqrt(
      Math.pow(recent[1].x - recent[0].x, 2) +
      Math.pow(recent[1].y - recent[0].y, 2)
    );

    return (distance / timeDiff) * 1000; // Convert to pixels per second
  }

  /**
   * Enhanced stability filter with temporal consistency
   * @param {Array} predictions - Raw hand predictions
   * @returns {Array} Filtered predictions
   */
  applyEnhancedStabilityFilter(predictions) {
    // Store current predictions in history
    this.adaptiveParams.frameHistory.push(predictions);
    if (this.adaptiveParams.frameHistory.length > this.adaptiveParams.maxHistorySize) {
      this.adaptiveParams.frameHistory.shift();
    }

    if (predictions.length === 0) {
      // No current detection - check for temporal consistency
      const recentDetections = this.adaptiveParams.frameHistory.slice(-3);
      const hasConsistentDetections = recentDetections.filter(p => p.length > 0).length >= 2;

      if (hasConsistentDetections) {
        // Return interpolated position based on recent detections
        return this.interpolateFromHistory();
      }
      return [];
    }

    // Apply confidence-based filtering
    const filteredPredictions = predictions.filter(prediction => {
      const adjustedThreshold = this.adaptiveParams.baseConfidence + this.adaptiveParams.lightingBoost;
      return prediction.handInViewConfidence >= adjustedThreshold;
    });

    // Apply temporal smoothing
    return this.applyTemporalSmoothing(filteredPredictions);
  }

  /**
   * Update movement tracking data
   * @param {Array} predictions - Current hand predictions
   */
  updateMovementTracking(predictions) {
    if (predictions.length === 0) return;

    const now = Date.now();
    const handCenter = this.calculateHandCenter(predictions[0].landmarks);

    if (handCenter) {
      // Update movement history
      this.adaptiveParams.movementHistory.push({
        x: handCenter.x,
        y: handCenter.y,
        timestamp: now
      });

      if (this.adaptiveParams.movementHistory.length > this.adaptiveParams.maxMovementHistory) {
        this.adaptiveParams.movementHistory.shift();
      }

      // Update movement tracking metrics
      if (this.movementTracking.lastPosition) {
        const timeDiff = now - this.movementTracking.lastTimestamp;
        if (timeDiff > 0) {
          const distance = Math.sqrt(
            Math.pow(handCenter.x - this.movementTracking.lastPosition.x, 2) +
            Math.pow(handCenter.y - this.movementTracking.lastPosition.y, 2)
          );

          const currentSpeed = (distance / timeDiff) * 1000;
          this.movementTracking.speed = this.movementTracking.speed * 0.8 + currentSpeed * 0.2; // Smooth speed

          // Calculate acceleration
          const speedDiff = currentSpeed - this.movementTracking.speed;
          this.movementTracking.acceleration = speedDiff / timeDiff * 1000;

          // Calculate direction
          this.movementTracking.direction = {
            x: (handCenter.x - this.movementTracking.lastPosition.x) / distance || 0,
            y: (handCenter.y - this.movementTracking.lastPosition.y) / distance || 0
          };
        }
      }

      this.movementTracking.lastPosition = handCenter;
      this.movementTracking.lastTimestamp = now;
    }
  }

  /**
   * Update performance metrics
   * @param {number} startTime - Processing start time
   */
  updatePerformanceMetrics(startTime) {
    const processingTime = performance.now() - startTime;

    // Adjust adaptive frame rate based on processing time
    const targetProcessingTime = 1000 / this.performanceOptimization.targetFrameRate;

    if (processingTime > targetProcessingTime * 1.5) {
      // Processing is too slow, reduce frame rate
      this.performanceOptimization.adaptiveFrameRate = Math.max(15, this.performanceOptimization.adaptiveFrameRate - 2);
    } else if (processingTime < targetProcessingTime * 0.7) {
      // Processing is fast enough, can increase frame rate
      this.performanceOptimization.adaptiveFrameRate = Math.min(60, this.performanceOptimization.adaptiveFrameRate + 1);
    }
  }

  /**
   * Interpolate hand position from history when current detection fails
   * @returns {Array} Interpolated predictions
   */
  interpolateFromHistory() {
    const validDetections = this.adaptiveParams.frameHistory.filter(p => p.length > 0);
    if (validDetections.length < 2) return [];

    // Simple interpolation based on last two valid detections
    const last = validDetections[validDetections.length - 1][0];
    const secondLast = validDetections[validDetections.length - 2][0];

    if (!last || !secondLast) return [];

    // Create interpolated prediction
    const interpolated = {
      handInViewConfidence: Math.max(0.5, (last.handInViewConfidence + secondLast.handInViewConfidence) / 2),
      landmarks: last.landmarks.map((landmark, index) => {
        const secondLastLandmark = secondLast.landmarks[index];
        return [
          (landmark[0] + secondLastLandmark[0]) / 2,
          (landmark[1] + secondLastLandmark[1]) / 2,
          (landmark[2] + secondLastLandmark[2]) / 2
        ];
      }),
      boundingBox: {
        topLeft: [
          (last.boundingBox.topLeft[0] + secondLast.boundingBox.topLeft[0]) / 2,
          (last.boundingBox.topLeft[1] + secondLast.boundingBox.topLeft[1]) / 2
        ],
        bottomRight: [
          (last.boundingBox.bottomRight[0] + secondLast.boundingBox.bottomRight[0]) / 2,
          (last.boundingBox.bottomRight[1] + secondLast.boundingBox.bottomRight[1]) / 2
        ]
      }
    };

    return [interpolated];
  }

  /**
   * Apply temporal smoothing to predictions
   * @param {Array} predictions - Current predictions
   * @returns {Array} Smoothed predictions
   */
  applyTemporalSmoothing(predictions) {
    if (predictions.length === 0 || this.adaptiveParams.frameHistory.length < 2) {
      return predictions;
    }

    const lastValidPredictions = this.adaptiveParams.frameHistory
      .slice(-3)
      .filter(p => p.length > 0)
      .pop();

    if (!lastValidPredictions || lastValidPredictions.length === 0) {
      return predictions;
    }

    // Apply smoothing to landmarks
    const smoothingFactor = 0.3;
    const smoothedPredictions = predictions.map((prediction, predIndex) => {
      if (predIndex >= lastValidPredictions.length) return prediction;

      const lastPrediction = lastValidPredictions[predIndex];
      const smoothedLandmarks = prediction.landmarks.map((landmark, landmarkIndex) => {
        const lastLandmark = lastPrediction.landmarks[landmarkIndex];
        return [
          landmark[0] * smoothingFactor + lastLandmark[0] * (1 - smoothingFactor),
          landmark[1] * smoothingFactor + lastLandmark[1] * (1 - smoothingFactor),
          landmark[2] * smoothingFactor + lastLandmark[2] * (1 - smoothingFactor)
        ];
      });

      return {
        ...prediction,
        landmarks: smoothedLandmarks
      };
    });

    return smoothedPredictions;
  }

  /**
   * Enhanced lighting analysis with stability tracking
   * @param {HTMLVideoElement} videoElement - Video element to analyze
   * @returns {Object} Lighting condition analysis
   */
  analyzeLightingConditions(videoElement) {
    const now = Date.now();

    // Only analyze lighting periodically to save performance
    if (now - this.lightingAnalysis.lastAnalysis < this.lightingAnalysis.analysisInterval) {
      return {
        brightness: this.lightingAnalysis.brightness,
        contrast: this.lightingAnalysis.contrast,
        stability: this.lightingAnalysis.stability
      };
    }

    try {
      // Create a temporary canvas to analyze the video frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 160; // Small size for performance
      canvas.height = 120;

      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Calculate brightness and contrast
      let totalBrightness = 0;
      let brightnessValues = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;

        totalBrightness += brightness;
        brightnessValues.push(brightness);
      }

      const avgBrightness = totalBrightness / (data.length / 4);
      const normalizedBrightness = avgBrightness / 255;

      // Calculate contrast (standard deviation of brightness)
      const variance = brightnessValues.reduce((sum, brightness) => {
        return sum + Math.pow(brightness - avgBrightness, 2);
      }, 0) / brightnessValues.length;

      const contrast = Math.sqrt(variance) / 255;

      // Update lighting analysis
      this.lightingAnalysis.brightness = normalizedBrightness;
      this.lightingAnalysis.contrast = contrast;
      this.lightingAnalysis.lastAnalysis = now;

      // Calculate stability (how much lighting has changed)
      const brightnessChange = Math.abs(normalizedBrightness - (this.lightingAnalysis.brightness || 0.5));
      this.lightingAnalysis.stability = Math.max(0, 1 - brightnessChange * 2);

      return {
        brightness: normalizedBrightness,
        contrast: contrast,
        stability: this.lightingAnalysis.stability
      };

    } catch (error) {
      console.warn('Lighting analysis failed:', error);
      return {
        brightness: 0.5,
        contrast: 0.5,
        stability: 1.0
      };
    }
  }

  /**
   * Adapt detection parameters based on lighting and movement
   * @param {Object} lightingCondition - Current lighting analysis
   * @param {number} movementSpeed - Current movement speed
   */
  adaptDetectionParameters(lightingCondition, movementSpeed = 0) {
    // Adjust confidence threshold based on lighting
    if (lightingCondition.brightness < 0.3) {
      // Low light - reduce confidence threshold and add boost
      this.adaptiveParams.lightingBoost = -0.1;
    } else if (lightingCondition.brightness > 0.8) {
      // Bright light - might cause overexposure
      this.adaptiveParams.lightingBoost = -0.05;
    } else {
      // Good lighting
      this.adaptiveParams.lightingBoost = 0.0;
    }

    // Adjust stability filter based on movement speed
    if (movementSpeed > 100) {
      // Fast movement - increase stability filtering
      this.adaptiveParams.stabilityFilter = 0.9;
    } else if (movementSpeed < 20) {
      // Slow movement - reduce stability filtering for responsiveness
      this.adaptiveParams.stabilityFilter = 0.6;
    } else {
      // Normal movement
      this.adaptiveParams.stabilityFilter = 0.8;
    }

    // Adjust confidence threshold based on contrast
    if (lightingCondition.contrast < 0.2) {
      // Low contrast - reduce confidence threshold
      this.adaptiveParams.baseConfidence = 0.6;
    } else {
      // Good contrast
      this.adaptiveParams.baseConfidence = 0.7;
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    // TensorFlow.js handpose model doesn't have a dispose method
    // Just clear the reference
    this.model = null;

    // Dispose WebWorker manager
    if (this.webWorkerManager) {
      this.webWorkerManager.dispose();
      this.webWorkerManager = null;
    }

    this.isInitialized = false;
    this.isLoading = false;
    this.useWebWorker = false;
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
