/**
 * 3D Coordinate Mapper for Hand Tracking
 * Handles calibration and mapping between real-world hand positions and virtual 3D coordinates
 */

export class ThreeDCoordinateMapper {
  constructor() {
    this.isCalibrated = false;
    this.calibrationData = null;
    this.interactionVolume = {
      width: 30,  // cm
      height: 30, // cm
      depth: 20   // cm
    };

    // Virtual scene boundaries
    this.sceneBounds = {
      width: 80,
      height: 60,
      depth: 40
    };

    // Smoothing parameters
    this.smoothingFactor = 0.15;
    this.previousPosition = { x: 0, y: 0, z: 0 };
    this.positionHistory = [];
    this.maxHistorySize = 5;

    // Quality thresholds
    this.minConfidence = 0.6;
    this.maxJitter = 10; // pixels
    this.qualityScore = 1.0;

    // Smart boundary detection
    this.smartBoundaries = {
      adaptive: true,
      userMovementRange: {
        minX: -40, maxX: 40,
        minY: -30, maxY: 30,
        minZ: -20, maxZ: 20
      },
      confidenceBasedExpansion: true,
      temporalConsistency: true
    };

    // Enhanced calibration matrix
    this.calibrationMatrix = {
      transform: null,
      inverse: null,
      confidence: 0,
      lastUpdate: 0
    };

    // Movement analysis for smart boundaries
    this.movementAnalysis = {
      samples: [],
      maxSamples: 100,
      analysisInterval: 5000, // 5 seconds
      lastAnalysis: 0
    };

    // Performance tracking
    this.performanceMetrics = {
      mappingLatency: [],
      accuracyScores: [],
      boundaryViolations: 0,
      adaptationCount: 0
    };
  }

  /**
   * Initialize calibration data from storage or defaults
   */
  initialize() {
    try {
      const stored = localStorage.getItem('3d-motion-calibration');
      if (stored) {
        this.calibrationData = JSON.parse(stored);
        this.isCalibrated = true;
        console.log('✅ 3D calibration data loaded from storage');
      } else {
        this.setDefaultCalibration();
      }
    } catch (error) {
      console.warn('⚠️ Failed to load calibration data, using defaults:', error);
      this.setDefaultCalibration();
    }
  }

  /**
   * Set default calibration values
   */
  setDefaultCalibration() {
    this.calibrationData = {
      centerPoint: { x: 320, y: 240, z: 0.5 }, // Center of webcam view
      boundaryPoints: {
        near: { x: 320, y: 240, z: 0.8 },
        far: { x: 320, y: 240, z: 0.2 },
        left: { x: 160, y: 240, z: 0.5 },
        right: { x: 480, y: 240, z: 0.5 },
        top: { x: 320, y: 120, z: 0.5 },
        bottom: { x: 320, y: 360, z: 0.5 }
      },
      scalingFactors: {
        x: 1.0,
        y: 1.0,
        z: 1.0
      }
    };
    this.isCalibrated = false;
  }

  /**
   * Start calibration process
   * @param {Function} onProgress - Progress callback
   * @param {Function} onComplete - Completion callback
   */
  startCalibration(onProgress, onComplete) {
    const calibrationSteps = [
      { name: 'center', instruction: 'Place hand at center of interaction area' },
      { name: 'near', instruction: 'Move hand as close as comfortable' },
      { name: 'far', instruction: 'Move hand as far as comfortable' },
      { name: 'left', instruction: 'Move hand to the left edge' },
      { name: 'right', instruction: 'Move hand to the right edge' },
      { name: 'top', instruction: 'Move hand to the top edge' },
      { name: 'bottom', instruction: 'Move hand to the bottom edge' }
    ];

    let currentStep = 0;
    const calibrationPoints = {};

    const processStep = (handPosition) => {
      if (currentStep >= calibrationSteps.length) {
        this.completeCalibration(calibrationPoints);
        onComplete(true);
        return;
      }

      const step = calibrationSteps[currentStep];
      calibrationPoints[step.name] = { ...handPosition };
      
      onProgress({
        step: currentStep + 1,
        total: calibrationSteps.length,
        instruction: calibrationSteps[currentStep + 1]?.instruction || 'Calibration complete!'
      });

      currentStep++;
    };

    return {
      processStep,
      getCurrentInstruction: () => calibrationSteps[currentStep]?.instruction || 'Calibration complete!',
      getProgress: () => ({ current: currentStep, total: calibrationSteps.length })
    };
  }

  /**
   * Complete calibration and save data
   * @param {Object} calibrationPoints - Collected calibration points
   */
  completeCalibration(calibrationPoints) {
    this.calibrationData = {
      centerPoint: calibrationPoints.center,
      boundaryPoints: {
        near: calibrationPoints.near,
        far: calibrationPoints.far,
        left: calibrationPoints.left,
        right: calibrationPoints.right,
        top: calibrationPoints.top,
        bottom: calibrationPoints.bottom
      },
      scalingFactors: this.calculateScalingFactors(calibrationPoints)
    };

    this.isCalibrated = true;
    this.saveCalibration();
    console.log('✅ 3D Motion calibration completed');
  }

  /**
   * Calculate scaling factors from calibration points
   * @param {Object} points - Calibration points
   * @returns {Object} Scaling factors
   */
  calculateScalingFactors(points) {
    const xRange = Math.abs(points.right.x - points.left.x);
    const yRange = Math.abs(points.bottom.y - points.top.y);
    const zRange = Math.abs(points.near.z - points.far.z);

    return {
      x: this.sceneBounds.width / Math.max(xRange, 1),
      y: this.sceneBounds.height / Math.max(yRange, 1),
      z: this.sceneBounds.depth / Math.max(zRange, 0.1)
    };
  }

  /**
   * Save calibration data to storage
   */
  saveCalibration() {
    try {
      localStorage.setItem('3d-motion-calibration', JSON.stringify(this.calibrationData));
    } catch (error) {
      console.warn('⚠️ Failed to save calibration data:', error);
    }
  }

  /**
   * Map hand position to 3D scene coordinates with smart boundaries
   * @param {Object} handPosition - Hand position {x, y, z}
   * @param {number} confidence - Detection confidence
   * @returns {Object} Mapped 3D position with quality info
   */
  mapTo3DCoordinates(handPosition, confidence = 1.0) {
    const startTime = performance.now();

    if (!handPosition) {
      return {
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false,
        metadata: { error: 'No hand position provided' }
      };
    }

    try {
      let mappedPosition;

      if (this.isCalibrated && this.calibrationData) {
        // Use calibrated mapping
        mappedPosition = this.applyCalibratedMapping(handPosition, confidence);
      } else {
        // Use proportional mapping with smart boundaries
        mappedPosition = this.applyProportionalMappingWithSmartBoundaries(handPosition, confidence);
      }

      // Apply smart boundary detection
      const boundedPosition = this.applySmartBoundaries(mappedPosition, confidence);

      // Apply enhanced smoothing
      const smoothedPosition = this.applyEnhancedSmoothingFilter(boundedPosition);

      // Update movement analysis
      this.updateMovementAnalysis(handPosition, smoothedPosition, confidence);

      // Calculate enhanced quality score
      const quality = this.calculateEnhancedQualityScore(handPosition, smoothedPosition, confidence);

      // Record performance metrics
      this.recordPerformanceMetrics(startTime, quality);

      return {
        position: smoothedPosition,
        quality: quality,
        isValid: quality > this.minConfidence,
        metadata: {
          originalPosition: handPosition,
          confidence: confidence,
          mappingType: this.isCalibrated ? 'calibrated' : 'proportional',
          boundaryViolations: this.performanceMetrics.boundaryViolations,
          latency: performance.now() - startTime
        }
      };

    } catch (error) {
      console.warn('⚠️ Error in 3D coordinate mapping:', error);
      return {
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false,
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Apply calibrated mapping using calibration matrix
   * @param {Object} handPosition - Hand position
   * @param {number} confidence - Detection confidence
   * @returns {Object} Mapped position
   */
  applyCalibratedMapping(handPosition, confidence) {
    const center = this.calibrationData.centerPoint;
    const relativePos = {
      x: handPosition.x - center.x,
      y: handPosition.y - center.y,
      z: (handPosition.z || 0) - center.z
    };

    // Apply enhanced calibration matrix if available
    if (this.calibrationMatrix.transform) {
      return this.applyCalibrationMatrix(relativePos);
    }

    // Fallback to scaling factors
    const scaledPos = {
      x: relativePos.x * this.calibrationData.scalingFactors.x,
      y: -relativePos.y * this.calibrationData.scalingFactors.y, // Invert Y for 3D space
      z: relativePos.z * this.calibrationData.scalingFactors.z
    };

    return scaledPos;
  }

  /**
   * Apply proportional mapping with smart boundary adaptation
   * @param {Object} handPosition - Hand position
   * @param {number} confidence - Detection confidence
   * @returns {Object} Mapped position
   */
  applyProportionalMappingWithSmartBoundaries(handPosition, confidence) {
    // Use adaptive scene bounds based on user movement patterns
    const adaptiveBounds = this.getAdaptiveSceneBounds();

    // Map to adaptive boundaries
    const mappedX = ((handPosition.x / 640) * adaptiveBounds.width) - (adaptiveBounds.width / 2);
    const mappedY = ((1 - handPosition.y / 480) * adaptiveBounds.height) - (adaptiveBounds.height / 2);
    const mappedZ = ((handPosition.z || 0) * adaptiveBounds.depth) - (adaptiveBounds.depth / 2);

    return { x: mappedX, y: mappedY, z: mappedZ };
  }

  /**
   * Apply smart boundaries that adapt to user movement patterns
   * @param {Object} position - Position to bound
   * @param {number} confidence - Detection confidence
   * @returns {Object} Bounded position
   */
  applySmartBoundaries(position, confidence) {
    if (!this.smartBoundaries.adaptive) {
      return this.applyBoundaries(position);
    }

    // Get current adaptive boundaries
    const bounds = this.smartBoundaries.userMovementRange;

    // Apply confidence-based boundary expansion
    let expansionFactor = 1.0;
    if (this.smartBoundaries.confidenceBasedExpansion && confidence > 0.8) {
      expansionFactor = 1.1; // Allow slightly larger range for high-confidence detections
    }

    const boundedPosition = {
      x: Math.max(bounds.minX * expansionFactor, Math.min(bounds.maxX * expansionFactor, position.x)),
      y: Math.max(bounds.minY * expansionFactor, Math.min(bounds.maxY * expansionFactor, position.y)),
      z: Math.max(bounds.minZ * expansionFactor, Math.min(bounds.maxZ * expansionFactor, position.z))
    };

    // Check for boundary violations
    if (position.x < bounds.minX || position.x > bounds.maxX ||
        position.y < bounds.minY || position.y > bounds.maxY ||
        position.z < bounds.minZ || position.z > bounds.maxZ) {
      this.performanceMetrics.boundaryViolations++;
    }

    return boundedPosition;
  }

  /**
   * Get adaptive scene bounds based on user movement analysis
   * @returns {Object} Adaptive scene boundaries
   */
  getAdaptiveSceneBounds() {
    // Analyze movement patterns to determine optimal boundaries
    if (this.movementAnalysis.samples.length < 10) {
      return this.sceneBounds; // Use default bounds
    }

    const samples = this.movementAnalysis.samples;
    const xValues = samples.map(s => s.original.x).sort((a, b) => a - b);
    const yValues = samples.map(s => s.original.y).sort((a, b) => a - b);

    // Calculate 95th percentile boundaries
    const percentile5 = Math.floor(samples.length * 0.05);
    const percentile95 = Math.floor(samples.length * 0.95);

    const adaptiveBounds = {
      width: Math.max(this.sceneBounds.width * 0.8, (xValues[percentile95] - xValues[percentile5]) * 1.2),
      height: Math.max(this.sceneBounds.height * 0.8, (yValues[percentile95] - yValues[percentile5]) * 1.2),
      depth: this.sceneBounds.depth // Keep depth constant for now
    };

    return adaptiveBounds;
  }

  /**
   * Apply scene boundaries to position
   * @param {Object} position - Position to bound
   * @returns {Object} Bounded position
   */
  applyBoundaries(position) {
    const halfWidth = this.sceneBounds.width / 2;
    const halfHeight = this.sceneBounds.height / 2;
    const halfDepth = this.sceneBounds.depth / 2;

    return {
      x: Math.max(-halfWidth, Math.min(halfWidth, position.x)),
      y: Math.max(-halfHeight, Math.min(halfHeight, position.y)),
      z: Math.max(-halfDepth, Math.min(halfDepth, position.z))
    };
  }

  /**
   * Apply smoothing filter to reduce jitter
   * @param {Object} position - Current position
   * @returns {Object} Smoothed position
   */
  applySmoothingFilter(position) {
    // Add to history
    this.positionHistory.push(position);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }

    // Calculate smoothed position using exponential moving average
    const smoothed = {
      x: this.previousPosition.x + (position.x - this.previousPosition.x) * this.smoothingFactor,
      y: this.previousPosition.y + (position.y - this.previousPosition.y) * this.smoothingFactor,
      z: this.previousPosition.z + (position.z - this.previousPosition.z) * this.smoothingFactor
    };

    this.previousPosition = smoothed;
    return smoothed;
  }

  /**
   * Calculate quality score for tracking
   * @param {Object} handPosition - Current hand position
   * @param {number} confidence - Detection confidence
   * @returns {number} Quality score (0-1)
   */
  calculateQualityScore(handPosition, confidence) {
    let quality = confidence;

    // Check for excessive jitter
    if (this.positionHistory.length > 1) {
      const lastPos = this.positionHistory[this.positionHistory.length - 1];
      const jitter = Math.sqrt(
        Math.pow(handPosition.x - lastPos.x, 2) +
        Math.pow(handPosition.y - lastPos.y, 2)
      );

      if (jitter > this.maxJitter) {
        quality *= 0.5; // Reduce quality for jittery movement
      }
    }

    // Check if position is within reasonable bounds
    const center = this.calibrationData.centerPoint;
    const distance = Math.sqrt(
      Math.pow(handPosition.x - center.x, 2) +
      Math.pow(handPosition.y - center.y, 2)
    );

    if (distance > 300) { // Too far from center
      quality *= 0.7;
    }

    this.qualityScore = quality;
    return quality;
  }

  /**
   * Enhanced smoothing filter with adaptive parameters
   * @param {Object} position - Position to smooth
   * @returns {Object} Smoothed position
   */
  applyEnhancedSmoothingFilter(position) {
    // Add to history
    this.positionHistory.push(position);
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift();
    }

    // Adaptive smoothing based on movement speed
    let adaptiveSmoothingFactor = this.smoothingFactor;

    if (this.positionHistory.length > 1) {
      const lastPos = this.positionHistory[this.positionHistory.length - 2];
      const movementSpeed = Math.sqrt(
        Math.pow(position.x - lastPos.x, 2) +
        Math.pow(position.y - lastPos.y, 2) +
        Math.pow(position.z - lastPos.z, 2)
      );

      // Increase smoothing for fast movements, decrease for slow movements
      if (movementSpeed > 10) {
        adaptiveSmoothingFactor = Math.min(0.8, this.smoothingFactor * 2);
      } else if (movementSpeed < 2) {
        adaptiveSmoothingFactor = Math.max(0.05, this.smoothingFactor * 0.5);
      }
    }

    // Apply smoothing
    const smoothed = {
      x: this.previousPosition.x + (position.x - this.previousPosition.x) * adaptiveSmoothingFactor,
      y: this.previousPosition.y + (position.y - this.previousPosition.y) * adaptiveSmoothingFactor,
      z: this.previousPosition.z + (position.z - this.previousPosition.z) * adaptiveSmoothingFactor
    };

    this.previousPosition = smoothed;
    return smoothed;
  }

  /**
   * Update movement analysis for smart boundary detection
   * @param {Object} originalPosition - Original hand position
   * @param {Object} mappedPosition - Mapped 3D position
   * @param {number} confidence - Detection confidence
   */
  updateMovementAnalysis(originalPosition, mappedPosition, confidence) {
    const now = Date.now();

    this.movementAnalysis.samples.push({
      original: originalPosition,
      mapped: mappedPosition,
      confidence: confidence,
      timestamp: now
    });

    // Keep sample size manageable
    if (this.movementAnalysis.samples.length > this.movementAnalysis.maxSamples) {
      this.movementAnalysis.samples.shift();
    }

    // Periodically analyze movement patterns
    if (now - this.movementAnalysis.lastAnalysis > this.movementAnalysis.analysisInterval) {
      this.analyzeMovementPatterns();
      this.movementAnalysis.lastAnalysis = now;
    }
  }

  /**
   * Calculate enhanced quality score with multiple factors
   * @param {Object} originalPosition - Original hand position
   * @param {Object} mappedPosition - Mapped position
   * @param {number} confidence - Detection confidence
   * @returns {number} Quality score (0-1)
   */
  calculateEnhancedQualityScore(originalPosition, mappedPosition, confidence) {
    let quality = confidence;

    // Factor 1: Jitter detection
    if (this.positionHistory.length > 1) {
      const lastPos = this.positionHistory[this.positionHistory.length - 2];
      const jitter = Math.sqrt(
        Math.pow(mappedPosition.x - lastPos.x, 2) +
        Math.pow(mappedPosition.y - lastPos.y, 2) +
        Math.pow(mappedPosition.z - lastPos.z, 2)
      );

      if (jitter > this.maxJitter) {
        quality *= 0.7; // Significant penalty for jitter
      } else if (jitter > this.maxJitter * 0.5) {
        quality *= 0.9; // Minor penalty for moderate jitter
      }
    }

    // Factor 2: Boundary compliance
    const bounds = this.smartBoundaries.userMovementRange;
    const withinBounds = (
      mappedPosition.x >= bounds.minX && mappedPosition.x <= bounds.maxX &&
      mappedPosition.y >= bounds.minY && mappedPosition.y <= bounds.maxY &&
      mappedPosition.z >= bounds.minZ && mappedPosition.z <= bounds.maxZ
    );

    if (!withinBounds) {
      quality *= 0.8; // Penalty for out-of-bounds positions
    }

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Record performance metrics
   * @param {number} startTime - Processing start time
   * @param {number} quality - Quality score
   */
  recordPerformanceMetrics(startTime, quality) {
    const latency = performance.now() - startTime;

    this.performanceMetrics.mappingLatency.push(latency);
    this.performanceMetrics.accuracyScores.push(quality);

    // Keep metrics arrays manageable
    if (this.performanceMetrics.mappingLatency.length > 100) {
      this.performanceMetrics.mappingLatency.shift();
    }
    if (this.performanceMetrics.accuracyScores.length > 100) {
      this.performanceMetrics.accuracyScores.shift();
    }
  }

  /**
   * Analyze movement patterns to update smart boundaries
   */
  analyzeMovementPatterns() {
    if (this.movementAnalysis.samples.length < 20) return;

    const highConfidenceSamples = this.movementAnalysis.samples.filter(s => s.confidence > 0.7);
    if (highConfidenceSamples.length < 10) return;

    // Calculate movement range
    const xValues = highConfidenceSamples.map(s => s.mapped.x);
    const yValues = highConfidenceSamples.map(s => s.mapped.y);
    const zValues = highConfidenceSamples.map(s => s.mapped.z);

    const xRange = { min: Math.min(...xValues), max: Math.max(...xValues) };
    const yRange = { min: Math.min(...yValues), max: Math.max(...yValues) };
    const zRange = { min: Math.min(...zValues), max: Math.max(...zValues) };

    // Update smart boundaries with some padding
    const padding = 5;
    this.smartBoundaries.userMovementRange = {
      minX: xRange.min - padding,
      maxX: xRange.max + padding,
      minY: yRange.min - padding,
      maxY: yRange.max + padding,
      minZ: zRange.min - padding,
      maxZ: zRange.max + padding
    };

    this.performanceMetrics.adaptationCount++;
    console.log('🔄 Smart boundaries updated based on movement analysis');
  }

  /**
   * Reset calibration
   */
  resetCalibration() {
    this.isCalibrated = false;
    this.calibrationData = null;
    this.setDefaultCalibration();
    localStorage.removeItem('3d-motion-calibration');
    console.log('🔄 3D Motion calibration reset');
  }

  /**
   * Get current calibration status
   * @returns {Object} Calibration status
   */
  getCalibrationStatus() {
    return {
      isCalibrated: this.isCalibrated,
      qualityScore: this.qualityScore,
      interactionVolume: this.interactionVolume,
      sceneBounds: this.sceneBounds
    };
  }
}

export default ThreeDCoordinateMapper;
