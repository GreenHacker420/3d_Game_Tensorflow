import KalmanFilter from './KalmanFilter.js';

/**
 * Predictive Hand Tracker
 * Uses Kalman filtering for smooth tracking and position prediction
 */
export class PredictiveTracker {
  constructor(options = {}) {
    this.config = {
      enablePrediction: options.enablePrediction !== false,
      predictionTimeAhead: options.predictionTimeAhead || 0.1, // 100ms ahead
      confidenceThreshold: options.confidenceThreshold || 0.3,
      adaptiveSmoothing: options.adaptiveSmoothing !== false,
      maxPredictionDistance: options.maxPredictionDistance || 50, // pixels
      ...options
    };

    // Kalman filters for different tracking aspects
    this.positionFilter = new KalmanFilter({
      processNoise: 0.01,
      measurementNoise: 0.1,
      adaptiveNoise: true,
      confidenceWeighting: true
    });

    this.gestureFilter = new KalmanFilter({
      processNoise: 0.05,
      measurementNoise: 0.2,
      adaptiveNoise: true
    });

    // Tracking state
    this.isTracking = false;
    this.lastUpdate = 0;
    this.trackingHistory = [];
    this.maxHistorySize = 30;

    // Performance metrics
    this.metrics = {
      predictionAccuracy: 1.0,
      smoothnessScore: 1.0,
      latency: 0,
      frameCount: 0
    };

    // Prediction cache
    this.predictionCache = {
      position: null,
      timestamp: 0,
      confidence: 0
    };

    console.log('🎯 PredictiveTracker initialized with config:', this.config);
  }

  /**
   * Update tracker with new hand state
   * @param {Object} handState - Current hand state
   * @returns {Object} Enhanced hand state with predictions
   */
  update(handState) {
    const startTime = performance.now();

    if (!handState || !handState.isTracking) {
      this.handleTrackingLoss();
      return this.createEmptyState();
    }

    // Initialize filters if this is the first valid detection
    if (!this.isTracking) {
      this.initializeTracking(handState);
    }

    // Update position filter
    const enhancedPosition = this.updatePositionTracking(handState);

    // Update gesture tracking if available
    const enhancedGesture = this.updateGestureTracking(handState);

    // Generate predictions
    const predictions = this.generatePredictions();

    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(handState, enhancedPosition);

    // Update tracking history
    this.updateTrackingHistory(handState, enhancedPosition);

    // Record performance
    this.metrics.latency = performance.now() - startTime;
    this.metrics.frameCount++;

    const enhancedState = {
      ...handState,
      position: enhancedPosition.position,
      smoothedPosition: enhancedPosition.smoothed,
      predictedPosition: predictions.position,
      velocity: enhancedPosition.velocity,
      gesture: enhancedGesture.gesture,
      gestureConfidence: enhancedGesture.confidence,
      qualityMetrics: qualityMetrics,
      predictions: predictions,
      trackingMetrics: this.getTrackingMetrics()
    };

    this.lastUpdate = performance.now();
    return enhancedState;
  }

  /**
   * Initialize tracking with first valid detection
   * @param {Object} handState - Initial hand state
   */
  initializeTracking(handState) {
    this.positionFilter.initialize(handState.position, handState.confidence);
    
    if (handState.gesture && handState.gesture !== 'NO_HAND') {
      // Initialize gesture filter with gesture center point
      const gestureCenter = this.calculateGestureCenter(handState);
      this.gestureFilter.initialize(gestureCenter, handState.confidence);
    }

    this.isTracking = true;
    this.lastUpdate = performance.now();
    
    console.log('🎯 PredictiveTracker: Tracking initialized');
  }

  /**
   * Update position tracking with Kalman filtering
   * @param {Object} handState - Current hand state
   * @returns {Object} Enhanced position data
   */
  updatePositionTracking(handState) {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdate) / 1000;

    // Update Kalman filter
    const filteredResult = this.positionFilter.update(handState.position, handState.confidence);

    // Apply additional smoothing if enabled
    let smoothedPosition = filteredResult;
    if (this.config.adaptiveSmoothing) {
      smoothedPosition = this.applyAdaptiveSmoothing(filteredResult, handState.confidence);
    }

    return {
      position: smoothedPosition,
      smoothed: smoothedPosition,
      velocity: filteredResult.velocity,
      confidence: filteredResult.confidence,
      innovation: filteredResult.innovation || 0
    };
  }

  /**
   * Update gesture tracking
   * @param {Object} handState - Current hand state
   * @returns {Object} Enhanced gesture data
   */
  updateGestureTracking(handState) {
    if (!handState.gesture || handState.gesture === 'NO_HAND') {
      return {
        gesture: handState.gesture,
        confidence: 0
      };
    }

    // Calculate gesture stability over time
    const gestureStability = this.calculateGestureStability(handState.gesture);

    // Enhanced confidence based on temporal consistency
    const enhancedConfidence = Math.min(1.0, handState.confidence * gestureStability);

    return {
      gesture: handState.gesture,
      confidence: enhancedConfidence,
      stability: gestureStability
    };
  }

  /**
   * Generate position and gesture predictions
   * @returns {Object} Prediction data
   */
  generatePredictions() {
    if (!this.config.enablePrediction || !this.isTracking) {
      return {
        position: null,
        gesture: null,
        confidence: 0
      };
    }

    // Predict future position
    const futurePosition = this.positionFilter.predictFuture(this.config.predictionTimeAhead);

    // Validate prediction
    const isValidPrediction = this.validatePrediction(futurePosition);

    if (isValidPrediction) {
      this.predictionCache = {
        position: futurePosition,
        timestamp: performance.now(),
        confidence: futurePosition.confidence
      };
    }

    return {
      position: isValidPrediction ? futurePosition : null,
      gesture: null, // Gesture prediction could be added here
      confidence: isValidPrediction ? futurePosition.confidence : 0,
      timeAhead: this.config.predictionTimeAhead,
      isValid: isValidPrediction
    };
  }

  /**
   * Apply adaptive smoothing based on movement characteristics
   * @param {Object} position - Filtered position
   * @param {number} confidence - Detection confidence
   * @returns {Object} Smoothed position
   */
  applyAdaptiveSmoothing(position, confidence) {
    if (this.trackingHistory.length === 0) {
      return position;
    }

    const lastPosition = this.trackingHistory[this.trackingHistory.length - 1].position;
    const movement = Math.sqrt(
      Math.pow(position.x - lastPosition.x, 2) +
      Math.pow(position.y - lastPosition.y, 2) +
      Math.pow(position.z - lastPosition.z, 2)
    );

    // Adaptive smoothing factor based on movement speed and confidence
    let smoothingFactor = 0.3; // Base smoothing

    if (movement > 20) {
      // Fast movement - reduce smoothing for responsiveness
      smoothingFactor = Math.max(0.1, smoothingFactor * (confidence + 0.5));
    } else if (movement < 5) {
      // Slow movement - increase smoothing for stability
      smoothingFactor = Math.min(0.8, smoothingFactor * (2 - confidence));
    }

    return {
      x: lastPosition.x + (position.x - lastPosition.x) * smoothingFactor,
      y: lastPosition.y + (position.y - lastPosition.y) * smoothingFactor,
      z: lastPosition.z + (position.z - lastPosition.z) * smoothingFactor
    };
  }

  /**
   * Calculate gesture stability over time
   * @param {string} currentGesture - Current gesture
   * @returns {number} Stability score (0-1)
   */
  calculateGestureStability(currentGesture) {
    if (this.trackingHistory.length < 5) {
      return 0.5; // Neutral stability for insufficient history
    }

    const recentGestures = this.trackingHistory.slice(-5).map(h => h.gesture);
    const sameGestureCount = recentGestures.filter(g => g === currentGesture).length;
    
    return sameGestureCount / recentGestures.length;
  }

  /**
   * Validate prediction reasonableness
   * @param {Object} prediction - Predicted position
   * @returns {boolean} Whether prediction is valid
   */
  validatePrediction(prediction) {
    if (!prediction || prediction.confidence < this.config.confidenceThreshold) {
      return false;
    }

    // Check if prediction is within reasonable bounds
    if (this.trackingHistory.length > 0) {
      const lastPosition = this.trackingHistory[this.trackingHistory.length - 1].position;
      const predictionDistance = Math.sqrt(
        Math.pow(prediction.x - lastPosition.x, 2) +
        Math.pow(prediction.y - lastPosition.y, 2) +
        Math.pow(prediction.z - lastPosition.z, 2)
      );

      if (predictionDistance > this.config.maxPredictionDistance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate quality metrics for tracking
   * @param {Object} originalState - Original hand state
   * @param {Object} enhancedPosition - Enhanced position data
   * @returns {Object} Quality metrics
   */
  calculateQualityMetrics(originalState, enhancedPosition) {
    // Smoothness: based on velocity consistency
    const smoothness = this.calculateSmoothness();

    // Responsiveness: based on innovation magnitude
    const responsiveness = Math.max(0, 1 - (enhancedPosition.innovation || 0) / 20);

    // Prediction accuracy: based on recent prediction performance
    const predictionAccuracy = this.calculatePredictionAccuracy();

    // Overall quality
    const overall = (smoothness + responsiveness + predictionAccuracy) / 3;

    return {
      smoothness: smoothness,
      responsiveness: responsiveness,
      predictionAccuracy: predictionAccuracy,
      overall: overall,
      confidence: enhancedPosition.confidence
    };
  }

  /**
   * Calculate smoothness score based on velocity consistency
   * @returns {number} Smoothness score (0-1)
   */
  calculateSmoothness() {
    if (this.trackingHistory.length < 3) {
      return 1.0;
    }

    const recentVelocities = this.trackingHistory.slice(-3).map(h => h.velocity || { x: 0, y: 0, z: 0 });
    
    let velocityVariance = 0;
    for (let i = 1; i < recentVelocities.length; i++) {
      const vDiff = Math.sqrt(
        Math.pow(recentVelocities[i].x - recentVelocities[i-1].x, 2) +
        Math.pow(recentVelocities[i].y - recentVelocities[i-1].y, 2) +
        Math.pow(recentVelocities[i].z - recentVelocities[i-1].z, 2)
      );
      velocityVariance += vDiff;
    }

    velocityVariance /= (recentVelocities.length - 1);
    
    // Convert variance to smoothness score
    return Math.max(0, Math.min(1, 1 - velocityVariance / 50));
  }

  /**
   * Calculate prediction accuracy based on recent performance
   * @returns {number} Prediction accuracy score (0-1)
   */
  calculatePredictionAccuracy() {
    // This would be calculated by comparing past predictions with actual outcomes
    // For now, return the current metric
    return this.metrics.predictionAccuracy;
  }

  /**
   * Update tracking history
   * @param {Object} originalState - Original hand state
   * @param {Object} enhancedPosition - Enhanced position data
   */
  updateTrackingHistory(originalState, enhancedPosition) {
    this.trackingHistory.push({
      position: enhancedPosition.position,
      velocity: enhancedPosition.velocity,
      gesture: originalState.gesture,
      confidence: originalState.confidence,
      timestamp: performance.now()
    });

    if (this.trackingHistory.length > this.maxHistorySize) {
      this.trackingHistory.shift();
    }
  }

  /**
   * Handle tracking loss
   */
  handleTrackingLoss() {
    if (this.isTracking) {
      console.log('🎯 PredictiveTracker: Tracking lost');
      this.isTracking = false;
      
      // Don't reset filters immediately - allow for brief interruptions
      setTimeout(() => {
        if (!this.isTracking) {
          this.reset();
        }
      }, 1000);
    }
  }

  /**
   * Create empty state for when tracking is lost
   * @returns {Object} Empty tracking state
   */
  createEmptyState() {
    return {
      isTracking: false,
      position: { x: 0, y: 0, z: 0 },
      smoothedPosition: { x: 0, y: 0, z: 0 },
      predictedPosition: null,
      velocity: { x: 0, y: 0, z: 0 },
      gesture: 'NO_HAND',
      gestureConfidence: 0,
      qualityMetrics: {
        smoothness: 0,
        responsiveness: 0,
        predictionAccuracy: 0,
        overall: 0,
        confidence: 0
      },
      predictions: {
        position: null,
        gesture: null,
        confidence: 0,
        isValid: false
      },
      trackingMetrics: this.getTrackingMetrics()
    };
  }

  /**
   * Calculate gesture center point from landmarks
   * @param {Object} handState - Hand state with landmarks
   * @returns {Object} Gesture center position
   */
  calculateGestureCenter(handState) {
    if (!handState.landmarks || handState.landmarks.length === 0) {
      return handState.position;
    }

    // Use wrist (landmark 0) as gesture center
    const wrist = handState.landmarks[0];
    return {
      x: wrist[0],
      y: wrist[1],
      z: wrist[2] || 0
    };
  }

  /**
   * Get current tracking metrics
   * @returns {Object} Tracking metrics
   */
  getTrackingMetrics() {
    return {
      ...this.metrics,
      isTracking: this.isTracking,
      historySize: this.trackingHistory.length,
      positionFilterMetrics: this.positionFilter.getMetrics(),
      gestureFilterMetrics: this.gestureFilter.getMetrics()
    };
  }

  /**
   * Reset the tracker
   */
  reset() {
    this.positionFilter.reset();
    this.gestureFilter.reset();
    this.isTracking = false;
    this.trackingHistory = [];
    this.predictionCache = {
      position: null,
      timestamp: 0,
      confidence: 0
    };
    
    console.log('🔄 PredictiveTracker reset');
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 PredictiveTracker config updated:', newConfig);
  }
}

export default PredictiveTracker;
