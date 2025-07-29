/**
 * Kalman Filter for Hand Tracking
 * Provides predictive tracking and smooth position estimation for hand movements
 */

export class KalmanFilter {
  constructor(options = {}) {
    // State vector: [x, y, z, vx, vy, vz] (position and velocity)
    this.stateSize = 6;
    this.measurementSize = 3;

    // Configuration parameters
    this.config = {
      processNoise: options.processNoise || 0.01,
      measurementNoise: options.measurementNoise || 0.1,
      initialUncertainty: options.initialUncertainty || 1.0,
      adaptiveNoise: options.adaptiveNoise || true,
      confidenceWeighting: options.confidenceWeighting || true,
      ...options
    };

    // State vector [x, y, z, vx, vy, vz]
    this.state = new Array(this.stateSize).fill(0);
    
    // Error covariance matrix (6x6)
    this.errorCovariance = this.createIdentityMatrix(this.stateSize, this.config.initialUncertainty);
    
    // Process noise covariance matrix (6x6)
    this.processNoiseCovariance = this.createProcessNoiseMatrix();
    
    // Measurement noise covariance matrix (3x3)
    this.measurementNoiseCovariance = this.createIdentityMatrix(this.measurementSize, this.config.measurementNoise);
    
    // State transition matrix (6x6) - constant velocity model
    this.stateTransition = this.createStateTransitionMatrix();
    
    // Measurement matrix (3x6) - we observe position only
    this.measurementMatrix = this.createMeasurementMatrix();

    // Tracking state
    this.isInitialized = false;
    this.lastUpdateTime = 0;
    this.predictionHistory = [];
    this.maxHistorySize = 10;

    // Adaptive parameters
    this.adaptiveParams = {
      innovationHistory: [],
      maxInnovationHistory: 20,
      baseProcessNoise: this.config.processNoise,
      baseMeasurementNoise: this.config.measurementNoise
    };

    console.log('🎯 KalmanFilter initialized with config:', this.config);
  }

  /**
   * Initialize the filter with the first measurement
   * @param {Object} measurement - Initial position {x, y, z}
   * @param {number} confidence - Measurement confidence (0-1)
   */
  initialize(measurement, confidence = 1.0) {
    this.state[0] = measurement.x;
    this.state[1] = measurement.y;
    this.state[2] = measurement.z || 0;
    this.state[3] = 0; // Initial velocity x
    this.state[4] = 0; // Initial velocity y
    this.state[5] = 0; // Initial velocity z

    // Adjust initial uncertainty based on confidence
    const uncertainty = this.config.initialUncertainty / Math.max(0.1, confidence);
    this.errorCovariance = this.createIdentityMatrix(this.stateSize, uncertainty);

    this.isInitialized = true;
    this.lastUpdateTime = performance.now();

    console.log('🎯 KalmanFilter initialized with measurement:', measurement);
  }

  /**
   * Predict the next state based on motion model
   * @param {number} deltaTime - Time since last update (seconds)
   * @returns {Object} Predicted position {x, y, z}
   */
  predict(deltaTime = 0.033) { // Default 30 FPS
    if (!this.isInitialized) {
      return { x: 0, y: 0, z: 0 };
    }

    // Update state transition matrix with actual delta time
    this.updateStateTransitionMatrix(deltaTime);

    // Predict state: x_k = F * x_{k-1}
    const predictedState = this.matrixVectorMultiply(this.stateTransition, this.state);

    // Predict error covariance: P_k = F * P_{k-1} * F^T + Q
    const FP = this.matrixMultiply(this.stateTransition, this.errorCovariance);
    const FPFT = this.matrixMultiply(FP, this.transpose(this.stateTransition));
    const predictedCovariance = this.matrixAdd(FPFT, this.processNoiseCovariance);

    // Store prediction
    this.state = predictedState;
    this.errorCovariance = predictedCovariance;

    const prediction = {
      x: this.state[0],
      y: this.state[1],
      z: this.state[2],
      velocity: {
        x: this.state[3],
        y: this.state[4],
        z: this.state[5]
      },
      confidence: this.calculatePredictionConfidence()
    };

    // Store in history
    this.predictionHistory.push({
      ...prediction,
      timestamp: performance.now()
    });

    if (this.predictionHistory.length > this.maxHistorySize) {
      this.predictionHistory.shift();
    }

    return prediction;
  }

  /**
   * Update the filter with a new measurement
   * @param {Object} measurement - New position measurement {x, y, z}
   * @param {number} confidence - Measurement confidence (0-1)
   * @returns {Object} Updated position estimate
   */
  update(measurement, confidence = 1.0) {
    if (!this.isInitialized) {
      this.initialize(measurement, confidence);
      return { x: measurement.x, y: measurement.y, z: measurement.z || 0 };
    }

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;

    // Predict step
    this.predict(deltaTime);

    // Measurement vector
    const z = [measurement.x, measurement.y, measurement.z || 0];

    // Adapt noise based on confidence and innovation
    if (this.config.adaptiveNoise) {
      this.adaptNoise(confidence);
    }

    // Innovation (measurement residual): y = z - H * x
    const Hx = this.matrixVectorMultiply(this.measurementMatrix, this.state);
    const innovation = this.vectorSubtract(z, Hx);

    // Innovation covariance: S = H * P * H^T + R
    const HP = this.matrixMultiply(this.measurementMatrix, this.errorCovariance);
    const HPH = this.matrixMultiply(HP, this.transpose(this.measurementMatrix));
    const innovationCovariance = this.matrixAdd(HPH, this.measurementNoiseCovariance);

    // Kalman gain: K = P * H^T * S^{-1}
    const PHT = this.matrixMultiply(this.errorCovariance, this.transpose(this.measurementMatrix));
    const kalmanGain = this.matrixMultiply(PHT, this.matrixInverse(innovationCovariance));

    // Update state: x = x + K * y
    const Ky = this.matrixVectorMultiply(kalmanGain, innovation);
    this.state = this.vectorAdd(this.state, Ky);

    // Update error covariance: P = (I - K * H) * P
    const KH = this.matrixMultiply(kalmanGain, this.measurementMatrix);
    const I_KH = this.matrixSubtract(this.createIdentityMatrix(this.stateSize, 1), KH);
    this.errorCovariance = this.matrixMultiply(I_KH, this.errorCovariance);

    // Store innovation for adaptive noise
    if (this.config.adaptiveNoise) {
      this.storeInnovation(innovation);
    }

    return {
      x: this.state[0],
      y: this.state[1],
      z: this.state[2],
      velocity: {
        x: this.state[3],
        y: this.state[4],
        z: this.state[5]
      },
      confidence: this.calculateFilterConfidence(),
      innovation: this.vectorMagnitude(innovation)
    };
  }

  /**
   * Get current position estimate without updating
   * @returns {Object} Current position estimate
   */
  getCurrentEstimate() {
    if (!this.isInitialized) {
      return { x: 0, y: 0, z: 0 };
    }

    return {
      x: this.state[0],
      y: this.state[1],
      z: this.state[2],
      velocity: {
        x: this.state[3],
        y: this.state[4],
        z: this.state[5]
      },
      confidence: this.calculateFilterConfidence()
    };
  }

  /**
   * Predict future position
   * @param {number} timeAhead - Time to predict ahead (seconds)
   * @returns {Object} Predicted future position
   */
  predictFuture(timeAhead = 0.1) {
    if (!this.isInitialized) {
      return { x: 0, y: 0, z: 0 };
    }

    const futureX = this.state[0] + this.state[3] * timeAhead;
    const futureY = this.state[1] + this.state[4] * timeAhead;
    const futureZ = this.state[2] + this.state[5] * timeAhead;

    return {
      x: futureX,
      y: futureY,
      z: futureZ,
      timeAhead: timeAhead,
      confidence: this.calculatePredictionConfidence() * Math.exp(-timeAhead * 2) // Confidence decreases with time
    };
  }

  /**
   * Reset the filter
   */
  reset() {
    this.state = new Array(this.stateSize).fill(0);
    this.errorCovariance = this.createIdentityMatrix(this.stateSize, this.config.initialUncertainty);
    this.isInitialized = false;
    this.lastUpdateTime = 0;
    this.predictionHistory = [];
    this.adaptiveParams.innovationHistory = [];
    
    console.log('🔄 KalmanFilter reset');
  }

  /**
   * Get filter performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const avgInnovation = this.adaptiveParams.innovationHistory.length > 0 ?
      this.adaptiveParams.innovationHistory.reduce((sum, inn) => sum + this.vectorMagnitude(inn), 0) / this.adaptiveParams.innovationHistory.length : 0;

    return {
      isInitialized: this.isInitialized,
      predictionHistory: this.predictionHistory.length,
      averageInnovation: avgInnovation,
      currentProcessNoise: this.config.processNoise,
      currentMeasurementNoise: this.config.measurementNoise,
      filterConfidence: this.calculateFilterConfidence()
    };
  }

  // === HELPER METHODS ===

  /**
   * Create identity matrix
   */
  createIdentityMatrix(size, scale = 1) {
    const matrix = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        matrix[i][j] = (i === j) ? scale : 0;
      }
    }
    return matrix;
  }

  /**
   * Create process noise covariance matrix
   */
  createProcessNoiseMatrix() {
    const Q = this.createIdentityMatrix(this.stateSize, 0);
    
    // Position noise
    Q[0][0] = this.config.processNoise;
    Q[1][1] = this.config.processNoise;
    Q[2][2] = this.config.processNoise;
    
    // Velocity noise (smaller)
    Q[3][3] = this.config.processNoise * 0.1;
    Q[4][4] = this.config.processNoise * 0.1;
    Q[5][5] = this.config.processNoise * 0.1;
    
    return Q;
  }

  /**
   * Create state transition matrix (constant velocity model)
   */
  createStateTransitionMatrix(dt = 0.033) {
    const F = this.createIdentityMatrix(this.stateSize, 1);
    
    // Position = position + velocity * dt
    F[0][3] = dt; // x += vx * dt
    F[1][4] = dt; // y += vy * dt
    F[2][5] = dt; // z += vz * dt
    
    return F;
  }

  /**
   * Update state transition matrix with actual delta time
   */
  updateStateTransitionMatrix(dt) {
    this.stateTransition[0][3] = dt;
    this.stateTransition[1][4] = dt;
    this.stateTransition[2][5] = dt;
  }

  /**
   * Create measurement matrix (observe position only)
   */
  createMeasurementMatrix() {
    const H = [];
    for (let i = 0; i < this.measurementSize; i++) {
      H[i] = [];
      for (let j = 0; j < this.stateSize; j++) {
        H[i][j] = (i === j) ? 1 : 0; // Only observe position components
      }
    }
    return H;
  }

  /**
   * Matrix multiplication
   */
  matrixMultiply(A, B) {
    const rows = A.length;
    const cols = B[0].length;
    const inner = B.length;
    const result = [];

    for (let i = 0; i < rows; i++) {
      result[i] = [];
      for (let j = 0; j < cols; j++) {
        result[i][j] = 0;
        for (let k = 0; k < inner; k++) {
          result[i][j] += A[i][k] * B[k][j];
        }
      }
    }
    return result;
  }

  /**
   * Matrix-vector multiplication
   */
  matrixVectorMultiply(matrix, vector) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
      result[i] = 0;
      for (let j = 0; j < vector.length; j++) {
        result[i] += matrix[i][j] * vector[j];
      }
    }
    return result;
  }

  /**
   * Matrix transpose
   */
  transpose(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const result = [];

    for (let i = 0; i < cols; i++) {
      result[i] = [];
      for (let j = 0; j < rows; j++) {
        result[i][j] = matrix[j][i];
      }
    }
    return result;
  }

  /**
   * Matrix addition
   */
  matrixAdd(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j] + B[i][j];
      }
    }
    return result;
  }

  /**
   * Matrix subtraction
   */
  matrixSubtract(A, B) {
    const result = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < A[i].length; j++) {
        result[i][j] = A[i][j] - B[i][j];
      }
    }
    return result;
  }

  /**
   * Vector addition
   */
  vectorAdd(a, b) {
    return a.map((val, i) => val + b[i]);
  }

  /**
   * Vector subtraction
   */
  vectorSubtract(a, b) {
    return a.map((val, i) => val - b[i]);
  }

  /**
   * Vector magnitude
   */
  vectorMagnitude(vector) {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Simple matrix inverse for 3x3 matrices (innovation covariance)
   */
  matrixInverse(matrix) {
    if (matrix.length === 3 && matrix[0].length === 3) {
      return this.inverse3x3(matrix);
    }
    // For larger matrices, use a more general method or library
    throw new Error('Matrix inverse only implemented for 3x3 matrices');
  }

  /**
   * 3x3 matrix inverse
   */
  inverse3x3(m) {
    const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
                m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
                m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

    if (Math.abs(det) < 1e-10) {
      // Matrix is singular, return identity with small values
      return this.createIdentityMatrix(3, 0.001);
    }

    const invDet = 1.0 / det;
    const result = [
      [
        (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet,
        (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet,
        (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet
      ],
      [
        (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet,
        (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet,
        (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet
      ],
      [
        (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet,
        (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet,
        (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet
      ]
    ];

    return result;
  }

  /**
   * Adapt noise parameters based on innovation and confidence
   */
  adaptNoise(confidence) {
    // Increase measurement noise for low confidence measurements
    const confidenceFactor = Math.max(0.1, confidence);
    this.measurementNoiseCovariance = this.createIdentityMatrix(
      this.measurementSize,
      this.adaptiveParams.baseMeasurementNoise / confidenceFactor
    );

    // Adapt process noise based on innovation magnitude
    if (this.adaptiveParams.innovationHistory.length > 5) {
      const recentInnovations = this.adaptiveParams.innovationHistory.slice(-5);
      const avgInnovation = recentInnovations.reduce((sum, inn) => sum + this.vectorMagnitude(inn), 0) / recentInnovations.length;

      // Increase process noise if innovation is high (model mismatch)
      const innovationFactor = Math.max(0.5, Math.min(3.0, avgInnovation / 10));
      this.config.processNoise = this.adaptiveParams.baseProcessNoise * innovationFactor;
      this.processNoiseCovariance = this.createProcessNoiseMatrix();
    }
  }

  /**
   * Store innovation for adaptive noise calculation
   */
  storeInnovation(innovation) {
    this.adaptiveParams.innovationHistory.push([...innovation]);

    if (this.adaptiveParams.innovationHistory.length > this.adaptiveParams.maxInnovationHistory) {
      this.adaptiveParams.innovationHistory.shift();
    }
  }

  /**
   * Calculate prediction confidence based on error covariance
   */
  calculatePredictionConfidence() {
    if (!this.isInitialized) return 0;

    // Use trace of position covariance as uncertainty measure
    const positionUncertainty = this.errorCovariance[0][0] + this.errorCovariance[1][1] + this.errorCovariance[2][2];

    // Convert uncertainty to confidence (0-1)
    return Math.max(0, Math.min(1, 1 / (1 + positionUncertainty)));
  }

  /**
   * Calculate overall filter confidence
   */
  calculateFilterConfidence() {
    if (!this.isInitialized) return 0;

    const predictionConf = this.calculatePredictionConfidence();
    const historyFactor = Math.min(1, this.predictionHistory.length / 5); // More confident with more history

    return predictionConf * historyFactor;
  }
}

export default KalmanFilter;
