/**
 * 3D Motion Mode Manager
 * Handles switching between 2D and 3D tracking modes, manages calibration, and provides fallback mechanisms
 */

import { ThreeDCoordinateMapper } from './3DCoordinateMapper.js';

export const TRACKING_MODES = {
  MODE_2D: '2d_tracking',
  MODE_3D: '3d_motion'
};

export class ThreeDMotionModeManager {
  constructor() {
    this.currentMode = TRACKING_MODES.MODE_2D;
    this.coordinateMapper = new ThreeDCoordinateMapper();
    this.isInitialized = false;
    
    // Performance monitoring
    this.performanceMetrics = {
      fps: 0,
      latency: 0,
      qualityScore: 1.0,
      frameCount: 0,
      lastFrameTime: 0
    };

    // Fallback thresholds
    this.fallbackThresholds = {
      minFPS: 20,
      minQuality: 0.4,
      maxLatency: 100 // ms
    };

    // Mode switching cooldown
    this.lastModeSwitch = 0;
    this.modeSwitchCooldown = 1000; // ms

    // Event callbacks
    this.onModeChange = null;
    this.onCalibrationRequired = null;
    this.onPerformanceWarning = null;
  }

  /**
   * Initialize the 3D Motion Mode Manager
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize coordinate mapper
      this.coordinateMapper.initialize();
      
      // Load saved mode preference
      const savedMode = localStorage.getItem('tracking-mode');
      if (savedMode && Object.values(TRACKING_MODES).includes(savedMode)) {
        this.currentMode = savedMode;
      }

      this.isInitialized = true;
      console.log('✅ 3D Motion Mode Manager initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize 3D Motion Mode Manager:', error);
      throw error;
    }
  }

  /**
   * Switch tracking mode
   * @param {string} mode - Target mode (2d_tracking or 3d_motion)
   * @param {boolean} force - Force switch even if on cooldown
   * @returns {boolean} Success status
   */
  switchMode(mode, force = false) {
    if (!Object.values(TRACKING_MODES).includes(mode)) {
      console.error('❌ Invalid tracking mode:', mode);
      return false;
    }

    // Check cooldown
    const now = Date.now();
    if (!force && (now - this.lastModeSwitch) < this.modeSwitchCooldown) {
      console.warn('⚠️ Mode switch on cooldown');
      return false;
    }

    // Check if 3D mode is available
    if (mode === TRACKING_MODES.MODE_3D && !this.coordinateMapper.isCalibrated) {
      console.warn('⚠️ 3D mode requires calibration');
      if (this.onCalibrationRequired) {
        this.onCalibrationRequired();
      }
      return false;
    }

    const previousMode = this.currentMode;
    this.currentMode = mode;
    this.lastModeSwitch = now;

    // Save preference
    localStorage.setItem('tracking-mode', mode);

    // Reset performance metrics
    this.resetPerformanceMetrics();

    // Notify mode change
    if (this.onModeChange) {
      this.onModeChange(mode, previousMode);
    }

    console.log(`🔄 Switched tracking mode: ${previousMode} → ${mode}`);
    return true;
  }

  /**
   * Process hand position based on current mode
   * @param {Object} handState - Current hand state
   * @returns {Object} Processed position data
   */
  processHandPosition(handState) {
    const startTime = performance.now();

    let result;
    
    if (this.currentMode === TRACKING_MODES.MODE_3D) {
      result = this.process3DMode(handState);
    } else {
      result = this.process2DMode(handState);
    }

    // Update performance metrics
    this.updatePerformanceMetrics(startTime);

    // Check for fallback conditions
    this.checkFallbackConditions();

    return result;
  }

  /**
   * Process hand position in 3D mode
   * @param {Object} handState - Current hand state
   * @returns {Object} 3D position data
   */
  process3DMode(handState) {
    if (!handState.isTracking || !this.coordinateMapper.isCalibrated) {
      return {
        mode: TRACKING_MODES.MODE_3D,
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false
      };
    }

    // Map to 3D coordinates
    const mapped = this.coordinateMapper.mapTo3DCoordinates(
      handState.position,
      handState.confidence
    );

    return {
      mode: TRACKING_MODES.MODE_3D,
      position: mapped.position,
      quality: mapped.quality,
      isValid: mapped.isValid,
      originalPosition: handState.position
    };
  }

  /**
   * Process hand position in 2D mode (legacy)
   * @param {Object} handState - Current hand state
   * @returns {Object} 2D position data
   */
  process2DMode(handState) {
    if (!handState.isTracking) {
      return {
        mode: TRACKING_MODES.MODE_2D,
        position: { x: 0, y: 0, z: 0 },
        quality: 0,
        isValid: false
      };
    }

    // Map 2D coordinates to 3D space (legacy method)
    const sceneWidth = 80;
    const sceneHeight = 60;
    const sceneDepth = 40;

    const mappedX = ((handState.position.x / 640) * sceneWidth) - (sceneWidth / 2);
    const mappedY = ((1 - handState.position.y / 480) * sceneHeight) - (sceneHeight / 2);
    const mappedZ = (handState.fingerSpread / 200) * sceneDepth - (sceneDepth / 2);

    return {
      mode: TRACKING_MODES.MODE_2D,
      position: { x: mappedX, y: mappedY, z: mappedZ },
      quality: handState.confidence,
      isValid: handState.confidence > 0.6,
      originalPosition: handState.position
    };
  }

  /**
   * Start calibration process
   * @param {Function} onProgress - Progress callback
   * @param {Function} onComplete - Completion callback
   */
  startCalibration(onProgress, onComplete) {
    return this.coordinateMapper.startCalibration(onProgress, onComplete);
  }

  /**
   * Update performance metrics
   * @param {number} startTime - Processing start time
   */
  updatePerformanceMetrics(startTime) {
    const now = performance.now();
    const processingTime = now - startTime;
    
    // Update latency
    this.performanceMetrics.latency = processingTime;
    
    // Update FPS
    if (this.performanceMetrics.lastFrameTime > 0) {
      const deltaTime = now - this.performanceMetrics.lastFrameTime;
      this.performanceMetrics.fps = 1000 / deltaTime;
    }
    this.performanceMetrics.lastFrameTime = now;
    this.performanceMetrics.frameCount++;

    // Update quality score
    if (this.currentMode === TRACKING_MODES.MODE_3D) {
      this.performanceMetrics.qualityScore = this.coordinateMapper.qualityScore;
    }
  }

  /**
   * Check for fallback conditions
   */
  checkFallbackConditions() {
    if (this.currentMode !== TRACKING_MODES.MODE_3D) {
      return; // Only check fallback for 3D mode
    }

    const metrics = this.performanceMetrics;
    let shouldFallback = false;
    let reason = '';

    // Check FPS
    if (metrics.fps < this.fallbackThresholds.minFPS) {
      shouldFallback = true;
      reason = `Low FPS: ${metrics.fps.toFixed(1)}`;
    }

    // Check quality
    if (metrics.qualityScore < this.fallbackThresholds.minQuality) {
      shouldFallback = true;
      reason = `Low quality: ${(metrics.qualityScore * 100).toFixed(1)}%`;
    }

    // Check latency
    if (metrics.latency > this.fallbackThresholds.maxLatency) {
      shouldFallback = true;
      reason = `High latency: ${metrics.latency.toFixed(1)}ms`;
    }

    if (shouldFallback) {
      console.warn(`⚠️ Falling back to 2D mode: ${reason}`);
      this.switchMode(TRACKING_MODES.MODE_2D, true);
      
      if (this.onPerformanceWarning) {
        this.onPerformanceWarning(reason);
      }
    }
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      fps: 0,
      latency: 0,
      qualityScore: 1.0,
      frameCount: 0,
      lastFrameTime: 0
    };
  }

  /**
   * Get current mode status
   * @returns {Object} Mode status
   */
  getModeStatus() {
    return {
      currentMode: this.currentMode,
      isCalibrated: this.coordinateMapper.isCalibrated,
      performance: { ...this.performanceMetrics },
      calibrationStatus: this.coordinateMapper.getCalibrationStatus()
    };
  }

  /**
   * Set event callbacks
   * @param {Object} callbacks - Event callbacks
   */
  setCallbacks(callbacks) {
    this.onModeChange = callbacks.onModeChange || null;
    this.onCalibrationRequired = callbacks.onCalibrationRequired || null;
    this.onPerformanceWarning = callbacks.onPerformanceWarning || null;
  }

  /**
   * Reset calibration
   */
  resetCalibration() {
    this.coordinateMapper.resetCalibration();
    
    // Switch to 2D mode if currently in 3D
    if (this.currentMode === TRACKING_MODES.MODE_3D) {
      this.switchMode(TRACKING_MODES.MODE_2D, true);
    }
  }

  /**
   * Get available modes
   * @returns {Array} Available tracking modes
   */
  getAvailableModes() {
    return [
      {
        id: TRACKING_MODES.MODE_2D,
        name: '2D Tracking',
        description: 'Traditional 2D hand tracking with depth from finger spread',
        available: true,
        icon: '👋'
      },
      {
        id: TRACKING_MODES.MODE_3D,
        name: '3D Motion',
        description: 'Full 3D spatial tracking with depth estimation',
        available: this.coordinateMapper.isCalibrated,
        icon: '🎯',
        requiresCalibration: true
      }
    ];
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.coordinateMapper = null;
    this.onModeChange = null;
    this.onCalibrationRequired = null;
    this.onPerformanceWarning = null;
  }
}

export default ThreeDMotionModeManager;
