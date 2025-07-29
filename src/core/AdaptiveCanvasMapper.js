/**
 * Adaptive Canvas Mapper for Dynamic Hand Tracking
 * Handles dynamic resolution detection, aspect ratio correction, and coordinate transformation
 * across different webcam configurations and screen sizes
 */

export class AdaptiveCanvasMapper {
  constructor() {
    // Webcam capabilities
    this.webcamCapabilities = {
      width: 640,
      height: 480,
      aspectRatio: 4/3,
      actualResolution: null,
      supportedResolutions: []
    };

    // Scene capabilities
    this.sceneCapabilities = {
      width: 100,
      height: 80,
      aspectRatio: 5/4,
      actualDimensions: null
    };

    // Transformation matrix and calibration
    this.transformationMatrix = null;
    this.calibrationData = null;
    this.isCalibrated = false;

    // Adaptive parameters
    this.adaptiveParams = {
      aspectRatioCorrection: 1.0,
      scalingFactor: 1.0,
      offsetX: 0,
      offsetY: 0,
      confidenceThreshold: 0.7,
      smoothingFactor: 0.15
    };

    // Movement analysis
    this.movementHistory = [];
    this.maxHistorySize = 30;
    this.naturalBoundaries = {
      minX: -40, maxX: 40,
      minY: -30, maxY: 30,
      minZ: -20, maxZ: 20
    };

    // Performance tracking
    this.performanceMetrics = {
      mappingLatency: 0,
      accuracyScore: 1.0,
      adaptationCount: 0
    };

    console.log('🎯 AdaptiveCanvasMapper initialized');
  }

  /**
   * Initialize the adaptive mapper with video and scene elements
   * @param {HTMLVideoElement} videoElement - Webcam video element
   * @param {HTMLCanvasElement} sceneElement - 3D scene canvas element
   * @returns {Promise<boolean>} Success status
   */
  async initialize(videoElement, sceneElement) {
    try {
      console.log('🚀 Initializing AdaptiveCanvasMapper...');

      // Detect webcam capabilities
      await this.detectWebcamCapabilities(videoElement);

      // Detect scene capabilities
      this.detectSceneCapabilities(sceneElement);

      // Calculate transformation matrix
      this.calculateTransformationMatrix();

      // Load any existing calibration data
      this.loadCalibrationData();

      console.log('✅ AdaptiveCanvasMapper initialized successfully');
      console.log('📊 Webcam:', this.webcamCapabilities);
      console.log('📊 Scene:', this.sceneCapabilities);
      console.log('📊 Adaptive Params:', this.adaptiveParams);

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AdaptiveCanvasMapper:', error);
      return false;
    }
  }

  /**
   * Detect webcam capabilities and optimal resolution
   * @param {HTMLVideoElement} videoElement - Video element
   */
  async detectWebcamCapabilities(videoElement) {
    if (!videoElement) {
      throw new Error('Video element is required for capability detection');
    }

    try {
      // Get actual video dimensions
      const actualWidth = videoElement.videoWidth || videoElement.width;
      const actualHeight = videoElement.videoHeight || videoElement.height;

      if (actualWidth && actualHeight) {
        this.webcamCapabilities.width = actualWidth;
        this.webcamCapabilities.height = actualHeight;
        this.webcamCapabilities.aspectRatio = actualWidth / actualHeight;
        this.webcamCapabilities.actualResolution = { width: actualWidth, height: actualHeight };

        console.log(`📹 Detected webcam resolution: ${actualWidth}x${actualHeight} (${this.webcamCapabilities.aspectRatio.toFixed(2)}:1)`);
      }

      // Try to get media track capabilities for supported resolutions
      if (videoElement.srcObject) {
        const stream = videoElement.srcObject;
        const videoTrack = stream.getVideoTracks()[0];
        
        if (videoTrack && videoTrack.getCapabilities) {
          const capabilities = videoTrack.getCapabilities();
          
          if (capabilities.width && capabilities.height) {
            this.webcamCapabilities.supportedResolutions = [
              { width: capabilities.width.max, height: capabilities.height.max },
              { width: capabilities.width.min, height: capabilities.height.min }
            ];
            
            console.log('📹 Supported resolutions:', this.webcamCapabilities.supportedResolutions);
          }
        }
      }

    } catch (error) {
      console.warn('⚠️ Could not detect full webcam capabilities:', error);
      // Fallback to default values
      this.webcamCapabilities.width = 640;
      this.webcamCapabilities.height = 480;
      this.webcamCapabilities.aspectRatio = 4/3;
    }
  }

  /**
   * Detect scene canvas capabilities
   * @param {HTMLCanvasElement} sceneElement - Scene canvas element
   */
  detectSceneCapabilities(sceneElement) {
    if (!sceneElement) {
      console.warn('⚠️ Scene element not provided, using default dimensions');
      return;
    }

    try {
      const rect = sceneElement.getBoundingClientRect();
      const actualWidth = rect.width || sceneElement.width || 800;
      const actualHeight = rect.height || sceneElement.height || 600;

      this.sceneCapabilities.width = actualWidth;
      this.sceneCapabilities.height = actualHeight;
      this.sceneCapabilities.aspectRatio = actualWidth / actualHeight;
      this.sceneCapabilities.actualDimensions = { width: actualWidth, height: actualHeight };

      console.log(`🎮 Detected scene dimensions: ${actualWidth.toFixed(0)}x${actualHeight.toFixed(0)} (${this.sceneCapabilities.aspectRatio.toFixed(2)}:1)`);

    } catch (error) {
      console.warn('⚠️ Could not detect scene capabilities:', error);
      // Use default values
      this.sceneCapabilities.width = 800;
      this.sceneCapabilities.height = 600;
      this.sceneCapabilities.aspectRatio = 4/3;
    }
  }

  /**
   * Calculate transformation matrix for coordinate mapping
   */
  calculateTransformationMatrix() {
    // Calculate aspect ratio correction
    const webcamAspect = this.webcamCapabilities.aspectRatio;
    const sceneAspect = this.sceneCapabilities.aspectRatio;
    
    this.adaptiveParams.aspectRatioCorrection = webcamAspect / sceneAspect;
    
    // Calculate scaling factor based on resolution differences
    const resolutionRatio = Math.sqrt(
      (this.webcamCapabilities.width * this.webcamCapabilities.height) /
      (this.sceneCapabilities.width * this.sceneCapabilities.height)
    );
    
    this.adaptiveParams.scalingFactor = Math.max(0.5, Math.min(2.0, resolutionRatio));
    
    // Create transformation matrix
    this.transformationMatrix = {
      scaleX: this.adaptiveParams.scalingFactor * this.adaptiveParams.aspectRatioCorrection,
      scaleY: this.adaptiveParams.scalingFactor,
      offsetX: this.adaptiveParams.offsetX,
      offsetY: this.adaptiveParams.offsetY
    };

    console.log('🔄 Transformation matrix calculated:', this.transformationMatrix);
  }

  /**
   * Load existing calibration data from localStorage
   */
  loadCalibrationData() {
    try {
      const saved = localStorage.getItem('adaptiveCanvasMapper_calibration');
      if (saved) {
        this.calibrationData = JSON.parse(saved);
        this.isCalibrated = true;
        console.log('📁 Loaded existing calibration data');
      }
    } catch (error) {
      console.warn('⚠️ Could not load calibration data:', error);
    }
  }

  /**
   * Save calibration data to localStorage
   */
  saveCalibrationData() {
    try {
      localStorage.setItem('adaptiveCanvasMapper_calibration', JSON.stringify(this.calibrationData));
      console.log('💾 Calibration data saved');
    } catch (error) {
      console.warn('⚠️ Could not save calibration data:', error);
    }
  }

  /**
   * Map hand coordinates to scene coordinates with adaptive correction
   * @param {Object} handPosition - Hand position {x, y, z}
   * @param {number} confidence - Detection confidence (0-1)
   * @param {Object} options - Additional mapping options
   * @returns {Object} Mapped coordinates with quality info
   */
  mapCoordinates(handPosition, confidence = 1.0, options = {}) {
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
      // Apply aspect ratio correction
      const correctedX = handPosition.x * this.adaptiveParams.aspectRatioCorrection;
      
      // Calculate adaptive scale based on confidence and movement patterns
      const adaptiveScale = this.calculateAdaptiveScale(confidence, handPosition);
      
      // Apply transformation matrix
      let mappedPosition;
      if (this.calibrationData && this.isCalibrated) {
        mappedPosition = this.applyCalibrationTransform(correctedX, handPosition.y, handPosition.z, adaptiveScale);
      } else {
        mappedPosition = this.applyProportionalMapping(correctedX, handPosition.y, handPosition.z, adaptiveScale);
      }

      // Apply natural boundaries
      const boundedPosition = this.applyNaturalBoundaries(mappedPosition);

      // Update movement history for analysis
      this.updateMovementHistory(boundedPosition, confidence);

      // Calculate quality score
      const quality = this.calculateMappingQuality(handPosition, confidence, boundedPosition);

      // Record performance
      this.performanceMetrics.mappingLatency = performance.now() - startTime;

      return {
        position: boundedPosition,
        quality: quality,
        isValid: quality > this.adaptiveParams.confidenceThreshold,
        metadata: {
          originalPosition: handPosition,
          confidence: confidence,
          adaptiveScale: adaptiveScale,
          latency: this.performanceMetrics.mappingLatency
        }
      };

    } catch (error) {
      console.warn('⚠️ Error in coordinate mapping:', error);
      return {
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false,
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Calculate adaptive scale based on confidence and movement patterns
   * @param {number} confidence - Detection confidence
   * @param {Object} handPosition - Current hand position
   * @returns {number} Adaptive scale factor
   */
  calculateAdaptiveScale(confidence, handPosition) {
    let scale = this.adaptiveParams.scalingFactor;

    // Adjust based on confidence
    if (confidence < 0.8) {
      scale *= (0.8 + confidence * 0.2); // Reduce scale for low confidence
    }

    // Adjust based on movement speed
    if (this.movementHistory.length > 1) {
      const lastPos = this.movementHistory[this.movementHistory.length - 1];
      const movementSpeed = Math.sqrt(
        Math.pow(handPosition.x - lastPos.x, 2) +
        Math.pow(handPosition.y - lastPos.y, 2)
      );

      // Reduce scale for fast movements to improve stability
      if (movementSpeed > 50) {
        scale *= 0.9;
      }
    }

    return Math.max(0.5, Math.min(2.0, scale));
  }

  /**
   * Apply calibration-based coordinate transformation
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} scale - Adaptive scale
   * @returns {Object} Transformed position
   */
  applyCalibrationTransform(x, y, z, scale) {
    const cal = this.calibrationData;

    // Apply calibration matrix transformation
    const transformedX = (x - cal.centerX) * cal.scaleX * scale + cal.offsetX;
    const transformedY = (y - cal.centerY) * cal.scaleY * scale + cal.offsetY;
    const transformedZ = z * cal.scaleZ * scale + cal.offsetZ;

    return { x: transformedX, y: transformedY, z: transformedZ };
  }

  /**
   * Apply proportional mapping (fallback when no calibration)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {number} scale - Adaptive scale
   * @returns {Object} Mapped position
   */
  applyProportionalMapping(x, y, z, scale) {
    // Map from webcam coordinates to scene coordinates
    const sceneWidth = 80;  // Virtual scene width
    const sceneHeight = 60; // Virtual scene height
    const sceneDepth = 40;  // Virtual scene depth

    const mappedX = ((x / this.webcamCapabilities.width) * sceneWidth - (sceneWidth / 2)) * scale;
    const mappedY = ((1 - y / this.webcamCapabilities.height) * sceneHeight - (sceneHeight / 2)) * scale;
    const mappedZ = ((z || 0) * sceneDepth - (sceneDepth / 2)) * scale;

    return { x: mappedX, y: mappedY, z: mappedZ };
  }

  /**
   * Apply natural boundaries based on user movement analysis
   * @param {Object} position - Position to bound
   * @returns {Object} Bounded position
   */
  applyNaturalBoundaries(position) {
    return {
      x: Math.max(this.naturalBoundaries.minX, Math.min(this.naturalBoundaries.maxX, position.x)),
      y: Math.max(this.naturalBoundaries.minY, Math.min(this.naturalBoundaries.maxY, position.y)),
      z: Math.max(this.naturalBoundaries.minZ, Math.min(this.naturalBoundaries.maxZ, position.z))
    };
  }

  /**
   * Update movement history for analysis
   * @param {Object} position - Current position
   * @param {number} confidence - Detection confidence
   */
  updateMovementHistory(position, confidence) {
    this.movementHistory.push({
      ...position,
      confidence,
      timestamp: Date.now()
    });

    // Keep history size manageable
    if (this.movementHistory.length > this.maxHistorySize) {
      this.movementHistory.shift();
    }

    // Analyze and update natural boundaries
    this.analyzeNaturalBoundaries();
  }

  /**
   * Analyze movement history to determine natural interaction boundaries
   */
  analyzeNaturalBoundaries() {
    if (this.movementHistory.length < 10) return;

    // Calculate 95th percentile boundaries from movement history
    const positions = this.movementHistory.filter(pos => pos.confidence > 0.7);
    if (positions.length < 5) return;

    const xValues = positions.map(p => p.x).sort((a, b) => a - b);
    const yValues = positions.map(p => p.y).sort((a, b) => a - b);
    const zValues = positions.map(p => p.z).sort((a, b) => a - b);

    const percentile5 = Math.floor(positions.length * 0.05);
    const percentile95 = Math.floor(positions.length * 0.95);

    // Update boundaries with some padding
    const padding = 5;
    this.naturalBoundaries = {
      minX: xValues[percentile5] - padding,
      maxX: xValues[percentile95] + padding,
      minY: yValues[percentile5] - padding,
      maxY: yValues[percentile95] + padding,
      minZ: zValues[percentile5] - padding,
      maxZ: zValues[percentile95] + padding
    };
  }

  /**
   * Calculate mapping quality score
   * @param {Object} originalPosition - Original hand position
   * @param {number} confidence - Detection confidence
   * @param {Object} mappedPosition - Mapped position
   * @returns {number} Quality score (0-1)
   */
  calculateMappingQuality(originalPosition, confidence, mappedPosition) {
    let quality = confidence;

    // Check for excessive jitter
    if (this.movementHistory.length > 1) {
      const lastPos = this.movementHistory[this.movementHistory.length - 1];
      const jitter = Math.sqrt(
        Math.pow(mappedPosition.x - lastPos.x, 2) +
        Math.pow(mappedPosition.y - lastPos.y, 2)
      );

      if (jitter > 5) {
        quality *= 0.8; // Reduce quality for jittery movement
      }
    }

    // Check if position is within natural boundaries
    const withinBounds = (
      mappedPosition.x >= this.naturalBoundaries.minX &&
      mappedPosition.x <= this.naturalBoundaries.maxX &&
      mappedPosition.y >= this.naturalBoundaries.minY &&
      mappedPosition.y <= this.naturalBoundaries.maxY
    );

    if (!withinBounds) {
      quality *= 0.9; // Slight penalty for out-of-bounds positions
    }

    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Start calibration process
   * @param {Object} options - Calibration options
   * @returns {Object} Calibration session info
   */
  startCalibration(options = {}) {
    console.log('🎯 Starting adaptive calibration...');

    this.calibrationData = {
      centerX: 0, centerY: 0, centerZ: 0,
      scaleX: 1, scaleY: 1, scaleZ: 1,
      offsetX: 0, offsetY: 0, offsetZ: 0,
      points: [],
      startTime: Date.now()
    };

    return {
      isActive: true,
      pointsNeeded: 6, // center, left, right, top, bottom, depth
      currentPoint: 0,
      instructions: 'Move your hand to the center of your comfortable interaction area'
    };
  }

  /**
   * Add calibration point
   * @param {Object} handPosition - Hand position for calibration
   * @param {string} pointType - Type of calibration point
   * @returns {Object} Calibration progress
   */
  addCalibrationPoint(handPosition, pointType) {
    if (!this.calibrationData) {
      throw new Error('Calibration not started');
    }

    this.calibrationData.points.push({
      type: pointType,
      position: { ...handPosition },
      timestamp: Date.now()
    });

    console.log(`📍 Added calibration point: ${pointType}`, handPosition);

    // Check if calibration is complete
    if (this.calibrationData.points.length >= 6) {
      this.completeCalibration();
      return { isComplete: true, success: true };
    }

    return {
      isComplete: false,
      pointsCollected: this.calibrationData.points.length,
      nextInstruction: this.getNextCalibrationInstruction()
    };
  }

  /**
   * Complete calibration and calculate transformation parameters
   */
  completeCalibration() {
    const points = this.calibrationData.points;

    // Find center point
    const centerPoint = points.find(p => p.type === 'center');
    if (centerPoint) {
      this.calibrationData.centerX = centerPoint.position.x;
      this.calibrationData.centerY = centerPoint.position.y;
      this.calibrationData.centerZ = centerPoint.position.z || 0;
    }

    // Calculate scale factors based on boundary points
    const leftPoint = points.find(p => p.type === 'left');
    const rightPoint = points.find(p => p.type === 'right');
    const topPoint = points.find(p => p.type === 'top');
    const bottomPoint = points.find(p => p.type === 'bottom');

    if (leftPoint && rightPoint) {
      const xRange = Math.abs(rightPoint.position.x - leftPoint.position.x);
      this.calibrationData.scaleX = 80 / xRange; // Map to 80 unit scene width
    }

    if (topPoint && bottomPoint) {
      const yRange = Math.abs(topPoint.position.y - bottomPoint.position.y);
      this.calibrationData.scaleY = 60 / yRange; // Map to 60 unit scene height
    }

    this.isCalibrated = true;
    this.saveCalibrationData();

    console.log('✅ Calibration completed successfully');
    console.log('📊 Calibration data:', this.calibrationData);
  }

  /**
   * Get next calibration instruction
   * @returns {string} Instruction text
   */
  getNextCalibrationInstruction() {
    const pointCount = this.calibrationData.points.length;
    const instructions = [
      'Move your hand to the center of your interaction area',
      'Move your hand to the left edge of your comfort zone',
      'Move your hand to the right edge of your comfort zone',
      'Move your hand to the top of your comfort zone',
      'Move your hand to the bottom of your comfort zone',
      'Move your hand closer to the camera',
      'Move your hand further from the camera'
    ];

    return instructions[pointCount] || 'Calibration complete';
  }

  /**
   * Reset calibration data
   */
  resetCalibration() {
    this.calibrationData = null;
    this.isCalibrated = false;
    localStorage.removeItem('adaptiveCanvasMapper_calibration');
    console.log('🔄 Calibration reset');
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance data
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      naturalBoundaries: this.naturalBoundaries,
      adaptiveParams: this.adaptiveParams,
      isCalibrated: this.isCalibrated
    };
  }

  /**
   * Update scene dimensions (for responsive design)
   * @param {HTMLCanvasElement} sceneElement - Updated scene element
   */
  updateSceneDimensions(sceneElement) {
    this.detectSceneCapabilities(sceneElement);
    this.calculateTransformationMatrix();
    console.log('🔄 Scene dimensions updated');
  }
}

export default AdaptiveCanvasMapper;
