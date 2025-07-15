import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

/**
 * Minimalistic performance HUD component
 */
const PerformanceHUD = ({ 
  handState, 
  performance, 
  cubeInfo,
  className = '',
  position = 'top-left' // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  /**
   * Get gesture emoji
   */
  const getGestureEmoji = (gesture) => {
    const emojis = {
      'open_hand': '✋',
      'closed_fist': '✊',
      'pinch': '🤏',
      'no_hand': '❌'
    };
    return emojis[gesture] || '❓';
  };

  /**
   * Get performance status color
   */
  const getPerformanceColor = (fps) => {
    if (fps >= 50) return '#00ff00';
    if (fps >= 30) return '#ffff00';
    return '#ff0000';
  };

  /**
   * Format number for display
   */
  const formatNumber = (num, decimals = 1) => {
    return typeof num === 'number' ? num.toFixed(decimals) : '0';
  };

  // Add GSAP animation for metrics
  const metricsRef = useRef(null);

  useEffect(() => {
    if (metricsRef.current && !isMinimized) {
      gsap.fromTo(metricsRef.current.children,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }
      );
    }
  }, [isMinimized, handState, performance]);

  if (isMinimized) {
    return (
      <motion.div
        className="hud-panel"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.button
          className="btn-ghost p-2 text-lg"
          onClick={() => setIsMinimized(false)}
          title="Show Performance Info"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          📊
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="hud-panel min-w-48"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-accent-400">Performance</h3>
        <motion.button
          className="btn-ghost p-1 text-xs"
          onClick={() => setIsMinimized(true)}
          title="Minimize"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ➖
        </motion.button>
      </div>

      <div ref={metricsRef} className="space-y-3">
        {/* Hand Tracking Status */}
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium">Hand Tracking</div>
          <motion.div
            className="hud-metric"
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getGestureEmoji(handState.gesture)}</span>
              <span className="hud-label text-xs">
                {handState.isTracking ? 'Tracking' : 'No Hand'}
              </span>
            </div>
            {handState.confidence > 0 && (
              <motion.span
                className="hud-value text-xs"
                key={handState.confidence}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {Math.round(handState.confidence * 100)}%
              </motion.span>
            )}
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium">Performance</div>
          <motion.div
            className="hud-metric"
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <span className="hud-label text-xs">FPS</span>
            <motion.span
              className="hud-value text-xs font-semibold"
              style={{
                color: performance.fps >= 50 ? '#22c55e' :
                       performance.fps >= 30 ? '#eab308' : '#ef4444'
              }}
              key={performance.fps}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {performance.fps || 0}
            </motion.span>
          </motion.div>

          <motion.div
            className="hud-metric"
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          >
            <span className="hud-label text-xs">Latency</span>
            <motion.span
              className="hud-value text-xs"
              key={performance.latency}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {performance.latency || 0}ms
            </motion.span>
          </motion.div>
        </div>

        {/* Cube Info */}
        <AnimatePresence>
          {cubeInfo && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xs text-gray-400 font-medium">Cube</div>
              <motion.div
                className="hud-metric"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <span className="hud-label text-xs">Position</span>
                <span className="hud-value text-xs">
                  ({formatNumber(cubeInfo.position.x)}, {formatNumber(cubeInfo.position.y)}, {formatNumber(cubeInfo.position.z)})
                </span>
              </motion.div>
              <motion.div
                className="hud-metric"
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              >
                <span className="hud-label text-xs">Scale</span>
                <motion.span
                  className="hud-value text-xs"
                  key={cubeInfo.scale}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {formatNumber(cubeInfo.scale, 2)}
                </motion.span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PerformanceHUD;
