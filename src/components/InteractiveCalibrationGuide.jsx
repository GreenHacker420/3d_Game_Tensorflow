import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Interactive Calibration Guide Component
 * Provides visual guidance for 3D hand tracking calibration with real-time feedback
 */
const InteractiveCalibrationGuide = ({
  isActive = false,
  handState,
  onCalibrationPoint,
  onComplete,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [collectedPoints, setCollectedPoints] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [isCollecting, setIsCollecting] = useState(false);

  const calibrationSteps = [
    {
      id: 'center',
      title: 'Center Position',
      instruction: 'Hold your hand in the center of your comfortable interaction area',
      icon: '🎯',
      position: { x: '50%', y: '50%' },
      description: 'This will be your reference point for all movements'
    },
    {
      id: 'left',
      title: 'Left Boundary',
      instruction: 'Move your hand to the leftmost comfortable position',
      icon: '👈',
      position: { x: '20%', y: '50%' },
      description: 'Define the left edge of your interaction zone'
    },
    {
      id: 'right',
      title: 'Right Boundary',
      instruction: 'Move your hand to the rightmost comfortable position',
      icon: '👉',
      position: { x: '80%', y: '50%' },
      description: 'Define the right edge of your interaction zone'
    },
    {
      id: 'top',
      title: 'Top Boundary',
      instruction: 'Move your hand to the highest comfortable position',
      icon: '👆',
      position: { x: '50%', y: '20%' },
      description: 'Define the upper edge of your interaction zone'
    },
    {
      id: 'bottom',
      title: 'Bottom Boundary',
      instruction: 'Move your hand to the lowest comfortable position',
      icon: '👇',
      position: { x: '50%', y: '80%' },
      description: 'Define the lower edge of your interaction zone'
    },
    {
      id: 'near',
      title: 'Near Depth',
      instruction: 'Move your hand closer to the camera',
      icon: '🤏',
      position: { x: '50%', y: '50%' },
      description: 'Define the closest comfortable distance'
    }
  ];

  const currentStepData = calibrationSteps[currentStep];

  /**
   * Start collecting a calibration point
   */
  const startCollection = () => {
    if (!handState.isTracking || isCollecting) return;

    setIsCollecting(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          collectPoint();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Collect the current calibration point
   */
  const collectPoint = () => {
    if (!handState.isTracking) {
      setIsCollecting(false);
      return;
    }

    const point = {
      id: currentStepData.id,
      position: { ...handState.position },
      confidence: handState.confidence,
      timestamp: Date.now()
    };

    setCollectedPoints(prev => [...prev, point]);
    
    // Notify parent component
    if (onCalibrationPoint) {
      onCalibrationPoint(point);
    }

    setIsCollecting(false);

    // Move to next step or complete
    if (currentStep < calibrationSteps.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 500);
    } else {
      setTimeout(() => {
        if (onComplete) {
          onComplete(collectedPoints);
        }
      }, 500);
    }
  };

  /**
   * Reset calibration
   */
  const resetCalibration = () => {
    setCurrentStep(0);
    setCollectedPoints([]);
    setCountdown(0);
    setIsCollecting(false);
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    resetCalibration();
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * Calculate progress percentage
   */
  const progress = ((currentStep + (isCollecting ? 0.5 : 0)) / calibrationSteps.length) * 100;

  if (!isActive) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      {/* Calibration Guide Overlay */}
      <div className="relative w-full h-full">
        {/* Target Position Indicator */}
        <motion.div
          className="absolute w-16 h-16 border-4 border-blue-500 rounded-full flex items-center justify-center text-2xl bg-blue-500/20"
          style={{
            left: currentStepData.position.x,
            top: currentStepData.position.y,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {currentStepData.icon}
        </motion.div>

        {/* Pulse Animation for Target */}
        <motion.div
          className="absolute w-20 h-20 border-2 border-blue-400 rounded-full"
          style={{
            left: currentStepData.position.x,
            top: currentStepData.position.y,
            transform: 'translate(-50%, -50%)'
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Hand Position Indicator */}
        {handState.isTracking && (
          <motion.div
            className="absolute w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg"
            style={{
              left: `${(handState.position.x / 640) * 100}%`,
              top: `${(handState.position.y / 480) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Countdown Overlay */}
        <AnimatePresence>
          {isCollecting && countdown > 0 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="text-8xl font-bold text-white"
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instruction Panel */}
        <motion.div
          className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-6 max-w-md text-center"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
            <motion.div
              className="bg-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Step Info */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-white mb-2">
              Step {currentStep + 1} of {calibrationSteps.length}
            </h3>
            <h4 className="text-lg text-blue-400 mb-2">
              {currentStepData.title}
            </h4>
            <p className="text-gray-300 mb-2">
              {currentStepData.instruction}
            </p>
            <p className="text-sm text-gray-400">
              {currentStepData.description}
            </p>
          </div>

          {/* Hand Detection Status */}
          <div className="mb-4">
            <div className={`flex items-center justify-center gap-2 ${handState.isTracking ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-3 h-3 rounded-full ${handState.isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {handState.isTracking ? 'Hand Detected' : 'No Hand Detected'}
              </span>
            </div>
            {handState.isTracking && (
              <div className="text-xs text-gray-400 mt-1">
                Confidence: {Math.round(handState.confidence * 100)}%
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={startCollection}
              disabled={!handState.isTracking || isCollecting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                handState.isTracking && !isCollecting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isCollecting ? 'Collecting...' : 'Capture Point'}
            </button>
            
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* Collected Points */}
          {collectedPoints.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-sm text-gray-400 mb-2">
                Collected Points: {collectedPoints.length}
              </div>
              <div className="flex gap-1 justify-center">
                {calibrationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-3 h-3 rounded-full ${
                      index < collectedPoints.length
                        ? 'bg-green-500'
                        : index === currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InteractiveCalibrationGuide;
