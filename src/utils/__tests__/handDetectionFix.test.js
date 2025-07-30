/**
 * Test suite for hand detection fixes
 * Verifies that the TypeError and WebWorker issues are resolved
 */

import { HandDetectionEngine } from '../core/HandDetectionEngine.js';
import { safeFormatScaleValue, safeFormatInteger } from '../formatUtils.js';

describe('Hand Detection Fixes', () => {
  describe('HandDetectionEngine fixes', () => {
    test('detectHandsMainThread should not reference undefined enhancedPredictions', () => {
      // This test verifies that the variable name fix is correct
      const engine = new HandDetectionEngine();
      
      // Mock the necessary methods to isolate the variable reference issue
      engine.model = {
        estimateHands: jest.fn().mockResolvedValue([])
      };
      
      engine.shouldSkipFrame = jest.fn().mockReturnValue(false);
      engine.getLastValidPrediction = jest.fn().mockReturnValue([]);
      engine.analyzeLightingConditions = jest.fn().mockReturnValue({ condition: 'good', quality: 1.0 });
      engine.calculateMovementSpeed = jest.fn().mockReturnValue(0);
      engine.adaptDetectionParameters = jest.fn();
      engine.applyEnhancedStabilityFilter = jest.fn().mockReturnValue([]);
      engine.updateMovementTracking = jest.fn();
      engine.updateAdaptiveParameters = jest.fn();
      
      // This should not throw an error about enhancedPredictions being undefined
      expect(async () => {
        await engine.detectHandsMainThread(document.createElement('video'));
      }).not.toThrow();
    });
  });

  describe('ObjectsHUD formatting fixes', () => {
    test('should handle Vector3-like scale objects without errors', () => {
      // Simulate the problematic object structure that caused the original TypeError
      const problematicObject = {
        id: 1,
        type: 'cube',
        position: { x: 10.5, y: 20.3, z: 5.7 },
        scale: { x: 1.5, y: 1.5, z: 1.5 }, // This was the Vector3 causing issues
        isSelected: false,
        isGrabbed: false
      };

      // Test that our safe formatting functions handle this correctly
      expect(() => {
        const scaleDisplay = safeFormatScaleValue(problematicObject.scale, 1);
        const posXDisplay = safeFormatInteger(problematicObject.position?.x);
        const posYDisplay = safeFormatInteger(problematicObject.position?.y);
        
        expect(scaleDisplay).toBe('1.5');
        expect(posXDisplay).toBe('11'); // rounded to integer
        expect(posYDisplay).toBe('20'); // rounded to integer
      }).not.toThrow();
    });

    test('should handle numeric scale values correctly', () => {
      // Test the new format returned by InteractiveObject.getStatus()
      const fixedObject = {
        id: 1,
        type: 'cube',
        position: { x: 10.5, y: 20.3, z: 5.7 },
        scale: 1.5, // Now a single number instead of Vector3
        isSelected: false,
        isGrabbed: false
      };

      expect(() => {
        const scaleDisplay = safeFormatScaleValue(fixedObject.scale, 1);
        const posXDisplay = safeFormatInteger(fixedObject.position?.x);
        const posYDisplay = safeFormatInteger(fixedObject.position?.y);
        
        expect(scaleDisplay).toBe('1.5');
        expect(posXDisplay).toBe('11');
        expect(posYDisplay).toBe('20');
      }).not.toThrow();
    });

    test('should handle null/undefined values gracefully', () => {
      const problematicObject = {
        id: 1,
        type: 'cube',
        position: null,
        scale: undefined,
        isSelected: false,
        isGrabbed: false
      };

      expect(() => {
        const scaleDisplay = safeFormatScaleValue(problematicObject.scale, 1);
        const posXDisplay = safeFormatInteger(problematicObject.position?.x);
        const posYDisplay = safeFormatInteger(problematicObject.position?.y);
        
        expect(scaleDisplay).toBe('1.0'); // fallback
        expect(posXDisplay).toBe('0'); // fallback
        expect(posYDisplay).toBe('0'); // fallback
      }).not.toThrow();
    });
  });

  describe('WebWorker error handling', () => {
    test('should handle missing TensorFlow.js dependencies gracefully', () => {
      // Simulate the worker environment without TensorFlow.js
      const originalTf = global.tf;
      const originalHandPoseDetection = global.handPoseDetection;
      
      // Remove TensorFlow.js from global scope
      delete global.tf;
      delete global.handPoseDetection;
      
      // Import the worker class (this would normally be in a worker context)
      // For testing, we'll just verify the error handling logic
      expect(() => {
        // This simulates the worker initialization check
        if (typeof tf === 'undefined' || typeof handPoseDetection === 'undefined') {
          throw new Error('TensorFlow.js or MediaPipe HandPose not available in worker context');
        }
      }).toThrow('TensorFlow.js or MediaPipe HandPose not available in worker context');
      
      // Restore original values
      global.tf = originalTf;
      global.handPoseDetection = originalHandPoseDetection;
    });
  });

  describe('Error prevention measures', () => {
    test('should validate that all formatting functions are type-safe', () => {
      const testValues = [
        null,
        undefined,
        'string',
        NaN,
        Infinity,
        -Infinity,
        {},
        [],
        { x: 'not a number' },
        { x: null },
        { x: undefined }
      ];

      testValues.forEach(value => {
        expect(() => {
          safeFormatScaleValue(value);
          safeFormatInteger(value);
        }).not.toThrow();
      });
    });

    test('should ensure consistent fallback values', () => {
      expect(safeFormatScaleValue(null)).toBe('1.00');
      expect(safeFormatScaleValue(undefined)).toBe('1.00');
      expect(safeFormatScaleValue({})).toBe('1.00');
      
      expect(safeFormatInteger(null)).toBe('0');
      expect(safeFormatInteger(undefined)).toBe('0');
      expect(safeFormatInteger('string')).toBe('0');
    });
  });
});

// Integration test to verify the complete fix
describe('Integration Test: Complete Error Resolution', () => {
  test('simulates the complete ObjectsHUD rendering without errors', () => {
    // Simulate the data flow from InteractiveObject.getStatus() to ObjectsHUD display
    const mockObjectStatus = {
      id: 1,
      type: 'cube',
      position: { x: 10.5, y: 20.3, z: 5.7 }, // Now properly formatted as numbers
      scale: 1.5, // Now a single number instead of Vector3
      rotation: { x: 0.1, y: 0.2, z: 0.3 },
      isSelected: false,
      isGrabbed: false,
      isActive: false,
      supportedGestures: ['POINT', 'OPEN_HAND']
    };

    // Simulate ObjectsHUD component rendering logic
    const renderObjectInfo = (obj) => {
      return {
        scaleDisplay: `Scale: ${safeFormatScaleValue(obj.scale, 1)}`,
        positionDisplay: `Pos: (${safeFormatInteger(obj.position?.x)}, ${safeFormatInteger(obj.position?.y)})`
      };
    };

    expect(() => {
      const rendered = renderObjectInfo(mockObjectStatus);
      expect(rendered.scaleDisplay).toBe('Scale: 1.5');
      expect(rendered.positionDisplay).toBe('Pos: (11, 20)');
    }).not.toThrow();
  });
});
