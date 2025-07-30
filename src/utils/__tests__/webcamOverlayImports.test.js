/**
 * Test suite to verify that WebcamHandOverlay imports are working correctly
 * and the ReferenceError for debugHandAlignment is fixed
 */

import { coordinateDebugger, debugHandAlignment } from '../coordinateDebugger.js';

describe('WebcamHandOverlay Import Fix', () => {
  test('should import coordinateDebugger successfully', () => {
    expect(coordinateDebugger).toBeDefined();
    expect(typeof coordinateDebugger).toBe('object');
    expect(coordinateDebugger.enabled).toBeDefined();
    expect(typeof coordinateDebugger.logTransformation).toBe('function');
    expect(typeof coordinateDebugger.testTransformation).toBe('function');
  });

  test('should import debugHandAlignment successfully', () => {
    expect(debugHandAlignment).toBeDefined();
    expect(typeof debugHandAlignment).toBe('function');
  });

  test('coordinateDebugger should have required methods', () => {
    const requiredMethods = [
      'logTransformation',
      'logDimensions', 
      'validateLandmarks',
      'testTransformation',
      'reset',
      'setEnabled'
    ];

    requiredMethods.forEach(method => {
      expect(typeof coordinateDebugger[method]).toBe('function');
    });
  });

  test('debugHandAlignment should accept handState and canvasInfo parameters', () => {
    // Mock handState and canvasInfo
    const mockHandState = {
      landmarks: [[0.5, 0.5], [0.6, 0.6]],
      position: { x: 0.5, y: 0.5 },
      confidence: 0.8,
      isTracking: true
    };

    const mockCanvasInfo = {
      canvasWidth: 640,
      canvasHeight: 480,
      videoWidth: 640,
      videoHeight: 480,
      displayWidth: 640,
      displayHeight: 480
    };

    // This should not throw an error
    expect(() => {
      debugHandAlignment(mockHandState, mockCanvasInfo);
    }).not.toThrow();
  });

  test('coordinateDebugger should handle test transformation', () => {
    const mockTransformFunction = (x, y, canvasWidth, canvasHeight, videoWidth, videoHeight) => {
      return { x: x * canvasWidth, y: y * canvasHeight };
    };

    const testParams = {
      canvasWidth: 640,
      canvasHeight: 480,
      videoWidth: 640,
      videoHeight: 480
    };

    // This should not throw an error
    expect(() => {
      coordinateDebugger.testTransformation(mockTransformFunction, testParams);
    }).not.toThrow();
  });

  test('coordinateDebugger should validate landmarks correctly', () => {
    const validLandmarks = [
      [0.1, 0.2], [0.3, 0.4], [0.5, 0.6]
    ];

    const result = coordinateDebugger.validateLandmarks(validLandmarks);
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result.valid).toBeDefined();
    expect(result.totalLandmarks).toBe(3);
    expect(result.coordinateFormat).toBe('normalized');
  });
});
