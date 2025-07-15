/**
 * Performance monitoring utility for tracking FPS, latency, and other metrics
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      latency: 0,
      frameCount: 0,
      lastFrameTime: 0,
      averageLatency: 0,
      minFps: Infinity,
      maxFps: 0
    };

    this.frameHistory = [];
    this.latencyHistory = [];
    this.historySize = 60; // Keep 60 frames of history
    this.updateInterval = 60; // Update metrics every 60 frames
    this.onMetricsUpdate = null;
    
    this.isMonitoring = false;
    this.startTime = 0;
  }

  /**
   * Start performance monitoring
   */
  start() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.startTime = performance.now();
    this.metrics.lastFrameTime = this.startTime;
    
    console.log('📊 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stop() {
    this.isMonitoring = false;
    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Record a frame for FPS calculation
   */
  recordFrame() {
    if (!this.isMonitoring) {
      return;
    }

    const currentTime = performance.now();
    this.metrics.frameCount++;

    // Add frame time to history
    this.frameHistory.push(currentTime);
    
    // Keep only recent history
    if (this.frameHistory.length > this.historySize) {
      this.frameHistory.shift();
    }

    // Calculate FPS every updateInterval frames
    if (this.metrics.frameCount % this.updateInterval === 0) {
      this.calculateFPS(currentTime);
      this.notifyMetricsUpdate();
    }
  }

  /**
   * Record latency for a specific operation
   * @param {number} latency - Latency in milliseconds
   */
  recordLatency(latency) {
    if (!this.isMonitoring) {
      return;
    }

    this.metrics.latency = latency;
    this.latencyHistory.push(latency);

    // Keep only recent history
    if (this.latencyHistory.length > this.historySize) {
      this.latencyHistory.shift();
    }

    // Calculate average latency
    this.calculateAverageLatency();
  }

  /**
   * Calculate FPS from frame history
   * @param {number} currentTime - Current timestamp
   */
  calculateFPS(currentTime) {
    if (this.frameHistory.length < 2) {
      return;
    }

    const timeSpan = currentTime - this.metrics.lastFrameTime;
    const fps = (this.updateInterval * 1000) / timeSpan;
    
    this.metrics.fps = Math.round(fps);
    this.metrics.lastFrameTime = currentTime;

    // Track min/max FPS
    if (fps < this.metrics.minFps) {
      this.metrics.minFps = fps;
    }
    if (fps > this.metrics.maxFps) {
      this.metrics.maxFps = fps;
    }
  }

  /**
   * Calculate average latency from history
   */
  calculateAverageLatency() {
    if (this.latencyHistory.length === 0) {
      return;
    }

    const sum = this.latencyHistory.reduce((acc, val) => acc + val, 0);
    this.metrics.averageLatency = Math.round(sum / this.latencyHistory.length);
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get detailed performance statistics
   * @returns {Object} Detailed statistics
   */
  getDetailedStats() {
    const uptime = this.isMonitoring ? performance.now() - this.startTime : 0;
    
    return {
      ...this.metrics,
      uptime: Math.round(uptime),
      isMonitoring: this.isMonitoring,
      frameHistorySize: this.frameHistory.length,
      latencyHistorySize: this.latencyHistory.length
    };
  }

  /**
   * Check if performance is good
   * @returns {Object} Performance status
   */
  getPerformanceStatus() {
    const status = {
      overall: 'good',
      fps: 'good',
      latency: 'good',
      warnings: []
    };

    // Check FPS
    if (this.metrics.fps < 30) {
      status.fps = 'poor';
      status.warnings.push('Low FPS detected');
    } else if (this.metrics.fps < 45) {
      status.fps = 'fair';
      status.warnings.push('FPS could be better');
    }

    // Check latency
    if (this.metrics.averageLatency > 50) {
      status.latency = 'poor';
      status.warnings.push('High latency detected');
    } else if (this.metrics.averageLatency > 30) {
      status.latency = 'fair';
      status.warnings.push('Latency could be better');
    }

    // Overall status
    if (status.fps === 'poor' || status.latency === 'poor') {
      status.overall = 'poor';
    } else if (status.fps === 'fair' || status.latency === 'fair') {
      status.overall = 'fair';
    }

    return status;
  }

  /**
   * Reset all metrics and history
   */
  reset() {
    this.metrics = {
      fps: 0,
      latency: 0,
      frameCount: 0,
      lastFrameTime: 0,
      averageLatency: 0,
      minFps: Infinity,
      maxFps: 0
    };

    this.frameHistory = [];
    this.latencyHistory = [];
    this.startTime = performance.now();
    this.metrics.lastFrameTime = this.startTime;

    console.log('🔄 Performance metrics reset');
  }

  /**
   * Set metrics update callback
   * @param {Function} callback - Callback function
   */
  setMetricsUpdateCallback(callback) {
    this.onMetricsUpdate = callback;
  }

  /**
   * Notify metrics update
   */
  notifyMetricsUpdate() {
    if (this.onMetricsUpdate) {
      this.onMetricsUpdate(this.getMetrics());
    }
  }

  /**
   * Get performance recommendations
   * @returns {Array} Array of recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const status = this.getPerformanceStatus();

    if (status.fps === 'poor') {
      recommendations.push('Consider reducing scene complexity or lowering quality settings');
      recommendations.push('Check if hardware acceleration is enabled');
    }

    if (status.latency === 'poor') {
      recommendations.push('Check network connection if using remote resources');
      recommendations.push('Consider optimizing hand detection settings');
    }

    if (this.metrics.frameCount > 1000 && this.metrics.maxFps - this.metrics.minFps > 30) {
      recommendations.push('Frame rate is unstable, consider enabling V-Sync');
    }

    return recommendations;
  }

  /**
   * Export performance data for analysis
   * @returns {Object} Exportable performance data
   */
  exportData() {
    return {
      timestamp: Date.now(),
      metrics: this.getDetailedStats(),
      status: this.getPerformanceStatus(),
      recommendations: this.getRecommendations(),
      frameHistory: [...this.frameHistory],
      latencyHistory: [...this.latencyHistory]
    };
  }
}

export default PerformanceMonitor;
