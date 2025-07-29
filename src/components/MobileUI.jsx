import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Mobile-optimized UI Component
 * Provides touch-friendly interface and responsive design for mobile devices
 */
const MobileUI = ({
  handState,
  onTouchGesture,
  onCalibration,
  onSettings,
  isMobile = false,
  orientation = 'portrait',
  className = ''
}) => {
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Handle touch gesture feedback
   */
  const handleTouchFeedback = (gestureType) => {
    setTouchFeedback(gestureType);
    setTimeout(() => setTouchFeedback(null), 500);
  };

  /**
   * Toggle touch controls visibility
   */
  const toggleTouchControls = () => {
    setShowTouchControls(!showTouchControls);
  };

  /**
   * Handle menu toggle
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className={`mobile-ui mobile-adaptive ${orientation === 'landscape' ? 'landscape-mode' : 'portrait-mode'} ${className}`}>
      {/* Mobile Header */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between p-3">
          {/* App Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">3D</span>
            </div>
            <span className="text-white font-medium text-sm">Hand Pose Game</span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${handState?.isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-300">
              {handState?.isTracking ? 'Tracking' : 'No Hand'}
            </span>
          </div>

          {/* Menu Button */}
          <button
            onClick={toggleMenu}
            className="w-8 h-8 flex items-center justify-center text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Touch Gesture Feedback */}
      <AnimatePresence>
        {touchFeedback && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-blue-500/80 text-white px-6 py-3 rounded-full text-lg font-medium">
              {touchFeedback === 'tap' && '👆 Tap'}
              {touchFeedback === 'pinch_in' && '🤏 Pinch In'}
              {touchFeedback === 'pinch_out' && '👐 Pinch Out'}
              {touchFeedback === 'two_finger_tap' && '✌️ Two Finger Tap'}
              {touchFeedback === 'multi_touch' && '🖐️ Multi Touch'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleMenu}
          >
            <motion.div
              className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-gray-900 border-l border-gray-700"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Menu Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Settings</h3>
                  <button
                    onClick={toggleMenu}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Menu Items */}
                <div className="space-y-4">
                  {/* Touch Controls Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-white">Touch Controls</span>
                    <button
                      onClick={toggleTouchControls}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showTouchControls ? 'bg-blue-500' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        showTouchControls ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>

                  {/* Calibration Button */}
                  <button
                    onClick={() => {
                      onCalibration?.();
                      toggleMenu();
                    }}
                    className="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                  >
                    🎯 Calibrate Hand Tracking
                  </button>

                  {/* Settings Button */}
                  <button
                    onClick={() => {
                      onSettings?.();
                      toggleMenu();
                    }}
                    className="w-full p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    ⚙️ Advanced Settings
                  </button>

                  {/* Hand State Info */}
                  {handState && (
                    <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Hand State</h4>
                      <div className="space-y-1 text-xs text-gray-400">
                        <div>Status: {handState.isTracking ? 'Tracking' : 'Not Tracking'}</div>
                        {handState.confidence && (
                          <div>Confidence: {Math.round(handState.confidence * 100)}%</div>
                        )}
                        {handState.gesture && handState.gesture !== 'NO_HAND' && (
                          <div>Gesture: {handState.gesture.replace('_', ' ')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch Controls Overlay */}
      <AnimatePresence>
        {showTouchControls && (
          <motion.div
            className="fixed bottom-20 left-4 right-4 z-30"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">Touch Gestures</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span>👆</span>
                  <span>Tap to interact</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>🤏</span>
                  <span>Pinch to zoom</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>✌️</span>
                  <span>Two fingers to rotate</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span>🖐️</span>
                  <span>Multi-touch for menu</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex items-center justify-around p-3">
          {/* Touch Controls Toggle */}
          <button
            onClick={toggleTouchControls}
            className={`p-3 rounded-lg transition-colors ${
              showTouchControls ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </button>

          {/* Calibration Button */}
          <button
            onClick={onCalibration}
            className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Hand State Indicator */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mb-1 ${handState?.isTracking ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-400">
              {handState?.confidence ? `${Math.round(handState.confidence * 100)}%` : '--'}
            </span>
          </div>

          {/* Settings Button */}
          <button
            onClick={onSettings}
            className="p-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </motion.div>

      {/* Touch Gesture Handler */}
      <div
        className="fixed inset-0 z-10 touch-none"
        onTouchStart={(e) => {
          const gestureType = e.touches.length === 1 ? 'tap' : 
                            e.touches.length === 2 ? 'two_finger_tap' : 'multi_touch';
          handleTouchFeedback(gestureType);
          onTouchGesture?.(gestureType, e);
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2) {
            // Detect pinch gestures
            // This is a simplified detection - full implementation would track distance changes
            handleTouchFeedback('pinch_in');
          }
          onTouchGesture?.('move', e);
        }}
      />
    </div>
  );
};

export default MobileUI;
