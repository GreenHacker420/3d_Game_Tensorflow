/**
 * WebWorker Manager for Hand Detection
 * Manages communication with hand detection web worker for improved performance
 */

export class WebWorkerManager {
  constructor(options = {}) {
    this.config = {
      workerPath: new URL('../workers/handDetectionWorker.js', import.meta.url),
      maxConcurrentFrames: 2,
      frameTimeout: 1000, // 1 second timeout
      enableFallback: true,
      ...options
    };

    this.worker = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.pendingFrames = new Map();
    this.frameIdCounter = 0;

    // Performance tracking
    this.performanceMetrics = {
      totalFramesProcessed: 0,
      averageLatency: 0,
      workerUtilization: 0,
      fallbackUsage: 0,
      errors: 0
    };

    // Callbacks
    this.onDetectionResult = null;
    this.onError = null;
    this.onInitialized = null;

    // Fallback detection engine (for when worker fails)
    this.fallbackEngine = null;

    console.log('🔧 WebWorkerManager initialized with config:', this.config);
  }

  /**
   * Initialize the web worker
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.isInitialized || this.isInitializing) {
      return this.isInitialized;
    }

    this.isInitializing = true;

    try {
      // Check if web workers are supported
      if (typeof Worker === 'undefined') {
        console.warn('⚠️ Web Workers not supported, using fallback');
        return this.initializeFallback();
      }

      // For production builds, use fallback due to TensorFlow.js import complexity
      if (import.meta.env.PROD) {
        console.log('🔧 Using main thread processing in production build');
        return this.initializeFallback();
      }

      // Create worker
      this.worker = new Worker(this.config.workerPath, { type: 'module' });

      // Set up message handling
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      // Initialize worker
      this.worker.postMessage({ type: 'initialize' });

      // Wait for initialization
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('❌ Worker initialization timeout');
          this.initializeFallback();
          resolve(false);
        }, 10000);

        this.onInitialized = (success) => {
          clearTimeout(timeout);
          this.isInitializing = false;
          this.isInitialized = success;
          resolve(success);
        };
      });

    } catch (error) {
      console.error('❌ Failed to initialize WebWorker:', error);
      this.isInitializing = false;
      return this.initializeFallback();
    }
  }

  /**
   * Initialize fallback detection engine
   * @returns {Promise<boolean>} Success status
   */
  async initializeFallback() {
    try {
      // Import fallback engine dynamically
      const { HandDetectionEngine } = await import('./HandDetectionEngine.js');
      this.fallbackEngine = new HandDetectionEngine();
      
      await this.fallbackEngine.initialize();
      this.isInitialized = true;
      this.performanceMetrics.fallbackUsage++;

      console.log('✅ Fallback detection engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize fallback engine:', error);
      return false;
    }
  }

  /**
   * Process video frame for hand detection
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {Promise<Array>} Hand detection results
   */
  async processFrame(videoElement) {
    if (!this.isInitialized) {
      throw new Error('WebWorkerManager not initialized');
    }

    // Use fallback if worker is not available
    if (!this.worker || this.fallbackEngine) {
      return this.processFallback(videoElement);
    }

    // Check if we have too many pending frames
    if (this.pendingFrames.size >= this.config.maxConcurrentFrames) {
      console.warn('⚠️ Too many pending frames, dropping frame');
      return [];
    }

    const frameId = this.frameIdCounter++;
    const startTime = performance.now();

    try {
      // Extract image data from video
      const imageData = this.extractImageData(videoElement);

      // Send to worker
      this.worker.postMessage({
        type: 'process_frame',
        data: {
          imageData: imageData,
          options: { frameId: frameId }
        }
      });

      // Create promise for result
      return new Promise((resolve, reject) => {
        // Set timeout
        const timeout = setTimeout(() => {
          this.pendingFrames.delete(frameId);
          console.warn('⚠️ Frame processing timeout, using fallback');
          this.processFallback(videoElement).then(resolve).catch(reject);
        }, this.config.frameTimeout);

        // Store pending frame
        this.pendingFrames.set(frameId, {
          resolve,
          reject,
          timeout,
          startTime
        });
      });

    } catch (error) {
      console.error('❌ Error processing frame:', error);
      this.performanceMetrics.errors++;
      
      if (this.config.enableFallback) {
        return this.processFallback(videoElement);
      }
      throw error;
    }
  }

  /**
   * Process frame using fallback engine
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {Promise<Array>} Hand detection results
   */
  async processFallback(videoElement) {
    if (!this.fallbackEngine) {
      await this.initializeFallback();
    }

    if (!this.fallbackEngine) {
      throw new Error('No detection engine available');
    }

    this.performanceMetrics.fallbackUsage++;
    return this.fallbackEngine.detectHands(videoElement);
  }

  /**
   * Extract image data from video element
   * @param {HTMLVideoElement} videoElement - Video element
   * @returns {ImageData} Image data
   */
  extractImageData(videoElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = videoElement.videoWidth || videoElement.width;
    canvas.height = videoElement.videoHeight || videoElement.height;
    
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * Handle messages from worker
   * @param {MessageEvent} event - Worker message event
   */
  handleWorkerMessage(event) {
    const { type, predictions, frameId, processingTime, error, success } = event.data;

    switch (type) {
      case 'initialized':
        if (this.onInitialized) {
          this.onInitialized(success);
        }
        break;

      case 'detection_result':
        this.handleDetectionResult(frameId, predictions, processingTime);
        break;

      case 'detection_error':
        this.handleDetectionError(frameId, error);
        break;

      case 'metrics':
        // Handle worker metrics if needed
        break;

      default:
        console.warn('Unknown worker message type:', type);
    }
  }

  /**
   * Handle detection result from worker
   * @param {number} frameId - Frame ID
   * @param {Array} predictions - Detection predictions
   * @param {number} processingTime - Processing time
   */
  handleDetectionResult(frameId, predictions, processingTime) {
    const pendingFrame = this.pendingFrames.get(frameId);
    if (!pendingFrame) {
      return; // Frame already timed out or processed
    }

    // Clear timeout and remove from pending
    clearTimeout(pendingFrame.timeout);
    this.pendingFrames.delete(frameId);

    // Update performance metrics
    const totalLatency = performance.now() - pendingFrame.startTime;
    this.updatePerformanceMetrics(totalLatency, processingTime);

    // Convert worker predictions to expected format
    const formattedPredictions = this.formatPredictions(predictions);

    // Resolve promise
    pendingFrame.resolve(formattedPredictions);

    // Notify callback if set
    if (this.onDetectionResult) {
      this.onDetectionResult(formattedPredictions);
    }
  }

  /**
   * Handle detection error from worker
   * @param {number} frameId - Frame ID
   * @param {string} error - Error message
   */
  handleDetectionError(frameId, error) {
    const pendingFrame = this.pendingFrames.get(frameId);
    if (!pendingFrame) {
      return;
    }

    clearTimeout(pendingFrame.timeout);
    this.pendingFrames.delete(frameId);

    this.performanceMetrics.errors++;

    // Reject promise
    pendingFrame.reject(new Error(error));

    // Notify callback if set
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * Handle worker errors
   * @param {ErrorEvent} event - Error event
   */
  handleWorkerError(event) {
    console.error('❌ Worker error:', event.error);
    this.performanceMetrics.errors++;

    // Fallback to main thread processing
    if (this.config.enableFallback && !this.fallbackEngine) {
      this.initializeFallback();
    }

    if (this.onError) {
      this.onError(event.error);
    }
  }

  /**
   * Format worker predictions to match expected format
   * @param {Array} workerPredictions - Predictions from worker
   * @returns {Array} Formatted predictions
   */
  formatPredictions(workerPredictions) {
    if (!workerPredictions || workerPredictions.length === 0) {
      return [];
    }

    return workerPredictions.map(prediction => ({
      landmarks: prediction.landmarks,
      handInViewConfidence: prediction.confidence,
      boundingBox: {
        topLeft: [prediction.boundingBox.x, prediction.boundingBox.y],
        bottomRight: [
          prediction.boundingBox.x + prediction.boundingBox.width,
          prediction.boundingBox.y + prediction.boundingBox.height
        ]
      },
      // Additional data from worker processing
      handCenter: prediction.handCenter,
      fingerSpread: prediction.fingerSpread,
      pinchData: prediction.pinchData,
      handOrientation: prediction.handOrientation,
      handedness: prediction.handedness
    }));
  }

  /**
   * Update performance metrics
   * @param {number} totalLatency - Total latency including communication
   * @param {number} processingTime - Worker processing time
   */
  updatePerformanceMetrics(totalLatency, processingTime) {
    this.performanceMetrics.totalFramesProcessed++;
    
    // Update average latency
    const alpha = 0.1;
    this.performanceMetrics.averageLatency = 
      this.performanceMetrics.averageLatency * (1 - alpha) + 
      totalLatency * alpha;

    // Update worker utilization
    const utilization = processingTime / totalLatency;
    this.performanceMetrics.workerUtilization = 
      this.performanceMetrics.workerUtilization * (1 - alpha) + 
      utilization * alpha;
  }

  /**
   * Update worker parameters
   * @param {Object} params - Parameters to update
   */
  updateWorkerParameters(params) {
    if (this.worker) {
      this.worker.postMessage({
        type: 'update_params',
        data: params
      });
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      isInitialized: this.isInitialized,
      isUsingWorker: !!this.worker && !this.fallbackEngine,
      pendingFrames: this.pendingFrames.size,
      workerAvailable: typeof Worker !== 'undefined'
    };
  }

  /**
   * Dispose resources
   */
  dispose() {
    // Clear pending frames
    this.pendingFrames.forEach(frame => {
      clearTimeout(frame.timeout);
      frame.reject(new Error('WebWorkerManager disposed'));
    });
    this.pendingFrames.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.postMessage({ type: 'dispose' });
      this.worker.terminate();
      this.worker = null;
    }

    // Dispose fallback engine
    if (this.fallbackEngine) {
      this.fallbackEngine.dispose();
      this.fallbackEngine = null;
    }

    this.isInitialized = false;
    console.log('🔄 WebWorkerManager disposed');
  }
}

export default WebWorkerManager;
