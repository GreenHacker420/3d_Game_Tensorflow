import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 3D Motion Calibration Modal
 * Guides users through the calibration process for 3D spatial tracking
 */
const CalibrationModal = ({
  isOpen = false,
  onClose = () => {},
  onComplete = () => {},
  handState = null,
  startCalibration = null
}) => {
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationData, setCalibrationData] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('');

  const calibrationSteps = [
    {
      name: 'center',
      title: 'Center Position',
      instruction: 'Place your hand at the center of your comfortable reach area',
      icon: '🎯',
      description: 'This will be your reference point for all movements'
    },
    {
      name: 'near',
      title: 'Closest Position',
      instruction: 'Move your hand as close to the camera as comfortable',
      icon: '👆',
      description: 'This defines the front boundary of your interaction space'
    },
    {
      name: 'far',
      title: 'Farthest Position',
      instruction: 'Move your hand as far from the camera as comfortable',
      icon: '👋',
      description: 'This defines the back boundary of your interaction space'
    },
    {
      name: 'left',
      title: 'Left Edge',
      instruction: 'Move your hand to the leftmost comfortable position',
      icon: '👈',
      description: 'This defines the left boundary of your interaction space'
    },
    {
      name: 'right',
      title: 'Right Edge',
      instruction: 'Move your hand to the rightmost comfortable position',
      icon: '👉',
      description: 'This defines the right boundary of your interaction space'
    },
    {
      name: 'top',
      title: 'Top Edge',
      instruction: 'Move your hand to the highest comfortable position',
      icon: '👆',
      description: 'This defines the top boundary of your interaction space'
    },
    {
      name: 'bottom',
      title: 'Bottom Edge',
      instruction: 'Move your hand to the lowest comfortable position',
      icon: '👇',
      description: 'This defines the bottom boundary of your interaction space'
    }
  ];

  /**
   * Start calibration process
   */
  const handleStartCalibration = () => {
    if (!startCalibration) return;

    setIsCalibrating(true);
    setCalibrationStep(0);
    
    const calibrationProcess = startCalibration(
      (progress) => {
        setCalibrationStep(progress.step - 1);
        setCurrentInstruction(progress.instruction);
      },
      (success) => {
        setIsCalibrating(false);
        if (success) {
          setCalibrationStep(calibrationSteps.length);
          setTimeout(() => {
            onComplete();
            onClose();
          }, 2000);
        }
      }
    );

    setCalibrationData(calibrationProcess);
  };

  /**
   * Capture current position
   */
  const capturePosition = () => {
    if (!calibrationData || !handState?.isTracking) return;

    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Capture the position
          calibrationData.processStep(handState.position);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  /**
   * Skip calibration step
   */
  const skipStep = () => {
    if (!calibrationData) return;
    
    // Use a default position for skipped step
    const defaultPosition = { x: 320, y: 240, z: 0.5 };
    calibrationData.processStep(defaultPosition);
  };

  /**
   * Reset calibration
   */
  const resetCalibration = () => {
    setIsCalibrating(false);
    setCalibrationStep(0);
    setCalibrationData(null);
    setCountdown(0);
    setCurrentInstruction('');
  };

  const currentStep = calibrationSteps[calibrationStep];
  const progress = ((calibrationStep + 1) / calibrationSteps.length) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-dark-800 rounded-xl border border-dark-600 p-6 max-w-md w-full mx-4 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🎯 3D Motion Calibration
            </h2>
            <button
              className="text-gray-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {!isCalibrating ? (
            /* Welcome Screen */
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-white">
                Set Up 3D Motion Tracking
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Calibration helps the system understand your interaction space. 
                You'll be guided through {calibrationSteps.length} simple steps to define 
                your comfortable movement boundaries.
              </p>
              
              <div className="bg-dark-700 rounded-lg p-4 text-left">
                <h4 className="text-sm font-medium text-blue-400 mb-2">What you'll do:</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Move your hand to different positions when prompted</li>
                  <li>• Hold steady for 3 seconds at each position</li>
                  <li>• Keep your hand visible to the camera</li>
                  <li>• Take your time - accuracy is important</li>
                </ul>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  onClick={handleStartCalibration}
                  disabled={!handState?.isTracking}
                >
                  {handState?.isTracking ? '🚀 Start Calibration' : '⚠️ Hand Not Detected'}
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : calibrationStep < calibrationSteps.length ? (
            /* Calibration Steps */
            <div className="space-y-4">
              {/* Progress Bar */}
              <div className="w-full bg-dark-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Step Info */}
              <div className="text-center">
                <div className="text-4xl mb-2">{currentStep.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Step {calibrationStep + 1} of {calibrationSteps.length}
                </h3>
                <h4 className="text-blue-400 font-medium mb-2">
                  {currentStep.title}
                </h4>
                <p className="text-gray-300 text-sm mb-4">
                  {currentStep.instruction}
                </p>
                <p className="text-xs text-gray-400">
                  {currentStep.description}
                </p>
              </div>

              {/* Hand Detection Status */}
              <div className={`
                p-3 rounded-lg border text-center
                ${handState?.isTracking 
                  ? 'bg-green-500/20 border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border-red-500/30 text-red-400'
                }
              `}>
                {handState?.isTracking ? (
                  <span>✅ Hand detected - Ready to capture</span>
                ) : (
                  <span>❌ Please show your hand to the camera</span>
                )}
              </div>

              {/* Countdown */}
              {countdown > 0 && (
                <motion.div
                  className="text-center"
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  key={countdown}
                >
                  <div className="text-4xl font-bold text-blue-400">
                    {countdown}
                  </div>
                  <p className="text-sm text-gray-300">Hold steady...</p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={capturePosition}
                  disabled={!handState?.isTracking || countdown > 0}
                >
                  {countdown > 0 ? 'Capturing...' : '📸 Capture Position'}
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  onClick={skipStep}
                >
                  Skip
                </button>
              </div>

              <button
                className="w-full px-4 py-2 text-sm bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors"
                onClick={resetCalibration}
              >
                🔄 Restart Calibration
              </button>
            </div>
          ) : (
            /* Completion Screen */
            <div className="text-center space-y-4">
              <motion.div
                className="text-6xl"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                🎉
              </motion.div>
              <h3 className="text-lg font-semibold text-white">
                Calibration Complete!
              </h3>
              <p className="text-gray-300 text-sm">
                Your 3D motion tracking is now set up and ready to use.
                You can now control objects with full spatial movement.
              </p>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-sm">
                  ✅ 3D Motion Mode is now active
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalibrationModal;
