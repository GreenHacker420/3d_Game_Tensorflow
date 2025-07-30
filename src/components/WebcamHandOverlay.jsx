import React, { useRef, useEffect } from 'react';
import { coordinateDebugger, debugHandAlignment } from '../utils/coordinateDebugger.js';

/**
 * Webcam Hand Overlay Component
 * Draws hand landmarks and connections directly on the webcam feed
 */
const WebcamHandOverlay = ({ 
  handState, 
  webcamRef, 
  className = '',
  showLandmarks = true,
  showConnections = true,
  showBoundingBox = true,
  lineColor = '#00ff00',
  pointColor = '#ff0000',
  confidenceThreshold = 0.5
}) => {
  const canvasRef = useRef(null);

  // Hand landmark connections (MediaPipe hand model)
  const HAND_CONNECTIONS = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm connections
    [5, 9], [9, 13], [13, 17]
  ];

  /**
   * Transform normalized coordinates to canvas coordinates
   * @param {number} x - Normalized x coordinate [0,1]
   * @param {number} y - Normalized y coordinate [0,1]
   * @param {number} canvasWidth - Canvas width in pixels
   * @param {number} canvasHeight - Canvas height in pixels
   * @param {number} videoWidth - Video stream width (optional, for scaling)
   * @param {number} videoHeight - Video stream height (optional, for scaling)
   * @returns {Object} Transformed coordinates {x, y}
   */
  const transformCoordinates = (x, y, canvasWidth, canvasHeight, videoWidth = canvasWidth, videoHeight = canvasHeight) => {
    // Convert normalized coordinates to pixel coordinates
    // Scale based on canvas dimensions (no additional mirroring needed since webcam is already mirrored)
    let pixelX = x * canvasWidth;
    let pixelY = y * canvasHeight;

    // No horizontal mirroring needed - the webcam component already handles mirroring
    // The landmarks from MediaPipe are already in the correct coordinate space for the mirrored webcam

    // Debug logging for coordinate transformation (only in development)
    if (process.env.NODE_ENV === 'development' && coordinateDebugger.enabled && coordinateDebugger.logCount < 5) {
      coordinateDebugger.logTransformation({
        originalX: x,
        originalY: y,
        transformedX: pixelX,
        transformedY: pixelY,
        canvasWidth,
        canvasHeight,
        videoWidth,
        videoHeight
      });
    }

    return { x: pixelX, y: pixelY };
  };

  /**
   * Draw hand landmarks and connections on canvas
   */
  const drawHandLandmarks = () => {
    const canvas = canvasRef.current;
    const video = webcamRef?.current?.video;

    if (!canvas || !video || !handState?.landmarks) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;

    // Set canvas size to match video
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Only draw if hand is detected with sufficient confidence
    if (!handState.isTracking || handState.confidence < confidenceThreshold) {
      return;
    }

    const landmarks = handState.landmarks;
    if (!landmarks || landmarks.length < 21) {
      return;
    }

    // Debug hand alignment (only in development)
    if (process.env.NODE_ENV === 'development') {
      debugHandAlignment(handState, {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        videoWidth,
        videoHeight,
        displayWidth,
        displayHeight
      });

      // Test coordinate transformation with known values
      if (coordinateDebugger.logCount === 0) {
        coordinateDebugger.testTransformation(transformCoordinates, {
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
          videoWidth,
          videoHeight
        });
      }
    }

    // Set drawing styles
    ctx.strokeStyle = lineColor;
    ctx.fillStyle = pointColor;
    ctx.lineWidth = 2;

    // Draw connections first (so they appear behind points)
    if (showConnections) {
      ctx.beginPath();
      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        if (landmarks[startIdx] && landmarks[endIdx]) {
          const start = landmarks[startIdx];
          const end = landmarks[endIdx];

          // Transform coordinates with proper scaling
          const startCoords = transformCoordinates(start[0], start[1], canvas.width, canvas.height, videoWidth, videoHeight);
          const endCoords = transformCoordinates(end[0], end[1], canvas.width, canvas.height, videoWidth, videoHeight);

          ctx.moveTo(startCoords.x, startCoords.y);
          ctx.lineTo(endCoords.x, endCoords.y);
        }
      });
      ctx.stroke();
    }

    // Draw landmark points
    if (showLandmarks) {
      landmarks.forEach((landmark, index) => {
        if (landmark) {
          // Transform coordinates with proper scaling
          const coords = transformCoordinates(landmark[0], landmark[1], canvas.width, canvas.height, videoWidth, videoHeight);

          ctx.beginPath();
          ctx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI);
          ctx.fill();

          // Draw landmark index for debugging (optional)
          if (index === 0 || index === 4 || index === 8 || index === 12 || index === 16 || index === 20) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.fillText(index.toString(), coords.x + 6, coords.y - 6);
            ctx.fillStyle = pointColor;
          }
        }
      });
    }

    // Draw bounding box
    if (showBoundingBox && handState.boundingBox) {
      const bbox = handState.boundingBox;
      if (bbox.topLeft && bbox.bottomRight) {
        // Transform bounding box coordinates with proper scaling
        const topLeftCoords = transformCoordinates(bbox.topLeft[0], bbox.topLeft[1], canvas.width, canvas.height, videoWidth, videoHeight);
        const bottomRightCoords = transformCoordinates(bbox.bottomRight[0], bbox.bottomRight[1], canvas.width, canvas.height, videoWidth, videoHeight);

        // Calculate width and height (accounting for mirroring)
        const x = Math.min(topLeftCoords.x, bottomRightCoords.x);
        const y = Math.min(topLeftCoords.y, bottomRightCoords.y);
        const width = Math.abs(bottomRightCoords.x - topLeftCoords.x);
        const height = Math.abs(bottomRightCoords.y - topLeftCoords.y);

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw confidence text
        ctx.fillStyle = '#ffff00';
        ctx.font = '14px Arial';
        ctx.fillText(
          `${Math.round(handState.confidence * 100)}%`,
          x,
          y - 5
        );
      }
    }

    // Draw gesture indicator
    if (handState.gesture && handState.gesture !== 'NO_HAND' && handState.gesture !== 'NONE') {
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 16px Arial';
      ctx.fillText(
        handState.gesture.replace('_', ' '),
        10,
        30
      );
    }

    // Draw hand center point
    if (handState.position) {
      // Transform hand center coordinates with proper scaling
      const centerCoords = transformCoordinates(handState.position.x, handState.position.y, canvas.width, canvas.height, videoWidth, videoHeight);

      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerCoords.x, centerCoords.y, 8, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(centerCoords.x - 10, centerCoords.y);
      ctx.lineTo(centerCoords.x + 10, centerCoords.y);
      ctx.moveTo(centerCoords.x, centerCoords.y - 10);
      ctx.lineTo(centerCoords.x, centerCoords.y + 10);
      ctx.stroke();
    }
  };

  /**
   * Update canvas when hand state changes
   */
  useEffect(() => {
    drawHandLandmarks();
  }, [handState, showLandmarks, showConnections, showBoundingBox]);

  /**
   * Set up animation loop for smooth updates
   */
  useEffect(() => {
    let animationId;
    
    const animate = () => {
      drawHandLandmarks();
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 pointer-events-none z-10 ${className}`}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  );
};

export default WebcamHandOverlay;
