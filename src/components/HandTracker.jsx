import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import Webcam from 'react-webcam';
import WebcamHandOverlay from './WebcamHandOverlay.jsx';

/**
 * Minimalistic hand tracking component with webcam and overlay canvas
 */
const HandTracker = ({
  onHandDetection,
  handState,
  isLoading,
  error,
  className = '',
  width = 640,
  height = 480,
  showHandOverlay = true
}) => {
  const webcamRef = useRef(null);



  /**
   * Handle webcam ready
   */
  const handleWebcamReady = () => {
    if (onHandDetection && webcamRef.current) {
      // Pass the webcam ref object, not the current value
      onHandDetection(webcamRef);
    }
  };



  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="overlay glow-accent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overlay-content">
              <motion.div
                className="spinner w-8 h-8 mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <motion.p
                className="text-accent-400 font-medium"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Loading AI Model...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="overlay glow-error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <div className="overlay-content">
              <motion.p
                className="text-red-400 font-medium"
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.2 }}
              >
                ⚠️ {error}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Webcam Container */}
      <motion.div
        className="relative rounded-lg overflow-hidden border-2 border-accent-500/30 shadow-lg bg-black"
        whileHover={{ borderColor: 'rgba(34, 197, 94, 0.6)' }}
        transition={{ duration: 0.2 }}
      >
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover"
          width={width}
          height={height}
          mirrored={true}
          onUserMedia={handleWebcamReady}
          videoConstraints={{
            width: width,
            height: height,
            facingMode: "user"
          }}
        />

        {/* Hand landmarks overlay */}
        {showHandOverlay && (
          <WebcamHandOverlay
            handState={handState}
            webcamRef={webcamRef}
            className="absolute inset-0 pointer-events-none z-10"
            showLandmarks={true}
            showConnections={true}
            showBoundingBox={true}
            lineColor="#00ff00"
            pointColor="#ff0000"
            confidenceThreshold={0.3}
          />
        )}

        {/* Status indicator */}
        <motion.div
          className="absolute top-2 right-2 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className={`w-3 h-3 rounded-full ${
            error ? 'bg-red-500 glow-error' :
            isLoading ? 'bg-yellow-500 animate-pulse' :
            'bg-accent-500 glow-accent'
          }`} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HandTracker;
