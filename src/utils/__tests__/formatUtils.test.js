/**
 * Test suite for formatUtils.js
 * Tests safe formatting functions to ensure they handle edge cases properly
 */

import {
  safeFormatNumber,
  safeFormatCoordinate,
  safeFormatScale,
  safeFormatInteger,
  safeFormatPercentage,
  safeFormatPosition,
  safeFormatScaleValue,
  safeFormatTime,
  validateNumericValue,
  isValidNumber,
  formatObjectInfo
} from '../formatUtils.js';

describe('formatUtils', () => {
  describe('safeFormatNumber', () => {
    test('formats valid numbers correctly', () => {
      expect(safeFormatNumber(1.234, 2)).toBe('1.23');
      expect(safeFormatNumber(5, 1)).toBe('5.0');
      expect(safeFormatNumber(0, 0)).toBe('0');
    });

    test('handles invalid inputs with fallback', () => {
      expect(safeFormatNumber(null, 1, 'fallback')).toBe('fallback');
      expect(safeFormatNumber(undefined, 1, 'fallback')).toBe('fallback');
      expect(safeFormatNumber('string', 1, 'fallback')).toBe('fallback');
      expect(safeFormatNumber(NaN, 1, 'fallback')).toBe('fallback');
      expect(safeFormatNumber(Infinity, 1, 'fallback')).toBe('fallback');
    });
  });

  describe('safeFormatScaleValue', () => {
    test('formats numeric scale values', () => {
      expect(safeFormatScaleValue(1.5)).toBe('1.50');
      expect(safeFormatScaleValue(2)).toBe('2.00');
    });

    test('extracts x component from Vector3-like objects', () => {
      const vector3Like = { x: 1.5, y: 2.0, z: 3.0 };
      expect(safeFormatScaleValue(vector3Like)).toBe('1.50');
    });

    test('handles invalid scale objects', () => {
      expect(safeFormatScaleValue(null)).toBe('1.00');
      expect(safeFormatScaleValue(undefined)).toBe('1.00');
      expect(safeFormatScaleValue({})).toBe('1.00');
      expect(safeFormatScaleValue({ y: 1.5 })).toBe('1.00'); // no x property
    });
  });

  describe('safeFormatPosition', () => {
    test('formats valid position objects', () => {
      const position = { x: 1.234, y: 5.678, z: 9.012 };
      const result = safeFormatPosition(position, 1);
      expect(result).toEqual({
        x: '1.2',
        y: '5.7',
        z: '9.0'
      });
    });

    test('handles null/undefined positions', () => {
      const result = safeFormatPosition(null);
      expect(result).toEqual({
        x: '0.0',
        y: '0.0',
        z: '0.0'
      });
    });

    test('handles partial position objects', () => {
      const position = { x: 1.5, z: 3.5 }; // missing y
      const result = safeFormatPosition(position, 1);
      expect(result).toEqual({
        x: '1.5',
        y: '0.0', // fallback for missing y
        z: '3.5'
      });
    });
  });

  describe('formatObjectInfo', () => {
    test('formats complete object info', () => {
      const obj = {
        position: { x: 1.234, y: 5.678, z: 9.012 },
        scale: { x: 1.5, y: 1.5, z: 1.5 },
        rotation: { x: 0.1, y: 0.2, z: 0.3 }
      };
      
      const result = formatObjectInfo(obj);
      expect(result.position.x).toBe('1.2');
      expect(result.scale).toBe('1.50');
      expect(result.rotation.x).toBe('0.1');
    });

    test('handles null object', () => {
      const result = formatObjectInfo(null);
      expect(result.position).toEqual({
        x: '0.0',
        y: '0.0',
        z: '0.0'
      });
      expect(result.scale).toBe('1.00');
    });
  });

  describe('isValidNumber', () => {
    test('identifies valid numbers', () => {
      expect(isValidNumber(1)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-1.5)).toBe(true);
    });

    test('identifies invalid numbers', () => {
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
      expect(isValidNumber('1')).toBe(false);
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
    });
  });

  describe('validateNumericValue', () => {
    test('validates and clamps numeric values', () => {
      expect(validateNumericValue(5, 0, 10, 0)).toBe(5);
      expect(validateNumericValue(-5, 0, 10, 0)).toBe(0); // clamped to min
      expect(validateNumericValue(15, 0, 10, 0)).toBe(10); // clamped to max
    });

    test('returns default for invalid values', () => {
      expect(validateNumericValue(NaN, 0, 10, 5)).toBe(5);
      expect(validateNumericValue('string', 0, 10, 5)).toBe(5);
      expect(validateNumericValue(null, 0, 10, 5)).toBe(5);
    });
  });
});

// Integration test to simulate the original error scenario
describe('Integration test for TypeError fix', () => {
  test('simulates ObjectsHUD component usage without errors', () => {
    // Simulate the problematic data structure that caused the original error
    const problematicObj = {
      id: 1,
      type: 'cube',
      position: { x: 10.5, y: 20.3, z: 5.7 },
      scale: { x: 1.5, y: 1.5, z: 1.5 }, // This was the Vector3 object causing issues
      isSelected: false,
      isGrabbed: false
    };

    // Test that our safe formatting functions handle this correctly
    expect(() => {
      const scaleDisplay = safeFormatScaleValue(problematicObj.scale, 1);
      const posXDisplay = safeFormatInteger(problematicObj.position?.x);
      const posYDisplay = safeFormatInteger(problematicObj.position?.y);
      
      // These should not throw errors
      expect(scaleDisplay).toBe('1.5');
      expect(posXDisplay).toBe('11'); // rounded to integer
      expect(posYDisplay).toBe('20'); // rounded to integer
    }).not.toThrow();
  });

  test('handles the exact error case from InteractiveObject.getStatus()', () => {
    // Simulate the data structure returned by InteractiveObject.getStatus() after our fix
    const objectStatus = {
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

    // Test that the ObjectsHUD formatting works correctly
    expect(() => {
      const scaleDisplay = safeFormatScaleValue(objectStatus.scale, 1);
      const posXDisplay = safeFormatInteger(objectStatus.position?.x);
      const posYDisplay = safeFormatInteger(objectStatus.position?.y);
      
      expect(scaleDisplay).toBe('1.5');
      expect(posXDisplay).toBe('11');
      expect(posYDisplay).toBe('20');
    }).not.toThrow();
  });
});
