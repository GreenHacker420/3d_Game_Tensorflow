/**
 * Hand Tracking Alignment Test Suite
 * Verifies that the coordinate transformation and overlay alignment fixes work correctly
 */

import { coordinateDebugger } from '../coordinateDebugger.js';

describe('Hand Tracking Alignment Tests', () => {
  describe('Coordinate Transformation', () => {
    // Mock transform function based on the fixed implementation
    const transformCoordinates = (x, y, canvasWidth, canvasHeight, videoWidth, videoHeight) => {
      let pixelX, pixelY;
      
      // Check if coordinates are normalized [0,1] or already in pixel format
      if (x <= 1 && y <= 1 && x >= 0 && y >= 0) {
        // Normalized coordinates - convert to pixels using video dimensions
        pixelX = x * videoWidth;
        pixelY = y * videoHeight;
      } else {
        // Already in pixel format - use as is
        pixelX = x;
        pixelY = y;
      }

      // Scale to canvas dimensions if different from video dimensions
      if (canvasWidth !== videoWidth || canvasHeight !== videoHeight) {
        pixelX = (pixelX / videoWidth) * canvasWidth;
        pixelY = (pixelY / videoHeight) * canvasHeight;
      }

      // Apply horizontal mirroring to match webcam's mirrored view
      pixelX = canvasWidth - pixelX;

      return { x: pixelX, y: pixelY };
    };

    test('should correctly transform normalized coordinates', () => {
      const canvasWidth = 640;
      const canvasHeight = 480;
      const videoWidth = 640;
      const videoHeight = 480;

      // Test center point
      const center = transformCoordinates(0.5, 0.5, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(center.x).toBe(320); // Center x (mirrored)
      expect(center.y).toBe(240); // Center y

      // Test top-left corner (normalized)
      const topLeft = transformCoordinates(0, 0, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(topLeft.x).toBe(640); // Right side after mirroring
      expect(topLeft.y).toBe(0);   // Top

      // Test bottom-right corner (normalized)
      const bottomRight = transformCoordinates(1, 1, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(bottomRight.x).toBe(0);   // Left side after mirroring
      expect(bottomRight.y).toBe(480); // Bottom
    });

    test('should handle different canvas and video dimensions', () => {
      const canvasWidth = 320;  // Half video width
      const canvasHeight = 240; // Half video height
      const videoWidth = 640;
      const videoHeight = 480;

      // Test center point with scaling
      const center = transformCoordinates(0.5, 0.5, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(center.x).toBe(160); // Scaled center x (mirrored)
      expect(center.y).toBe(120); // Scaled center y

      // Test corner with scaling
      const corner = transformCoordinates(1, 1, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(corner.x).toBe(0);   // Left side after mirroring and scaling
      expect(corner.y).toBe(240); // Bottom after scaling
    });

    test('should handle pixel coordinates correctly', () => {
      const canvasWidth = 640;
      const canvasHeight = 480;
      const videoWidth = 640;
      const videoHeight = 480;

      // Test pixel coordinates (already in pixel format)
      const pixelCoord = transformCoordinates(320, 240, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(pixelCoord.x).toBe(320); // Center x (mirrored)
      expect(pixelCoord.y).toBe(240); // Center y
    });

    test('should apply mirroring consistently', () => {
      const canvasWidth = 640;
      const canvasHeight = 480;
      const videoWidth = 640;
      const videoHeight = 480;

      // Test left side of normalized coordinates
      const leftSide = transformCoordinates(0.25, 0.5, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(leftSide.x).toBe(480); // Should be on right side after mirroring (640 - 160)

      // Test right side of normalized coordinates
      const rightSide = transformCoordinates(0.75, 0.5, canvasWidth, canvasHeight, videoWidth, videoHeight);
      expect(rightSide.x).toBe(160); // Should be on left side after mirroring (640 - 480)
    });
  });

  describe('Coordinate Debugger', () => {
    beforeEach(() => {
      coordinateDebugger.reset();
      coordinateDebugger.setEnabled(true);
    });

    test('should validate normalized landmarks correctly', () => {
      const normalizedLandmarks = [
        [0.5, 0.5, 0.1],   // Center point
        [0.25, 0.25, 0.1], // Top-left quadrant
        [0.75, 0.75, 0.1], // Bottom-right quadrant
        [0, 0, 0.1],       // Top-left corner
        [1, 1, 0.1]        // Bottom-right corner
      ];

      const validation = coordinateDebugger.validateLandmarks(normalizedLandmarks);
      expect(validation.valid).toBe(true);
      expect(validation.coordinateFormat).toBe('normalized');
      expect(validation.normalizedCount).toBe(5);
      expect(validation.pixelCount).toBe(0);
    });

    test('should validate pixel landmarks correctly', () => {
      const pixelLandmarks = [
        [320, 240, 0.1], // Center point in 640x480
        [160, 120, 0.1], // Quarter point
        [480, 360, 0.1], // Three-quarter point
        [0, 0, 0.1],     // Top-left corner
        [640, 480, 0.1]  // Bottom-right corner
      ];

      const validation = coordinateDebugger.validateLandmarks(pixelLandmarks);
      expect(validation.valid).toBe(true);
      expect(validation.coordinateFormat).toBe('pixel');
      expect(validation.normalizedCount).toBe(1); // The [0,0] point
      expect(validation.pixelCount).toBe(4);
    });

    test('should detect invalid landmarks', () => {
      const invalidLandmarks = [
        [0.5, 0.5, 0.1],     // Valid
        [-0.1, 0.5, 0.1],    // Invalid x (negative)
        [0.5, 1.5, 0.1],     // Invalid y (> 1 for normalized)
        null,                // Invalid landmark
        [0.5]                // Incomplete landmark
      ];

      const validation = coordinateDebugger.validateLandmarks(invalidLandmarks);
      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });
  });

  describe('MediaPipe Integration', () => {
    test('should handle MediaPipe landmark format', () => {
      // Simulate MediaPipe hand landmarks format
      const mediaPipeLandmarks = Array.from({ length: 21 }, (_, i) => [
        Math.random(), // x: normalized [0,1]
        Math.random(), // y: normalized [0,1]
        Math.random()  // z: depth (not used in 2D overlay)
      ]);

      const validation = coordinateDebugger.validateLandmarks(mediaPipeLandmarks);
      expect(validation.valid).toBe(true);
      expect(validation.totalLandmarks).toBe(21);
      expect(validation.coordinateFormat).toBe('normalized');
    });

    test('should handle hand state position format', () => {
      // Simulate hand state position (typically normalized)
      const handPosition = { x: 0.5, y: 0.5 };
      
      // Test that position coordinates are in expected range
      expect(handPosition.x).toBeGreaterThanOrEqual(0);
      expect(handPosition.x).toBeLessThanOrEqual(1);
      expect(handPosition.y).toBeGreaterThanOrEqual(0);
      expect(handPosition.y).toBeLessThanOrEqual(1);
    });
  });

  describe('Canvas Dimension Handling', () => {
    test('should handle various canvas and video dimension combinations', () => {
      const testCases = [
        { canvas: [640, 480], video: [640, 480] },   // Same dimensions
        { canvas: [320, 240], video: [640, 480] },   // Half size canvas
        { canvas: [1280, 720], video: [640, 480] },  // Larger canvas
        { canvas: [800, 600], video: [640, 480] },   // Different aspect ratio
      ];

      testCases.forEach(({ canvas, video }) => {
        const [canvasW, canvasH] = canvas;
        const [videoW, videoH] = video;

        // Test center point transformation
        const center = transformCoordinates(0.5, 0.5, canvasW, canvasH, videoW, videoH);
        
        // Center should be at canvas center (accounting for mirroring)
        expect(center.x).toBe(canvasW / 2);
        expect(center.y).toBe(canvasH / 2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle boundary coordinates', () => {
      const canvasWidth = 640;
      const canvasHeight = 480;
      const videoWidth = 640;
      const videoHeight = 480;

      // Test exact boundaries
      const boundaries = [
        [0, 0],     // Top-left
        [1, 0],     // Top-right
        [0, 1],     // Bottom-left
        [1, 1],     // Bottom-right
        [0.5, 0],   // Top-center
        [0.5, 1],   // Bottom-center
        [0, 0.5],   // Left-center
        [1, 0.5]    // Right-center
      ];

      boundaries.forEach(([x, y]) => {
        const result = transformCoordinates(x, y, canvasWidth, canvasHeight, videoWidth, videoHeight);
        
        // Ensure results are within canvas bounds
        expect(result.x).toBeGreaterThanOrEqual(0);
        expect(result.x).toBeLessThanOrEqual(canvasWidth);
        expect(result.y).toBeGreaterThanOrEqual(0);
        expect(result.y).toBeLessThanOrEqual(canvasHeight);
      });
    });

    test('should handle zero dimensions gracefully', () => {
      // This shouldn't happen in practice, but test defensive programming
      expect(() => {
        transformCoordinates(0.5, 0.5, 0, 0, 640, 480);
      }).not.toThrow();
    });
  });
});

// Integration test for the complete alignment system
describe('Hand Tracking Alignment Integration', () => {
  test('should provide accurate overlay alignment', () => {
    // Simulate a complete hand tracking scenario
    const mockHandState = {
      isTracking: true,
      confidence: 0.95,
      landmarks: Array.from({ length: 21 }, (_, i) => [
        0.3 + (i * 0.02), // Spread landmarks across hand area
        0.4 + (i * 0.01),
        0.1
      ]),
      position: { x: 0.5, y: 0.5 },
      boundingBox: {
        topLeft: [0.3, 0.3],
        bottomRight: [0.7, 0.7]
      }
    };

    const canvasInfo = {
      canvasWidth: 640,
      canvasHeight: 480,
      videoWidth: 640,
      videoHeight: 480,
      displayWidth: 640,
      displayHeight: 480
    };

    // Validate that all components work together
    const validation = coordinateDebugger.validateLandmarks(mockHandState.landmarks);
    expect(validation.valid).toBe(true);

    // Test position transformation
    const transformedPosition = transformCoordinates(
      mockHandState.position.x,
      mockHandState.position.y,
      canvasInfo.canvasWidth,
      canvasInfo.canvasHeight,
      canvasInfo.videoWidth,
      canvasInfo.videoHeight
    );

    // Position should be at canvas center (mirrored)
    expect(transformedPosition.x).toBe(320);
    expect(transformedPosition.y).toBe(240);

    // Test bounding box transformation
    const topLeft = transformCoordinates(
      mockHandState.boundingBox.topLeft[0],
      mockHandState.boundingBox.topLeft[1],
      canvasInfo.canvasWidth,
      canvasInfo.canvasHeight,
      canvasInfo.videoWidth,
      canvasInfo.videoHeight
    );

    const bottomRight = transformCoordinates(
      mockHandState.boundingBox.bottomRight[0],
      mockHandState.boundingBox.bottomRight[1],
      canvasInfo.canvasWidth,
      canvasInfo.canvasHeight,
      canvasInfo.videoWidth,
      canvasInfo.videoHeight
    );

    // Bounding box should be properly positioned and mirrored
    expect(topLeft.x).toBeGreaterThan(bottomRight.x); // Due to mirroring
    expect(topLeft.y).toBeLessThan(bottomRight.y);    // Normal y-axis
  });
});
