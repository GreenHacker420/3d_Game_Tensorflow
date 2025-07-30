import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * HUD component to display information about all interactive objects
 */
const ObjectsHUD = ({
  objectsInfo = [],
  selectedObject = null,
  onSelectObject,
  gestureCompatibility = [],
  className = '',
  position = 'bottom-right',
  minimized = false,
  onToggleMinimize
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getObjectIcon = (type) => {
    const icons = {
      cube: '🟦',
      sphere: '🔴',
      pyramid: '🔺',
      cylinder: '🟡'
    };
    return icons[type] || '📦';
  };

  const getObjectColor = (type, isSelected) => {
    const colors = {
      cube: isSelected ? 'border-orange-400 bg-orange-900/20' : 'border-orange-600 bg-orange-900/10',
      sphere: isSelected ? 'border-red-400 bg-red-900/20' : 'border-red-600 bg-red-900/10',
      pyramid: isSelected ? 'border-blue-400 bg-blue-900/20' : 'border-blue-600 bg-blue-900/10',
      cylinder: isSelected ? 'border-yellow-400 bg-yellow-900/20' : 'border-yellow-600 bg-yellow-900/10'
    };
    return colors[type] || (isSelected ? 'border-gray-400 bg-gray-900/20' : 'border-gray-600 bg-gray-900/10');
  };

  if (objectsInfo.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`fixed ${positionClasses[position]} z-20 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg p-4 min-w-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            📦 Interactive Objects
            <span className="text-xs text-gray-400">({objectsInfo.length})</span>
          </h3>
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="text-gray-400 hover:text-white transition-colors text-xs"
            >
              {minimized ? '📈' : '📉'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {!minimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {/* Objects List */}
              {objectsInfo.map((obj) => (
                <motion.div
                  key={obj.id}
                  className={`p-2 rounded border cursor-pointer transition-all ${getObjectColor(obj.type, obj.isSelected)}`}
                  onClick={() => onSelectObject && onSelectObject(obj.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getObjectIcon(obj.type)}</span>
                      <div>
                        <div className="text-xs font-medium text-white">
                          {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)} #{obj.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {obj.isGrabbed ? '✊ Grabbed' : obj.isSelected ? '👆 Selected' : '⭕ Available'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-300">
                        Scale: {obj.scale?.toFixed(1) || '1.0'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Pos: ({obj.position?.x?.toFixed(0) || 0}, {obj.position?.y?.toFixed(0) || 0})
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Selected Object Details */}
              {selectedObject && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2 bg-blue-900/20 border border-blue-600 rounded"
                >
                  <div className="text-xs font-medium text-blue-400 mb-1">
                    🎯 Active: {selectedObject.type.charAt(0).toUpperCase() + selectedObject.type.slice(1)} #{selectedObject.id}
                  </div>
                  <div className="text-xs text-gray-300">
                    Compatible Gestures:
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {gestureCompatibility.map((gesture, index) => (
                      <span
                        key={index}
                        className="text-xs px-1 py-0.5 bg-green-900/30 text-green-400 rounded"
                      >
                        {gesture.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Instructions */}
              <div className="mt-3 pt-2 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                  💡 Click objects to select • Use gestures to interact
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ObjectsHUD;
