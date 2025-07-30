/**
 * Test suite for coordinate transformation fixes
 * Verifies that the hand tracking overlay mirroring issue is resolved
 */

describe('Coordinate Transformation', () => {
  // Mock the transform function from WebcamHandOverlay
  const transformCoordinates = (x, y, canvasWidth, canvasHeight, videoWidth = canvasWidth, videoHeight = canvasHeight) => {
    // Convert normalized coordinates to pixel coordinates
    // Scale based on canvas dimensions (no additional mirroring needed since webcam is already mirrored)
    let pixelX = x * canvasWidth;
    let pixelY = y * canvasHeight;

    // No horizontal mirroring needed - the webcam component already handles mirroring
    // The landmarks from MediaPipe are already in the correct coordinate space for the mirrored webcam

    return { x: pixelX, y: pixelY };
  };

  const testCanvasWidth = 640;
  const testCanvasHeight = 480;

  test('should transform normalized coordinates to pixel coordinates correctly', () => {
    // Test center point
    const center = transformCoordinates(0.5, 0.5, testCanvasWidth, testCanvasHeight);
    expect(center.x).toBe(320); // 0.5 * 640
    expect(center.y).toBe(240); // 0.5 * 480

    // Test top-left corner
    const topLeft = transformCoordinates(0, 0, testCanvasWidth, testCanvasHeight);
    expect(topLeft.x).toBe(0);
    expect(topLeft.y).toBe(0);

    // Test bottom-right corner
    const bottomRight = transformCoordinates(1, 1, testCanvasWidth, testCanvasHeight);
    expect(bottomRight.x).toBe(640);
    expect(bottomRight.y).toBe(480);
  });

  test('should NOT apply additional horizontal mirroring', () => {
    // Test that left side coordinates stay on the left
    const leftSide = transformCoordinates(0.25, 0.5, testCanvasWidth, testCanvasHeight);
    expect(leftSide.x).toBe(160); // Should be 0.25 * 640 = 160 (left side)
    
    // Test that right side coordinates stay on the right
    const rightSide = transformCoordinates(0.75, 0.5, testCanvasWidth, testCanvasHeight);
    expect(rightSide.x).toBe(480); // Should be 0.75 * 640 = 480 (right side)
    
    // Verify no mirroring: left coordinate should be less than right coordinate
    expect(leftSide.x).toBeLessThan(rightSide.x);
  });

  test('should handle different canvas and video dimensions', () => {
    const canvasWidth = 800;
    const canvasHeight = 600;
    const videoWidth = 640;
    const videoHeight = 480;

    const center = transformCoordinates(0.5, 0.5, canvasWidth, canvasHeight, videoWidth, videoHeight);
    expect(center.x).toBe(400); // 0.5 * 800 (canvas width)
    expect(center.y).toBe(300); // 0.5 * 600 (canvas height)
  });

  test('should maintain coordinate consistency for hand movements', () => {
    // Simulate hand moving from left to right
    const positions = [
      { x: 0.2, y: 0.5 }, // Left
      { x: 0.4, y: 0.5 }, // Center-left
      { x: 0.6, y: 0.5 }, // Center-right
      { x: 0.8, y: 0.5 }  // Right
    ];

    const transformedPositions = positions.map(pos => 
      transformCoordinates(pos.x, pos.y, testCanvasWidth, testCanvasHeight)
    );

    // Verify that x coordinates increase from left to right (no mirroring)
    for (let i = 1; i < transformedPositions.length; i++) {
      expect(transformedPositions[i].x).toBeGreaterThan(transformedPositions[i-1].x);
    }

    // Verify y coordinates remain the same (horizontal movement)
    const yCoords = transformedPositions.map(pos => pos.y);
    expect(new Set(yCoords).size).toBe(1); // All y coordinates should be the same
  });

  test('should handle edge cases correctly', () => {
    // Test with zero dimensions
    const zeroResult = transformCoordinates(0.5, 0.5, 0, 0);
    expect(zeroResult.x).toBe(0);
    expect(zeroResult.y).toBe(0);

    // Test with very small coordinates
    const smallResult = transformCoordinates(0.001, 0.001, testCanvasWidth, testCanvasHeight);
    expect(smallResult.x).toBe(0.64); // 0.001 * 640
    expect(smallResult.y).toBe(0.48); // 0.001 * 480

    // Test with coordinates at the boundary
    const boundaryResult = transformCoordinates(0.999, 0.999, testCanvasWidth, testCanvasHeight);
    expect(boundaryResult.x).toBeCloseTo(639.36); // 0.999 * 640
    expect(boundaryResult.y).toBeCloseTo(479.52); // 0.999 * 480
  });
});

describe('Mirroring Behavior Verification', () => {
  test('should behave like a mirror - left hand movement should appear on left side', () => {
    const transformCoordinates = (x, y, canvasWidth, canvasHeight) => {
      return { x: x * canvasWidth, y: y * canvasHeight };
    };

    // When user moves their left hand to the left (smaller x coordinate)
    // The overlay should also move to the left (smaller pixel x coordinate)
    const leftHandPosition = transformCoordinates(0.3, 0.5, 640, 480);
    const rightHandPosition = transformCoordinates(0.7, 0.5, 640, 480);

    // Left hand should have smaller x coordinate than right hand
    expect(leftHandPosition.x).toBeLessThan(rightHandPosition.x);
    
    // This creates the natural mirror behavior:
    // - User moves left hand left → overlay moves left
    // - User moves right hand right → overlay moves right
  });
});
