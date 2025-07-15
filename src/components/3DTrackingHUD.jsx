import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRACKING_MODES } from '../core/3DMotionModeManager.js';

/**
 * 3D Tracking HUD Component
 * Displays real-time 3D position data, interaction boundaries, and quality indicators
 */
const ThreeDTrackingHUD = ({
  handState = null,
  modeStatus = null,
  isMinimized = false,
  onToggleMinimize = () => {},
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const currentMode = modeStatus?.currentMode || TRACKING_MODES.MODE_2D;
  const is3DMode = currentMode === TRACKING_MODES.MODE_3D;
  const isCalibrated = modeStatus?.isCalibrated || false;
  const performance = modeStatus?.performance || {};
  const calibrationStatus = modeStatus?.calibrationStatus || {};

  /**
   * Format coordinate value
   */
  const formatCoord = (value) => {
    return typeof value === 'number' ? value.toFixed(1) : '0.0';
  };

  /**
   * Get quality color
   */
  const getQualityColor = (quality) => {
    if (quality >= 0.8) return 'text-green-400';
    if (quality >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  /**
   * Get quality icon
   */
  const getQualityIcon = (quality) => {
    if (quality >= 0.8) return '🟢';
    if (quality >= 0.6) return '🟡';
    return '🔴';
  };

  if (isMinimized) {
    return (
      <motion.div
        className={`3d-tracking-hud minimized ${className}`}
        onClick={onToggleMinimize}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="text-lg">{is3DMode ? '🎯' : '👋'}</span>
            {is3DMode && handState?.position && (
              <div className="text-xs text-blue-400 font-mono">
                {formatCoord(handState.position.x)}, {formatCoord(handState.position.y)}, {formatCoord(handState.position.z)}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`3d-tracking-hud ${className}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="bg-dark-800/90 backdrop-blur-sm border border-dark-600 rounded-lg p-4 min-w-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            {is3DMode ? '🎯 3D Tracking' : '👋 2D Tracking'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-gray-400 hover:text-white transition-colors"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? '📖' : '📕'}
            </button>
            <button
              className="text-xs text-gray-400 hover:text-white transition-colors"
              onClick={onToggleMinimize}
            >
              ➖
            </button>
          </div>
        </div>

        {/* Mode Status */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-300">Mode:</span>
            <span className={`text-xs font-medium ${is3DMode ? 'text-blue-400' : 'text-green-400'}`}>
              {is3DMode ? '3D Motion' : '2D Tracking'}
            </span>
          </div>

          {is3DMode && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Calibrated:</span>
              <span className={`text-xs ${isCalibrated ? 'text-green-400' : 'text-orange-400'}`}>
                {isCalibrated ? '✅' : '⚠️'}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-300">Hand Detected:</span>
            <span className={`text-xs ${handState?.isTracking ? 'text-green-400' : 'text-red-400'}`}>
              {handState?.isTracking ? '✅' : '❌'}
            </span>
          </div>
        </div>

        {/* Position Display */}
        {handState?.isTracking && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-300">Position:</h4>
            <div className="bg-dark-700 rounded p-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-red-400">X:</span>
                <span className="text-white">{formatCoord(handState.position?.x)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-400">Y:</span>
                <span className="text-white">{formatCoord(handState.position?.y)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-400">Z:</span>
                <span className="text-white">{formatCoord(handState.position?.z)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3D Mode Specific Info */}
        {is3DMode && (
          <div className="space-y-2 mb-4">
            {/* Quality Score */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Quality:</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">{getQualityIcon(performance.qualityScore || 0)}</span>
                <span className={`text-xs ${getQualityColor(performance.qualityScore || 0)}`}>
                  {Math.round((performance.qualityScore || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">FPS:</span>
              <span className="text-xs text-blue-400">
                {Math.round(performance.fps || 0)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Latency:</span>
              <span className="text-xs text-purple-400">
                {Math.round(performance.latency || 0)}ms
              </span>
            </div>
          </div>
        )}

        {/* Hand Orientation (3D Mode) */}
        {is3DMode && handState?.orientation && showDetails && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-300">Orientation:</h4>
            <div className="bg-dark-700 rounded p-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-yellow-400">Pitch:</span>
                <span className="text-white">{formatCoord(handState.orientation.pitch * 180 / Math.PI)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-400">Yaw:</span>
                <span className="text-white">{formatCoord(handState.orientation.yaw * 180 / Math.PI)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-pink-400">Roll:</span>
                <span className="text-white">{formatCoord(handState.orientation.roll * 180 / Math.PI)}°</span>
              </div>
            </div>
          </div>
        )}

        {/* Interaction Boundaries Visualization */}
        {is3DMode && isCalibrated && showDetails && (
          <div className="space-y-2 mb-4">
            <h4 className="text-xs font-medium text-gray-300">Interaction Volume:</h4>
            <div className="bg-dark-700 rounded p-2">
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-center">
                  <div className="text-gray-400">W</div>
                  <div className="text-white">{calibrationStatus.interactionVolume?.width || 30}cm</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">H</div>
                  <div className="text-white">{calibrationStatus.interactionVolume?.height || 30}cm</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400">D</div>
                  <div className="text-white">{calibrationStatus.interactionVolume?.depth || 20}cm</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gesture Info */}
        {handState?.isTracking && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Gesture:</span>
              <span className="text-xs text-blue-400">
                {handState.gesture || 'none'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-300">Confidence:</span>
              <span className="text-xs text-green-400">
                {Math.round((handState.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {is3DMode && !isCalibrated && (
          <motion.div
            className="mt-3 p-2 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            ⚠️ 3D mode requires calibration for accurate tracking
          </motion.div>
        )}

        {is3DMode && performance.qualityScore < 0.4 && (
          <motion.div
            className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            🔴 Poor tracking quality - check lighting and hand visibility
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ThreeDTrackingHUD;
