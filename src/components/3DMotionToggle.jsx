import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TRACKING_MODES } from '../core/3DMotionModeManager.js';

/**
 * 3D Motion Mode Toggle Component
 * Provides UI for switching between 2D and 3D tracking modes
 */
const ThreeDMotionToggle = ({
  currentMode = TRACKING_MODES.MODE_2D,
  onModeSwitch = () => {},
  onCalibrationStart = () => {},
  modeStatus = null,
  className = '',
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const is3DMode = currentMode === TRACKING_MODES.MODE_3D;
  const isCalibrated = modeStatus?.isCalibrated || false;
  const qualityScore = modeStatus?.performance?.qualityScore || 0;

  /**
   * Handle mode toggle
   */
  const handleModeToggle = () => {
    if (disabled) return;

    const targetMode = is3DMode ? TRACKING_MODES.MODE_2D : TRACKING_MODES.MODE_3D;
    
    // If switching to 3D mode and not calibrated, start calibration
    if (targetMode === TRACKING_MODES.MODE_3D && !isCalibrated) {
      onCalibrationStart();
      return;
    }

    onModeSwitch(targetMode);
  };

  /**
   * Get mode display info
   */
  const getModeInfo = () => {
    if (is3DMode) {
      return {
        icon: '🎯',
        label: '3D Motion',
        description: 'Full spatial tracking',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/30'
      };
    } else {
      return {
        icon: '👋',
        label: '2D Tracking',
        description: 'Traditional hand tracking',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/30'
      };
    }
  };

  /**
   * Get quality indicator
   */
  const getQualityIndicator = () => {
    if (!is3DMode) return null;

    const quality = qualityScore * 100;
    let color = 'text-red-400';
    let icon = '🔴';

    if (quality >= 80) {
      color = 'text-green-400';
      icon = '🟢';
    } else if (quality >= 60) {
      color = 'text-yellow-400';
      icon = '🟡';
    }

    return { color, icon, quality };
  };

  const modeInfo = getModeInfo();
  const qualityInfo = getQualityIndicator();

  return (
    <div className={`3d-motion-toggle ${className}`}>
      {/* Main Toggle Button */}
      <motion.div
        className={`
          relative flex items-center gap-3 px-4 py-2 rounded-lg border backdrop-blur-sm
          ${modeInfo.bgColor} ${modeInfo.borderColor}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          transition-all duration-200
        `}
        onClick={handleModeToggle}
        onHoverStart={() => setShowTooltip(true)}
        onHoverEnd={() => setShowTooltip(false)}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
      >
        {/* Mode Icon */}
        <span className="text-xl">{modeInfo.icon}</span>

        {/* Mode Label */}
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${modeInfo.color}`}>
            {modeInfo.label}
          </span>
          {isExpanded && (
            <span className="text-xs text-gray-400">
              {modeInfo.description}
            </span>
          )}
        </div>

        {/* Quality Indicator for 3D Mode */}
        {qualityInfo && (
          <div className="flex items-center gap-1">
            <span className="text-xs">{qualityInfo.icon}</span>
            <span className={`text-xs ${qualityInfo.color}`}>
              {Math.round(qualityInfo.quality)}%
            </span>
          </div>
        )}

        {/* Calibration Required Indicator */}
        {is3DMode && !isCalibrated && (
          <motion.div
            className="w-2 h-2 bg-orange-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}

        {/* Expand/Collapse Button */}
        <motion.button
          className="ml-auto text-gray-400 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L2 4h8L6 8z" />
          </svg>
        </motion.button>
      </motion.div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-2 p-3 rounded-lg bg-dark-800/90 border border-dark-600 backdrop-blur-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Mode Status */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Current Mode:</span>
                <span className={`text-sm font-medium ${modeInfo.color}`}>
                  {modeInfo.label}
                </span>
              </div>

              {is3DMode && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Calibrated:</span>
                    <span className={`text-sm ${isCalibrated ? 'text-green-400' : 'text-orange-400'}`}>
                      {isCalibrated ? '✅ Yes' : '⚠️ Required'}
                    </span>
                  </div>

                  {qualityInfo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Quality:</span>
                      <span className={`text-sm ${qualityInfo.color}`}>
                        {qualityInfo.icon} {Math.round(qualityInfo.quality)}%
                      </span>
                    </div>
                  )}

                  {modeStatus?.performance && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">FPS:</span>
                      <span className="text-sm text-blue-400">
                        {Math.round(modeStatus.performance.fps)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-3 flex gap-2">
              {is3DMode && !isCalibrated && (
                <button
                  className="px-3 py-1 text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 transition-colors"
                  onClick={onCalibrationStart}
                >
                  📐 Calibrate
                </button>
              )}

              {is3DMode && isCalibrated && (
                <button
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                  onClick={onCalibrationStart}
                >
                  🔄 Recalibrate
                </button>
              )}

              <button
                className={`
                  px-3 py-1 text-xs border rounded transition-colors
                  ${is3DMode 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30'
                  }
                `}
                onClick={handleModeToggle}
                disabled={disabled}
              >
                {is3DMode ? '👋 Switch to 2D' : '🎯 Switch to 3D'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isExpanded && (
          <motion.div
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-900 text-white text-xs rounded border border-dark-600 whitespace-nowrap z-50"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
          >
            {is3DMode 
              ? `3D Motion Mode ${!isCalibrated ? '(Needs Calibration)' : `(${Math.round(qualityScore * 100)}%)`}`
              : '2D Tracking Mode - Click to enable 3D'
            }
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-dark-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThreeDMotionToggle;
