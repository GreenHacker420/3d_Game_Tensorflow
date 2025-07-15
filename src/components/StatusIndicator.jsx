import React from 'react';
import { motion } from 'framer-motion';

/**
 * Simple status indicator for system health
 */
const StatusIndicator = ({ 
  handDetectionStatus, 
  sceneStatus, 
  className = '' 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return '#00ff00';
      case 'loading': return '#ffff00';
      case 'error': return '#ff0000';
      default: return '#666666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready': return 'Ready';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Waiting';
    }
  };

  /**
   * Get status CSS class
   */
  const getStatusClass = (status) => {
    const classMap = {
      'loading': 'text-blue-400',
      'ready': 'text-green-400',
      'error': 'text-red-400',
      'waiting': 'text-yellow-400'
    };
    return classMap[status] || 'text-gray-400';
  };

  return (
    <motion.div
      className={`hud-panel space-y-2 ${className}`}
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="flex items-center space-x-3"
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getStatusColor(handDetectionStatus) }}
          animate={{
            scale: handDetectionStatus === 'ready' ? [1, 1.2, 1] : 1,
            boxShadow: handDetectionStatus === 'ready' ?
              ['0 0 0px rgba(34, 197, 94, 0.5)', '0 0 10px rgba(34, 197, 94, 0.8)', '0 0 0px rgba(34, 197, 94, 0.5)'] :
              '0 0 0px rgba(34, 197, 94, 0)'
          }}
          transition={{
            duration: 2,
            repeat: handDetectionStatus === 'ready' ? Infinity : 0
          }}
        />
        <span className="text-xs font-medium">
          Hand Detection: <span className={getStatusClass(handDetectionStatus)}>{getStatusText(handDetectionStatus)}</span>
        </span>
      </motion.div>

      <motion.div
        className="flex items-center space-x-3"
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getStatusColor(sceneStatus) }}
          animate={{
            scale: sceneStatus === 'ready' ? [1, 1.2, 1] : 1,
            boxShadow: sceneStatus === 'ready' ?
              ['0 0 0px rgba(34, 197, 94, 0.5)', '0 0 10px rgba(34, 197, 94, 0.8)', '0 0 0px rgba(34, 197, 94, 0.5)'] :
              '0 0 0px rgba(34, 197, 94, 0)'
          }}
          transition={{
            duration: 2,
            repeat: sceneStatus === 'ready' ? Infinity : 0
          }}
        />
        <span className="text-xs font-medium">
          3D Scene: <span className={getStatusClass(sceneStatus)}>{getStatusText(sceneStatus)}</span>
        </span>
      </motion.div>
    </motion.div>
  );
};

export default StatusIndicator;
