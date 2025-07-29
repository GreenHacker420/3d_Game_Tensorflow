import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Hand Visualization Component
 * Provides real-time confidence indicators, enhanced hand skeleton rendering,
 * and interactive visual feedback for hand tracking
 */
const EnhancedHandVisualization = ({
  handState,
  canvasRef,
  showConfidenceIndicators = true,
  showHandSkeleton = true,
  showGestureIndicator = true,
  showQualityMetrics = true,
  className = ''
}) => {
  const overlayCanvasRef = useRef(null);
  const [visualizationMetrics, setVisualizationMetrics] = useState({
    renderTime: 0,
    frameCount: 0,
    lastUpdate: Date.now()
  });

  /**
   * Hand landmark connections for skeleton rendering
   */
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
   * Draw enhanced hand visualization
   */
  const drawEnhancedVisualization = () => {
    if (!overlayCanvasRef.current || !handState.isTracking) return;

    const startTime = performance.now();
    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw hand skeleton if landmarks are available
    if (showHandSkeleton && handState.landmarks) {
      drawHandSkeleton(ctx, handState.landmarks, handState.confidence);
    }

    // Draw confidence indicators
    if (showConfidenceIndicators) {
      drawConfidenceIndicators(ctx, handState);
    }

    // Draw gesture indicator
    if (showGestureIndicator && handState.gesture) {
      drawGestureIndicator(ctx, handState.gesture, handState.confidence);
    }

    // Draw quality metrics
    if (showQualityMetrics && handState.qualityMetrics) {
      drawQualityMetrics(ctx, handState.qualityMetrics);
    }

    // Update visualization metrics
    const renderTime = performance.now() - startTime;
    setVisualizationMetrics(prev => ({
      renderTime,
      frameCount: prev.frameCount + 1,
      lastUpdate: Date.now()
    }));
  };

  /**
   * Draw enhanced hand skeleton with confidence-based styling
   */
  const drawHandSkeleton = (ctx, landmarks, confidence) => {
    if (!landmarks || landmarks.length === 0) return;

    // Set drawing style based on confidence
    const alpha = Math.max(0.3, confidence);
    const lineWidth = Math.max(1, confidence * 3);
    
    // Draw connections
    ctx.strokeStyle = `rgba(0, 255, 100, ${alpha})`;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      if (startIdx < landmarks.length && endIdx < landmarks.length) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
      }
    });

    // Draw landmarks with confidence-based size
    landmarks.forEach((landmark, index) => {
      const [x, y] = landmark;
      const radius = Math.max(2, confidence * 5);
      
      // Different colors for different finger parts
      let color = 'rgba(0, 255, 100, 0.8)';
      if (index === 0) color = 'rgba(255, 100, 100, 0.9)'; // Wrist - red
      else if (index <= 4) color = 'rgba(100, 100, 255, 0.8)'; // Thumb - blue
      else if (index <= 8) color = 'rgba(255, 255, 100, 0.8)'; // Index - yellow
      else if (index <= 12) color = 'rgba(255, 100, 255, 0.8)'; // Middle - magenta
      else if (index <= 16) color = 'rgba(100, 255, 255, 0.8)'; // Ring - cyan
      else color = 'rgba(255, 150, 100, 0.8)'; // Pinky - orange

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw landmark index for key points
      if ([0, 4, 8, 12, 16, 20].includes(index)) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index.toString(), x, y - radius - 2);
      }
    });
  };

  /**
   * Draw confidence indicators
   */
  const drawConfidenceIndicators = (ctx, handState) => {
    const { confidence, position } = handState;
    
    // Draw confidence meter near hand center
    if (position && confidence > 0) {
      const meterX = position.x + 50;
      const meterY = position.y - 30;
      const meterWidth = 80;
      const meterHeight = 8;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

      // Confidence bar
      const confidenceWidth = meterWidth * confidence;
      const confidenceColor = confidence > 0.8 ? 'rgba(0, 255, 0, 0.8)' :
                             confidence > 0.6 ? 'rgba(255, 255, 0, 0.8)' :
                             'rgba(255, 100, 0, 0.8)';
      
      ctx.fillStyle = confidenceColor;
      ctx.fillRect(meterX, meterY, confidenceWidth, meterHeight);

      // Border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

      // Confidence text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(confidence * 100)}%`, meterX, meterY - 5);
    }
  };

  /**
   * Draw gesture indicator
   */
  const drawGestureIndicator = (ctx, gesture, confidence) => {
    if (!gesture || gesture === 'NO_HAND') return;

    // Draw gesture name in top-left corner
    const x = 10;
    const y = 30;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 20, 120, 25);

    // Gesture text
    const gestureColor = confidence > 0.7 ? 'rgba(0, 255, 100, 1)' :
                        confidence > 0.5 ? 'rgba(255, 255, 0, 1)' :
                        'rgba(255, 100, 0, 1)';
    
    ctx.fillStyle = gestureColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(gesture.replace('_', ' '), x, y);
  };

  /**
   * Draw quality metrics
   */
  const drawQualityMetrics = (ctx, qualityMetrics) => {
    const x = 10;
    const y = 60;
    const lineHeight = 16;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - 5, y - 15, 150, 80);

    // Quality metrics text
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';

    const metrics = [
      `Stability: ${Math.round(qualityMetrics.stability * 100)}%`,
      `Accuracy: ${Math.round(qualityMetrics.accuracy * 100)}%`,
      `Responsiveness: ${Math.round(qualityMetrics.responsiveness * 100)}%`,
      `Overall: ${Math.round(qualityMetrics.overallQuality * 100)}%`
    ];

    metrics.forEach((metric, index) => {
      const value = parseInt(metric.split(': ')[1]);
      const color = value > 80 ? 'rgba(0, 255, 100, 1)' :
                   value > 60 ? 'rgba(255, 255, 0, 1)' :
                   'rgba(255, 100, 0, 1)';
      
      ctx.fillStyle = color;
      ctx.fillText(metric, x, y + index * lineHeight);
    });
  };

  /**
   * Update canvas size to match parent
   */
  const updateCanvasSize = () => {
    if (overlayCanvasRef.current && canvasRef?.current) {
      const parentCanvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      
      overlay.width = parentCanvas.width;
      overlay.height = parentCanvas.height;
      overlay.style.width = parentCanvas.style.width;
      overlay.style.height = parentCanvas.style.height;
    }
  };

  /**
   * Animation loop for smooth visualization updates
   */
  useEffect(() => {
    let animationFrame;
    
    const animate = () => {
      drawEnhancedVisualization();
      animationFrame = requestAnimationFrame(animate);
    };

    if (handState.isTracking) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [handState, showConfidenceIndicators, showHandSkeleton, showGestureIndicator, showQualityMetrics]);

  /**
   * Update canvas size when parent changes
   */
  useEffect(() => {
    updateCanvasSize();
    
    const handleResize = () => updateCanvasSize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [canvasRef]);

  return (
    <div className={`enhanced-hand-visualization ${className}`}>
      {/* Overlay canvas for hand visualization */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          width: '100%',
          height: '100%'
        }}
      />

      {/* Performance metrics overlay */}
      <AnimatePresence>
        {visualizationMetrics.frameCount > 0 && (
          <motion.div
            className="absolute bottom-2 right-2 bg-black/70 text-white text-xs p-2 rounded z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>Render: {visualizationMetrics.renderTime.toFixed(1)}ms</div>
            <div>Frames: {visualizationMetrics.frameCount}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedHandVisualization;
