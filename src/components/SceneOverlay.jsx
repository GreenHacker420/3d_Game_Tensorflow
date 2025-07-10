import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SceneOverlay.css';

const SceneOverlay = ({
  handState,
  gameRef,
  isMinimized = false,
  onToggleMinimize = () => {}
}) => {
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [showBoundaries, setShowBoundaries] = useState(false);

  // Update objects info from game instance
  useEffect(() => {
    const updateObjectsInfo = () => {
      if (gameRef.current && gameRef.current.getAllObjects) {
        const allObjects = gameRef.current.getAllObjects();
        const selected = gameRef.current.getSelectedObject();
        setObjects(allObjects);
        setSelectedObject(selected);
      }
    };

    const interval = setInterval(updateObjectsInfo, 100);
    return () => clearInterval(interval);
  }, [gameRef]);

  return (
    <div className="scene-overlay">
      {/* Multi-Object Info Panel */}
      <motion.div
        className={`object-info-panel ${isMinimized ? 'minimized' : ''}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: 1,
          x: 0,
          width: isMinimized ? '60px' : '350px',
          height: isMinimized ? '60px' : 'auto'
        }}
        transition={{ delay: 0.5, duration: 0.3 }}
      >
        {/* Panel Header with Minimize Button */}
        <div className="panel-header">
          <h4 className="panel-title">
            {isMinimized ? '🎯' : `🎯 Scene Objects (${objects.length})`}
          </h4>
          <button
            className="minimize-btn"
            onClick={onToggleMinimize}
            title={isMinimized ? 'Maximize Panel (O)' : 'Minimize Panel (O)'}
          >
            {isMinimized ? '📖' : '📕'}
          </button>
        </div>

        {/* Panel Content - Hidden when minimized */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              className="panel-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
        
        {selectedObject ? (
          <div className="info-section">
            <div className="selected-object-header">
              <span className="object-type-icon">
                {selectedObject.type === 'cube' && '🟧'}
                {selectedObject.type === 'sphere' && '🔴'}
                {selectedObject.type === 'pyramid' && '🔺'}
                {selectedObject.type === 'cylinder' && '🟡'}
              </span>
              <strong>Selected: {selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)}</strong>
            </div>
            
            <div className="info-item">
              <span className="info-label">Position</span>
              <div className="coordinate-display">
                <span className="coord x">X: {selectedObject.position?.x?.toFixed(1) || '0.0'}</span>
                <span className="coord y">Y: {selectedObject.position?.y?.toFixed(1) || '0.0'}</span>
                <span className="coord z">Z: {selectedObject.position?.z?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-label">Scale</span>
              <motion.span 
                className="scale-value"
                animate={{ 
                  color: selectedObject.isGrabbed ? '#ffaa00' : '#4CAF50',
                  scale: selectedObject.isGrabbed ? 1.1 : 1
                }}
              >
                {selectedObject.scale?.x?.toFixed(2) || '1.00'}x
              </motion.span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Status</span>
              <div className="status-badges">
                {selectedObject.isGrabbed && <span className="status-badge grabbed">Grabbed</span>}
                {selectedObject.isActive && <span className="status-badge active">Active</span>}
                {!selectedObject.isGrabbed && !selectedObject.isActive && <span className="status-badge idle">Idle</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-selection">
            <p>👆 Point at an object for 0.8s to select it</p>
            <div className="objects-summary">
              {objects.map(obj => (
                <div key={obj.id} className="object-summary-item">
                  <span className="summary-icon">
                    {obj.type === 'cube' && '🟧'}
                    {obj.type === 'sphere' && '🔴'}
                    {obj.type === 'pyramid' && '🔺'}
                    {obj.type === 'cylinder' && '🟡'}
                  </span>
                  <span className="summary-text">{obj.type}</span>
                  {obj.isActive && <span className="summary-active">●</span>}
                </div>
              ))}
            </div>
          </div>
        )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Scene Controls */}
      <div className="scene-controls">
        <button 
          className={`control-btn ${showCoordinates ? 'active' : ''}`}
          onClick={() => setShowCoordinates(!showCoordinates)}
          title="Toggle coordinate grid"
        >
          📊
        </button>
        
        <button 
          className={`control-btn ${showBoundaries ? 'active' : ''}`}
          onClick={() => setShowBoundaries(!showBoundaries)}
          title="Toggle boundary visualization"
        >
          🔲
        </button>
      </div>

      {/* Coordinate Grid Overlay */}
      <AnimatePresence>
        {showCoordinates && (
          <motion.div 
            className="coordinate-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
          >
            <div className="grid-lines horizontal">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="grid-line" style={{ top: `${(i + 1) * 10}%` }} />
              ))}
            </div>
            <div className="grid-lines vertical">
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="grid-line" style={{ left: `${(i + 1) * 10}%` }} />
              ))}
            </div>
            <div className="center-crosshair">
              <div className="crosshair-h"></div>
              <div className="crosshair-v"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Boundary Indicators */}
      <AnimatePresence>
        {showBoundaries && (
          <motion.div 
            className="boundary-indicators"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
          >
            <div className="boundary-box">
              <div className="boundary-corner top-left"></div>
              <div className="boundary-corner top-right"></div>
              <div className="boundary-corner bottom-left"></div>
              <div className="boundary-corner bottom-right"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hand Position Indicator */}
      {handState.isTracking && (
        <motion.div 
          className="hand-position-indicator"
          animate={{
            left: `${(handState.position?.x / 640) * 100 || 50}%`,
            top: `${(handState.position?.y / 480) * 100 || 50}%`
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className={`hand-dot ${handState.gesture === 'pinch' ? 'pinched' : ''}`}>
            <div className="hand-ripple"></div>
          </div>
        </motion.div>
      )}

      {/* Gesture Feedback */}
      <AnimatePresence>
        {handState.gesture === 'pinch' && (
          <motion.div 
            className="gesture-feedback-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="feedback-icon">🤏</div>
            <div className="feedback-text">Resize Mode Active</div>
            <div className="feedback-instruction">
              Spread/close fingers to resize
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneOverlay;
