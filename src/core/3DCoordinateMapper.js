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
   * Map hand position to 3D scene coordinates
   * @param {Object} handPosition - Hand position {x, y, z}
   * @param {number} confidence - Detection confidence
   * @returns {Object} Mapped 3D position with quality info
   */
  mapTo3DCoordinates(handPosition, confidence = 1.0) {
    if (!this.isCalibrated || !handPosition) {
      return {
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false
      };
    }

    // Calculate relative position from center
    const center = this.calibrationData.centerPoint;
    const relativePos = {
      x: handPosition.x - center.x,
      y: handPosition.y - center.y,
      z: handPosition.z - center.z
    };

    // Apply scaling factors
    const scaledPos = {
      x: relativePos.x * this.calibrationData.scalingFactors.x,
      y: -relativePos.y * this.calibrationData.scalingFactors.y, // Invert Y for 3D space
      z: relativePos.z * this.calibrationData.scalingFactors.z
    };

    // Apply boundaries
    const boundedPos = this.applyBoundaries(scaledPos);

    // Apply smoothing
    const smoothedPos = this.applySmoothingFilter(boundedPos);

    // Calculate quality score
    const quality = this.calculateQualityScore(handPosition, confidence);

    return {
      position: smoothedPos,
      quality: quality,
      isValid: quality > this.minConfidence
    };
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
