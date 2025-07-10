import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GESTURE_TYPES } from '../utils/gestureRecognition';
import './HandTrackingHUD.css';

const HandTrackingHUD = ({ 
  handState = {}, 
  isLoading = false, 
  objects = [], 
  selectedObject = null,
  isMinimized = false,
  onToggleMinimize = () => {}
}) => {
  const getGestureIcon = () => {
    if (!handState.isTracking) return '❌';
    
    const gestureIcons = {
      [GESTURE_TYPES.OPEN_HAND]: '✋',
      [GESTURE_TYPES.CLOSED_FIST]: '✊',
      [GESTURE_TYPES.PINCH]: '🤏',
      [GESTURE_TYPES.POINT]: '👆',
      [GESTURE_TYPES.VICTORY]: '✌️',
      [GESTURE_TYPES.THUMBS_UP]: '👍',
      [GESTURE_TYPES.ROCK_ON]: '🤘',
      [GESTURE_TYPES.OK_SIGN]: '👌',
      [GESTURE_TYPES.NO_HAND]: '❌'
    };
    
    return gestureIcons[handState.gesture] || '✋';
  };

  const getGestureText = () => {
    if (!handState.isTracking) return 'No Hand Detected';
    
    const gestureNames = {
      [GESTURE_TYPES.OPEN_HAND]: 'Open Hand - Move Objects',
      [GESTURE_TYPES.CLOSED_FIST]: 'Closed Fist - Grab Objects',
      [GESTURE_TYPES.PINCH]: 'Pinch - Resize Objects',
      [GESTURE_TYPES.POINT]: 'Point - Select Objects',
      [GESTURE_TYPES.VICTORY]: 'Victory - Special Effects',
      [GESTURE_TYPES.THUMBS_UP]: 'Thumbs Up - Activate',
      [GESTURE_TYPES.ROCK_ON]: 'Rock On - Transform',
      [GESTURE_TYPES.OK_SIGN]: 'OK Sign - Reset',
      [GESTURE_TYPES.NO_HAND]: 'No Gesture'
    };
    
    return gestureNames[handState.gesture] || 'Unknown Gesture';
  };

  const getStatusColor = () => {
    if (!handState.isTracking) return '#ff4444';
    if (handState.gesture === GESTURE_TYPES.PINCH) return '#ffaa00';
    return '#44ff44';
  };

  return (
    <motion.div 
      className={`hand-tracking-hud ${isMinimized ? 'minimized' : ''}`}
      animate={{ 
        width: isMinimized ? '60px' : '380px',
        height: isMinimized ? '60px' : 'auto'
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner"></div>
            <h2>Initializing Hand Detection...</h2>
            <p>Please ensure your webcam is enabled</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Header with Minimize Button */}
      <div className="hud-header">
        <h3 className="hud-title">
          {isMinimized ? '👋' : '🎮 Hand Tracking'}
        </h3>
        <button 
          className="minimize-btn"
          onClick={onToggleMinimize}
          title={isMinimized ? 'Maximize HUD (H)' : 'Minimize HUD (H)'}
        >
          {isMinimized ? '📖' : '📕'}
        </button>
      </div>

      {/* HUD Content - Hidden when minimized */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="hud-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hand Status Card */}
            <motion.div 
              className="hand-status-card"
              animate={{ 
                borderColor: getStatusColor(),
                boxShadow: `0 0 20px ${getStatusColor()}33`
              }}
              transition={{ duration: 0.3 }}
            >
              <div className="status-header">
                <motion.div 
                  className="gesture-icon"
                  animate={{ scale: handState.isTracking ? 1.1 : 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {getGestureIcon()}
                </motion.div>
                <div className="status-text">
                  <h3>{getGestureText()}</h3>
                  <p>Position: ({Math.round(handState.position?.x || 0)}, {Math.round(handState.position?.y || 0)})</p>
                </div>
              </div>

              {/* Confidence Meter */}
              {handState.isTracking && (
                <div className="confidence-meter">
                  <label>Tracking Quality</label>
                  <div className="confidence-bar">
                    <motion.div 
                      className="confidence-fill"
                      animate={{ width: `${(handState.confidence || 0.8) * 100}%` }}
                      style={{ backgroundColor: getStatusColor() }}
                    />
                  </div>
                  <span>{Math.round((handState.confidence || 0.8) * 100)}%</span>
                </div>
              )}
            </motion.div>

            {/* Multi-Object Status */}
            <div className="objects-status">
              <h3>🎯 Objects ({objects.length})</h3>
              <div className="objects-grid">
                {objects.map(obj => (
                  <motion.div 
                    key={obj.id}
                    className={`object-item ${obj.isSelected ? 'selected' : ''} ${obj.isActive ? 'active' : ''}`}
                    animate={{
                      borderColor: obj.isSelected ? '#4CAF50' : 'transparent',
                      backgroundColor: obj.isGrabbed ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div className="object-icon">
                      {obj.type === 'cube' && '🟧'}
                      {obj.type === 'sphere' && '🔴'}
                      {obj.type === 'pyramid' && '🔺'}
                      {obj.type === 'cylinder' && '🟡'}
                    </div>
                    <div className="object-info">
                      <strong>{obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}</strong>
                      <p>Scale: {obj.scale?.x?.toFixed(1) || '1.0'}x</p>
                      {obj.isSelected && <span className="selected-badge">Selected</span>}
                      {obj.isGrabbed && <span className="grabbed-badge">Grabbed</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Gesture Instructions */}
            <div className="gesture-instructions">
              <h3>🎮 Gesture Controls</h3>
              <div className="instruction-grid">
                {[
                  { gesture: GESTURE_TYPES.OPEN_HAND, icon: '✋', name: 'Open Hand', desc: 'Move objects' },
                  { gesture: GESTURE_TYPES.CLOSED_FIST, icon: '✊', name: 'Fist', desc: 'Hold 1s: Grab' },
                  { gesture: GESTURE_TYPES.PINCH, icon: '🤏', name: 'Pinch', desc: 'Resize objects' },
                  { gesture: GESTURE_TYPES.POINT, icon: '👆', name: 'Point', desc: 'Hold 0.8s: Select' }
                ].map(({ gesture, icon, name, desc }) => (
                  <motion.div 
                    key={gesture}
                    className={`instruction-item ${handState.gesture === gesture ? 'active' : ''}`}
                    animate={{ 
                      opacity: handState.gesture === gesture ? 1 : 0.7,
                      scale: handState.gesture === gesture ? 1.05 : 1
                    }}
                  >
                    <span className="instruction-icon">{icon}</span>
                    <div>
                      <strong>{name}</strong>
                      <p>{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">FPS</span>
                <span className="metric-value">60</span>
              </div>
              <div className="metric">
                <span className="metric-label">Latency</span>
                <span className="metric-value">~50ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HandTrackingHUD;
