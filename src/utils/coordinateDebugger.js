/**
 * Coordinate Debugging Utility
 * Helps debug hand tracking alignment issues by logging coordinate transformations
 */

export class CoordinateDebugger {
  constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
    this.logCount = 0;
    this.maxLogs = 10; // Limit console spam
  }

  /**
   * Log coordinate transformation details
   * @param {Object} params - Debug parameters
   */
  logTransformation(params) {
    if (!this.enabled || this.logCount >= this.maxLogs) return;

    const {
      originalX,
      originalY,
      transformedX,
      transformedY,
      canvasWidth,
      canvasHeight,
      videoWidth,
      videoHeight,
      landmarkIndex
    } = params;

    console.group(`🎯 Coordinate Transform ${landmarkIndex || 'unknown'}`);
    console.log('Original:', { x: originalX, y: originalY });
    console.log('Transformed:', { x: transformedX, y: transformedY });
    console.log('Canvas:', { width: canvasWidth, height: canvasHeight });
    console.log('Video:', { width: videoWidth, height: videoHeight });
    console.log('Scale factors:', {
      x: canvasWidth / videoWidth,
      y: canvasHeight / videoHeight
    });
    console.groupEnd();

    this.logCount++;
  }

  /**
   * Log video and canvas dimensions
   * @param {Object} dimensions - Dimension data
   */
  logDimensions(dimensions) {
    if (!this.enabled) return;

    const {
      videoElement,
      canvasElement,
      canvasRect
    } = dimensions;

    console.group('📐 Dimensions Debug');
    console.log('Video element:', {
      width: videoElement.width,
      height: videoElement.height,
      videoWidth: videoElement.videoWidth,
      videoHeight: videoElement.videoHeight,
      clientWidth: videoElement.clientWidth,
      clientHeight: videoElement.clientHeight
    });
    console.log('Canvas element:', {
      width: canvasElement.width,
      height: canvasElement.height,
      clientWidth: canvasElement.clientWidth,
      clientHeight: canvasElement.clientHeight
    });
    console.log('Canvas rect:', {
      width: canvasRect.width,
      height: canvasRect.height,
      top: canvasRect.top,
      left: canvasRect.left
    });
    console.groupEnd();
  }

  /**
   * Validate landmark coordinates
   * @param {Array} landmarks - Hand landmarks
   * @returns {Object} Validation results
   */
  validateLandmarks(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return { valid: false, reason: 'No landmarks provided' };
    }

    const issues = [];
    let normalizedCount = 0;
    let pixelCount = 0;

    landmarks.forEach((landmark, index) => {
      if (!landmark || landmark.length < 2) {
        issues.push(`Landmark ${index}: Invalid format`);
        return;
      }

      const [x, y] = landmark;

      // Check if coordinates are normalized [0,1]
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        normalizedCount++;
      } else if (x > 1 || y > 1) {
        pixelCount++;
      } else {
        issues.push(`Landmark ${index}: Unusual coordinates (${x}, ${y})`);
      }
    });

    const result = {
      valid: issues.length === 0,
      issues: issues,
      totalLandmarks: landmarks.length,
      normalizedCount: normalizedCount,
      pixelCount: pixelCount,
      coordinateFormat: normalizedCount > pixelCount ? 'normalized' : 'pixel'
    };

    if (this.enabled && issues.length > 0) {
      console.warn('🚨 Landmark validation issues:', result);
    }

    return result;
  }

  /**
   * Test coordinate transformation with known values
   * @param {Function} transformFunction - Transform function to test
   * @param {Object} testParams - Test parameters
   */
  testTransformation(transformFunction, testParams) {
    if (!this.enabled) return;

    const {
      canvasWidth = 640,
      canvasHeight = 480,
      videoWidth = 640,
      videoHeight = 480
    } = testParams;

    const testCases = [
      { x: 0, y: 0, expected: 'top-left' },
      { x: 1, y: 0, expected: 'top-right (before mirroring)' },
      { x: 0.5, y: 0.5, expected: 'center' },
      { x: 0, y: 1, expected: 'bottom-left' },
      { x: 1, y: 1, expected: 'bottom-right (before mirroring)' }
    ];

    console.group('🧪 Coordinate Transform Test');
    testCases.forEach(testCase => {
      const result = transformFunction(
        testCase.x,
        testCase.y,
        canvasWidth,
        canvasHeight,
        videoWidth,
        videoHeight
      );
      console.log(`${testCase.expected}:`, {
        input: { x: testCase.x, y: testCase.y },
        output: result
      });
    });
    console.groupEnd();
  }

  /**
   * Reset log counter
   */
  reset() {
    this.logCount = 0;
  }

  /**
   * Enable/disable debugging
   * @param {boolean} enabled - Enable state
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const coordinateDebugger = new CoordinateDebugger();

/**
 * Quick debug function for coordinate issues
 * @param {Object} handState - Current hand state
 * @param {Object} canvasInfo - Canvas information
 */
export const debugHandAlignment = (handState, canvasInfo) => {
  if (!coordinateDebugger.enabled) return;

  console.group('🎯 Hand Alignment Debug');
  
  if (handState.landmarks && handState.landmarks.length > 0) {
    const validation = coordinateDebugger.validateLandmarks(handState.landmarks);
    console.log('Landmark validation:', validation);
    
    // Log first few landmarks for inspection
    console.log('Sample landmarks:', handState.landmarks.slice(0, 5));
  }

  if (handState.position) {
    console.log('Hand position:', handState.position);
  }

  if (canvasInfo) {
    console.log('Canvas info:', canvasInfo);
  }

  console.groupEnd();
};

export default coordinateDebugger;
