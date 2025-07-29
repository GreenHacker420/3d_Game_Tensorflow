/**
 * Hand Detection Web Worker
 * Processes hand detection in a separate thread for better performance
 */

// Note: TensorFlow.js imports will be handled by the build system
// For now, we'll disable the worker functionality and use fallback

class HandDetectionWorker {
  constructor() {
    this.model = null;
    this.isInitialized = false;
    this.isProcessing = false;
    this.frameQueue = [];
    this.maxQueueSize = 3;
    
    // Performance tracking
    this.performanceMetrics = {
      processedFrames: 0,
      averageProcessingTime: 0,
      lastProcessingTime: 0,
      droppedFrames: 0
    };

    // Adaptive parameters
    this.adaptiveParams = {
      confidenceThreshold: 0.7,
      maxHands: 1,
      flipHorizontal: false,
      staticImageMode: false
    };

    console.log('🔧 HandDetectionWorker initialized');
  }

  /**
   * Initialize the hand detection model
   */
  async initialize() {
    try {
      console.log('🚀 Initializing TensorFlow.js HandPose model in worker...');

      // Set TensorFlow.js backend
      await tf.setBackend('webgl');
      await tf.ready();

      // Create hand detector
      const model = handPoseDetection.SupportedModels.MediaPipeHands;
      const detectorConfig = {
        runtime: 'tfjs',
        modelType: 'full',
        maxHands: this.adaptiveParams.maxHands,
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
      };

      this.model = await handPoseDetection.createDetector(model, detectorConfig);
      this.isInitialized = true;

      console.log('✅ HandPose model initialized in worker');
      
      // Notify main thread
      self.postMessage({
        type: 'initialized',
        success: true
      });

    } catch (error) {
      console.error('❌ Failed to initialize HandPose model in worker:', error);
      
      self.postMessage({
        type: 'initialized',
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Process video frame for hand detection
   * @param {ImageData} imageData - Video frame data
   * @param {Object} options - Processing options
   */
  async processFrame(imageData, options = {}) {
    if (!this.isInitialized || this.isProcessing) {
      // Drop frame if still processing or not initialized
      this.performanceMetrics.droppedFrames++;
      return;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      // Create tensor from image data
      const tensor = tf.browser.fromPixels(imageData);
      
      // Detect hands
      const predictions = await this.model.estimateHands(tensor, {
        flipHorizontal: this.adaptiveParams.flipHorizontal,
        staticImageMode: this.adaptiveParams.staticImageMode
      });

      // Clean up tensor
      tensor.dispose();

      // Process predictions
      const processedPredictions = this.processPredictions(predictions);

      // Calculate processing time
      const processingTime = performance.now() - startTime;
      this.updatePerformanceMetrics(processingTime);

      // Send results back to main thread
      self.postMessage({
        type: 'detection_result',
        predictions: processedPredictions,
        processingTime: processingTime,
        frameId: options.frameId,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Error processing frame in worker:', error);
      
      self.postMessage({
        type: 'detection_error',
        error: error.message,
        frameId: options.frameId
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process raw predictions to extract useful data
   * @param {Array} predictions - Raw hand predictions
   * @returns {Array} Processed predictions
   */
  processPredictions(predictions) {
    if (!predictions || predictions.length === 0) {
      return [];
    }

    return predictions.map(prediction => {
      // Extract hand landmarks
      const landmarks = prediction.keypoints.map(keypoint => [
        keypoint.x,
        keypoint.y,
        keypoint.z || 0
      ]);

      // Calculate hand center
      const handCenter = this.calculateHandCenter(landmarks);

      // Calculate finger spread
      const fingerSpread = this.calculateFingerSpread(landmarks);

      // Detect pinch gesture
      const pinchData = this.detectPinch(landmarks);

      // Calculate hand orientation
      const handOrientation = this.calculateHandOrientation(landmarks);

      // Calculate bounding box
      const boundingBox = this.calculateBoundingBox(landmarks);

      return {
        landmarks: landmarks,
        handCenter: handCenter,
        fingerSpread: fingerSpread,
        pinchData: pinchData,
        handOrientation: handOrientation,
        boundingBox: boundingBox,
        confidence: prediction.score || 0,
        handedness: prediction.handedness || 'Unknown'
      };
    });
  }

  /**
   * Calculate hand center from landmarks
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Hand center position
   */
  calculateHandCenter(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return { x: 0, y: 0, z: 0 };
    }

    // Use wrist (landmark 0) as center, or calculate average
    const wrist = landmarks[0];
    return {
      x: wrist[0],
      y: wrist[1],
      z: wrist[2] || 0
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

    const distance = Math.sqrt(
      Math.pow(thumbTip[0] - pinkyTip[0], 2) +
      Math.pow(thumbTip[1] - pinkyTip[1], 2)
    );

    return distance;
  }

  /**
   * Detect pinch gesture
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Pinch detection data
   */
  detectPinch(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { isPinched: false, distance: 0 };
    }

    // Calculate distance between thumb tip and index finger tip
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];

    const distance = Math.sqrt(
      Math.pow(thumbTip[0] - indexTip[0], 2) +
      Math.pow(thumbTip[1] - indexTip[1], 2)
    );

    const isPinched = distance < 30; // Threshold for pinch detection

    return {
      isPinched: isPinched,
      distance: distance
    };
  }

  /**
   * Calculate hand orientation
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Hand orientation angles
   */
  calculateHandOrientation(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return { pitch: 0, yaw: 0, roll: 0 };
    }

    // Use wrist and middle finger MCP to calculate orientation
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    // Calculate basic orientation
    const dx = middleMCP[0] - wrist[0];
    const dy = middleMCP[1] - wrist[1];
    const dz = (middleMCP[2] || 0) - (wrist[2] || 0);

    // Convert to angles (simplified)
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));
    const yaw = Math.atan2(dx, dz);
    const roll = 0; // Would need more complex calculation

    return {
      pitch: pitch,
      yaw: yaw,
      roll: roll
    };
  }

  /**
   * Calculate bounding box for hand
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Bounding box coordinates
   */
  calculateBoundingBox(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = landmarks.map(point => point[0]);
    const ys = landmarks.map(point => point[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Update performance metrics
   * @param {number} processingTime - Time taken to process frame
   */
  updatePerformanceMetrics(processingTime) {
    this.performanceMetrics.processedFrames++;
    this.performanceMetrics.lastProcessingTime = processingTime;
    
    // Calculate rolling average
    const alpha = 0.1;
    this.performanceMetrics.averageProcessingTime = 
      this.performanceMetrics.averageProcessingTime * (1 - alpha) + 
      processingTime * alpha;
  }

  /**
   * Update adaptive parameters
   * @param {Object} params - New parameters
   */
  updateAdaptiveParameters(params) {
    this.adaptiveParams = { ...this.adaptiveParams, ...params };
    console.log('🔧 Worker adaptive parameters updated:', params);
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      isInitialized: this.isInitialized,
      isProcessing: this.isProcessing,
      memoryUsage: tf.memory()
    };
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
    console.log('🔄 HandDetectionWorker disposed');
  }
}

// Create worker instance
const worker = new HandDetectionWorker();

// Handle messages from main thread
self.onmessage = async function(event) {
  const { type, data } = event.data;

  switch (type) {
    case 'initialize':
      await worker.initialize();
      break;

    case 'process_frame':
      await worker.processFrame(data.imageData, data.options);
      break;

    case 'update_params':
      worker.updateAdaptiveParameters(data);
      break;

    case 'get_metrics':
      self.postMessage({
        type: 'metrics',
        data: worker.getPerformanceMetrics()
      });
      break;

    case 'dispose':
      worker.dispose();
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};
