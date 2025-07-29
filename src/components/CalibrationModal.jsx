import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal, Button, Progress, Steps, Typography, Alert, Badge } from 'antd';
import {
  RocketOutlined,
  WarningOutlined,
  CloseOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

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
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎯</span>
          <span style={{ color: '#ffffff' }}>3D Motion Calibration</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      maskClosable={false}
      closeIcon={<CloseOutlined style={{ color: '#9ca3af' }} />}
      styles={{
        mask: { backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)' },
        content: {
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >

        {!isCalibrating ? (
          /* Welcome Screen */
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: 16 }}>🎯</div>
            <Typography.Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
              Set Up 3D Motion Tracking
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#d1d5db', fontSize: '14px', marginBottom: 24 }}>
              Calibration helps the system understand your interaction space.
              You'll be guided through {calibrationSteps.length} simple steps to define
              your comfortable movement boundaries.
            </Typography.Paragraph>

            <Alert
              message="What you'll do:"
              description={
                <ul style={{ margin: 0, paddingLeft: 16, color: '#d1d5db', textAlign: 'left' }}>
                  <li>Move your hand to different positions when prompted</li>
                  <li>Hold steady for 3 seconds at each position</li>
                  <li>Keep your hand visible to the camera</li>
                  <li>Take your time - accuracy is important</li>
                </ul>
              }
              type="info"
              showIcon
              style={{
                marginBottom: 24,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                textAlign: 'left',
              }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                size="large"
                icon={handState?.isTracking ? <RocketOutlined /> : <WarningOutlined />}
                onClick={handleStartCalibration}
                disabled={!handState?.isTracking}
                style={{ flex: 1 }}
              >
                {handState?.isTracking ? 'Start Calibration' : 'Hand Not Detected'}
              </Button>
              <Button
                size="large"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : calibrationStep < calibrationSteps.length ? (
          /* Calibration Steps */
          <div style={{ padding: '24px 0' }}>
            {/* Progress */}
            <div style={{ marginBottom: 24 }}>
              <Progress
                percent={progress}
                strokeColor="#22c55e"
                trailColor="rgba(255, 255, 255, 0.1)"
                showInfo={false}
                style={{ marginBottom: 8 }}
              />
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                Step {calibrationStep + 1} of {calibrationSteps.length}
              </div>
            </div>

            {/* Step Info */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '32px', marginBottom: 12 }}>{currentStep.icon}</div>
              <Typography.Title level={4} style={{ color: '#22c55e', marginBottom: 8 }}>
                {currentStep.title}
              </Typography.Title>
              <Typography.Paragraph style={{ color: '#d1d5db', fontSize: '14px', marginBottom: 8 }}>
                {currentStep.instruction}
              </Typography.Paragraph>
              <Typography.Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                {currentStep.description}
              </Typography.Text>
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
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <motion.div
              style={{ fontSize: '48px', marginBottom: 16 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              🎉
            </motion.div>
            <Typography.Title level={4} style={{ color: '#ffffff', marginBottom: 16 }}>
              Calibration Complete!
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#d1d5db', fontSize: '14px', marginBottom: 24 }}>
              Your 3D motion tracking is now set up and ready to use.
              You can now control objects with full spatial movement.
            </Typography.Paragraph>
            <Alert
              message="3D Motion Mode is now active"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            />
          </div>
        )}
    </Modal>
  );
};

export default CalibrationModal;
